package com.oxfield.services.domain.entity;

import jakarta.persistence.*;
import org.locationtech.jts.geom.Point;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Entidade Customer - representa um cliente que solicita serviços.
 * No modelo marketplace, o cliente é global (não pertence a um tenant específico).
 * O tenant_id é opcional e usado apenas quando o cliente faz um pedido para uma empresa.
 */
@Entity
@Table(name = "customers")
public class Customer extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "user_id", insertable = false, updatable = false)
    private UUID userId;

    @Column(name = "company_name")
    private String companyName;

    /**
     * Localização atual do cliente (opcional).
     * Usado para calcular proximidade com técnicos no marketplace.
     */
    @Column(name = "location", columnDefinition = "GEOMETRY(POINT, 4326)")
    private Point location;

    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<CustomerAddress> addresses = new ArrayList<>();

    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<PaymentMethod> paymentMethods = new ArrayList<>();

    // ========== Constructors ==========

    public Customer() {
    }

    public Customer(User user) {
        this.user = user;
        this.userId = user.getId();
    }

    // ========== Business Methods ==========

    public void addAddress(CustomerAddress address) {
        addresses.add(address);
        address.setCustomer(this);
    }

    public void removeAddress(CustomerAddress address) {
        addresses.remove(address);
        address.setCustomer(null);
    }

    public CustomerAddress getDefaultAddress() {
        return addresses.stream()
                .filter(CustomerAddress::getIsDefault)
                .findFirst()
                .orElse(addresses.isEmpty() ? null : addresses.get(0));
    }

    public void addPaymentMethod(PaymentMethod paymentMethod) {
        paymentMethods.add(paymentMethod);
        paymentMethod.setCustomer(this);
    }

    // ========== Getters and Setters ==========

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
        this.userId = user != null ? user.getId() : null;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public List<CustomerAddress> getAddresses() {
        return addresses;
    }

    public void setAddresses(List<CustomerAddress> addresses) {
        this.addresses = addresses;
    }

    public List<PaymentMethod> getPaymentMethods() {
        return paymentMethods;
    }

    public void setPaymentMethods(List<PaymentMethod> paymentMethods) {
        this.paymentMethods = paymentMethods;
    }

    public Point getLocation() {
        return location;
    }

    public void setLocation(Point location) {
        this.location = location;
    }
}
