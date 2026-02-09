package com.oxfield.services.application.service;

import com.oxfield.services.adapter.output.persistence.SubscriptionRepository;
import com.oxfield.services.adapter.output.persistence.TenantRepository;
import com.oxfield.services.adapter.output.persistence.UserRepository;
import com.oxfield.services.domain.entity.Subscription;
import com.oxfield.services.domain.entity.SubscriptionItem;
import com.oxfield.services.domain.entity.Tenant;
import com.oxfield.services.domain.enums.PlanEdition;
import com.oxfield.services.domain.enums.SubscriptionItemType;
import com.oxfield.services.domain.enums.SubscriptionStatus;
import com.oxfield.services.domain.enums.UserRole;
import com.oxfield.services.shared.exception.BusinessException;
import com.oxfield.services.shared.exception.ErrorCode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Service para gerenciar assinaturas de tenants.
 */
@Service
@Transactional
public class SubscriptionService {

    private static final Logger log = LoggerFactory.getLogger(SubscriptionService.class);

    private final SubscriptionRepository subscriptionRepository;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;

    public SubscriptionService(SubscriptionRepository subscriptionRepository,
                               TenantRepository tenantRepository,
                               UserRepository userRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.tenantRepository = tenantRepository;
        this.userRepository = userRepository;
    }

