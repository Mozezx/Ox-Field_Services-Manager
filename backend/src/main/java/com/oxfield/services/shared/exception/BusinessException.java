package com.oxfield.services.shared.exception;

import java.util.HashMap;
import java.util.Map;

/**
 * Exceção base para erros de negócio do sistema.
 * Todas as exceções de domínio devem estender esta classe.
 */
public class BusinessException extends RuntimeException {

    private final ErrorCode errorCode;
    private final Map<String, Object> details;

    public BusinessException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
        this.details = new HashMap<>();
    }

    public BusinessException(ErrorCode errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
        this.details = new HashMap<>();
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }

    public Map<String, Object> getDetails() {
        return details;
    }

    public BusinessException addDetail(String key, Object value) {
        this.details.put(key, value);
        return this;
    }
}
