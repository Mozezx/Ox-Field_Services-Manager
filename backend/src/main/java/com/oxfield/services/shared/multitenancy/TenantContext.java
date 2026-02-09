package com.oxfield.services.shared.multitenancy;

import java.util.UUID;

/**
 * Contexto do Tenant usando ThreadLocal.
 * Armazena o tenant_id do usuário autenticado para a thread atual.
 * 
 * IMPORTANTE: Sempre chamar clear() no finally ou após o request
 * para evitar memory leaks.
 */
public final class TenantContext {

    private static final ThreadLocal<UUID> currentTenant = new ThreadLocal<>();

    private TenantContext() {
        // Classe utilitária, não instanciar
    }

    /**
     * Define o tenant para a thread atual
     */
    public static void setCurrentTenantId(UUID tenantId) {
        currentTenant.set(tenantId);
    }

    /**
     * Obtém o tenant da thread atual
     */
    public static UUID getCurrentTenantId() {
        return currentTenant.get();
    }

    /**
     * Verifica se há um tenant definido
     */
    public static boolean hasTenant() {
        return currentTenant.get() != null;
    }

    /**
     * Limpa o tenant da thread atual.
     * DEVE ser chamado no finally de cada request.
     */
    public static void clear() {
        currentTenant.remove();
    }

    /**
     * Executa uma operação no contexto de um tenant específico
     */
    public static <T> T executeWithTenant(UUID tenantId, TenantOperation<T> operation) {
        UUID previousTenant = getCurrentTenantId();
        try {
            setCurrentTenantId(tenantId);
            return operation.execute();
        } finally {
            if (previousTenant != null) {
                setCurrentTenantId(previousTenant);
            } else {
                clear();
            }
        }
    }

    /**
     * Interface funcional para operações com tenant
     */
    @FunctionalInterface
    public interface TenantOperation<T> {
        T execute();
    }
}
