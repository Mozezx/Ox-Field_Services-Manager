package com.oxfield.services.adapter.input.rest;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.oxfield.services.adapter.output.payment.StripeGateway;
import com.oxfield.services.application.service.BillingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Controller para receber webhooks do Stripe.
 * Este endpoint é público (sem autenticação) mas verifica a assinatura do Stripe.
 */
@RestController
@RequestMapping("/webhook")
@Tag(name = "Webhooks", description = "Endpoints para receber webhooks de serviços externos")
public class WebhookController {

    private static final Logger log = LoggerFactory.getLogger(WebhookController.class);

    private final StripeGateway stripeGateway;
    private final BillingService billingService;
    private final ObjectMapper objectMapper;

    public WebhookController(StripeGateway stripeGateway,
                             BillingService billingService,
                             ObjectMapper objectMapper) {
        this.stripeGateway = stripeGateway;
        this.billingService = billingService;
        this.objectMapper = objectMapper;
    }

    /**
     * Endpoint para receber webhooks do Stripe.
     * 
     * Tipos de eventos importantes:
     * - payment_intent.succeeded: Pagamento bem-sucedido
     * - payment_intent.payment_failed: Pagamento falhou
     * - invoice.paid: Fatura paga (para assinaturas Stripe)
     * - invoice.payment_failed: Pagamento de fatura falhou
     * - customer.subscription.updated: Assinatura atualizada
     * - customer.subscription.deleted: Assinatura cancelada
     */
    @PostMapping("/stripe")
    @Operation(summary = "Recebe webhooks do Stripe")
    public ResponseEntity<String> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String signature) {
        
        log.info("Webhook Stripe recebido");

        // Verificar assinatura
        if (!stripeGateway.verifyWebhookSignature(payload, signature)) {
            log.warn("Assinatura do webhook inválida");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Invalid signature");
        }

        try {
            JsonNode event = objectMapper.readTree(payload);
            String eventType = event.get("type").asText();
            JsonNode data = event.get("data").get("object");

            log.info("Processando evento Stripe: {}", eventType);

            switch (eventType) {
                case "payment_intent.succeeded" -> handlePaymentSucceeded(data);
                case "payment_intent.payment_failed" -> handlePaymentFailed(data);
                case "invoice.paid" -> handleInvoicePaid(data);
                case "invoice.payment_failed" -> handleInvoicePaymentFailed(data);
                case "customer.subscription.updated" -> handleSubscriptionUpdated(data);
                case "customer.subscription.deleted" -> handleSubscriptionDeleted(data);
                default -> log.debug("Evento não tratado: {}", eventType);
            }

            return ResponseEntity.ok("OK");

        } catch (Exception e) {
            log.error("Erro ao processar webhook: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error processing webhook");
        }
    }

    // ========== Event Handlers ==========

    private void handlePaymentSucceeded(JsonNode data) {
        String paymentIntentId = data.get("id").asText();
        JsonNode metadata = data.get("metadata");
        
        log.info("Pagamento bem-sucedido: {}", paymentIntentId);

        if (metadata != null && metadata.has("invoice_id")) {
            String invoiceId = metadata.get("invoice_id").asText();
            try {
                billingService.markAsPaid(UUID.fromString(invoiceId), paymentIntentId);
                log.info("Fatura {} marcada como paga", invoiceId);
            } catch (Exception e) {
                log.error("Erro ao marcar fatura como paga: {}", e.getMessage());
            }
        }
    }

    private void handlePaymentFailed(JsonNode data) {
        String paymentIntentId = data.get("id").asText();
        String failureMessage = data.has("last_payment_error") 
                ? data.get("last_payment_error").get("message").asText() 
                : "Pagamento falhou";
        
        log.warn("Pagamento falhou: {} - {}", paymentIntentId, failureMessage);

        // TODO: Notificar tenant sobre falha no pagamento
    }

    private void handleInvoicePaid(JsonNode data) {
        String stripeInvoiceId = data.get("id").asText();
        String paymentIntentId = data.has("payment_intent") 
                ? data.get("payment_intent").asText() 
                : null;
        
        log.info("Invoice Stripe paga: {}", stripeInvoiceId);

        // Se temos nosso invoice_id nos metadata, processar
        JsonNode metadata = data.get("metadata");
        if (metadata != null && metadata.has("invoice_id")) {
            String invoiceId = metadata.get("invoice_id").asText();
            try {
                billingService.markAsPaid(UUID.fromString(invoiceId), paymentIntentId);
            } catch (Exception e) {
                log.error("Erro ao processar invoice paga: {}", e.getMessage());
            }
        }
    }

    private void handleInvoicePaymentFailed(JsonNode data) {
        String stripeInvoiceId = data.get("id").asText();
        
        log.warn("Pagamento de invoice falhou: {}", stripeInvoiceId);

        // TODO: Marcar nossa invoice como PAST_DUE e notificar
    }

    private void handleSubscriptionUpdated(JsonNode data) {
        String stripeSubscriptionId = data.get("id").asText();
        String status = data.get("status").asText();
        
        log.info("Assinatura Stripe atualizada: {} - status: {}", stripeSubscriptionId, status);

        // TODO: Sincronizar status com nossa assinatura
    }

    private void handleSubscriptionDeleted(JsonNode data) {
        String stripeSubscriptionId = data.get("id").asText();
        
        log.info("Assinatura Stripe cancelada: {}", stripeSubscriptionId);

        // TODO: Cancelar nossa assinatura correspondente
    }

    /**
     * Endpoint de health check para webhook.
     */
    @GetMapping("/health")
    @Operation(summary = "Health check do webhook")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Webhook endpoint is healthy");
    }
}
