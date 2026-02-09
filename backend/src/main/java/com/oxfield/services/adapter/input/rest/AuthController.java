package com.oxfield.services.adapter.input.rest;

import com.oxfield.services.adapter.input.dto.request.LoginRequest;
import com.oxfield.services.adapter.input.dto.request.RedeemInviteRequest;
import com.oxfield.services.adapter.input.dto.request.RefreshTokenRequest;
import com.oxfield.services.adapter.input.dto.request.RegisterClientRequest;
import com.oxfield.services.adapter.input.dto.request.RegisterCompanyRequest;
import com.oxfield.services.adapter.input.dto.request.RegisterTechnicianRequest;
import com.oxfield.services.adapter.input.dto.response.AuthResponse;
import com.oxfield.services.adapter.input.dto.response.TechnicianRegistrationResponse;
import com.oxfield.services.application.service.AuthService;
import com.oxfield.services.shared.security.CurrentUserProvider;
import com.oxfield.services.shared.security.JwtUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Controller de autenticação.
 * Endpoints públicos para login e registro.
 */
@RestController
@RequestMapping("/auth")
@Tag(name = "Authentication", description = "Endpoints de autenticação")
public class AuthController {

    private final AuthService authService;
    private final CurrentUserProvider currentUserProvider;

    public AuthController(AuthService authService, CurrentUserProvider currentUserProvider) {
        this.authService = authService;
        this.currentUserProvider = currentUserProvider;
    }

    /**
     * Login de usuário
     */
    @PostMapping("/login")
    @Operation(summary = "Login", description = "Autentica usuário e retorna tokens JWT")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Registro de técnico
     * Retorna status PENDING (precisa aprovação)
     */
    @PostMapping("/register/tech")
    @Operation(summary = "Registro de Técnico", description = "Cria conta de técnico com status PENDING")
    public ResponseEntity<TechnicianRegistrationResponse> registerTechnician(
            @Valid @RequestBody RegisterTechnicianRequest request) {
        TechnicianRegistrationResponse response = authService.registerTechnician(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Registro de cliente
     * Retorna tokens (login automático)
     */
    @PostMapping("/register/client")
    @Operation(summary = "Registro de Cliente", description = "Cria conta de cliente e retorna tokens JWT")
    public ResponseEntity<AuthResponse> registerClient(
            @Valid @RequestBody RegisterClientRequest request) {
        AuthResponse response = authService.registerClient(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Registro de empresa
     * Cria um novo tenant e usuário administrador, retorna tokens
     */
    @PostMapping("/register/company")
    @Operation(summary = "Registro de Empresa", description = "Cria conta de empresa (tenant) e usuário administrador, retorna tokens JWT")
    public ResponseEntity<AuthResponse> registerCompany(
            @Valid @RequestBody RegisterCompanyRequest request) {
        AuthResponse response = authService.registerCompany(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Renovar access token
     */
    @PostMapping("/refresh")
    @Operation(summary = "Refresh Token", description = "Renova access token usando refresh token")
    public ResponseEntity<AuthResponse> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request.refreshToken());
        return ResponseEntity.ok(response);
    }

    /**
     * Obter dados do usuário autenticado
     */
    @GetMapping("/me")
    @Operation(summary = "Usuário Atual", description = "Retorna dados do usuário autenticado")
    public ResponseEntity<AuthResponse.UserInfo> getCurrentUser() {
        JwtUserDetails userDetails = currentUserProvider.requireCurrentUser();
        AuthResponse.UserInfo user = authService.getCurrentUser(userDetails.getUserId());
        return ResponseEntity.ok(user);
    }

    /**
     * Vincular técnico (sem empresa) a uma empresa via código de convite.
     * Requer autenticação como TECNICO. Retorna novos tokens com tenant.
     */
    @PostMapping("/technician/redeem-invite")
    @PreAuthorize("hasRole('TECNICO')")
    @Operation(summary = "Redeem invite", description = "Links the technician to a company using an invite token. Returns new tokens with tenant.")
    public ResponseEntity<AuthResponse> redeemInvite(@Valid @RequestBody RedeemInviteRequest request) {
        JwtUserDetails userDetails = currentUserProvider.requireCurrentUser();
        AuthResponse response = authService.redeemTechnicianInvite(userDetails.getUserId(), request.inviteToken());
        return ResponseEntity.ok(response);
    }

    /**
     * Logout (invalidar tokens)
     */
    @PostMapping("/logout")
    @Operation(summary = "Logout", description = "Invalida tokens do usuário")
    public ResponseEntity<Void> logout() {
        // TODO: Implementar blacklist de tokens no Redis
        return ResponseEntity.noContent().build();
    }
}
