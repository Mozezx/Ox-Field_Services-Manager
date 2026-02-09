# Services & Exception Handling - Ox Field Services

Documentação detalhada dos Services principais e estratégia de exceções.

---

## 1. SERVICES PRINCIPAIS

### 1.1 AuthService

**Responsabilidade:** Autenticação, autorização e gerenciamento de sessão.

```java
@Service
public class AuthService {
    
    // ========== MÉTODOS PÚBLICOS ==========
    
    /**
     * Registro de técnico
     * - Valida se tenant existe pelo domain
     * - Cria user com role=TECNICO e status=PENDING
     * - Cria registro em technicians
     * - Não gera token (precisa aprovação)
     */
    public TechnicianRegistrationResponse registerTechnician(RegisterTechRequest request);
    
    /**
     * Registro de cliente
     * - Valida tenant
     * - Cria user com role=CLIENTE e status=APPROVED
     * - Cria registro em customers
     * - Retorna tokens
     */
    public AuthResponse registerClient(RegisterClientRequest request);
    
    /**
     * Login
     * - Valida credenciais
     * - Verifica se appType é compatível com role do usuário
     * - Gera accessToken (15min) e refreshToken (7 dias)
     * - Para técnicos: valida status != PENDING/REJECTED
     */
    public AuthResponse login(LoginRequest request);
    
    /**
     * Refresh token
     * - Valida refreshToken
     * - Gera novo accessToken
     * - Opcionalmente rotaciona refreshToken
     */
    public AuthResponse refreshToken(String refreshToken);
    
    /**
     * Logout
     * - Invalida tokens no Redis/blacklist
     */
    public void logout(UUID userId);
    
    // ========== VALIDAÇÕES INTERNAS ==========
    
    private void validateAppTypeForRole(String appType, UserRole role) {
        // TECH_APP só aceita role=TECNICO
        // CLIENT_APP só aceita role=CLIENTE
        // EMPRESA_WEB aceita ADMIN_EMPRESA/GESTOR
    }
    
    private void validateTechnicianCanLogin(User user) {
        if (user.getStatus() == UserStatus.PENDING) {
            throw new TechnicianPendingApprovalException();
        }
        if (user.getStatus() == UserStatus.REJECTED) {
            throw new TechnicianRejectedException();
        }
    }
}
```

---

### 1.2 OrderService

**Responsabilidade:** CRUD e ciclo de vida das Ordens de Serviço.

```java
@Service
public class OrderService {
    
    /**
     * Criar OS
     * - Gera os_number sequencial por tenant (OS-XXXX)
     * - Calcula estimated_price via PricingEngine
     * - Cria checklist baseado no template da categoria
     * - Dispara evento OrderCreatedEvent
     */
    public ServiceOrder createOrder(CreateOrderRequest request);
    
    /**
     * Atribuir técnico
     * - Valida se técnico está APPROVED
     * - Valida disponibilidade na agenda
     * - Atualiza technician_id
     * - Envia push notification ao técnico
     */
    public ServiceOrder assignTechnician(UUID orderId, UUID technicianId);
    
    /**
     * Transição de status
     * - Delega para OrderStateMachine
     * - Dispara OrderStatusChangedEvent
     */
    public ServiceOrder updateStatus(UUID orderId, OsStatus newStatus, LocationDTO location);
    
    /**
     * Buscar agenda do técnico
     * - Retorna OS do dia e próximos 7 dias
     * - Ordena por scheduled_date + scheduled_start
     */
    public List<ServiceOrder> getTechnicianAgenda(UUID technicianId, LocalDate from, LocalDate to);
    
    /**
     * Buscar OS com filtros
     * - Paginação
     * - Filtros: status, category, technician, customer, dateRange
     */
    public Page<ServiceOrder> findOrders(OrderFilterRequest filter, Pageable pageable);
    
    /**
     * Timeline da OS
     * - Retorna todos os eventos ordenados
     * - Inclui mudanças de status, mensagens, fotos, etc
     */
    public List<OrderTimelineEvent> getTimeline(UUID orderId);
}
```

---

### 1.3 OrderStateMachine

**Responsabilidade:** Validações e transições de status da OS.

