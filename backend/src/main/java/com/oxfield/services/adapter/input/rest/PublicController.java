package com.oxfield.services.adapter.input.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.oxfield.services.adapter.output.persistence.ClientInviteRepository;
import com.oxfield.services.adapter.output.persistence.ServiceOrderRepository;
import com.oxfield.services.adapter.output.persistence.TenantRepository;
import com.oxfield.services.adapter.output.persistence.TechnicianInviteRepository;
import com.oxfield.services.domain.entity.ClientInvite;
import com.oxfield.services.domain.entity.ServiceOrder;
import com.oxfield.services.domain.entity.Tenant;
import com.oxfield.services.domain.entity.TechnicianInvite;
import com.oxfield.services.domain.enums.InviteStatus;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Controller para endpoints públicos (sem autenticação).
 */
@RestController
@RequestMapping("/public")
@Tag(name = "Public", description = "Endpoints públicos")
public class PublicController {

    private final TenantRepository tenantRepository;
    private final TechnicianInviteRepository technicianInviteRepository;
    private final ClientInviteRepository clientInviteRepository;
    private final ServiceOrderRepository orderRepository;

    public PublicController(TenantRepository tenantRepository,
                            TechnicianInviteRepository technicianInviteRepository,
                            ClientInviteRepository clientInviteRepository,
                            ServiceOrderRepository orderRepository) {
        this.tenantRepository = tenantRepository;
        this.technicianInviteRepository = technicianInviteRepository;
        this.clientInviteRepository = clientInviteRepository;
        this.orderRepository = orderRepository;
    }

    /**
     * Health check
     */
    @GetMapping("/health")
    @Operation(summary = "Health Check", description = "Verifica se a API está online")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "timestamp", Instant.now()));
    }

    /**
     * Versão da API
     */
    @GetMapping("/version")
    @Operation(summary = "Versão", description = "Retorna versão da API")
    public ResponseEntity<Map<String, String>> version() {
        return ResponseEntity.ok(Map.of(
                "version", "1.0.0",
                "name", "Ox Field Services API"));
    }

    /**
     * Verificar se tenant existe pelo domínio
     */
    @GetMapping("/tenants/check")
    @Operation(summary = "Verificar Tenant", description = "Verifica se um tenant existe pelo domínio")
    public ResponseEntity<Map<String, Object>> checkTenant(@RequestParam String domain) {
        boolean exists = tenantRepository.existsByDomain(domain);
        return ResponseEntity.ok(Map.of(
                "domain", domain,
                "exists", exists));
    }

    /**
     * Obter nome e domínio do tenant por domínio (para tela de join do app técnico).
     * Retorna 404 se não existir ou não estiver ativo.
     */
    @GetMapping("/tenant-by-domain")
    @Operation(summary = "Tenant by Domain", description = "Returns tenant name and domain for technician join screen")
    public ResponseEntity<Map<String, String>> getTenantByDomain(@RequestParam String domain) {
        return tenantRepository.findByDomain(domain.trim())
                .filter(Tenant::isActive)
                .map(t -> Map.<String, String>of(
                        "name", t.getName(),
                        "domain", t.getDomain()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Resolve tenant by invite token. Returns 404 if token invalid or invite already used.
     */
    @GetMapping("/tenant-by-invite")
    @Operation(summary = "Tenant by Invite Token", description = "Returns tenant name and domain for a valid PENDING invite")
    public ResponseEntity<Map<String, String>> getTenantByInvite(@RequestParam String token) {
        UUID tokenUuid;
        try {
            tokenUuid = UUID.fromString(token.trim());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
        return technicianInviteRepository.findByToken(tokenUuid)
                .filter(inv -> inv.getStatus() == InviteStatus.PENDING)
                .map(TechnicianInvite::getTenantId)
                .flatMap(tenantRepository::findById)
                .filter(Tenant::isActive)
                .map(t -> Map.<String, String>of(
                        "name", t.getName(),
                        "domain", t.getDomain()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Resolve tenant by client invite token. Returns 404 if token invalid or invite already used.
     */
    @GetMapping("/join-by-token")
    @Operation(summary = "Join by Invite Token", description = "Returns tenant name for a valid PENDING client invite")
    public ResponseEntity<Map<String, String>> getJoinByToken(@RequestParam String token) {
        UUID tokenUuid;
        try {
            tokenUuid = UUID.fromString(token.trim());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
        return clientInviteRepository.findByToken(tokenUuid)
                .filter(inv -> inv.getStatus() == InviteStatus.PENDING)
                .map(ClientInvite::getTenantId)
                .flatMap(tenantRepository::findById)
                .filter(Tenant::isActive)
                .map(t -> Map.<String, String>of(
                        "name", t.getName(),
                        "tenantId", t.getId().toString()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get order by share token (no auth). Used by client app landing page.
     */
    @GetMapping("/orders/by-token")
    @Operation(summary = "Order by share token", description = "Returns minimal order info by share token for client link landing")
    public ResponseEntity<PublicOrderByTokenResponse> getOrderByToken(@RequestParam String token) {
        UUID tokenUuid;
        try {
            tokenUuid = UUID.fromString(token.trim());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
        return orderRepository.findByShareToken(tokenUuid)
                .filter(o -> o.getShareToken() != null)
                .map(order -> new PublicOrderByTokenResponse(
                        order.getId(),
                        order.getOsNumber(),
                        order.getTitle(),
                        order.getStatus().getValue()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    public record PublicOrderByTokenResponse(UUID orderId, String orderNumber, String title, String status) {}
}
