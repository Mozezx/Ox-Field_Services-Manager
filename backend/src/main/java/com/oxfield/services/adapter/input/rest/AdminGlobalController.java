package com.oxfield.services.adapter.input.rest;

import com.oxfield.services.adapter.output.persistence.TechnicianRepository;
import com.oxfield.services.application.service.AdminTechnicianService;
import com.oxfield.services.domain.entity.Technician;
import com.oxfield.services.shared.util.GeoUtils;
import com.oxfield.services.application.service.TechnicianManagementService;
import com.oxfield.services.application.service.TechnicianManagementService.TechnicianDocumentResponse;
import com.oxfield.services.application.service.TechnicianManagementService.TechnicianResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Controller para administração global.
 * Endpoints exclusivos para ADMIN_GLOBAL.
 */
@RestController
@RequestMapping("/admin/global")
@Tag(name = "Admin Global", description = "Endpoints de administração global")
@PreAuthorize("hasRole('ADMIN_GLOBAL')")
public class AdminGlobalController {

    private final AdminTechnicianService adminTechnicianService;
    private final TechnicianManagementService technicianManagementService;
    private final TechnicianRepository technicianRepository;

    public AdminGlobalController(
            AdminTechnicianService adminTechnicianService,
            TechnicianManagementService technicianManagementService,
            TechnicianRepository technicianRepository) {
        this.adminTechnicianService = adminTechnicianService;
        this.technicianManagementService = technicianManagementService;
        this.technicianRepository = technicianRepository;
    }

    // ==================== DASHBOARD ====================

