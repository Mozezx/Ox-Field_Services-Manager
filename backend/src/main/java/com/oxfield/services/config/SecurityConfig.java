package com.oxfield.services.config;

import com.oxfield.services.shared.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.http.HttpServletResponse;
import java.util.Arrays;
import java.util.List;

/**
 * Configuração de segurança Spring Security 6.
 * Implementa JWT stateless com RBAC.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                // Desabilitar CSRF (não necessário para APIs stateless)
                .csrf(AbstractHttpConfigurer::disable)

                // Desabilitar form login e redirects
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)

                // Configurar CORS
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // Session management stateless
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Configurar autorização de endpoints
                // Nota: context-path /api/v1 NÃO deve ser incluído nos matchers
                // O Servlet Container aplica o context-path antes de chegar ao Spring Security
                .authorizeHttpRequests(auth -> auth
                        // ========== Endpoints Públicos ==========
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll() // Permitir preflight CORS
                        .requestMatchers("/auth/technician/**").hasRole("TECNICO") // Técnico vincular empresa (requer JWT)
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers("/public/**").permitAll()
                        .requestMatchers("/marketplace/**").permitAll() // Marketplace público
                        .requestMatchers("/geocoding/**").permitAll() // Geocoding público (para busca de endereços)
                        .requestMatchers("/actuator/health").permitAll()
                        .requestMatchers("/docs/**", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        .requestMatchers("/uploads/**").authenticated() // Documentos de técnicos (pasta local)

                        // ========== Admin Global (sem tenant) ==========
                        .requestMatchers("/admin/global/**").hasRole("ADMIN_GLOBAL")

                        // ========== Empresa (admin e gestor) ==========
                        .requestMatchers("/empresa/**").hasAnyRole("ADMIN_EMPRESA", "GESTOR")

                        // ========== Técnico ==========
                        .requestMatchers("/tech/**").hasRole("TECNICO")

                        // ========== Cliente ==========
                        .requestMatchers("/customer/**").hasRole("CLIENTE")

                        // ========== Sync (técnico mobile) ==========
                        .requestMatchers("/sync/**").hasRole("TECNICO")

                        // ========== Qualquer outro endpoint requer autenticação ==========
                        .anyRequest().authenticated())

                // Adicionar filtro JWT antes do filtro de autenticação padrão
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)

                // Desabilitar exception handling que pode causar redirects
                .exceptionHandling(ex -> ex.authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\":\"Unauthorized\"}");
                }))

                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Permitir localhost e IPs da rede local (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
        configuration.setAllowedOriginPatterns(List.of(
                "http://localhost:*", // Qualquer porta localhost
                "http://127.0.0.1:*", // Localhost IP
                "http://192.168.*.*:*", // Rede local 192.168.x.x
                "http://10.*.*.*:*", // Rede local 10.x.x.x
                "http://172.16.*.*:*", // Rede local 172.16-31.x.x
                "http://172.17.*.*:*",
                "http://172.18.*.*:*",
                "http://172.19.*.*:*",
                "http://172.20.*.*:*",
                "http://172.21.*.*:*",
                "http://172.22.*.*:*",
                "http://172.23.*.*:*",
                "http://172.24.*.*:*",
                "http://172.25.*.*:*",
                "http://172.26.*.*:*",
                "http://172.27.*.*:*",
                "http://172.28.*.*:*",
                "http://172.29.*.*:*",
                "http://172.30.*.*:*",
                "http://172.31.*.*:*",
                "https://*.oxfield.io" // Produção
        ));
        configuration.setAllowedMethods(Arrays.asList(
                "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "X-Request-ID",
                "X-Tenant-ID"));
        configuration.setExposedHeaders(List.of(
                "X-Request-ID"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
