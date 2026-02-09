package com.oxfield.services.application.scheduler;

import com.oxfield.services.adapter.output.persistence.SubscriptionRepository;
import com.oxfield.services.adapter.output.persistence.TenantRepository;
import com.oxfield.services.adapter.output.payment.StripeGateway;
import com.oxfield.services.application.service.BillingService;
import com.oxfield.services.application.service.CreditService;
import com.oxfield.services.domain.entity.CreditBalance;
import com.oxfield.services.domain.entity.Invoice;
import com.oxfield.services.domain.entity.Subscription;
import com.oxfield.services.domain.entity.Tenant;
import com.oxfield.services.domain.enums.SubscriptionStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

/**
 * Scheduler para processamento automático de billing.
 */
@Component
public class BillingScheduler {

    private static final Logger log = LoggerFactory.getLogger(BillingScheduler.class);

    private final BillingService billingService;
    private final SubscriptionRepository subscriptionRepository;
    private final TenantRepository tenantRepository;
    private final StripeGateway stripeGateway;
    private final CreditService creditService;

    public BillingScheduler(BillingService billingService,
                            SubscriptionRepository subscriptionRepository,
                            TenantRepository tenantRepository,
                            StripeGateway stripeGateway,
                            CreditService creditService) {
        this.billingService = billingService;
        this.subscriptionRepository = subscriptionRepository;
        this.tenantRepository = tenantRepository;
        this.stripeGateway = stripeGateway;
        this.creditService = creditService;
    }

    /**
     * Executa diariamente à 00:30 para gerar faturas do dia.
     * Processa assinaturas cujo billing_cycle_day é o dia atual.
     */
    @Scheduled(cron = "0 30 0 * * ?") // 00:30 todos os dias
    public void processMonthlyBilling() {
        int today = LocalDate.now().getDayOfMonth();
        log.info("=== Iniciando processamento de billing mensal (dia {}) ===", today);

        List<Subscription> subscriptions = subscriptionRepository
                .findActiveSubscriptionsForBillingDay(today);

        log.info("Encontradas {} assinaturas para processar", subscriptions.size());

        int success = 0;
        int failed = 0;

        for (Subscription subscription : subscriptions) {
            try {
                processSubscription(subscription);
                success++;
            } catch (Exception e) {
                log.error("Erro ao processar assinatura {}: {}", 
                        subscription.getId(), e.getMessage(), e);
                failed++;
            }
        }

        log.info("=== Billing mensal concluído: {} sucesso, {} falhas ===", success, failed);
    }

    /**
     * Executa diariamente às 06:00 para verificar faturas vencidas.
     */
    @Scheduled(cron = "0 0 6 * * ?") // 06:00 todos os dias
    public void checkOverdueInvoices() {
        log.info("=== Verificando faturas vencidas ===");
        
        billingService.processOverdueInvoices();
        
        log.info("=== Verificação de faturas vencidas concluída ===");
    }

    /**
     * Executa diariamente às 07:00 para processar suspensões.
     * Suspende tenants com faturas vencidas há mais de 15 dias.
     */
    @Scheduled(cron = "0 0 7 * * ?") // 07:00 todos os dias
    public void processDelinquencies() {
        log.info("=== Processando inadimplências ===");

        List<Subscription> overdueSubscriptions = subscriptionRepository
                .findOverdueSubscriptions(LocalDate.now().minusDays(15));

        for (Subscription subscription : overdueSubscriptions) {
            try {
                log.warn("Suspendendo tenant {} por inadimplência", 
                        subscription.getTenant().getName());
                billingService.suspendForNonPayment(subscription.getTenant().getId());
            } catch (Exception e) {
                log.error("Erro ao suspender tenant {}: {}", 
                        subscription.getTenant().getId(), e.getMessage());
            }
        }

        log.info("=== Processamento de inadimplências concluído: {} tenants suspensos ===", 
                overdueSubscriptions.size());
    }

    /**
     * Executa semanalmente às segundas 08:00 para notificar créditos expirando.
     */
    @Scheduled(cron = "0 0 8 ? * MON") // Segunda-feira às 08:00
    public void notifyExpiringCredits() {
        log.info("=== Notificando créditos expirando ===");

        List<CreditBalance> expiringSoon = creditService.getExpiringSoon(30); // 30 dias

        for (CreditBalance balance : expiringSoon) {
            log.info("Créditos expirando para tenant {}: {} créditos restantes, expira em {}", 
                    balance.getTenant().getName(),
                    balance.getCreditsRemaining(),
                    balance.getExpiresAt());
            
            // TODO: Enviar notificação por email
        }

        log.info("=== Notificações de créditos enviadas: {} tenants ===", expiringSoon.size());
    }

    /**
     * Executa primeiro dia de cada mês às 01:00 para gerar relatório mensal.
     */
    @Scheduled(cron = "0 0 1 1 * ?") // Dia 1 às 01:00
    public void generateMonthlyReport() {
        log.info("=== Gerando relatório mensal de billing ===");

        BillingService.BillingStats stats = billingService.getBillingStats();

        log.info("==================================================");
        log.info("RELATÓRIO MENSAL DE BILLING");
        log.info("==================================================");
        log.info("Assinaturas ativas: {}", stats.activeSubscriptions());
        log.info("MRR Total: R$ {}", stats.mrr());
        log.info("Faturas pendentes: {}", stats.pendingInvoices());
        log.info("Faturas vencidas: {}", stats.overdueInvoices());
        log.info("==================================================");

        // TODO: Enviar relatório por email para admin
    }

    // ========== Helper Methods ==========

    private void processSubscription(Subscription subscription) {
        Tenant tenant = subscription.getTenant();
        log.info("Processando assinatura do tenant: {}", tenant.getName());

        // 1. Gerar fatura
        Invoice invoice = billingService.generateMonthlyInvoice(tenant.getId());
        log.info("Fatura gerada: {} - R$ {}", invoice.getInvoiceNumber(), invoice.getTotalAmount());

        // 2. Processar pagamento automático se tiver payment method
        if (subscription.getStripeCustomerId() != null && 
            subscription.getDefaultPaymentMethodId() != null) {
            
            StripeGateway.PaymentResult result = stripeGateway.chargeInvoice(
                    invoice, 
                    subscription.getStripeCustomerId()
            );

            if (result.success()) {
                billingService.markAsPaid(invoice.getId(), result.transactionId());
                log.info("Pagamento processado com sucesso: {}", result.transactionId());
            } else {
                log.warn("Falha no pagamento: {}", result.errorMessage());
                // Marcar assinatura como past_due
                subscription.markPastDue();
                subscriptionRepository.save(subscription);
            }
        } else {
            log.info("Pagamento manual necessário - sem payment method configurado");
            // TODO: Enviar fatura por email
        }
    }
}
