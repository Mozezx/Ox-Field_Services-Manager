package com.oxfield.services.domain.enums;

import java.math.BigDecimal;

/**
 * Edições de plano disponíveis no sistema SaaS.
 */
public enum PlanEdition {
    STARTER("Starter", new BigDecimal("149.00"), 5),
    PROFESSIONAL("Professional", new BigDecimal("399.00"), 25),
    ENTERPRISE("Enterprise", new BigDecimal("899.00"), Integer.MAX_VALUE);

    private final String displayName;
    private final BigDecimal basePrice;
    private final int maxTechnicians;

    PlanEdition(String displayName, BigDecimal basePrice, int maxTechnicians) {
        this.displayName = displayName;
        this.basePrice = basePrice;
        this.maxTechnicians = maxTechnicians;
    }

    public String getDisplayName() {
        return displayName;
    }

    public BigDecimal getBasePrice() {
        return basePrice;
    }

    public int getMaxTechnicians() {
        return maxTechnicians;
    }
}
