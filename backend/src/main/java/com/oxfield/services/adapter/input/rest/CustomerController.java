package com.oxfield.services.adapter.input.rest;

import com.oxfield.services.application.service.CustomerJoinService;
import com.oxfield.services.application.service.ServiceCategoryService;
import com.oxfield.services.adapter.output.payment.StripeGateway;
import com.oxfield.services.adapter.output.persistence.CustomerAddressRepository;
import com.oxfield.services.adapter.output.persistence.CustomerRepository;
import com.oxfield.services.adapter.output.persistence.ServiceOrderRepository;
import com.oxfield.services.domain.entity.Customer;
import com.oxfield.services.domain.entity.ServiceCategory;
import com.oxfield.services.domain.entity.CustomerAddress;
import com.oxfield.services.domain.entity.PaymentMethod;
import com.oxfield.services.domain.entity.ServiceOrder;
import com.oxfield.services.domain.enums.OsStatus;
import com.oxfield.services.shared.exception.BusinessException;
import com.oxfield.services.shared.exception.ErrorCode;
import com.oxfield.services.shared.multitenancy.TenantContext;
import com.oxfield.services.shared.security.AppTypeGuard.RequiresClientApp;
import com.oxfield.services.shared.security.CurrentUserProvider;
import com.oxfield.services.shared.security.JwtUserDetails;
import com.oxfield.services.shared.util.GeoUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.locationtech.jts.geom.Point;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.beans.factory.annotation.Value;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Controller para o app do cliente.
 */
@RestController
@RequestMapping("/customer")
@PreAuthorize("hasRole('CLIENTE')")
@Tag(name = "Customer", description = "Endpoints para app do cliente")
public class CustomerController {

        private static final Logger log = LoggerFactory.getLogger(CustomerController.class);

        private final CustomerRepository customerRepository;
        private final CustomerAddressRepository customerAddressRepository;
        private final ServiceOrderRepository orderRepository;
        private final ServiceCategoryService categoryService;
        private final CurrentUserProvider currentUserProvider;
        private final StripeGateway stripeGateway;
        private final CustomerJoinService customerJoinService;

        @Value("${oxfield.arrival-radius-meters:200}")
        private double arrivalRadiusMeters;

        public CustomerController(
                        CustomerRepository customerRepository,
                        CustomerAddressRepository customerAddressRepository,
                        ServiceOrderRepository orderRepository,
                        ServiceCategoryService categoryService,
                        CurrentUserProvider currentUserProvider,
                        StripeGateway stripeGateway,
                        CustomerJoinService customerJoinService) {
                this.customerRepository = customerRepository;
                this.customerAddressRepository = customerAddressRepository;
                this.orderRepository = orderRepository;
                this.categoryService = categoryService;
                this.currentUserProvider = currentUserProvider;
                this.stripeGateway = stripeGateway;
                this.customerJoinService = customerJoinService;
        }

        /**
         * Perfil do cliente
         */
        @GetMapping("/profile")
        @RequiresClientApp
        @Operation(summary = "Perfil", description = "Retorna dados do cliente logado")
        public ResponseEntity<CustomerProfileResponse> getProfile() {
                Customer customer = getCurrentCustomer();

                return ResponseEntity.ok(new CustomerProfileResponse(
                                customer.getId(),
                                customer.getUser().getName(),
                                customer.getUser().getEmail(),
                                customer.getUser().getPhone(),
                                customer.getUser().getAvatarUrl(),
                                customer.getCompanyName(),
                                customer.getAddresses().stream()
                                                .map(this::toAddressResponse)
                                                .collect(Collectors.toList())));
        }

        /**
         * Lista OS do cliente
         */
        @GetMapping("/orders")
        @RequiresClientApp
        @Operation(summary = "Minhas OS", description = "Lista ordens de serviço do cliente")
        public ResponseEntity<List<CustomerOrderResponse>> getOrders(
                        @RequestParam(required = false) String status) {
                Customer customer = getCurrentCustomer();

                List<ServiceOrder> orders;
                if (status != null && !status.isEmpty()) {
                        orders = orderRepository.findByCustomerId(customer.getId()).stream()
                                        .filter(o -> o.getStatus().getValue().equalsIgnoreCase(status))
                                        .collect(Collectors.toList());
                } else {
                        orders = orderRepository.findByCustomerId(customer.getId());
                }

                List<CustomerOrderResponse> response = orders.stream()
                                .map(this::toCustomerOrder)
                                .collect(Collectors.toList());

                return ResponseEntity.ok(response);
        }

