package com.oxfield.services.application.service;

import com.oxfield.services.adapter.output.persistence.InvoiceRepository;
import com.oxfield.services.adapter.output.persistence.SubscriptionRepository;
import com.oxfield.services.adapter.output.persistence.TenantRepository;
import com.oxfield.services.domain.entity.*;
import com.oxfield.services.domain.enums.InvoiceStatus;
import com.oxfield.services.domain.enums.SubscriptionStatus;
import com.oxfield.services.domain.enums.TenantStatus;
import com.oxfield.services.shared.exception.BusinessException;
import com.oxfield.services.shared.exception.ErrorCode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service para gerenciar billing e faturas.
 */
@Service
@Transactional
public class BillingService {

    private static final Logger log = LoggerFactory.getLogger(BillingService.class);
    private static final DateTimeFormatter INVOICE_NUMBER_FORMAT = DateTimeFormatter.ofPattern("yyyyMM");

    private final InvoiceRepository invoiceRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final TenantRepository tenantRepository;
    private final SubscriptionService subscriptionService;

    public BillingService(InvoiceRepository invoiceRepository,
                          SubscriptionRepository subscriptionRepository,
                          TenantRepository tenantRepository,
                          SubscriptionService subscriptionService) {
        this.invoiceRepository = invoiceRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.tenantRepository = tenantRepository;
        this.subscriptionService = subscriptionService;
    }

