package com.oxfield.services.adapter.output.persistence;

import com.oxfield.services.domain.entity.Tenant;
import com.oxfield.services.domain.enums.TenantStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositório JPA para a entidade Tenant.
 * NÃO aplica filtro de tenant (Tenant é a raiz do multitenancy).
 */
@Repository
public interface TenantRepository extends JpaRepository<Tenant, UUID> {

    /**
     * Busca tenant por domínio
     */
    Optional<Tenant> findByDomain(String domain);

    /**
     * Verifica se domínio existe
     */
    boolean existsByDomain(String domain);

    /**
     * Busca tenants por status
     */
    List<Tenant> findByStatus(TenantStatus status);

    /**
     * Busca tenants ativos
     */
    List<Tenant> findByStatusOrderByNameAsc(TenantStatus status);

    /**
     * Busca tenants por região
     */
    List<Tenant> findByRegion(String region);
}
