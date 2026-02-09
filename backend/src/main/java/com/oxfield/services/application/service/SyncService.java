package com.oxfield.services.application.service;

import com.oxfield.services.adapter.input.dto.request.SyncBatchRequest;
import com.oxfield.services.adapter.input.dto.request.SyncBatchRequest.SyncAction;
import com.oxfield.services.adapter.input.dto.request.SyncBatchRequest.SyncActionType;
import com.oxfield.services.adapter.input.dto.response.SyncBatchResponse;
import com.oxfield.services.adapter.input.dto.response.SyncBatchResponse.SyncActionResult;
import com.oxfield.services.adapter.input.dto.response.SyncBatchResponse.SyncStatus;
import com.oxfield.services.adapter.output.persistence.*;
import com.oxfield.services.application.port.output.StoragePort;
import com.oxfield.services.domain.entity.*;
import com.oxfield.services.domain.enums.OsStatus;
import com.oxfield.services.shared.exception.BusinessException;
import com.oxfield.services.shared.exception.ErrorCode;
import com.oxfield.services.shared.util.GeoUtils;
import org.locationtech.jts.geom.Point;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Serviço de sincronização para o app mobile (Offline First).
 * 
 * Processa batch de ações em transações isoladas usando REQUIRES_NEW
 * para garantir que erro em uma ação não invalide as outras.
 */
@Service
public class SyncService {

    private static final Logger log = LoggerFactory.getLogger(SyncService.class);

    private final ServiceOrderRepository orderRepository;
    private final OrderPhotoRepository photoRepository;
    private final OrderChecklistRepository checklistRepository;
    private final TechnicianRepository technicianRepository;
    private final MaterialRepository materialRepository;
    private final OrderStateMachine stateMachine;
    private final StoragePort storagePort;

    public SyncService(
            ServiceOrderRepository orderRepository,
            OrderPhotoRepository photoRepository,
            OrderChecklistRepository checklistRepository,
            TechnicianRepository technicianRepository,
            MaterialRepository materialRepository,
            OrderStateMachine stateMachine,
            StoragePort storagePort) {
        this.orderRepository = orderRepository;
        this.photoRepository = photoRepository;
        this.checklistRepository = checklistRepository;
        this.technicianRepository = technicianRepository;
        this.materialRepository = materialRepository;
        this.stateMachine = stateMachine;
        this.storagePort = storagePort;
    }

    /**
     * Processa um batch de ações de sincronização.
     * Cada ação é processada em sua própria transação.
     */
    public SyncBatchResponse processBatch(SyncBatchRequest request, UUID technicianId, UUID tenantId) {
        log.info("Processing sync batch with {} actions for technician {}",
                request.actions().size(), technicianId);

        // Ordenar por timestamp (mais antigas primeiro)
        List<SyncAction> sortedActions = request.actions().stream()
                .sorted(Comparator.comparing(SyncAction::timestamp))
                .collect(Collectors.toList());

        // Processar cada ação
        List<SyncActionResult> results = new ArrayList<>();
        for (SyncAction action : sortedActions) {
            SyncActionResult result = processAction(action, technicianId, tenantId);
            results.add(result);
        }

        SyncBatchResponse response = SyncBatchResponse.of(results);
        log.info("Sync batch completed: {}/{} successful",
                response.successCount(), response.totalActions());

        return response;
    }

