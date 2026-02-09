package com.oxfield.services.adapter.input.rest;

import com.oxfield.services.adapter.output.persistence.*;
import com.oxfield.services.application.port.output.StoragePort;
import com.oxfield.services.application.service.OrderStateMachine;
import com.oxfield.services.domain.entity.*;
import com.oxfield.services.domain.enums.OsStatus;
import com.oxfield.services.shared.exception.BusinessException;
import com.oxfield.services.shared.exception.ErrorCode;
import com.oxfield.services.shared.security.AppTypeGuard.RequiresTechApp;
import com.oxfield.services.shared.security.CurrentUserProvider;
import com.oxfield.services.shared.security.JwtUserDetails;
import com.oxfield.services.shared.security.TechnicianOnboardingGuard.RequiresApprovedTechnician;
import com.oxfield.services.shared.util.GeoUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.locationtech.jts.geom.Point;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Controller para gestão de Ordens de Serviço do técnico.
 * Extraído do TechnicianController para seguir SRP.
 */
@RestController
@RequestMapping("/tech")
@PreAuthorize("hasRole('TECNICO')")
@Tag(name = "Tech Orders", description = "Endpoints para ordens de serviço do técnico")
public class TechOrderController {

    private static final Logger log = LoggerFactory.getLogger(TechOrderController.class);

    private final TechnicianRepository technicianRepository;
    private final ServiceOrderRepository orderRepository;
    private final OrderStateMachine stateMachine;
    private final CurrentUserProvider currentUserProvider;
    private final OrderChecklistRepository checklistRepository;
    private final OrderPhotoRepository photoRepository;
    private final OrderMaterialRepository orderMaterialRepository;
    private final MaterialRepository materialRepository;
    private final StoragePort storagePort;

    public TechOrderController(
            TechnicianRepository technicianRepository,
            ServiceOrderRepository orderRepository,
            OrderStateMachine stateMachine,
            CurrentUserProvider currentUserProvider,
            OrderChecklistRepository checklistRepository,
            OrderPhotoRepository photoRepository,
            OrderMaterialRepository orderMaterialRepository,
            MaterialRepository materialRepository,
            StoragePort storagePort) {
        this.technicianRepository = technicianRepository;
        this.orderRepository = orderRepository;
        this.stateMachine = stateMachine;
        this.currentUserProvider = currentUserProvider;
        this.checklistRepository = checklistRepository;
        this.photoRepository = photoRepository;
        this.orderMaterialRepository = orderMaterialRepository;
        this.materialRepository = materialRepository;
        this.storagePort = storagePort;
    }

    // ==================== Agenda & Listagem ====================

