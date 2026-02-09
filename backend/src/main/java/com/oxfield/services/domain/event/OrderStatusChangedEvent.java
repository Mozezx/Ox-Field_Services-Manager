package com.oxfield.services.domain.event;

import com.oxfield.services.domain.enums.OsStatus;

import java.time.Instant;
import java.util.UUID;

/**
 * Evento disparado quando o status de uma OS muda.
 */
public record OrderStatusChangedEvent(
        UUID orderId,
        String osNumber,
        OsStatus previousStatus,
        OsStatus newStatus,
        UUID technicianId,
        UUID customerId,
        UUID customerUserId,
        Instant timestamp) {
    public OrderStatusChangedEvent(UUID orderId, String osNumber, OsStatus previousStatus,
            OsStatus newStatus, UUID technicianId, UUID customerId, UUID customerUserId) {
        this(orderId, osNumber, previousStatus, newStatus, technicianId, customerId, customerUserId, Instant.now());
    }
}
