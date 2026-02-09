package com.oxfield.services.adapter.input.rest;

import com.oxfield.services.adapter.output.persistence.TechnicianRepository;
import com.oxfield.services.application.service.LiveTrackingService;
import com.oxfield.services.domain.entity.Technician;
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

import java.util.UUID;

/**
 * Controller para localização em tempo real do técnico.
 * Extraído do TechnicianController para seguir SRP.
 */
@RestController
@RequestMapping("/tech")
@PreAuthorize("hasRole('TECNICO')")
@Tag(name = "Tech Location", description = "Endpoints para localização do técnico")
public class TechLocationController {

    private static final Logger log = LoggerFactory.getLogger(TechLocationController.class);

    private final TechnicianRepository technicianRepository;
    private final LiveTrackingService liveTrackingService;
    private final CurrentUserProvider currentUserProvider;

    public TechLocationController(
            TechnicianRepository technicianRepository,
            LiveTrackingService liveTrackingService,
            CurrentUserProvider currentUserProvider) {
        this.technicianRepository = technicianRepository;
        this.liveTrackingService = liveTrackingService;
        this.currentUserProvider = currentUserProvider;
    }

    @PostMapping("/location")
    @RequiresTechApp
    @RequiresApprovedTechnician
    @Operation(summary = "Update Location", description = "Atualiza localização do técnico em tempo real")
    public ResponseEntity<Void> updateLocation(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(required = false) String timestamp,
            @RequestParam(required = false) UUID orderId) {
        Technician technician = getCurrentTechnician();
        liveTrackingService.updateLocation(technician.getId(), orderId, lat, lng);
        return ResponseEntity.ok().build();
    }

    private Technician getCurrentTechnician() {
        JwtUserDetails user = currentUserProvider.requireCurrentUser();
        return technicianRepository.findByUserId(user.getUserId())
                .orElseThrow(() -> new BusinessException(ErrorCode.TECH_NOT_FOUND, "Perfil de técnico não encontrado"));
    }
}
