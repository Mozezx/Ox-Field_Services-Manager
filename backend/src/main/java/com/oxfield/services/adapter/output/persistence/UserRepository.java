package com.oxfield.services.adapter.output.persistence;

import com.oxfield.services.domain.entity.User;
import com.oxfield.services.domain.enums.UserRole;
import com.oxfield.services.domain.enums.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositório JPA para a entidade User.
 * O Hibernate Filter de tenant é aplicado automaticamente.
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    /**
     * Busca usuário por email (único por tenant)
     */
    Optional<User> findByEmail(String email);

    /**
     * Verifica se email existe no tenant
     */
    boolean existsByEmail(String email);

    /**
     * Busca usuários por role
     */
    List<User> findByRole(UserRole role);

    /**
     * Busca usuários por status
     */
    List<User> findByStatus(UserStatus status);

    /**
     * Busca usuários por role e status
     */
    List<User> findByRoleAndStatus(UserRole role, UserStatus status);

    /**
     * Busca usuário por email em um tenant específico
     * (usado no login onde ainda não temos o TenantContext configurado)
     */
    @Query("SELECT u FROM User u WHERE u.email = :email AND u.tenantId = :tenantId")
    Optional<User> findByEmailAndTenantId(
            @Param("email") String email,
            @Param("tenantId") UUID tenantId);

    /**
     * Conta usuários por tenant e role
     * (usado para billing - contagem de usuários por tipo)
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.tenantId = :tenantId AND u.role = :role AND u.status = 'APPROVED'")
    long countByTenantIdAndRole(
            @Param("tenantId") UUID tenantId,
            @Param("role") UserRole role);

    /**
     * Conta todos os usuários ativos de um tenant
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.tenantId = :tenantId AND u.status = 'APPROVED'")
    long countActiveByTenantId(@Param("tenantId") UUID tenantId);

    /**
     * Busca usuário global (sem tenant) por email.
     * Usado no marketplace para clientes globais.
     */
    @Query("SELECT u FROM User u WHERE u.email = :email AND u.tenantId IS NULL")
    Optional<User> findGlobalUserByEmail(@Param("email") String email);

    /**
     * Busca o primeiro usuário com o email e role CLIENTE (para login do app cliente).
     * Fallback quando o usuário foi criado com tenant (ex.: seed) mas deve poder logar no app cliente.
     */
    @Query("SELECT u FROM User u WHERE u.email = :email AND u.role = :role ORDER BY u.tenantId NULLS FIRST")
    Optional<User> findFirstByEmailAndRole(@Param("email") String email, @Param("role") UserRole role);

    /**
     * Verifica se email global já existe (usuário sem tenant).
     */
    @Query("SELECT COUNT(u) > 0 FROM User u WHERE u.email = :email AND u.tenantId IS NULL")
    boolean existsGlobalUserByEmail(@Param("email") String email);

    /**
     * Verifica se email existe em qualquer tenant ou globalmente.
     * Usado no cadastro de empresas para verificar se o email já está em uso.
     * Query nativa para garantir que não seja afetada por filtros de tenant.
     */
    @Query(value = "SELECT COUNT(*) > 0 FROM users WHERE email = :email", nativeQuery = true)
    boolean existsByEmailAnywhere(@Param("email") String email);

    /**
     * Busca técnico global (sem tenant) por email.
     * Usado no login do app técnico quando o usuário ainda não vinculou empresa, e no registro para evitar duplicata.
     */
    @Query("SELECT u FROM User u WHERE u.email = :email AND u.role = 'TECNICO' AND u.tenantId IS NULL")
    Optional<User> findGlobalTechnicianByEmail(@Param("email") String email);
}