    @GetMapping("/dashboard")
    @Operation(summary = "Dashboard", description = "Retorna métricas globais do sistema")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("totalTenants", 142);
        dashboard.put("activeTenants", 128);
        dashboard.put("totalUsers", 15420);
        dashboard.put("totalRevenue", 284500);
        dashboard.put("revenueChange", 12.5);
        dashboard.put("systemHealth", "healthy");
        dashboard.put("apiLatency", 42);
        dashboard.put("errorRate", 0.02);
        return ResponseEntity.ok(dashboard);
    }

    // ==================== TENANTS ====================

    @GetMapping("/tenants")
    @Operation(summary = "List Tenants", description = "Lista todos os tenants")
    public ResponseEntity<Map<String, Object>> getTenants(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String plan,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        
        List<Map<String, Object>> tenants = new ArrayList<>();
        
        tenants.add(createTenant("1", "Acme Corporation", "acme.oxfield.io", "enterprise", "active", "US-EAST", 245, 45000));
        tenants.add(createTenant("2", "TechCorp Industries", "techcorp.oxfield.io", "professional", "active", "US-WEST", 89, 12500));
        tenants.add(createTenant("3", "Global Services LLC", "global.oxfield.io", "enterprise", "active", "EU-WEST", 312, 52000));
        tenants.add(createTenant("4", "StartUp Inc", "startup.oxfield.io", "starter", "trial", "US-EAST", 12, 0));
        tenants.add(createTenant("5", "MegaCorp", "mega.oxfield.io", "enterprise", "suspended", "APAC", 0, 85000));
        tenants.add(createTenant("6", "Local Business", "local.oxfield.io", "starter", "active", "US-CENTRAL", 8, 2500));
        
        // Filter by status
        if (status != null && !status.isEmpty() && !status.equals("all")) {
            tenants = tenants.stream()
                .filter(t -> status.equalsIgnoreCase((String) t.get("status")))
                .toList();
        }
        
        // Filter by search
        if (search != null && !search.isEmpty()) {
            String searchLower = search.toLowerCase();
            tenants = tenants.stream()
                .filter(t -> ((String) t.get("name")).toLowerCase().contains(searchLower) ||
                            ((String) t.get("domain")).toLowerCase().contains(searchLower))
                .toList();
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("tenants", tenants);
        response.put("total", tenants.size());
        
        return ResponseEntity.ok(response);
    }

    private Map<String, Object> createTenant(String id, String name, String domain, String plan, String status, String region, int userCount, int mrr) {
        Map<String, Object> tenant = new HashMap<>();
        tenant.put("id", id);
        tenant.put("name", name);
        tenant.put("domain", domain);
        tenant.put("plan", plan);
        tenant.put("status", status);
        tenant.put("region", region);
        tenant.put("userCount", userCount);
        tenant.put("technicianCount", (int)(userCount * 0.3));
        tenant.put("jobCount", userCount * 15);
        tenant.put("mrr", mrr);
        tenant.put("createdAt", "2023-01-15T10:00:00Z");
        tenant.put("features", Arrays.asList("dispatch", "tracking", "reports"));
        return tenant;
    }

    @GetMapping("/tenants/{id}")
    @Operation(summary = "Get Tenant", description = "Retorna detalhes de um tenant")
    public ResponseEntity<Map<String, Object>> getTenant(@PathVariable String id) {
        Map<String, Object> tenant = createTenant(id, "Acme Corporation", "acme.oxfield.io", "enterprise", "active", "US-EAST", 245, 45000);
        tenant.put("contactEmail", "admin@acme.com");
        tenant.put("contactPhone", "+1 555-1234");
        tenant.put("billingAddress", "123 Main St, New York, NY");
        tenant.put("subscriptionStartDate", "2023-01-15T00:00:00Z");
        tenant.put("lastActivityAt", new Date().toString());
        tenant.put("settings", Map.of("timezone", "America/New_York", "language", "en"));
        return ResponseEntity.ok(tenant);
    }

    @PostMapping("/tenants")
    @Operation(summary = "Create Tenant", description = "Cria um novo tenant")
    public ResponseEntity<Map<String, Object>> createTenant(@RequestBody Map<String, Object> request) {
        Map<String, Object> tenant = new HashMap<>(request);
        tenant.put("id", UUID.randomUUID().toString());
        tenant.put("status", "pending");
        tenant.put("createdAt", new Date().toString());
        return ResponseEntity.ok(tenant);
    }

    @PatchMapping("/tenants/{id}/status")
    @Operation(summary = "Update Tenant Status", description = "Ativa ou suspende um tenant")
    public ResponseEntity<Map<String, Object>> updateTenantStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        Map<String, Object> tenant = new HashMap<>();
        tenant.put("id", id);
        tenant.put("status", request.get("status"));
        tenant.put("updatedAt", new Date().toString());
        return ResponseEntity.ok(tenant);
    }

    @PostMapping("/tenants/{id}/impersonate")
    @Operation(summary = "Impersonate Tenant", description = "Gera token para personificar tenant")
    public ResponseEntity<Map<String, Object>> impersonateTenant(@PathVariable String id) {
        Map<String, Object> response = new HashMap<>();
        response.put("token", "impersonation_token_" + id + "_" + System.currentTimeMillis());
        response.put("redirectUrl", "/dashboard");
        response.put("expiresIn", 3600);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/tenants/{id}/metrics")
    @Operation(summary = "Tenant Metrics", description = "Retorna métricas de um tenant")
    public ResponseEntity<Map<String, Object>> getTenantMetrics(
            @PathVariable String id,
            @RequestParam(defaultValue = "30d") String period) {
        Map<String, Object> metrics = new HashMap<>();
        metrics.put("dailyActiveUsers", 156);
        metrics.put("jobsCreated", 342);
        metrics.put("jobsCompleted", 298);
        metrics.put("averageJobDuration", 95);
        metrics.put("customerSatisfaction", 4.7);
        metrics.put("revenueGenerated", 45000);
        return ResponseEntity.ok(metrics);
    }

    @GetMapping("/tenants/{tenantId}/technicians")
    @Operation(summary = "List Tenant Technicians", description = "Lista técnicos do tenant (read-only)")
    public ResponseEntity<List<AdminTechnicianService.TechnicianWithTenantResponse>> getTenantTechnicians(
            @PathVariable UUID tenantId) {
        List<AdminTechnicianService.TechnicianWithTenantResponse> technicians =
                adminTechnicianService.listTechniciansByTenant(tenantId);
        return ResponseEntity.ok(technicians);
    }

    // ==================== TECHNICIAN APPROVALS (read-only; approval is done by company admin) ====================

    @GetMapping("/technicians/pending")
    @Operation(summary = "List Pending Technicians", description = "Lista técnicos pendentes de aprovação (todos os tenants)")
    public ResponseEntity<List<AdminTechnicianService.TechnicianWithTenantResponse>> getPendingTechnicians() {
        List<AdminTechnicianService.TechnicianWithTenantResponse> technicians =
                adminTechnicianService.listPendingTechnicians();
        return ResponseEntity.ok(technicians);
    }

    @GetMapping("/technicians/{id}")
    @Operation(summary = "Get Technician", description = "Retorna detalhes de um técnico com informação do tenant")
    public ResponseEntity<AdminTechnicianService.TechnicianWithTenantResponse> getTechnician(@PathVariable UUID id) {
        AdminTechnicianService.TechnicianWithTenantResponse technician =
                adminTechnicianService.getTechnicianDetails(id);
        return ResponseEntity.ok(technician);
    }

    @GetMapping("/technicians/{id}/documents")
    @Operation(summary = "Get Technician Documents", description = "Retorna documentos do técnico")
    public ResponseEntity<List<TechnicianDocumentResponse>> getTechnicianDocuments(@PathVariable UUID id) {
        List<TechnicianDocumentResponse> documents = technicianManagementService.getTechnicianDocuments(id);
        return ResponseEntity.ok(documents);
    }

    @PatchMapping("/technicians/{id}/status")
    @Operation(summary = "Update Technician Status", description = "Aprovar ou rejeitar técnico")
    public ResponseEntity<TechnicianResponse> updateTechnicianStatus(
            @PathVariable UUID id,
            @RequestBody UpdateTechnicianStatusRequest request) {
        TechnicianResponse result;
        switch (request.status().toUpperCase()) {
            case "APPROVED" -> result = technicianManagementService.approveTechnician(id);
            case "REJECTED" -> result = technicianManagementService.rejectTechnician(id, request.notes());
            default -> throw new IllegalArgumentException("Status inválido: " + request.status());
        }
        return ResponseEntity.ok(result);
    }

    public record UpdateTechnicianStatusRequest(String status, String notes) {}

    @DeleteMapping("/technicians")
    @Operation(summary = "Delete All Technicians", description = "Remove todos os técnicos e os respetivos logins do sistema")
    public ResponseEntity<Map<String, Object>> deleteAllTechnicians() {
        adminTechnicianService.deleteAllTechnicians();
        Map<String, Object> body = new HashMap<>();
        body.put("message", "Todos os técnicos e respetivos logins foram removidos.");
        return ResponseEntity.ok(body);
    }

    @PutMapping("/technicians/simulate-location")
    @Operation(summary = "Simulate technician location", description = "Define a localização simulada de um técnico pelo nome (ex.: para testes)")
    public ResponseEntity<Map<String, Object>> simulateTechnicianLocation(@RequestBody SimulateLocationRequest request) {
        Technician technician = technicianRepository.findFirstByUserNameIgnoreCase(request.technicianName())
                .orElseThrow(() -> new IllegalArgumentException("Técnico não encontrado: " + request.technicianName()));
        technician.updateLocation(GeoUtils.createPoint(request.latitude(), request.longitude()));
        technicianRepository.save(technician);
        Map<String, Object> body = new HashMap<>();
        body.put("message", "Localização do técnico '" + request.technicianName() + "' atualizada.");
        body.put("technicianId", technician.getId());
        body.put("latitude", request.latitude());
        body.put("longitude", request.longitude());
        return ResponseEntity.ok(body);
    }

    public record SimulateLocationRequest(String technicianName, double latitude, double longitude) {}

    // ==================== LOGS ====================

    @GetMapping("/logs")
    @Operation(summary = "Audit Logs", description = "Retorna logs de auditoria")
    public ResponseEntity<Map<String, Object>> getLogs(
            @RequestParam(required = false) String tenantId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int limit) {
        
        List<Map<String, Object>> logs = new ArrayList<>();
        
        logs.add(createLog("1", "USER_LOGIN", "admin@acme.com", "User logged in", "192.168.1.1"));
        logs.add(createLog("2", "TENANT_UPDATE", "admin@oxfield.io", "Updated tenant settings", "10.0.0.1"));
        logs.add(createLog("3", "ORDER_CREATE", "manager@acme.com", "Created service order #4092", "192.168.1.50"));
        logs.add(createLog("4", "USER_CREATE", "admin@acme.com", "Created new technician account", "192.168.1.1"));
        logs.add(createLog("5", "PAYMENT_RECEIVED", "system", "Payment processed for invoice #1024", "internal"));
        
        Map<String, Object> response = new HashMap<>();
        response.put("logs", logs);
        response.put("total", logs.size());
        
        return ResponseEntity.ok(response);
    }

    private Map<String, Object> createLog(String id, String action, String actorEmail, String details, String ipAddress) {
        Map<String, Object> log = new HashMap<>();
        log.put("id", id);
        log.put("timestamp", new Date().toString());
        log.put("action", action);
        log.put("actorId", "user_" + id);
        log.put("actorName", actorEmail.split("@")[0]);
        log.put("actorEmail", actorEmail);
        log.put("resourceType", action.split("_")[0].toLowerCase());
        log.put("resourceId", "res_" + id);
        log.put("details", details);
        log.put("ipAddress", ipAddress);
        return log;
    }

    // ==================== SYSTEM ====================

    @GetMapping("/system/health")
    @Operation(summary = "System Health", description = "Retorna status de saúde do sistema")
    public ResponseEntity<Map<String, Object>> getSystemHealth() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "healthy");
        health.put("lastChecked", new Date().toString());
        
        List<Map<String, Object>> services = new ArrayList<>();
        services.add(Map.of("name", "API Gateway", "status", "healthy", "latency", 12));
        services.add(Map.of("name", "Database", "status", "healthy", "latency", 5));
        services.add(Map.of("name", "Redis Cache", "status", "healthy", "latency", 2));
        services.add(Map.of("name", "Message Queue", "status", "healthy", "latency", 8));
        services.add(Map.of("name", "Storage", "status", "healthy", "latency", 45));
        
        health.put("services", services);
        
        return ResponseEntity.ok(health);
    }
}
