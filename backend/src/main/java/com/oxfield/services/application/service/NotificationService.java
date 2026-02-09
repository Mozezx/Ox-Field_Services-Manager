package com.oxfield.services.application.service;

import com.oxfield.services.adapter.output.persistence.NotificationRepository;
import com.oxfield.services.domain.entity.Notification;
import com.oxfield.services.domain.entity.User;
import com.oxfield.services.domain.enums.NotificationType;
import com.oxfield.services.domain.enums.PriorityLevel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Serviço de notificações in-app.
 */
@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    // TODO: Injetar FirebaseAdapter para push notifications

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    /**
     * Cria e envia uma notificação para um usuário.
     */
    @Transactional
    public Notification send(NotificationRequest request) {
        log.info("Sending notification to user {}: {}", request.userId(), request.title());

        Notification notification = new Notification();
        notification.setTenantId(request.tenantId());
        notification.setUser(request.user());
        notification.setType(request.type());
        notification.setTitle(request.title());
        notification.setMessage(request.message());
        notification.setPriority(request.priority() != null ? request.priority() : PriorityLevel.MEDIUM);

        notification = notificationRepository.save(notification);

        // TODO: Enviar push notification via Firebase
        // firebaseAdapter.sendPush(request.userId(), request.title(),
        // request.message());

        return notification;
    }

    /**
     * Obtém notificações não lidas de um usuário.
     */
    @Transactional(readOnly = true)
    public List<Notification> getUnreadNotifications(UUID userId) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
    }

    /**
     * Conta notificações não lidas.
     */
    @Transactional(readOnly = true)
    public long countUnread(UUID userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    /**
     * Marca notificação como lida.
     */
    @Transactional
    public void markAsRead(UUID notificationId) {
        notificationRepository.findById(notificationId)
                .ifPresent(notification -> {
                    notification.markAsRead();
                    notificationRepository.save(notification);
                });
    }

    /**
     * Marca todas as notificações de um usuário como lidas.
     */
    @Transactional
    public void markAllAsRead(UUID userId) {
        notificationRepository.markAllAsReadByUserId(userId);
    }

    // ========== DTO ==========

    public record NotificationRequest(
            UUID tenantId,
            UUID userId,
            User user,
            NotificationType type,
            String title,
            String message,
            PriorityLevel priority) {
    }
}
