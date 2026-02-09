package com.oxfield.services.application.service;

import com.oxfield.services.adapter.output.persistence.MaterialRepository;
import com.oxfield.services.application.port.output.MapsPort;
import com.oxfield.services.domain.entity.CustomerAddress;
import com.oxfield.services.domain.entity.Material;
import com.oxfield.services.domain.entity.OrderMaterial;
import com.oxfield.services.domain.entity.ServiceCategory;
import com.oxfield.services.domain.entity.ServiceOrder;
import org.locationtech.jts.geom.Point;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

/**
 * Serviço de cálculo de preços.
 * 
 * Fórmula:
 * Price_est = (BaseRate + (Distance × KmRate)) × CategoryMultiplier + Materials
 * Total = Price_est + (Price_est × VAT)
 */
@Service
public class PricingEngineService {

    private static final Logger log = LoggerFactory.getLogger(PricingEngineService.class);

    // VAT Bélgica = 21%
    @Value("${oxfield.default-vat-rate:0.21}")
    private BigDecimal vatRate;

    @Value("${oxfield.pricing.default-base-rate:50.00}")
    private BigDecimal defaultBaseRate;

    @Value("${oxfield.pricing.default-km-rate:0.75}")
    private BigDecimal defaultKmRate;

    private final MapsPort mapsPort;
    private final MaterialRepository materialRepository;

    public PricingEngineService(MapsPort mapsPort, MaterialRepository materialRepository) {
        this.mapsPort = mapsPort;
        this.materialRepository = materialRepository;
    }

    /**
     * Calcula o preço estimado para uma OS (antes da execução).
     */
    public PriceEstimate calculateEstimate(PriceEstimateRequest request) {
        log.info("Calculating price estimate for category: {}", request.category() != null ? request.category().getCode() : null);

        // 1. Taxa base
        BigDecimal baseRate = defaultBaseRate;

        // 2. Custo de distância (se técnico já atribuído)
        BigDecimal distanceCost = BigDecimal.ZERO;
        double distanceKm = 0;
        int durationMinutes = 0;

        if (request.technicianLocation() != null && request.customerLocation() != null) {
            MapsPort.DistanceResult distance = mapsPort.getDistance(
                    request.technicianLocation(),
                    request.customerLocation());
            distanceKm = distance.distanceKm();
            durationMinutes = distance.durationMinutes();
            distanceCost = defaultKmRate.multiply(BigDecimal.valueOf(distanceKm));
        }

        // 3. Multiplicador de categoria (da entidade ou fallback 1.00)
        BigDecimal categoryMultiplier = request.category() != null && request.category().getPriceMultiplier() != null
                ? request.category().getPriceMultiplier() : BigDecimal.ONE;

        // 4. Estimativa de materiais (média por categoria)
        BigDecimal materialsEstimate = getAverageMaterialsCost(request.category());

        // 5. Subtotal
        BigDecimal subtotal = baseRate.add(distanceCost)
                .multiply(categoryMultiplier)
                .add(materialsEstimate)
                .setScale(2, RoundingMode.HALF_UP);

        // 6. VAT
        BigDecimal vatAmount = subtotal.multiply(vatRate).setScale(2, RoundingMode.HALF_UP);

        // 7. Total
        BigDecimal total = subtotal.add(vatAmount);

        log.info("Price estimate calculated: €{} (subtotal: €{}, VAT: €{})",
                total, subtotal, vatAmount);

        return new PriceEstimate(
                baseRate,
                distanceKm,
                distanceCost,
                durationMinutes,
                categoryMultiplier,
                materialsEstimate,
                subtotal,
                vatRate,
                vatAmount,
                total,
                "EUR");
    }

    /**
     * Calcula o preço final após conclusão (usando materiais reais).
     */
    public PriceFinal calculateFinal(ServiceOrder order) {
        log.info("Calculating final price for order: {}", order.getOsNumber());

        // 1. Taxa base
        BigDecimal baseRate = defaultBaseRate;

        // 2. Custo de distância
        BigDecimal distanceCost = BigDecimal.ZERO;
        double distanceKm = 0;

        if (order.getTechnician() != null &&
                order.getTechnician().getCurrentLocation() != null &&
                order.getAddress() != null &&
                order.getAddress().getLocation() != null) {

            MapsPort.DistanceResult distance = mapsPort.getDistance(
                    order.getTechnician().getCurrentLocation(),
                    order.getAddress().getLocation());
            distanceKm = distance.distanceKm();
            distanceCost = defaultKmRate.multiply(BigDecimal.valueOf(distanceKm));
        }

        // 3. Multiplicador de categoria (da entidade ou fallback 1.00)
        BigDecimal categoryMultiplier = order.getCategory() != null && order.getCategory().getPriceMultiplier() != null
                ? order.getCategory().getPriceMultiplier() : BigDecimal.ONE;

        // 4. Custo REAL de materiais usados
        BigDecimal materialsCost = calculateMaterialsCost(order.getMaterials());

        // 5. Labor cost (base + distância) × multiplicador
        BigDecimal laborCost = baseRate.add(distanceCost)
                .multiply(categoryMultiplier)
                .setScale(2, RoundingMode.HALF_UP);

        // 6. Subtotal
        BigDecimal subtotal = laborCost.add(materialsCost);

        // 7. VAT
        BigDecimal vatAmount = subtotal.multiply(vatRate).setScale(2, RoundingMode.HALF_UP);

        // 8. Total
        BigDecimal total = subtotal.add(vatAmount);

        log.info("Final price calculated: €{} (labor: €{}, materials: €{}, VAT: €{})",
                total, laborCost, materialsCost, vatAmount);

        return new PriceFinal(
                laborCost,
                materialsCost,
                subtotal,
                vatRate,
                vatAmount,
                total,
                "EUR");
    }

    /**
     * Calcula custo dos materiais usados
     */
    private BigDecimal calculateMaterialsCost(List<OrderMaterial> materials) {
        if (materials == null || materials.isEmpty()) {
            return BigDecimal.ZERO;
        }

        return materials.stream()
                .map(om -> {
                    Material material = om.getMaterial();
                    if (material != null && material.getUnitPrice() != null) {
                        return material.getUnitPrice().multiply(BigDecimal.valueOf(om.getQuantity()));
                    }
                    return BigDecimal.ZERO;
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Estimativa média de materiais por categoria (por code)
     */
    private BigDecimal getAverageMaterialsCost(ServiceCategory category) {
        if (category == null) return new BigDecimal("30.00");
        return switch (category.getCode()) {
            case "hvac" -> new BigDecimal("75.00");
            case "electrical" -> new BigDecimal("45.00");
            case "plumbing" -> new BigDecimal("60.00");
            default -> new BigDecimal("30.00");
        };
    }

    // ========== DTOs ==========

    public record PriceEstimateRequest(
            ServiceCategory category,
            Point technicianLocation,
            Point customerLocation,
            UUID tenantId) {
    }

    public record PriceEstimate(
            BigDecimal baseRate,
            double distanceKm,
            BigDecimal distanceCost,
            int estimatedDurationMinutes,
            BigDecimal categoryMultiplier,
            BigDecimal materialsEstimate,
            BigDecimal subtotal,
            BigDecimal vatRate,
            BigDecimal vatAmount,
            BigDecimal total,
            String currency) {
    }

    public record PriceFinal(
            BigDecimal laborCost,
            BigDecimal materialsCost,
            BigDecimal subtotal,
            BigDecimal vatRate,
            BigDecimal vatAmount,
            BigDecimal total,
            String currency) {
    }
}
