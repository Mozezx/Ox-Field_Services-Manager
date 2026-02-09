package com.oxfield.services.adapter.input.rest;

import com.oxfield.services.application.service.MarketplaceListingService;
import com.oxfield.services.application.service.MarketplaceListingService.MarketplaceCategoryDto;
import com.oxfield.services.application.service.MarketplaceListingService.PublicListingResponse;
import com.oxfield.services.application.service.MarketplaceService;
import com.oxfield.services.application.service.MarketplaceService.CompanySearchResult;
import com.oxfield.services.application.service.MarketplaceService.SearchRequest;
import com.oxfield.services.shared.util.GeoUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.locationtech.jts.geom.Point;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Controller de Marketplace.
 * Endpoints públicos para busca de empresas.
 */
@RestController
@RequestMapping("/marketplace")
@Tag(name = "Marketplace", description = "Endpoints do marketplace para busca de empresas")
public class MarketplaceController {

    private final MarketplaceService marketplaceService;
    private final MarketplaceListingService listingService;

    public MarketplaceController(MarketplaceService marketplaceService, MarketplaceListingService listingService) {
        this.marketplaceService = marketplaceService;
        this.listingService = listingService;
    }

    /**
     * Busca empresas disponíveis para um serviço.
     * Retorna lista ordenada pela proximidade do técnico mais próximo.
     */
    @GetMapping("/companies")
    @Operation(
            summary = "Buscar Empresas",
            description = "Busca empresas disponíveis para uma categoria de serviço, ordenadas pela proximidade do técnico mais próximo"
    )
    public ResponseEntity<List<CompanySearchResponse>> searchCompanies(
            @Parameter(description = "Código da categoria (ex: hvac, electrical, plumbing, general)")
            @RequestParam String category,

            @Parameter(description = "Latitude da localização do cliente")
            @RequestParam double latitude,

            @Parameter(description = "Longitude da localização do cliente")
            @RequestParam double longitude,

            @Parameter(description = "Data preferida para o serviço (formato: yyyy-MM-dd)")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        Point customerLocation = GeoUtils.createPoint(latitude, longitude);

        SearchRequest request = new SearchRequest(category != null ? category.trim().toLowerCase() : "general", customerLocation, date);
        List<CompanySearchResult> results = marketplaceService.searchCompanies(request);

        List<CompanySearchResponse> response = results.stream()
                .map(this::toResponse)
                .toList();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/listings")
    @Operation(summary = "List service listings", description = "List active marketplace listings with optional filters")
    public ResponseEntity<Page<PublicListingResponse>> getListings(
            @Parameter(description = "Filter by category code (e.g. hvac, electrical)")
            @RequestParam(required = false) String categoryCode,
            @Parameter(description = "Filter by tenant/company ID")
            @RequestParam(required = false) UUID tenantId,
            @Parameter(description = "Search in title and description")
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<PublicListingResponse> result = listingService.getListings(
                categoryCode,
                tenantId,
                search,
                PageRequest.of(page, Math.min(size, 100)));
        return ResponseEntity.ok(result);
    }

    @GetMapping("/categories")
    @Operation(summary = "List marketplace categories", description = "Distinct categories that have at least one active listing")
    public ResponseEntity<List<MarketplaceCategoryDto>> getCategories() {
        return ResponseEntity.ok(listingService.getCategories());
    }

    private CompanySearchResponse toResponse(CompanySearchResult result) {
        return new CompanySearchResponse(
                result.tenantId().toString(),
                result.companyName(),
                result.logoUrl(),
                result.rating(),
                result.totalReviews(),
                result.nearestTechnicianDistanceKm(),
                result.estimatedArrivalMinutes(),
                result.hasAvailability()
        );
    }

    // ========== Response DTOs ==========

    public record CompanySearchResponse(
            String tenantId,
            String companyName,
            String logoUrl,
            double rating,
            int totalReviews,
            double nearestTechnicianDistanceKm,
            int estimatedArrivalMinutes,
            boolean hasAvailability
    ) {}
}
