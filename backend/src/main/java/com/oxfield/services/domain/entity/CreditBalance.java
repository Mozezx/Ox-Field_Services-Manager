package com.oxfield.services.domain.entity;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Saldo de créditos pré-pagos de um tenant.
 */
@Entity
@Table(name = "credit_balances")
@EntityListeners(AuditingEntityListener.class)
public class CreditBalance {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @Column(name = "credits_purchased", nullable = false)
    private Integer creditsPurchased = 0;

    @Column(name = "credits_used", nullable = false)
    private Integer creditsUsed = 0;

    @Column(name = "credits_remaining", nullable = false)
    private Integer creditsRemaining = 0;

    @Column(name = "amount_paid", precision = 10, scale = 2)
    private BigDecimal amountPaid;

    @Column(name = "stripe_payment_id")
    private String stripePaymentId;

    @Column(name = "purchased_at")
    private Instant purchasedAt;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    // ========== Constructors ==========

    public CreditBalance() {}

    public CreditBalance(Tenant tenant, int credits, BigDecimal amountPaid) {
        this.tenant = tenant;
        this.creditsPurchased = credits;
        this.creditsRemaining = credits;
        this.creditsUsed = 0;
        this.amountPaid = amountPaid;
        this.purchasedAt = Instant.now();
        // Créditos expiram em 12 meses
        this.expiresAt = Instant.now().plusSeconds(365L * 24 * 60 * 60);
    }

    // ========== Business Methods ==========

    public boolean hasAvailableCredits(int amount) {
        return creditsRemaining >= amount && !isExpired();
    }

    public boolean isExpired() {
        return expiresAt != null && Instant.now().isAfter(expiresAt);
    }

    public boolean consumeCredits(int amount) {
        if (!hasAvailableCredits(amount)) {
            return false;
        }
        this.creditsUsed += amount;
        this.creditsRemaining -= amount;
        return true;
    }

    public void addCredits(int amount) {
        this.creditsPurchased += amount;
        this.creditsRemaining += amount;
    }

    public double getUsagePercentage() {
        if (creditsPurchased == 0) return 0;
        return (double) creditsUsed / creditsPurchased * 100;
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

    public Integer getCreditsPurchased() {
        return creditsPurchased;
    }

    public void setCreditsPurchased(Integer creditsPurchased) {
        this.creditsPurchased = creditsPurchased;
    }

    public Integer getCreditsUsed() {
        return creditsUsed;
    }

    public void setCreditsUsed(Integer creditsUsed) {
        this.creditsUsed = creditsUsed;
    }

    public Integer getCreditsRemaining() {
        return creditsRemaining;
    }

    public void setCreditsRemaining(Integer creditsRemaining) {
        this.creditsRemaining = creditsRemaining;
    }

    public BigDecimal getAmountPaid() {
        return amountPaid;
    }

    public void setAmountPaid(BigDecimal amountPaid) {
        this.amountPaid = amountPaid;
    }

    public String getStripePaymentId() {
        return stripePaymentId;
    }

    public void setStripePaymentId(String stripePaymentId) {
        this.stripePaymentId = stripePaymentId;
    }

    public Instant getPurchasedAt() {
        return purchasedAt;
    }

    public void setPurchasedAt(Instant purchasedAt) {
        this.purchasedAt = purchasedAt;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CreditBalance that = (CreditBalance) o;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
