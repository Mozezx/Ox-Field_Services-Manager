package com.oxfield.services.domain.entity;

import com.oxfield.services.domain.enums.PaymentType;
import jakarta.persistence.*;

/**
 * Entidade PaymentMethod - métodos de pagamento do cliente.
 */
@Entity
@Table(name = "payment_methods")
public class PaymentMethod extends TenantAwareEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private PaymentType type;

    @Column(name = "last_four", length = 4)
    private String lastFour;

    @Column(name = "brand", length = 50)
    private String brand;

    @Column(name = "expires_at", length = 7)
    private String expiresAt;

    @Column(name = "is_default")
    private Boolean isDefault = false;

    @Column(name = "provider_token")
    private String providerToken;

    // ========== Constructors ==========

    public PaymentMethod() {
    }

    public PaymentMethod(PaymentType type) {
        this.type = type;
    }

    // ========== Business Methods ==========

    public String getMaskedNumber() {
        return "**** **** **** " + lastFour;
    }

    public void setAsDefault() {
        this.isDefault = true;
    }

    // ========== Getters and Setters ==========

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(Customer customer) {
        this.customer = customer;
    }

    public PaymentType getType() {
        return type;
    }

    public void setType(PaymentType type) {
        this.type = type;
    }

    public String getLastFour() {
        return lastFour;
    }

    public void setLastFour(String lastFour) {
        this.lastFour = lastFour;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(String expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Boolean getIsDefault() {
        return isDefault;
    }

    public void setIsDefault(Boolean isDefault) {
        this.isDefault = isDefault;
    }

    public String getProviderToken() {
        return providerToken;
    }

    public void setProviderToken(String providerToken) {
        this.providerToken = providerToken;
    }
}
