# API Endpoints - Ox Field Services

Documentação completa das rotas REST da API v1.

---

## Base URL

```
Production: https://api.oxfield.io/api/v1
Staging:    https://api-staging.oxfield.io/api/v1
```

---

## 1. AUTENTICAÇÃO (`/auth`)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/auth/register/tech` | Registro de técnico (retorna status PENDING) | Público |
| POST | `/auth/register/client` | Registro de cliente | Público |
| POST | `/auth/login` | Login com email/senha | Público |
| POST | `/auth/refresh` | Renovar access token | Bearer |
| POST | `/auth/logout` | Invalidar tokens | Bearer |
| POST | `/auth/forgot-password` | Solicitar reset de senha | Público |
| POST | `/auth/reset-password` | Confirmar reset de senha | Público |
| GET | `/auth/me` | Dados do usuário logado | Bearer |

### Payloads

```json
// POST /auth/register/tech
{
  "email": "tech@example.com",
  "password": "SecurePass123!",
  "name": "João Silva",
  "phone": "+32470123456",
  "tenantDomain": "acme.oxfield.io",
  "skills": ["hvac", "electrical"]
}

// POST /auth/login
{
  "email": "tech@example.com",
  "password": "SecurePass123!",
  "appType": "TECH_APP" // TECH_APP | CLIENT_APP | EMPRESA_WEB
}

// Response Login
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 3600,
  "user": {
    "id": "uuid",
    "email": "tech@example.com",
    "name": "João Silva",
    "role": "tecnico",
    "status": "approved"
  }
}
```

---

## 2. ADMIN GLOBAL (`/admin/global`)

> **Role:** `ADMIN_GLOBAL` | **Sem tenant_id**

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/admin/global/tenants` | Listar todos os tenants |
| POST | `/admin/global/tenants` | Criar novo tenant |
| GET | `/admin/global/tenants/{id}` | Detalhes do tenant |
| PUT | `/admin/global/tenants/{id}` | Atualizar tenant |
| PATCH | `/admin/global/tenants/{id}/status` | Alterar status (suspend/activate) |
| DELETE | `/admin/global/tenants/{id}` | Remover tenant (soft delete) |
| GET | `/admin/global/tenants/{id}/metrics` | Métricas de billing do tenant |
| POST | `/admin/global/tenants/{id}/impersonate` | Gerar token de impersonação |
| GET | `/admin/global/logs` | Logs de auditoria global |
| GET | `/admin/global/dashboard` | Métricas agregadas do SaaS |

---

## 3. EMPRESA / GESTOR (`/empresa`)

> **Role:** `ADMIN_EMPRESA`, `GESTOR`

### 3.1 Dashboard

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/empresa/dashboard` | KPIs e métricas do tenant |
| GET | `/empresa/dashboard/orders-by-status` | Contagem por status |
| GET | `/empresa/dashboard/revenue` | Receita do período |

### 3.2 Técnicos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/empresa/technicians` | Listar técnicos |
| GET | `/empresa/technicians/{id}` | Detalhes do técnico |
| PUT | `/empresa/technicians/{id}` | Atualizar técnico |
| PATCH | `/empresa/technicians/{id}/status` | Aprovar/Rejeitar técnico |
| GET | `/empresa/technicians/{id}/documents` | Listar documentos |
| PATCH | `/empresa/technicians/{id}/documents/{docId}/review` | Revisar documento |
| GET | `/empresa/technicians/{id}/performance` | Métricas de performance |
| GET | `/empresa/technicians/map` | Localização dos técnicos online |

### 3.3 Clientes

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/empresa/customers` | Listar clientes |
| POST | `/empresa/customers` | Criar cliente |
| GET | `/empresa/customers/{id}` | Detalhes do cliente |
| PUT | `/empresa/customers/{id}` | Atualizar cliente |
| GET | `/empresa/customers/{id}/orders` | Histórico de OS do cliente |

### 3.4 Ordens de Serviço

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/empresa/orders` | Listar todas as OS |
| POST | `/empresa/orders` | Criar nova OS |
| GET | `/empresa/orders/{id}` | Detalhes da OS |
| PUT | `/empresa/orders/{id}` | Atualizar OS |
| DELETE | `/empresa/orders/{id}` | Cancelar OS |
| PATCH | `/empresa/orders/{id}/assign` | Atribuir técnico |
| PATCH | `/empresa/orders/{id}/reschedule` | Reagendar OS |
| GET | `/empresa/orders/{id}/timeline` | Timeline de eventos |
| GET | `/empresa/orders/{id}/messages` | Chat da OS |
| POST | `/empresa/orders/{id}/messages` | Enviar mensagem |

