package com.oxfield.services.adapter.input.dto.response;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * DTO de resposta do batch de sincronização.
 */
public record SyncBatchResponse(
        int totalActions,
        int successCount,
        int failedCount,
        List<SyncActionResult> results,
        Instant serverTime) {
    public record SyncActionResult(
            String clientId,
            UUID serverId, // ID no servidor (se criado)
            SyncStatus status,
            String errorCode,
            String errorMessage) {
    }

    public enum SyncStatus {
        SUCCESS,
        FAILED,
        CONFLICT,
        SKIPPED
    }

    public static SyncBatchResponse of(List<SyncActionResult> results) {
        int success = (int) results.stream()
                .filter(r -> r.status() == SyncStatus.SUCCESS)
                .count();

        return new SyncBatchResponse(
                results.size(),
                success,
                results.size() - success,
                results,
                Instant.now());
    }
}
