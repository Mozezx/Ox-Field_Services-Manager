package com.oxfield.services.adapter.input.dto.response;

import com.oxfield.services.domain.enums.UserRole;
import com.oxfield.services.domain.enums.UserStatus;

import java.util.UUID;

/**
 * DTO de resposta de autenticação
 */
public record AuthResponse(
        String accessToken,
        String refreshToken,
        long expiresIn,
        UserInfo user) {
    public record UserInfo(
            UUID id,
            String email,
            String name,
            UserRole role,
            UserStatus status,
            String avatarUrl,
            UUID tenantId) {
    }
}