        /**
         * Detalhes de uma OS
         */
        @GetMapping("/orders/{orderId}")
        @RequiresClientApp
        @Operation(summary = "Detalhes OS", description = "Retorna detalhes de uma OS")
        public ResponseEntity<CustomerOrderDetailResponse> getOrderDetails(@PathVariable UUID orderId) {
                ServiceOrder order = getOrder(orderId);
                validateOwnership(order);

                return ResponseEntity.ok(toCustomerOrderDetail(order));
        }

        /**
         * Reclamar uma OS pelo token de partilha (associa a ordem ao cliente logado).
         */
        @PostMapping("/orders/claim")
        @RequiresClientApp
        @Operation(summary = "Reclamar OS por token", description = "Associa a ordem ao cliente logado usando o token do link")
        public ResponseEntity<CustomerOrderDetailResponse> claimOrder(@RequestBody ClaimOrderRequest request) {
                Customer customer = getCurrentCustomer();
                UUID tokenUuid;
                try {
                        tokenUuid = UUID.fromString(request.token() != null ? request.token().trim() : "");
                } catch (IllegalArgumentException e) {
                        throw new BusinessException(ErrorCode.ORDER_NOT_FOUND, "Link inválido ou expirado");
                }
                ServiceOrder order = orderRepository.findByShareToken(tokenUuid)
                                .orElseThrow(() -> new BusinessException(
                                                ErrorCode.ORDER_NOT_FOUND, "Esta ordem já foi associada ou o link não é válido."));
                if (order.getShareToken() == null) {
                        throw new BusinessException(
                                        ErrorCode.INVALID_OPERATION, "Esta ordem já foi associada ou o link não é válido.");
                }
                order.setCustomer(customer);
                order.setShareToken(null);
                order = orderRepository.save(order);
                log.info("Order {} claimed by customer {}", order.getOsNumber(), customer.getId());
                return ResponseEntity.ok(toCustomerOrderDetail(order));
        }

        /**
         * Lista endereços do cliente
         */
        @GetMapping("/addresses")
        @RequiresClientApp
        @Operation(summary = "Meus Endereços", description = "Lista endereços cadastrados do cliente")
        public ResponseEntity<List<AddressResponse>> getAddresses() {
                Customer customer = getCurrentCustomer();

                List<AddressResponse> addresses = customer.getAddresses().stream()
                                .map(this::toAddressResponse)
                                .collect(Collectors.toList());

                return ResponseEntity.ok(addresses);
        }

        /**
         * Adiciona um novo endereço ao cliente
         */
        @PostMapping("/addresses")
        @RequiresClientApp
        @Operation(summary = "Adicionar Endereço", description = "Adiciona um novo endereço ao cliente")
        public ResponseEntity<AddressResponse> addAddress(@RequestBody AddAddressRequest request) {
                Customer customer = getCurrentCustomer();

                // Criar novo endereço
                CustomerAddress address = new CustomerAddress();
                address.setLabel(request.label());
                address.setStreet(request.street());
                address.setCity(request.city());
                address.setState(request.state());
                address.setPostalCode(request.postalCode() != null ? request.postalCode() : "");
                address.setCountry(request.country() != null ? request.country() : "Brasil");
                address.setIsDefault(request.isDefault() != null ? request.isDefault() : false);

                // Se coordenadas fornecidas, criar Point
                if (request.latitude() != null && request.longitude() != null) {
                        Point location = GeoUtils.createPoint(request.latitude(), request.longitude());
                        address.setLocation(location);
                }

                // Se for o primeiro endereço ou marcado como padrão, definir como default
                if (customer.getAddresses().isEmpty() || (request.isDefault() != null && request.isDefault())) {
                        // Remover default de outros endereços
                        customer.getAddresses().forEach(addr -> addr.removeDefault());
                        address.setAsDefault();
                }

                customer.addAddress(address);
                customerRepository.save(customer);

                log.info("Address added for customer: {}", customer.getId());

                return ResponseEntity.status(HttpStatus.CREATED).body(toAddressResponse(address));
        }

