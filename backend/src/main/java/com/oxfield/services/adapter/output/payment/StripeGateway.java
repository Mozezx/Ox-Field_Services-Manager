package com.oxfield.services.adapter.output.payment;

import com.oxfield.services.domain.entity.Invoice;
import com.oxfield.services.domain.entity.Tenant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Gateway de integração com Stripe para processamento de pagamentos.
 * 
 * NOTA: Esta é uma implementação de stub. Para produção, integrar com a SDK do Stripe.
 * 
 * Dependência Maven:
 * <dependency>
 *     <groupId>com.stripe</groupId>
 *     <artifactId>stripe-java</artifactId>
 *     <version>24.0.0</version>
 * </dependency>
 */
@Service
public class StripeGateway {

    private static final Logger log = LoggerFactory.getLogger(StripeGateway.class);

    @Value("${stripe.api.key:sk_test_default}")
    private String apiKey;

    @Value("${stripe.webhook.secret:whsec_default}")
    private String webhookSecret;

    /**
     * Cria customer no Stripe para um tenant.
     */
    public String createCustomer(Tenant tenant) {
        log.info("Criando customer no Stripe para tenant: {}", tenant.getName());

        // Em produção, usar Stripe SDK:
        /*
        Stripe.apiKey = apiKey;
        CustomerCreateParams params = CustomerCreateParams.builder()
            .setEmail(tenant.getBillingEmail())
            .setName(tenant.getName())
            .putMetadata("tenant_id", tenant.getId().toString())
            .build();
        Customer customer = Customer.create(params);
        return customer.getId();
        */

        // Stub: retornar ID simulado
        String customerId = "cus_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);
        log.info("Customer criado (stub): {}", customerId);
        return customerId;
    }

    /**
     * Anexa método de pagamento a um customer.
     */
    public void attachPaymentMethod(String customerId, String paymentMethodId) {
        log.info("Anexando payment method {} ao customer {}", paymentMethodId, customerId);

        // Em produção, usar Stripe SDK:
        /*
        Stripe.apiKey = apiKey;
        PaymentMethod paymentMethod = PaymentMethod.retrieve(paymentMethodId);
        paymentMethod.attach(PaymentMethodAttachParams.builder()
            .setCustomer(customerId)
            .build());
        */

        log.info("Payment method anexado (stub)");
    }

    /**
     * Define o método de pagamento padrão do customer.
     */
    public void setDefaultPaymentMethod(String customerId, String paymentMethodId) {
        log.info("Definindo payment method padrão para customer {}", customerId);

        // Em produção, usar Stripe SDK:
        /*
        Stripe.apiKey = apiKey;
        Customer customer = Customer.retrieve(customerId);
        CustomerUpdateParams params = CustomerUpdateParams.builder()
            .setInvoiceSettings(CustomerUpdateParams.InvoiceSettings.builder()
                .setDefaultPaymentMethod(paymentMethodId)
                .build())
            .build();
        customer.update(params);
        */

        log.info("Payment method padrão definido (stub)");
    }

    /**
     * Cobra uma fatura.
     */
    public PaymentResult chargeInvoice(Invoice invoice, String customerId) {
        log.info("Cobrando fatura {} do customer {}", invoice.getInvoiceNumber(), customerId);

        // Em produção, usar Stripe SDK:
        /*
        Stripe.apiKey = apiKey;
        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
            .setAmount(invoice.getTotalAmount().multiply(new BigDecimal(100)).longValue())
            .setCurrency("brl")
            .setCustomer(customerId)
            .setDescription("Fatura " + invoice.getInvoiceNumber())
            .putMetadata("invoice_id", invoice.getId().toString())
            .setConfirm(true)
            .setOffSession(true)
            .build();
        
        try {
            PaymentIntent intent = PaymentIntent.create(params);
            if ("succeeded".equals(intent.getStatus())) {
                return new PaymentResult(true, intent.getId(), null);
            } else {
                return new PaymentResult(false, null, "Status: " + intent.getStatus());
            }
        } catch (CardException e) {
            return new PaymentResult(false, null, e.getMessage());
        }
        */

        // Stub: simular sucesso
        String paymentIntentId = "pi_" + UUID.randomUUID().toString().replace("-", "").substring(0, 24);
        log.info("Pagamento processado (stub): {}", paymentIntentId);
        
        return new PaymentResult(true, paymentIntentId, null);
    }

