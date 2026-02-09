package com.oxfield.services.adapter.input.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO para registro de empresa (tenant)
 */
public record RegisterCompanyRequest(
        @NotBlank(message = "Nome da empresa é obrigatório") String companyName,

        @NotBlank(message = "Domínio é obrigatório") String domain,

        @NotBlank(message = "Email do administrador é obrigatório") @Email(message = "Email inválido") String adminEmail,

        @NotBlank(message = "Senha é obrigatória") @Size(min = 8, message = "Senha deve ter no mínimo 8 caracteres") String password,

        @NotBlank(message = "Nome do administrador é obrigatório") String adminName,

        String phone,

        String region,

        String description,

        String logoUrl) {
}
