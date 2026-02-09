package com.oxfield.services.adapter.input.dto.request;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO para refresh token
 */
public record RefreshTokenRequest(
        @NotBlank(message = "Refresh token é obrigatório") String refreshToken) {
}