```java
@Service
public class OrderStateMachine {
    
    private static final Map<OsStatus, Set<OsStatus>> VALID_TRANSITIONS = Map.of(
        OsStatus.SCHEDULED, Set.of(OsStatus.IN_ROUTE, OsStatus.CANCELLED),
        OsStatus.IN_ROUTE, Set.of(OsStatus.IN_PROGRESS, OsStatus.CANCELLED),
        OsStatus.IN_PROGRESS, Set.of(OsStatus.COMPLETED, OsStatus.CANCELLED),
        OsStatus.COMPLETED, Set.of(),  // Estado final
        OsStatus.CANCELLED, Set.of()   // Estado final
    );
    
    /**
     * Transição principal
     */
    public void transitionTo(ServiceOrder order, OsStatus newStatus, LocationDTO techLocation) {
        validateTransition(order.getStatus(), newStatus);
        
        switch (newStatus) {
            case IN_ROUTE -> handleStartRoute(order);
            case IN_PROGRESS -> handleArrival(order, techLocation);
            case COMPLETED -> handleCompletion(order);
            case CANCELLED -> handleCancellation(order);
        }
        
        order.setStatus(newStatus);
        order.setUpdatedAt(Instant.now());
    }
    
    /**
     * IN_ROUTE: Técnico começa deslocamento
     * - Sem validações especiais
     * - Inicia tracking de localização
     */
    private void handleStartRoute(ServiceOrder order);
    
    /**
     * IN_PROGRESS: Técnico chegou no local
     * - VALIDAÇÃO GPS: técnico deve estar em raio de 200m do endereço
     * - Registra actual_start
     */
    private void handleArrival(ServiceOrder order, LocationDTO techLocation) {
        double distance = geoService.distanceInMeters(
            techLocation.toPoint(),
            order.getAddress().getLocation()
        );
        
        if (distance > 200) {
            throw new TechnicianNotAtLocationException(distance);
        }
        
        order.setActualStart(Instant.now());
    }
    
    /**
     * COMPLETED: Finalização do serviço
     * VALIDAÇÕES:
     * 1. Checklist 100% completo
     * 2. Mínimo 1 foto com tag "AFTER"
     * 3. Assinatura digital presente
     */
    private void handleCompletion(ServiceOrder order) {
        // 1. Checklist
        OrderChecklist checklist = checklistRepository.findByOrderId(order.getId())
            .orElseThrow(ChecklistNotFoundException::new);
        
        if (!checklist.isAllCompleted()) {
            int completed = checklist.getCompletedCount();
            int total = checklist.getTotalCount();
            throw new IncompleteChecklistException(completed, total);
        }
        
        // 2. Foto AFTER
        boolean hasAfterPhoto = photoRepository.existsByOrderIdAndCaptionContainingIgnoreCase(
            order.getId(), "AFTER"
        );
        if (!hasAfterPhoto) {
            throw new MissingAfterPhotoException();
        }
        
        // 3. Assinatura
        boolean hasSignature = signatureRepository.existsByOrderId(order.getId());
        if (!hasSignature) {
            throw new MissingSignatureException();
        }
        
        order.setActualEnd(Instant.now());
        
        // Calcular preço final
        BigDecimal finalPrice = pricingEngine.calculateFinal(order);
        order.setFinalPrice(finalPrice);
    }
}
```

---

### 1.4 PricingEngineService

**Responsabilidade:** Cálculo de preços estimado e final.

