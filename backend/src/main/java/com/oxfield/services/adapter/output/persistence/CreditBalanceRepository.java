package com.oxfield.services.adapter.output.persistence;

import com.oxfield.services.domain.entity.CreditBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CreditBalanceRepository extends JpaRepository<CreditBalance, UUID> {

    List<CreditBalance> findByTenantIdOrderByPurchasedAtDesc(UUID tenantId);

    @Query("""
        SELECT cb FROM CreditBalance cb
        WHERE cb.tenant.id = :tenantId
        AND cb.creditsRemaining > 0
        AND (cb.expiresAt IS NULL OR cb.expiresAt > :now)
        ORDER BY cb.expiresAt ASC NULLS LAST
    """)
    List<CreditBalance> findAvailableBalances(
            @Param("tenantId") UUID tenantId,
            @Param("now") Instant now
    );

    @Query("""
        SELECT cb FROM CreditBalance cb
        WHERE cb.tenant.id = :tenantId
        AND cb.creditsRemaining > 0
        AND (cb.expiresAt IS NULL OR cb.expiresAt > :now)
        ORDER BY cb.expiresAt ASC NULLS LAST
    """)
    Optional<CreditBalance> findFirstAvailableBalance(
            @Param("tenantId") UUID tenantId,
            @Param("now") Instant now
    );

    @Query("""
        SELECT COALESCE(SUM(cb.creditsRemaining), 0) FROM CreditBalance cb
        WHERE cb.tenant.id = :tenantId
        AND (cb.expiresAt IS NULL OR cb.expiresAt > :now)
    """)
    int getTotalAvailableCredits(
            @Param("tenantId") UUID tenantId,
            @Param("now") Instant now
    );

    @Query("""
        SELECT cb FROM CreditBalance cb
        WHERE cb.expiresAt <= :date
        AND cb.creditsRemaining > 0
    """)
    List<CreditBalance> findExpiringSoon(@Param("date") Instant date);

    Optional<CreditBalance> findByStripePaymentId(String stripePaymentId);
}
