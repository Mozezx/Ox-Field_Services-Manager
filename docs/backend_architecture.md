# Backend Architecture - Ox Field Services

Planejamento técnico completo do Backend em **Java 21 + Spring Boot 3.x**

---

## 1. ARQUITETURA GERAL

### 1.1 Padrão Arquitetural: Hexagonal (Ports & Adapters)

```
┌─────────────────────────────────────────────────────────────────┐
│                        INFRASTRUCTURE                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   REST API  │  │  WebSocket  │  │   FCM Push  │              │
│  │  (Adapters) │  │  (Adapters) │  │  (Adapters) │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│  ┌──────▼────────────────▼────────────────▼──────┐              │
│  │              INPUT PORTS (Interfaces)          │              │
│  └──────────────────────┬────────────────────────┘              │
│                         │                                        │
│  ┌──────────────────────▼────────────────────────┐              │
│  │              APPLICATION LAYER                 │              │
│  │   ┌─────────────────────────────────────────┐ │              │
│  │   │  Use Cases / Services                   │ │              │
│  │   │  • AuthService      • OrderService      │ │              │
│  │   │  • PricingEngine    • DispatchEngine    │ │              │
│  │   │  • SyncService      • NotificationSvc   │ │              │
│  │   └─────────────────────────────────────────┘ │              │
│  └──────────────────────┬────────────────────────┘              │
│                         │                                        │
│  ┌──────────────────────▼────────────────────────┐              │
│  │              DOMAIN LAYER                      │              │
│  │   Entities, Value Objects, Domain Events      │              │
│  │   Business Rules, State Machines              │              │
│  └──────────────────────┬────────────────────────┘              │
│                         │                                        │
│  ┌──────────────────────▼────────────────────────┐              │
│  │              OUTPUT PORTS (Interfaces)         │              │
│  └──────────────────────┬────────────────────────┘              │
│                         │                                        │
│  ┌──────────────────────▼────────────────────────┐              │
│  │              INFRASTRUCTURE ADAPTERS           │              │
│  │   ┌─────────┐  ┌─────────┐  ┌─────────────┐   │              │
│  │   │ JPA/DB  │  │  S3     │  │ Google Maps │   │              │
│  │   └─────────┘  └─────────┘  └─────────────┘   │              │
│  └───────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Estrutura de Pacotes

```
com.oxfield.services/
├── OxFieldServicesApplication.java
├── config/
│   ├── SecurityConfig.java
│   ├── JpaConfig.java
│   ├── TenantFilter.java
│   ├── WebSocketConfig.java
│   └── S3Config.java
├── domain/
│   ├── entity/
│   │   ├── Tenant.java
│   │   ├── User.java
│   │   ├── Technician.java
│   │   ├── Customer.java
│   │   ├── ServiceOrder.java
│   │   └── ... (todas entidades)
│   ├── enums/
│   │   ├── UserStatus.java
│   │   ├── OsStatus.java
│   │   └── ... (todos enums)
│   ├── valueobject/
│   │   ├── GeoLocation.java
│   │   ├── Money.java
│   │   └── OsNumber.java
│   └── event/
│       ├── OrderCreatedEvent.java
│       ├── OrderStatusChangedEvent.java
│       └── TechnicianLocationUpdatedEvent.java
├── application/
│   ├── port/
│   │   ├── input/
│   │   │   ├── AuthUseCase.java
│   │   │   ├── OrderUseCase.java
│   │   │   └── SyncUseCase.java
│   │   └── output/
│   │       ├── UserRepository.java
│   │       ├── OrderRepository.java
│   │       ├── StoragePort.java
│   │       └── MapsPort.java
│   └── service/
│       ├── AuthService.java
│       ├── OrderService.java
│       ├── PricingEngineService.java
│       ├── SmartDispatchService.java
│       ├── SyncService.java
│       └── NotificationService.java
├── adapter/
│   ├── input/
│   │   ├── rest/
│   │   │   ├── AuthController.java
│   │   │   ├── OrderController.java
│   │   │   ├── TechnicianController.java
│   │   │   ├── CustomerController.java
│   │   │   ├── SyncController.java
│   │   │   └── AdminController.java
│   │   ├── websocket/
│   │   │   └── TrackingWebSocketHandler.java
│   │   └── dto/
│   │       ├── request/
│   │       └── response/
│   └── output/
│       ├── persistence/
│       │   ├── JpaUserRepository.java
│       │   ├── JpaOrderRepository.java
│       │   └── SpringDataRepositories.java
│       ├── storage/
│       │   └── S3StorageAdapter.java
│       ├── maps/
│       │   └── GoogleMapsAdapter.java
│       └── notification/
│           └── FcmNotificationAdapter.java
└── shared/
    ├── exception/
    │   ├── GlobalExceptionHandler.java
    │   ├── BusinessException.java
    │   └── ErrorCode.java
    ├── security/
    │   ├── JwtTokenProvider.java
    │   ├── TenantContext.java
    │   └── CurrentUser.java
    └── util/
        └── GeoUtils.java
