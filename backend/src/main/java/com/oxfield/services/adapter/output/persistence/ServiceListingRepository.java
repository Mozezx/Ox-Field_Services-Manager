package com.oxfield.services.adapter.output.persistence;

import com.oxfield.services.domain.entity.ServiceListing;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ServiceListingRepository extends JpaRepository<ServiceListing, UUID> {

    List<ServiceListing> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    List<ServiceListing> findByTenantIdAndActiveOrderByCreatedAtDesc(UUID tenantId, boolean active);

    Optional<ServiceListing> findByIdAndTenantId(UUID id, UUID tenantId);

    /** Public marketplace: native query to avoid tenant filter. */
    @Query(value = "SELECT sl.id AS \"listingId\", sl.tenant_id AS \"tenantId\", sl.category_id AS \"categoryId\", " +
            "sl.title, sl.description, sl.price_from AS \"priceFrom\", sl.image_url AS \"imageUrl\", " +
            "c.name AS \"categoryName\", c.code AS \"categoryCode\", " +
            "t.name AS \"companyName\", t.logo_url AS \"logoUrl\", " +
            "COALESCE(t.average_rating, 5.0) AS rating, COALESCE(t.total_reviews, 0) AS \"totalReviews\" " +
            "FROM service_listings sl " +
            "JOIN service_categories c ON c.id = sl.category_id " +
            "JOIN tenants t ON t.id = sl.tenant_id " +
            "WHERE sl.active = true AND t.status = 'ACTIVE' " +
            "AND (:categoryCode IS NULL OR :categoryCode = '' OR LOWER(c.code) = LOWER(CAST(:categoryCode AS text))) " +
            "AND (:search IS NULL OR :search = '' OR LOWER(sl.title) LIKE LOWER('%' || COALESCE(:search, '') || '%') OR LOWER(COALESCE(sl.description, '')) LIKE LOWER('%' || COALESCE(:search, '') || '%'))",
            countQuery = "SELECT COUNT(sl.id) FROM service_listings sl JOIN service_categories c ON c.id = sl.category_id JOIN tenants t ON t.id = sl.tenant_id " +
                    "WHERE sl.active = true AND t.status = 'ACTIVE' " +
                    "AND (:categoryCode IS NULL OR :categoryCode = '' OR LOWER(c.code) = LOWER(CAST(:categoryCode AS text))) " +
                    "AND (:search IS NULL OR :search = '' OR LOWER(sl.title) LIKE LOWER('%' || COALESCE(:search, '') || '%') OR LOWER(COALESCE(sl.description, '')) LIKE LOWER('%' || COALESCE(:search, '') || '%'))",
            nativeQuery = true)
    Page<PublicListingProjection> findActiveListingsPublic(
            @Param("categoryCode") String categoryCode,
            @Param("search") String search,
            Pageable pageable);

    @Query(value = "SELECT sl.id AS \"listingId\", sl.tenant_id AS \"tenantId\", sl.category_id AS \"categoryId\", " +
            "sl.title, sl.description, sl.price_from AS \"priceFrom\", sl.image_url AS \"imageUrl\", " +
            "c.name AS \"categoryName\", c.code AS \"categoryCode\", " +
            "t.name AS \"companyName\", t.logo_url AS \"logoUrl\", " +
            "COALESCE(t.average_rating, 5.0) AS rating, COALESCE(t.total_reviews, 0) AS \"totalReviews\" " +
            "FROM service_listings sl " +
            "JOIN service_categories c ON c.id = sl.category_id " +
            "JOIN tenants t ON t.id = sl.tenant_id " +
            "WHERE sl.active = true AND t.status = 'ACTIVE' AND sl.tenant_id = CAST(:tenantId AS uuid) " +
            "AND (:categoryCode IS NULL OR :categoryCode = '' OR LOWER(c.code) = LOWER(CAST(:categoryCode AS text))) " +
            "AND (:search IS NULL OR :search = '' OR LOWER(sl.title) LIKE LOWER('%' || COALESCE(:search, '') || '%') OR LOWER(COALESCE(sl.description, '')) LIKE LOWER('%' || COALESCE(:search, '') || '%'))",
            countQuery = "SELECT COUNT(sl.id) FROM service_listings sl JOIN service_categories c ON c.id = sl.category_id JOIN tenants t ON t.id = sl.tenant_id " +
                    "WHERE sl.active = true AND t.status = 'ACTIVE' AND sl.tenant_id = CAST(:tenantId AS uuid) " +
                    "AND (:categoryCode IS NULL OR :categoryCode = '' OR LOWER(c.code) = LOWER(CAST(:categoryCode AS text))) " +
                    "AND (:search IS NULL OR :search = '' OR LOWER(sl.title) LIKE LOWER('%' || COALESCE(:search, '') || '%') OR LOWER(COALESCE(sl.description, '')) LIKE LOWER('%' || COALESCE(:search, '') || '%'))",
            nativeQuery = true)
    Page<PublicListingProjection> findActiveListingsPublicByTenant(
            @Param("tenantId") UUID tenantId,
            @Param("categoryCode") String categoryCode,
            @Param("search") String search,
            Pageable pageable);

    /** Distinct category codes that have at least one active listing. */
    @Query(value = "SELECT DISTINCT c.code, c.name FROM service_listings sl " +
            "JOIN service_categories c ON c.id = sl.category_id " +
            "JOIN tenants t ON t.id = sl.tenant_id " +
            "WHERE sl.active = true AND t.status = 'ACTIVE' ORDER BY c.name", nativeQuery = true)
    List<Object[]> findDistinctCategoryCodesWithActiveListings();

    interface PublicListingProjection {
        UUID getListingId();
        UUID getTenantId();
        UUID getCategoryId();
        String getTitle();
        String getDescription();
        BigDecimal getPriceFrom();
        String getImageUrl();
        String getCategoryName();
        String getCategoryCode();
        String getCompanyName();
        String getLogoUrl();
        Double getRating();
        Integer getTotalReviews();
    }
}