### 3.5 Dispatch (Agendamento)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/empresa/dispatch/calendar` | Agenda de técnicos (Gantt) |
| POST | `/empresa/dispatch/suggest` | Sugestão inteligente de técnico |
| POST | `/empresa/dispatch/optimize-route` | Otimizar rota do dia |

### 3.6 Inventário

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/empresa/materials` | Listar materiais |
| POST | `/empresa/materials` | Criar material |
| PUT | `/empresa/materials/{id}` | Atualizar material |
| PATCH | `/empresa/materials/{id}/stock` | Ajustar estoque |
| GET | `/empresa/materials/low-stock` | Materiais com estoque baixo |

### 3.7 Configurações

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/empresa/settings` | Configurações do tenant |
| PUT | `/empresa/settings` | Atualizar configurações |
| GET | `/empresa/settings/pricing` | Regras de precificação |
| PUT | `/empresa/settings/pricing` | Atualizar regras de preço |
| GET | `/empresa/checklists/templates` | Templates de checklist |
| POST | `/empresa/checklists/templates` | Criar template |
| PUT | `/empresa/checklists/templates/{id}` | Atualizar template |

---

## 4. TÉCNICO (`/tech`)

> **Role:** `TECNICO` | **Requer:** `status = APPROVED`

### 4.1 Agenda

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/tech/agenda` | Agenda do técnico (hoje + próximos) |
| GET | `/tech/agenda/{date}` | Agenda de uma data específica |
| GET | `/tech/orders/{id}` | Detalhes de uma OS |

### 4.2 Execução de OS

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| PATCH | `/tech/orders/{id}/start-route` | Iniciar deslocamento |
| PATCH | `/tech/orders/{id}/arrive` | Marcar chegada (valida GPS) |
| PATCH | `/tech/orders/{id}/start` | Iniciar execução |
| PATCH | `/tech/orders/{id}/complete` | Finalizar OS (valida requisitos) |
| GET | `/tech/orders/{id}/checklist` | Obter checklist |
| PUT | `/tech/orders/{id}/checklist` | Atualizar checklist |
| POST | `/tech/orders/{id}/photos` | Upload de foto |
| DELETE | `/tech/orders/{id}/photos/{photoId}` | Remover foto |
| POST | `/tech/orders/{id}/signature` | Upload de assinatura |
| GET | `/tech/orders/{id}/materials` | Materiais disponíveis |
| POST | `/tech/orders/{id}/materials` | Registrar material usado |

### 4.3 Localização

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/tech/location` | Atualizar localização |
| PUT | `/tech/status` | Atualizar status online/offline |

### 4.4 Perfil & Documentos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/tech/profile` | Dados do perfil |
| PUT | `/tech/profile` | Atualizar perfil |
| GET | `/tech/documents` | Listar documentos |
| POST | `/tech/documents` | Upload de documento |
| GET | `/tech/performance` | Métricas pessoais |

### 4.5 Histórico

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/tech/history` | Histórico de OS concluídas |
| GET | `/tech/history/{id}` | Detalhes de OS passada |

### 4.6 Notificações

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/tech/notifications` | Listar notificações |
| PATCH | `/tech/notifications/{id}/read` | Marcar como lida |
| PATCH | `/tech/notifications/read-all` | Marcar todas como lidas |

---

## 5. CLIENTE (`/customer`)

> **Role:** `CLIENTE`

### 5.1 Serviços

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/customer/service-requests` | Solicitar novo serviço |
| GET | `/customer/service-requests` | Minhas solicitações |
| GET | `/customer/service-requests/{id}` | Detalhes da solicitação |
| DELETE | `/customer/service-requests/{id}` | Cancelar solicitação |

### 5.2 Ordens de Serviço

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/customer/orders` | Minhas OS |
| GET | `/customer/orders/{id}` | Detalhes da OS |
| GET | `/customer/orders/{id}/tracking` | Status + localização do técnico |
| POST | `/customer/orders/{id}/rating` | Avaliar serviço |

