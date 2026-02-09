package com.oxfield.services.adapter.output.persistence;

import com.oxfield.services.domain.entity.Subscription;
import com.oxfield.services.domain.enums.SubscriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {

    Optional<Subscription> findByTenantId(UUID tenantId);

    Optional<Subscription> findByStripeCustomerId(String stripeCustomerId);

    Optional<Subscription> findByStripeSubscriptionId(String stripeSubscriptionId);

    List<Subscription> findByStatus(SubscriptionStatus status);

    @Query("""
        SELECT s FROM Subscription s
        WHERE s.status = :status
        AND s.currentPeriodEnd <= :date
        ORDER BY s.currentPeriodEnd ASC
    """)
    List<Subscription> findByStatusAndPeriodEndBefore(
            @Param("status") SubscriptionStatus status,
            @Param("date") LocalDate date
    );

    @Query("""
        SELECT s FROM Subscription s
        WHERE s.status IN ('ACTIVE', 'TRIALING')
        AND s.billingCycleDay = :day
    """)
    List<Subscription> findActiveSubscriptionsForBillingDay(@Param("day") int day);

    @Query("""
        SELECT s FROM Subscription s
        WHERE s.status = 'PAST_DUE'
        AND s.currentPeriodEnd < :date
    """)
    List<Subscription> findOverdueSubscriptions(@Param("date") LocalDate date);

    @Query("""
        SELECT COUNT(s) FROM Subscription s
        WHERE s.status IN ('ACTIVE', 'TRIALING')
    """)
    long countActiveSubscriptions();

    @Query("""
        SELECT SUM(s.monthlyBaseAmount) FROM Subscription s
        WHERE s.status IN ('ACTIVE', 'TRIALING')
    """)
    Optional<java.math.BigDecimal> calculateTotalMRR();
}
