package com.oxfield.services.application.service;

import com.oxfield.services.adapter.output.persistence.ServiceOrderRepository;
import com.oxfield.services.adapter.output.persistence.TechnicianRepository;
import com.oxfield.services.adapter.output.persistence.TenantRepository;
import com.oxfield.services.adapter.output.persistence.UserRepository;
import com.oxfield.services.domain.entity.Technician;
import com.oxfield.services.domain.entity.Tenant;
import com.oxfield.services.domain.entity.User;
import com.oxfield.services.domain.enums.UserStatus;
import com.oxfield.services.shared.exception.BusinessException;
import com.oxfield.services.shared.exception.ErrorCode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Serviço para Admin Global listar técnicos pendentes (todos os tenants).
 * Admin Global não tem tenant no contexto, então o filtro não é aplicado.
 */
@Service
public class AdminTechnicianService {

    private static final Logger log = LoggerFactory.getLogger(AdminTechnicianService.class);

    private final TechnicianRepository technicianRepository;
    private final TenantRepository tenantRepository;
    private final ServiceOrderRepository serviceOrderRepository;
    private final UserRepository userRepository;

    public AdminTechnicianService(
            TechnicianRepository technicianRepository,
            TenantRepository tenantRepository,
            ServiceOrderRepository serviceOrderRepository,
            UserRepository userRepository) {
        this.technicianRepository = technicianRepository;
        this.tenantRepository = tenantRepository;
        this.serviceOrderRepository = serviceOrderRepository;
        this.userRepository = userRepository;
    }

    /**
     * Remove todos os técnicos e os respetivos logins (users) do sistema (admin global).
     */
    /**
     * Remove todos os técnicos e as respetivas contas (users) do sistema,
     * incluindo referências em ordens, mensagens e logs — como se nunca tivessem sido cadastrados.
     */
    @Transactional
    public void deleteAllTechnicians() {
        log.info("Deleting all technicians and their accounts (admin global)");
        List<UUID> technicianUserIds = technicianRepository.findAllTechnicianUserIdsAsStrings().stream()
                .map(UUID::fromString)
                .toList();
        int cleared = serviceOrderRepository.clearAllTechnicianAssignments();
        log.info("Cleared technician assignment from {} orders", cleared);
        technicianRepository.deleteOrderMessagesFromTechnicians();
        technicianRepository.clearAuditLogReferencesForTechnicians();
        technicianRepository.deleteAllTechnicians();
        if (!technicianUserIds.isEmpty()) {
            userRepository.deleteAllById(technicianUserIds);
            log.info("Deleted {} technician accounts (users)", technicianUserIds.size());
        }
        log.info("All technicians and their accounts removed from the system");
    }

    /**
     * Lista técnicos de um tenant (read-only, para admin global).
     */
    @Transactional(readOnly = true)
    public List<TechnicianWithTenantResponse> listTechniciansByTenant(UUID tenantId) {
        log.info("Listing technicians for tenant: {}", tenantId);

        List<Technician> technicians = technicianRepository.findByTenantId(tenantId);
        Optional<Tenant> tenantOpt = tenantRepository.findById(tenantId);
        String tenantName = tenantOpt.map(Tenant::getName).orElse(null);
        String tenantDomain = tenantOpt.map(Tenant::getDomain).orElse(null);

        List<TechnicianWithTenantResponse> result = new ArrayList<>();
        for (Technician tech : technicians) {
            result.add(toTechnicianWithTenantResponse(tech, tenantName, tenantDomain));
        }
        log.info("Found {} technicians for tenant {}", result.size(), tenantId);
        return result;
    }

    /**
     * Lista técnicos com status PENDING de todos os tenants.
     */
    @Transactional(readOnly = true)
    public List<TechnicianWithTenantResponse> listPendingTechnicians() {
        log.info("Listing pending technicians globally (all tenants)");

        List<Technician> technicians = technicianRepository.findByUserStatus(UserStatus.PENDING);
        List<TechnicianWithTenantResponse> result = new ArrayList<>();

        for (Technician tech : technicians) {
            String tenantName = null;
            String tenantDomain = null;
            if (tech.getTenantId() != null) {
                Optional<Tenant> tenant = tenantRepository.findById(tech.getTenantId());
                if (tenant.isPresent()) {
                    tenantName = tenant.get().getName();
                    tenantDomain = tenant.get().getDomain();
                }
            }

            result.add(toTechnicianWithTenantResponse(tech, tenantName, tenantDomain));
        }

        log.info("Found {} pending technicians", result.size());
        return result;
    }

    /**
     * Obtém detalhes de um técnico incluindo tenant.
     */
    @Transactional(readOnly = true)
    public TechnicianWithTenantResponse getTechnicianDetails(UUID technicianId) {
        log.info("Getting technician details for admin: {}", technicianId);

        Technician technician = technicianRepository.findById(technicianId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.TECH_NOT_FOUND,
                        "Técnico não encontrado"));

        String tenantName = null;
        String tenantDomain = null;
        if (technician.getTenantId() != null) {
            Optional<Tenant> tenant = tenantRepository.findById(technician.getTenantId());
            if (tenant.isPresent()) {
                tenantName = tenant.get().getName();
                tenantDomain = tenant.get().getDomain();
            }
        }

        return toTechnicianWithTenantDetailResponse(technician, tenantName, tenantDomain);
    }

    private TechnicianWithTenantResponse toTechnicianWithTenantResponse(
            Technician technician, String tenantName, String tenantDomain) {
        User user = technician.getUser();
        return new TechnicianWithTenantResponse(
                technician.getId(),
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                technician.getRoleTitle(),
                user.getStatus().getValue().toUpperCase(),
                technician.getSkills() != null ? technician.getSkills() : List.of(),
                technician.getRating() != null ? technician.getRating().doubleValue() : 5.0,
                technician.getIsOnline() != null && technician.getIsOnline(),
                user.getAvatarUrl(),
                instantToLocalDateTime(user.getCreatedAt()),
                tenantName,
                tenantDomain
        );
    }

    private TechnicianWithTenantResponse toTechnicianWithTenantDetailResponse(
            Technician technician, String tenantName, String tenantDomain) {
        User user = technician.getUser();
        return new TechnicianWithTenantResponse(
                technician.getId(),
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                technician.getRoleTitle(),
                user.getStatus().getValue().toUpperCase(),
                technician.getSkills() != null ? technician.getSkills() : List.of(),
                technician.getRating() != null ? technician.getRating().doubleValue() : 5.0,
                technician.getIsOnline() != null && technician.getIsOnline(),
                user.getAvatarUrl(),
                instantToLocalDateTime(user.getCreatedAt()),
                tenantName,
                tenantDomain
        );
    }

    private LocalDateTime instantToLocalDateTime(Instant instant) {
        if (instant == null) return null;
        return LocalDateTime.ofInstant(instant, ZoneId.systemDefault());
    }

    public record TechnicianWithTenantResponse(
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
            LocalDateTime createdAt,
            String tenantName,
            String tenantDomain
    ) {}
}
