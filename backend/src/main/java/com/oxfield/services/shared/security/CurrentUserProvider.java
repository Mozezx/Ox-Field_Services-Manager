package com.oxfield.services.shared.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

/**
 * Utilitário para obter o usuário atual autenticado.
 */
@Component
public class CurrentUserProvider {

    /**
     * Obtém os detalhes do usuário atual
     */
    public Optional<JwtUserDetails> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null &&
                authentication.isAuthenticated() &&
                authentication.getPrincipal() instanceof JwtUserDetails) {
            return Optional.of((JwtUserDetails) authentication.getPrincipal());
        }

        return Optional.empty();
    }

    /**
     * Obtém o ID do usuário atual
     */
    public Optional<UUID> getCurrentUserId() {
        return getCurrentUser().map(JwtUserDetails::getUserId);
    }

    /**
     * Obtém o tenant ID do usuário atual
     */
    public Optional<UUID> getCurrentTenantId() {
        return getCurrentUser().map(JwtUserDetails::getTenantId);
    }

    /**
     * Obtém o usuário atual ou lança exceção
     */
    public JwtUserDetails requireCurrentUser() {
        return getCurrentUser().orElseThrow(() -> new IllegalStateException("Nenhum usuário autenticado"));
    }
}
