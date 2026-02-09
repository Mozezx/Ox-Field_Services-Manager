package com.oxfield.services.adapter.output.persistence;

import com.oxfield.services.domain.entity.Customer;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositório JPA para Customer.
 */
@Repository
public interface CustomerRepository extends JpaRepository<Customer, UUID> {

    Optional<Customer> findByUserId(UUID userId);

    @EntityGraph(attributePaths = {"addresses", "user"})
    @Query("SELECT c FROM Customer c JOIN c.user u WHERE u.id = :userId")
    Optional<Customer> findByUserIdWithAddresses(@Param("userId") UUID userId);

    /** Returns at most one customer with addresses and user loaded (for create-order placeholder). */
    @EntityGraph(attributePaths = {"addresses", "user"})
    @Query("SELECT c FROM Customer c")
    List<Customer> findFirstWithAddressesAndUser(Pageable pageable);

    /** Returns customers associated with the tenant via tenant_customers. */
    @EntityGraph(attributePaths = {"addresses", "user"})
    @Query("SELECT c FROM Customer c WHERE c.id IN (SELECT tc.customerId FROM TenantCustomer tc WHERE tc.tenantId = :tenantId)")
    List<Customer> findCustomersByTenantId(@Param("tenantId") UUID tenantId, Pageable pageable);

    /** Loads a customer by id with addresses and user (for create-order when customer is selected). */
    @EntityGraph(attributePaths = {"addresses", "user"})
    @Query("SELECT c FROM Customer c WHERE c.id = :id")
    Optional<Customer> findByIdWithAddressesAndUser(@Param("id") UUID id);

    boolean existsByUserId(UUID userId);
}
