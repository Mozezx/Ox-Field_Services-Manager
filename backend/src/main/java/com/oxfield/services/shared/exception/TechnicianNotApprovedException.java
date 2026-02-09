package com.oxfield.services.shared.exception;

/**
 * Exceção lançada quando um técnico pendente tenta acessar recursos restritos.
 */
public class TechnicianNotApprovedException extends BusinessException {

    public TechnicianNotApprovedException(String message) {
        super(ErrorCode.TECH_NOT_APPROVED, message);
    }
}
