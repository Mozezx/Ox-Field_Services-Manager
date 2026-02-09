package com.oxfield.services.adapter.output.persistence;

import com.oxfield.services.domain.entity.TenantCustomer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantCustomerRepository extends JpaRepository<TenantCustomer, TenantCustomer.TenantCustomerId> {

    Optional<TenantCustomer> findByTenantIdAndCustomerId(UUID tenantId, UUID customerId);

    boolean existsByTenantIdAndCustomerId(UUID tenantId, UUID customerId);
}
