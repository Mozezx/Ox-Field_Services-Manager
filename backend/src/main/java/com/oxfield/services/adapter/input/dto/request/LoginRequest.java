package com.oxfield.services.adapter.input.dto.request;

import com.oxfield.services.domain.enums.AppType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * DTO para requisição de login.
 * No modelo marketplace, tenantDomain é opcional para clientes (CLIENT_APP).
 */
public record LoginRequest(
        @NotBlank(message = "Email é obrigatório") @Email(message = "Email inválido") String email,

        @NotBlank(message = "Senha é obrigatória") String password,

        @NotNull(message = "Tipo de aplicativo é obrigatório") AppType appType,

        /** Opcional para CLIENT_APP no marketplace - clientes são globais */
        String tenantDomain) {
}

