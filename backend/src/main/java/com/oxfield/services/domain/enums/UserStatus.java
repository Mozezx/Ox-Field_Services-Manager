package com.oxfield.services.domain.enums;

/**
 * Status de aprovação de usuários
 */
public enum UserStatus {
    PENDING("pending"),
    APPROVED("approved"),
    REJECTED("rejected"),
    SUSPENDED("suspended");

    private final String value;

    UserStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static UserStatus fromValue(String value) {
        for (UserStatus status : UserStatus.values()) {
            if (status.value.equalsIgnoreCase(value)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown UserStatus: " + value);
    }
}
