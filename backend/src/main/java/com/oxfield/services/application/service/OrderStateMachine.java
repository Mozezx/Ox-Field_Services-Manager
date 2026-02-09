package com.oxfield.services.application.service;

import com.oxfield.services.adapter.output.persistence.ServiceOrderRepository;
import com.oxfield.services.domain.entity.OrderChecklist;
import com.oxfield.services.domain.entity.ServiceOrder;
import com.oxfield.services.domain.entity.Technician;
import com.oxfield.services.domain.enums.OsStatus;
import com.oxfield.services.domain.event.OrderCompletedEvent;
import com.oxfield.services.domain.event.OrderStatusChangedEvent;
import com.oxfield.services.shared.exception.BusinessException;
import com.oxfield.services.shared.exception.ErrorCode;
import com.oxfield.services.shared.util.GeoUtils;
import org.locationtech.jts.geom.Point;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * State Machine para transições de status da OS.
 * 
 * Implementa travas de segurança:
 * - ARRIVED (IN_PROGRESS): Valida GPS < 200m do endereço
 * - COMPLETED: Valida checklist 100%, foto AFTER, assinatura
 */
@Service
public class OrderStateMachine {

    private static final Logger log = LoggerFactory.getLogger(OrderStateMachine.class);

    // Raio de chegada em metros
    @Value("${oxfield.arrival-radius-meters:200}")
    private double arrivalRadiusMeters;

    private final ServiceOrderRepository orderRepository;
    private final PricingEngineService pricingEngine;
    private final ApplicationEventPublisher eventPublisher;

