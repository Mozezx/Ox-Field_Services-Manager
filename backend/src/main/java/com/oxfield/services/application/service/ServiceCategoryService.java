package com.oxfield.services.application.service;

import com.oxfield.services.adapter.output.persistence.ServiceCategoryRepository;
import com.oxfield.services.adapter.output.persistence.ServiceOrderRepository;
import com.oxfield.services.domain.entity.ServiceCategory;
import com.oxfield.services.shared.exception.BusinessException;
import com.oxfield.services.shared.exception.ErrorCode;
import com.oxfield.services.shared.security.CurrentUserProvider;
import com.oxfield.services.shared.security.JwtUserDetails;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Serviço para CRUD de categorias de serviço por tenant.
 */
@Service
public class ServiceCategoryService {

    private static final Logger log = LoggerFactory.getLogger(ServiceCategoryService.class);

    private final ServiceCategoryRepository categoryRepository;
    private final ServiceOrderRepository orderRepository;
    private final CurrentUserProvider currentUserProvider;

    public ServiceCategoryService(
            ServiceCategoryRepository categoryRepository,
            ServiceOrderRepository orderRepository,
            CurrentUserProvider currentUserProvider) {
        this.categoryRepository = categoryRepository;
        this.orderRepository = orderRepository;
        this.currentUserProvider = currentUserProvider;
    }

    @Transactional(readOnly = true)
    public List<ServiceCategoryResponse> listByTenant() {
        UUID tenantId = currentUserProvider.requireCurrentUser().getTenantId();
        List<ServiceCategory> list = categoryRepository.findByTenantId(tenantId);
        return list.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ServiceCategoryResponse getById(UUID id) {
        UUID tenantId = currentUserProvider.requireCurrentUser().getTenantId();
        ServiceCategory cat = categoryRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND, "Categoria não encontrada"));
        return toResponse(cat);
    }

    @Transactional
    public ServiceCategoryResponse create(CreateServiceCategoryRequest request) {
        JwtUserDetails user = currentUserProvider.requireCurrentUser();
        UUID tenantId = user.getTenantId();

        String code = normalizeCode(request.code());
        if (categoryRepository.existsByTenantIdAndCode(tenantId, code)) {
            throw new BusinessException(ErrorCode.CATEGORY_CODE_EXISTS, "Já existe uma categoria com o código: " + code);
        }

        ServiceCategory category = new ServiceCategory();
        category.setTenantId(tenantId);
        category.setName(request.name());
        category.setCode(code);
        category.setDescription(request.description());
        category.setDefaultDurationMinutes(request.defaultDurationMinutes());
        category.setPriceMultiplier(request.priceMultiplier());

        category = categoryRepository.save(category);
        log.info("Category created: {} for tenant {}", category.getCode(), tenantId);
        return toResponse(category);
    }

    @Transactional
    public ServiceCategoryResponse update(UUID id, UpdateServiceCategoryRequest request) {
        UUID tenantId = currentUserProvider.requireCurrentUser().getTenantId();
        ServiceCategory category = categoryRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND, "Categoria não encontrada"));

        if (request.name() != null) category.setName(request.name());
        if (request.description() != null) category.setDescription(request.description());
        if (request.defaultDurationMinutes() != null) category.setDefaultDurationMinutes(request.defaultDurationMinutes());
        if (request.priceMultiplier() != null) category.setPriceMultiplier(request.priceMultiplier());
        if (request.code() != null) {
            String code = normalizeCode(request.code());
            if (!code.equals(category.getCode()) && categoryRepository.existsByTenantIdAndCode(tenantId, code)) {
                throw new BusinessException(ErrorCode.CATEGORY_CODE_EXISTS, "Já existe uma categoria com o código: " + code);
            }
            category.setCode(code);
        }

        category = categoryRepository.save(category);
        log.info("Category updated: {} for tenant {}", category.getCode(), tenantId);
        return toResponse(category);
    }

    @Transactional
    public void delete(UUID id) {
        UUID tenantId = currentUserProvider.requireCurrentUser().getTenantId();
        ServiceCategory category = categoryRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND, "Categoria não encontrada"));

        if (orderRepository.existsByCategoryId(id)) {
            throw new BusinessException(ErrorCode.CATEGORY_IN_USE, "Não é possível excluir categoria em uso por ordens de serviço.");
        }

        categoryRepository.delete(category);
        log.info("Category deleted: {} for tenant {}", category.getCode(), tenantId);
    }

    /**
     * Busca categoria por id e tenant (para uso interno por outros serviços).
     */
    @Transactional(readOnly = true)
    public ServiceCategory getByIdAndTenant(UUID categoryId, UUID tenantId) {
        return categoryRepository.findByIdAndTenantId(categoryId, tenantId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND, "Categoria não encontrada"));
    }

    /**
     * Busca categoria por code e tenant (para uso interno).
     */
    @Transactional(readOnly = true)
    public ServiceCategory getByCodeAndTenant(String code, UUID tenantId) {
        return categoryRepository.findByTenantIdAndCode(tenantId, normalizeCode(code))
                .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND, "Categoria não encontrada: " + code));
    }

    private static String normalizeCode(String code) {
        return code == null ? null : code.trim().toLowerCase().replaceAll("\\s+", "_");
    }

    private ServiceCategoryResponse toResponse(ServiceCategory c) {
        return new ServiceCategoryResponse(
                c.getId(),
                c.getName(),
                c.getCode(),
                c.getDescription(),
                c.getDefaultDurationMinutes(),
                c.getPriceMultiplier()
        );
    }

    public record ServiceCategoryResponse(
            UUID id,
            String name,
            String code,
            String description,
            Integer defaultDurationMinutes,
            java.math.BigDecimal priceMultiplier
    ) {}

    public record CreateServiceCategoryRequest(
            String name,
            String code,
            String description,
            Integer defaultDurationMinutes,
            java.math.BigDecimal priceMultiplier
    ) {}

    public record UpdateServiceCategoryRequest(
            String name,
            String code,
            String description,
            Integer defaultDurationMinutes,
            java.math.BigDecimal priceMultiplier
    ) {}
}
