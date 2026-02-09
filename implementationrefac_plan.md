# Plano de Refatoração Arquitetural - Ox Field Services

Transformar o backend de um "Monólito Hexagonal Incompleto" para uma **Layered Architecture** coesa, pronta para escalar como SaaS.

> [!NOTE]
> **Skills Consultadas:** Este plano incorpora práticas de `java-pro`, `backend-dev-guidelines`, `api-design-principles` e `architecture-patterns`.

## User Review Required

> [!IMPORTANT]
> **Decisão Arquitetural:** Este plano abandona a tentativa de arquitetura Hexagonal em favor de uma arquitetura em camadas padrão do Spring. Isso simplifica o código e remove abstrações não utilizadas.

> [!WARNING]
> **Breaking Change Potencial:** A quebra do `TechnicianController` em 6 controllers menores pode afetar testes de integração existentes. Os endpoints HTTP **não mudam**, apenas a organização interna.

---

## Práticas Incorporadas das Skills

| Skill | Prática Adicionada ao Plano |
|-------|----------------------------|
| `java-pro` | Virtual Threads (Java 21), Record DTOs, EntityGraph para N+1, Testcontainers |
| `backend-dev-guidelines` | Controller magro (parse/delegate/respond), Validation layer, BFRI checklist |
| `api-design-principles` | Padrão de erros consistente, Paginação padronizada, HTTP status codes corretos |
| `architecture-patterns` | Repository pattern sem vazamento de ORM, Value Objects onde aplicável |

---

## Proposed Changes

### Sprint 1: Saneamento Básico

---

#### Fase 1.1: Limpeza Transacional

##### [MODIFY] [application.properties](file:///d:/Documentos/ox-field-service/backend/src/main/resources/application.properties)
- Adicionar `spring.jpa.open-in-view=false`

##### [MODIFY] [TechnicianController.java](file:///d:/Documentos/ox-field-service/backend/src/main/java/com/oxfield/services/adapter/input/rest/TechnicianController.java)
- Remover todas as anotações `@Transactional` (~10 ocorrências)

---

#### Fase 1.2: Quebra do God Controller

**Novos Controllers (seguindo padrão `backend-dev-guidelines`: "Controllers Coordinate, Services Decide"):**

