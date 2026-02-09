package com.oxfield.services.adapter.input.dto.request;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * DTO para batch de ações de sincronização do app mobile.
 */
public record SyncBatchRequest(
        List<SyncAction> actions) {
    /**
     * Ação individual de sincronização
     */
    public record SyncAction(
            String clientId, // ID local do app
            Instant timestamp, // Quando a ação foi criada offline
            SyncActionType type, // Tipo da ação
            UUID orderId, // ID da OS relacionada (se aplicável)
            Map<String, Object> payload // Dados específicos da ação
    ) {
    }

    /**
     * Tipos de ações suportadas
     */
    public enum SyncActionType {
        UPDATE_STATUS, // Atualizar status da OS
        ADD_PHOTO, // Adicionar foto
        UPDATE_CHECKLIST, // Atualizar item do checklist
        ADD_SIGNATURE, // Adicionar assinatura
        UPDATE_LOCATION, // Atualizar localização do técnico
        ADD_MATERIAL, // Adicionar material usado
        ADD_MESSAGE // Adicionar mensagem
    }
}