        /**
         * Remove um endereço do cliente.
         * Não permite remover se existir ordem de serviço vinculada ao endereço.
         */
        @DeleteMapping("/addresses/{addressId}")
        @RequiresClientApp
        @Operation(summary = "Remover Endereço", description = "Remove um endereço cadastrado do cliente")
        public ResponseEntity<Void> deleteAddress(@PathVariable UUID addressId) {
                Customer customer = getCurrentCustomer();

                CustomerAddress address = customerAddressRepository.findByIdWithCustomer(addressId)
                                .orElseThrow(() -> new BusinessException(
                                                ErrorCode.RESOURCE_NOT_FOUND, "Endereço não encontrado"));

                if (!address.getCustomer().getId().equals(customer.getId())) {
                        throw new BusinessException(
                                        ErrorCode.RESOURCE_NOT_FOUND, "Endereço não encontrado");
                }

                if (orderRepository.existsByAddressId(addressId)) {
                        throw new BusinessException(
                                        ErrorCode.VALIDATION_ERROR,
                                        "Não é possível remover este endereço pois existem ordens de serviço vinculadas a ele.");
                }

                boolean wasDefault = Boolean.TRUE.equals(address.getIsDefault());
                int deleted = customerAddressRepository.deleteAddressById(addressId);
                if (deleted == 0) {
                        log.error("Address {} was not deleted (deleteAddressById returned 0). FK constraint?", addressId);
                        throw new BusinessException(
                                        ErrorCode.VALIDATION_ERROR,
                                        "Não foi possível remover o endereço. Pode estar vinculado a ordens de serviço.");
                }

                if (wasDefault) {
                        customerAddressRepository.findOthersByCustomer(customer.getId(), addressId, PageRequest.of(0, 1))
                                        .stream()
                                        .findFirst()
                                        .ifPresent(other -> {
                                                other.setAsDefault();
                                                customerAddressRepository.save(other);
                                        });
                }

                log.info("Address {} removed for customer: {}", addressId, customer.getId());
                return ResponseEntity.noContent().build();
        }

