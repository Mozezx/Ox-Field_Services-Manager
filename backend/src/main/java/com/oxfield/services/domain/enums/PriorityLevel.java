package com.oxfield.services.domain.enums;

/**
 * Níveis de prioridade para Ordens de Serviço
 */
public enum PriorityLevel {
    LOW("low"),
    MEDIUM("medium"),
    HIGH("high"),
    URGENT("urgent");

    private final String value;

    PriorityLevel(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static PriorityLevel fromValue(String value) {
        for (PriorityLevel level : PriorityLevel.values()) {
            if (level.value.equalsIgnoreCase(value)) {
                return level;
            }
        }
        throw new IllegalArgumentException("Unknown PriorityLevel: " + value);
    }
}
