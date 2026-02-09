package com.oxfield.services.domain.entity;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

/**
 * Registro de uso de créditos por um tenant.
 */
@Entity
@Table(name = "credit_usage")
@EntityListeners(AuditingEntityListener.class)
public class CreditUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "credit_balance_id")
    private CreditBalance creditBalance;

    @Column(name = "resource_type", nullable = false)
    private String resourceType;

    @Column(name = "credits_consumed", nullable = false)
    private Integer creditsConsumed;

    @Column(name = "description")
    private String description;

    @Column(name = "reference_id")
    private UUID referenceId;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    // ========== Constructors ==========

    public CreditUsage() {}

    public CreditUsage(Tenant tenant, CreditBalance creditBalance, String resourceType, 
                       int creditsConsumed, String description, UUID referenceId) {
        this.tenant = tenant;
        this.creditBalance = creditBalance;
        this.resourceType = resourceType;
        this.creditsConsumed = creditsConsumed;
        this.description = description;
        this.referenceId = referenceId;
    }

    // ========== Static Factory Methods ==========

    public static CreditUsage forOrderCreation(Tenant tenant, CreditBalance balance, UUID orderId) {
        return new CreditUsage(tenant, balance, "OS_CREATED", 1, 
                "Ordem de Serviço criada", orderId);
    }

    public static CreditUsage forRouteOptimization(Tenant tenant, CreditBalance balance, UUID technicianId) {
        return new CreditUsage(tenant, balance, "ROUTE_OPTIMIZATION", 2, 
                "Otimização de rota", technicianId);
    }

    public static CreditUsage forSms(Tenant tenant, CreditBalance balance, UUID notificationId) {
        return new CreditUsage(tenant, balance, "SMS_SENT", 1, 
                "SMS enviado", notificationId);
    }

    public static CreditUsage forApiCall(Tenant tenant, CreditBalance balance, String endpoint) {
        return new CreditUsage(tenant, balance, "API_CALL", 1, 
                "Chamada API: " + endpoint, null);
    }

    // ========== Getters and Setters ==========

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Tenant getTenant() {
        return tenant;
    }

    public void setTenant(Tenant tenant) {
        this.tenant = tenant;
    }

    public CreditBalance getCreditBalance() {
        return creditBalance;
    }

    public void setCreditBalance(CreditBalance creditBalance) {
        this.creditBalance = creditBalance;
    }

    public String getResourceType() {
        return resourceType;
    }

    public void setResourceType(String resourceType) {
        this.resourceType = resourceType;
    }

    public Integer getCreditsConsumed() {
        return creditsConsumed;
    }

    public void setCreditsConsumed(Integer creditsConsumed) {
        this.creditsConsumed = creditsConsumed;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public UUID getReferenceId() {
        return referenceId;
    }

    public void setReferenceId(UUID referenceId) {
        this.referenceId = referenceId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CreditUsage that = (CreditUsage) o;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
