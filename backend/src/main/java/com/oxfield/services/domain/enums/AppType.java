package com.oxfield.services.domain.enums;

/**
 * Tipo de aplicativo para isolamento de tokens JWT
 */
public enum AppType {
    TECH_APP("TECH_APP"),       // App Android do Técnico
    CLIENT_APP("CLIENT_APP"),   // App do Cliente
    EMPRESA_WEB("EMPRESA_WEB"), // Portal Web da Empresa
    ADMIN_GLOBAL("ADMIN_GLOBAL"); // Portal Admin Global

    private final String value;

    AppType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static AppType fromValue(String value) {
        for (AppType type : AppType.values()) {
            if (type.value.equalsIgnoreCase(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown AppType: " + value);
    }

    /**
     * Valida se o AppType é compatível com o UserRole
     */
    public boolean isCompatibleWith(UserRole role) {
        return switch (this) {
            case TECH_APP -> role == UserRole.TECNICO;
            case CLIENT_APP -> role == UserRole.CLIENTE;
            case EMPRESA_WEB -> role == UserRole.ADMIN_EMPRESA || role == UserRole.GESTOR;
            case ADMIN_GLOBAL -> role == UserRole.ADMIN_GLOBAL;
        };
    }
}
