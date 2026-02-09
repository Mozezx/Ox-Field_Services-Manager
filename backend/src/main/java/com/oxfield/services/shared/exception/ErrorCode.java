package com.oxfield.services.shared.exception;

/**
 * Códigos de erro padronizados para a API.
 */
public enum ErrorCode {

    // Auth (1xxx)
    AUTH_INVALID_CREDENTIALS("AUTH_001", "Credenciais inválidas"),
    AUTH_TOKEN_EXPIRED("AUTH_002", "Token expirado"),
    AUTH_INVALID_TOKEN("AUTH_003", "Token inválido"),
    AUTH_WRONG_APP_TYPE("AUTH_004", "Token inválido para este aplicativo"),
    AUTH_REFRESH_TOKEN_INVALID("AUTH_005", "Refresh token inválido"),

    // User (2xxx)
    USER_NOT_FOUND("USER_001", "Usuário não encontrado"),
    USER_EMAIL_EXISTS("USER_002", "Email já cadastrado"),
    USER_PENDING_APPROVAL("USER_003", "Conta pendente de aprovação"),
    USER_REJECTED("USER_004", "Conta rejeitada"),
    USER_SUSPENDED("USER_005", "Conta suspensa"),

    // Technician (3xxx)
    TECH_NOT_FOUND("TECH_001", "Técnico não encontrado"),
    TECH_NOT_APPROVED("TECH_002", "Técnico não aprovado"),
    TECH_DOCUMENT_EXPIRED("TECH_003", "Documento expirado"),
    TECH_NOT_AT_LOCATION("TECH_004", "Técnico fora do raio permitido"),

    // Category (4xxx - shared with order range, use 4xxx for category)
    CATEGORY_NOT_FOUND("CAT_001", "Categoria não encontrada"),
    CATEGORY_IN_USE("CAT_002", "Não é possível excluir categoria em uso por ordens de serviço"),
    CATEGORY_CODE_EXISTS("CAT_003", "Já existe uma categoria com este código"),

    // Order (4xxx)
    ORDER_NOT_FOUND("ORDER_001", "Ordem de serviço não encontrada"),
    ORDER_INVALID_TRANSITION("ORDER_002", "Transição de status inválida"),
    ORDER_CHECKLIST_INCOMPLETE("ORDER_003", "Checklist incompleto"),
    ORDER_MISSING_PHOTO("ORDER_004", "Foto obrigatória não enviada"),
    ORDER_MISSING_SIGNATURE("ORDER_005", "Assinatura obrigatória não enviada"),
    ORDER_ALREADY_ASSIGNED("ORDER_006", "OS já atribuída a outro técnico"),
    ORDER_TECH_UNAVAILABLE("ORDER_007", "Técnico indisponível neste horário"),

    // Sync (5xxx)
    SYNC_UNKNOWN_ACTION("SYNC_001", "Tipo de ação desconhecido"),
    SYNC_INVALID_PAYLOAD("SYNC_002", "Payload inválido"),
    SYNC_CONFLICT("SYNC_003", "Conflito de sincronização"),

    // Storage (6xxx)
    STORAGE_UPLOAD_FAILED("STORAGE_001", "Falha no upload"),
    STORAGE_FILE_TOO_LARGE("STORAGE_002", "Arquivo muito grande"),
    STORAGE_INVALID_TYPE("STORAGE_003", "Tipo de arquivo não permitido"),

    // Tenant (7xxx)
    TENANT_NOT_FOUND("TENANT_001", "Tenant não encontrado"),
    TENANT_SUSPENDED("TENANT_002", "Tenant suspenso"),
    TENANT_DOMAIN_EXISTS("TENANT_003", "Domínio já cadastrado"),

    // General (9xxx)
    INTERNAL_ERROR("GEN_001", "Erro interno do servidor"),
    VALIDATION_ERROR("GEN_002", "Erro de validação"),
    RESOURCE_NOT_FOUND("GEN_003", "Recurso não encontrado"),
    RATE_LIMIT_EXCEEDED("GEN_004", "Limite de requisições excedido"),
    ACCESS_DENIED("GEN_005", "Acesso negado"),
    INVALID_OPERATION("GEN_006", "Operação inválida"),
    ENTITY_NOT_FOUND("GEN_007", "Entidade não encontrada");

    private final String code;
    private final String defaultMessage;

    ErrorCode(String code, String defaultMessage) {
        this.code = code;
        this.defaultMessage = defaultMessage;
    }

    public String getCode() {
        return code;
    }

    public String getDefaultMessage() {
        return defaultMessage;
    }
}