        /**
         * Cria uma nova solicitação de serviço (que será convertida em OS pela empresa)
         */
        @PostMapping("/service-requests")
        @RequiresClientApp
        @Operation(summary = "Solicitar Serviço", description = "Cria uma nova solicitação de serviço")
        public ResponseEntity<ServiceRequestResponse> createServiceRequest(
                        @RequestBody CreateServiceRequestDTO request) {

                Customer customer = getCurrentCustomer();

                // Validar endereço - tentar converter addressId para UUID ou usar endereço padrão
                CustomerAddress address = null;
                
                if (request.addressId() != null && !request.addressId().isEmpty()) {
                        try {
                                UUID addressUuid = UUID.fromString(request.addressId());
                                address = customer.getAddresses().stream()
                                                .filter(a -> a.getId().equals(addressUuid))
                                                .findFirst()
                                                .orElse(null);
                        } catch (IllegalArgumentException e) {
                                // addressId não é um UUID válido (ex: "addr-1" do frontend mock)
                                log.warn("Invalid addressId format: {}. Using default address.", request.addressId());
                        }
                }
                
                // Se não encontrou, usar endereço padrão
                if (address == null) {
                        address = customer.getDefaultAddress();
                }

                // Se ainda não tiver endereço, lançar erro
                if (address == null) {
                        throw new BusinessException(
                                        ErrorCode.VALIDATION_ERROR,
                                        "Nenhum endereço encontrado. Por favor, cadastre um endereço primeiro.");
                }

                // Determinar tenant (empresa)
                UUID tenantId;
                if (request.tenantId() != null && !request.tenantId().isEmpty()) {
                        try {
                                tenantId = UUID.fromString(request.tenantId());
                        } catch (IllegalArgumentException e) {
                                throw new BusinessException(
                                                ErrorCode.VALIDATION_ERROR,
                                                "tenantId inválido: " + request.tenantId());
                        }
                } else {
                        UUID contextTenantId = TenantContext.getCurrentTenantId();
                        if (contextTenantId != null) {
                                tenantId = contextTenantId;
                        } else {
                                throw new BusinessException(
                                                ErrorCode.VALIDATION_ERROR,
                                                "tenantId é obrigatório. Selecione uma empresa no marketplace.");
                        }
                }

                ServiceCategory category = categoryService.getByCodeAndTenant(request.category(), tenantId);

                // Criar a OS diretamente com status PENDING (aguardando atribuição de técnico)
                ServiceOrder order = new ServiceOrder();
                order.setOsNumber("OX-" + System.currentTimeMillis() % 100000);
                order.setTitle(category.getName() + " Service Request");
                order.setDescription(request.description());
                order.setCategory(category);
                order.setStatus(OsStatus.SCHEDULED);
                order.setCustomer(customer);
                order.setAddress(address);
                order.setTenantId(tenantId);

                // Parse date and time
                if (request.preferredDate() != null && !request.preferredDate().isEmpty()) {
                        order.setScheduledDate(java.time.LocalDate.parse(request.preferredDate()));
                } else {
                        order.setScheduledDate(java.time.LocalDate.now().plusDays(1));
                }

                if (request.preferredTime() != null && !request.preferredTime().isEmpty()) {
                        order.setScheduledStart(java.time.LocalTime.parse(request.preferredTime()));
                } else {
                        order.setScheduledStart(java.time.LocalTime.of(9, 0));
                }

                order.setScheduledDuration(60); // Default 60 min
                order.setEstimatedPrice(new BigDecimal("150.00")); // Default estimate
                order.setPriority(com.oxfield.services.domain.enums.PriorityLevel.MEDIUM);

                ServiceOrder saved = orderRepository.save(order);

                return ResponseEntity.ok(new ServiceRequestResponse(
                                saved.getId(),
                                saved.getOsNumber(),
                                saved.getCategory().getCode(),
                                saved.getStatus().getValue(),
                                saved.getScheduledDate().toString(),
                                saved.getScheduledStart() != null ? saved.getScheduledStart().toString() : null,
                                saved.getEstimatedPrice(),
                                saved.getCreatedAt() != null ? saved.getCreatedAt().toString()
                                                : java.time.Instant.now().toString()));
        }

        /**
         * Tracking da OS (localização do técnico)
         */
        @GetMapping("/orders/{orderId}/tracking")
        @RequiresClientApp
        @Operation(summary = "Tracking", description = "Retorna informações de tracking em tempo real")
        public ResponseEntity<TrackingResponse> getTracking(@PathVariable UUID orderId) {
                ServiceOrder order = getOrder(orderId);
                validateOwnership(order);

                if (order.getStatus() != OsStatus.IN_ROUTE) {
                        return ResponseEntity.ok(new TrackingResponse(
                                        orderId,
                                        false,
                                        null,
                                        null,
                                        null,
                                        null));
                }

                // Retornar localização do técnico apenas quando estiver a ≤ 200m do endereço (OS-87378)
                var technician = order.getTechnician();
                if (technician != null && technician.getCurrentLocation() != null) {
                        Point techLocation = technician.getCurrentLocation();
                        Double technicianLat = null;
                        Double technicianLng = null;
                        if (order.getAddress() != null && order.getAddress().getLocation() != null) {
                                double distanceMeters = GeoUtils.distanceInMeters(techLocation, order.getAddress().getLocation());
                                if (distanceMeters <= arrivalRadiusMeters) {
                                        technicianLat = GeoUtils.getLatitude(techLocation);
                                        technicianLng = GeoUtils.getLongitude(techLocation);
                                }
                        }
                        return ResponseEntity.ok(new TrackingResponse(
                                        orderId,
                                        true,
                                        technicianLat,
                                        technicianLng,
                                        technician.getUser().getName(),
                                        null // TODO: Calcular ETA
                        ));
                }

                return ResponseEntity.ok(new TrackingResponse(
                                orderId,
                                true,
                                null,
                                null,
                                technician != null ? technician.getUser().getName() : null,
                                null));
        }

        // ==================== PAYMENT ENDPOINTS ====================

