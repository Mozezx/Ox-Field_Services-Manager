package com.oxfield.services.domain.entity;

import jakarta.persistence.*;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

/**
 * Join entity: a customer is registered with a tenant (company).
 * Many-to-many between Tenant and Customer.
 */
@Entity
@Table(name = "tenant_customers")
@IdClass(TenantCustomer.TenantCustomerId.class)
public class TenantCustomer {

    @Id
    @Column(name = "tenant_id", updatable = false, nullable = false)
    private UUID tenantId;

    @Id
    @Column(name = "customer_id", updatable = false, nullable = false)
    private UUID customerId;

    public TenantCustomer() {}

    public TenantCustomer(UUID tenantId, UUID customerId) {
        this.tenantId = tenantId;
        this.customerId = customerId;
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
    }

    public UUID getCustomerId() {
        return customerId;
    }

    public void setCustomerId(UUID customerId) {
        this.customerId = customerId;
    }

    public static class TenantCustomerId implements Serializable {
        private UUID tenantId;
        private UUID customerId;

        public TenantCustomerId() {}

        public TenantCustomerId(UUID tenantId, UUID customerId) {
            this.tenantId = tenantId;
            this.customerId = customerId;
        }

        public UUID getTenantId() { return tenantId; }
        public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }
        public UUID getCustomerId() { return customerId; }
        public void setCustomerId(UUID customerId) { this.customerId = customerId; }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            TenantCustomerId that = (TenantCustomerId) o;
            return Objects.equals(tenantId, that.tenantId) && Objects.equals(customerId, that.customerId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(tenantId, customerId);
        }
    }
}
