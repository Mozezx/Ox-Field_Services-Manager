package com.oxfield.services.shared.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.Map;

/**
 * DTO padrão para respostas de erro da API.
 * Baseado em RFC 7807 (Problem Details for HTTP APIs).
 * Implementado como record Java 21 para imutabilidade e concisão.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(
        int status,
        String code,
        String message,
        Map<String, Object> details,
        Instant timestamp,
        String path,
        String requestId) {
    /**
     * Construtor compacto que garante timestamp não-nulo.
     */
    public ApiError {
        if (timestamp == null) {
            timestamp = Instant.now();
        }
    }

    /**
     * Factory method para criar ApiError a partir de ErrorCode.
     */
    public static ApiError of(int status, ErrorCode errorCode, String message, String path, String requestId) {
        return new ApiError(status, errorCode.getCode(), message, null, Instant.now(), path, requestId);
    }

    /**
     * Factory method com detalhes adicionais.
     */
    public static ApiError of(int status, ErrorCode errorCode, String message, Map<String, Object> details, String path,
            String requestId) {
        return new ApiError(status, errorCode.getCode(), message, details, Instant.now(), path, requestId);
    }

    /**
     * Builder pattern para compatibilidade com código existente.
     */
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private int status;
        private String code;
        private String message;
        private Map<String, Object> details;
        private Instant timestamp;
        private String path;
        private String requestId;

        public Builder status(int status) {
            this.status = status;
            return this;
        }

        public Builder code(String code) {
            this.code = code;
            return this;
        }

        public Builder message(String message) {
            this.message = message;
            return this;
        }

        public Builder details(Map<String, Object> details) {
            this.details = details;
            return this;
        }

        public Builder timestamp(Instant timestamp) {
            this.timestamp = timestamp;
            return this;
        }

        public Builder path(String path) {
            this.path = path;
            return this;
        }

        public Builder requestId(String requestId) {
            this.requestId = requestId;
            return this;
        }

        public ApiError build() {
            return new ApiError(status, code, message, details, timestamp, path, requestId);
        }
    }
}
