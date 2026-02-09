package com.oxfield.services.domain.enums;

import java.math.BigDecimal;

/**
 * Tipos de itens cobrados por usuário na assinatura.
 */
public enum SubscriptionItemType {
    ADMIN("Administrador", new BigDecimal("49.00")),
    GESTOR("Gestor/Dispatch", new BigDecimal("79.00")),
    TECNICO("Técnico", new BigDecimal("39.00"));

    private final String displayName;
    private final BigDecimal unitPrice;

    SubscriptionItemType(String displayName, BigDecimal unitPrice) {
        this.displayName = displayName;
        this.unitPrice = unitPrice;
    }

    public String getDisplayName() {
        return displayName;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }
}
