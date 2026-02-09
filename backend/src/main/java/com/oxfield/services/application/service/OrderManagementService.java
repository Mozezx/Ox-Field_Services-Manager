package com.oxfield.services.application.service;

import com.oxfield.services.adapter.output.persistence.CustomerRepository;
import com.oxfield.services.adapter.output.persistence.ServiceOrderRepository;
import com.oxfield.services.adapter.output.persistence.TechnicianRepository;
import com.oxfield.services.adapter.output.persistence.TenantCustomerRepository;
import com.oxfield.services.domain.entity.Customer;
import com.oxfield.services.domain.entity.CustomerAddress;
import com.oxfield.services.domain.entity.ServiceCategory;
import com.oxfield.services.domain.entity.ServiceOrder;
import com.oxfield.services.domain.entity.Technician;
import com.oxfield.services.domain.enums.OsStatus;
import com.oxfield.services.domain.enums.PriorityLevel;
import com.oxfield.services.shared.exception.BusinessException;
import com.oxfield.services.shared.exception.ErrorCode;
import com.oxfield.services.shared.security.CurrentUserProvider;
import com.oxfield.services.shared.security.JwtUserDetails;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.PersistenceException;

import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Serviço para gestão de ordens de serviço.
 * Usado pelo dispatch console para criar, atribuir e gerenciar ordens.
 */
@Service
public class OrderManagementService {

    private static final Logger log = LoggerFactory.getLogger(OrderManagementService.class);

    private final ServiceOrderRepository orderRepository;
    private final TechnicianRepository technicianRepository;
    private final CustomerRepository customerRepository;
    private final TenantCustomerRepository tenantCustomerRepository;
    private final ServiceCategoryService categoryService;
    private final CurrentUserProvider currentUserProvider;

    public OrderManagementService(
            ServiceOrderRepository orderRepository,
            TechnicianRepository technicianRepository,
            CustomerRepository customerRepository,
            TenantCustomerRepository tenantCustomerRepository,
            ServiceCategoryService categoryService,
            CurrentUserProvider currentUserProvider) {
        this.orderRepository = orderRepository;
        this.technicianRepository = technicianRepository;
        this.customerRepository = customerRepository;
        this.tenantCustomerRepository = tenantCustomerRepository;
        this.categoryService = categoryService;
        this.currentUserProvider = currentUserProvider;
    }

