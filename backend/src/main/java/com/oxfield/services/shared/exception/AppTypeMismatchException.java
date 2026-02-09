package com.oxfield.services.shared.exception;

/**
 * Exceção lançada quando o token JWT é de um app diferente do esperado.
 * Exemplo: Token do TECH_APP usado no CLIENT_APP
 */
public class AppTypeMismatchException extends BusinessException {

    public AppTypeMismatchException(String message) {
        super(ErrorCode.AUTH_WRONG_APP_TYPE, message);
    }
}
