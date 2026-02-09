package com.oxfield.services.domain.enums;

/**
 * Perfis/Roles de usuário no sistema
 */
public enum UserRole {
    ADMIN_GLOBAL("admin_global"),
    ADMIN_EMPRESA("admin_empresa"),
    GESTOR("gestor"),
    TECNICO("tecnico"),
    CLIENTE("cliente");

    private final String value;

    UserRole(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static UserRole fromValue(String value) {
        for (UserRole role : UserRole.values()) {
            if (role.value.equalsIgnoreCase(value)) {
                return role;
            }
        }
        throw new IllegalArgumentException("Unknown UserRole: " + value);
    }

    /**
     * Retorna o nome do role para Spring Security (prefixo ROLE_)
     */
    public String getAuthority() {
        return "ROLE_" + this.name();
    }
}