    /**
     * Cria uma sessão de checkout para o cliente adicionar cartão.
     */
    public String createSetupSession(String customerId, String successUrl, String cancelUrl) {
        log.info("Criando setup session para customer {}", customerId);

        // Em produção, usar Stripe SDK:
        /*
        Stripe.apiKey = apiKey;
        SessionCreateParams params = SessionCreateParams.builder()
            .setCustomer(customerId)
            .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
            .setMode(SessionCreateParams.Mode.SETUP)
            .setSuccessUrl(successUrl)
            .setCancelUrl(cancelUrl)
            .build();
        Session session = Session.create(params);
        return session.getUrl();
        */

        // Stub: retornar URL simulada
        String sessionId = "cs_" + UUID.randomUUID().toString().replace("-", "").substring(0, 24);
        return "https://checkout.stripe.com/pay/" + sessionId;
    }

    /**
     * Verifica assinatura do webhook.
     */
    public boolean verifyWebhookSignature(String payload, String signature) {
        log.debug("Verificando assinatura do webhook");

        // Em produção, usar Stripe SDK:
        /*
        try {
            Webhook.constructEvent(payload, signature, webhookSecret);
            return true;
        } catch (SignatureVerificationException e) {
            log.warn("Assinatura do webhook inválida: {}", e.getMessage());
            return false;
        }
        */

        // Stub: aceitar qualquer assinatura em desenvolvimento
        return true;
    }

    /**
     * Reembolsa um pagamento.
     */
    public RefundResult refund(String paymentIntentId, BigDecimal amount) {
        log.info("Reembolsando {} do payment intent {}", amount, paymentIntentId);

        // Em produção, usar Stripe SDK:
        /*
        Stripe.apiKey = apiKey;
        RefundCreateParams params = RefundCreateParams.builder()
            .setPaymentIntent(paymentIntentId)
            .setAmount(amount.multiply(new BigDecimal(100)).longValue())
            .build();
        Refund refund = Refund.create(params);
        return new RefundResult(true, refund.getId(), null);
        */

        // Stub: simular sucesso
        String refundId = "re_" + UUID.randomUUID().toString().replace("-", "").substring(0, 24);
        log.info("Reembolso processado (stub): {}", refundId);
        
        return new RefundResult(true, refundId, null);
    }

    /**
     * Lista métodos de pagamento de um customer.
     */
    public java.util.List<PaymentMethodInfo> listPaymentMethods(String customerId) {
        log.debug("Listando payment methods do customer {}", customerId);

        // Em produção, usar Stripe SDK:
        /*
        Stripe.apiKey = apiKey;
        PaymentMethodListParams params = PaymentMethodListParams.builder()
            .setCustomer(customerId)
            .setType(PaymentMethodListParams.Type.CARD)
            .build();
        PaymentMethodCollection methods = PaymentMethod.list(params);
        
        return methods.getData().stream()
            .map(pm -> new PaymentMethodInfo(
                pm.getId(),
                pm.getCard().getBrand(),
                pm.getCard().getLast4(),
                pm.getCard().getExpMonth() + "/" + pm.getCard().getExpYear()
            ))
            .toList();
        */

        // Stub: retornar lista vazia
        return java.util.List.of();
    }

    // ========== Result Records ==========

    public record PaymentResult(
            boolean success,
            String transactionId,
            String errorMessage
    ) {}

    public record RefundResult(
            boolean success,
            String refundId,
            String errorMessage
    ) {}

    public record PaymentMethodInfo(
            String id,
            String brand,
            String last4,
            String expiresAt
    ) {}
}
