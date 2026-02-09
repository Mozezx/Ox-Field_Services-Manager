package com.oxfield.services.adapter.input.dto.response;

import com.oxfield.services.domain.enums.UserStatus;

import java.util.UUID;

/**
 * DTO de resposta de registro de técnico
 */
public record TechnicianRegistrationResponse(
        UUID userId,
        UUID technicianId,
        String message,
        UserStatus status) {
}
