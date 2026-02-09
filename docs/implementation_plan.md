# Ox Field Services - Backend Implementation Plan

> **Java 21 + Spring Boot 3.2 | PostgreSQL + PostGIS | SaaS Multitenant**

---

## Resumo Executivo

Este documento consolida o planejamento técnico completo do backend para o sistema Ox Field Services - uma solução de Field Service Management (FSM) operando sob modelo SaaS Multitenant.

---

## Documentos de Referência

| Documento | Descrição |
|-----------|-----------|
| [backend_architecture.md](file:///C:/Users/moise/.gemini/antigravity/brain/9d7b2e68-d11d-439e-a288-606dae1d8eb9/backend_architecture.md) | Arquitetura Hexagonal, Multitenancy, Segurança JWT, Regras de Negócio |
| [api_endpoints.md](file:///C:/Users/moise/.gemini/antigravity/brain/9d7b2e68-d11d-439e-a288-606dae1d8eb9/api_endpoints.md) | Lista completa de 70+ endpoints REST organizados por módulo |
| [services_and_exceptions.md](file:///C:/Users/moise/.gemini/antigravity/brain/9d7b2e68-d11d-439e-a288-606dae1d8eb9/services_and_exceptions.md) | Lógica detalhada dos Services e estratégia de exceções |

---

## Arquivos Criados no Projeto

```
d:\Documentos\ox-field-service\
├── database\
│   └── schema.sql              # Esquema PostgreSQL + PostGIS
└── backend\
    ├── pom.xml                 # Dependências Maven
    └── src\main\resources\
        └── application.yml     # Configurações Spring Boot
```

---

## Stack Tecnológica

| Componente | Tecnologia | Versão |
|------------|------------|--------|
| Runtime | Java | 21 (LTS) |
| Framework | Spring Boot | 3.2.1 |
| Segurança | Spring Security + JWT (jjwt) | 6.x / 0.12.3 |
| Database | PostgreSQL + PostGIS | 15+ |
| ORM | Hibernate + Hibernate Spatial | 6.3 |
| Migrations | Flyway | 10.x |
| Cache | Redis | 7.x |
| Storage | AWS S3 | SDK v2 |
| Maps | Google Maps API | - |
| Push | Firebase Cloud Messaging | 9.x |
| WebSocket | Spring WebSocket + STOMP | - |
| Docs | SpringDoc OpenAPI | 2.3.0 |

---

## Padrão Arquitetural: Hexagonal

```
┌────────────────────────────────────────────────┐
│              ADAPTERS (INPUT)                  │
│  REST Controllers, WebSocket, Scheduled Jobs  │
└──────────────────────┬─────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────┐
│           APPLICATION LAYER                     │
│  Use Cases, Services, DTOs, Mappers            │
└──────────────────────┬─────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────┐
│              DOMAIN LAYER                       │
│  Entities, Enums, Value Objects, Events        │
└──────────────────────┬─────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────┐
│             ADAPTERS (OUTPUT)                   │
│  JPA Repositories, S3, Google Maps, FCM        │
└────────────────────────────────────────────────┘
```

---

## Multitenancy Strategy

- **Tipo:** Discriminator Column (`tenant_id`)
- **Implementação:** Hibernate Filters + Spring AOP
- **Escopo:** Todas as entidades exceto `Tenant` e `GlobalAdminUser`

```java
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
```

---

## Segurança JWT

### Claims do Token
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "tecnico",
  "tenantId": "tenant-uuid",
  "appType": "TECH_APP",
  "exp": 1705760400
}
```

### Isolamento de App
- `TECH_APP` → apenas role `TECNICO`
- `CLIENT_APP` → apenas role `CLIENTE`
- `EMPRESA_WEB` → roles `ADMIN_EMPRESA`, `GESTOR`

---

## Principais Services

| Service | Responsabilidade |
|---------|------------------|
| `AuthService` | Autenticação, registro, tokens JWT |
| `OrderService` | CRUD e ciclo de vida das OS |
| `OrderStateMachine` | Transições de status com validações |
| `PricingEngineService` | Cálculo de preços (baseRate + distância + materiais + VAT) |
| `SmartDispatchService` | Sugestão de técnicos (skills + proximidade + workload) |
| `SyncService` | Processamento de ações offline do app Android |
| `NotificationService` | Notificações in-app + push via FCM |
| `LiveTrackingService` | Broadcast de localização via WebSocket |

---

## Regras de Negócio Críticas

### 1. Chegada do Técnico (IN_PROGRESS)
- GPS do técnico deve estar em raio de **200 metros** do endereço
- Validação via PostGIS `ST_Distance`

### 2. Conclusão da OS (COMPLETED)
- **100%** do checklist preenchido
- Mínimo **1 foto** com tag "AFTER"
- **Assinatura digital** do cliente presente

### 3. Pricing Engine
```
Subtotal = (BaseRate + (Distance × KmRate)) × CategoryMultiplier + Materials
VAT = Subtotal × 0.21 (Bélgica)
Total = Subtotal + VAT
```

---

## Endpoints por Módulo

| Módulo | Quantidade | Roles |
|--------|------------|-------|
| Auth | 9 | Público / Bearer |
| Admin Global | 10 | `ADMIN_GLOBAL` |
| Empresa | 35 | `ADMIN_EMPRESA`, `GESTOR` |
| Técnico | 22 | `TECNICO` (status=APPROVED) |
| Cliente | 18 | `CLIENTE` |
| Sync | 2 | `TECNICO` |

**Total: ~96 endpoints**

---

## Estratégia de Exceções

### Hierarquia
```
OxFieldException (base)
├── AuthenticationException (401)
├── AccessDeniedException (403)
├── ResourceNotFoundException (404)
├── ValidationException (400)
└── BusinessException (422)
    ├── TechnicianNotAtLocationException
    ├── IncompleteChecklistException
    ├── MissingAfterPhotoException
    └── MissingSignatureException
```

### Formato de Erro
```json
{
  "status": 422,
  "code": "ORDER_003",
  "message": "Checklist incompleto",
  "details": { "completed": 3, "total": 5 },
  "timestamp": "2026-01-20T15:30:00Z"
}
```

---

## Integrações Externas

| Serviço | Uso |
|---------|-----|
| **AWS S3** | Storage de fotos e assinaturas |
| **Google Maps API** | Geocoding, Distance Matrix, Directions |
| **Firebase FCM** | Push notifications |
| **Redis** | Cache + Token blacklist |

---

## Próximos Passos

1. [ ] Configurar estrutura de pacotes Java
2. [ ] Criar entidades JPA com mapeamento PostGIS
3. [ ] Implementar `TenantContext` e `TenantFilter`
4. [ ] Implementar `JwtTokenProvider` e `SecurityConfig`
5. [ ] Criar repositórios Spring Data JPA
6. [ ] Implementar Services core (Auth, Order, Pricing)
7. [ ] Criar Controllers REST
8. [ ] Configurar WebSocket para tracking
9. [ ] Integrar S3, Google Maps, FCM
10. [ ] Escrever testes com Testcontainers
11. [ ] Configurar CI/CD

---

## Notas Importantes

> [!IMPORTANT]
> O `tenant_id` deve ser propagado em TODAS as operações. Use `TenantContext.getCurrentTenantId()` para acessar o tenant atual da requisição.

> [!WARNING]
> A validação de GPS usa `ST_Distance` do PostGIS. Certifique-se que a extensão está habilitada no banco.

> [!CAUTION]
> Tokens JWT do app técnico NÃO devem funcionar no app cliente. Sempre valide o claim `appType`.

