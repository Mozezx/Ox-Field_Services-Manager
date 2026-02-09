package com.oxfield.services.adapter.output.persistence;

import com.oxfield.services.domain.entity.CustomerAddress;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositório JPA para CustomerAddress.
 */
@Repository
public interface CustomerAddressRepository extends JpaRepository<CustomerAddress, UUID> {

    @Query("SELECT a FROM CustomerAddress a JOIN FETCH a.customer WHERE a.id = :id")
    Optional<CustomerAddress> findByIdWithCustomer(@Param("id") UUID id);

    @Query("SELECT a FROM CustomerAddress a WHERE a.customer.id = :customerId AND a.id != :excludeId ORDER BY a.id ASC")
    List<CustomerAddress> findOthersByCustomer(@Param("customerId") UUID customerId, @Param("excludeId") UUID excludeId, Pageable pageable);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "DELETE FROM customer_addresses WHERE id = ?1", nativeQuery = true)
    int deleteAddressById(UUID id);
}
