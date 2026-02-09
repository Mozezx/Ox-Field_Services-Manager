package com.oxfield.services.domain.entity;

import jakarta.persistence.*;

import java.util.UUID;

/**
 * Entidade OrderMaterial - materiais usados em uma OS.
 */
@Entity
@Table(name = "order_materials")
public class OrderMaterial extends TenantAwareEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private ServiceOrder order;

    @Column(name = "order_id", insertable = false, updatable = false)
    private UUID orderId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "material_id", nullable = false)
    private Material material;

    @Column(name = "material_id", insertable = false, updatable = false)
    private UUID materialId;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    // ========== Constructors ==========

    public OrderMaterial() {
    }

    public OrderMaterial(Material material, Integer quantity) {
        this.material = material;
        this.quantity = quantity;
    }

    // ========== Getters and Setters ==========

    public ServiceOrder getOrder() {
        return order;
    }

    public void setOrder(ServiceOrder order) {
        this.order = order;
    }

    public UUID getOrderId() {
        return orderId;
    }

    public Material getMaterial() {
        return material;
    }

    public void setMaterial(Material material) {
        this.material = material;
    }

    public UUID getMaterialId() {
        return materialId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}
