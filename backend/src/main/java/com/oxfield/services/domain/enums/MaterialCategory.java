package com.oxfield.services.domain.enums;

/**
 * Categorias de materiais
 */
public enum MaterialCategory {
    ELECTRICAL("electrical"),
    PLUMBING("plumbing"),
    HVAC("hvac"),
    FASTENERS("fasteners"),
    GENERAL("general");

    private final String value;

    MaterialCategory(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static MaterialCategory fromValue(String value) {
        for (MaterialCategory cat : MaterialCategory.values()) {
            if (cat.value.equalsIgnoreCase(value)) {
                return cat;
            }
        }
        throw new IllegalArgumentException("Unknown MaterialCategory: " + value);
    }
}
