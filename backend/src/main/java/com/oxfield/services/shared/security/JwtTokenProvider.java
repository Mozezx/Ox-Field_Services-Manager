package com.oxfield.services.shared.security;

import com.oxfield.services.domain.enums.AppType;
import com.oxfield.services.domain.enums.UserRole;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

/**
 * Provider para geração e validação de tokens JWT.
 * Suporta claims customizados: tenantId, appType, role.
 */
@Component
public class JwtTokenProvider {

    private static final Logger log = LoggerFactory.getLogger(JwtTokenProvider.class);

    private final SecretKey key;
    private final Duration accessTokenExpiry;
    private final Duration refreshTokenExpiry;
    private final String issuer;

    public JwtTokenProvider(
            @Value("${security.jwt.secret:Y2hhbmdlLXRoaXMtaW4tcHJvZHVjdGlvbi0yNTZiaXRz}") String secret,
            @Value("${security.jwt.access-token-expiry:15m}") Duration accessTokenExpiry,
            @Value("${security.jwt.refresh-token-expiry:7d}") Duration refreshTokenExpiry,
            @Value("${security.jwt.issuer:ox-field-services}") String issuer) {
        this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
        this.accessTokenExpiry = accessTokenExpiry;
        this.refreshTokenExpiry = refreshTokenExpiry;
        this.issuer = issuer;
    }

    /**
     * Gera um access token JWT
     */
    public String generateAccessToken(JwtUserDetails userDetails) {
        Instant now = Instant.now();
        Instant expiry = now.plus(accessTokenExpiry);

        return Jwts.builder()
                .subject(userDetails.getUserId().toString())
                .issuer(issuer)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .claim("email", userDetails.getEmail())
                .claim("name", userDetails.getName())
                .claim("role", userDetails.getRole().name())
                .claim("tenantId", userDetails.getTenantId() != null ? userDetails.getTenantId().toString() : null)
                .claim("appType", userDetails.getAppType().name())
                .claim("tokenType", "ACCESS")
                .signWith(key)
                .compact();
    }

    /**
     * Gera um refresh token JWT
     */
    public String generateRefreshToken(JwtUserDetails userDetails) {
        Instant now = Instant.now();
        Instant expiry = now.plus(refreshTokenExpiry);

        return Jwts.builder()
                .subject(userDetails.getUserId().toString())
                .issuer(issuer)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .claim("tenantId", userDetails.getTenantId() != null ? userDetails.getTenantId().toString() : null)
                .claim("tokenType", "REFRESH")
                .signWith(key)
                .compact();
    }

    /**
     * Valida um token JWT
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("Token expirado: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.warn("Token não suportado: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            log.warn("Token malformado: {}", e.getMessage());
        } catch (SecurityException e) {
            log.warn("Assinatura inválida: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.warn("Token vazio: {}", e.getMessage());
        }
        return false;
    }

    /**
     * Extrai as claims de um token
     */
    public Claims getClaimsFromToken(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Extrai o user ID do token
     */
    public UUID getUserIdFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        return UUID.fromString(claims.getSubject());
    }

    /**
     * Extrai o tenant ID do token
     */
    public UUID getTenantIdFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        String tenantId = claims.get("tenantId", String.class);
        return tenantId != null ? UUID.fromString(tenantId) : null;
    }

    /**
     * Extrai o role do token
     */
    public UserRole getRoleFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        String role = claims.get("role", String.class);
        return UserRole.valueOf(role);
    }

    /**
     * Extrai o appType do token
     */
    public AppType getAppTypeFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        String appType = claims.get("appType", String.class);
        return AppType.valueOf(appType);
    }

    /**
     * Extrai o email do token
     */
    public String getEmailFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        return claims.get("email", String.class);
    }

    /**
     * Verifica se é um refresh token
     */
    public boolean isRefreshToken(String token) {
        Claims claims = getClaimsFromToken(token);
        String tokenType = claims.get("tokenType", String.class);
        return "REFRESH".equals(tokenType);
    }

    /**
     * Extrai JwtUserDetails do token
     */
    public JwtUserDetails extractUserDetails(String token) {
        Claims claims = getClaimsFromToken(token);

        return JwtUserDetails.builder()
                .userId(UUID.fromString(claims.getSubject()))
                .email(claims.get("email", String.class))
                .name(claims.get("name", String.class))
                .role(UserRole.valueOf(claims.get("role", String.class)))
                .tenantId(claims.get("tenantId", String.class) != null
                        ? UUID.fromString(claims.get("tenantId", String.class))
                        : null)
                .appType(AppType.valueOf(claims.get("appType", String.class)))
                .build();
    }
}
