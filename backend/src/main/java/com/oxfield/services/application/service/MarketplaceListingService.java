package com.oxfield.services.application.service;

import com.oxfield.services.adapter.output.persistence.ServiceListingRepository;
import com.oxfield.services.adapter.output.persistence.ServiceListingRepository.PublicListingProjection;
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
 * Public marketplace: list service listings and categories (no tenant context).
 */
@Service
public class MarketplaceListingService {

    private static final Logger log = LoggerFactory.getLogger(MarketplaceListingService.class);

    private final ServiceListingRepository listingRepository;

    public MarketplaceListingService(ServiceListingRepository listingRepository) {
        this.listingRepository = listingRepository;
    }

    @Transactional(readOnly = true)
    public Page<PublicListingResponse> getListings(String categoryCode, UUID tenantId, String search, Pageable pageable) {
        Page<PublicListingProjection> page = tenantId != null
                ? listingRepository.findActiveListingsPublicByTenant(tenantId, categoryCode, search, pageable)
                : listingRepository.findActiveListingsPublic(categoryCode, search, pageable);

        return page.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public List<MarketplaceCategoryDto> getCategories() {
        List<Object[]> rows = listingRepository.findDistinctCategoryCodesWithActiveListings();
        return rows.stream()
                .map(row -> new MarketplaceCategoryDto((String) row[0], (String) row[1]))
                .toList();
    }

    private PublicListingResponse toResponse(PublicListingProjection p) {
        return new PublicListingResponse(
                p.getListingId(),
                p.getTenantId(),
                p.getCategoryId(),
                p.getTitle(),
                p.getDescription(),
                p.getPriceFrom(),
                p.getImageUrl(),
                p.getCategoryName(),
                p.getCategoryCode(),
                p.getCompanyName(),
                p.getLogoUrl(),
                p.getRating() != null ? p.getRating() : 5.0,
                p.getTotalReviews() != null ? p.getTotalReviews() : 0
        );
    }

    public record PublicListingResponse(
            UUID listingId,
            UUID tenantId,
            UUID categoryId,
            String title,
            String description,
            BigDecimal priceFrom,
            String imageUrl,
            String categoryName,
            String categoryCode,
            String companyName,
            String logoUrl,
            double rating,
            int totalReviews
    ) {}

    public record MarketplaceCategoryDto(String code, String name) {}
}
