package com.oxfield.services.domain.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;

/**
 * Entidade ServiceCategory - Categoria de serviço por tenant.
 * Cada empresa (tenant) pode criar, editar e excluir suas próprias categorias.
 */
@Entity
@Table(name = "service_categories", uniqueConstraints = @UniqueConstraint(columnNames = { "tenant_id", "code" }))
public class ServiceCategory extends TenantAwareEntity {

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "default_duration_minutes")
    private Integer defaultDurationMinutes;

    @Column(name = "price_multiplier", precision = 5, scale = 2)
    private BigDecimal priceMultiplier;

    // ========== Constructors ==========

    public ServiceCategory() {
    }

    public ServiceCategory(String name, String code) {
        this.name = name;
        this.code = code != null ? code.toLowerCase() : null;
    }

    // ========== Getters and Setters ==========

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code != null ? code.toLowerCase() : null;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getDefaultDurationMinutes() {
        return defaultDurationMinutes;
    }

    public void setDefaultDurationMinutes(Integer defaultDurationMinutes) {
        this.defaultDurationMinutes = defaultDurationMinutes;
    }

    public BigDecimal getPriceMultiplier() {
        return priceMultiplier;
    }

    public void setPriceMultiplier(BigDecimal priceMultiplier) {
        this.priceMultiplier = priceMultiplier;
    }
}
