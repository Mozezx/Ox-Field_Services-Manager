package com.oxfield.services.domain.enums;

/**
 * Status possíveis de uma assinatura.
 */
public enum SubscriptionStatus {
    /** Assinatura ativa e em dia */
    ACTIVE,
    
    /** Pagamento atrasado, mas ainda em período de tolerância */
    PAST_DUE,
    
    /** Assinatura cancelada pelo cliente */
    CANCELLED,
    
    /** Assinatura suspensa por inadimplência */
    SUSPENDED,
    
    /** Período de teste gratuito */
    TRIALING,
    
    /** Assinatura pausada temporariamente */
    PAUSED
}
