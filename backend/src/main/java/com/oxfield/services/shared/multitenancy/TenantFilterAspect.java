package com.oxfield.services.shared.multitenancy;

import jakarta.persistence.EntityManager;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.hibernate.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Aspect que habilita o Hibernate Filter de tenant automaticamente
 * antes de cada operação de repositório.
 */
@Aspect
@Component
public class TenantFilterAspect {

    private static final Logger log = LoggerFactory.getLogger(TenantFilterAspect.class);
    private static final String TENANT_FILTER_NAME = "tenantFilter";

    private final EntityManager entityManager;

    public TenantFilterAspect(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    /**
     * Intercepta todas as chamadas a repositórios JPA e habilita o filtro de tenant
     */
    @Before("execution(* com.oxfield.services.adapter.output.persistence..*Repository.*(..))")
    public void enableTenantFilter() {
        UUID tenantId = TenantContext.getCurrentTenantId();
        
        if (tenantId != null) {
            Session session = entityManager.unwrap(Session.class);
            
            if (session.getEnabledFilter(TENANT_FILTER_NAME) == null) {
                session.enableFilter(TENANT_FILTER_NAME)
                       .setParameter("tenantId", tenantId);
                log.debug("Tenant filter enabled for tenant: {}", tenantId);
            }
        }
    }
}