```

---

## 2. MULTITENANCY

### 2.1 Estratégia: Discriminator Column (tenant_id)

Todas as entidades (exceto `Tenant` e `GlobalAdminUser`) herdam de `TenantAwareEntity`:

```java
@MappedSuperclass
@FilterDef(name = "tenantFilter", parameters = @ParamDef(name = "tenantId", type = UUID.class))
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public abstract class TenantAwareEntity {
    
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;
    
    @PrePersist
    public void prePersist() {
        if (this.tenantId == null) {
            this.tenantId = TenantContext.getCurrentTenantId();
        }
    }
}
```

### 2.2 Tenant Interceptor

```java
@Component
public class TenantInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, 
                            HttpServletResponse response, 
                            Object handler) {
        // Extrai tenant do JWT ou header
        String tenantId = extractTenantFromToken(request);
        TenantContext.setCurrentTenant(UUID.fromString(tenantId));
        return true;
    }
    
    @Override
    public void afterCompletion(...) {
        TenantContext.clear();
    }
}
```

### 2.3 Hibernate Filter Aspect

```java
@Aspect
@Component
public class TenantFilterAspect {
    
    @Autowired
    private EntityManager entityManager;
    
    @Before("execution(* com.oxfield.services.adapter.output.persistence.*.*(..))")
    public void enableTenantFilter() {
        Session session = entityManager.unwrap(Session.class);
        UUID tenantId = TenantContext.getCurrentTenantId();
        if (tenantId != null) {
            session.enableFilter("tenantFilter")
                   .setParameter("tenantId", tenantId);
        }
    }
}
```

---

## 3. SEGURANÇA (Spring Security 6)

### 3.1 JWT com Claims Customizados

```java
public class JwtClaims {
    String sub;        // user_id
    String email;
    String role;       // user_role enum
    UUID tenantId;
    String appType;    // "TECH_APP" | "CLIENT_APP" | "EMPRESA_WEB" | "ADMIN_GLOBAL"
    long exp;
}
```

### 3.2 SecurityFilterChain

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    return http
        .csrf(csrf -> csrf.disable())
        .sessionManagement(sm -> sm.sessionCreationPolicy(STATELESS))
        .authorizeHttpRequests(auth -> auth
            // Public endpoints
            .requestMatchers("/api/v1/auth/**").permitAll()
            .requestMatchers("/api/v1/public/**").permitAll()
            
            // Admin Global - SEM TENANT
            .requestMatchers("/api/v1/admin/global/**").hasRole("ADMIN_GLOBAL")
            
            // Empresa endpoints
            .requestMatchers("/api/v1/empresa/**").hasAnyRole("ADMIN_EMPRESA", "GESTOR")
            
            // Técnico endpoints - REQUER STATUS APPROVED
            .requestMatchers("/api/v1/tech/**").hasRole("TECNICO")
            
            // Cliente endpoints
            .requestMatchers("/api/v1/customer/**").hasRole("CLIENTE")
            
            .anyRequest().authenticated()
        )
        .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
        .build();
}
```

