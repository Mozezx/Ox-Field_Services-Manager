package com.oxfield.services.domain.entity;

import com.oxfield.services.domain.enums.TenantStatus;
import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Entidade Tenant - representa uma empresa/organização no sistema SaaS.
 * NÃO herda de TenantAwareEntity pois é a própria raiz do multitenancy.
 */
@Entity
@Table(name = "tenants")
@EntityListeners(AuditingEntityListener.class)
public class Tenant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "domain", nullable = false, unique = true)
    private String domain;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private TenantStatus status = TenantStatus.PROVISIONING;

    @Column(name = "region", nullable = false)
    private String region;

    @Column(name = "health_score")
    private Integer healthScore = 100;

    @Column(name = "mrr", precision = 12, scale = 2)
    private BigDecimal mrr = BigDecimal.ZERO;

    @Column(name = "last_audit_at")
    private Instant lastAuditAt;

    // ========== Marketplace Fields ==========

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "total_reviews")
    private Integer totalReviews = 0;

    @Column(name = "average_rating", precision = 3, scale = 2)
    private BigDecimal averageRating = new BigDecimal("5.00");

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    // ========== Constructors ==========

    public Tenant() {}

    public Tenant(String name, String domain, String region) {
        this.name = name;
        this.domain = domain;
        this.region = region;
    }

    // ========== Business Methods ==========

    public boolean isActive() {
        return this.status == TenantStatus.ACTIVE;
    }

    public void activate() {
        this.status = TenantStatus.ACTIVE;
    }

    public void suspend() {
        this.status = TenantStatus.SUSPENDED;
    }

    // ========== Getters and Setters ==========

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDomain() {
        return domain;
    }

    public void setDomain(String domain) {
        this.domain = domain;
    }

    public TenantStatus getStatus() {
        return status;
    }

    public void setStatus(TenantStatus status) {
        this.status = status;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public Integer getHealthScore() {
        return healthScore;
    }

    public void setHealthScore(Integer healthScore) {
        this.healthScore = healthScore;
    }

    public BigDecimal getMrr() {
        return mrr;
    }

    public void setMrr(BigDecimal mrr) {
        this.mrr = mrr;
    }

    public Instant getLastAuditAt() {
        return lastAuditAt;
    }

    public void setLastAuditAt(Instant lastAuditAt) {
        this.lastAuditAt = lastAuditAt;
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

    public String getLogoUrl() {
        return logoUrl;
    }

    public void setLogoUrl(String logoUrl) {
        this.logoUrl = logoUrl;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getTotalReviews() {
        return totalReviews;
    }

    public void setTotalReviews(Integer totalReviews) {
        this.totalReviews = totalReviews;
    }

    public BigDecimal getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(BigDecimal averageRating) {
        this.averageRating = averageRating;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Tenant tenant = (Tenant) o;
        return id != null && id.equals(tenant.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