    @GetMapping("/agenda")
    @RequiresTechApp
    @RequiresApprovedTechnician
    @Operation(summary = "Agenda", description = "Lista ordens de serviço agendadas para o dia")
    public ResponseEntity<List<OrderSummaryResponse>> getAgenda(
            @RequestParam(required = false) String date) {
        Technician technician = getCurrentTechnician();
        LocalDate targetDate = date != null ? LocalDate.parse(date) : LocalDate.now();

        List<ServiceOrder> orders = orderRepository.findByTechnicianIdAndScheduledDate(
                technician.getId(), targetDate);

        log.info("Agenda: technicianId={}, date={}, count={}", technician.getId(), targetDate, orders.size());

        List<OrderSummaryResponse> response = orders.stream()
                .map(this::toOrderSummary)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/orders/today")
    @RequiresTechApp
    @RequiresApprovedTechnician
    @Operation(summary = "OS do Dia", description = "Lista ordens de serviço agendadas para hoje")
    public ResponseEntity<List<OrderSummaryResponse>> getTodayOrders() {
        Technician technician = getCurrentTechnician();

        List<ServiceOrder> orders = orderRepository.findByTechnicianIdAndScheduledDate(
                technician.getId(), LocalDate.now());

        return ResponseEntity.ok(orders.stream()
                .map(this::toOrderSummary)
                .collect(Collectors.toList()));
    }

    @GetMapping("/orders/{orderId}")
    @RequiresTechApp
    @RequiresApprovedTechnician
    @Operation(summary = "Detalhes OS", description = "Retorna detalhes completos de uma OS")
    public ResponseEntity<OrderDetailResponse> getOrderDetails(@PathVariable UUID orderId) {
        ServiceOrder order = getOrder(orderId);
        validateOwnership(order);
        return ResponseEntity.ok(toOrderDetail(order));
    }

    @GetMapping("/history")
    @RequiresTechApp
    @RequiresApprovedTechnician
    @Operation(summary = "Histórico", description = "Retorna histórico de OS completadas")
    public ResponseEntity<HistoryResponse> getHistory(
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int limit,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        try {
            Technician technician = getCurrentTechnician();

            int safeLimit = limit <= 0 ? 20 : Math.min(limit, 100);
            int safePage = page < 0 ? 0 : page;
            Pageable pageable = PageRequest.of(safePage, safeLimit);
            LocalDate start = parseDateOrNull(startDate);
            LocalDate end = parseDateOrDefault(endDate, LocalDate.now());

            Page<ServiceOrder> ordersPage;
            if (start != null) {
                ordersPage = orderRepository.findByTechnicianIdAndStatusInAndScheduledDateBetween(
                        technician.getId(),
                        List.of(OsStatus.COMPLETED, OsStatus.CANCELLED),
                        start, end, pageable);
            } else {
                ordersPage = orderRepository.findByTechnicianIdAndStatusIn(
                        technician.getId(),
                        List.of(OsStatus.COMPLETED, OsStatus.CANCELLED),
                        pageable);
            }

            List<OrderSummaryResponse> orderResponses = ordersPage.getContent().stream()
                    .map(this::toOrderSummary)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(new HistoryResponse(orderResponses, ordersPage.getTotalElements()));
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error loading tech history: page={}, limit={}", page, limit, e);
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Erro ao carregar histórico.");
        }
    }

    // ==================== Transições de Estado ====================

    @PostMapping("/orders/{orderId}/start-route")
    @RequiresTechApp
    @RequiresApprovedTechnician
    @Operation(summary = "Iniciar Rota", description = "Marca início da rota para o cliente")
    public ResponseEntity<OrderDetailResponse> startRoute(@PathVariable UUID orderId) {
        Technician technician = getCurrentTechnician();
        stateMachine.startRoute(orderId, technician.getId());
        ServiceOrder order = getOrder(orderId);
        return ResponseEntity.ok(toOrderDetail(order));
    }

    @PostMapping("/orders/{orderId}/arrive")
    @RequiresTechApp
    @RequiresApprovedTechnician
    @Operation(summary = "Chegar", description = "Marca chegada no local do cliente")
    public ResponseEntity<OrderDetailResponse> arrive(
            @PathVariable UUID orderId,
            @RequestParam double latitude,
            @RequestParam double longitude) {
        Technician technician = getCurrentTechnician();
        Point location = GeoUtils.createPoint(latitude, longitude);

        ServiceOrder order = stateMachine.arrive(orderId, technician.getId(), location);
        return ResponseEntity.ok(toOrderDetail(order));
    }

    @PostMapping("/orders/{orderId}/complete")
    @RequiresTechApp
    @RequiresApprovedTechnician
    @Operation(summary = "Completar", description = "Finaliza a OS")
    public ResponseEntity<OrderDetailResponse> complete(@PathVariable UUID orderId) {
        Technician technician = getCurrentTechnician();
        stateMachine.complete(orderId, technician.getId());
        ServiceOrder order = getOrder(orderId);
        return ResponseEntity.ok(toOrderDetail(order));
    }

    // ==================== Checklist ====================

    @GetMapping("/orders/{orderId}/checklist")
    @RequiresTechApp
    @RequiresApprovedTechnician
    @Operation(summary = "Get Checklist", description = "Retorna checklist da OS")
    public ResponseEntity<ChecklistResponse> getChecklist(@PathVariable UUID orderId) {
        ServiceOrder order = getOrder(orderId);
        validateOwnership(order);

        OrderChecklist checklist = checklistRepository.findByOrderId(orderId)
                .orElseGet(() -> createDefaultChecklist(order));

        List<Map<String, Object>> items = checklist.getItems() != null ? checklist.getItems() : Collections.emptyList();
        return ResponseEntity.ok(new ChecklistResponse(
                items.stream()
                        .map(this::mapChecklistItemToResponse)
                        .collect(Collectors.toList())));
    }

    @PutMapping("/orders/{orderId}/checklist")
    @RequiresTechApp
    @RequiresApprovedTechnician
    @Operation(summary = "Update Checklist", description = "Atualiza checklist da OS")
    public ResponseEntity<ChecklistResponse> updateChecklist(
            @PathVariable UUID orderId,
            @RequestBody UpdateChecklistRequest request) {
        ServiceOrder order = getOrder(orderId);
        validateOwnership(order);

        OrderChecklist checklist = checklistRepository.findByOrderId(orderId)
                .orElseGet(() -> createDefaultChecklist(order));

        List<Map<String, Object>> items = request.items().stream()
                .map(item -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", item.id());
                    map.put("description", item.description());
                    map.put("done", item.completed());
                    map.put("required", item.required());
                    return map;
                })
                .collect(Collectors.toList());

        checklist.setItems(items);
        checklist = checklistRepository.save(checklist);

        List<Map<String, Object>> savedItems = checklist.getItems() != null ? checklist.getItems()
                : Collections.emptyList();
        return ResponseEntity.ok(new ChecklistResponse(
                savedItems.stream()
                        .map(this::mapChecklistItemToResponse)
                        .collect(Collectors.toList())));
    }

