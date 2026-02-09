package com.oxfield.services.adapter.output.persistence;

import com.oxfield.services.domain.entity.ServiceOrder;
import com.oxfield.services.domain.enums.OsStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositório JPA para ServiceOrder.
 */
@Repository
public interface ServiceOrderRepository extends JpaRepository<ServiceOrder, UUID> {

        Optional<ServiceOrder> findByOsNumber(String osNumber);

        Optional<ServiceOrder> findByShareToken(UUID shareToken);

        List<ServiceOrder> findByStatus(OsStatus status);

        List<ServiceOrder> findByCustomerId(UUID customerId);

        List<ServiceOrder> findByTechnicianId(UUID technicianId);

        List<ServiceOrder> findByTechnicianIdAndStatus(UUID technicianId, OsStatus status);

        List<ServiceOrder> findByScheduledDate(LocalDate date);

        /**
         * Busca ordens do técnico por data com relacionamentos carregados
         */
        @Query("""
                        SELECT o FROM ServiceOrder o
                        LEFT JOIN FETCH o.category
                        LEFT JOIN FETCH o.customer c
                        LEFT JOIN FETCH c.user
                        LEFT JOIN FETCH o.address
                        WHERE o.technicianId = :technicianId
                        AND o.scheduledDate = :date
                        """)
        List<ServiceOrder> findByTechnicianIdAndScheduledDate(
                        @Param("technicianId") UUID technicianId,
                        @Param("date") LocalDate date);

        /**
         * Conta ordens de um técnico em uma data (excluindo canceladas)
         */
        @Query("""
                        SELECT COUNT(o) FROM ServiceOrder o
                        WHERE o.technicianId = :technicianId
                        AND o.scheduledDate = :date
                        AND o.status != :excludeStatus
                        """)
        int countByTechnicianIdAndScheduledDateAndStatusNot(
                        @Param("technicianId") UUID technicianId,
                        @Param("date") LocalDate date,
                        @Param("excludeStatus") OsStatus excludeStatus);

        /**
         * Busca próxima OS do técnico para hoje
         */
        @Query("""
                        SELECT o FROM ServiceOrder o
                        WHERE o.technicianId = :technicianId
                        AND o.scheduledDate = :date
                        AND o.status IN ('SCHEDULED', 'IN_ROUTE')
                        ORDER BY o.scheduledStart ASC
                        """)
        List<ServiceOrder> findNextOrdersForTechnician(
                        @Param("technicianId") UUID technicianId,
                        @Param("date") LocalDate date);

        /**
         * Gera próximo número sequencial de OS para o tenant
         */
        @Query("""
                        SELECT COALESCE(MAX(CAST(SUBSTRING(o.osNumber, 4) AS integer)), 0) + 1
                        FROM ServiceOrder o
                        WHERE o.tenantId = :tenantId
                        """)
        Long getNextOsSequence(@Param("tenantId") UUID tenantId);

        /**
         * Busca ordens sem técnico atribuído (não canceladas)
         */
        @Query("""
                        SELECT o FROM ServiceOrder o
                        LEFT JOIN FETCH o.category
                        WHERE o.technicianId IS NULL
                        AND o.status != 'CANCELLED'
                        ORDER BY o.priority DESC, o.scheduledDate ASC
                        """)
        List<ServiceOrder> findUnassignedOrders();

        /**
         * Busca ordens de uma data específica com técnico e cliente
         */
        @Query("""
                        SELECT o FROM ServiceOrder o
                        LEFT JOIN FETCH o.category
                        LEFT JOIN FETCH o.technician t
                        LEFT JOIN FETCH o.customer c
                        WHERE o.scheduledDate = :date
                        AND o.status != 'CANCELLED'
                        ORDER BY o.scheduledStart ASC
                        """)
        List<ServiceOrder> findByScheduledDateWithDetails(@Param("date") LocalDate date);

        /**
         * Busca ordens completadas/canceladas do técnico com paginação.
         * EntityGraph evita LazyInitializationException ao serializar a resposta.
         * Explicit ORDER BY evita problemas de paginação e resultados não
         * determinísticos.
         */
        @EntityGraph(attributePaths = { "customer", "customer.user", "address", "category" })
        @Query("""
                        SELECT o FROM ServiceOrder o
                        WHERE o.technicianId = :technicianId
                        AND o.status IN :statuses
                        ORDER BY o.scheduledDate DESC, o.scheduledStart DESC, o.id DESC
                        """)
        Page<ServiceOrder> findByTechnicianIdAndStatusIn(
                        @Param("technicianId") UUID technicianId,
                        @Param("statuses") List<OsStatus> statuses,
                        Pageable pageable);

        /**
         * Busca ordens completadas/canceladas do técnico por período.
         * EntityGraph evita LazyInitializationException ao serializar a resposta.
         */
        @EntityGraph(attributePaths = { "customer", "customer.user", "address", "category" })
        @Query("""
                        SELECT o FROM ServiceOrder o
                        WHERE o.technicianId = :technicianId
                        AND o.status IN :statuses
                        AND o.scheduledDate BETWEEN :startDate AND :endDate
                        ORDER BY o.scheduledDate DESC, o.scheduledStart DESC
                        """)
        Page<ServiceOrder> findByTechnicianIdAndStatusInAndScheduledDateBetween(
                        @Param("technicianId") UUID technicianId,
                        @Param("statuses") List<OsStatus> statuses,
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate,
                        Pageable pageable);

        /**
         * Busca ordens completadas do técnico por período (para performance)
         */
        @Query("""
                        SELECT o FROM ServiceOrder o
                        WHERE o.technicianId = :technicianId
                        AND o.status = :status
                        AND o.actualEnd BETWEEN :startInstant AND :endInstant
                        """)
        List<ServiceOrder> findByTechnicianIdAndStatusAndActualEndBetween(
                        @Param("technicianId") UUID technicianId,
                        @Param("status") OsStatus status,
                        @Param("startInstant") Instant startInstant,
                        @Param("endInstant") Instant endInstant);

        /**
         * Verifica se existe alguma ordem usando a categoria (para bloquear exclusão).
         */
        boolean existsByCategoryId(UUID categoryId);

        /**
         * Verifica se existe alguma ordem usando o endereço (para bloquear exclusão).
         */
        boolean existsByAddressId(UUID addressId);

        /**
         * Remove a atribuição de técnico de todas as ordens (para operação de admin).
         */
        @Modifying
        @Query(value = "UPDATE service_orders SET technician_id = NULL WHERE technician_id IS NOT NULL", nativeQuery = true)
        int clearAllTechnicianAssignments();

        /**
         * Busca OS por ID com todos os relacionamentos necessários carregados.
         */
        @Query("""
                        SELECT o FROM ServiceOrder o
                        LEFT JOIN FETCH o.category
                        LEFT JOIN FETCH o.customer c
                        LEFT JOIN FETCH c.user
                        LEFT JOIN FETCH o.address
                        LEFT JOIN FETCH o.technician
                        WHERE o.id = :id
                        """)
        Optional<ServiceOrder> findByIdWithDetails(@Param("id") UUID id);
}
