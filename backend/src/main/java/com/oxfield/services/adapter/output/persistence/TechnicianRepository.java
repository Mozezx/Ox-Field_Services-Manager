package com.oxfield.services.adapter.output.persistence;

import com.oxfield.services.domain.entity.Technician;
import com.oxfield.services.domain.enums.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositório JPA para a entidade Technician.
 * O Hibernate Filter de tenant é aplicado automaticamente.
 */
@Repository
public interface TechnicianRepository extends JpaRepository<Technician, UUID> {

        /**
         * Busca técnico pelo user_id com relacionamento user carregado
         */
        @Query("""
                SELECT t FROM Technician t
                LEFT JOIN FETCH t.user
                WHERE t.userId = :userId
                """)
        Optional<Technician> findByUserId(@Param("userId") UUID userId);

        /**
         * Verifica se existe técnico para o user_id
         */
        boolean existsByUserId(UUID userId);

        /**
         * Busca técnico pelo código interno
         */
        Optional<Technician> findByInternalCode(String internalCode);

        /**
         * Busca técnico pelo nome do usuário (ex.: para simular localização).
         */
        @Query("""
                SELECT t FROM Technician t
                JOIN FETCH t.user u
                WHERE LOWER(TRIM(u.name)) = LOWER(TRIM(:name))
                """)
        Optional<Technician> findFirstByUserNameIgnoreCase(@Param("name") String name);

        /**
         * Busca técnicos online
         */
        List<Technician> findByIsOnlineTrue();

        /**
         * Busca técnicos online e aprovados
         */
        @Query("""
                        SELECT t FROM Technician t
                        JOIN t.user u
                        WHERE t.isOnline = true
                        AND u.status = :status
                        """)
        List<Technician> findOnlineAndApproved(@Param("status") UserStatus status);

        /**
         * Busca técnicos que possuem uma skill específica
         */
        @Query(value = """
                        SELECT t.* FROM technicians t
                        WHERE :skill = ANY(t.skills)
                        """, nativeQuery = true)
        List<Technician> findBySkillsContaining(@Param("skill") String skill);

        /**
         * Busca técnicos aprovados e online com localização
         */
        @Query("""
                        SELECT t FROM Technician t
                        JOIN t.user u
                        WHERE t.isOnline = true
                        AND u.status = 'APPROVED'
                        AND t.currentLocation IS NOT NULL
                        """)
        List<Technician> findAvailableWithLocation();

        /**
         * Busca técnicos pelo status do usuário
         */
        @Query("""
                        SELECT t FROM Technician t
                        JOIN FETCH t.user u
                        WHERE u.status = :status
                        ORDER BY u.createdAt DESC
                        """)
        List<Technician> findByUserStatus(@Param("status") UserStatus status);

        /**
         * Busca todos os técnicos com seus usuários, ordenados por data de criação
         */
        @Query("""
                        SELECT t FROM Technician t
                        JOIN FETCH t.user u
                        ORDER BY u.createdAt DESC
                        """)
        List<Technician> findAllWithUser();

        /**
         * Busca técnicos com localização conhecida (para fleet map).
         * Respeita o tenant via Hibernate filter.
         */
        @Query("""
                        SELECT t FROM Technician t
                        JOIN FETCH t.user u
                        WHERE t.currentLocation IS NOT NULL
                        ORDER BY u.name
                        """)
        List<Technician> findAllWithUserAndNonNullLocation();

        /**
         * Busca técnicos por tenant_id (para admin global - listagem read-only por tenant).
         * Usado fora do contexto do tenant (admin global), então tenantId é passado explicitamente.
         */
        @Query("""
                        SELECT t FROM Technician t
                        JOIN FETCH t.user u
                        WHERE t.tenantId = :tenantId
                        ORDER BY u.createdAt DESC
                        """)
        List<Technician> findByTenantId(@Param("tenantId") UUID tenantId);

        /**
         * Busca técnicos online, aprovados e com localização por tenant_id (para marketplace)
         * Ignora o filtro de tenant do Hibernate para buscar de todos os tenants
         */
        @Query("""
                        SELECT t FROM Technician t
                        JOIN t.user u
                        WHERE t.tenantId = :tenantId
                        AND t.isOnline = true
                        AND u.status = 'APPROVED'
                        AND t.currentLocation IS NOT NULL
                        """)
        List<Technician> findAvailableByTenantId(@Param("tenantId") UUID tenantId);

        /**
         * Busca técnicos online, aprovados e com localização de todos os tenants (para marketplace)
         */
        @Query(value = """
                        SELECT t.* FROM technicians t
                        JOIN users u ON t.user_id = u.id
                        WHERE t.is_online = true
                        AND u.status = 'APPROVED'
                        AND t.current_location IS NOT NULL
                        """, nativeQuery = true)
        List<Technician> findAllAvailableAcrossTenants();

        /**
         * Remove todos os técnicos (operação de admin global; technician_documents é CASCADE).
         */
        @Modifying
        @Query(value = "DELETE FROM technicians", nativeQuery = true)
        void deleteAllTechnicians();

        /**
         * Retorna os user_id de todos os técnicos (para apagar os logins depois).
         * CAST para varchar evita problemas de mapeamento UUID em native query (PostgreSQL).
         */
        @Query(value = "SELECT CAST(user_id AS varchar) FROM technicians", nativeQuery = true)
        List<String> findAllTechnicianUserIdsAsStrings();

        /**
         * Remove mensagens de chat cujo remetente é um técnico (para permitir apagar os users).
         */
        @Modifying
        @Query(value = "DELETE FROM order_messages WHERE sender_id IN (SELECT user_id FROM technicians)", nativeQuery = true)
        void deleteOrderMessagesFromTechnicians();

        /**
         * Remove referências a técnicos nos audit_logs (user_id = NULL) para não deixar vestígios.
         */
        @Modifying
        @Query(value = "UPDATE audit_logs SET user_id = NULL WHERE user_id IN (SELECT user_id FROM technicians)", nativeQuery = true)
        void clearAuditLogReferencesForTechnicians();
}
