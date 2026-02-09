package com.oxfield.services.adapter.input.rest;

import com.oxfield.services.adapter.output.persistence.NotificationRepository;
import com.oxfield.services.domain.entity.Notification;
import com.oxfield.services.shared.exception.BusinessException;
import com.oxfield.services.shared.exception.ErrorCode;
import com.oxfield.services.shared.security.AppTypeGuard.RequiresTechApp;
import com.oxfield.services.shared.security.CurrentUserProvider;
import com.oxfield.services.shared.security.JwtUserDetails;
import com.oxfield.services.shared.security.TechnicianOnboardingGuard.RequiresApprovedTechnician;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Controller para notificações do técnico.
 * Extraído do TechnicianController para seguir SRP.
 */
@RestController
@RequestMapping("/tech")
@PreAuthorize("hasRole('TECNICO')")
@Tag(name = "Tech Notifications", description = "Endpoints para notificações do técnico")
public class TechNotificationController {

    private static final Logger log = LoggerFactory.getLogger(TechNotificationController.class);

    private final NotificationRepository notificationRepository;
    private final CurrentUserProvider currentUserProvider;

    public TechNotificationController(
            NotificationRepository notificationRepository,
            CurrentUserProvider currentUserProvider) {
        this.notificationRepository = notificationRepository;
        this.currentUserProvider = currentUserProvider;
    }

    @GetMapping("/notifications")
    @RequiresTechApp
    @RequiresApprovedTechnician
    @Operation(summary = "Get Notifications", description = "Lista notificações do técnico")
    public ResponseEntity<List<NotificationResponse>> getNotifications() {
        JwtUserDetails user = currentUserProvider.requireCurrentUser();
        List<Notification> notifications = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(user.getUserId());

        return ResponseEntity.ok(notifications.stream()
                .map(n -> new NotificationResponse(
                        n.getId(),
                        n.getType() != null ? n.getType().name() : "INFO",
                        n.getTitle(),
                        n.getMessage(),
                        n.getIsRead(),
                        n.getCreatedAt() != null ? n.getCreatedAt().toString() : null))
                .collect(Collectors.toList()));
    }

    @PostMapping("/notifications/{id}/read")
    @RequiresTechApp
    @RequiresApprovedTechnician
    @Operation(summary = "Mark Read", description = "Marca notificação como lida")
    public ResponseEntity<Void> markNotificationRead(@PathVariable UUID id) {
        JwtUserDetails user = currentUserProvider.requireCurrentUser();

        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Notificação não encontrada"));

        if (!notification.getUserId().equals(user.getUserId())) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED, "Esta notificação não pertence a você");
        }

        notification.markAsRead();
        notificationRepository.save(notification);

        return ResponseEntity.ok().build();
    }

    // ==================== DTOs ====================

    public record NotificationResponse(
            UUID id,
            String type,
            String title,
            String message,
            boolean read,
            String createdAt) {
    }
}
