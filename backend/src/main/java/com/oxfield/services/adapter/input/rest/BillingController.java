package com.oxfield.services.adapter.input.rest;

import com.oxfield.services.adapter.output.payment.StripeGateway;
import com.oxfield.services.application.service.BillingService;
import com.oxfield.services.application.service.CreditService;
import com.oxfield.services.application.service.SubscriptionService;
import com.oxfield.services.application.service.UsageTrackingService;
import com.oxfield.services.domain.entity.CreditBalance;
import com.oxfield.services.domain.entity.Invoice;
import com.oxfield.services.domain.entity.Subscription;
import com.oxfield.services.domain.enums.PlanEdition;
import com.oxfield.services.domain.enums.SubscriptionItemType;
import com.oxfield.services.shared.security.CurrentUserProvider;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Controller para endpoints de billing do Admin Global.
 */
@RestController
@RequestMapping("/admin/billing")
@Tag(name = "Billing - Admin Global", description = "Endpoints de billing para administração global")
@PreAuthorize("hasRole('ADMIN_GLOBAL')")
public class BillingController {

    private final BillingService billingService;
    private final SubscriptionService subscriptionService;
    private final CreditService creditService;
    private final UsageTrackingService usageTrackingService;
    private final StripeGateway stripeGateway;
    private final CurrentUserProvider currentUserProvider;

    public BillingController(BillingService billingService,
                             SubscriptionService subscriptionService,
                             CreditService creditService,
                             UsageTrackingService usageTrackingService,
                             StripeGateway stripeGateway,
                             CurrentUserProvider currentUserProvider) {
        this.billingService = billingService;
        this.subscriptionService = subscriptionService;
        this.creditService = creditService;
        this.usageTrackingService = usageTrackingService;
        this.stripeGateway = stripeGateway;
        this.currentUserProvider = currentUserProvider;
    }

    // ========== Dashboard Stats ==========

    @GetMapping("/stats")
    @Operation(summary = "Estatísticas de billing")
    public ResponseEntity<BillingService.BillingStats> getStats() {
        return ResponseEntity.ok(billingService.getBillingStats());
    }

    @GetMapping("/mrr")
    @Operation(summary = "MRR total")
    public ResponseEntity<Map<String, BigDecimal>> getMRR() {
        BigDecimal mrr = billingService.calculateMRR();
        return ResponseEntity.ok(Map.of("mrr", mrr));
    }

    // ========== Subscriptions ==========

