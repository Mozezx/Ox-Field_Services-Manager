package com.oxfield.services.adapter.input.dto.request;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO for technician redeem invite (link to company).
 */
public record RedeemInviteRequest(
        @NotBlank(message = "Invite token is required") String inviteToken) {
}