    /**
     * Lista ordens não atribuídas a nenhum técnico.
     */
    @Transactional(readOnly = true)
    public List<OrderResponse> getUnassignedOrders() {
        log.info("Fetching unassigned orders");
        List<ServiceOrder> orders = orderRepository.findUnassignedOrders();
        return orders.stream()
                .map(this::toOrderResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lista ordens de uma data específica.
     */
    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByDate(LocalDate date) {
        log.info("Fetching orders for date: {}", date);
        List<ServiceOrder> orders = orderRepository.findByScheduledDateWithDetails(date);
        return orders.stream()
                .map(this::toOrderResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lista ordens de um técnico em uma data específica.
     */
    @Transactional(readOnly = true)
    public List<OrderResponse> getTechnicianSchedule(UUID technicianId, LocalDate date) {
        log.info("Fetching schedule for technician {} on {}", technicianId, date);
        List<ServiceOrder> orders = orderRepository.findByTechnicianIdAndScheduledDate(technicianId, date);
        return orders.stream()
                .map(this::toOrderResponse)
                .collect(Collectors.toList());
    }

    /**
     * Obtém detalhes de uma ordem.
     */
    @Transactional(readOnly = true)
    public OrderResponse getOrder(UUID orderId) {
        log.info("Fetching order: {}", orderId);
        ServiceOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.ORDER_NOT_FOUND,
                        "Ordem não encontrada"));
        return toOrderResponse(order);
    }

    /**
     * Cria uma nova ordem de serviço.
     */
    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {
        log.info("Creating order: {}", request.title());
        try {
            JwtUserDetails user = currentUserProvider.requireCurrentUser();
            UUID tenantId = user.getTenantId();

            // Resolver cliente: por customerId se fornecido, senão primeiro do tenant
            Customer customer;
            if (request.customerId() != null && !request.customerId().isBlank()) {
                UUID customerId;
                try {
                    customerId = UUID.fromString(request.customerId().trim());
                } catch (IllegalArgumentException e) {
                    throw new BusinessException(
                            ErrorCode.VALIDATION_ERROR,
                            "ID de cliente inválido.");
                }
                if (!tenantCustomerRepository.existsByTenantIdAndCustomerId(tenantId, customerId)) {
                    throw new BusinessException(
                            ErrorCode.VALIDATION_ERROR,
                            "Cliente não pertence à empresa.");
                }
                customer = customerRepository.findByIdWithAddressesAndUser(customerId)
                        .orElseThrow(() -> new BusinessException(
                                ErrorCode.VALIDATION_ERROR,
                                "Cliente não encontrado."));
                log.debug("Create order using selected customerId: {}", customerId);
            } else {
                customer = findCustomerForOrder(tenantId);
                log.debug("Create order using fallback customer (no customerId in request): {}", customer.getId());
            }
            CustomerAddress orderAddress = ensureCustomerHasAddress(customer, request.customerAddress());
            customer = customerRepository.save(customer);

            // Gerar número da OS
            Long nextSequence = orderRepository.getNextOsSequence(user.getTenantId());
            String osNumber = ServiceOrder.generateOsNumber(nextSequence);

            // Criar a ordem (address_id é NOT NULL)
            ServiceOrder order = new ServiceOrder();
            order.setTenantId(user.getTenantId());
            order.setOsNumber(osNumber);
            order.setTitle(request.title());
            order.setDescription(request.description());
            ServiceCategory category = categoryService.getByIdAndTenant(UUID.fromString(request.categoryId()), user.getTenantId());
            order.setCategory(category);
            order.setPriority(parsePriority(request.priority()));
            order.setCustomer(customer);
            order.setAddress(orderAddress);
            LocalDate scheduledDate;
            LocalTime scheduledStart;
            try {
                scheduledDate = LocalDate.parse(request.scheduledDate());
                scheduledStart = LocalTime.parse(request.scheduledStartTime());
            } catch (DateTimeException e) {
                throw new BusinessException(
                        ErrorCode.VALIDATION_ERROR,
                        "Formato de data ou hora inválido. Use AAAA-MM-DD e HH:mm.");
            }
            order.setScheduledDate(scheduledDate);
            order.setScheduledStart(scheduledStart);
            order.setScheduledDuration(request.estimatedDuration());
            order.setStatus(OsStatus.SCHEDULED);
            order.setShareToken(UUID.randomUUID());

            // Atribuir técnico se informado
            if (request.technicianId() != null && !request.technicianId().isEmpty()) {
                Technician technician = technicianRepository.findById(UUID.fromString(request.technicianId()))
                        .orElseThrow(() -> new BusinessException(
                                ErrorCode.TECH_NOT_FOUND,
                                "Técnico não encontrado"));
                order.setTechnician(technician);
            }

            try {
                order = orderRepository.save(order);
            } catch (PersistenceException e) {
                if (isLikelyMissingColumn(e)) {
                    log.warn("Persistence error (likely missing migration): {}", e.getMessage());
                    throw new BusinessException(
                            ErrorCode.INTERNAL_ERROR,
                            "Falha ao criar ordem. A migração da base de dados (share_token) pode não ter sido aplicada. Reinicie o backend para executar as migrações Flyway.");
                }
                throw e;
            }
            log.info("Order created: {}", order.getOsNumber());

            return toOrderResponse(order);
        } catch (Exception e) {
            log.error("createOrder failed", e);
            throw e;
        }
    }

    /**
     * Atribui um técnico a uma ordem.
     * Suporta reatribuição: se a ordem já tiver técnico, o novo técnico sobrescreve.
     */
    @Transactional
    public OrderResponse assignTechnician(UUID orderId, UUID technicianId) {
        log.info("Assigning technician {} to order {}", technicianId, orderId);
        
        ServiceOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.ORDER_NOT_FOUND,
                        "Ordem não encontrada"));
        
        Technician technician = technicianRepository.findById(technicianId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.TECH_NOT_FOUND,
                        "Técnico não encontrado"));
        