### 3.3 Isolamento de App (AppType Validator)

```java
@Component
public class AppTypeValidator {
    
    public void validateTechAppOnly(JwtClaims claims) {
        if (!"TECH_APP".equals(claims.getAppType())) {
            throw new AccessDeniedException("Token inválido para este aplicativo");
        }
    }
    
    public void validateClientAppOnly(JwtClaims claims) {
        if (!"CLIENT_APP".equals(claims.getAppType())) {
            throw new AccessDeniedException("Token inválido para este aplicativo");
        }
    }
}
```

### 3.4 Onboarding Guard (Técnico PENDING)

```java
@Aspect
@Component
public class TechnicianApprovalAspect {
    
    @Before("@annotation(RequiresApprovedTechnician)")
    public void checkApproval() {
        User user = SecurityContextHolder.getContext()...;
        if (user.getRole() == UserRole.TECNICO 
            && user.getStatus() != UserStatus.APPROVED) {
            throw new TechnicianNotApprovedException(
                "Documentos pendentes de validação. Entre em contato com seu gestor."
            );
        }
    }
}
```

---

## 4. REGRAS DE NEGÓCIO

### 4.1 Pricing Engine

```java
@Service
public class PricingEngineService {
    
    private static final BigDecimal VAT_RATE = new BigDecimal("0.21"); // Bélgica 21%
    
    public PriceCalculation calculate(PricingRequest request) {
        // 1. Taxa Base por categoria
        BigDecimal baseRate = getCategoryRate(request.getCategory());
        
        // 2. Distância via PostGIS
        Double distanceKm = geoService.calculateDistance(
            request.getTechnicianLocation(),
            request.getCustomerLocation()
        );
        
        // 3. Taxa por KM
        BigDecimal distanceCost = new BigDecimal(distanceKm)
            .multiply(getKmRate(request.getTenantId()));
        
        // 4. Multiplicador de categoria
        BigDecimal categoryMultiplier = getCategoryMultiplier(request.getCategory());
        
        // 5. Custo de materiais
        BigDecimal materialsCost = calculateMaterialsCost(request.getMaterials());
        
        // 6. Subtotal
        BigDecimal subtotal = baseRate
            .add(distanceCost)
            .multiply(categoryMultiplier)
            .add(materialsCost);
        
        // 7. VAT
        BigDecimal vat = subtotal.multiply(VAT_RATE);
        
        // 8. Total
        BigDecimal total = subtotal.add(vat);
        
        return PriceCalculation.builder()
            .baseRate(baseRate)
            .distanceKm(distanceKm)
            .distanceCost(distanceCost)
            .categoryMultiplier(categoryMultiplier)
            .materialsCost(materialsCost)
            .subtotal(subtotal)
            .vatRate(VAT_RATE)
            .vatAmount(vat)
            .total(total)
            .build();
    }
}
```

### 4.2 Smart Dispatch Engine