        /**
         * Inicia pagamento de uma OS.
         * Cria PaymentIntent no Stripe e retorna client_secret.
         */
        @PostMapping("/orders/{orderId}/pay")
        @RequiresClientApp
        @Operation(summary = "Iniciar Pagamento", description = "Inicia processo de pagamento de uma OS")
        public ResponseEntity<PaymentIntentResponse> initiatePayment(
                        @PathVariable UUID orderId,
                        @RequestBody InitiatePaymentRequest request) {

                ServiceOrder order = getOrder(orderId);
                validateOwnership(order);

                if (order.getStatus() != OsStatus.COMPLETED) {
                        throw new BusinessException(ErrorCode.INVALID_OPERATION,
                                        "Só é possível pagar serviços concluídos");
                }

                if (order.getFinalPrice() == null || order.getFinalPrice().compareTo(BigDecimal.ZERO) <= 0) {
                        throw new BusinessException(ErrorCode.INVALID_OPERATION,
                                        "Valor do serviço não foi definido");
                }

                // Criar PaymentIntent no Stripe
                // Em produção, usar stripeGateway.createPaymentIntent()
                String clientSecret = "pi_secret_" + UUID.randomUUID().toString();

                return ResponseEntity.ok(new PaymentIntentResponse(
                                clientSecret,
                                order.getFinalPrice(),
                                "brl"));
        }

        /**
         * Confirma pagamento após sucesso no frontend.
         */
        @PostMapping("/orders/{orderId}/confirm-payment")
        @RequiresClientApp
        @Operation(summary = "Confirmar Pagamento", description = "Confirma pagamento após processamento")
        public ResponseEntity<PaymentConfirmationResponse> confirmPayment(
                        @PathVariable UUID orderId,
                        @RequestBody ConfirmPaymentRequest request) {

                ServiceOrder order = getOrder(orderId);
                validateOwnership(order);

                // Aqui seria verificado o pagamento no Stripe
                // e atualizado o status da OS para "PAID"

                // Por enquanto, apenas retornar sucesso
                return ResponseEntity.ok(new PaymentConfirmationResponse(
                                true,
                                "Pagamento confirmado com sucesso",
                                request.paymentIntentId(),
                                order.getFinalPrice()));
        }

        /**
         * Lista histórico de pagamentos do cliente.
         */
        @GetMapping("/payments")
        @RequiresClientApp
        @Operation(summary = "Histórico de Pagamentos", description = "Lista pagamentos realizados")
        public ResponseEntity<List<PaymentHistoryResponse>> getPaymentHistory() {
                Customer customer = getCurrentCustomer();

                // Buscar OS pagas do cliente
                List<ServiceOrder> paidOrders = orderRepository.findByCustomerId(customer.getId())
                                .stream()
                                .filter(o -> o.getFinalPrice() != null
                                                && o.getFinalPrice().compareTo(BigDecimal.ZERO) > 0)
                                .collect(Collectors.toList());

                List<PaymentHistoryResponse> payments = paidOrders.stream()
                                .map(o -> new PaymentHistoryResponse(
                                                UUID.randomUUID(), // paymentId
                                                o.getId(),
                                                o.getOsNumber(),
                                                o.getTitle(),
                                                o.getFinalPrice(),
                                                "PAID",
                                                o.getActualEnd() != null ? o.getActualEnd().toString() : null,
                                                "Visa •••• 4242"))
                                .collect(Collectors.toList());

                return ResponseEntity.ok(payments);
        }

        /**
         * Adiciona novo método de pagamento.
         */
        @PostMapping("/payment-methods")
        @RequiresClientApp
        @Operation(summary = "Adicionar Cartão", description = "Adiciona método de pagamento via Stripe")
        public ResponseEntity<PaymentMethodResponse> addPaymentMethod(
                        @RequestBody AddPaymentMethodRequest request) {

                Customer customer = getCurrentCustomer();

                // Aqui seria criado/anexado o payment method no Stripe
                // stripeGateway.attachPaymentMethod(customerId, request.paymentMethodId())

                return ResponseEntity.ok(new PaymentMethodResponse(
                                UUID.randomUUID(),
                                "card",
                                request.last4(),
                                request.brand(),
                                request.expiresAt(),
                                false));
        }

