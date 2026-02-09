package com.oxfield.services.application.service;

import com.oxfield.services.adapter.input.dto.request.LoginRequest;
import com.oxfield.services.adapter.input.dto.request.RegisterClientRequest;
import com.oxfield.services.adapter.input.dto.request.RegisterCompanyRequest;
import com.oxfield.services.adapter.input.dto.request.RegisterTechnicianRequest;
import com.oxfield.services.adapter.input.dto.response.AuthResponse;
import com.oxfield.services.adapter.input.dto.response.TechnicianRegistrationResponse;
import com.oxfield.services.adapter.output.persistence.CustomerRepository;
import com.oxfield.services.adapter.output.persistence.TechnicianInviteRepository;
import com.oxfield.services.adapter.output.persistence.TechnicianRepository;
import com.oxfield.services.adapter.output.persistence.TenantRepository;
import com.oxfield.services.adapter.output.persistence.UserRepository;
import com.oxfield.services.domain.entity.Customer;
import com.oxfield.services.domain.entity.Technician;
import com.oxfield.services.domain.entity.TechnicianInvite;
import com.oxfield.services.domain.entity.Tenant;
import com.oxfield.services.domain.entity.User;
import com.oxfield.services.domain.enums.AppType;
import com.oxfield.services.domain.enums.InviteStatus;
import com.oxfield.services.domain.enums.TenantStatus;
import com.oxfield.services.domain.enums.UserRole;
import com.oxfield.services.domain.enums.UserStatus;
import com.oxfield.services.shared.exception.BusinessException;
import com.oxfield.services.shared.exception.ErrorCode;
import com.oxfield.services.shared.multitenancy.TenantContext;
import com.oxfield.services.shared.security.JwtTokenProvider;
import com.oxfield.services.shared.security.JwtUserDetails;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Serviço de autenticação.
 * Gerencia login, registro e renovação de tokens.
 */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final long ACCESS_TOKEN_EXPIRY_SECONDS = 15 * 60; // 15 minutos

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final TechnicianInviteRepository technicianInviteRepository;
    private final TechnicianRepository technicianRepository;
    private final CustomerRepository customerRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            UserRepository userRepository,
            TenantRepository tenantRepository,
            TechnicianInviteRepository technicianInviteRepository,
            TechnicianRepository technicianRepository,
            CustomerRepository customerRepository,
            JwtTokenProvider jwtTokenProvider,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.tenantRepository = tenantRepository;
        this.technicianInviteRepository = technicianInviteRepository;
        this.technicianRepository = technicianRepository;
        this.customerRepository = customerRepository;
        this.jwtTokenProvider = jwtTokenProvider;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Login de usuário.
     * Para clientes do marketplace, tenantDomain é opcional (usuários globais).
     */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        log.info("Login attempt for email: {} on domain: {}", request.email(), request.tenantDomain());

        // Para clientes do marketplace, permitir login sem tenant
        if (request.appType() == AppType.CLIENT_APP && 
            (request.tenantDomain() == null || request.tenantDomain().isBlank())) {
            return loginGlobalClient(request);
        }

        // Para técnicos sem empresa vinculada, permitir login sem domínio
        if (request.appType() == AppType.TECH_APP && 
            (request.tenantDomain() == null || request.tenantDomain().isBlank())) {
            return loginGlobalTechnician(request);
        }

        // Para outros app types, tenantDomain é obrigatório
        if (request.tenantDomain() == null || request.tenantDomain().isBlank()) {
            throw new BusinessException(
                    ErrorCode.VALIDATION_ERROR,
                    "Domínio do tenant é obrigatório para este tipo de login.");
        }

        // 1. Buscar tenant pelo domínio
        Tenant tenant = tenantRepository.findByDomain(request.tenantDomain().trim())
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.TENANT_NOT_FOUND,
                        "Tenant não encontrado para o domínio: " + request.tenantDomain()));

        // 2. Verificar se tenant está ativo
        if (!tenant.isActive()) {
            throw new BusinessException(
                    ErrorCode.TENANT_SUSPENDED,
                    "Este tenant está suspenso. Entre em contato com o suporte.");
        }

        // 3. Buscar usuário pelo email E tenant
        User user = userRepository.findByEmailAndTenantId(request.email(), tenant.getId())
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.AUTH_INVALID_CREDENTIALS,
                        "Email ou senha inválidos"));

        if (user.getRole() == null || user.getStatus() == null) {
            log.error("User {} has null role or status", user.getId());
            throw new BusinessException(
                    ErrorCode.INTERNAL_ERROR,
                    "Dados do usuário incompletos. Entre em contato com o suporte.");
        }

        // 4. Verificar senha
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BusinessException(
                    ErrorCode.AUTH_INVALID_CREDENTIALS,
                    "Email ou senha inválidos");
        }

        // 5. Validar appType vs role
        validateAppTypeForRole(request.appType(), user.getRole());

        // 6. Verificar status do usuário
        validateUserStatus(user, request.appType());

        // 7. Gerar tokens
        return generateAuthResponse(user, tenant, request.appType());
    }

    /**
     * Login de cliente global (marketplace - sem tenant).
     * Aceita primeiro usuário com tenant_id IS NULL; se não houver, aceita qualquer usuário CLIENTE com o email (fallback para dados de seed).
     */
    private AuthResponse loginGlobalClient(LoginRequest request) {
        log.info("Login attempt for global client: {}", request.email());

        // 1. Buscar usuário: primeiro global (tenant_id IS NULL), senão primeiro CLIENTE com esse email
        User user = userRepository.findGlobalUserByEmail(request.email())
                .or(() -> userRepository.findFirstByEmailAndRole(request.email(), UserRole.CLIENTE))
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.AUTH_INVALID_CREDENTIALS,
                        "Email ou senha inválidos"));

        // 2. Verificar senha
        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BusinessException(
                    ErrorCode.AUTH_INVALID_CREDENTIALS,
                    "Email ou senha inválidos");
        }

        // 3. Validar role (deve ser CLIENTE)
        if (user.getRole() != UserRole.CLIENTE) {
            throw new BusinessException(
                    ErrorCode.AUTH_WRONG_APP_TYPE,
                    "Este aplicativo não é compatível com seu perfil.");
        }

        // 4. Verificar status
        validateUserStatus(user, request.appType());

        // 5. Gerar tokens (sem tenant para uso no app cliente)
        return generateAuthResponseForGlobalUser(user, request.appType());
    }

    /**
     * Login de técnico global (sem empresa vinculada - tenant_id IS NULL).
     */
    private AuthResponse loginGlobalTechnician(LoginRequest request) {
        log.info("Login attempt for global technician: {}", request.email());

        User user = userRepository.findGlobalTechnicianByEmail(request.email())
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.AUTH_INVALID_CREDENTIALS,
                        "Email ou senha inválidos"));

        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BusinessException(
                    ErrorCode.AUTH_INVALID_CREDENTIALS,
                    "Email ou senha inválidos");
        }

        if (user.getRole() != UserRole.TECNICO) {
            throw new BusinessException(
                    ErrorCode.AUTH_WRONG_APP_TYPE,
                    "Este aplicativo não é compatível com seu perfil.");
        }

        validateUserStatus(user, request.appType());

        return generateAuthResponseForGlobalUser(user, request.appType());
    }

    /**
     * Register technician. InviteToken and tenantDomain are optional.
     * If neither is provided, creates only User (TECNICO, tenant_id null) without Technician; technician can link company later via redeem-invite.
     * If invite or domain is provided, creates User + Technician in that tenant. Technicians are created with status PENDING and require approval.
     */
    @Transactional
    public TechnicianRegistrationResponse registerTechnician(RegisterTechnicianRequest request) {
        boolean hasInvite = request.inviteToken() != null && !request.inviteToken().isBlank();
        boolean hasDomain = request.tenantDomain() != null && !request.tenantDomain().isBlank();

        if (!hasInvite && !hasDomain) {
            // Registration without company: only User (TECNICO, tenant_id null), no Technician
            if (userRepository.findGlobalTechnicianByEmail(request.email()).isPresent()) {
                throw new BusinessException(
                        ErrorCode.USER_EMAIL_EXISTS,
                        "This email is already registered.");
            }
            User user = new User(request.email(), request.name(), UserRole.TECNICO);
            user.setTenantId(null);
            user.setPasswordHash(passwordEncoder.encode(request.password()));
            user.setPhone(request.phone());
            user.setStatus(UserStatus.PENDING);
            user = userRepository.save(user);
            log.info("Technician registered without company: {} (PENDING)", user.getId());
            return new TechnicianRegistrationResponse(
                    user.getId(),
                    null,
                    "Registration successful. You can link to a company later using an invite code.",
                    UserStatus.PENDING);
        }

        Tenant tenant;
        TechnicianInvite invite = null;

        if (hasInvite) {
            UUID tokenUuid;
            try {
                tokenUuid = UUID.fromString(request.inviteToken().trim());
            } catch (IllegalArgumentException e) {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Invalid or expired invite link.");
            }
            invite = technicianInviteRepository.findByToken(tokenUuid)
                    .orElseThrow(() -> new BusinessException(ErrorCode.VALIDATION_ERROR, "Invalid or expired invite link."));
            if (invite.getStatus() != InviteStatus.PENDING) {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR, "This invite link has already been used.");
            }
            tenant = tenantRepository.findById(invite.getTenantId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.TENANT_NOT_FOUND, "Tenant not found."));
            if (!tenant.isActive()) {
                throw new BusinessException(ErrorCode.TENANT_SUSPENDED, "This company is not active.");
            }
            log.info("Registering technician: {} via invite token", request.email());
        } else {
            tenant = tenantRepository.findByDomain(request.tenantDomain().trim())
                    .orElseThrow(() -> new BusinessException(
                            ErrorCode.TENANT_NOT_FOUND,
                            "Tenant not found for domain: " + request.tenantDomain()));
            log.info("Registering technician: {} on domain: {}", request.email(), request.tenantDomain());
        }

        TenantContext.setCurrentTenantId(tenant.getId());

        try {
            if (userRepository.findByEmailAndTenantId(request.email(), tenant.getId()).isPresent()) {
                throw new BusinessException(
                        ErrorCode.USER_EMAIL_EXISTS,
                        "This email is already registered.");
            }

            User user = new User(request.email(), request.name(), UserRole.TECNICO);
            user.setTenantId(tenant.getId());
            user.setPasswordHash(passwordEncoder.encode(request.password()));
            user.setPhone(request.phone());
            user.setStatus(UserStatus.PENDING);
            user = userRepository.save(user);

            Technician technician = new Technician(user);
            technician.setTenantId(tenant.getId());
            if (request.skills() != null) {
                technician.setSkills(request.skills());
            }
            technician.setVehicleModel(request.vehicleModel());
            technician.setVehiclePlate(request.vehiclePlate());
            technician = technicianRepository.save(technician);

            if (invite != null) {
                invite.markAsUsed(technician.getId());
                technicianInviteRepository.save(invite);
            }

            log.info("Technician registered successfully: {} (PENDING)", user.getId());

            return new TechnicianRegistrationResponse(
                    user.getId(),
                    technician.getId(),
                    "Registration successful. Please wait for your documents to be approved.",
                    UserStatus.PENDING);
        } finally {
            TenantContext.clear();
        }
    }

    /**
     * Registro de cliente.
     * No modelo marketplace, clientes são globais (sem tenant).
     * Clientes são criados diretamente com status APPROVED.
     */
    @Transactional
    public AuthResponse registerClient(RegisterClientRequest request) {
        log.info("Registering client: {}", request.email());

        // Marketplace: clientes são globais (sem tenant)
        // Verificar se email global já existe
        if (userRepository.existsGlobalUserByEmail(request.email())) {
            throw new BusinessException(
                    ErrorCode.USER_EMAIL_EXISTS,
                    "Este email já está cadastrado");
        }

        // 1. Criar User global com status APPROVED (sem tenant_id)
        User user = new User(request.email(), request.name(), UserRole.CLIENTE);
        // tenantId permanece null para clientes do marketplace
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setPhone(request.phone());
        user.setStatus(UserStatus.APPROVED);
        user = userRepository.save(user);

        // 2. Criar Customer global (sem tenant_id)
        Customer customer = new Customer(user);
        customer.setCompanyName(request.companyName());
        customerRepository.save(customer);

        log.info("Global client registered successfully: {}", user.getId());

        // 3. Gerar tokens e retornar (sem tenant)
        return generateAuthResponseForGlobalUser(user, AppType.CLIENT_APP);
    }

    /**
     * Registro de empresa (tenant).
     * Cria um novo tenant e um usuário administrador.
     */
    @Transactional
    public AuthResponse registerCompany(RegisterCompanyRequest request) {
        log.info("Registering company: {} with domain: {}", request.companyName(), request.domain());

        // 1. Verificar se domínio já existe
        if (tenantRepository.existsByDomain(request.domain())) {
            throw new BusinessException(
                    ErrorCode.TENANT_DOMAIN_EXISTS,
                    "Este domínio já está cadastrado");
        }

        // 2. Verificar se email já existe (global ou em qualquer tenant)
        // Nota: existsByEmail usa filtro de tenant, então usamos existsByEmailAnywhere
        if (userRepository.existsByEmailAnywhere(request.adminEmail())) {
            throw new BusinessException(
                    ErrorCode.USER_EMAIL_EXISTS,
                    "Este email já está cadastrado");
        }

        // 3. Criar Tenant
        Tenant tenant = new Tenant(request.companyName(), request.domain(), 
                request.region() != null ? request.region() : "us-east-1");
        tenant.setStatus(TenantStatus.ACTIVE); // Ativar imediatamente para marketplace
        tenant.setDescription(request.description());
        tenant.setLogoUrl(request.logoUrl());
        tenant = tenantRepository.save(tenant);

        log.info("Tenant created: {}", tenant.getId());

        // 4. Configurar tenant context
        TenantContext.setCurrentTenantId(tenant.getId());

        try {
            // 5. Criar User administrador
            User adminUser = new User(request.adminEmail(), request.adminName(), UserRole.ADMIN_EMPRESA);
            adminUser.setTenantId(tenant.getId());
            adminUser.setPasswordHash(passwordEncoder.encode(request.password()));
            adminUser.setPhone(request.phone());
            adminUser.setStatus(UserStatus.APPROVED); // Aprovado automaticamente
            adminUser = userRepository.save(adminUser);

            log.info("Company admin user created: {}", adminUser.getId());

            // 6. Gerar tokens e retornar
            return generateAuthResponse(adminUser, tenant, AppType.EMPRESA_WEB);
        } finally {
            TenantContext.clear();
        }
    }

    /**
     * Refresh token.
     * Suporta usuários globais (sem tenant) do marketplace.
     */
    @Transactional(readOnly = true)
    public AuthResponse refreshToken(String refreshToken) {
        // 1. Validar token
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new BusinessException(
                    ErrorCode.AUTH_REFRESH_TOKEN_INVALID,
                    "Refresh token inválido ou expirado");
        }

        // 2. Verificar se é refresh token
        if (!jwtTokenProvider.isRefreshToken(refreshToken)) {
            throw new BusinessException(
                    ErrorCode.AUTH_REFRESH_TOKEN_INVALID,
                    "Token fornecido não é um refresh token");
        }

        // 3. Extrair dados
        UUID userId = jwtTokenProvider.getUserIdFromToken(refreshToken);
        UUID tenantId = jwtTokenProvider.getTenantIdFromToken(refreshToken);

        // 4. Buscar usuário
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.USER_NOT_FOUND,
                        "Usuário não encontrado"));

        // 5. Determinar appType baseado na role
        AppType appType = determineAppType(user.getRole());

        // 6. Se usuário global (sem tenant), retornar resposta sem tenant
        if (tenantId == null || user.isGlobalUser()) {
            return generateAuthResponseForGlobalUser(user, appType);
        }

        // 7. Buscar tenant e retornar resposta normal
        TenantContext.setCurrentTenantId(tenantId);
        try {
            Tenant tenant = tenantRepository.findById(tenantId)
                    .orElseThrow(() -> new BusinessException(
                            ErrorCode.TENANT_NOT_FOUND,
                            "Tenant não encontrado"));

            return generateAuthResponse(user, tenant, appType);
        } finally {
            TenantContext.clear();
        }
    }

    /**
     * Vincula um técnico (sem empresa) a uma empresa usando um token de convite.
     * Cria a entidade Technician e atualiza User.tenantId. Retorna novos tokens com tenant.
     */
    @Transactional
    public AuthResponse redeemTechnicianInvite(UUID userId, String inviteToken) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, "Usuário não encontrado"));

        if (user.getRole() != UserRole.TECNICO) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Only technicians can redeem an invite.");
        }
        if (user.getTenantId() != null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "You are already linked to a company.");
        }

        UUID tokenUuid;
        try {
            tokenUuid = UUID.fromString(inviteToken != null ? inviteToken.trim() : "");
        } catch (IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Invalid or expired invite link.");
        }

        TechnicianInvite invite = technicianInviteRepository.findByToken(tokenUuid)
                .orElseThrow(() -> new BusinessException(ErrorCode.VALIDATION_ERROR, "Invalid or expired invite link."));
        if (invite.getStatus() != InviteStatus.PENDING) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "This invite link has already been used.");
        }

        Tenant tenant = tenantRepository.findById(invite.getTenantId())
                .orElseThrow(() -> new BusinessException(ErrorCode.TENANT_NOT_FOUND, "Tenant not found."));
        if (!tenant.isActive()) {
            throw new BusinessException(ErrorCode.TENANT_SUSPENDED, "This company is not active.");
        }

        user.setTenantId(tenant.getId());
        userRepository.save(user);

        TenantContext.setCurrentTenantId(tenant.getId());
        try {
            Technician technician = new Technician(user);
            technician.setTenantId(tenant.getId());
            technician = technicianRepository.save(technician);
            invite.markAsUsed(technician.getId());
            technicianInviteRepository.save(invite);
            log.info("Technician {} linked to tenant {} via invite", user.getId(), tenant.getId());
            return generateAuthResponse(user, tenant, AppType.TECH_APP);
        } finally {
            TenantContext.clear();
        }
    }

    /**
     * Obtém dados do usuário atual
     */
    @Transactional(readOnly = true)
    public AuthResponse.UserInfo getCurrentUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.USER_NOT_FOUND,
                        "Usuário não encontrado"));

        return new AuthResponse.UserInfo(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getRole(),
                user.getStatus(),
                user.getAvatarUrl(),
                user.getTenantId());
    }

    // ========== Private Methods ==========

    private void validateAppTypeForRole(AppType appType, UserRole role) {
        if (role == null) {
            throw new BusinessException(
                    ErrorCode.INTERNAL_ERROR,
                    "Perfil do usuário não definido. Entre em contato com o suporte.");
        }
        if (!appType.isCompatibleWith(role)) {
            throw new BusinessException(
                    ErrorCode.AUTH_WRONG_APP_TYPE,
                    String.format(
                            "Este aplicativo não é compatível com seu perfil. " +
                                    "Seu perfil (%s) requer o aplicativo correto.",
                            role.name()));
        }
    }

    private void validateUserStatus(User user, AppType appType) {
        UserStatus status = user.getStatus();
        if (status == null) {
            log.error("User {} has null status", user.getId());
            throw new BusinessException(
                    ErrorCode.INTERNAL_ERROR,
                    "Status do usuário não definido. Entre em contato com o suporte.");
        }
        switch (status) {
            case PENDING -> {
                // Technicians with PENDING status are allowed to log in to complete registration (e.g. upload documents).
                if (user.getRole() != UserRole.TECNICO) {
                    throw new BusinessException(
                            ErrorCode.USER_PENDING_APPROVAL,
                            "Your account is pending approval. Please contact your administrator.");
                }
            }
            case REJECTED -> throw new BusinessException(
                    ErrorCode.USER_REJECTED,
                    "Sua conta foi rejeitada. Entre em contato com o suporte.");
            case SUSPENDED -> throw new BusinessException(
                    ErrorCode.USER_SUSPENDED,
                    "Sua conta está suspensa. Entre em contato com o suporte.");
            case APPROVED -> {
                /* OK */ }
        }
    }

    private AuthResponse generateAuthResponse(User user, Tenant tenant, AppType appType) {
        JwtUserDetails userDetails = JwtUserDetails.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .status(user.getStatus())
                .tenantId(tenant.getId())
                .appType(appType)
                .build();

        String accessToken = jwtTokenProvider.generateAccessToken(userDetails);
        String refreshToken = jwtTokenProvider.generateRefreshToken(userDetails);

        return new AuthResponse(
                accessToken,
                refreshToken,
                ACCESS_TOKEN_EXPIRY_SECONDS,
                new AuthResponse.UserInfo(
                        user.getId(),
                        user.getEmail(),
                        user.getName(),
                        user.getRole(),
                        user.getStatus(),
                        user.getAvatarUrl(),
                        tenant.getId()));
    }

    /**
     * Gera resposta de autenticação para usuário global (sem tenant).
     * Usado para clientes do marketplace.
     */
    private AuthResponse generateAuthResponseForGlobalUser(User user, AppType appType) {
        if (user.getRole() == null || user.getStatus() == null) {
            log.error("User {} has null role or status", user.getId());
            throw new BusinessException(
                    ErrorCode.INTERNAL_ERROR,
                    "Dados do usuário incompletos. Entre em contato com o suporte.");
        }
        JwtUserDetails userDetails = JwtUserDetails.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .status(user.getStatus())
                .tenantId(null) // Cliente global - sem tenant
                .appType(appType)
                .build();

        String accessToken = jwtTokenProvider.generateAccessToken(userDetails);
        String refreshToken = jwtTokenProvider.generateRefreshToken(userDetails);

        return new AuthResponse(
                accessToken,
                refreshToken,
                ACCESS_TOKEN_EXPIRY_SECONDS,
                new AuthResponse.UserInfo(
                        user.getId(),
                        user.getEmail(),
                        user.getName(),
                        user.getRole(),
                        user.getStatus(),
                        user.getAvatarUrl(),
                        user.getTenantId()));
    }

    private AppType determineAppType(UserRole role) {
        return switch (role) {
            case TECNICO -> AppType.TECH_APP;
            case CLIENTE -> AppType.CLIENT_APP;
            case ADMIN_EMPRESA, GESTOR -> AppType.EMPRESA_WEB;
            case ADMIN_GLOBAL -> AppType.ADMIN_GLOBAL;
        };
    }
}