```java
@Service
public class SmartDispatchService {
    
    public List<TechnicianSuggestion> suggestTechnicians(DispatchRequest request) {
        // 1. Filtrar por Skills
        List<Technician> qualified = technicianRepository
            .findBySkillsContaining(request.getRequiredSkills());
        
        // 2. Filtrar por disponibilidade (carga de trabalho)
        List<Technician> available = qualified.stream()
            .filter(t -> getWorkloadScore(t, request.getDate()) < 0.8)
            .toList();
        
        // 3. Calcular distância e tempo estimado (Google Distance Matrix)
        List<TechnicianWithDistance> ranked = available.stream()
            .map(t -> {
                DistanceResult dr = mapsService.getDistanceMatrix(
                    t.getCurrentLocation(),
                    request.getCustomerLocation()
                );
                return new TechnicianWithDistance(t, dr);
            })
            .sorted(Comparator.comparing(TechnicianWithDistance::getTravelTime))
            .toList();
        
        // 4. Montar sugestões com score combinado
        return ranked.stream()
            .map(twd -> TechnicianSuggestion.builder()
                .technician(twd.getTechnician())
                .distanceKm(twd.getDistance())
                .estimatedArrival(twd.getTravelTime())
                .skillMatch(calculateSkillMatch(twd, request))
                .workloadScore(getWorkloadScore(twd.getTechnician(), request.getDate()))
                .overallScore(calculateOverallScore(twd, request))
                .build())
            .limit(5)
            .toList();
    }
}
```

### 4.3 Order State Machine

```java
@Service
public class OrderStateMachine {
    
    private static final double ARRIVAL_RADIUS_METERS = 200.0;
    
    public void transitionTo(ServiceOrder order, OsStatus newStatus) {
        validateTransition(order.getStatus(), newStatus);
        
        switch (newStatus) {
            case IN_ROUTE -> handleInRoute(order);
            case IN_PROGRESS -> handleArrival(order);
            case COMPLETED -> handleCompletion(order);
            case CANCELLED -> handleCancellation(order);
        }
        
        order.setStatus(newStatus);
        orderRepository.save(order);
        eventPublisher.publish(new OrderStatusChangedEvent(order, newStatus));
    }
    
    private void handleArrival(ServiceOrder order) {
        // Validar GPS em raio de 200m
        Technician tech = order.getTechnician();
        CustomerAddress addr = order.getAddress();
        
        double distance = geoService.distanceInMeters(
            tech.getCurrentLocation(),
            addr.getLocation()
        );
        
        if (distance > ARRIVAL_RADIUS_METERS) {
            throw new InvalidStateTransitionException(
                String.format("Técnico está a %.0fm do endereço. Máximo permitido: %.0fm",
                    distance, ARRIVAL_RADIUS_METERS)
            );
        }
        
        order.setActualStart(Instant.now());
    }
    
    private void handleCompletion(ServiceOrder order) {
        // 1. Validar checklist 100%
        OrderChecklist checklist = checklistRepository.findByOrderId(order.getId())
            .orElseThrow(() -> new MissingChecklistException());
        
        if (!checklist.isFullyCompleted()) {
            throw new IncompleteChecklistException(
                "Checklist incompleto: " + checklist.getCompletionRate() + "%"
            );
        }
        
        // 2. Validar foto AFTER
        boolean hasAfterPhoto = photoRepository.existsByOrderIdAndCaptionContaining(
            order.getId(), "AFTER"
        );
        if (!hasAfterPhoto) {
            throw new MissingEvidenceException("Foto 'AFTER' obrigatória");
        }
        
        // 3. Validar assinatura
        boolean hasSignature = signatureRepository.existsByOrderId(order.getId());
        if (!hasSignature) {
            throw new MissingSignatureException("Assinatura do cliente obrigatória");
        }
        
        order.setActualEnd(Instant.now());
    }
}
```

---

## 5. INTEGRAÇÕES EXTERNAS

### 5.1 AWS S3 (Fotos e Assinaturas)

```java
@Service
public class S3StorageAdapter implements StoragePort {
    
    @Value("${aws.s3.bucket}")
    private String bucket;
    
    public String uploadPhoto(UUID tenantId, UUID orderId, MultipartFile file) {
        String key = String.format("tenants/%s/orders/%s/photos/%s_%s",
            tenantId, orderId, UUID.randomUUID(), file.getOriginalFilename());
        
        s3Client.putObject(PutObjectRequest.builder()
            .bucket(bucket)
            .key(key)
            .contentType(file.getContentType())
            .build(),
            RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        
        return generatePresignedUrl(key);
    }
}
```

