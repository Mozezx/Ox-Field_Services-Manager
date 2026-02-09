package com.oxfield.services.application.listener;

import com.oxfield.services.adapter.output.persistence.UserRepository;
import com.oxfield.services.application.service.NotificationService;
import com.oxfield.services.domain.entity.User;
import com.oxfield.services.domain.enums.NotificationType;
import com.oxfield.services.domain.enums.OsStatus;
import com.oxfield.services.domain.enums.PriorityLevel;
import com.oxfield.services.domain.event.OrderAssignedEvent;
import com.oxfield.services.domain.event.OrderCompletedEvent;
import com.oxfield.services.domain.event.OrderStatusChangedEvent;
import com.oxfield.services.shared.multitenancy.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.Optional;
import java.util.UUID;

/**
 * Listener de eventos de OS para enviar notificações.
 */
@Component
public class OrderEventListener {

    private static final Logger log = LoggerFactory.getLogger(OrderEventListener.class);

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public OrderEventListener(
            NotificationService notificationService,
            UserRepository userRepository) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    /**
     * Evento: OS atribuída a um técnico
     */
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onOrderAssigned(OrderAssignedEvent event) {
        log.info("Processing OrderAssignedEvent for order: {}", event.osNumber());

        // Notificar técnico
        sendNotification(
                event.technicianUserId(),
                NotificationType.ASSIGNMENT,
                "Nova OS Atribuída",
                String.format("Você recebeu a OS %s. Verifique os detalhes.", event.osNumber()),
                PriorityLevel.HIGH);

        // Notificar cliente
        sendNotification(
                event.customerUserId(),
                NotificationType.INFO,
                "Técnico Designado",
                String.format("Um técnico foi designado para sua OS %s.", event.osNumber()),
                PriorityLevel.MEDIUM);
    }

    /**
     * Evento: Status da OS mudou
     */
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onOrderStatusChanged(OrderStatusChangedEvent event) {
        log.info("Processing OrderStatusChangedEvent: {} -> {}",
                event.previousStatus(), event.newStatus());

        // Notificar cliente sobre mudanças de status
        if (event.customerUserId() != null) {
            String message = getStatusChangeMessage(event.osNumber(), event.newStatus());
            NotificationType type = event.newStatus() == OsStatus.IN_ROUTE ? NotificationType.ALERT
                    : NotificationType.INFO;

            sendNotification(
                    event.customerUserId(),
                    type,
                    "Atualização da OS " + event.osNumber(),
                    message,
                    event.newStatus() == OsStatus.IN_ROUTE ? PriorityLevel.HIGH : PriorityLevel.MEDIUM);
        }
    }

    /**
     * Evento: OS concluída
     */
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onOrderCompleted(OrderCompletedEvent event) {
        log.info("Processing OrderCompletedEvent for order: {}", event.osNumber());

        // Notificar cliente
        sendNotification(
                event.customerUserId(),
                NotificationType.SUCCESS,
                "Serviço Concluído!",
                String.format(
                        "A OS %s foi concluída com sucesso. Valor final: €%.2f",
                        event.osNumber(), event.finalPrice()),
                PriorityLevel.HIGH);

        // Notificar técnico
        sendNotification(
                event.technicianUserId(),
                NotificationType.SUCCESS,
                "OS Finalizada",
                String.format("Parabéns! Você concluiu a OS %s.", event.osNumber()),
                PriorityLevel.LOW);
    }

    // ========== Private Methods ==========

    private void sendNotification(UUID userId, NotificationType type,
            String title, String message, PriorityLevel priority) {
        if (userId == null) {
            log.warn("Cannot send notification: userId is null");
            return;
        }

        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                log.warn("User not found for notification: {}", userId);
                return;
            }

            User user = userOpt.get();
            TenantContext.setCurrentTenantId(user.getTenantId());

            notificationService.send(new NotificationService.NotificationRequest(
                    user.getTenantId(),
                    userId,
                    user,
                    type,
                    title,
                    message,
                    priority));

            log.debug("Notification sent to user {}: {}", userId, title);

        } catch (Exception e) {
            log.error("Failed to send notification to user {}: {}", userId, e.getMessage(), e);
        } finally {
            TenantContext.clear();
        }
    }

    private String getStatusChangeMessage(String osNumber, OsStatus status) {
        return switch (status) {
            case IN_ROUTE -> "O técnico está a caminho! Prepare-se para recebê-lo.";
            case IN_PROGRESS -> "O técnico chegou e iniciou o serviço.";
            case COMPLETED -> "O serviço foi concluído com sucesso!";
            case CANCELLED -> "A OS " + osNumber + " foi cancelada.";
            default -> "Status atualizado para: " + status.getValue();
        };
    }
}
