package com.oxfield.services.domain.entity;

import jakarta.persistence.*;
import org.locationtech.jts.geom.Point;

/**
 * Entidade CustomerAddress - endereços do cliente.
 * Utiliza PostGIS Point para coordenadas geográficas.
 * No modelo marketplace, endereços pertencem ao cliente global (sem tenant).
 */
@Entity
@Table(name = "customer_addresses")
public class CustomerAddress extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "label", nullable = false, length = 100)
    private String label;

    @Column(name = "street", nullable = false)
    private String street;

    @Column(name = "city", nullable = false, length = 100)
    private String city;

    @Column(name = "state", nullable = false, length = 50)
    private String state;

    @Column(name = "postal_code", nullable = false, length = 20)
    private String postalCode;

    @Column(name = "country", length = 50)
    private String country = "Brasil";

    /**
     * Coordenadas geográficas (PostGIS GEOMETRY POINT)
     * SRID 4326 = WGS84 (padrão GPS)
     */
    @Column(name = "location", columnDefinition = "GEOMETRY(POINT, 4326)")
    private Point location;

    @Column(name = "is_default")
    private Boolean isDefault = false;

    // ========== Constructors ==========

    public CustomerAddress() {
    }

    public CustomerAddress(String label, String street, String city, String state, String postalCode) {
        this.label = label;
        this.street = street;
        this.city = city;
        this.state = state;
        this.postalCode = postalCode;
    }

    // ========== Business Methods ==========

    public String getFullAddress() {
        if (street == null && city == null && state == null && postalCode == null) {
            return "";
        }
        return String.format("%s, %s, %s - %s",
                street != null ? street : "",
                city != null ? city : "",
                state != null ? state : "",
                postalCode != null ? postalCode : "");
    }

    public void setAsDefault() {
        this.isDefault = true;
    }

    public void removeDefault() {
        this.isDefault = false;
    }

    // ========== Getters and Setters ==========

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(Customer customer) {
        this.customer = customer;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getStreet() {
        return street;
    }

    public void setStreet(String street) {
        this.street = street;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getPostalCode() {
        return postalCode;
    }

    public void setPostalCode(String postalCode) {
        this.postalCode = postalCode;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public Point getLocation() {
        return location;
    }

    public void setLocation(Point location) {
        this.location = location;
    }

    public Boolean getIsDefault() {
        return isDefault;
    }

    public void setIsDefault(Boolean isDefault) {
        this.isDefault = isDefault;
    }
}
