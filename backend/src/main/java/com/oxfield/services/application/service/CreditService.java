package com.oxfield.services.application.service;

import com.oxfield.services.adapter.output.persistence.CreditBalanceRepository;
import com.oxfield.services.adapter.output.persistence.CreditUsageRepository;
import com.oxfield.services.adapter.output.persistence.TenantRepository;
import com.oxfield.services.domain.entity.CreditBalance;
import com.oxfield.services.domain.entity.CreditUsage;
import com.oxfield.services.domain.entity.Tenant;
import com.oxfield.services.shared.exception.BusinessException;
import com.oxfield.services.shared.exception.ErrorCode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service para gerenciar créditos pré-pagos.
 */
@Service
@Transactional
public class CreditService {

    private static final Logger log = LoggerFactory.getLogger(CreditService.class);

    // Preços dos pacotes de créditos
    private static final Map<Integer, BigDecimal> CREDIT_PACKAGES = Map.of(
            500, new BigDecimal("199.00"),     // R$ 0.40/crédito
            2000, new BigDecimal("699.00"),    // R$ 0.35/crédito
            10000, new BigDecimal("2999.00")   // R$ 0.30/crédito
    );

    private final CreditBalanceRepository creditBalanceRepository;
    private final CreditUsageRepository creditUsageRepository;
    private final TenantRepository tenantRepository;

    public CreditService(CreditBalanceRepository creditBalanceRepository,
                         CreditUsageRepository creditUsageRepository,
                         TenantRepository tenantRepository) {
        this.creditBalanceRepository = creditBalanceRepository;
        this.creditUsageRepository = creditUsageRepository;
        this.tenantRepository = tenantRepository;
    }

    /**
     * Compra pacote de créditos.
     */
    public CreditBalance purchaseCredits(UUID tenantId, int credits, BigDecimal amount) {
        log.info("Comprando {} créditos para tenant {} por R$ {}", credits, tenantId, amount);

        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND, "Tenant não encontrado"));

        CreditBalance balance = new CreditBalance(tenant, credits, amount);
        balance = creditBalanceRepository.save(balance);

        log.info("Créditos adicionados com sucesso. Saldo ID: {}", balance.getId());
        return balance;
    }

    /**
     * Compra pacote padrão de créditos.
     */
    public CreditBalance purchasePackage(UUID tenantId, int packageSize) {
        BigDecimal price = CREDIT_PACKAGES.get(packageSize);
        if (price == null) {
            throw new BusinessException(ErrorCode.INVALID_OPERATION, 
                    "Pacote de créditos inválido. Opções: 500, 2000, 10000");
        }
        return purchaseCredits(tenantId, packageSize, price);
    }

    /**
     * Consome créditos para uma operação.
     */
    public boolean consumeCredits(UUID tenantId, String resourceType, int credits, UUID referenceId) {
        log.debug("Consumindo {} créditos para {} (tenant: {})", credits, resourceType, tenantId);

        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND, "Tenant não encontrado"));

        // Buscar saldos disponíveis (ordenados por data de expiração)
        List<CreditBalance> balances = creditBalanceRepository
                .findAvailableBalances(tenantId, Instant.now());

        int remaining = credits;
        for (CreditBalance balance : balances) {
            if (remaining <= 0) break;

            int available = balance.getCreditsRemaining();
            int toConsume = Math.min(available, remaining);

            if (balance.consumeCredits(toConsume)) {
                creditBalanceRepository.save(balance);

                // Registrar uso
                CreditUsage usage = new CreditUsage(
                        tenant,
                        balance,
                        resourceType,
                        toConsume,
                        "Consumo: " + resourceType,
                        referenceId
                );
                creditUsageRepository.save(usage);

                remaining -= toConsume;
            }
        }

        if (remaining > 0) {
            log.warn("Créditos insuficientes para tenant {}. Faltam: {}", tenantId, remaining);
            return false;
        }

        log.debug("Créditos consumidos com sucesso");
        return true;
    }

    /**
     * Consulta saldo total disponível.
     */
    @Transactional(readOnly = true)
    public int getBalance(UUID tenantId) {
        return creditBalanceRepository.getTotalAvailableCredits(tenantId, Instant.now());
    }

    /**
     * Lista todos os saldos de crédito de um tenant.
     */
    @Transactional(readOnly = true)
    public List<CreditBalance> listBalances(UUID tenantId) {
        return creditBalanceRepository.findByTenantIdOrderByPurchasedAtDesc(tenantId);
    }

    /**
     * Lista histórico de uso de créditos.
     */
    @Transactional(readOnly = true)
    public Page<CreditUsage> listUsageHistory(UUID tenantId, Pageable pageable) {
        return creditUsageRepository.findByTenantIdOrderByCreatedAtDesc(tenantId, pageable);
    }

    /**
     * Relatório de uso de créditos por período.
     */
    @Transactional(readOnly = true)
    public List<CreditUsage> getUsageReport(UUID tenantId, LocalDate from, LocalDate to) {
        Instant startDate = from.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant endDate = to.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

        return creditUsageRepository.findByTenantIdAndPeriod(tenantId, startDate, endDate);
    }

    /**
     * Relatório de uso agrupado por tipo de recurso.
     */
    @Transactional(readOnly = true)
    public Map<String, Integer> getUsageByResourceType(UUID tenantId, LocalDate from, LocalDate to) {
        Instant startDate = from.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant endDate = to.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

        List<Object[]> results = creditUsageRepository.getUsageBreakdownByType(tenantId, startDate, endDate);
        
        Map<String, Integer> breakdown = new HashMap<>();
        for (Object[] row : results) {
            String type = (String) row[0];
            Long count = (Long) row[1];
            breakdown.put(type, count.intValue());
        }
        
        return breakdown;
    }

    /**
     * Verifica se tenant tem créditos suficientes.
     */
    @Transactional(readOnly = true)
    public boolean hasEnoughCredits(UUID tenantId, int required) {
        int available = getBalance(tenantId);
        return available >= required;
    }

    /**
     * Lista saldos que vão expirar em breve.
     */
    @Transactional(readOnly = true)
    public List<CreditBalance> getExpiringSoon(int daysAhead) {
        Instant expirationDate = Instant.now().plusSeconds(daysAhead * 24L * 60 * 60);
        return creditBalanceRepository.findExpiringSoon(expirationDate);
    }

    /**
     * Obtém preços dos pacotes disponíveis.
     */
    public Map<Integer, BigDecimal> getPackagePrices() {
        return CREDIT_PACKAGES;
    }

    /**
     * Calcula preço por crédito de um pacote.
     */
    public BigDecimal getPricePerCredit(int packageSize) {
        BigDecimal price = CREDIT_PACKAGES.get(packageSize);
        if (price == null) {
            throw new BusinessException(ErrorCode.INVALID_OPERATION, "Pacote inválido");
        }
        return price.divide(BigDecimal.valueOf(packageSize), 4, java.math.RoundingMode.HALF_UP);
    }
}
