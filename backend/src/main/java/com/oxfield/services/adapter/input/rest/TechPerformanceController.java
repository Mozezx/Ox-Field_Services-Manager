package com.oxfield.services.adapter.input.rest;

import com.oxfield.services.adapter.output.persistence.TechnicianRepository;
import com.oxfield.services.application.service.TechnicianPerformanceService;
import com.oxfield.services.application.service.TechnicianPerformanceService.PerformanceMetrics;
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

import java.math.BigDecimal;

/**
 * Controller para métricas de performance do técnico.
 * Delega lógica de negócio para TechnicianPerformanceService.
 */
@RestController
@RequestMapping("/tech")
@PreAuthorize("hasRole('TECNICO')")
@Tag(name = "Tech Performance", description = "Endpoints para métricas de performance")
public class TechPerformanceController {

        private static final Logger log = LoggerFactory.getLogger(TechPerformanceController.class);

        private final TechnicianPerformanceService performanceService;
        private final CurrentUserProvider currentUserProvider;

        public TechPerformanceController(
                        TechnicianPerformanceService performanceService,
                        CurrentUserProvider currentUserProvider) {
                this.performanceService = performanceService;
                this.currentUserProvider = currentUserProvider;
        }

        @GetMapping("/performance")
        @RequiresTechApp
        @RequiresApprovedTechnician
        @Operation(summary = "Get Performance", description = "Retorna métricas de performance do técnico")
        public ResponseEntity<PerformanceResponse> getPerformance(
                        @RequestParam(required = false, defaultValue = "30d") String period) {
                JwtUserDetails user = currentUserProvider.requireCurrentUser();
                PerformanceMetrics metrics = performanceService.calculatePerformanceByUserId(user.getUserId(), period);

                return ResponseEntity.ok(new PerformanceResponse(
                                metrics.period(),
                                metrics.jobsCompleted(),
                                metrics.avgDurationMinutes(),
                                metrics.onTimeRate(),
                                metrics.customerRating(),
                                metrics.earnings()));
        }

        // ==================== DTOs ====================

        public record PerformanceResponse(
                        String period,
                        int jobsCompleted,
                        int avgDurationMinutes,
                        double onTimeRate,
                        double customerRating,
                        BigDecimal earnings) {
        }
}
