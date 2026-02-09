package com.oxfield.services.domain.enums;

/**
 * Status do ciclo de vida da Ordem de Serviço
 */
public enum OsStatus {
    SCHEDULED("scheduled"), // Agendada
    IN_ROUTE("in_route"), // Técnico a caminho
    IN_PROGRESS("in_progress"), // Em execução
    COMPLETED("completed"), // Concluída
    CANCELLED("cancelled"); // Cancelada

    private final String value;

    OsStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static OsStatus fromValue(String value) {
        for (OsStatus status : OsStatus.values()) {
            if (status.value.equalsIgnoreCase(value)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown OsStatus: " + value);
    }

    /**
     * Verifica se é um estado final
     */
    public boolean isFinal() {
        return this == COMPLETED || this == CANCELLED;
    }

    /**
     * Verifica se permite transição para o status alvo
     */
    public boolean canTransitionTo(OsStatus target) {
        return switch (this) {
            case SCHEDULED -> target == IN_ROUTE || target == CANCELLED;
            case IN_ROUTE -> target == IN_PROGRESS || target == CANCELLED;
            case IN_PROGRESS -> target == COMPLETED || target == CANCELLED;
            case COMPLETED, CANCELLED -> false; // Estados finais
        };
    }
}
