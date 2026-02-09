package com.oxfield.services.application.service;

import com.oxfield.services.adapter.output.persistence.ClientInviteRepository;
import com.oxfield.services.adapter.output.persistence.CustomerRepository;
import com.oxfield.services.adapter.output.persistence.TenantCustomerRepository;
import com.oxfield.services.adapter.output.persistence.TenantRepository;
import com.oxfield.services.adapter.output.persistence.UserRepository;
import com.oxfield.services.domain.entity.ClientInvite;
import com.oxfield.services.domain.entity.Customer;
import com.oxfield.services.domain.entity.Tenant;
import com.oxfield.services.domain.entity.TenantCustomer;
import com.oxfield.services.domain.entity.User;
import com.oxfield.services.domain.enums.InviteStatus;
import com.oxfield.services.shared.exception.BusinessException;
import com.oxfield.services.shared.exception.ErrorCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Service for a customer to join a company (by invite token or by tenantId).
 */
@Service
public class CustomerJoinService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final ClientInviteRepository clientInviteRepository;
    private final TenantCustomerRepository tenantCustomerRepository;
    private final TenantRepository tenantRepository;

    public CustomerJoinService(UserRepository userRepository,
                              CustomerRepository customerRepository,
                              ClientInviteRepository clientInviteRepository,
                              TenantCustomerRepository tenantCustomerRepository,
                              TenantRepository tenantRepository) {
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.clientInviteRepository = clientInviteRepository;
        this.tenantCustomerRepository = tenantCustomerRepository;
        this.tenantRepository = tenantRepository;
    }

    /**
     * Find or create Customer for the given user id.
     */
    @Transactional
    public Customer findOrCreateCustomerForUser(UUID userId) {
        return customerRepository.findByUserIdWithAddresses(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, "Utilizador não encontrado"));
                    Customer customer = new Customer(user);
                    return customerRepository.save(customer);
                });
    }

    /**
     * Join by invite token. Associates the current customer with the invite's tenant and marks invite USED.
     */
    @Transactional
    public String joinByToken(UUID userId, UUID token) {
        Customer customer = findOrCreateCustomerForUser(userId);
        ClientInvite invite = clientInviteRepository.findByToken(token)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Link inválido ou expirado"));
        if (invite.getStatus() != InviteStatus.PENDING) {
            throw new BusinessException(ErrorCode.INVALID_OPERATION, "Link já utilizado ou inválido");
        }
        UUID tenantId = invite.getTenantId();
        if (!tenantCustomerRepository.existsByTenantIdAndCustomerId(tenantId, customer.getId())) {
            tenantCustomerRepository.save(new TenantCustomer(tenantId, customer.getId()));
        }
        invite.markAsUsed(customer.getId());
        clientInviteRepository.save(invite);

        return tenantRepository.findById(tenantId)
                .map(Tenant::getName)
                .orElse("Empresa");
    }

    /**
     * Join by tenant id (e.g. "Tornar-me cliente" from app). Idempotent.
     */
    @Transactional
    public String joinByTenantId(UUID userId, UUID tenantId) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new BusinessException(ErrorCode.TENANT_NOT_FOUND, "Empresa não encontrada"));
        if (!tenant.isActive()) {
            throw new BusinessException(ErrorCode.INVALID_OPERATION, "Empresa não está ativa");
        }
        Customer customer = findOrCreateCustomerForUser(userId);
        if (!tenantCustomerRepository.existsByTenantIdAndCustomerId(tenantId, customer.getId())) {
            tenantCustomerRepository.save(new TenantCustomer(tenantId, customer.getId()));
        }
        return tenant.getName();
    }
}
