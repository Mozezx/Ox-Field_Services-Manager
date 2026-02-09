package com.oxfield.services.application.service;

import com.oxfield.services.adapter.output.persistence.TechnicianDocumentRepository;
import com.oxfield.services.adapter.output.persistence.TechnicianRepository;
import com.oxfield.services.adapter.output.persistence.UserRepository;
import com.oxfield.services.domain.entity.Technician;
import com.oxfield.services.domain.entity.TechnicianDocument;
import com.oxfield.services.domain.entity.User;
import com.oxfield.services.domain.enums.NotificationType;
import com.oxfield.services.domain.enums.PriorityLevel;
import com.oxfield.services.domain.enums.UserStatus;
import com.oxfield.services.shared.exception.BusinessException;
import com.oxfield.services.shared.exception.ErrorCode;
import com.oxfield.services.shared.security.CurrentUserProvider;
import com.oxfield.services.shared.util.GeoUtils;
import com.oxfield.services.shared.security.JwtUserDetails;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Serviço para gestão de técnicos.
 * Usado pelo painel da empresa para aprovar/rejeitar técnicos.
 */
@Service
public class TechnicianManagementService {

    private static final Logger log = LoggerFactory.getLogger(TechnicianManagementService.class);

    private final TechnicianRepository technicianRepository;
    private final TechnicianDocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final CurrentUserProvider currentUserProvider;

    public TechnicianManagementService(
            TechnicianRepository technicianRepository,
            TechnicianDocumentRepository documentRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            CurrentUserProvider currentUserProvider) {
        this.technicianRepository = technicianRepository;
        this.documentRepository = documentRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.currentUserProvider = currentUserProvider;
    }

    /**
     * Lista todos os técnicos, opcionalmente filtrados por status.
     */
    @Transactional(readOnly = true)
    public List<TechnicianResponse> listTechnicians(UserStatus status) {
        log.info("Listing technicians with status filter: {}", status);

        List<Technician> technicians;
        if (status != null) {
            technicians = technicianRepository.findByUserStatus(status);
        } else {
            technicians = technicianRepository.findAllWithUser();
        }

        return technicians.stream()
                .map(this::toTechnicianResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lista técnicos com localização conhecida (para mapa de frota).
     */
    @Transactional(readOnly = true)
    public List<FleetLocationResponse> getFleetLocations() {
        log.info("Getting fleet locations for current tenant");
        List<Technician> technicians = technicianRepository.findAllWithUserAndNonNullLocation();
        return technicians.stream()
                .map(this::toFleetLocationResponse)
                .collect(Collectors.toList());
    }

    /**
     * Obtém detalhes de um técnico específico.
     */
    @Transactional(readOnly = true)
    public TechnicianDetailResponse getTechnicianDetails(UUID technicianId) {
        log.info("Getting technician details: {}", technicianId);

        Technician technician = technicianRepository.findById(technicianId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.TECH_NOT_FOUND,
                        "Técnico não encontrado"));

        return toTechnicianDetailResponse(technician);
    }

    /**
     * Aprova um técnico.
     * Atualiza o status do User e envia notificação.
     */
    @Transactional
    public TechnicianResponse approveTechnician(UUID technicianId) {
        log.info("Approving technician: {}", technicianId);

        Technician technician = technicianRepository.findById(technicianId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.TECH_NOT_FOUND,
                        "Técnico não encontrado"));

        User user = technician.getUser();

        if (user.getStatus() == UserStatus.APPROVED) {
            throw new BusinessException(
                    ErrorCode.INVALID_OPERATION,
                    "Este técnico já está aprovado");
        }

        // Aprovar usuário
        user.approve();
        userRepository.save(user);

        log.info("Technician {} approved. User status: {}", technicianId, user.getStatus());

        // Enviar notificação
        sendApprovalNotification(user);

        return toTechnicianResponse(technician);
    }

    /**
     * Rejeita um técnico.
     * Atualiza o status do User e envia notificação com o motivo.
     */
    @Transactional
    public TechnicianResponse rejectTechnician(UUID technicianId, String reason) {
        log.info("Rejecting technician: {} with reason: {}", technicianId, reason);

        Technician technician = technicianRepository.findById(technicianId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.TECH_NOT_FOUND,
                        "Técnico não encontrado"));

        User user = technician.getUser();

        if (user.getStatus() == UserStatus.REJECTED) {
            throw new BusinessException(
                    ErrorCode.INVALID_OPERATION,
                    "Este técnico já foi rejeitado");
        }

        // Rejeitar usuário
        user.reject();
        userRepository.save(user);

        log.info("Technician {} rejected. User status: {}", technicianId, user.getStatus());

        // Enviar notificação
        sendRejectionNotification(user, reason);

