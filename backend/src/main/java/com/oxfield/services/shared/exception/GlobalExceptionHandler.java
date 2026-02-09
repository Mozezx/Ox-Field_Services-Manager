package com.oxfield.services.shared.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Handler global de exceções para a API REST.
 * Converte exceções em respostas padronizadas.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Trata exceções de negócio (422)
     */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiError> handleBusinessException(
            BusinessException ex,
            HttpServletRequest request) {
        log.warn("Business exception: {} - {}", ex.getErrorCode(), ex.getMessage());

        ApiError error = ApiError.builder()
                .status(HttpStatus.UNPROCESSABLE_ENTITY.value())
                .code(ex.getErrorCode().getCode())
                .message(ex.getMessage())
                .details(ex.getDetails().isEmpty() ? null : ex.getDetails())
                .path(request.getRequestURI())
                .requestId(request.getHeader("X-Request-ID"))
                .build();

        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(error);
    }

    /**
     * Trata exceções de autenticação (401)
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiError> handleAuthenticationException(
            AuthenticationException ex,
            HttpServletRequest request) {
        log.warn("Authentication exception: {}", ex.getMessage());

        ApiError error = ApiError.builder()
                .status(HttpStatus.UNAUTHORIZED.value())
                .code(ErrorCode.AUTH_INVALID_TOKEN.getCode())
                .message("Não autenticado")
                .path(request.getRequestURI())
                .requestId(request.getHeader("X-Request-ID"))
                .build();

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    /**
     * Trata exceções de acesso negado (403)
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDeniedException(
            AccessDeniedException ex,
            HttpServletRequest request) {
        log.warn("Access denied: {}", ex.getMessage());

        ApiError error = ApiError.builder()
                .status(HttpStatus.FORBIDDEN.value())
                .code(ErrorCode.ACCESS_DENIED.getCode())
                .message("Acesso negado")
                .path(request.getRequestURI())
                .requestId(request.getHeader("X-Request-ID"))
                .build();

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    /**
     * Trata exceções de validação (400)
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidationException(
            MethodArgumentNotValidException ex,
            HttpServletRequest request) {
        Map<String, String> fieldErrors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        error -> error.getDefaultMessage() != null ? error.getDefaultMessage() : "Valor inválido",
                        (existing, replacement) -> existing));

        Map<String, Object> details = new HashMap<>();
        details.put("fields", fieldErrors);

        ApiError error = ApiError.builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .code(ErrorCode.VALIDATION_ERROR.getCode())
                .message("Erro de validação")
                .details(details)
                .path(request.getRequestURI())
                .requestId(request.getHeader("X-Request-ID"))
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * Trata falha de conversão de path variable (ex.: UUID inválido) (400)
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiError> handleMethodArgumentTypeMismatch(
            MethodArgumentTypeMismatchException ex,
            HttpServletRequest request) {
        log.warn("Invalid path or request parameter: {} - {}", ex.getName(), ex.getValue());

        String message = ex.getName() != null && ex.getName().equals("orderId")
                ? "ID da ordem inválido"
                : "Parâmetro inválido";

        ApiError error = ApiError.builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .code(ErrorCode.VALIDATION_ERROR.getCode())
                .message(message)
                .path(request.getRequestURI())
                .requestId(request.getHeader("X-Request-ID"))
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * Trata IllegalArgumentException (400)
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> handleIllegalArgumentException(
            IllegalArgumentException ex,
            HttpServletRequest request) {
        log.warn("Illegal argument: {}", ex.getMessage());

        ApiError error = ApiError.builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .code(ErrorCode.VALIDATION_ERROR.getCode())
                .message(ex.getMessage())
                .path(request.getRequestURI())
                .requestId(request.getHeader("X-Request-ID"))
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * Trata IllegalStateException: "Nenhum usuário autenticado" -> 401; outras -> 400.
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiError> handleIllegalStateException(
            IllegalStateException ex,
            HttpServletRequest request) {
        String msg = ex.getMessage() != null ? ex.getMessage() : "";
        if (msg.contains("Nenhum usuário autenticado") || msg.contains("usuário autenticado")) {
            log.warn("Not authenticated: {}", ex.getMessage());
            ApiError error = ApiError.builder()
                    .status(HttpStatus.UNAUTHORIZED.value())
                    .code(ErrorCode.AUTH_INVALID_TOKEN.getCode())
                    .message("Não autenticado")
                    .path(request.getRequestURI())
                    .requestId(request.getHeader("X-Request-ID"))
                    .build();
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }
        log.warn("Illegal state: {}", ex.getMessage());
        ApiError error = ApiError.builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .code(ErrorCode.VALIDATION_ERROR.getCode())
                .message(msg.isEmpty() ? "Estado inválido" : msg)
                .path(request.getRequestURI())
                .requestId(request.getHeader("X-Request-ID"))
                .build();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * Trata exceções gerais (500)
     * Inclui a mensagem da exceção em details para facilitar diagnóstico.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGeneralException(
            Exception ex,
            HttpServletRequest request) {
        String requestId = request.getHeader("X-Request-ID");
        log.error("Unhandled exception [requestId={}]", requestId, ex);

        Map<String, Object> details = new HashMap<>();
        details.put("exceptionType", ex.getClass().getSimpleName());
        details.put("exceptionMessage", ex.getMessage() != null ? ex.getMessage() : ex.getClass().getName());
        Throwable root = ex;
        while (root.getCause() != null) {
            root = root.getCause();
        }
        if (root != ex) {
            details.put("rootCauseClass", root.getClass().getSimpleName());
            details.put("rootCauseMessage", root.getMessage() != null ? root.getMessage() : root.getClass().getName());
        }

        ApiError error = ApiError.builder()
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .code(ErrorCode.INTERNAL_ERROR.getCode())
                .message("Erro interno do servidor")
                .details(details)
                .path(request.getRequestURI())
                .requestId(requestId)
                .build();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