    public OrderStateMachine(
            ServiceOrderRepository orderRepository,
            PricingEngineService pricingEngine,
            ApplicationEventPublisher eventPublisher) {
        this.orderRepository = orderRepository;
        this.pricingEngine = pricingEngine;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Técnico inicia rota para o cliente.
     * Idempotente: se a OS já está IN_ROUTE, retorna a ordem sem alterar estado (evita 422 em duplo clique).
     */
    @Transactional
    public ServiceOrder startRoute(UUID orderId, UUID technicianId) {
        ServiceOrder order = getOrderById(orderId);

        validateTechnicianOwnership(order, technicianId);

        if (order.getStatus() == OsStatus.IN_ROUTE) {
            log.debug("Order {} already IN_ROUTE, returning as-is", order.getOsNumber());
            return order;
        }

        validateTransition(order, OsStatus.IN_ROUTE);

        OsStatus previousStatus = order.getStatus();
        order.startRoute();
        order = orderRepository.save(order);

        publishStatusChange(order, previousStatus, OsStatus.IN_ROUTE);
        log.info("Order {} transitioned to IN_ROUTE", order.getOsNumber());

        return order;
    }

    /**
     * Técnico chegou no local.
     * VALIDAÇÃO: GPS deve estar a menos de 200m do endereço.
     */
    @Transactional
    public ServiceOrder arrive(UUID orderId, UUID technicianId, Point technicianLocation) {
        ServiceOrder order = getOrderById(orderId);

        validateTechnicianOwnership(order, technicianId);
        validateTransition(order, OsStatus.IN_PROGRESS);

        // VALIDAÇÃO GPS
        validateArrivalLocation(order, technicianLocation);

        OsStatus previousStatus = order.getStatus();
        order.arrive();
        order = orderRepository.save(order);

        publishStatusChange(order, previousStatus, OsStatus.IN_PROGRESS);
        log.info("Order {} transitioned to IN_PROGRESS (arrival validated)", order.getOsNumber());

        return order;
    }

    /**
     * Técnico completa a OS.
     * VALIDAÇÕES:
     * - Checklist 100% preenchido
     * - Pelo menos uma foto AFTER
     * - Assinatura digital presente
     */
    @Transactional
    public ServiceOrder complete(UUID orderId, UUID technicianId) {
        ServiceOrder order = getOrderById(orderId);

        validateTechnicianOwnership(order, technicianId);
        validateTransition(order, OsStatus.COMPLETED);

        // VALIDAÇÕES DE CONCLUSÃO
        validateChecklistComplete(order);
        validateAfterPhoto(order);
        validateSignature(order);

        OsStatus previousStatus = order.getStatus();
        order.complete();

        // Calcular preço final
        PricingEngineService.PriceFinal finalPrice = pricingEngine.calculateFinal(order);
        order.setFinalPrice(finalPrice.total());

        order = orderRepository.save(order);

        // Publicar evento de conclusão
        publishCompletionEvent(order);
        publishStatusChange(order, previousStatus, OsStatus.COMPLETED);

        log.info("Order {} COMPLETED with final price: {}",
                order.getOsNumber(), order.getFinalPrice());

        return order;
    }

    /**
     * Cancela a OS.
     */
    @Transactional
    public ServiceOrder cancel(UUID orderId, String reason) {
        ServiceOrder order = getOrderById(orderId);

        if (order.getStatus().isFinal()) {
            throw new BusinessException(
                    ErrorCode.ORDER_INVALID_TRANSITION,
                    "Não é possível cancelar uma OS que já está em estado final");
        }

        OsStatus previousStatus = order.getStatus();
        order.cancel();
        order = orderRepository.save(order);

        publishStatusChange(order, previousStatus, OsStatus.CANCELLED);
        log.info("Order {} CANCELLED. Reason: {}", order.getOsNumber(), reason);

        return order;
    }

    // ========== Validações ==========

    private ServiceOrder getOrderById(UUID orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.ORDER_NOT_FOUND,
                        "Ordem de serviço não encontrada"));
    }

    private void validateTechnicianOwnership(ServiceOrder order, UUID technicianId) {
        if (order.getTechnicianId() == null || !order.getTechnicianId().equals(technicianId)) {
            throw new BusinessException(
                    ErrorCode.ACCESS_DENIED,
                    "Esta OS não está atribuída a você");
        }
    }

    private void validateTransition(ServiceOrder order, OsStatus targetStatus) {
        if (!order.getStatus().canTransitionTo(targetStatus)) {
            throw new BusinessException(
                    ErrorCode.ORDER_INVALID_TRANSITION,
                    String.format(
                            "Transição inválida: %s -> %s",
                            order.getStatus(), targetStatus));
        }
    }

    /**
     * Valida que o técnico está dentro do raio de chegada (200m)
     */
    private void validateArrivalLocation(ServiceOrder order, Point technicianLocation) {
        if (technicianLocation == null) {
            throw new BusinessException(
                    ErrorCode.TECH_NOT_AT_LOCATION,
                    "Localização do técnico não disponível");
        }

        if (order.getAddress() == null) {
            log.warn("Order {} has no address, skipping GPS validation", order.getOsNumber());
            return;
        }

        Point customerLocation = order.getAddress().getLocation();
        if (customerLocation == null) {
            log.warn("Customer location not set for order {}, skipping GPS validation",
                    order.getOsNumber());
            return;
        }

        double distanceMeters = GeoUtils.distanceInMeters(technicianLocation, customerLocation);

        if (distanceMeters > arrivalRadiusMeters) {
            throw new BusinessException(
                    ErrorCode.TECH_NOT_AT_LOCATION,
                    String.format(
                            "Você está a %.0f metros do endereço. Aproxime-se até %.0f metros para marcar chegada.",
                            distanceMeters, arrivalRadiusMeters))
                    .addDetail("distanceMeters", distanceMeters)
                    .addDetail("requiredRadius", arrivalRadiusMeters);
        }

        log.debug("Arrival validated: {} meters from customer (radius: {})",
                distanceMeters, arrivalRadiusMeters);
    }

    /**
     * Valida que o checklist está 100% completo
     */
    private void validateChecklistComplete(ServiceOrder order) {
        OrderChecklist checklist = order.getChecklist();

        if (checklist != null && !checklist.isAllCompleted()) {
            int completed = checklist.getCompletedCount();
            int total = checklist.getTotalCount();

            throw new BusinessException(
                    ErrorCode.ORDER_CHECKLIST_INCOMPLETE,
                    String.format(
                            "Checklist incompleto: %d/%d itens preenchidos",
                            completed, total))
                    .addDetail("completed", completed)
                    .addDetail("total", total)
                    .addDetail("percentage", checklist.getCompletionPercentage());
        }
    }

    /**
     * Valida que existe pelo menos uma foto com caption "AFTER"
     */
    private void validateAfterPhoto(ServiceOrder order) {
        boolean hasAfterPhoto = order.hasAfterPhoto();

        if (!hasAfterPhoto) {
            throw new BusinessException(
                    ErrorCode.ORDER_MISSING_PHOTO,
                    "É obrigatório anexar pelo menos uma foto 'AFTER' mostrando o serviço concluído");
        }
    }

    /**
     * Valida que existe assinatura do cliente
     */
    private void validateSignature(ServiceOrder order) {
        if (order.getSignature() == null) {
            throw new BusinessException(
                    ErrorCode.ORDER_MISSING_SIGNATURE,
                    "É obrigatório coletar a assinatura digital do cliente");
        }
    }

    // ========== Eventos ==========

    private void publishStatusChange(ServiceOrder order, OsStatus previous, OsStatus current) {
        OrderStatusChangedEvent event = new OrderStatusChangedEvent(
                order.getId(),
                order.getOsNumber(),
                previous,
                current,
                order.getTechnicianId(),
                order.getCustomerId(),
                order.getCustomer() != null ? order.getCustomer().getUserId() : null);
        eventPublisher.publishEvent(event);
    }

    private void publishCompletionEvent(ServiceOrder order) {
        OrderCompletedEvent event = new OrderCompletedEvent(
                order.getId(),
                order.getOsNumber(),
                order.getTechnicianId(),
                order.getTechnician() != null ? order.getTechnician().getUserId() : null,
                order.getCustomerId(),
                order.getCustomer() != null ? order.getCustomer().getUserId() : null,
                order.getFinalPrice(),
                order.getActualEnd());
        eventPublisher.publishEvent(event);
    }
}
