package com.oxfield.services.domain.enums;

/**
 * Tipos de notificação
 */
public enum NotificationType {
    ASSIGNMENT("assignment"), // Nova OS atribuída
    ALERT("alert"), // Alerta
    SYSTEM("system"), // Mensagem do sistema
    INFO("info"), // Informativo
    SUCCESS("success"), // Sucesso
    WARNING("warning"); // Aviso

    private final String value;

    NotificationType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static NotificationType fromValue(String value) {
        for (NotificationType type : NotificationType.values()) {
            if (type.value.equalsIgnoreCase(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown NotificationType: " + value);
    }
}
