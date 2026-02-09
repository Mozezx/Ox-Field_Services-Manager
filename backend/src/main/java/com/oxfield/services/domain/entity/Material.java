package com.oxfield.services.domain.entity;

import com.oxfield.services.domain.enums.MaterialCategory;
import jakarta.persistence.*;

import java.math.BigDecimal;

/**
 * Entidade Material - itens de inventário/estoque.
 */
@Entity
@Table(name = "materials", uniqueConstraints = @UniqueConstraint(columnNames = { "tenant_id", "sku" }))
public class Material extends TenantAwareEntity {

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "sku", nullable = false, length = 50)
    private String sku;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    private MaterialCategory category;

    @Column(name = "stock_quantity")
    private Integer stockQuantity = 0;

    @Column(name = "unit_price", precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "image_url")
    private String imageUrl;

    // ========== Constructors ==========

    public Material() {
    }

    public Material(String name, String sku, MaterialCategory category) {
        this.name = name;
        this.sku = sku;
        this.category = category;
    }

    // ========== Business Methods ==========

    /**
     * Verifica se há estoque suficiente
     */
    public boolean hasStock(int quantity) {
        return stockQuantity >= quantity;
    }

    /**
     * Reduz estoque
     */
    public void reduceStock(int quantity) {
        if (!hasStock(quantity)) {
            throw new IllegalStateException("Estoque insuficiente para " + name);
        }
        this.stockQuantity -= quantity;
    }

    /**
     * Adiciona estoque
     */
    public void addStock(int quantity) {
        this.stockQuantity += quantity;
    }

    /**
     * Calcula valor total de um quantidade
     */
    public BigDecimal calculateTotal(int quantity) {
        return unitPrice.multiply(BigDecimal.valueOf(quantity));
    }

    // ========== Getters and Setters ==========

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public MaterialCategory getCategory() {
        return category;
    }

    public void setCategory(MaterialCategory category) {
        this.category = category;
    }

    public Integer getStockQuantity() {
        return stockQuantity;
    }

    public void setStockQuantity(Integer stockQuantity) {
        this.stockQuantity = stockQuantity;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}