| Novo Controller | Endpoints | Responsabilidade |
|----------------|-----------|------------------|
| [TechOrderController.java](file:///d:/Documentos/ox-field-service/backend/src/main/java/com/oxfield/services/adapter/input/rest/TechOrderController.java) | `/tech/agenda`, `/tech/orders/**` | Fluxo de OS |
| [TechProfileController.java](file:///d:/Documentos/ox-field-service/backend/src/main/java/com/oxfield/services/adapter/input/rest/TechProfileController.java) | `/tech/profile/**`, `/tech/status` | Perfil e status |
| [TechLocationController.java](file:///d:/Documentos/ox-field-service/backend/src/main/java/com/oxfield/services/adapter/input/rest/TechLocationController.java) | `/tech/location` | GPS tracking |
| [TechMaterialController.java](file:///d:/Documentos/ox-field-service/backend/src/main/java/com/oxfield/services/adapter/input/rest/TechMaterialController.java) | `/tech/materials`, `/tech/orders/{id}/materials` | Materiais |
| [TechNotificationController.java](file:///d:/Documentos/ox-field-service/backend/src/main/java/com/oxfield/services/adapter/input/rest/TechNotificationController.java) | `/tech/notifications/**` | Notificações |
| [TechPerformanceController.java](file:///d:/Documentos/ox-field-service/backend/src/main/java/com/oxfield/services/adapter/input/rest/TechPerformanceController.java) | `/tech/performance`, `/tech/history` | Métricas |

##### [DELETE] TechnicianController.java
- Removido após migração completa

---

#### Fase 1.3: Services Especializados

##### [NEW] [TechnicianProfileService.java](file:///d:/Documentos/ox-field-service/backend/src/main/java/com/oxfield/services/application/service/TechnicianProfileService.java)
```java
@Service
@Transactional
public class TechnicianProfileService {
    // Lógica de: getProfile(), uploadAvatar(), updateOnlineStatus()
    // Retorna DTOs prontos (não entidades lazy)
}
```

##### [NEW] [TechnicianPerformanceService.java](file:///d:/Documentos/ox-field-service/backend/src/main/java/com/oxfield/services/application/service/TechnicianPerformanceService.java)
```java
@Service
@Transactional(readOnly = true)
public class TechnicianPerformanceService {
    // Retorna PerformanceResponse (Record DTO - Java 21 style)
    public PerformanceResponse calculatePerformance(UUID technicianId, String period) { ... }
}
```

---

### Sprint 2: Eficiência e Padronização

---

#### Fase 2.1: MapStruct + Record DTOs (Java 21 Style)

##### [NEW] [OrderMapper.java](file:///d:/Documentos/ox-field-service/backend/src/main/java/com/oxfield/services/adapter/input/dto/mapper/OrderMapper.java)
```java
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface OrderMapper {
    @Mapping(target = "status", expression = "java(order.getStatus().getValue())")
    @Mapping(target = "priority", expression = "java(order.getPriority().getValue())")
    OrderResponse toResponse(ServiceOrder order);
}
```

##### [MODIFY] [OrderManagementService.java](file:///d:/Documentos/ox-field-service/backend/src/main/java/com/oxfield/services/application/service/OrderManagementService.java)
- Substituir `toOrderResponse()` manual → `orderMapper.toResponse(order)`

---

#### Fase 2.2: Otimização N+1 (EntityGraph)

##### [MODIFY] [ServiceOrderRepository.java](file:///d:/Documentos/ox-field-service/backend/src/main/java/com/oxfield/services/adapter/output/persistence/ServiceOrderRepository.java)
```java
@EntityGraph(attributePaths = {"customer", "customer.user", "address", "technician", "technician.user"})
List<ServiceOrder> findByTechnicianIdAndScheduledDate(UUID technicianId, LocalDate date);
```

---

#### Fase 2.3: Padronização de Erros (api-design-principles)

##### [NEW] [ApiErrorResponse.java](file:///d:/Documentos/ox-field-service/backend/src/main/java/com/oxfield/services/shared/exception/ApiErrorResponse.java)
```java
public record ApiErrorResponse(
    String error,
    String message,
    Map<String, Object> details,
    Instant timestamp,
    String path
) {}
```

##### [MODIFY] [GlobalExceptionHandler.java](file:///d:/Documentos/ox-field-service/backend/src/main/java/com/oxfield/services/config/GlobalExceptionHandler.java)
- Garantir que todas as exceções retornem `ApiErrorResponse` consistente
- HTTP Status Codes corretos: 400 (validation), 404 (not found), 409 (conflict), 422 (business error)

---

### Sprint 3 (Opcional): Virtual Threads (Java 21)

##### [MODIFY] [application.properties](file:///d:/Documentos/ox-field-service/backend/src/main/resources/application.properties)
```properties
# Habilitar Virtual Threads para alta concorrência
spring.threads.virtual.enabled=true
```

> [!TIP]
> Virtual Threads são ideais para FSM SaaS: muitas requisições simultâneas esperando I/O (banco, APIs externas).

---

## Verification Plan

### Checklist BFRI (backend-dev-guidelines)
- [ ] BFRI ≥ 3 para cada mudança
- [ ] Arquitetura em camadas respeitada
- [ ] Input validado (Bean Validation)
- [ ] Erros capturados com formato padrão
- [ ] Testes escritos

### Automated Tests
```bash
# Após cada fase
mvn clean test

# Integração com Testcontainers (java-pro recomendação)
mvn verify -Pintegration-tests
```

### Manual Verification
1. **Após Fase 1.2:** Testar fluxo completo no app do técnico
2. **Após Fase 2.2:** Verificar SQL logs (`spring.jpa.show-sql=true`) - máximo 2-3 queries por endpoint
3. **Performance:** `curl --time` antes/depois da refatoração