        /**
         * Lista métodos de pagamento salvos.
         */
        @GetMapping("/payment-methods")
        @RequiresClientApp
        @Operation(summary = "Listar Cartões", description = "Lista métodos de pagamento salvos")
        public ResponseEntity<List<PaymentMethodResponse>> listPaymentMethods() {
                Customer customer = getCurrentCustomer();

                // Em produção, buscar do Stripe
                // List<PaymentMethod> methods =
                // stripeGateway.listPaymentMethods(customer.getStripeCustomerId());

                // Stub: retornar lista vazia ou dados mockados
                List<PaymentMethodResponse> methods = List.of(
                                new PaymentMethodResponse(
                                                UUID.randomUUID(),
                                                "card",
                                                "4242",
                                                "Visa",
                                                "12/24",
                                                true));

                return ResponseEntity.ok(methods);
        }

        // ========== Private Methods ==========

        private Customer getCurrentCustomer() {
                JwtUserDetails user = currentUserProvider.requireCurrentUser();
                return customerRepository.findByUserIdWithAddresses(user.getUserId())
                                .orElseThrow(() -> new BusinessException(
                                                ErrorCode.USER_NOT_FOUND, "Perfil de cliente não encontrado"));
        }

        private ServiceOrder getOrder(UUID orderId) {
                return orderRepository.findById(orderId)
                                .orElseThrow(() -> new BusinessException(
                                                ErrorCode.ORDER_NOT_FOUND, "OS não encontrada"));
        }

        private void validateOwnership(ServiceOrder order) {
                Customer customer = getCurrentCustomer();
                if (!customer.getId().equals(order.getCustomerId())) {
                        throw new BusinessException(
                                        ErrorCode.ACCESS_DENIED, "Esta OS não pertence a você");
                }
        }

        private AddressResponse toAddressResponse(CustomerAddress address) {
                return new AddressResponse(
                                address.getId(),
                                address.getLabel(),
                                address.getStreet(),
                                address.getCity(),
                                address.getState(),
                                address.getPostalCode(),
                                address.getIsDefault(),
                                address.getLocation() != null ? GeoUtils.getLatitude(address.getLocation()) : null,
                                address.getLocation() != null ? GeoUtils.getLongitude(address.getLocation()) : null);
        }

        private CustomerOrderResponse toCustomerOrder(ServiceOrder order) {
                return new CustomerOrderResponse(
                                order.getId(),
                                order.getOsNumber(),
                                order.getTitle(),
                                order.getCategory().getCode(),
                                order.getStatus().getValue(),
                                order.getScheduledDate() != null ? order.getScheduledDate().toString() : "",
                                order.getScheduledStart() != null ? order.getScheduledStart().toString() : "09:00",
                                order.getEstimatedPrice(),
                                order.getFinalPrice());
        }

        private CustomerOrderDetailResponse toCustomerOrderDetail(ServiceOrder order) {
                return new CustomerOrderDetailResponse(
                                order.getId(),
                                order.getOsNumber(),
                                order.getTitle(),
                                order.getDescription(),
                                order.getCategory().getCode(),
                                order.getStatus().getValue(),
                                order.getScheduledDate() != null ? order.getScheduledDate().toString() : "",
                                order.getScheduledStart() != null ? order.getScheduledStart().toString() : "09:00",
                                order.getScheduledDuration() != null ? order.getScheduledDuration() : 60,
                                order.getEstimatedPrice(),
                                order.getFinalPrice(),
                                order.getAddress() != null ? toAddressResponse(order.getAddress()) : null,
                                order.getTechnician() != null ? new TechnicianInfo(
                                                order.getTechnician().getUser().getName(),
                                                order.getTechnician().getUser().getAvatarUrl(),
                                                order.getTechnician().getRating() != null
                                                                ? order.getTechnician().getRating().doubleValue()
                                                                : 5.0)
                                                : null);
        }

        // ========== Response DTOs ==========

        public record CustomerProfileResponse(
                        UUID id,
                        String name,
                        String email,
                        String phone,
                        String avatarUrl,
                        String companyName,
                        List<AddressResponse> addresses) {
        }

        public record AddAddressRequest(
                        String label,
                        String street,
                        String city,
                        String state,
                        String postalCode,
                        String country,
                        Boolean isDefault,
                        Double latitude,
                        Double longitude) {
        }

        public record ClaimOrderRequest(String token) {
        }