### 5.2 Google Maps API

```java
@Service
public class GoogleMapsAdapter implements MapsPort {
    
    public GeocodingResult geocode(String address) {
        // Geocodificação de endereço -> lat/lng
    }
    
    public DistanceMatrixResult getDistanceMatrix(Point origin, Point destination) {
        // Tempo e distância de deslocamento
    }
    
    public List<Point> getRoute(Point origin, Point destination) {
        // Polyline da rota para exibir no mapa
    }
}
```

### 5.3 Firebase Cloud Messaging (FCM)

```java
@Service
public class FcmNotificationAdapter implements PushNotificationPort {
    
    public void sendToUser(UUID userId, PushNotification notification) {
        List<String> tokens = deviceTokenRepository.findByUserId(userId);
        
        Message message = Message.builder()
            .putData("type", notification.getType().name())
            .putData("orderId", notification.getOrderId())
            .setNotification(Notification.builder()
                .setTitle(notification.getTitle())
                .setBody(notification.getMessage())
                .build())
            .addAllTokens(tokens)
            .build();
        
        firebaseMessaging.sendMulticast(message);
    }
}
```

---

## 6. SINCRONIZAÇÃO OFFLINE

### 6.1 Endpoint de Sync Batch

```java
@PostMapping("/api/v1/sync/batch")
public SyncResponse processBatch(@RequestBody SyncBatchRequest request) {
    List<SyncResult> results = new ArrayList<>();
    
    for (SyncAction action : request.getActions()) {
        try {
            Object result = switch (action.getType()) {
                case "ORDER_STATUS_UPDATE" -> 
                    orderService.updateStatus(action.getPayload());
                case "CHECKLIST_UPDATE" -> 
                    checklistService.update(action.getPayload());
                case "PHOTO_UPLOAD" -> 
                    photoService.upload(action.getPayload());
                case "LOCATION_UPDATE" -> 
                    locationService.update(action.getPayload());
                case "SIGNATURE_UPLOAD" -> 
                    signatureService.upload(action.getPayload());
                default -> throw new UnknownActionException(action.getType());
            };
            results.add(SyncResult.success(action.getClientId(), result));
        } catch (Exception e) {
            results.add(SyncResult.failure(action.getClientId(), e.getMessage()));
        }
    }
    
    return SyncResponse.builder()
        .processed(results.size())
        .successful(results.stream().filter(SyncResult::isSuccess).count())
        .failed(results.stream().filter(r -> !r.isSuccess()).count())
        .results(results)
        .serverTimestamp(Instant.now())
        .build();
}
```

### 6.2 Estrutura do SyncAction

```json
{
  "actions": [
    {
      "clientId": "local-uuid-123",
      "type": "ORDER_STATUS_UPDATE",
      "timestamp": "2026-01-20T15:30:00Z",
      "payload": {
        "orderId": "uuid",
        "newStatus": "in_progress",
        "technicianLocation": { "lat": 50.8503, "lng": 4.3517 }
      }
    },
    {
      "clientId": "local-uuid-124",
      "type": "PHOTO_UPLOAD",
      "timestamp": "2026-01-20T15:35:00Z",
      "payload": {
        "orderId": "uuid",
        "base64Data": "...",
        "caption": "BEFORE - Estado inicial"
      }
    }
  ]
}
```

---

## 7. LIVE TRACKING (WebSocket)

### 7.1 WebSocket Config

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }
    
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws/tracking")
                .setAllowedOrigins("*")
                .withSockJS();
    }
}
```

### 7.2 Location Broadcasting

```java
@Service
public class LiveTrackingService {
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    public void broadcastTechnicianLocation(UUID orderId, LocationUpdate update) {
        String destination = "/topic/order/" + orderId + "/tracking";
        messagingTemplate.convertAndSend(destination, update);
    }
}
```

