package com.oxfield.services.adapter.input.rest;

import com.oxfield.services.application.service.BillingService;
import com.oxfield.services.application.service.ClientInviteService;
import com.oxfield.services.application.service.CreditService;
import com.oxfield.services.application.service.EmpresaClientService;
import com.oxfield.services.application.service.OrderManagementService;
import com.oxfield.services.application.service.OrderManagementService.CreateOrderRequest;
import com.oxfield.services.application.service.OrderManagementService.OrderResponse;
import com.oxfield.services.application.service.SubscriptionService;
import com.oxfield.services.application.service.TechnicianManagementService;
import com.oxfield.services.application.service.TechnicianManagementService.FleetLocationResponse;
import com.oxfield.services.application.service.TechnicianManagementService.TechnicianDetailResponse;
import com.oxfield.services.application.service.TechnicianManagementService.TechnicianDocumentResponse;
import com.oxfield.services.application.service.TechnicianManagementService.TechnicianResponse;
import com.oxfield.services.application.service.UsageTrackingService;
import com.oxfield.services.adapter.output.persistence.TenantRepository;
import com.oxfield.services.adapter.output.persistence.TechnicianInviteRepository;
import com.oxfield.services.domain.entity.CreditBalance;
import com.oxfield.services.domain.entity.TechnicianInvite;
import com.oxfield.services.application.service.ClientInviteService.ClientInviteResult;
import com.oxfield.services.domain.entity.Invoice;
import com.oxfield.services.domain.entity.Subscription;
import com.oxfield.services.domain.entity.Tenant;
import com.oxfield.services.domain.entity.SubscriptionItem;
import com.oxfield.services.domain.enums.UserStatus;
import com.oxfield.services.shared.exception.BusinessException;
import com.oxfield.services.shared.exception.ErrorCode;
import com.oxfield.services.shared.security.CurrentUserProvider;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Value;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Controller para gestão de empresa.
 * Endpoints para ADMIN_EMPRESA e GESTOR.
 */
@RestController
@RequestMapping("/empresa")
@Tag(name = "Empresa", description = "Endpoints de gestão da empresa")
@PreAuthorize("hasAnyRole('ADMIN_EMPRESA', 'GESTOR')")
public class EmpresaController {

    private static final Logger log = LoggerFactory.getLogger(EmpresaController.class);

    private final CurrentUserProvider currentUserProvider;
    private final TenantRepository tenantRepository;
    private final TechnicianInviteRepository technicianInviteRepository;
    private final TechnicianManagementService technicianService;
    private final OrderManagementService orderService;
    private final SubscriptionService subscriptionService;
    private final BillingService billingService;
    private final CreditService creditService;
    private final UsageTrackingService usageTrackingService;
    private final ClientInviteService clientInviteService;
    private final EmpresaClientService empresaClientService;

    @Value("${oxfield.tech-app-base-url:http://localhost:3004}")
    private String techAppBaseUrl;

    public EmpresaController(
            CurrentUserProvider currentUserProvider,
            TenantRepository tenantRepository,
            TechnicianInviteRepository technicianInviteRepository,
            TechnicianManagementService technicianService,
            OrderManagementService orderService,
            SubscriptionService subscriptionService,
            BillingService billingService,
            CreditService creditService,
            UsageTrackingService usageTrackingService,
            ClientInviteService clientInviteService,
            EmpresaClientService empresaClientService) {
        this.currentUserProvider = currentUserProvider;
        this.tenantRepository = tenantRepository;
        this.technicianInviteRepository = technicianInviteRepository;
        this.technicianService = technicianService;
        this.orderService = orderService;
        this.subscriptionService = subscriptionService;
        this.billingService = billingService;
        this.creditService = creditService;
        this.usageTrackingService = usageTrackingService;
        this.clientInviteService = clientInviteService;
        this.empresaClientService = empresaClientService;
    }

    // ==================== DASHBOARD ====================

    // ==================== TENANT (for invite link) ====================

