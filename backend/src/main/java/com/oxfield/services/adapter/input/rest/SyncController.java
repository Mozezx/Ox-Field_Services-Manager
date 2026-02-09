package com.oxfield.services.adapter.input.rest;

import com.oxfield.services.adapter.input.dto.request.SyncBatchRequest;
import com.oxfield.services.adapter.input.dto.response.SyncBatchResponse;
import com.oxfield.services.adapter.output.persistence.TechnicianRepository;
import com.oxfield.services.application.service.LiveTrackingService;
import com.oxfield.services.application.service.SyncService;
import com.oxfield.services.shared.exception.BusinessException;
import com.oxfield.services.shared.exception.ErrorCode;
import com.oxfield.services.shared.security.AppTypeGuard.RequiresTechApp;
import com.oxfield.services.shared.security.CurrentUserProvider;
import com.oxfield.services.shared.security.JwtUserDetails;
import com.oxfield.services.shared.security.TechnicianOnboardingGuard.RequiresApprovedTechnician;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Controller de sincronização para o app mobile.
 */
@RestController
@RequestMapping("/sync")
@PreAuthorize("hasRole('TECNICO')")
@Tag(name = "Sync", description = "Sincronização offline-first para app mobile")
public class SyncController {

    private final SyncService syncService;
    private final LiveTrackingService trackingService;
    private final CurrentUserProvider currentUserProvider;
    private final TechnicianRepository technicianRepository;

    public SyncController(
            SyncService syncService,
            LiveTrackingService trackingService,
            CurrentUserProvider currentUserProvider,
            TechnicianRepository technicianRepository) {
        this.syncService = syncService;
        this.trackingService = trackingService;
        this.currentUserProvider = currentUserProvider;
        this.technicianRepository = technicianRepository;
    }

    /**
     * Processa batch de ações sincronizadas offline.
     */
    @PostMapping("/batch")
    @RequiresTechApp
    @RequiresApprovedTechnician
    @Operation(summary = "Sync Batch", description = "Processa lote de ações do app mobile")
    public ResponseEntity<SyncBatchResponse> processBatch(
            @Valid @RequestBody SyncBatchRequest request) {
        JwtUserDetails user = currentUserProvider.requireCurrentUser();

        // Buscar technician ID pelo user ID
        UUID technicianId = getTechnicianId(user.getUserId());

        SyncBatchResponse response = syncService.processBatch(
                request,
                technicianId,
                user.getTenantId());

        return ResponseEntity.ok(response);
    }

    /**
     * Atualiza localização do técnico (streaming).
     */
    @PostMapping("/location")
    @RequiresTechApp
    @Operation(summary = "Update Location", description = "Atualiza localização do técnico para live tracking")
    public ResponseEntity<Void> updateLocation(
            @RequestParam double latitude,
            @RequestParam double longitude,
            @RequestParam(required = false) UUID orderId) {
        JwtUserDetails user = currentUserProvider.requireCurrentUser();
        UUID technicianId = getTechnicianId(user.getUserId());

        trackingService.updateLocation(technicianId, orderId, latitude, longitude);

        return ResponseEntity.ok().build();
    }

    private UUID getTechnicianId(UUID userId) {
        return technicianRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.VALIDATION_ERROR,
                        "Link to a company first using an invite code before using this feature."))
                .getId();
    }
}
