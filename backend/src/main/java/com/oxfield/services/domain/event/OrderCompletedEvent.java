package com.oxfield.services.domain.event;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Evento disparado quando uma OS é concluída.
 */
public record OrderCompletedEvent(
        UUID orderId,
        String osNumber,
        UUID technicianId,
        UUID technicianUserId,
        UUID customerId,
        UUID customerUserId,
        BigDecimal finalPrice,
        Instant completedAt,
        Instant timestamp) {
    public OrderCompletedEvent(UUID orderId, String osNumber, UUID technicianId,
            UUID technicianUserId, UUID customerId, UUID customerUserId,
            BigDecimal finalPrice, Instant completedAt) {
        this(orderId, osNumber, technicianId, technicianUserId, customerId, customerUserId,
                finalPrice, completedAt, Instant.now());
    }
}