    /**
     * Cria uma nova assinatura para um tenant.
     */
    public Subscription createSubscription(UUID tenantId, PlanEdition edition) {
        log.info("Criando assinatura para tenant {} com plano {}", tenantId, edition);

        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND, "Tenant não encontrado"));

        // Verificar se já existe assinatura
        Optional<Subscription> existing = subscriptionRepository.findByTenantId(tenantId);
        if (existing.isPresent()) {
            throw new BusinessException(ErrorCode.INVALID_OPERATION, "Tenant já possui assinatura ativa");
        }

        Subscription subscription = new Subscription(tenant, edition);
        subscription.setCurrentPeriodStart(LocalDate.now());
        subscription.setCurrentPeriodEnd(LocalDate.now().plusMonths(1));

        // Criar itens para cada tipo de usuário
        for (SubscriptionItemType itemType : SubscriptionItemType.values()) {
            SubscriptionItem item = new SubscriptionItem(subscription, itemType, 0);
            subscription.addItem(item);
        }

        // Contar usuários existentes e atualizar itens
        updateUserCountsFromDatabase(subscription);

        subscription = subscriptionRepository.save(subscription);
        log.info("Assinatura criada com sucesso: {}", subscription.getId());

        return subscription;
    }

    /**
     * Obtém a assinatura de um tenant.
     */
    @Transactional(readOnly = true)
    public Optional<Subscription> getSubscription(UUID tenantId) {
        return subscriptionRepository.findByTenantId(tenantId);
    }

    /**
     * Obtém a assinatura por ID.
     */
    @Transactional(readOnly = true)
    public Subscription getSubscriptionById(UUID subscriptionId) {
        return subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND, "Assinatura não encontrada"));
    }

    /**
     * Atualiza a contagem de usuários quando um usuário é criado/removido.
     */
    public void updateUserCount(UUID tenantId, UserRole role, int delta) {
        log.debug("Atualizando contagem de usuários: tenant={}, role={}, delta={}", tenantId, role, delta);

        Subscription subscription = subscriptionRepository.findByTenantId(tenantId)
                .orElse(null);

        if (subscription == null) {
            log.warn("Tenant {} não possui assinatura, criando automaticamente", tenantId);
            subscription = createSubscription(tenantId, PlanEdition.STARTER);
            return;
        }

        SubscriptionItemType itemType = mapRoleToItemType(role);
        if (itemType == null) {
            return; // Role não é cobrada (ex: CLIENTE)
        }

        for (SubscriptionItem item : subscription.getItems()) {
            if (item.getItemType() == itemType) {
                int newQuantity = Math.max(0, item.getQuantity() + delta);
                item.setQuantity(newQuantity);
                break;
            }
        }

        subscriptionRepository.save(subscription);
    }

    /**
     * Muda o plano da assinatura (upgrade/downgrade).
     */
    public Subscription changePlan(UUID subscriptionId, PlanEdition newEdition) {
        log.info("Alterando plano da assinatura {} para {}", subscriptionId, newEdition);

        Subscription subscription = getSubscriptionById(subscriptionId);
        PlanEdition currentEdition = subscription.getPlanEdition();

        if (currentEdition == newEdition) {
            throw new BusinessException(ErrorCode.INVALID_OPERATION, "Já está no plano " + newEdition);
        }

        // Verificar limite de técnicos
        int currentTechnicians = countTechnicians(subscription);
        if (currentTechnicians > newEdition.getMaxTechnicians()) {
            throw new BusinessException(ErrorCode.INVALID_OPERATION, 
                    String.format("Plano %s permite apenas %d técnicos. Atualmente você tem %d.",
                            newEdition.getDisplayName(), newEdition.getMaxTechnicians(), currentTechnicians));
        }

        subscription.setPlanEdition(newEdition);
        subscription = subscriptionRepository.save(subscription);

        log.info("Plano alterado com sucesso para {}", newEdition);
        return subscription;
    }

    /**
     * Calcula o valor pro-rata para mudança de plano.
     */
    @Transactional(readOnly = true)
    public BigDecimal calculateProration(UUID subscriptionId, PlanEdition newEdition) {
        Subscription subscription = getSubscriptionById(subscriptionId);

        LocalDate today = LocalDate.now();
        LocalDate periodEnd = subscription.getCurrentPeriodEnd();

        if (periodEnd == null || !today.isBefore(periodEnd)) {
            return BigDecimal.ZERO;
        }

        int daysRemaining = (int) java.time.temporal.ChronoUnit.DAYS.between(today, periodEnd);
        int totalDays = 30; // Simplificação

        BigDecimal currentDaily = subscription.getMonthlyBaseAmount().divide(BigDecimal.valueOf(totalDays), 2, java.math.RoundingMode.HALF_UP);
        BigDecimal newDaily = newEdition.getBasePrice().divide(BigDecimal.valueOf(totalDays), 2, java.math.RoundingMode.HALF_UP);

        BigDecimal difference = newDaily.subtract(currentDaily).multiply(BigDecimal.valueOf(daysRemaining));

        return difference.max(BigDecimal.ZERO); // Não reembolsar em downgrade imediato
    }

    /**
     * Cancela uma assinatura.
     */
    public void cancelSubscription(UUID subscriptionId, String reason) {
        log.info("Cancelando assinatura {}: {}", subscriptionId, reason);

        Subscription subscription = getSubscriptionById(subscriptionId);
        subscription.cancel(reason);
        subscriptionRepository.save(subscription);

        log.info("Assinatura cancelada com sucesso");
    }

    /**
     * Suspende uma assinatura por inadimplência.
     */
    public void suspendSubscription(UUID subscriptionId) {
        log.warn("Suspendendo assinatura {} por inadimplência", subscriptionId);

        Subscription subscription = getSubscriptionById(subscriptionId);
        subscription.suspend();
        subscriptionRepository.save(subscription);
    }

    /**
     * Reativa uma assinatura após pagamento.
     */
    public void reactivateSubscription(UUID subscriptionId) {
        log.info("Reativando assinatura {}", subscriptionId);

        Subscription subscription = getSubscriptionById(subscriptionId);
        subscription.activate();
        subscription.setCurrentPeriodStart(LocalDate.now());
        subscription.setCurrentPeriodEnd(LocalDate.now().plusMonths(1));
        subscriptionRepository.save(subscription);
    }

    /**
     * Renova o período da assinatura.
     */
    public void renewPeriod(UUID subscriptionId) {
        Subscription subscription = getSubscriptionById(subscriptionId);
        subscription.renewPeriod();
        subscriptionRepository.save(subscription);
    }

    /**
     * Calcula o valor total da assinatura (base + usuários).
     */
    @Transactional(readOnly = true)
    public BigDecimal calculateTotalAmount(UUID tenantId) {
        Subscription subscription = subscriptionRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND, "Assinatura não encontrada"));

        return subscription.calculateTotalAmount();
    }

    /**
     * Obtém contagem de usuários ativos por tipo.
     */
    @Transactional(readOnly = true)
    public Map<SubscriptionItemType, Integer> getUserCounts(UUID tenantId) {
        Subscription subscription = subscriptionRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND, "Assinatura não encontrada"));

        return subscription.getItems().stream()
                .collect(java.util.stream.Collectors.toMap(
                        SubscriptionItem::getItemType,
                        SubscriptionItem::getQuantity
                ));
    }

    // ========== Helper Methods ==========

    private void updateUserCountsFromDatabase(Subscription subscription) {
        UUID tenantId = subscription.getTenant().getId();

        long admins = userRepository.countByTenantIdAndRole(tenantId, UserRole.ADMIN_EMPRESA);
        long gestores = userRepository.countByTenantIdAndRole(tenantId, UserRole.GESTOR);
        long tecnicos = userRepository.countByTenantIdAndRole(tenantId, UserRole.TECNICO);

        for (SubscriptionItem item : subscription.getItems()) {
            switch (item.getItemType()) {
                case ADMIN -> item.setQuantity((int) admins);
                case GESTOR -> item.setQuantity((int) gestores);
                case TECNICO -> item.setQuantity((int) tecnicos);
            }
        }
    }

    private SubscriptionItemType mapRoleToItemType(UserRole role) {
        return switch (role) {
            case ADMIN_EMPRESA -> SubscriptionItemType.ADMIN;
            case GESTOR -> SubscriptionItemType.GESTOR;
            case TECNICO -> SubscriptionItemType.TECNICO;
            default -> null; // ADMIN_GLOBAL e CLIENTE não são cobrados
        };
    }

    private int countTechnicians(Subscription subscription) {
        return subscription.getItems().stream()
                .filter(item -> item.getItemType() == SubscriptionItemType.TECNICO)
                .findFirst()
                .map(SubscriptionItem::getQuantity)
                .orElse(0);
    }
}