```java
@Service
public class PricingEngineService {
    
    // Configurações por tenant (carregadas de settings)
    // VAT Bélgica = 21%
    
    /**
     * Calcular preço estimado (no momento da criação da OS)
     * 
     * Fórmula:
     * Subtotal = (BaseRate + (Distance × KmRate)) × CategoryMultiplier + MaterialsEstimate
     * VAT = Subtotal × 0.21
     * Total = Subtotal + VAT
     */
    public PriceEstimate calculateEstimate(PriceEstimateRequest request) {
        TenantPricingConfig config = getPricingConfig(request.getTenantId());
        
        // Taxa base por categoria
        BigDecimal baseRate = config.getBaseRate(request.getCategory());
        
        // Distância (se técnico já atribuído)
        BigDecimal distanceCost = BigDecimal.ZERO;
        if (request.getTechnicianLocation() != null) {
            double distanceKm = mapsService.getDistance(
                request.getTechnicianLocation(),
                request.getCustomerLocation()
            );
            distanceCost = BigDecimal.valueOf(distanceKm)
                .multiply(config.getKmRate());
        }
        
        // Multiplicador de categoria (urgência, complexidade)
        BigDecimal categoryMultiplier = config.getCategoryMultiplier(request.getCategory());
        
        // Estimativa de materiais
        BigDecimal materialsEstimate = config.getAverageMaterialsCost(request.getCategory());
        
        // Cálculo
        BigDecimal subtotal = baseRate.add(distanceCost)
            .multiply(categoryMultiplier)
            .add(materialsEstimate);
        
        BigDecimal vat = subtotal.multiply(config.getVatRate());
        BigDecimal total = subtotal.add(vat);
        
        return PriceEstimate.builder()
            .baseRate(baseRate)
            .distanceCost(distanceCost)
            .distanceKm(distanceKm)
            .categoryMultiplier(categoryMultiplier)
            .materialsEstimate(materialsEstimate)
            .subtotal(subtotal)
            .vatRate(config.getVatRate())
            .vatAmount(vat)
            .total(total)
            .currency("EUR")
            .build();
    }
    
    /**
     * Calcular preço final (após conclusão)
     * - Usa materiais realmente consumidos
     * - Usa tempo real de execução
     */
    public BigDecimal calculateFinal(ServiceOrder order) {
        // Materiais usados
        List<OrderMaterial> materials = materialRepository.findByOrderId(order.getId());
        BigDecimal materialsCost = materials.stream()
            .map(m -> m.getMaterial().getUnitPrice().multiply(BigDecimal.valueOf(m.getQuantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Tempo de execução
        Duration executionTime = Duration.between(order.getActualStart(), order.getActualEnd());
        BigDecimal laborCost = calculateLaborCost(executionTime, order.getCategory());
        
        BigDecimal subtotal = laborCost.add(materialsCost);
        BigDecimal vat = subtotal.multiply(getVatRate(order.getTenantId()));
        
        return subtotal.add(vat);
    }
}
```

---

### 1.5 SmartDispatchService

**Responsabilidade:** Sugestão inteligente de técnicos baseada em habilidades, localização e carga de trabalho.

```java
@Service
public class SmartDispatchService {
    
    /**
     * Sugerir melhores técnicos para uma OS
     * 
     * Critérios (peso):
     * 1. Skills Match (30%) - técnico possui habilidades requeridas
     * 2. Proximity (40%) - menor tempo de deslocamento
     * 3. Workload (30%) - menor carga de trabalho no dia
     */
    public List<TechnicianSuggestion> suggestTechnicians(DispatchRequest request) {
        
        // 1. Filtrar técnicos aprovados e online
        List<Technician> available = technicianRepository
            .findByTenantIdAndUserStatusAndIsOnline(
                request.getTenantId(), 
                UserStatus.APPROVED, 
                true
            );
        
        // 2. Filtrar por skills
        Set<String> requiredSkills = getRequiredSkills(request.getCategory());
        List<Technician> qualified = available.stream()
            .filter(t -> t.hasAnySkill(requiredSkills))
            .toList();
        
        // 3. Calcular scores para cada técnico
        List<TechnicianSuggestion> suggestions = qualified.stream()
            .map(tech -> {
                // Skill Match Score
                double skillScore = calculateSkillMatch(tech.getSkills(), requiredSkills);
                
                // Proximity Score (via Google Distance Matrix)
                DistanceResult distance = mapsService.getDistanceMatrix(
                    tech.getCurrentLocation(),
                    request.getCustomerLocation()
                );
                double proximityScore = calculateProximityScore(distance.getDurationMinutes());
                
                // Workload Score
                int ordersOnDate = orderRepository.countByTechnicianIdAndScheduledDate(
                    tech.getId(), request.getScheduledDate()
                );
                double workloadScore = calculateWorkloadScore(ordersOnDate);
                
                // Overall Score (weighted)
                double overallScore = (skillScore * 0.3) 
                                    + (proximityScore * 0.4) 
                                    + (workloadScore * 0.3);
                
                return TechnicianSuggestion.builder()
                    .technician(tech)
                    .skillMatchScore(skillScore)
                    .distanceKm(distance.getDistanceKm())
                    .estimatedArrivalMinutes(distance.getDurationMinutes())
                    .currentOrdersOnDate(ordersOnDate)
                    .workloadScore(workloadScore)
                    .overallScore(overallScore)
                    .build();
            })
            .sorted(Comparator.comparingDouble(TechnicianSuggestion::getOverallScore).reversed())
            .limit(5)
            .toList();
        
        return suggestions;
    }
    
    private double calculateProximityScore(int durationMinutes) {
        // 0-15min = 1.0, 15-30min = 0.8, 30-60min = 0.5, >60min = 0.2
        if (durationMinutes <= 15) return 1.0;
        if (durationMinutes <= 30) return 0.8;
        if (durationMinutes <= 60) return 0.5;
        return 0.2;
    }
    
    private double calculateWorkloadScore(int ordersOnDate) {
        // 0 orders = 1.0, 1-2 = 0.8, 3-4 = 0.5, 5+ = 0.2
        if (ordersOnDate == 0) return 1.0;
        if (ordersOnDate <= 2) return 0.8;
        if (ordersOnDate <= 4) return 0.5;
        return 0.2;
    }
}
```

