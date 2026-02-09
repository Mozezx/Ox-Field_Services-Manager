package com.oxfield.services.shared.security;

import com.oxfield.services.domain.enums.AppType;
import com.oxfield.services.domain.enums.UserRole;
import com.oxfield.services.domain.enums.UserStatus;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.UUID;

/**
 * Detalhes do usuário extraídos do JWT para Spring Security.
 */
public class JwtUserDetails implements UserDetails {

    private final UUID userId;
    private final String email;
    private final String name;
    private final UserRole role;
    private final UserStatus status;
    private final UUID tenantId;
    private final AppType appType;

    private JwtUserDetails(Builder builder) {
        this.userId = builder.userId;
        this.email = builder.email;
        this.name = builder.name;
        this.role = builder.role;
        this.status = builder.status;
        this.tenantId = builder.tenantId;
        this.appType = builder.appType;
    }

    public static Builder builder() {
        return new Builder();
    }

    // ========== UserDetails Implementation ==========

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority(role.getAuthority()));
    }

    @Override
    public String getPassword() {
        return null; // JWT doesn't contain password
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return status != UserStatus.SUSPENDED;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return status == UserStatus.APPROVED;
    }

    // ========== Custom Getters ==========

    public UUID getUserId() {
        return userId;
    }

    public String getEmail() {
        return email;
    }

    public String getName() {
        return name;
    }

    public UserRole getRole() {
        return role;
    }

    public UserStatus getStatus() {
        return status;
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public AppType getAppType() {
        return appType;
    }

    // ========== Business Methods ==========

    /**
     * Verifica se é um técnico pendente de aprovação
     */
    public boolean isTechnicianPending() {
        return role == UserRole.TECNICO && status == UserStatus.PENDING;
    }

    /**
     * Verifica se o usuário pode acessar ordens de serviço
     */
    public boolean canAccessOrders() {
        if (role == UserRole.TECNICO) {
            return status == UserStatus.APPROVED;
        }
        return true;
    }

    // ========== Builder ==========

    public static class Builder {
        private UUID userId;
        private String email;
        private String name;
        private UserRole role;
        private UserStatus status = UserStatus.APPROVED;
        private UUID tenantId;
        private AppType appType;

        public Builder userId(UUID userId) {
            this.userId = userId;
            return this;
        }

        public Builder email(String email) {
            this.email = email;
            return this;
        }

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder role(UserRole role) {
            this.role = role;
            return this;
        }

        public Builder status(UserStatus status) {
            this.status = status;
            return this;
        }

        public Builder tenantId(UUID tenantId) {
            this.tenantId = tenantId;
            return this;
        }

        public Builder appType(AppType appType) {
            this.appType = appType;
            return this;
        }

        public JwtUserDetails build() {
            return new JwtUserDetails(this);
        }
    }
}
