package com.oxfield.services.application.service;

import com.oxfield.services.adapter.output.persistence.ServiceOrderRepository;
import com.oxfield.services.adapter.output.persistence.TechnicianRepository;
import com.oxfield.services.domain.entity.ServiceOrder;
import com.oxfield.services.domain.entity.Technician;
import com.oxfield.services.domain.enums.OsStatus;
import com.oxfield.services.shared.exception.BusinessException;
import com.oxfield.services.shared.exception.ErrorCode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

/**
 * Service para cálculo de métricas de performance do técnico.
 * Encapsula toda a lógica de negócio relacionada a performance/analytics.
 */
@Service
public class TechnicianPerformanceService {

    private static final Logger log = LoggerFactory.getLogger(TechnicianPerformanceService.class);

    private final TechnicianRepository technicianRepository;
    private final ServiceOrderRepository orderRepository;

    public TechnicianPerformanceService(
            TechnicianRepository technicianRepository,
            ServiceOrderRepository orderRepository) {
        this.technicianRepository = technicianRepository;
        this.orderRepository = orderRepository;
    }

    /**
     * Calcula métricas de performance de um técnico para um período específico.
     * 
     * @param technicianId ID do técnico
     * @param period       Período: "7d", "30d", ou "90d"
     * @return PerformanceMetrics com todas as métricas calculadas
     */
    @Transactional(readOnly = true)
    public PerformanceMetrics calculatePerformance(UUID technicianId, String period) {
        Technician technician = technicianRepository.findById(technicianId)
                .orElseThrow(() -> new BusinessException(ErrorCode.TECH_NOT_FOUND, "Técnico não encontrado"));

        LocalDate endDate = LocalDate.now();
        LocalDate startDate = parsePeriod(period, endDate);

        List<ServiceOrder> completedOrders = orderRepository
                .findByTechnicianIdAndStatusAndActualEndBetween(
                        technicianId,
                        OsStatus.COMPLETED,
                        startDate.atStartOfDay().toInstant(ZoneOffset.UTC),
                        endDate.atTime(23, 59, 59).toInstant(ZoneOffset.UTC));

        int jobsCompleted = completedOrders.size();
        double avgDuration = calculateAverageDuration(completedOrders);
        double onTimeRate = calculateOnTimeRate(completedOrders);
        double customerRating = technician.getRating() != null ? technician.getRating().doubleValue() : 5.0;
        BigDecimal earnings = calculateEarnings(completedOrders);

        log.debug("Performance calculated for technician {}: jobs={}, avgDuration={}, onTimeRate={}%",
                technicianId, jobsCompleted, avgDuration, onTimeRate);

        return new PerformanceMetrics(
                period,
                jobsCompleted,
                (int) avgDuration,
                onTimeRate,
                customerRating,
                earnings);
    }

    /**
     * Calcula métricas de performance usando o userId (para controllers que usam
     * CurrentUserProvider).
     */
    @Transactional(readOnly = true)
    public PerformanceMetrics calculatePerformanceByUserId(UUID userId, String period) {
        Technician technician = technicianRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.TECH_NOT_FOUND, "Perfil de técnico não encontrado"));
        return calculatePerformance(technician.getId(), period);
    }

    private LocalDate parsePeriod(String period, LocalDate endDate) {
        return switch (period) {
            case "7d" -> endDate.minusDays(7);
            case "30d" -> endDate.minusDays(30);
            case "90d" -> endDate.minusDays(90);
            default -> endDate.minusDays(30);
        };
    }

    private double calculateAverageDuration(List<ServiceOrder> orders) {
        return orders.stream()
                .filter(o -> o.getActualStart() != null && o.getActualEnd() != null)
                .mapToLong(o -> ChronoUnit.MINUTES.between(o.getActualStart(), o.getActualEnd()))
                .average()
                .orElse(0.0);
    }

    private double calculateOnTimeRate(List<ServiceOrder> orders) {
        if (orders.isEmpty())
            return 0.0;

        long onTimeCount = orders.stream()
                .filter(o -> o.getActualEnd() != null && o.getScheduledDate() != null && o.getScheduledStart() != null)
                .filter(this::isOnTime)
                .count();

        return (onTimeCount * 100.0 / orders.size());
    }

    private boolean isOnTime(ServiceOrder order) {
        LocalDate scheduledDate = order.getScheduledDate();
        Instant scheduledEnd = order.getScheduledStart()
                .atDate(scheduledDate)
                .plusMinutes(order.getScheduledDuration())
                .toInstant(ZoneOffset.UTC);

        // On time if completed before or within 15 minutes of scheduled end
        return order.getActualEnd().isBefore(scheduledEnd) ||
                ChronoUnit.MINUTES.between(scheduledEnd, order.getActualEnd()) <= 15;
    }

    private BigDecimal calculateEarnings(List<ServiceOrder> orders) {
        return orders.stream()
                .filter(o -> o.getFinalPrice() != null)
                .map(ServiceOrder::getFinalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    // ==================== DTOs ====================

    public record PerformanceMetrics(
            String period,
            int jobsCompleted,
            int avgDurationMinutes,
            double onTimeRate,
            double customerRating,
            BigDecimal earnings) {
    }
}
