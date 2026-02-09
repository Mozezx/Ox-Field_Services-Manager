package com.oxfield.services.application.service;

import com.oxfield.services.adapter.output.persistence.TechnicianRepository;
import com.oxfield.services.adapter.output.persistence.TenantRepository;
import com.oxfield.services.application.port.output.MapsPort;
import com.oxfield.services.domain.entity.Technician;
import com.oxfield.services.domain.entity.Tenant;
import com.oxfield.services.domain.enums.TenantStatus;
import com.oxfield.services.shared.util.GeoUtils;
import org.locationtech.jts.geom.Point;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Serviço de Marketplace.
 * 
 * Busca empresas disponíveis para um serviço específico,
 * ordenadas pela proximidade do técnico mais próximo.
 */
@Service
public class MarketplaceService {

    private static final Logger log = LoggerFactory.getLogger(MarketplaceService.class);

    @Value("${oxfield.marketplace.max-radius-km:100}")
    private double maxRadiusKm;

    private final TenantRepository tenantRepository;
    private final TechnicianRepository technicianRepository;
    private final MapsPort mapsPort;

    public MarketplaceService(
            TenantRepository tenantRepository,
            TechnicianRepository technicianRepository,
            MapsPort mapsPort) {
        this.tenantRepository = tenantRepository;
        this.technicianRepository = technicianRepository;
        this.mapsPort = mapsPort;
    }

    /**
     * Busca empresas disponíveis para uma categoria de serviço,
     * ordenadas pela proximidade do técnico mais próximo.
     */
    @Transactional(readOnly = true)
    public List<CompanySearchResult> searchCompanies(SearchRequest request) {
        log.info("Searching companies for category: {} at location: ({}, {})",
                request.categoryCode(),
                GeoUtils.getLatitude(request.customerLocation()),
                GeoUtils.getLongitude(request.customerLocation()));

        // 1. Buscar todos os tenants ativos
        List<Tenant> activeTenants = tenantRepository.findByStatus(TenantStatus.ACTIVE);
        
        if (activeTenants.isEmpty()) {
            log.warn("No active tenants found");
            return Collections.emptyList();
        }

        log.info("Found {} active tenants", activeTenants.size());

        // 2. Para cada tenant, buscar o técnico mais próximo com skill compatível
        List<CompanySearchResult> results = activeTenants.stream()
                .map(tenant -> findNearestTechnicianForTenant(tenant, request))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .sorted(Comparator.comparingDouble(CompanySearchResult::nearestTechnicianDistanceKm))
                .collect(Collectors.toList());

        log.info("Found {} companies with available technicians", results.size());
        return results;
    }

    /**
     * Encontra o técnico mais próximo para um tenant específico.
     */
    private Optional<CompanySearchResult> findNearestTechnicianForTenant(Tenant tenant, SearchRequest request) {
        // Buscar técnicos disponíveis deste tenant
        List<Technician> technicians = technicianRepository.findAvailableByTenantId(tenant.getId());

        if (technicians.isEmpty()) {
            log.debug("No available technicians for tenant: {}", tenant.getName());
            return Optional.empty();
        }

        // Filtrar por skill compatível e encontrar o mais próximo
        String requiredSkill = request.categoryCode().toLowerCase();

        Optional<TechnicianDistance> nearestTechnician = technicians.stream()
                .filter(tech -> hasCompatibleSkill(tech, requiredSkill))
                .map(tech -> {
                    double distanceKm = GeoUtils.distanceInKilometers(
                            tech.getCurrentLocation(),
                            request.customerLocation());
                    return new TechnicianDistance(tech, distanceKm);
                })
                .filter(td -> td.distanceKm <= maxRadiusKm)
                .min(Comparator.comparingDouble(TechnicianDistance::distanceKm));

        if (nearestTechnician.isEmpty()) {
            log.debug("No technicians with compatible skills within radius for tenant: {}", tenant.getName());
            return Optional.empty();
        }

        TechnicianDistance td = nearestTechnician.get();

        // Calcular tempo estimado de chegada
        MapsPort.DistanceResult distanceResult = mapsPort.getDistance(
                td.technician.getCurrentLocation(),
                request.customerLocation());

        return Optional.of(new CompanySearchResult(
                tenant.getId(),
                tenant.getName(),
                tenant.getLogoUrl(),
                tenant.getAverageRating() != null ? tenant.getAverageRating().doubleValue() : 5.0,
                tenant.getTotalReviews() != null ? tenant.getTotalReviews() : 0,
                distanceResult.distanceKm(),
                distanceResult.durationMinutes(),
                true // hasAvailability
        ));
    }

    /**
     * Verifica se o técnico tem skill compatível com a categoria.
     */
    private boolean hasCompatibleSkill(Technician technician, String requiredSkill) {
        if (technician.getSkills() == null || technician.getSkills().isEmpty()) {
            return false;
        }

        return technician.getSkills().stream()
                .anyMatch(skill -> {
                    String skillLower = skill.toLowerCase();
                    return skillLower.contains(requiredSkill) ||
                           requiredSkill.contains(skillLower) ||
                           skillLower.contains("general");
                });
    }

    // ========== DTOs ==========

    public record SearchRequest(
            String categoryCode,
            Point customerLocation,
            LocalDate date
    ) {}

    public record CompanySearchResult(
            UUID tenantId,
            String companyName,
            String logoUrl,
            double rating,
            int totalReviews,
            double nearestTechnicianDistanceKm,
            int estimatedArrivalMinutes,
            boolean hasAvailability
    ) {}

    private record TechnicianDistance(
            Technician technician,
            double distanceKm
    ) {}
}
