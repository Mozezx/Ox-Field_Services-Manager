package com.oxfield.services.adapter.input.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * DTO for technician registration.
 * inviteToken and tenantDomain are optional. If neither is provided, the technician is registered without a company and can link later via redeem-invite.
 */
public record RegisterTechnicianRequest(
        @NotBlank(message = "Email is required") @Email(message = "Invalid email") String email,

        @NotBlank(message = "Password is required") @Size(min = 8, message = "Password must be at least 8 characters") String password,

        @NotBlank(message = "Name is required") String name,

        String phone,

        String tenantDomain,

        String inviteToken,

        List<String> skills,

        String vehicleModel,

        String vehiclePlate) {
}