        /**
         * Associar-se a uma empresa por link de convite (token) ou por tenantId (ex: "Tornar-me cliente").
         */
        @PostMapping("/join")
        @RequiresClientApp
        @Operation(summary = "Join company", description = "Associate as client with a company by invite token or tenant ID")
        public ResponseEntity<JoinCompanyResponse> joinCompany(@RequestBody JoinCompanyRequest request) {
                JwtUserDetails user = currentUserProvider.requireCurrentUser();
                UUID userId = user.getUserId();
                if (userId == null) {
                        throw new BusinessException(ErrorCode.USER_NOT_FOUND, "Sessão inválida");
                }
                String companyName;
                if (request.token() != null && !request.token().isBlank()) {
                        try {
                                companyName = customerJoinService.joinByToken(userId, UUID.fromString(request.token().trim()));
                        } catch (IllegalArgumentException e) {
                                throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Link inválido ou expirado");
                        }
                } else if (request.tenantId() != null && !request.tenantId().isBlank()) {
                        try {
                                companyName = customerJoinService.joinByTenantId(userId, UUID.fromString(request.tenantId().trim()));
                        } catch (IllegalArgumentException e) {
                                throw new BusinessException(ErrorCode.VALIDATION_ERROR, "ID da empresa inválido");
                        }
                } else {
                        throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Forneça token ou tenantId");
                }
                return ResponseEntity.ok(new JoinCompanyResponse(companyName));
        }

        public record JoinCompanyRequest(String token, String tenantId) {}

        public record JoinCompanyResponse(String companyName) {}

        public record AddressResponse(
                        UUID id,
                        String label,
                        String street,
                        String city,
                        String state,
                        String postalCode,
                        boolean isDefault,
                        Double latitude,
                        Double longitude) {
        }

        public record CustomerOrderResponse(
                        UUID id,
                        String osNumber,
                        String title,
                        String category,
                        String status,
                        String scheduledDate,
                        String scheduledStart,
                        BigDecimal estimatedPrice,
                        BigDecimal finalPrice) {
        }

        public record CustomerOrderDetailResponse(
                        UUID id,
                        String osNumber,
                        String title,
                        String description,
                        String category,
                        String status,
                        String scheduledDate,
                        String scheduledStart,
                        int durationMinutes,
                        BigDecimal estimatedPrice,
                        BigDecimal finalPrice,
                        AddressResponse address,
                        TechnicianInfo technician) {
        }

        public record TechnicianInfo(
                        String name,
                        String avatarUrl,
                        double rating) {
        }

        public record TrackingResponse(
                        UUID orderId,
                        boolean isTracking,
                        Double technicianLat,
                        Double technicianLng,
                        String technicianName,
                        Integer etaMinutes) {
        }

        // Payment DTOs
        public record InitiatePaymentRequest(String paymentMethodId) {
        }

        public record PaymentIntentResponse(
                        String clientSecret,
                        BigDecimal amount,
                        String currency) {
        }

        public record ConfirmPaymentRequest(String paymentIntentId) {
        }

        public record PaymentConfirmationResponse(
                        boolean success,
                        String message,
                        String transactionId,
                        BigDecimal amount) {
        }

        public record PaymentHistoryResponse(
                        UUID paymentId,
                        UUID orderId,
                        String orderNumber,
                        String serviceTitle,
                        BigDecimal amount,
                        String status,
                        String paidAt,
                        String paymentMethod) {
        }

        public record AddPaymentMethodRequest(
                        String paymentMethodId,
                        String last4,
                        String brand,
                        String expiresAt) {
        }

        public record PaymentMethodResponse(
                        UUID id,
                        String type,
                        String last4,
                        String brand,
                        String expiresAt,
                        boolean isDefault) {
        }

        // Service Request DTOs
        public record CreateServiceRequestDTO(
                        String category,
                        String description,
                        String addressId, // String para aceitar IDs mockados do frontend
                        String preferredDate,
                        String preferredTime,
                        String tenantId) { // ID da empresa selecionada no marketplace
        }

        public record ServiceRequestResponse(
                        UUID id,
                        String osNumber,
                        String category,
                        String status,
                        String scheduledDate,
                        String scheduledTime,
                        BigDecimal estimatedPrice,
                        String createdAt) {
        }
}
