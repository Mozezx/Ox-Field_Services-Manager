package com.oxfield.services.domain.entity;

import jakarta.persistence.*;
import org.locationtech.jts.geom.Point;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Entidade Technician - representa um técnico de campo.
 * Possui localização geográfica (PostGIS) e habilidades.
 */
@Entity
@Table(name = "technicians")
public class Technician extends TenantAwareEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "user_id", insertable = false, updatable = false)
    private UUID userId;

    @Column(name = "internal_code", length = 50)
    private String internalCode;

    @Column(name = "role_title", length = 100)
    private String roleTitle;

    /**
     * Habilidades do técnico (HVAC, Electrical, Plumbing, etc.)
     * Armazenado como ARRAY de TEXT no PostgreSQL
     */
    @Column(name = "skills", columnDefinition = "TEXT[]")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.ARRAY)
    private List<String> skills = new ArrayList<>();

    @Column(name = "rating", precision = 2, scale = 1)
    private BigDecimal rating = new BigDecimal("5.0");

    @Column(name = "is_online")
    private Boolean isOnline = false;

    /**
     * Localização atual do técnico (PostGIS GEOMETRY POINT)
     * SRID 4326 = WGS84 (lat/lng padrão GPS)
     */
    @Column(name = "current_location", columnDefinition = "GEOMETRY(POINT, 4326)")
    private Point currentLocation;

    @Column(name = "vehicle_model", length = 100)
    private String vehicleModel;

    @Column(name = "vehicle_plate", length = 20)
    private String vehiclePlate;

    // ========== Constructors ==========

    public Technician() {}

    public Technician(User user) {
        this.user = user;
        this.userId = user.getId();
    }

    // ========== Business Methods ==========

    /**
     * Verifica se o técnico possui pelo menos uma das habilidades requeridas
     */
    public boolean hasAnySkill(Set<String> requiredSkills) {
        if (skills == null || skills.isEmpty()) {
            return false;
        }
        return skills.stream()
            .anyMatch(skill -> requiredSkills.stream()
                .anyMatch(required -> required.equalsIgnoreCase(skill)));
    }

    /**
     * Verifica se o técnico possui todas as habilidades requeridas
     */
    public boolean hasAllSkills(Set<String> requiredSkills) {
        if (skills == null || skills.isEmpty()) {
            return false;
        }
        return requiredSkills.stream()
            .allMatch(required -> skills.stream()
                .anyMatch(skill -> skill.equalsIgnoreCase(required)));
    }

    public void goOnline() {
        this.isOnline = true;
    }

    public void goOffline() {
        this.isOnline = false;
    }

    public void updateLocation(Point location) {
        this.currentLocation = location;
    }

    public void addSkill(String skill) {
        if (this.skills == null) {
            this.skills = new ArrayList<>();
        }
        if (!this.skills.contains(skill.toLowerCase())) {
            this.skills.add(skill.toLowerCase());
        }
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

    public String getInternalCode() {
        return internalCode;
    }

    public void setInternalCode(String internalCode) {
        this.internalCode = internalCode;
    }

    public String getRoleTitle() {
        return roleTitle;
    }

    public void setRoleTitle(String roleTitle) {
        this.roleTitle = roleTitle;
    }

    public List<String> getSkills() {
        return skills;
    }

    public void setSkills(List<String> skills) {
        this.skills = skills;
    }

    public BigDecimal getRating() {
        return rating;
    }

    public void setRating(BigDecimal rating) {
        this.rating = rating;
    }

    public Boolean getIsOnline() {
        return isOnline;
    }

    public void setIsOnline(Boolean isOnline) {
        this.isOnline = isOnline;
    }

    public Point getCurrentLocation() {
        return currentLocation;
    }

    public void setCurrentLocation(Point currentLocation) {
        this.currentLocation = currentLocation;
    }

    public String getVehicleModel() {
        return vehicleModel;
    }

    public void setVehicleModel(String vehicleModel) {
        this.vehicleModel = vehicleModel;
    }

    public String getVehiclePlate() {
        return vehiclePlate;
    }

    public void setVehiclePlate(String vehiclePlate) {
        this.vehiclePlate = vehiclePlate;
    }
}
