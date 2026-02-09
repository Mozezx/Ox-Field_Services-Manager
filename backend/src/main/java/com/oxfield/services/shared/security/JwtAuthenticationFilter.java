package com.oxfield.services.shared.security;

import com.oxfield.services.domain.enums.AppType;
import com.oxfield.services.shared.multitenancy.TenantContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Filtro JWT que autentica requests e configura o SecurityContext.
 * Também configura o TenantContext para multitenancy.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtTokenProvider jwtTokenProvider;

    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        // Pular autenticação JWT para endpoints públicos
        // Nota: /auth/technician/** exige JWT (técnico vincular empresa)
        String path = request.getRequestURI();
        boolean isPublicAuth = path.startsWith("/auth/") && !path.startsWith("/auth/technician/");
        if (isPublicAuth ||
                path.startsWith("/public/") ||
                path.startsWith("/actuator/") ||
                path.startsWith("/docs/") ||
                path.startsWith("/swagger-ui/") ||
                path.startsWith("/v3/api-docs/")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String token = extractTokenFromRequest(request);

            if (StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)) {
                // Extrair detalhes do usuário
                JwtUserDetails userDetails = jwtTokenProvider.extractUserDetails(token);

                // Configurar TenantContext
                if (userDetails.getTenantId() != null) {
                    TenantContext.setCurrentTenantId(userDetails.getTenantId());
                }

                // Criar authentication token
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities());

                authentication.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request));

                // Configurar SecurityContext
                SecurityContextHolder.getContext().setAuthentication(authentication);

                log.debug("User authenticated: {} with role: {}",
                        userDetails.getEmail(), userDetails.getRole());
            }
        } catch (Exception e) {
            log.error("Could not set user authentication in security context", e);
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            // Limpar contextos
            TenantContext.clear();
        }
    }

    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
