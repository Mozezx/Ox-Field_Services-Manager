package com.oxfield.services.application.service;

import com.oxfield.services.adapter.output.persistence.ServiceOrderRepository;
import com.oxfield.services.adapter.output.persistence.UserRepository;
import com.oxfield.services.domain.enums.UserRole;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.EnumMap;
import java.util.Map;
import java.util.UUID;

/**
 * Service para rastrear uso do sistema por tenant.
 */
@Service
@Transactional(readOnly = true)
public class UsageTrackingService {

    private static final Logger log = LoggerFactory.getLogger(UsageTrackingService.class);

    private final UserRepository userRepository;
    private final ServiceOrderRepository serviceOrderRepository;
    private final CreditService creditService;

    public UsageTrackingService(UserRepository userRepository,
                                ServiceOrderRepository serviceOrderRepository,
                                CreditService creditService) {
        this.userRepository = userRepository;
        this.serviceOrderRepository = serviceOrderRepository;
        this.creditService = creditService;
    }

    /**
     * Conta usuários ativos por role no período.
     */
    public Map<UserRole, Integer> getActiveUserCounts(UUID tenantId, LocalDate periodStart, LocalDate periodEnd) {
        log.debug("Contando usuários ativos para tenant {} no período {} a {}", 
                tenantId, periodStart, periodEnd);

        Map<UserRole, Integer> counts = new EnumMap<>(UserRole.class);

        // Contar por role (apenas usuários aprovados)
        counts.put(UserRole.ADMIN_EMPRESA, 
                (int) userRepository.countByTenantIdAndRole(tenantId, UserRole.ADMIN_EMPRESA));
        counts.put(UserRole.GESTOR, 
                (int) userRepository.countByTenantIdAndRole(tenantId, UserRole.GESTOR));
        counts.put(UserRole.TECNICO, 
                (int) userRepository.countByTenantIdAndRole(tenantId, UserRole.TECNICO));
        counts.put(UserRole.CLIENTE, 
                (int) userRepository.countByTenantIdAndRole(tenantId, UserRole.CLIENTE));

        return counts;
    }

    /**
     * Rastreia evento de uso (para créditos pay-as-you-go).
     */
    @Transactional
    public void trackUsage(UUID tenantId, UsageType type, UUID referenceId) {
        log.debug("Rastreando uso: tenant={}, type={}, ref={}", tenantId, type, referenceId);

        // Consumir créditos se aplicável
        int credits = type.getCredits();
        if (credits > 0) {
            boolean consumed = creditService.consumeCredits(
                    tenantId, 
                    type.name(), 
                    credits, 
                    referenceId
            );
            
            if (!consumed) {
                log.warn("Créditos insuficientes para {} (tenant: {})", type, tenantId);
                // Não bloquear operação, apenas logar
            }
        }
    }

    /**
     * Gera relatório de uso mensal.
     */
    public UsageReport generateReport(UUID tenantId, YearMonth month) {
        log.info("Gerando relatório de uso para tenant {} - {}", tenantId, month);

        LocalDate periodStart = month.atDay(1);
        LocalDate periodEnd = month.atEndOfMonth();

        Map<UserRole, Integer> userCounts = getActiveUserCounts(tenantId, periodStart, periodEnd);
        
        // Contar OS do período
        // TODO: Implementar contagem de OS por período
        int ordersCreated = 0; 
        int ordersCompleted = 0;

        // Uso de créditos
        Map<String, Integer> creditUsage = creditService.getUsageByResourceType(tenantId, periodStart, periodEnd);
        int totalCreditsUsed = creditUsage.values().stream().mapToInt(Integer::intValue).sum();

        return new UsageReport(
                tenantId,
                month,
                userCounts,
                ordersCreated,
                ordersCompleted,
                totalCreditsUsed,
                creditUsage
        );
    }

    /**
     * Tipos de uso rastreáveis.
     */
    public enum UsageType {
        OS_CREATED(1),           // 1 crédito por OS criada
        ROUTE_OPTIMIZATION(2),   // 2 créditos por otimização
        SMS_SENT(1),             // 1 crédito por SMS
        PHOTO_STORED(0),         // Incluído no plano (por GB/mês cobrado separadamente)
        API_CALL(0);             // Incluído no plano para chamadas normais

        private final int credits;

        UsageType(int credits) {
            this.credits = credits;
        }

        public int getCredits() {
            return credits;
        }
    }

    /**
     * Relatório de uso mensal.
     */
    public record UsageReport(
            UUID tenantId,
            YearMonth month,
            Map<UserRole, Integer> userCounts,
            int ordersCreated,
            int ordersCompleted,
            int totalCreditsUsed,
            Map<String, Integer> creditUsageByType
    ) {
        public int getTotalUsers() {
            return userCounts.values().stream().mapToInt(Integer::intValue).sum();
        }

        public int getTechnicians() {
            return userCounts.getOrDefault(UserRole.TECNICO, 0);
        }

        public int getGestores() {
            return userCounts.getOrDefault(UserRole.GESTOR, 0);
        }

        public int getAdmins() {
            return userCounts.getOrDefault(UserRole.ADMIN_EMPRESA, 0);
        }
    }
}
