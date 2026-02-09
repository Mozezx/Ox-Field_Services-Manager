package com.oxfield.services.domain.entity;

import jakarta.persistence.*;
import org.locationtech.jts.geom.Point;

import java.time.Instant;
import java.util.UUID;

/**
 * Entidade OrderPhoto - fotos de evidência da OS.
 */
@Entity
@Table(name = "order_photos")
public class OrderPhoto extends TenantAwareEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private ServiceOrder order;

    @Column(name = "order_id", insertable = false, updatable = false)
    private UUID orderId;

    @Column(name = "file_url", nullable = false)
    private String fileUrl;

    @Column(name = "caption")
    private String caption;

    @Column(name = "taken_at")
    private Instant takenAt = Instant.now();

    /**
     * Localização onde a foto foi tirada (PostGIS)
     */
    @Column(name = "location", columnDefinition = "GEOMETRY(POINT, 4326)")
    private Point location;

    // ========== Constructors ==========

    public OrderPhoto() {
    }

    public OrderPhoto(String fileUrl, String caption) {
        this.fileUrl = fileUrl;
        this.caption = caption;
    }

    // ========== Business Methods ==========

    public boolean isBeforePhoto() {
        return caption != null && caption.toUpperCase().contains("BEFORE");
    }

    public boolean isAfterPhoto() {
        return caption != null && caption.toUpperCase().contains("AFTER");
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

    public String getFileUrl() {
        return fileUrl;
    }

    public void setFileUrl(String fileUrl) {
        this.fileUrl = fileUrl;
    }

    public String getCaption() {
        return caption;
    }

    public void setCaption(String caption) {
        this.caption = caption;
    }

    public Instant getTakenAt() {
        return takenAt;
    }

    public void setTakenAt(Instant takenAt) {
        this.takenAt = takenAt;
    }

    public Point getLocation() {
        return location;
    }

    public void setLocation(Point location) {
        this.location = location;
    }
}
