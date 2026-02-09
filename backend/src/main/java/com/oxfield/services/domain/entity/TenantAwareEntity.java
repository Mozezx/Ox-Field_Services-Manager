package com.oxfield.services.domain.entity;

import com.oxfield.services.shared.multitenancy.TenantContext;
import jakarta.persistence.*;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

import java.util.UUID;

/**
 * Classe base para todas as entidades que pertencem a um Tenant.
 * Implementa o padrão de Multitenancy por coluna discriminatória (tenant_id).
 * 
 * O Hibernate Filter garante que todas as queries automaticamente
 * incluam a condição WHERE tenant_id = :tenantId
 */
@MappedSuperclass
@FilterDef(
    name = "tenantFilter",
    parameters = @ParamDef(name = "tenantId", type = UUID.class),
    defaultCondition = "tenant_id = :tenantId"
)
@Filter(name = "tenantFilter")
public abstract class TenantAwareEntity extends BaseEntity {

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    public UUID getTenantId() {
        return tenantId;
    }

    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
    }

    /**
     * Antes de persistir, automaticamente define o tenant_id
     * com base no contexto atual (extraído do JWT)
     */
    @PrePersist
    public void prePersistTenant() {
        if (this.tenantId == null) {
            UUID currentTenantId = TenantContext.getCurrentTenantId();
            if (currentTenantId == null) {
                throw new IllegalStateException(
                    "TenantContext não está definido. Não é possível persistir entidade sem tenant_id."
                );
            }
            this.tenantId = currentTenantId;
        }
    }
}
