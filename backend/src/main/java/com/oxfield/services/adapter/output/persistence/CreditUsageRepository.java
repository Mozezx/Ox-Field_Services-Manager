package com.oxfield.services.adapter.output.persistence;

import com.oxfield.services.domain.entity.CreditUsage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface CreditUsageRepository extends JpaRepository<CreditUsage, UUID> {

    Page<CreditUsage> findByTenantIdOrderByCreatedAtDesc(UUID tenantId, Pageable pageable);

    List<CreditUsage> findByTenantIdAndResourceType(UUID tenantId, String resourceType);

    @Query("""
        SELECT cu FROM CreditUsage cu
        WHERE cu.tenant.id = :tenantId
        AND cu.createdAt >= :startDate
        AND cu.createdAt <= :endDate
        ORDER BY cu.createdAt DESC
    """)
    List<CreditUsage> findByTenantIdAndPeriod(
            @Param("tenantId") UUID tenantId,
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate
    );

    @Query("""
        SELECT COALESCE(SUM(cu.creditsConsumed), 0) FROM CreditUsage cu
        WHERE cu.tenant.id = :tenantId
        AND cu.createdAt >= :startDate
        AND cu.createdAt <= :endDate
    """)
    int sumCreditsByTenantAndPeriod(
            @Param("tenantId") UUID tenantId,
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate
    );

    @Query("""
        SELECT cu.resourceType, SUM(cu.creditsConsumed) FROM CreditUsage cu
        WHERE cu.tenant.id = :tenantId
        AND cu.createdAt >= :startDate
        AND cu.createdAt <= :endDate
        GROUP BY cu.resourceType
        ORDER BY SUM(cu.creditsConsumed) DESC
    """)
    List<Object[]> getUsageBreakdownByType(
            @Param("tenantId") UUID tenantId,
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate
    );
}
