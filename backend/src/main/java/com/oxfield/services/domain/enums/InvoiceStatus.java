package com.oxfield.services.domain.enums;

/**
 * Status possíveis de uma fatura.
 */
public enum InvoiceStatus {
    /** Fatura em elaboração, ainda não finalizada */
    DRAFT,
    
    /** Fatura emitida, aguardando pagamento */
    PENDING,
    
    /** Fatura paga */
    PAID,
    
    /** Fatura vencida (pagamento atrasado) */
    OVERDUE,
    
    /** Fatura cancelada */
    CANCELLED,
    
    /** Fatura estornada/reembolsada */
    REFUNDED
}
