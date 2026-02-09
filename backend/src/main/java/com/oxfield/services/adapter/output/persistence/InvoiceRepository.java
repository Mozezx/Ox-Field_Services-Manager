package com.oxfield.services.adapter.output.persistence;

import com.oxfield.services.domain.entity.Invoice;
import com.oxfield.services.domain.enums.InvoiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {

    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);

    Optional<Invoice> findByStripeInvoiceId(String stripeInvoiceId);

    List<Invoice> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    Page<Invoice> findByTenantId(UUID tenantId, Pageable pageable);

    List<Invoice> findByTenantIdAndStatus(UUID tenantId, InvoiceStatus status);

    @Query("""
        SELECT i FROM Invoice i
        WHERE i.status = :status
        ORDER BY i.dueDate ASC
    """)
    List<Invoice> findByStatus(@Param("status") InvoiceStatus status);

    @Query("""
        SELECT i FROM Invoice i
        WHERE i.status = 'PENDING'
        AND i.dueDate < :date
    """)
    List<Invoice> findOverdueInvoices(@Param("date") LocalDate date);

    @Query("""
        SELECT i FROM Invoice i
        WHERE i.tenant.id = :tenantId
        AND i.periodStart >= :startDate
        AND i.periodEnd <= :endDate
        ORDER BY i.periodStart ASC
    """)
    List<Invoice> findByTenantIdAndPeriod(
            @Param("tenantId") UUID tenantId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("""
        SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i
        WHERE i.status = 'PAID'
        AND i.paidAt >= :startDate
    """)
    java.math.BigDecimal calculateRevenueFromDate(@Param("startDate") java.time.Instant startDate);

    @Query("""
        SELECT COUNT(i) FROM Invoice i
        WHERE i.status = :status
    """)
    long countByStatus(@Param("status") InvoiceStatus status);

    @Query(value = """
        SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number, 5) AS INTEGER)), 0)
        FROM invoices
        WHERE invoice_number LIKE :prefix
    """, nativeQuery = true)
    int findMaxInvoiceNumberWithPrefix(@Param("prefix") String prefix);
}
