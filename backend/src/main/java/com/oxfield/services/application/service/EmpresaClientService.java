package com.oxfield.services.application.service;

import com.oxfield.services.adapter.output.persistence.CustomerRepository;
import com.oxfield.services.domain.entity.Customer;
import com.oxfield.services.domain.entity.CustomerAddress;
import com.oxfield.services.shared.exception.BusinessException;
import com.oxfield.services.shared.exception.ErrorCode;
import com.oxfield.services.shared.security.CurrentUserProvider;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Serviço para listagem de clientes da empresa (tenant).
 */
@Service
public class EmpresaClientService {

    private final CustomerRepository customerRepository;
    private final CurrentUserProvider currentUserProvider;

    public EmpresaClientService(
            CustomerRepository customerRepository,
            CurrentUserProvider currentUserProvider) {
        this.customerRepository = customerRepository;
        this.currentUserProvider = currentUserProvider;
    }

    /**
     * Lista todos os clientes associados ao tenant do utilizador atual.
     * Executado dentro de uma transação read-only para evitar LazyInitializationException.
     */
    @Transactional(readOnly = true)
    public List<ClientListItemResponse> listClientsForCurrentTenant() {
        UUID tenantId = currentUserProvider.requireCurrentUser().getTenantId();
        if (tenantId == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                    "Session has no company. Log in again with a company account.");
        }
        List<Customer> customers = customerRepository.findCustomersByTenantId(tenantId, PageRequest.of(0, 500));
        return customers.stream()
                .map(c -> {
                    String name = c.getUser() != null ? c.getUser().getName() : null;
                    String email = c.getUser() != null ? c.getUser().getEmail() : null;
                    String phone = c.getUser() != null ? c.getUser().getPhone() : null;
                    CustomerAddress defaultAddr = c.getDefaultAddress();
                    String primaryAddress = defaultAddr != null ? defaultAddr.getFullAddress() : null;
                    return new ClientListItemResponse(
                            c.getId(),
                            name != null ? name : "",
                            email != null ? email : "",
                            phone,
                            c.getCompanyName(),
                            primaryAddress);
                })
                .collect(Collectors.toList());
    }

    public record ClientListItemResponse(
            UUID id,
            String name,
            String email,
            String phone,
            String companyName,
            String primaryAddress) {}
}