    // ==================== Fotos ====================

    @GetMapping("/orders/{orderId}/photos")
    @RequiresTechApp
    @RequiresApprovedTechnician
    @Operation(summary = "Get Photos", description = "Lista fotos da OS")
    public ResponseEntity<List<PhotoResponse>> getPhotos(@PathVariable UUID orderId) {
        ServiceOrder order = getOrder(orderId);
        validateOwnership(order);

        List<OrderPhoto> photos = photoRepository.findByOrderId(orderId);

        return ResponseEntity.ok(photos.stream()
                .map(p -> new PhotoResponse(
                        p.getId(),
                        p.getFileUrl(),
                        p.getCaption(),
                        p.getTakenAt() != null ? p.getTakenAt().toString() : null))
                .collect(Collectors.toList()));
    }

    @PostMapping("/orders/{orderId}/photos")
    @RequiresTechApp
    @RequiresApprovedTechnician
    @Operation(summary = "Upload Photo", description = "Faz upload de foto para a OS")
    public ResponseEntity<PhotoResponse> uploadPhoto(
            @PathVariable UUID orderId,
            @RequestParam(required = false) MultipartFile photo,
            @RequestParam(required = false) String photoBase64,
            @RequestParam(required = false) String caption,
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude) {
        ServiceOrder order = getOrder(orderId);
        validateOwnership(order);

        JwtUserDetails user = currentUserProvider.requireCurrentUser();
        UUID tenantId = user.getTenantId();

        byte[] imageData;
        String fileName;
        String contentType = "image/jpeg";

        try {
            if (photo != null && !photo.isEmpty()) {
                imageData = photo.getBytes();
                fileName = UUID.randomUUID() + "_" + photo.getOriginalFilename();
                contentType = photo.getContentType();
            } else if (photoBase64 != null && !photoBase64.isEmpty()) {
                String base64Data = photoBase64.contains(",") ? photoBase64.split(",")[1] : photoBase64;
                imageData = Base64.getDecoder().decode(base64Data);
                fileName = UUID.randomUUID() + ".jpg";
            } else {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Foto é obrigatória");
            }
        } catch (java.io.IOException e) {
            throw new BusinessException(ErrorCode.STORAGE_UPLOAD_FAILED, "Erro ao processar foto: " + e.getMessage());
        }

        StoragePort.UploadResult upload = storagePort.upload(new StoragePort.UploadRequest(
                tenantId, "orders/" + orderId + "/photos", fileName, imageData, contentType));

        OrderPhoto orderPhoto = new OrderPhoto(upload.fileUrl(), caption);
        orderPhoto.setOrder(order);
        orderPhoto.setTenantId(tenantId);

        if (latitude != null && longitude != null) {
            orderPhoto.setLocation(GeoUtils.createPoint(latitude, longitude));
        }

        orderPhoto = photoRepository.save(orderPhoto);

        return ResponseEntity.ok(new PhotoResponse(
                orderPhoto.getId(),
                orderPhoto.getFileUrl(),
                orderPhoto.getCaption(),
                orderPhoto.getTakenAt() != null ? orderPhoto.getTakenAt().toString() : null));
    }

    // ==================== Assinatura ====================

    @PostMapping("/orders/{orderId}/signature")
    @RequiresTechApp
    @RequiresApprovedTechnician
    @Operation(summary = "Submit Signature", description = "Salva assinatura digital do cliente")
    public ResponseEntity<Void> submitSignature(
            @PathVariable UUID orderId,
            @RequestBody SignatureRequest request) {
        ServiceOrder order = getOrder(orderId);
        validateOwnership(order);

        if (order.getStatus() != OsStatus.IN_PROGRESS && order.getStatus() != OsStatus.COMPLETED) {
            throw new BusinessException(ErrorCode.ORDER_INVALID_TRANSITION,
                    "Assinatura só pode ser coletada quando a OS está em progresso");
        }

        order.setSignature(request.signature());
        orderRepository.save(order);

        return ResponseEntity.ok().build();
    }