        return toTechnicianResponse(technician);
    }

    /**
     * Suspende um técnico aprovado.
     */
    @Transactional
    public TechnicianResponse suspendTechnician(UUID technicianId, String reason) {
        log.info("Suspending technician: {} with reason: {}", technicianId, reason);

        Technician technician = technicianRepository.findById(technicianId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.TECH_NOT_FOUND,
                        "Técnico não encontrado"));

        User user = technician.getUser();

        if (user.getStatus() == UserStatus.SUSPENDED) {
            throw new BusinessException(
                    ErrorCode.INVALID_OPERATION,
                    "Este técnico já está suspenso");
        }

        // Suspender usuário
        user.suspend();
        userRepository.save(user);

        // Colocar técnico offline
        technician.goOffline();
        technicianRepository.save(technician);

        log.info("Technician {} suspended. User status: {}", technicianId, user.getStatus());

        // Enviar notificação
        sendSuspensionNotification(user, reason);

        return toTechnicianResponse(technician);
    }

    /**
     * Reativa um técnico suspenso ou rejeitado.
     */
    @Transactional
    public TechnicianResponse reactivateTechnician(UUID technicianId) {
        log.info("Reactivating technician: {}", technicianId);

        Technician technician = technicianRepository.findById(technicianId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.TECH_NOT_FOUND,
                        "Técnico não encontrado"));

        User user = technician.getUser();

        if (user.getStatus() == UserStatus.APPROVED) {
            throw new BusinessException(
                    ErrorCode.INVALID_OPERATION,
                    "Este técnico já está ativo");
        }

        // Aprovar usuário
        user.approve();
        userRepository.save(user);

        log.info("Technician {} reactivated. User status: {}", technicianId, user.getStatus());

        // Enviar notificação
        sendReactivationNotification(user);

        return toTechnicianResponse(technician);
    }

    /**
     * Retorna documentos do técnico (persistidos na pasta local de uploads).
     */
    @Transactional(readOnly = true)
    public List<TechnicianDocumentResponse> getTechnicianDocuments(UUID technicianId) {
        log.info("Getting documents for technician: {}", technicianId);

        technicianRepository.findById(technicianId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.TECH_NOT_FOUND,
                        "Técnico não encontrado"));

        return documentRepository.findByTechnicianIdOrderByCreatedAtDesc(technicianId).stream()
                .map(d -> new TechnicianDocumentResponse(
                        d.getId(),
                        d.getType(),
                        d.getFileName(),
                        "/uploads/" + (d.getFilePath() != null ? d.getFilePath().replace("\\", "/") : ""),
                        d.getStatus() != null ? d.getStatus() : "PENDING",
                        d.getCreatedAt() != null ? LocalDateTime.ofInstant(d.getCreatedAt(), ZoneId.systemDefault()) : null))
                .collect(Collectors.toList());
    }

    // ========== Private Methods ==========

    private void sendApprovalNotification(User user) {
        try {
            notificationService.send(new NotificationService.NotificationRequest(
                    user.getTenantId(),
                    user.getId(),
                    user,
                    NotificationType.SUCCESS,
                    "Conta Aprovada!",
                    "Parabéns! Sua conta foi aprovada. Você já pode acessar o aplicativo e começar a receber ordens de serviço.",
                    PriorityLevel.HIGH
            ));
        } catch (Exception e) {
            log.error("Failed to send approval notification to user {}: {}", user.getId(), e.getMessage());
        }
    }

    private void sendRejectionNotification(User user, String reason) {
        try {
            String message = "Infelizmente sua conta foi rejeitada.";
            if (reason != null && !reason.isBlank()) {
                message += " Motivo: " + reason;
            }
            message += " Entre em contato com o suporte para mais informações.";

            notificationService.send(new NotificationService.NotificationRequest(
                    user.getTenantId(),
                    user.getId(),
                    user,
                    NotificationType.ALERT,
                    "Conta Rejeitada",
                    message,
                    PriorityLevel.HIGH
            ));
        } catch (Exception e) {
            log.error("Failed to send rejection notification to user {}: {}", user.getId(), e.getMessage());
        }
    }

    private void sendSuspensionNotification(User user, String reason) {
        try {
            String message = "Sua conta foi suspensa.";
            if (reason != null && !reason.isBlank()) {
                message += " Motivo: " + reason;
            }
            message += " Entre em contato com a empresa para mais informações.";

            notificationService.send(new NotificationService.NotificationRequest(
                    user.getTenantId(),
                    user.getId(),
                    user,
                    NotificationType.WARNING,
                    "Conta Suspensa",
                    message,
                    PriorityLevel.HIGH
            ));
        } catch (Exception e) {
            log.error("Failed to send suspension notification to user {}: {}", user.getId(), e.getMessage());
        }
    }

    private void sendReactivationNotification(User user) {
        try {
            notificationService.send(new NotificationService.NotificationRequest(
                    user.getTenantId(),
                    user.getId(),
                    user,
                    NotificationType.SUCCESS,
                    "Conta Reativada!",
                    "Sua conta foi reativada. Você já pode acessar o aplicativo novamente.",
                    PriorityLevel.HIGH
            ));
        } catch (Exception e) {
            log.error("Failed to send reactivation notification to user {}: {}", user.getId(), e.getMessage());
        }
    }

    private TechnicianResponse toTechnicianResponse(Technician technician) {
        User user = technician.getUser();
        if (user == null) {
            log.warn("Technician {} has no user", technician.getId());
            return new TechnicianResponse(
                    technician.getId(),
                    null,
                    "",
                    "",
                    null,
                    technician.getRoleTitle(),
                    "PENDING",
                    technician.getSkills() != null ? technician.getSkills() : List.of(),
                    technician.getRating() != null ? technician.getRating().doubleValue() : 5.0,
                    Boolean.TRUE.equals(technician.getIsOnline()),
                    null,
                    null
            );
        }
        String statusStr = user.getStatus() != null ? user.getStatus().getValue().toUpperCase() : "PENDING";
        return new TechnicianResponse(
                technician.getId(),
                user.getId(),
                user.getName() != null ? user.getName() : "",
                user.getEmail() != null ? user.getEmail() : "",
                user.getPhone(),
                technician.getRoleTitle(),
                statusStr,
                technician.getSkills() != null ? technician.getSkills() : List.of(),
                technician.getRating() != null ? technician.getRating().doubleValue() : 5.0,
                Boolean.TRUE.equals(technician.getIsOnline()),
                user.getAvatarUrl(),
                instantToLocalDateTime(user.getCreatedAt())
        );
    }

    private FleetLocationResponse toFleetLocationResponse(Technician technician) {
        User user = technician.getUser();
        String name = (user != null && user.getName() != null) ? user.getName() : "";
        double lat = 0.0;
        double lng = 0.0;
        if (technician.getCurrentLocation() != null) {
            lat = GeoUtils.getLatitude(technician.getCurrentLocation());
            lng = GeoUtils.getLongitude(technician.getCurrentLocation());
        }
        return new FleetLocationResponse(
                technician.getId(),
                name,
                lat,
                lng
        );
    }

    private TechnicianDetailResponse toTechnicianDetailResponse(Technician technician) {
        User user = technician.getUser();
        if (user == null) {
            throw new BusinessException(ErrorCode.TECH_NOT_FOUND, "Técnico sem usuário associado");
        }
        String statusStr = user.getStatus() != null ? user.getStatus().getValue().toUpperCase() : "PENDING";
        return new TechnicianDetailResponse(
                technician.getId(),
                user.getId(),
                user.getName() != null ? user.getName() : "",
                user.getEmail() != null ? user.getEmail() : "",
                user.getPhone(),
                technician.getRoleTitle(),
                statusStr,
                technician.getSkills() != null ? technician.getSkills() : List.of(),
                technician.getRating() != null ? technician.getRating().doubleValue() : 5.0,
                Boolean.TRUE.equals(technician.getIsOnline()),
                user.getAvatarUrl(),
                technician.getVehicleModel(),
                technician.getVehiclePlate(),
                technician.getInternalCode(),
                instantToLocalDateTime(user.getCreatedAt()),
                instantToLocalDateTime(user.getUpdatedAt())
        );
    }

    private LocalDateTime instantToLocalDateTime(Instant instant) {
        if (instant == null) return null;
        return LocalDateTime.ofInstant(instant, ZoneId.systemDefault());
    }

    // ========== Response DTOs ==========

    public record TechnicianResponse(
            UUID id,
            UUID userId,
            String name,
            String email,
            String phone,
            String role,
            String status,
            List<String> skills,
            double rating,
            boolean isOnline,
            String avatarUrl,
            LocalDateTime createdAt
    ) {}

    public record TechnicianDetailResponse(
            UUID id,
            UUID userId,
            String name,
            String email,
            String phone,
            String role,
            String status,
            List<String> skills,
            double rating,
            boolean isOnline,
            String avatarUrl,
            String vehicleModel,
            String vehiclePlate,
            String internalCode,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {}

    public record TechnicianDocumentResponse(
            UUID id,
            String type,
            String fileName,
            String url,
            String status,
            LocalDateTime uploadedAt
    ) {}

    public record FleetLocationResponse(
            UUID technicianId,
            String name,
            double latitude,
            double longitude
    ) {}
}