        order.setTechnician(technician);
        order = orderRepository.save(order);
        
        log.info("Technician {} assigned to order {}", technician.getUser().getName(), order.getOsNumber());
        
        return toOrderResponse(order);
    }

    /**
     * Reagenda uma ordem para nova data/horário.
     */
    @Transactional
    public OrderResponse rescheduleOrder(UUID orderId, LocalDate newDate, LocalTime newTime) {
        log.info("Rescheduling order {} to {} at {}", orderId, newDate, newTime);
        
        ServiceOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.ORDER_NOT_FOUND,
                        "Ordem não encontrada"));
        
        if (order.getStatus().isFinal()) {
            throw new BusinessException(
                    ErrorCode.INVALID_OPERATION,
                    "Não é possível reagendar uma ordem finalizada");
        }
        
        order.setScheduledDate(newDate);
        order.setScheduledStart(newTime);
        order = orderRepository.save(order);
        
        log.info("Order {} rescheduled to {} at {}", order.getOsNumber(), newDate, newTime);
        
        return toOrderResponse(order);
    }

    /**
     * Atribui técnico e agenda em um só passo (usado no drag-and-drop).
     * Suporta reatribuição: a ordem pode já estar atribuída a outro técnico.
     */
    @Transactional
    public OrderResponse assignAndSchedule(UUID orderId, UUID technicianId, LocalDate date, LocalTime startTime) {
        log.info("Assigning and scheduling order {} to technician {} at {} {}", orderId, technicianId, date, startTime);
        
        ServiceOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.ORDER_NOT_FOUND,
                        "Ordem não encontrada"));
        
        Technician technician = technicianRepository.findById(technicianId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.TECH_NOT_FOUND,
                        "Técnico não encontrado"));
        
        order.setTechnician(technician);
        order.setScheduledDate(date);
        order.setScheduledStart(startTime);
        order = orderRepository.save(order);
        
        log.info("Order {} assigned to {} and scheduled for {} at {}", 
                order.getOsNumber(), technician.getUser().getName(), date, startTime);
        
        return toOrderResponse(order);
    }

    /**
     * Remove a atribuição de técnico de uma ordem, devolvendo-a ao pool de ordens não atribuídas.
     * Apenas ordens com status SCHEDULED podem ser desatribuídas.
     */
    @Transactional
    public OrderResponse unassignOrder(UUID orderId) {
        log.info("Unassigning order {}", orderId);

        ServiceOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.ORDER_NOT_FOUND,
                        "Ordem não encontrada"));

        if (order.getStatus() != OsStatus.SCHEDULED) {
            throw new BusinessException(
                    ErrorCode.INVALID_OPERATION,
                    "Apenas ordens agendadas podem ser desatribuídas");
        }

        order.setTechnician(null);
        order = orderRepository.save(order);

        log.info("Order {} unassigned and moved to unassigned pool", order.getOsNumber());

        return toOrderResponse(order);
    }

    // ========== Private Methods ==========

    /**
     * Busca um cliente existente para vincular à ordem (Customer exige user_id, não criamos novo aqui).
     * Carrega addresses e user eager para evitar LazyInitializationException.
     */
    private Customer findCustomerForOrder(UUID tenantId) {
        List<Customer> tenantCustomers = customerRepository.findCustomersByTenantId(tenantId, PageRequest.of(0, 1));
        if (!tenantCustomers.isEmpty()) {
            return tenantCustomers.get(0);
        }
        List<Customer> existing = customerRepository.findFirstWithAddressesAndUser(PageRequest.of(0, 1));
        if (existing.isEmpty()) {
            throw new BusinessException(
                    ErrorCode.INVALID_OPERATION,
                    "Nenhum cliente cadastrado. Cadastre um cliente antes de criar ordens.");
        }
        return existing.get(0);
    }

    /**
     * Garante que o cliente tenha pelo menos um endereço (service_orders.address_id é NOT NULL).
     * Retorna o endereço a ser usado na ordem (existente ou recém-criado).
     */
    private CustomerAddress ensureCustomerHasAddress(Customer customer, String requestAddress) {
        if (customer.getAddresses() != null && !customer.getAddresses().isEmpty()) {
            CustomerAddress existing = customer.getDefaultAddress();
            return existing != null ? existing : customer.getAddresses().get(0);
        }
        CustomerAddress addr = new CustomerAddress();
        addr.setLabel("Main");
        addr.setStreet(requestAddress != null && !requestAddress.isBlank() ? requestAddress : "Address not specified");
        addr.setCity("City");
        addr.setState("State");
        addr.setPostalCode("00000");
        addr.setIsDefault(true);
        customer.addAddress(addr);
        return addr;
    }

    private PriorityLevel parsePriority(String priority) {
        if (priority == null) return PriorityLevel.MEDIUM;
        try {
            return PriorityLevel.valueOf(priority.toUpperCase());
        } catch (IllegalArgumentException e) {
            return PriorityLevel.MEDIUM;
        }
    }

    private boolean isLikelyMissingColumn(Throwable t) {
        for (Throwable x = t; x != null; x = x.getCause()) {
            String msg = x.getMessage();
            if (msg == null) continue;
            String lower = msg.toLowerCase();
            if (msg.contains("share_token")
                    || (msg.contains("column") && lower.contains("does not exist"))
                    || (msg.contains("relation") && lower.contains("does not exist"))
                    || lower.contains("syntax error")) {
                return true;
            }
        }
        return false;
    }

    private OrderResponse toOrderResponse(ServiceOrder order) {
        ServiceCategory cat = order.getCategory();
        CategoryInfo categoryInfo = cat != null ? new CategoryInfo(cat.getId(), cat.getName(), cat.getCode()) : null;
        String customerName = null;
        String addressLine = "";
        if (order.getCustomer() != null) {
            var c = order.getCustomer();
            customerName = c.getCompanyName() != null ? c.getCompanyName() : (c.getUser() != null ? c.getUser().getName() : null);
            if (order.getAddress() != null) {
                try {
                    addressLine = order.getAddress().getFullAddress();
                    if (addressLine == null) addressLine = "";
                } catch (Exception e) {
                    log.debug("getFullAddress failed, using fallback", e);
                    addressLine = "";
                }
            }
        }
        CustomerInfo customerInfo = order.getCustomer() != null
                ? new CustomerInfo(order.getCustomer().getId(), customerName != null ? customerName : "", addressLine)
                : null;
        TechnicianInfo technicianInfo = null;
        if (order.getTechnician() != null) {
            var t = order.getTechnician();
            String techName = t.getUser() != null ? t.getUser().getName() : null;
            String techAvatar = t.getUser() != null ? t.getUser().getAvatarUrl() : null;
            technicianInfo = new TechnicianInfo(t.getId(), techName != null ? techName : "", techAvatar);
        }
        return new OrderResponse(
                order.getId(),
                order.getOsNumber(),
                order.getTitle(),
                order.getDescription(),
                categoryInfo,
                order.getStatus().getValue(),
                order.getPriority().getValue(),
                order.getScheduledDate() != null ? order.getScheduledDate().toString() : "",
                order.getScheduledStart() != null ? order.getScheduledStart().toString() : "",
                order.getScheduledDuration(),
                customerInfo,
                technicianInfo,
                order.getShareToken()
        );
    }

    // ========== DTOs ==========

    public record CreateOrderRequest(
            String title,
            String description,
            String categoryId,
            String priority,
            String customerId,
            String customerName,
            String customerAddress,
            String scheduledDate,
            String scheduledStartTime,
            int estimatedDuration,
            String technicianId
    ) {}

    public record OrderResponse(
            UUID id,
            String orderNumber,
            String title,
            String description,
            CategoryInfo category,
            String status,
            String priority,
            String scheduledDate,
            String scheduledStartTime,
            int estimatedDuration,
            CustomerInfo customer,
            TechnicianInfo technician,
            UUID shareToken
    ) {}

    public record CategoryInfo(
            UUID id,
            String name,
            String code
    ) {}

    public record CustomerInfo(
            UUID id,
            String name,
            String address
    ) {}

    public record TechnicianInfo(
            UUID id,
            String name,
            String avatarUrl
    ) {}
}
