package com.oxfield.services.domain.event;

import com.oxfield.services.domain.enums.OsStatus;

import java.time.Instant;
import java.util.UUID;

/**
 * Evento disparado quando uma OS é atribuída a um técnico.
 */
public record OrderAssignedEvent(
        UUID orderId,
        String osNumber,
        UUID technicianId,
        UUID technicianUserId,
        UUID customerId,
        UUID customerUserId,
        Instant timestamp) {
    public OrderAssignedEvent(UUID orderId, String osNumber, UUID technicianId,
            UUID technicianUserId, UUID customerId, UUID customerUserId) {
        this(orderId, osNumber, technicianId, technicianUserId, customerId, customerUserId, Instant.now());
    }
}
