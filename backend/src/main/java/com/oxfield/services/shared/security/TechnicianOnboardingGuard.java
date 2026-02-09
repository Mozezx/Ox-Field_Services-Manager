package com.oxfield.services.shared.security;

import com.oxfield.services.domain.enums.UserRole;
import com.oxfield.services.domain.enums.UserStatus;
import com.oxfield.services.shared.exception.TechnicianNotApprovedException;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Guard que bloqueia técnicos com status PENDING de acessar funcionalidades de
 * OS.
 * Usado para implementar o fluxo de onboarding onde documentos precisam ser
 * validados.
 */
@Aspect
@Component
public class TechnicianOnboardingGuard {

    private static final Logger log = LoggerFactory.getLogger(TechnicianOnboardingGuard.class);

    /**
     * Intercepta métodos anotados com @RequiresApprovedTechnician
     */
    @Before("@annotation(com.oxfield.services.shared.security.TechnicianOnboardingGuard.RequiresApprovedTechnician)")
    public void validateTechnicianApproval() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !(authentication.getPrincipal() instanceof JwtUserDetails)) {
            return; // Será tratado pelo Spring Security
        }

        JwtUserDetails userDetails = (JwtUserDetails) authentication.getPrincipal();

        // Só valida se for técnico
        if (userDetails.getRole() != UserRole.TECNICO) {
            return;
        }

        // Verifica status
        if (userDetails.getStatus() == UserStatus.PENDING) {
            log.warn("Technician {} attempted to access restricted resource while PENDING",
                    userDetails.getEmail());
            throw new TechnicianNotApprovedException(
                    "Sua conta está pendente de aprovação. " +
                            "Aguarde a validação dos seus documentos por um gestor.");
        }

        if (userDetails.getStatus() == UserStatus.REJECTED) {
            log.warn("Technician {} attempted to access restricted resource while REJECTED",
                    userDetails.getEmail());
            throw new TechnicianNotApprovedException(
                    "Sua conta foi rejeitada. Entre em contato com o suporte.");
        }

        if (userDetails.getStatus() == UserStatus.SUSPENDED) {
            log.warn("Technician {} attempted to access restricted resource while SUSPENDED",
                    userDetails.getEmail());
            throw new TechnicianNotApprovedException(
                    "Sua conta está suspensa. Entre em contato com o suporte.");
        }
    }

    // ========== Annotation ==========

    /**
     * Requer que o técnico tenha status APPROVED para acessar o método
     */
    @Target(ElementType.METHOD)
    @Retention(RetentionPolicy.RUNTIME)
    public @interface RequiresApprovedTechnician {
    }
}
