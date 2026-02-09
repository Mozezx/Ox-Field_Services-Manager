package com.oxfield.services.domain.enums;

/**
 * Status do Tenant no sistema SaaS
 */
public enum TenantStatus {
    ACTIVE("active"),
    SUSPENDED("suspended"),
    PROVISIONING("provisioning"),
    DELINQUENT("delinquent");

    private final String value;

    TenantStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static TenantStatus fromValue(String value) {
        for (TenantStatus status : TenantStatus.values()) {
            if (status.value.equalsIgnoreCase(value)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown TenantStatus: " + value);
    }
}
