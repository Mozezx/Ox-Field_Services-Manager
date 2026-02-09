package com.oxfield.services.domain.enums;

/**
 * Tipos de método de pagamento
 */
public enum PaymentType {
    CREDIT_CARD("credit_card"),
    DEBIT_CARD("debit_card"),
    APPLE_PAY("apple_pay"),
    GOOGLE_PAY("google_pay"),
    PIX("pix"),
    BOLETO("boleto");

    private final String value;

    PaymentType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static PaymentType fromValue(String value) {
        for (PaymentType type : PaymentType.values()) {
            if (type.value.equalsIgnoreCase(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown PaymentType: " + value);
    }
}