### 5.3 Perfil & Endereços

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/customer/profile` | Meu perfil |
| PUT | `/customer/profile` | Atualizar perfil |
| GET | `/customer/addresses` | Meus endereços |
| POST | `/customer/addresses` | Adicionar endereço |
| PUT | `/customer/addresses/{id}` | Atualizar endereço |
| DELETE | `/customer/addresses/{id}` | Remover endereço |
| PATCH | `/customer/addresses/{id}/default` | Definir como padrão |

### 5.4 Pagamentos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/customer/payment-methods` | Métodos de pagamento |
| POST | `/customer/payment-methods` | Adicionar método |
| DELETE | `/customer/payment-methods/{id}` | Remover método |
| PATCH | `/customer/payment-methods/{id}/default` | Definir como padrão |

### 5.5 Suporte

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/customer/support/tickets` | Abrir ticket de suporte |
| GET | `/customer/support/tickets` | Meus tickets |
| GET | `/customer/support/faq` | Perguntas frequentes |

---

## 6. SINCRONIZAÇÃO OFFLINE (`/sync`)

> **Role:** `TECNICO` | **Para App Android**

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/sync/batch` | Processar fila de ações offline |
| GET | `/sync/pull` | Baixar dados atualizados desde timestamp |

### Payload - Sync Batch

```json
{
  "deviceId": "android-device-uuid",
  "actions": [
    {
      "clientId": "local-action-uuid",
      "type": "ORDER_STATUS_UPDATE",
      "timestamp": "2026-01-20T15:30:00Z",
      "payload": {
        "orderId": "uuid",
        "newStatus": "in_progress",
        "location": { "lat": 50.8503, "lng": 4.3517 }
      }
    },
    {
      "clientId": "local-action-uuid-2",
      "type": "CHECKLIST_UPDATE",
      "timestamp": "2026-01-20T15:32:00Z",
      "payload": {
        "orderId": "uuid",
        "items": [
          { "id": 1, "done": true },
          { "id": 2, "done": true }
        ]
      }
    },
    {
      "clientId": "local-action-uuid-3",
      "type": "PHOTO_UPLOAD",
      "timestamp": "2026-01-20T15:35:00Z",
      "payload": {
        "orderId": "uuid",
        "base64Data": "data:image/jpeg;base64,...",
        "caption": "BEFORE - Estado inicial",
        "location": { "lat": 50.8503, "lng": 4.3517 }
      }
    }
  ]
}
```

### Response - Sync Batch

```json
{
  "processed": 3,
  "successful": 2,
  "failed": 1,
  "serverTimestamp": "2026-01-20T15:36:00Z",
  "results": [
    { "clientId": "local-1", "success": true, "serverId": "uuid-server" },
    { "clientId": "local-2", "success": true },
    { "clientId": "local-3", "success": false, "error": "File too large" }
  ]
}
```

---

## 7. WEBHOOKS (`/webhooks`)

> **Endpoints chamados pelo backend para integrações externas**

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/webhooks/payment/stripe` | Callback do Stripe |
| POST | `/webhooks/sms/twilio` | Callback do Twilio |

---

## 8. PÚBLICOS (`/public`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/public/health` | Health check |
| GET | `/public/version` | Versão da API |
| GET | `/public/tenants/check?domain=acme` | Verificar se tenant existe |

---

## 9. CÓDIGOS DE RESPOSTA

| Código | Significado |
|--------|-------------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 204 | Sucesso sem conteúdo |
| 400 | Requisição inválida |
| 401 | Não autenticado |
| 403 | Sem permissão |
| 404 | Recurso não encontrado |
| 409 | Conflito (ex: email duplicado) |
| 422 | Erro de validação de negócio |
| 429 | Rate limit excedido |
| 500 | Erro interno do servidor |

---

## 10. HEADERS OBRIGATÓRIOS

```http
Authorization: Bearer <access_token>
Content-Type: application/json
Accept: application/json
X-Request-ID: <uuid>  # Para tracking de requisições
```

