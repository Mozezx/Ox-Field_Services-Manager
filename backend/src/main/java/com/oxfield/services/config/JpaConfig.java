package com.oxfield.services.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import com.oxfield.services.shared.security.JwtUserDetails;

import java.util.Optional;
import java.util.UUID;

/**
 * Configuração JPA com suporte a auditoria.
 */
@Configuration
@EnableTransactionManagement
@EnableJpaRepositories(basePackages = "com.oxfield.services.adapter.output.persistence")
public class JpaConfig {

    /**
     * Provider de auditor para campos @CreatedBy e @LastModifiedBy
     */
    @Bean
    public AuditorAware<UUID> auditorProvider() {
        return () -> {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            if (authentication == null ||
                    !authentication.isAuthenticated() ||
                    !(authentication.getPrincipal() instanceof JwtUserDetails)) {
                return Optional.empty();
            }

            JwtUserDetails userDetails = (JwtUserDetails) authentication.getPrincipal();
            return Optional.of(userDetails.getUserId());
        };
    }
}