---

### 1.6 SyncService

**Responsabilidade:** Processar ações offline do app Android.

```java
@Service
public class SyncService {
    
    /**
     * Processar batch de ações offline
     * - Processa em ordem cronológica
     * - Transação por ação (não faz rollback de todo o batch)
     * - Retorna resultado individual de cada ação
     */
    @Transactional(propagation = Propagation.NEVER) // Cada ação tem sua própria tx
    public SyncBatchResponse processBatch(SyncBatchRequest request) {
        
        // Ordenar por timestamp
        List<SyncAction> sortedActions = request.getActions().stream()
            .sorted(Comparator.comparing(SyncAction::getTimestamp))
            .toList();
        
        List<SyncActionResult> results = new ArrayList<>();
        
        for (SyncAction action : sortedActions) {
            try {
                Object result = processAction(action);
                results.add(SyncActionResult.success(action.getClientId(), result));
            } catch (Exception e) {
                log.error("Sync action failed: {}", action.getClientId(), e);
                results.add(SyncActionResult.failure(action.getClientId(), e.getMessage()));
            }
        }
        
        return SyncBatchResponse.builder()
            .processed(results.size())
            .successful(results.stream().filter(SyncActionResult::isSuccess).count())
            .failed(results.stream().filter(r -> !r.isSuccess()).count())
            .results(results)
            .serverTimestamp(Instant.now())
            .build();
    }
    
    @Transactional
    private Object processAction(SyncAction action) {
        return switch (action.getType()) {
            case "ORDER_STATUS_UPDATE" -> {
                OrderStatusPayload payload = parsePayload(action, OrderStatusPayload.class);
                yield orderService.updateStatus(
                    payload.getOrderId(),
                    payload.getNewStatus(),
                    payload.getLocation()
                );
            }
            case "CHECKLIST_UPDATE" -> {
                ChecklistPayload payload = parsePayload(action, ChecklistPayload.class);
                yield checklistService.updateItems(payload.getOrderId(), payload.getItems());
            }
            case "PHOTO_UPLOAD" -> {
                PhotoPayload payload = parsePayload(action, PhotoPayload.class);
                byte[] imageData = Base64.getDecoder().decode(payload.getBase64Data());
                yield photoService.upload(
                    payload.getOrderId(),
                    imageData,
                    payload.getCaption(),
                    payload.getLocation()
                );
            }
            case "SIGNATURE_UPLOAD" -> {
                SignaturePayload payload = parsePayload(action, SignaturePayload.class);
                yield signatureService.save(
                    payload.getOrderId(),
                    payload.getSignerName(),
                    payload.getSignatureData()
                );
            }
            case "MATERIAL_LOG" -> {
                MaterialPayload payload = parsePayload(action, MaterialPayload.class);
                yield materialService.logUsage(
                    payload.getOrderId(),
                    payload.getMaterialId(),
                    payload.getQuantity()
                );
            }
            case "LOCATION_UPDATE" -> {
                LocationPayload payload = parsePayload(action, LocationPayload.class);
                yield locationService.update(payload.getTechnicianId(), payload.getLocation());
            }
            default -> throw new UnknownSyncActionException(action.getType());
        };
    }
}
```

