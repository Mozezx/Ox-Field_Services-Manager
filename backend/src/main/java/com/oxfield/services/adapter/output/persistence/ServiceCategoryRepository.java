package com.oxfield.services.adapter.output.persistence;

import com.oxfield.services.domain.entity.ServiceCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositório JPA para ServiceCategory.
 * O Hibernate Filter de tenant é aplicado automaticamente em entidades TenantAware.
 */
@Repository
public interface ServiceCategoryRepository extends JpaRepository<ServiceCategory, UUID> {

    List<ServiceCategory> findByTenantId(UUID tenantId);

    Optional<ServiceCategory> findByIdAndTenantId(UUID id, UUID tenantId);

    Optional<ServiceCategory> findByTenantIdAndCode(UUID tenantId, String code);

    boolean existsByTenantIdAndCode(UUID tenantId, String code);
}