    @GetMapping("/tenant")
    @Operation(summary = "My Tenant", description = "Returns tenant data for the current company")
    public ResponseEntity<TenantInfoResponse> getMyTenant() {
        UUID tenantId = currentUserProvider.requireCurrentUser().getTenantId();
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new BusinessException(ErrorCode.TENANT_NOT_FOUND, "Tenant not found"));
        return ResponseEntity.ok(new TenantInfoResponse(
                tenant.getId().toString(),
                tenant.getName(),
                tenant.getDomain()));
    }

    @PostMapping("/invites")
    @Operation(summary = "Create invite link", description = "Creates a unique invite link for one technician")
    public ResponseEntity<CreateInviteResponse> createInvite() {
        UUID tenantId;
        try {
            tenantId = currentUserProvider.requireCurrentUser().getTenantId();
        } catch (Exception e) {
            log.warn("createInvite: no current user or invalid session", e);
            throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                    "Sessão inválida. Faça login novamente.");
        }
        if (tenantId == null) {
            log.warn("createInvite: user has no tenantId");
            throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                    "Sessão sem empresa associada. Faça login novamente com uma conta de empresa.");
        }
        UUID token = UUID.randomUUID();
        TechnicianInvite invite = new TechnicianInvite(tenantId, token);
        try {
            invite = technicianInviteRepository.save(invite);
        } catch (Exception e) {
            log.error("Failed to save technician invite for tenant {}: {}", tenantId, e.getMessage(), e);
            throw new BusinessException(ErrorCode.INTERNAL_ERROR,
                    "Não foi possível criar o link de convite. Verifique se a base de dados está atualizada (tabela technician_invites). Detalhe: " + (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()));
        }
        String base = techAppBaseUrl == null || techAppBaseUrl.isEmpty()
                ? "http://localhost:3004"
                : (techAppBaseUrl.endsWith("/") ? techAppBaseUrl.substring(0, techAppBaseUrl.length() - 1) : techAppBaseUrl);
        String inviteLink = base + "/#/join?token=" + token.toString();
        return ResponseEntity.ok(new CreateInviteResponse(invite.getToken().toString(), inviteLink));
    }

    @PostMapping("/client-invites")
    @Operation(summary = "Create client invite link", description = "Creates a unique invite link for clients to join the company")
    public ResponseEntity<ClientInviteLinkResponse> createClientInvite() {
        UUID tenantId = currentUserProvider.requireCurrentUser().getTenantId();
        if (tenantId == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                    "Session has no company. Log in again with a company account.");
        }
        ClientInviteResult result = clientInviteService.createInvite(tenantId);
        return ResponseEntity.ok(new ClientInviteLinkResponse(
                result.inviteId().toString(),
                result.token().toString(),
                result.inviteLink()));
    }

    @GetMapping("/clients")
    @Operation(summary = "List clients", description = "Returns all clients associated with the company (tenant)")
    public ResponseEntity<List<EmpresaClientService.ClientListItemResponse>> getClients() {
        return ResponseEntity.ok(empresaClientService.listClientsForCurrentTenant());
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Dashboard", description = "Retorna métricas do dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        try {
            Map<String, Object> dashboard = new HashMap<>();
            dashboard.put("totalJobs", 1284);
            dashboard.put("totalJobsChange", 12);
            dashboard.put("revenue", 48200);
            dashboard.put("revenueChange", 8);
            dashboard.put("avgResponseTime", 42);
            dashboard.put("avgResponseTimeChange", -2);
            dashboard.put("activeTechnicians", 24);
            dashboard.put("totalTechnicians", 30);
            dashboard.put("utilizationRate", 80);
            return ResponseEntity.ok(dashboard);
        } catch (Exception e) {
            log.error("getDashboard failed", e);
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("totalJobs", 0);
            fallback.put("totalJobsChange", 0);
            fallback.put("revenue", 0);
            fallback.put("revenueChange", 0);
            fallback.put("avgResponseTime", 0);
            fallback.put("avgResponseTimeChange", 0);
            fallback.put("activeTechnicians", 0);
            fallback.put("totalTechnicians", 0);
            fallback.put("utilizationRate", 0);
            return ResponseEntity.ok(fallback);
        }
    }

    @GetMapping("/dashboard/orders-by-status")
    @Operation(summary = "Orders by Status", description = "Retorna contagem de ordens por status")
    public ResponseEntity<Map<String, Integer>> getOrdersByStatus() {
        Map<String, Integer> ordersByStatus = new HashMap<>();
        ordersByStatus.put("scheduled", 45);
        ordersByStatus.put("inProgress", 12);
        ordersByStatus.put("completed", 156);
        ordersByStatus.put("cancelled", 3);
        return ResponseEntity.ok(ordersByStatus);
    }

    @GetMapping("/dashboard/weekly-jobs")
    @Operation(summary = "Weekly Jobs", description = "Retorna dados de jobs da semana")
    public ResponseEntity<List<Map<String, Object>>> getWeeklyJobs() {
        try {
            List<Map<String, Object>> weeklyData = new ArrayList<>();
            String[] days = { "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" };
            int[] jobs = { 12, 19, 15, 22, 30, 25, 18 };
            for (int i = 0; i < days.length; i++) {
                Map<String, Object> day = new HashMap<>();
                day.put("name", days[i]);
                day.put("jobs", jobs[i]);
                weeklyData.add(day);
            }
            return ResponseEntity.ok(weeklyData);
        } catch (Exception e) {
            log.error("getWeeklyJobs failed", e);
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    // ==================== TECHNICIANS (REAL DATA) ====================

    @GetMapping("/technicians")
    @Operation(summary = "List Technicians", description = "Lista técnicos da empresa")
    public ResponseEntity<List<TechnicianResponse>> getTechnicians(
            @RequestParam(required = false) String status) {
        log.info("Listing technicians with status filter: {}", status);

        try {
            log.info("Listing technicians with status filter: {}", status);
            UserStatus userStatus = null;
            if (status != null && !status.isEmpty()) {
                try {
                    userStatus = UserStatus.valueOf(status.toUpperCase());
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid status filter: {}", status);
                }
            }
            List<TechnicianResponse> technicians = technicianService.listTechnicians(userStatus);
            return ResponseEntity.ok(technicians);
        } catch (Exception e) {
            log.error("getTechnicians failed", e);
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    @GetMapping("/technicians/{id}")
    @Operation(summary = "Get Technician", description = "Retorna detalhes de um técnico")
    public ResponseEntity<TechnicianDetailResponse> getTechnician(@PathVariable UUID id) {
        log.info("Getting technician details: {}", id);
        TechnicianDetailResponse technician = technicianService.getTechnicianDetails(id);
        return ResponseEntity.ok(technician);
    }

    @GetMapping("/fleet/locations")
    @Operation(summary = "Fleet Locations", description = "Retorna localizações atuais dos técnicos para o mapa de frota")
    public ResponseEntity<List<FleetLocationResponse>> getFleetLocations() {
        log.info("Getting fleet locations");
        List<FleetLocationResponse> locations = technicianService.getFleetLocations();
        return ResponseEntity.ok(locations);
    }

    @PatchMapping("/technicians/{id}/status")
    @Operation(summary = "Update Technician Status", description = "Atualiza status do técnico (aprovar/rejeitar/suspender)")
    public ResponseEntity<TechnicianResponse> updateTechnicianStatus(
            @PathVariable UUID id,
            @RequestBody UpdateStatusRequest request) {
        log.info("Updating technician {} status to: {}", id, request.status());

        TechnicianResponse result;

        switch (request.status().toUpperCase()) {
            case "APPROVED" -> result = technicianService.approveTechnician(id);
            case "REJECTED" -> result = technicianService.rejectTechnician(id, request.notes());
            case "SUSPENDED" -> result = technicianService.suspendTechnician(id, request.notes());
            default -> throw new IllegalArgumentException("Status inválido: " + request.status());
        }

        return ResponseEntity.ok(result);
    }

    @PostMapping("/technicians/{id}/reactivate")
    @Operation(summary = "Reactivate Technician", description = "Reativa um técnico suspenso ou rejeitado")
    public ResponseEntity<TechnicianResponse> reactivateTechnician(@PathVariable UUID id) {
        log.info("Reactivating technician: {}", id);
        TechnicianResponse result = technicianService.reactivateTechnician(id);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/technicians/{id}/documents")
    @Operation(summary = "Get Technician Documents", description = "Retorna documentos do técnico")
    public ResponseEntity<List<TechnicianDocumentResponse>> getTechnicianDocuments(@PathVariable UUID id) {
        log.info("Getting documents for technician: {}", id);
        List<TechnicianDocumentResponse> documents = technicianService.getTechnicianDocuments(id);
        return ResponseEntity.ok(documents);
    }

    @PatchMapping("/technicians/{techId}/documents/{docId}/review")
    @Operation(summary = "Review Document", description = "Aprova ou rejeita documento")
    public ResponseEntity<Map<String, Object>> reviewDocument(
            @PathVariable UUID techId,
            @PathVariable UUID docId,
            @RequestBody Map<String, String> request) {
        // TODO: Implementar review de documento quando storage estiver pronto
        log.info("Reviewing document {} for technician {}: {}", docId, techId, request.get("status"));
        Map<String, Object> doc = new HashMap<>();
        doc.put("id", docId);
        doc.put("status", request.get("status"));
        doc.put("reviewedAt", new Date().toString());
        return ResponseEntity.ok(doc);
    }

    // ==================== DISPATCH (REAL DATA) ====================

    @GetMapping("/dispatch/calendar")
    @Operation(summary = "Dispatch Calendar", description = "Retorna calendário de despacho com dados reais")
    public ResponseEntity<List<DispatchCalendarEntry>> getDispatchCalendar(
            @RequestParam(required = false) String date) {
        log.info("Getting dispatch calendar for date: {}", date);

        LocalDate targetDate = date != null ? LocalDate.parse(date) : LocalDate.now();

        // Buscar técnicos aprovados
        List<TechnicianResponse> technicians = technicianService.listTechnicians(UserStatus.APPROVED);

        // Buscar ordens do dia
        List<OrderResponse> dayOrders = orderService.getOrdersByDate(targetDate);

        // Agrupar ordens por técnico
        Map<UUID, List<OrderResponse>> ordersByTech = dayOrders.stream()
                .filter(o -> o.technician() != null)
                .collect(Collectors.groupingBy(o -> o.technician().id()));

        // Montar calendário
        List<DispatchCalendarEntry> calendar = technicians.stream()
                .map(tech -> new DispatchCalendarEntry(
                        tech.id().toString(),
                        tech.name(),
                        tech.avatarUrl(),
                        tech.skills(),
                        tech.isOnline(),
                        ordersByTech.getOrDefault(tech.id(), List.of())))
                .collect(Collectors.toList());

        return ResponseEntity.ok(calendar);
    }

    @GetMapping("/dispatch/unassigned")
    @Operation(summary = "Unassigned Orders", description = "Lista ordens não atribuídas")
    public ResponseEntity<List<OrderResponse>> getUnassignedOrders() {
        log.info("Getting unassigned orders");
        List<OrderResponse> orders = orderService.getUnassignedOrders();
        return ResponseEntity.ok(orders);
    }

    @PostMapping("/dispatch/suggest")
    @Operation(summary = "Suggest Technician", description = "Sugere técnicos para uma ordem")
    public ResponseEntity<List<TechnicianSuggestion>> suggestTechnician(@RequestBody Map<String, String> request) {
        log.info("Suggesting technicians for order: {}", request.get("orderId"));

        // Para simplificar, retorna os primeiros técnicos disponíveis
        List<TechnicianResponse> technicians = technicianService.listTechnicians(UserStatus.APPROVED);

        List<TechnicianSuggestion> suggestions = technicians.stream()
                .limit(5)
                .map(tech -> new TechnicianSuggestion(
                        tech.id().toString(),
                        tech.name(),
                        (int) (Math.random() * 30 + 70), // Score simulado 70-100
                        "Available and skilled",
                        (int) (Math.random() * 30 + 10) // ETA 10-40 min
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(suggestions);
    }

    // ==================== ORDERS (REAL DATA) ====================

    @GetMapping("/orders")
    @Operation(summary = "List Orders", description = "Lista ordens de serviço")
    public ResponseEntity<List<OrderResponse>> getOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String technicianId) {
        log.info("Listing orders - status: {}, date: {}, technicianId: {}", status, date, technicianId);

        if (date != null) {
            LocalDate targetDate = LocalDate.parse(date);
            List<OrderResponse> orders = orderService.getOrdersByDate(targetDate);
            return ResponseEntity.ok(orders);
        }

        // Se não tiver data, retorna ordens de hoje
        List<OrderResponse> orders = orderService.getOrdersByDate(LocalDate.now());
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/orders/{id}")
    @Operation(summary = "Get Order", description = "Retorna detalhes de uma ordem")
    public ResponseEntity<OrderResponse> getOrder(@PathVariable UUID id) {
        log.info("Getting order: {}", id);
        OrderResponse order = orderService.getOrder(id);
        return ResponseEntity.ok(order);
    }

    @PostMapping("/orders")
    @Operation(summary = "Create Order", description = "Cria nova ordem de serviço")
    public ResponseEntity<OrderResponse> createNewOrder(@RequestBody CreateOrderRequest request) {
        log.info("Creating order: {}", request.title());
        OrderResponse order = orderService.createOrder(request);
        return ResponseEntity.ok(order);
    }

    @PatchMapping("/orders/{id}/assign")
    @Operation(summary = "Assign Technician", description = "Atribui técnico a uma ordem. Suporta reatribuição: a ordem pode já estar atribuída a outro técnico.")
    public ResponseEntity<OrderResponse> assignTechnician(
            @PathVariable UUID id,
            @RequestBody AssignRequest request) {
        log.info("Assigning technician {} to order {}", request.technicianId(), id);

        OrderResponse order;
        if (request.startTime() != null) {
            // Atribuir e agendar em um só passo
            order = orderService.assignAndSchedule(
                    id,
                    UUID.fromString(request.technicianId()),
                    request.date() != null ? LocalDate.parse(request.date()) : LocalDate.now(),
                    LocalTime.parse(request.startTime()));
        } else {
            // Apenas atribuir
            order = orderService.assignTechnician(id, UUID.fromString(request.technicianId()));
        }

        return ResponseEntity.ok(order);
    }

    @PatchMapping("/orders/{id}/reschedule")
    @Operation(summary = "Reschedule Order", description = "Reagenda uma ordem")
    public ResponseEntity<OrderResponse> rescheduleOrder(
            @PathVariable UUID id,
            @RequestBody RescheduleRequest request) {
        log.info("Rescheduling order {} to {} at {}", id, request.scheduledDate(), request.scheduledStartTime());

        OrderResponse order = orderService.rescheduleOrder(
                id,
                LocalDate.parse(request.scheduledDate()),
                LocalTime.parse(request.scheduledStartTime()));

        return ResponseEntity.ok(order);
    }

    @PatchMapping("/orders/{id}/unassign")
    @Operation(summary = "Unassign Order", description = "Remove a atribuição do técnico e devolve a ordem ao pool de não atribuídas")
    public ResponseEntity<OrderResponse> unassignOrder(@PathVariable UUID id) {
        log.info("Unassigning order {}", id);
        OrderResponse order = orderService.unassignOrder(id);
        return ResponseEntity.ok(order);
    }

    // ==================== BILLING ====================

    @GetMapping("/billing/subscription")
    @Operation(summary = "My Subscription", description = "Retorna informações da assinatura da empresa")
    public ResponseEntity<SubscriptionResponse> getMySubscription() {
        UUID tenantId = currentUserProvider.requireCurrentUser().getTenantId();

        return subscriptionService.getSubscription(tenantId)
                .map(this::toSubscriptionResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/billing/invoices")
    @Operation(summary = "My Invoices", description = "Lista faturas da empresa")
    public ResponseEntity<List<InvoiceResponse>> getMyInvoices() {
        UUID tenantId = currentUserProvider.requireCurrentUser().getTenantId();
        List<Invoice> invoices = billingService.listInvoices(tenantId);

        return ResponseEntity.ok(invoices.stream().map(this::toInvoiceResponse).toList());
    }

    @GetMapping("/billing/usage")
    @Operation(summary = "My Usage", description = "Retorna relatório de uso do mês")
    public ResponseEntity<UsageTrackingService.UsageReport> getMyUsage(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {

        UUID tenantId = currentUserProvider.requireCurrentUser().getTenantId();
        java.time.YearMonth yearMonth = (year != null && month != null)
                ? java.time.YearMonth.of(year, month)
                : java.time.YearMonth.now();

        return ResponseEntity.ok(usageTrackingService.generateReport(tenantId, yearMonth));
    }

    @GetMapping("/billing/credits")
    @Operation(summary = "My Credits", description = "Retorna saldo de créditos")
    public ResponseEntity<CreditBalanceResponse> getMyCredits() {
        UUID tenantId = currentUserProvider.requireCurrentUser().getTenantId();

        int totalAvailable = creditService.getBalance(tenantId);
        List<CreditBalance> balances = creditService.listBalances(tenantId);

        return ResponseEntity.ok(new CreditBalanceResponse(
                tenantId,
                totalAvailable,
                balances.stream().map(this::toCreditBalanceItem).toList()));
    }

    // ========== Helper Methods for Billing ==========

    private SubscriptionResponse toSubscriptionResponse(Subscription sub) {
        Map<String, Integer> userCounts = new HashMap<>();
        for (SubscriptionItem item : sub.getItems()) {
            userCounts.put(item.getItemType().name(), item.getQuantity());
        }

        return new SubscriptionResponse(
                sub.getId().toString(),
                sub.getPlanEdition().name(),
                sub.getStatus().name(),
                sub.getMonthlyBaseAmount(),
                sub.calculateTotalAmount(),
                userCounts,
                sub.getCurrentPeriodStart() != null ? sub.getCurrentPeriodStart().toString() : null,
                sub.getCurrentPeriodEnd() != null ? sub.getCurrentPeriodEnd().toString() : null);
    }

    private InvoiceResponse toInvoiceResponse(Invoice inv) {
        return new InvoiceResponse(
                inv.getId().toString(),
                inv.getInvoiceNumber(),
                inv.getPeriodStart().toString(),
                inv.getPeriodEnd().toString(),
                inv.getSubtotal(),
                inv.getTaxAmount(),
                inv.getTotalAmount(),
                inv.getStatus().name(),
                inv.getDueDate().toString(),
                inv.getPaidAt() != null ? inv.getPaidAt().toString() : null,
                inv.getLines().stream().map(l -> new InvoiceLineResponse(
                        l.getDescription(),
                        l.getQuantity(),
                        l.getUnitPrice(),
                        l.getTotal())).toList());
    }

    private CreditBalanceItem toCreditBalanceItem(CreditBalance cb) {
        return new CreditBalanceItem(
                cb.getId().toString(),
                cb.getCreditsPurchased(),
                cb.getCreditsUsed(),
                cb.getCreditsRemaining(),
                cb.getAmountPaid(),
                cb.getPurchasedAt() != null ? cb.getPurchasedAt().toString() : null,
                cb.getExpiresAt() != null ? cb.getExpiresAt().toString() : null);
    }

    // ========== Request/Response DTOs ==========

    public record UpdateStatusRequest(String status, String notes) {}

    public record TenantInfoResponse(String id, String name, String domain) {}

    public record CreateInviteResponse(String token, String inviteLink) {}

    public record ClientInviteLinkResponse(String inviteId, String token, String inviteLink) {}

    public record DispatchCalendarEntry(
            String technicianId,
            String technicianName,
            String technicianAvatar,
            List<String> skills,
            boolean isOnline,
            List<OrderResponse> orders) {
    }

    public record TechnicianSuggestion(
            String technicianId,
            String technicianName,
            int score,
            String reason,
            int estimatedArrival) {
    }

    public record AssignRequest(
            String technicianId,
            String date,
            String startTime) {
    }

    public record RescheduleRequest(
            String scheduledDate,
            String scheduledStartTime) {
    }

    // Billing DTOs
    public record SubscriptionResponse(
            String id,
            String planEdition,
            String status,
            java.math.BigDecimal monthlyBaseAmount,
            java.math.BigDecimal totalAmount,
            Map<String, Integer> userCounts,
            String periodStart,
            String periodEnd) {
    }

    public record InvoiceResponse(
            String id,
            String invoiceNumber,
            String periodStart,
            String periodEnd,
            java.math.BigDecimal subtotal,
            java.math.BigDecimal taxAmount,
            java.math.BigDecimal totalAmount,
            String status,
            String dueDate,
            String paidAt,
            List<InvoiceLineResponse> lines) {
    }

    public record InvoiceLineResponse(
            String description,
            int quantity,
            java.math.BigDecimal unitPrice,
            java.math.BigDecimal total) {
    }

    public record CreditBalanceResponse(
            UUID tenantId,
            int totalAvailable,
            List<CreditBalanceItem> balances) {
    }

    public record CreditBalanceItem(
            String id,
            int purchased,
            int used,
            int remaining,
            java.math.BigDecimal amountPaid,
            String purchasedAt,
            String expiresAt) {
    }
}