---

### 1.7 NotificationService

**Responsabilidade:** Gerenciar notificações in-app e push.

```java
@Service
public class NotificationService {
    
    /**
     * Criar e enviar notificação
     * - Salva no banco (notifications table)
     * - Envia push via FCM
     */
    public void notify(NotificationRequest request) {
        // Salvar no banco
        Notification notification = Notification.builder()
            .tenantId(request.getTenantId())
            .userId(request.getUserId())
            .type(request.getType())
            .title(request.getTitle())
            .message(request.getMessage())
            .priority(request.getPriority())
            .isRead(false)
            .build();
        
        notificationRepository.save(notification);
        
        // Enviar push
        if (request.isSendPush()) {
            fcmAdapter.sendToUser(request.getUserId(), PushNotification.from(notification));
        }
    }
    
    /**
     * Notificações automáticas por eventos
     */
    @EventListener
    public void onOrderAssigned(OrderAssignedEvent event) {
        notify(NotificationRequest.builder()
            .userId(event.getTechnicianUserId())
            .type(NotificationType.ASSIGNMENT)
            .title("Nova OS Atribuída")
            .message("OS #" + event.getOsNumber() + " foi atribuída a você")
            .priority(PriorityLevel.HIGH)
            .sendPush(true)
            .build());
    }
    
    @EventListener
    public void onOrderStatusChanged(OrderStatusChangedEvent event) {
        // Notificar cliente sobre mudança de status
        notify(NotificationRequest.builder()
            .userId(event.getCustomerUserId())
            .type(NotificationType.INFO)
            .title("Atualização do seu serviço")
            .message("Status atualizado: " + event.getNewStatus().getDisplayName())
            .sendPush(true)
            .build());
    }
}
```

---

## 2. ESTRATÉGIA DE EXCEÇÕES

### 2.1 Hierarquia de Exceções

```java
// Exceção base
public abstract class OxFieldException extends RuntimeException {
    private final ErrorCode errorCode;
    private final Map<String, Object> details;
    
    public OxFieldException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
        this.details = new HashMap<>();
    }
}

// Exceções de negócio (422)
public class BusinessException extends OxFieldException {
    public BusinessException(ErrorCode code, String message) {
        super(code, message);
    }
}

// Exceções de validação (400)
public class ValidationException extends OxFieldException { }

// Exceções de recurso não encontrado (404)
public class ResourceNotFoundException extends OxFieldException { }

// Exceções de autorização (403)
public class AccessDeniedException extends OxFieldException { }

// Exceções de autenticação (401)
public class AuthenticationException extends OxFieldException { }
```

### 2.2 Códigos de Erro (ErrorCode Enum)

```java
public enum ErrorCode {
    // Auth (1xxx)
    AUTH_INVALID_CREDENTIALS("AUTH_001", "Credenciais inválidas"),
    AUTH_TOKEN_EXPIRED("AUTH_002", "Token expirado"),
    AUTH_INVALID_TOKEN("AUTH_003", "Token inválido"),
    AUTH_WRONG_APP_TYPE("AUTH_004", "Token inválido para este aplicativo"),
    
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
    
    // General (9xxx)
    INTERNAL_ERROR("GEN_001", "Erro interno do servidor"),
    VALIDATION_ERROR("GEN_002", "Erro de validação"),
    TENANT_NOT_FOUND("GEN_003", "Tenant não encontrado"),
    RATE_LIMIT_EXCEEDED("GEN_004", "Limite de requisições excedido");
    
    private final String code;
    private final String defaultMessage;
}
```

