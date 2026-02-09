package com.oxfield.services.adapter.input.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO para registro de cliente.
 * No modelo marketplace, tenantDomain é opcional - clientes são globais.
 */
public record RegisterClientRequest(
        @NotBlank(message = "Email é obrigatório") @Email(message = "Email inválido") String email,

        @NotBlank(message = "Senha é obrigatória") @Size(min = 8, message = "Senha deve ter no mínimo 8 caracteres") String password,

        @NotBlank(message = "Nome é obrigatório") String name,

        String phone,

        /** Opcional no marketplace - clientes são globais e escolhem empresa por serviço */
        String tenantDomain,

        String companyName) {
}