    @GetMapping("/subscriptions/{tenantId}")
    @Operation(summary = "Obtém assinatura de um tenant")
    public ResponseEntity<SubscriptionResponse> getSubscription(@PathVariable UUID tenantId) {
        return subscriptionService.getSubscription(tenantId)
                .map(this::toSubscriptionResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/subscriptions/{tenantId}")
    @Operation(summary = "Cria assinatura para tenant")
    public ResponseEntity<SubscriptionResponse> createSubscription(
            @PathVariable UUID tenantId,
            @RequestBody CreateSubscriptionRequest request) {
        
        Subscription subscription = subscriptionService.createSubscription(
                tenantId, 
                request.planEdition()
        );
        return ResponseEntity.ok(toSubscriptionResponse(subscription));
    }

    @PatchMapping("/subscriptions/{subscriptionId}/plan")
    @Operation(summary = "Altera plano da assinatura")
    public ResponseEntity<SubscriptionResponse> changePlan(
            @PathVariable UUID subscriptionId,
            @RequestBody ChangePlanRequest request) {
        
        Subscription subscription = subscriptionService.changePlan(subscriptionId, request.newEdition());
        return ResponseEntity.ok(toSubscriptionResponse(subscription));
    }

    @DeleteMapping("/subscriptions/{subscriptionId}")
    @Operation(summary = "Cancela assinatura")
    public ResponseEntity<Void> cancelSubscription(
            @PathVariable UUID subscriptionId,
            @RequestBody CancelSubscriptionRequest request) {
        
        subscriptionService.cancelSubscription(subscriptionId, request.reason());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/subscriptions/{subscriptionId}/reactivate")
    @Operation(summary = "Reativa assinatura")
    public ResponseEntity<SubscriptionResponse> reactivateSubscription(@PathVariable UUID subscriptionId) {
        subscriptionService.reactivateSubscription(subscriptionId);
        Subscription subscription = subscriptionService.getSubscriptionById(subscriptionId);
        return ResponseEntity.ok(toSubscriptionResponse(subscription));
    }

    // ========== Invoices ==========

    @GetMapping("/invoices")
    @Operation(summary = "Lista todas as faturas pendentes/vencidas")
    public ResponseEntity<List<InvoiceResponse>> listAllInvoices() {
        List<Invoice> invoices = billingService.listOverdueInvoices();
        return ResponseEntity.ok(invoices.stream().map(this::toInvoiceResponse).toList());
    }

    @GetMapping("/invoices/tenant/{tenantId}")
    @Operation(summary = "Lista faturas de um tenant")
    public ResponseEntity<List<InvoiceResponse>> listTenantInvoices(@PathVariable UUID tenantId) {
        List<Invoice> invoices = billingService.listInvoices(tenantId);
        return ResponseEntity.ok(invoices.stream().map(this::toInvoiceResponse).toList());
    }

    @GetMapping("/invoices/{invoiceId}")
    @Operation(summary = "Obtém detalhes de uma fatura")
    public ResponseEntity<InvoiceResponse> getInvoice(@PathVariable UUID invoiceId) {
        Invoice invoice = billingService.getInvoiceById(invoiceId);
        return ResponseEntity.ok(toInvoiceResponse(invoice));
    }

    @PostMapping("/invoices/generate/{tenantId}")
    @Operation(summary = "Gera fatura manualmente para tenant")
    public ResponseEntity<InvoiceResponse> generateInvoice(@PathVariable UUID tenantId) {
        Invoice invoice = billingService.generateMonthlyInvoice(tenantId);
        return ResponseEntity.ok(toInvoiceResponse(invoice));
    }

    @PostMapping("/invoices/{invoiceId}/mark-paid")
    @Operation(summary = "Marca fatura como paga manualmente")
    public ResponseEntity<InvoiceResponse> markInvoiceAsPaid(
            @PathVariable UUID invoiceId,
            @RequestBody MarkPaidRequest request) {
        
        billingService.markAsPaid(invoiceId, request.transactionId());
        Invoice invoice = billingService.getInvoiceById(invoiceId);
        return ResponseEntity.ok(toInvoiceResponse(invoice));
    }

    @DeleteMapping("/invoices/{invoiceId}")
    @Operation(summary = "Cancela uma fatura")
    public ResponseEntity<Void> cancelInvoice(@PathVariable UUID invoiceId) {
        billingService.cancelInvoice(invoiceId);
        return ResponseEntity.noContent().build();
    }

    // ========== Credits ==========

    @GetMapping("/credits/{tenantId}")
    @Operation(summary = "Saldo de créditos de um tenant")
    public ResponseEntity<CreditBalanceResponse> getCredits(@PathVariable UUID tenantId) {
        int balance = creditService.getBalance(tenantId);
        List<CreditBalance> balances = creditService.listBalances(tenantId);
        
        return ResponseEntity.ok(new CreditBalanceResponse(
                tenantId,
                balance,
                balances.stream().map(this::toCreditBalanceItem).toList()
        ));
    }

    @PostMapping("/credits/{tenantId}/add")
    @Operation(summary = "Adiciona créditos manualmente")
    public ResponseEntity<CreditBalanceItem> addCredits(
            @PathVariable UUID tenantId,
            @RequestBody AddCreditsRequest request) {
        
        CreditBalance balance = creditService.purchaseCredits(
                tenantId, 
                request.credits(), 
                request.amount()
        );
        return ResponseEntity.ok(toCreditBalanceItem(balance));
    }

    // ========== Usage Reports ==========

    @GetMapping("/usage/{tenantId}")
    @Operation(summary = "Relatório de uso de um tenant")
    public ResponseEntity<UsageTrackingService.UsageReport> getUsageReport(
            @PathVariable UUID tenantId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        
        YearMonth yearMonth = (year != null && month != null) 
                ? YearMonth.of(year, month) 
                : YearMonth.now();
        
        return ResponseEntity.ok(usageTrackingService.generateReport(tenantId, yearMonth));
    }

    // ========== Tenant Actions ==========

    @PostMapping("/tenant/{tenantId}/suspend")
    @Operation(summary = "Suspende tenant por inadimplência")
    public ResponseEntity<Void> suspendTenant(@PathVariable UUID tenantId) {
        billingService.suspendForNonPayment(tenantId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/tenant/{tenantId}/reactivate")
    @Operation(summary = "Reativa tenant após pagamento")
    public ResponseEntity<Void> reactivateTenant(@PathVariable UUID tenantId) {
        billingService.reactivate(tenantId);
        return ResponseEntity.noContent().build();
    }

    // ========== Helper Methods ==========

    private SubscriptionResponse toSubscriptionResponse(Subscription sub) {
        Map<SubscriptionItemType, Integer> userCounts = subscriptionService.getUserCounts(sub.getTenant().getId());
        
        return new SubscriptionResponse(
                sub.getId(),
                sub.getTenant().getId(),
                sub.getTenant().getName(),
                sub.getPlanEdition(),
                sub.getStatus().name(),
                sub.getMonthlyBaseAmount(),
                sub.calculateTotalAmount(),
                userCounts,
                sub.getCurrentPeriodStart(),
                sub.getCurrentPeriodEnd(),
                sub.getStripeCustomerId()
        );
    }

    private InvoiceResponse toInvoiceResponse(Invoice inv) {
        return new InvoiceResponse(
                inv.getId(),
                inv.getInvoiceNumber(),
                inv.getTenant().getId(),
                inv.getTenant().getName(),
                inv.getPeriodStart(),
                inv.getPeriodEnd(),
                inv.getSubtotal(),
                inv.getTaxAmount(),
                inv.getTotalAmount(),
                inv.getStatus().name(),
                inv.getDueDate(),
                inv.getPaidAt() != null ? inv.getPaidAt().toString() : null,
                inv.getLines().stream().map(l -> new InvoiceLineResponse(
                        l.getDescription(),
                        l.getQuantity(),
                        l.getUnitPrice(),
                        l.getTotal()
                )).toList()
        );
    }

    private CreditBalanceItem toCreditBalanceItem(CreditBalance cb) {
        return new CreditBalanceItem(
                cb.getId(),
                cb.getCreditsPurchased(),
                cb.getCreditsUsed(),
                cb.getCreditsRemaining(),
                cb.getAmountPaid(),
                cb.getPurchasedAt() != null ? cb.getPurchasedAt().toString() : null,
                cb.getExpiresAt() != null ? cb.getExpiresAt().toString() : null
        );
    }

    // ========== Request/Response DTOs ==========

    record CreateSubscriptionRequest(PlanEdition planEdition) {}
    record ChangePlanRequest(PlanEdition newEdition) {}
    record CancelSubscriptionRequest(String reason) {}
    record MarkPaidRequest(String transactionId) {}
    record AddCreditsRequest(int credits, BigDecimal amount) {}

    record SubscriptionResponse(
            UUID id,
            UUID tenantId,
            String tenantName,
            PlanEdition planEdition,
            String status,
            BigDecimal monthlyBaseAmount,
            BigDecimal totalAmount,
            Map<SubscriptionItemType, Integer> userCounts,
            LocalDate periodStart,
            LocalDate periodEnd,
            String stripeCustomerId
    ) {}

    record InvoiceResponse(
            UUID id,
            String invoiceNumber,
            UUID tenantId,
            String tenantName,
            LocalDate periodStart,
            LocalDate periodEnd,
            BigDecimal subtotal,
            BigDecimal taxAmount,
            BigDecimal totalAmount,
            String status,
            LocalDate dueDate,
            String paidAt,
            List<InvoiceLineResponse> lines
    ) {}

    record InvoiceLineResponse(
            String description,
            int quantity,
            BigDecimal unitPrice,
            BigDecimal total
    ) {}

    record CreditBalanceResponse(
            UUID tenantId,
            int totalAvailable,
            List<CreditBalanceItem> balances
    ) {}

    record CreditBalanceItem(
            UUID id,
            int purchased,
            int used,
            int remaining,
            BigDecimal amountPaid,
            String purchasedAt,
            String expiresAt
    ) {}
}