    /**
     * Processa uma ação individual em transação isolada.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public SyncActionResult processAction(SyncAction action, UUID technicianId, UUID tenantId) {
        log.debug("Processing action: {} for order {}", action.type(), action.orderId());

        try {
            UUID serverId = switch (action.type()) {
                case UPDATE_STATUS -> processStatusUpdate(action, technicianId);
                case ADD_PHOTO -> processAddPhoto(action, tenantId);
                case UPDATE_CHECKLIST -> processChecklistUpdate(action);
                case ADD_SIGNATURE -> throw new BusinessException(
                        ErrorCode.SYNC_UNKNOWN_ACTION, "Signature collection is no longer supported");
                case UPDATE_LOCATION -> processLocationUpdate(action, technicianId);
                case ADD_MATERIAL -> processAddMaterial(action);
                case ADD_MESSAGE -> processAddMessage(action);
            };

            return new SyncActionResult(
                    action.clientId(),
                    serverId,
                    SyncStatus.SUCCESS,
                    null,
                    null);

        } catch (BusinessException e) {
            log.warn("Business error processing action {}: {}", action.clientId(), e.getMessage());
            return new SyncActionResult(
                    action.clientId(),
                    null,
                    SyncStatus.FAILED,
                    e.getErrorCode().getCode(),
                    e.getMessage());

        } catch (Exception e) {
            log.error("Error processing action {}: {}", action.clientId(), e.getMessage(), e);
            return new SyncActionResult(
                    action.clientId(),
                    null,
                    SyncStatus.FAILED,
                    ErrorCode.SYNC_INVALID_PAYLOAD.getCode(),
                    e.getMessage());
        }
    }

    // ========== Action Processors ==========

    private UUID processStatusUpdate(SyncAction action, UUID technicianId) {
        String newStatus = (String) action.payload().get("status");
        OsStatus targetStatus = OsStatus.fromValue(newStatus);

        Point location = extractLocation(action.payload());

        ServiceOrder order = switch (targetStatus) {
            case IN_ROUTE -> stateMachine.startRoute(action.orderId(), technicianId);
            case IN_PROGRESS -> stateMachine.arrive(action.orderId(), technicianId, location);
            case COMPLETED -> stateMachine.complete(action.orderId(), technicianId);
            case CANCELLED -> stateMachine.cancel(action.orderId(),
                    (String) action.payload().getOrDefault("reason", "Cancelado pelo técnico"));
            default -> throw new BusinessException(
                    ErrorCode.ORDER_INVALID_TRANSITION,
                    "Transição para " + targetStatus + " não suportada via sync");
        };

        return order.getId();
    }

    private UUID processAddPhoto(SyncAction action, UUID tenantId) {
        String base64Data = (String) action.payload().get("data");
        String caption = (String) action.payload().get("caption");
        String fileName = (String) action.payload().getOrDefault("fileName",
                UUID.randomUUID() + ".jpg");

        // Upload para S3
        byte[] imageData = Base64.getDecoder().decode(base64Data);
        StoragePort.UploadResult upload = storagePort.upload(new StoragePort.UploadRequest(
                tenantId,
                "orders/" + action.orderId() + "/photos",
                fileName,
                imageData,
                "image/jpeg"));

        // Criar registro
        OrderPhoto photo = new OrderPhoto(upload.fileUrl(), caption);

        ServiceOrder order = orderRepository.findById(action.orderId())
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND, "OS não encontrada"));

        photo.setOrder(order);
        photo.setTenantId(tenantId);

        Point location = extractLocation(action.payload());
        if (location != null) {
            photo.setLocation(location);
        }

        photo = photoRepository.save(photo);
        return photo.getId();
    }

    private UUID processChecklistUpdate(SyncAction action) {
        Integer itemId = (Integer) action.payload().get("itemId");
        Boolean done = (Boolean) action.payload().get("done");

        OrderChecklist checklist = checklistRepository.findByOrderId(action.orderId())
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.ORDER_NOT_FOUND, "Checklist não encontrado"));

        if (Boolean.TRUE.equals(done)) {
            checklist.markItemComplete(itemId);
        }

        checklist = checklistRepository.save(checklist);
        return checklist.getId();
    }

    private UUID processLocationUpdate(SyncAction action, UUID technicianId) {
        Point location = extractLocation(action.payload());
        if (location == null) {
            throw new BusinessException(
                    ErrorCode.SYNC_INVALID_PAYLOAD, "Localização não fornecida");
        }

        Technician technician = technicianRepository.findById(technicianId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.TECH_NOT_FOUND, "Técnico não encontrado"));

        technician.updateLocation(location);
        technicianRepository.save(technician);

        return technician.getId();
    }

    private UUID processAddMaterial(SyncAction action) {
        UUID materialId = UUID.fromString((String) action.payload().get("materialId"));
        Integer quantity = (Integer) action.payload().get("quantity");

        Material material = materialRepository.findById(materialId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.RESOURCE_NOT_FOUND, "Material não encontrado"));

        ServiceOrder order = orderRepository.findById(action.orderId())
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND, "OS não encontrada"));

        OrderMaterial orderMaterial = new OrderMaterial(material, quantity);
        order.addMaterial(orderMaterial);
        orderRepository.save(order);

        // Reduzir estoque
        material.reduceStock(quantity);
        materialRepository.save(material);

        return orderMaterial.getId();
    }

    private UUID processAddMessage(SyncAction action) {
        // TODO: Implementar quando OrderMessage service estiver pronto
        throw new BusinessException(
                ErrorCode.SYNC_UNKNOWN_ACTION, "Ação ADD_MESSAGE ainda não implementada");
    }

    // ========== Helpers ==========

    private Point extractLocation(Map<String, Object> payload) {
        Object latObj = payload.get("latitude");
        Object lngObj = payload.get("longitude");

        if (latObj != null && lngObj != null) {
            double lat = ((Number) latObj).doubleValue();
            double lng = ((Number) lngObj).doubleValue();
            return GeoUtils.createPoint(lat, lng);
        }
        return null;
    }
}