    // ==================== Helpers ====================

    private Technician getCurrentTechnician() {
        JwtUserDetails user = currentUserProvider.requireCurrentUser();
        return technicianRepository.findByUserId(user.getUserId())
                .orElseThrow(() -> new BusinessException(ErrorCode.TECH_NOT_FOUND, "Perfil de técnico não encontrado"));
    }

    private ServiceOrder getOrder(UUID orderId) {
        return orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND, "OS não encontrada"));
    }

    private void validateOwnership(ServiceOrder order) {
        Technician technician = getCurrentTechnician();
        if (!technician.getId().equals(order.getTechnicianId())) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED, "Esta OS não está atribuída a você");
        }
    }

    private static LocalDate parseDateOrNull(String value) {
        if (value == null || value.isBlank())
            return null;
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    private static LocalDate parseDateOrDefault(String value, LocalDate defaultDate) {
        if (value == null || value.isBlank())
            return defaultDate;
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException e) {
            return defaultDate;
        }
    }

    private OrderSummaryResponse toOrderSummary(ServiceOrder order) {
        String customerName = "Cliente";
        String customerPhone = "";
        if (order.getCustomer() != null && order.getCustomer().getUser() != null) {
            try {
                customerName = order.getCustomer().getUser().getName() != null
                        ? order.getCustomer().getUser().getName()
                        : "Cliente";
                customerPhone = order.getCustomer().getUser().getPhone() != null
                        ? order.getCustomer().getUser().getPhone()
                        : "";
            } catch (Exception e) {
                log.debug("Could not get customer info for order {}", order.getId());
            }
        }

        String address = order.getAddress() != null ? safeFullAddress(order.getAddress()) : "";
        String categoryCode = order.getCategory() != null ? order.getCategory().getCode() : "GENERAL";
        String statusValue = order.getStatus() != null ? order.getStatus().getValue() : "scheduled";
        String priorityValue = order.getPriority() != null ? order.getPriority().getValue() : "medium";

        return new OrderSummaryResponse(
                order.getId(),
                order.getOsNumber() != null ? order.getOsNumber() : "",
                order.getTitle() != null ? order.getTitle() : "",
                categoryCode,
                statusValue,
                priorityValue,
                order.getScheduledDate() != null ? order.getScheduledDate().toString() : null,
                order.getScheduledStart() != null ? order.getScheduledStart().toString() : null,
                order.getScheduledDuration() != null ? order.getScheduledDuration() : 0,
                address,
                customerName,
                customerPhone,
                order.getAddress() != null ? safeLatitude(order.getAddress()) : null,
                order.getAddress() != null ? safeLongitude(order.getAddress()) : null,
                order.getActualStart() != null ? order.getActualStart().toString() : null,
                order.getActualEnd() != null ? order.getActualEnd().toString() : null);
    }

    private OrderDetailResponse toOrderDetail(ServiceOrder order) {
        String categoryCode = order.getCategory() != null ? order.getCategory().getCode() : "GENERAL";
        String statusValue = order.getStatus() != null ? order.getStatus().getValue() : "scheduled";
        String priorityValue = order.getPriority() != null ? order.getPriority().getValue() : "medium";

        // Fetch checklist from repository to avoid LazyInitializationException
        int checklistProgress = checklistRepository.findByOrderId(order.getId())
                .map(OrderChecklist::getCompletionPercentage)
                .orElse(100);

        // Check for after photo using repository to avoid LazyInitializationException
        boolean hasAfterPhoto = photoRepository.findByOrderId(order.getId()).stream()
                .anyMatch(p -> p.getCaption() != null && p.getCaption().toUpperCase().contains("AFTER"));

        return new OrderDetailResponse(
                order.getId(),
                order.getOsNumber() != null ? order.getOsNumber() : "",
                order.getTitle() != null ? order.getTitle() : "",
                order.getDescription(),
                categoryCode,
                statusValue,
                priorityValue,
                order.getScheduledDate() != null ? order.getScheduledDate().toString() : null,
                order.getScheduledStart() != null ? order.getScheduledStart().toString() : null,
                order.getScheduledDuration() != null ? order.getScheduledDuration() : 0,
                order.getEstimatedPrice(),
                order.getFinalPrice(),
                order.getAddress() != null ? new AddressResponse(
                        order.getAddress().getLabel(),
                        order.getAddress().getStreet(),
                        order.getAddress().getCity(),
                        order.getAddress().getLocation() != null
                                ? GeoUtils.getLatitude(order.getAddress().getLocation())
                                : null,
                        order.getAddress().getLocation() != null
                                ? GeoUtils.getLongitude(order.getAddress().getLocation())
                                : null)
                        : null,
                checklistProgress,
                hasAfterPhoto,
                order.hasSignature());
    }

    private static String safeFullAddress(CustomerAddress address) {
        if (address == null)
            return null;
        try {
            return address.getFullAddress();
        } catch (Exception e) {
            return "";
        }
    }

    private static Double safeLatitude(CustomerAddress address) {
        if (address == null)
            return null;
        try {
            Point loc = address.getLocation();
            return loc != null ? GeoUtils.getLatitude(loc) : null;
        } catch (Exception e) {
            return null;
        }
    }

    private static Double safeLongitude(CustomerAddress address) {
        if (address == null)
            return null;
        try {
            Point loc = address.getLocation();
            return loc != null ? GeoUtils.getLongitude(loc) : null;
        } catch (Exception e) {
            return null;
        }
    }

    private OrderChecklist createDefaultChecklist(ServiceOrder order) {
        List<Map<String, Object>> defaultItems = createDefaultChecklistItems(order.getCategory());
        OrderChecklist checklist = new OrderChecklist(order, defaultItems);
        checklist.setTenantId(order.getTenantId());
        return checklistRepository.save(checklist);
    }

    private List<Map<String, Object>> createDefaultChecklistItems(ServiceCategory category) {
        List<Map<String, Object>> items = new ArrayList<>();
        items.add(createChecklistItem(1, "Verificar equipamento", false, true));
        items.add(createChecklistItem(2, "Testar funcionamento", false, true));
        items.add(createChecklistItem(3, "Limpar área de trabalho", false, false));
        items.add(createChecklistItem(4, "Instruir cliente", false, true));
        return items;
    }

    private Map<String, Object> createChecklistItem(int id, String description, boolean done, boolean required) {
        Map<String, Object> item = new HashMap<>();
        item.put("id", id);
        item.put("description", description);
        item.put("done", done);
        item.put("required", required);
        return item;
    }

    private ChecklistItemResponse mapChecklistItemToResponse(Map<String, Object> item) {
        int id = parseChecklistItemId(item.get("id"));
        String desc = item.get("description") != null ? item.get("description").toString()
                : (item.get("text") != null ? item.get("text").toString() : "");
        boolean done = toBoolean(item.get("done"), false);
        boolean required = toBoolean(item.get("required"), false);
        return new ChecklistItemResponse(id, desc, done, required);
    }

    private int parseChecklistItemId(Object idObj) {
        if (idObj == null)
            return 0;
        if (idObj instanceof Number)
            return ((Number) idObj).intValue();
        try {
            return Integer.parseInt(idObj.toString());
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private boolean toBoolean(Object value, boolean defaultValue) {
        if (value == null)
            return defaultValue;
        if (value instanceof Boolean)
            return (Boolean) value;
        return "true".equalsIgnoreCase(value.toString());
    }

    // ==================== DTOs ====================

    public record OrderSummaryResponse(
            UUID id,
            String osNumber,
            String title,
            String category,
            String status,
            String priority,
            String scheduledDate,
            String scheduledStart,
            int durationMinutes,
            String address,
            String customerName,
            String customerPhone,
            Double addressLatitude,
            Double addressLongitude,
            String actualStartTime,
            String actualEndTime) {
    }

    public record OrderDetailResponse(
            UUID id,
            String osNumber,
            String title,
            String description,
            String category,
            String status,
            String priority,
            String scheduledDate,
            String scheduledStart,
            int durationMinutes,
            BigDecimal estimatedPrice,
            BigDecimal finalPrice,
            AddressResponse address,
            int checklistProgress,
            boolean hasAfterPhoto,
            boolean hasSignature) {
    }

    public record AddressResponse(
            String label,
            String street,
            String city,
            Double latitude,
            Double longitude) {
    }

    public record ChecklistResponse(List<ChecklistItemResponse> items) {
    }

    public record ChecklistItemResponse(int id, String description, boolean completed, boolean required) {
    }

    public record UpdateChecklistRequest(List<ChecklistItemRequest> items) {
    }

    public record ChecklistItemRequest(int id, String description, boolean completed, boolean required) {
    }

    public record PhotoResponse(UUID id, String fileUrl, String caption, String takenAt) {
    }

    public record SignatureRequest(String signature) {
    }

    public record HistoryResponse(List<OrderSummaryResponse> orders, long total) {
    }
}
