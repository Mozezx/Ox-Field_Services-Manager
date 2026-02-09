package com.oxfield.services.domain.entity;

import com.oxfield.services.domain.enums.UserRole;
import com.oxfield.services.domain.enums.UserStatus;
import jakarta.persistence.*;

import java.util.UUID;

/**
 * Entidade User - representa um usuário do sistema.
 * Possui diferentes roles (admin, gestor, técnico, cliente).
 * 
 * No modelo marketplace, clientes podem ter tenant_id nulo (usuários globais),
 * enquanto técnicos e gestores sempre pertencem a um tenant específico.
 */
@Entity
@Table(
    name = "users",
    uniqueConstraints = @UniqueConstraint(columnNames = {"tenant_id", "email"})
)
public class User extends BaseEntity {

    /**
     * Tenant ao qual o usuário pertence.
     * Nullable para clientes do marketplace (usuários globais).
     * Obrigatório para técnicos e gestores.
     */
    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "name", nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private UserRole role;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private UserStatus status = UserStatus.PENDING;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "language", length = 10)
    private String language = "pt-BR";

    @Column(name = "theme", length = 20)
    private String theme = "dark";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", insertable = false, updatable = false)
    private Tenant tenant;

    // ========== Constructors ==========

    public User() {}

    public User(String email, String name, UserRole role) {
        this.email = email;
        this.name = name;
        this.role = role;
    }

    // ========== Business Methods ==========

    public boolean isApproved() {
        return this.status == UserStatus.APPROVED;
    }

    public boolean isPending() {
        return this.status == UserStatus.PENDING;
    }

    public boolean canAccessOrders() {
        // Técnicos pendentes não podem acessar ordens
        if (this.role == UserRole.TECNICO && !isApproved()) {
            return false;
        }
        return true;
    }

    public void approve() {
        this.status = UserStatus.APPROVED;
    }

    public void reject() {
        this.status = UserStatus.REJECTED;
    }

    public void suspend() {
        this.status = UserStatus.SUSPENDED;
    }

    // ========== Getters and Setters ==========

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public UserStatus getStatus() {
        return status;
    }

    public void setStatus(UserStatus status) {
        this.status = status;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getTheme() {
        return theme;
    }

    public void setTheme(String theme) {
        this.theme = theme;
    }

    public Tenant getTenant() {
        return tenant;
    }

    public void setTenant(Tenant tenant) {
        this.tenant = tenant;
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
    }

    /**
     * Verifica se o usuário é global (sem tenant - clientes do marketplace)
     */
    public boolean isGlobalUser() {
        return this.tenantId == null;
    }
}