    /**
     * Gera fatura mensal para um tenant.
     */
    public Invoice generateMonthlyInvoice(UUID tenantId) {
        log.info("Gerando fatura mensal para tenant {}", tenantId);

        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND, "Tenant não encontrado"));

        Subscription subscription = subscriptionRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND, "Assinatura não encontrada"));

        if (!subscription.canUseService()) {
            throw new BusinessException(ErrorCode.INVALID_OPERATION, "Assinatura não está ativa");
        }

        // Calcular período
        LocalDate periodStart = subscription.getCurrentPeriodStart();
        LocalDate periodEnd = subscription.getCurrentPeriodEnd();

        if (periodStart == null || periodEnd == null) {
            periodStart = LocalDate.now().withDayOfMonth(1);
            periodEnd = periodStart.plusMonths(1).minusDays(1);
        }

        // Gerar número da fatura
        String invoiceNumber = generateInvoiceNumber();

        // Criar fatura
        Invoice invoice = new Invoice(tenant, subscription, invoiceNumber, periodStart, periodEnd);

        // Adicionar linha do plano base
        InvoiceLine baseLine = new InvoiceLine(
                invoice,
                "Plano " + subscription.getPlanEdition().getDisplayName() + " - Mensalidade",
                1,
                subscription.getMonthlyBaseAmount()
        );
        invoice.addLine(baseLine);

        // Adicionar linhas para cada tipo de usuário
        for (SubscriptionItem item : subscription.getItems()) {
            if (item.getQuantity() > 0) {
                InvoiceLine userLine = new InvoiceLine(
                        invoice,
                        item.getItemType().getDisplayName() + " (" + item.getQuantity() + " usuários)",
                        item.getQuantity(),
                        item.getUnitPrice()
                );
                invoice.addLine(userLine);
            }
        }

        // Recalcular totais
        invoice.recalculateTotals();

        // Finalizar fatura (mudar de DRAFT para PENDING)
        invoice.finalize();

        invoice = invoiceRepository.save(invoice);
        log.info("Fatura {} gerada com sucesso. Total: R$ {}", invoice.getInvoiceNumber(), invoice.getTotalAmount());

        // Atualizar MRR do tenant
        tenant.setMrr(invoice.getTotalAmount());
        tenantRepository.save(tenant);

        return invoice;
    }

    /**
     * Processa pagamento de uma fatura.
     */
    public PaymentResult processInvoicePayment(UUID invoiceId) {
        log.info("Processando pagamento da fatura {}", invoiceId);

        Invoice invoice = getInvoiceById(invoiceId);

        if (invoice.isPaid()) {
            return new PaymentResult(true, "Fatura já está paga", invoice.getStripePaymentIntentId());
        }

        if (invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new BusinessException(ErrorCode.INVALID_OPERATION, "Fatura cancelada não pode ser paga");
        }

        // Aqui seria integrado com o gateway de pagamento (Stripe)
        // Por enquanto, simular sucesso
        String transactionId = "pi_" + UUID.randomUUID().toString().replace("-", "").substring(0, 24);
        
        return new PaymentResult(true, "Pagamento processado", transactionId);
    }

    /**
     * Marca fatura como paga (chamado pelo webhook do gateway).
     */
    public void markAsPaid(UUID invoiceId, String transactionId) {
        log.info("Marcando fatura {} como paga. Transação: {}", invoiceId, transactionId);

        Invoice invoice = getInvoiceById(invoiceId);
        invoice.markAsPaid(transactionId);
        invoiceRepository.save(invoice);

        // Renovar período da assinatura
        if (invoice.getSubscription() != null) {
            subscriptionService.renewPeriod(invoice.getSubscription().getId());
        }

        log.info("Fatura {} marcada como paga", invoice.getInvoiceNumber());
    }

    /**
     * Marca fatura como paga por número.
     */
    public void markAsPaidByNumber(String invoiceNumber, String transactionId) {
        Invoice invoice = invoiceRepository.findByInvoiceNumber(invoiceNumber)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND, "Fatura não encontrada"));
        
        markAsPaid(invoice.getId(), transactionId);
    }

    /**
     * Suspende tenant por inadimplência.
     */
    public void suspendForNonPayment(UUID tenantId) {
        log.warn("Suspendendo tenant {} por inadimplência", tenantId);

        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND, "Tenant não encontrado"));

        tenant.setStatus(TenantStatus.DELINQUENT);
        tenantRepository.save(tenant);

        // Suspender assinatura
        subscriptionRepository.findByTenantId(tenantId)
                .ifPresent(subscription -> {
                    subscription.suspend();
                    subscriptionRepository.save(subscription);
                });

        log.warn("Tenant {} suspenso por inadimplência", tenantId);
    }

    /**
     * Reativa tenant após pagamento.
     */
    public void reactivate(UUID tenantId) {
        log.info("Reativando tenant {} após pagamento", tenantId);

        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND, "Tenant não encontrado"));

        tenant.setStatus(TenantStatus.ACTIVE);
        tenantRepository.save(tenant);

        // Reativar assinatura
        subscriptionRepository.findByTenantId(tenantId)
                .ifPresent(subscription -> {
                    subscriptionService.reactivateSubscription(subscription.getId());
                });

        log.info("Tenant {} reativado", tenantId);
    }

    /**
     * Lista faturas de um tenant.
     */
    @Transactional(readOnly = true)
    public List<Invoice> listInvoices(UUID tenantId) {
        return invoiceRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    /**
     * Obtém fatura por ID.
     */
    @Transactional(readOnly = true)
    public Invoice getInvoiceById(UUID invoiceId) {
        return invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND, "Fatura não encontrada"));
    }

    /**
     * Obtém fatura por número.
     */
    @Transactional(readOnly = true)
    public Optional<Invoice> getInvoiceByNumber(String invoiceNumber) {
        return invoiceRepository.findByInvoiceNumber(invoiceNumber);
    }

    /**
     * Lista faturas pendentes/vencidas.
     */
    @Transactional(readOnly = true)
    public List<Invoice> listOverdueInvoices() {
        return invoiceRepository.findOverdueInvoices(LocalDate.now());
    }

    /**
     * Cancela uma fatura.
     */
    public void cancelInvoice(UUID invoiceId) {
        Invoice invoice = getInvoiceById(invoiceId);
        
        if (invoice.isPaid()) {
            throw new BusinessException(ErrorCode.INVALID_OPERATION, "Não é possível cancelar fatura já paga");
        }

        invoice.cancel();
        invoiceRepository.save(invoice);
        
        log.info("Fatura {} cancelada", invoice.getInvoiceNumber());
    }

    /**
     * Processa faturas vencidas (marcar como OVERDUE, notificar).
     */
    public void processOverdueInvoices() {
        log.info("Processando faturas vencidas");

        List<Invoice> overdueInvoices = invoiceRepository.findByStatus(InvoiceStatus.PENDING)
                .stream()
                .filter(Invoice::isOverdue)
                .toList();

        for (Invoice invoice : overdueInvoices) {
            invoice.markAsOverdue();
            invoiceRepository.save(invoice);
            
            log.warn("Fatura {} marcada como vencida. Tenant: {}", 
                    invoice.getInvoiceNumber(), invoice.getTenant().getName());

            // TODO: Enviar notificação por email
        }

        log.info("Processadas {} faturas vencidas", overdueInvoices.size());
    }

    /**
     * Calcula receita total (MRR).
     */
    @Transactional(readOnly = true)
    public BigDecimal calculateMRR() {
        return subscriptionRepository.calculateTotalMRR()
                .orElse(BigDecimal.ZERO);
    }

    /**
     * Estatísticas de billing.
     */
    @Transactional(readOnly = true)
    public BillingStats getBillingStats() {
        long activeSubscriptions = subscriptionRepository.countActiveSubscriptions();
        BigDecimal mrr = calculateMRR();
        long pendingInvoices = invoiceRepository.countByStatus(InvoiceStatus.PENDING);
        long overdueInvoices = invoiceRepository.countByStatus(InvoiceStatus.OVERDUE);

        return new BillingStats(activeSubscriptions, mrr, pendingInvoices, overdueInvoices);
    }

    // ========== Helper Methods ==========

    private String generateInvoiceNumber() {
        String prefix = "INV-" + YearMonth.now().format(INVOICE_NUMBER_FORMAT) + "-";
        int maxNumber = invoiceRepository.findMaxInvoiceNumberWithPrefix(prefix + "%");
        return prefix + String.format("%04d", maxNumber + 1);
    }

    // ========== DTOs ==========

    public record PaymentResult(boolean success, String message, String transactionId) {}

    public record BillingStats(
            long activeSubscriptions,
            BigDecimal mrr,
            long pendingInvoices,
            long overdueInvoices
    ) {}
}