### 2.3 Global Exception Handler

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    
    @ExceptionHandler(AuthenticationException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ApiError handleAuthentication(AuthenticationException ex) {
        return ApiError.builder()
            .status(401)
            .code(ex.getErrorCode().getCode())
            .message(ex.getMessage())
            .timestamp(Instant.now())
            .build();
    }
    
    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ApiError handleAccessDenied(AccessDeniedException ex) {
        return ApiError.builder()
            .status(403)
            .code(ex.getErrorCode().getCode())
            .message(ex.getMessage())
            .build();
    }
    
    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ApiError handleNotFound(ResourceNotFoundException ex) {
        return ApiError.builder()
            .status(404)
            .code(ex.getErrorCode().getCode())
            .message(ex.getMessage())
            .build();
    }
    
    @ExceptionHandler(BusinessException.class)
    @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
    public ApiError handleBusiness(BusinessException ex) {
        return ApiError.builder()
            .status(422)
            .code(ex.getErrorCode().getCode())
            .message(ex.getMessage())
            .details(ex.getDetails())
            .build();
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiError handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = ex.getBindingResult()
            .getFieldErrors().stream()
            .collect(Collectors.toMap(
                FieldError::getField,
                FieldError::getDefaultMessage
            ));
        
        return ApiError.builder()
            .status(400)
            .code(ErrorCode.VALIDATION_ERROR.getCode())
            .message("Erro de validação")
            .details(Map.of("fields", errors))
            .build();
    }
    
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiError handleGeneral(Exception ex, HttpServletRequest request) {
        String requestId = request.getHeader("X-Request-ID");
        log.error("Unhandled exception [requestId={}]", requestId, ex);
        
        return ApiError.builder()
            .status(500)
            .code(ErrorCode.INTERNAL_ERROR.getCode())
            .message("Erro interno do servidor")
            .requestId(requestId)
            .build();
    }
}
```

### 2.4 Formato de Resposta de Erro

```json
{
  "status": 422,
  "code": "ORDER_003",
  "message": "Checklist incompleto",
  "details": {
    "completed": 3,
    "total": 5,
    "missingItems": ["Verificar conexões", "Teste final"]
  },
  "timestamp": "2026-01-20T15:30:00Z",
  "requestId": "req-uuid-123",
  "path": "/api/v1/tech/orders/uuid/complete"
}
```

---

## 3. EXCEÇÕES ESPECÍFICAS DO DOMÍNIO

```java
// Técnico fora do raio de 200m
public class TechnicianNotAtLocationException extends BusinessException {
    public TechnicianNotAtLocationException(double actualDistance) {
        super(ErrorCode.TECH_NOT_AT_LOCATION, 
            String.format("Técnico está a %.0fm do endereço. Máximo permitido: 200m", actualDistance));
        addDetail("actualDistanceMeters", actualDistance);
        addDetail("maxDistanceMeters", 200);
    }
}

// Checklist incompleto
public class IncompleteChecklistException extends BusinessException {
    public IncompleteChecklistException(int completed, int total) {
        super(ErrorCode.ORDER_CHECKLIST_INCOMPLETE,
            String.format("Checklist incompleto: %d/%d itens concluídos", completed, total));
        addDetail("completed", completed);
        addDetail("total", total);
        addDetail("percentage", (completed * 100) / total);
    }
}

// Foto AFTER faltando
public class MissingAfterPhotoException extends BusinessException {
    public MissingAfterPhotoException() {
        super(ErrorCode.ORDER_MISSING_PHOTO, 
            "É obrigatório enviar pelo menos uma foto com tag 'AFTER' antes de finalizar");
    }
}

// Assinatura faltando
public class MissingSignatureException extends BusinessException {
    public MissingSignatureException() {
        super(ErrorCode.ORDER_MISSING_SIGNATURE,
            "Assinatura digital do cliente é obrigatória para finalizar a OS");
    }
}

// Transição de status inválida
public class InvalidStatusTransitionException extends BusinessException {
    public InvalidStatusTransitionException(OsStatus from, OsStatus to) {
        super(ErrorCode.ORDER_INVALID_TRANSITION,
            String.format("Transição de '%s' para '%s' não permitida", from, to));
        addDetail("currentStatus", from);
        addDetail("attemptedStatus", to);
    }
}
```

