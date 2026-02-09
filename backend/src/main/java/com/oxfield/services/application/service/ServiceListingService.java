package com.oxfield.services.application.service;

import com.oxfield.services.adapter.output.persistence.ServiceListingRepository;
import com.oxfield.services.domain.entity.ServiceCategory;
import com.oxfield.services.domain.entity.ServiceListing;
import com.oxfield.services.shared.exception.BusinessException;
import com.oxfield.services.shared.exception.ErrorCode;
import com.oxfield.services.shared.security.CurrentUserProvider;
import com.oxfield.services.shared.security.JwtUserDetails;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * CRUD for marketplace service listings (empresa scope).
 */
@Service
public class ServiceListingService {

    private static final Logger log = LoggerFactory.getLogger(ServiceListingService.class);

    private final ServiceListingRepository listingRepository;
    private final ServiceCategoryService categoryService;
    private final CurrentUserProvider currentUserProvider;

    public ServiceListingService(
            ServiceListingRepository listingRepository,
            ServiceCategoryService categoryService,
            CurrentUserProvider currentUserProvider) {
        this.listingRepository = listingRepository;
        this.categoryService = categoryService;
        this.currentUserProvider = currentUserProvider;
    }

    @Transactional(readOnly = true)
    public List<ListingResponse> listByTenant() {
        UUID tenantId = currentUserProvider.requireCurrentUser().getTenantId();
        List<ServiceListing> list = listingRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
        return list.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ListingResponse getById(UUID id) {
        UUID tenantId = currentUserProvider.requireCurrentUser().getTenantId();
        ServiceListing listing = listingRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND, "Listing not found"));
        return toResponse(listing);
    }

    @Transactional
    public ListingResponse create(CreateListingRequest request) {
        JwtUserDetails user = currentUserProvider.requireCurrentUser();
        UUID tenantId = user.getTenantId();

        ServiceCategory category = categoryService.getByIdAndTenant(request.categoryId(), tenantId);

        ServiceListing listing = new ServiceListing();
        listing.setTenantId(tenantId);
        listing.setCategory(category);
        listing.setTitle(request.title());
        listing.setDescription(request.description());
        listing.setPriceFrom(request.priceFrom() != null ? request.priceFrom() : null);
        listing.setImageUrl(request.imageUrl());
        listing.setActive(request.active() != null ? request.active() : true);

        listing = listingRepository.save(listing);
        log.info("Listing created: {} for tenant {}", listing.getId(), tenantId);
        return toResponse(listing);
    }

    @Transactional
    public ListingResponse update(UUID id, UpdateListingRequest request) {
        UUID tenantId = currentUserProvider.requireCurrentUser().getTenantId();
        ServiceListing listing = listingRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND, "Listing not found"));

        if (request.categoryId() != null) {
            ServiceCategory category = categoryService.getByIdAndTenant(request.categoryId(), tenantId);
            listing.setCategory(category);
        }
        if (request.title() != null) listing.setTitle(request.title());
        if (request.description() != null) listing.setDescription(request.description());
        if (request.priceFrom() != null) listing.setPriceFrom(request.priceFrom());
        if (request.imageUrl() != null) listing.setImageUrl(request.imageUrl());
        if (request.active() != null) listing.setActive(request.active());

        listing = listingRepository.save(listing);
        log.info("Listing updated: {} for tenant {}", listing.getId(), tenantId);
        return toResponse(listing);
    }

    @Transactional
    public void delete(UUID id) {
        UUID tenantId = currentUserProvider.requireCurrentUser().getTenantId();
        ServiceListing listing = listingRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND, "Listing not found"));
        listingRepository.delete(listing);
        log.info("Listing deleted: {} for tenant {}", id, tenantId);
    }

    private ListingResponse toResponse(ServiceListing l) {
        ServiceCategory c = l.getCategory();
        return new ListingResponse(
                l.getId(),
                l.getTenantId(),
                c != null ? c.getId() : null,
                c != null ? c.getName() : null,
                c != null ? c.getCode() : null,
                l.getTitle(),
                l.getDescription(),
                l.getPriceFrom(),
                l.getImageUrl(),
                l.isActive()
        );
    }

    public record ListingResponse(
            UUID id,
            UUID tenantId,
            UUID categoryId,
            String categoryName,
            String categoryCode,
            String title,
            String description,
            BigDecimal priceFrom,
            String imageUrl,
            boolean active
    ) {}

    public record CreateListingRequest(
            UUID categoryId,
            String title,
            String description,
            BigDecimal priceFrom,
            String imageUrl,
            Boolean active
    ) {}

    public record UpdateListingRequest(
            UUID categoryId,
            String title,
            String description,
            BigDecimal priceFrom,
            String imageUrl,
            Boolean active
    ) {}
}
