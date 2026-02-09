package com.oxfield.services.shared.security;

import com.oxfield.services.domain.enums.AppType;
import com.oxfield.services.shared.exception.AppTypeMismatchException;
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
 * Aspect que valida se o token JWT foi gerado para o aplicativo correto.
 * Previne que tokens do app técnico sejam usados no app cliente e vice-versa.
 */
@Aspect
@Component
public class AppTypeGuard {

    private static final Logger log = LoggerFactory.getLogger(AppTypeGuard.class);

    /**
     * Intercepta métodos anotados com @RequiresTechApp
     */
    @Before("@annotation(com.oxfield.services.shared.security.AppTypeGuard.RequiresTechApp)")
    public void validateTechApp() {
        validateAppType(AppType.TECH_APP, "Este endpoint requer o aplicativo do Técnico");
    }

    /**
     * Intercepta métodos anotados com @RequiresClientApp
     */
    @Before("@annotation(com.oxfield.services.shared.security.AppTypeGuard.RequiresClientApp)")
    public void validateClientApp() {
        validateAppType(AppType.CLIENT_APP, "Este endpoint requer o aplicativo do Cliente");
    }

    /**
     * Intercepta métodos anotados com @RequiresEmpresaWeb
     */
    @Before("@annotation(com.oxfield.services.shared.security.AppTypeGuard.RequiresEmpresaWeb)")
    public void validateEmpresaWeb() {
        validateAppType(AppType.EMPRESA_WEB, "Este endpoint requer o portal da Empresa");
    }

    private void validateAppType(AppType requiredAppType, String errorMessage) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !(authentication.getPrincipal() instanceof JwtUserDetails)) {
            log.warn("AppTypeGuard: No authentication found");
            throw new AppTypeMismatchException(errorMessage);
        }

        JwtUserDetails userDetails = (JwtUserDetails) authentication.getPrincipal();

        if (userDetails.getAppType() != requiredAppType) {
            log.warn("AppTypeGuard: Expected {} but got {}",
                    requiredAppType, userDetails.getAppType());
            throw new AppTypeMismatchException(
                    String.format("%s. Você está usando: %s",
                            errorMessage, userDetails.getAppType()));
        }
    }

    // ========== Annotations ==========

    /**
     * Requer que o token seja do aplicativo do Técnico
     */
    @Target(ElementType.METHOD)
    @Retention(RetentionPolicy.RUNTIME)
    public @interface RequiresTechApp {
    }

    /**
     * Requer que o token seja do aplicativo do Cliente
     */
    @Target(ElementType.METHOD)
    @Retention(RetentionPolicy.RUNTIME)
    public @interface RequiresClientApp {
    }

    /**
     * Requer que o token seja do portal da Empresa
     */
    @Target(ElementType.METHOD)
    @Retention(RetentionPolicy.RUNTIME)
    public @interface RequiresEmpresaWeb {
    }
}
