package com.oxfield.services.domain.entity;

import com.oxfield.services.domain.enums.InviteStatus;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Invite link for a single technician. Each invite has a unique token;
 * when the technician registers using that token, the invite is marked USED.
 */
@Entity
@Table(name = "technician_invites")
public class TechnicianInvite extends BaseEntity {

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(name = "token", nullable = false, unique = true, updatable = false)
    private UUID token;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private InviteStatus status = InviteStatus.PENDING;

    @Column(name = "used_at")
    private Instant usedAt;

    @Column(name = "technician_id")
    private UUID technicianId;

    public TechnicianInvite() {}

    public TechnicianInvite(UUID tenantId, UUID token) {
        this.tenantId = tenantId;
        this.token = token;
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
    }

    public UUID getToken() {
        return token;
    }

    public void setToken(UUID token) {
        this.token = token;
    }

    public InviteStatus getStatus() {
        return status;
    }

    public void setStatus(InviteStatus status) {
        this.status = status;
    }

    public Instant getUsedAt() {
        return usedAt;
    }

    public void setUsedAt(Instant usedAt) {
        this.usedAt = usedAt;
    }

    public UUID getTechnicianId() {
        return technicianId;
    }

    public void setTechnicianId(UUID technicianId) {
        this.technicianId = technicianId;
    }

    public void markAsUsed(UUID technicianId) {
        this.status = InviteStatus.USED;
        this.usedAt = Instant.now();
        this.technicianId = technicianId;
    }
}
