package com.oxfield.services.domain.entity;

import jakarta.persistence.*;

import java.util.UUID;

/**
 * Entidade OrderMessage - mensagens de chat na OS.
 */
@Entity
@Table(name = "order_messages")
public class OrderMessage extends TenantAwareEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private ServiceOrder order;

    @Column(name = "order_id", insertable = false, updatable = false)
    private UUID orderId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Column(name = "sender_id", insertable = false, updatable = false)
    private UUID senderId;

    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;

    // ========== Constructors ==========

    public OrderMessage() {
    }

    public OrderMessage(User sender, String message) {
        this.sender = sender;
        this.message = message;
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

    public User getSender() {
        return sender;
    }

    public void setSender(User sender) {
        this.sender = sender;
    }

    public UUID getSenderId() {
        return senderId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
