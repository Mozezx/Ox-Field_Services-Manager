package com.oxfield.services.adapter.input.rest;

import com.oxfield.services.adapter.output.persistence.MaterialRepository;
import com.oxfield.services.adapter.output.persistence.OrderMaterialRepository;
import com.oxfield.services.adapter.output.persistence.ServiceOrderRepository;
import com.oxfield.services.adapter.output.persistence.TechnicianRepository;
import com.oxfield.services.domain.entity.Material;
import com.oxfield.services.domain.entity.OrderMaterial;
import com.oxfield.services.domain.entity.ServiceOrder;
import com.oxfield.services.domain.entity.Technician;
import com.oxfield.services.shared.exception.BusinessException;
import com.oxfield.services.shared.exception.ErrorCode;
import com.oxfield.services.shared.security.AppTypeGuard.RequiresTechApp;
import com.oxfield.services.shared.security.CurrentUserProvider;
import com.oxfield.services.shared.security.JwtUserDetails;
import com.oxfield.services.shared.security.TechnicianOnboardingGuard.RequiresApprovedTechnician;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Controller para materiais do técnico.
 * Extraído do TechnicianController para seguir SRP.
 */
@RestController
@RequestMapping("/tech")
@PreAuthorize("hasRole('TECNICO')")
@Tag(name = "Tech Materials", description = "Endpoints para materiais do técnico")
public class TechMaterialController {

    private static final Logger log = LoggerFactory.getLogger(TechMaterialController.class);

    private final TechnicianRepository technicianRepository;
    private final ServiceOrderRepository orderRepository;
    private final MaterialRepository materialRepository;
    private final OrderMaterialRepository orderMaterialRepository;
    private final CurrentUserProvider currentUserProvider;

    public TechMaterialController(
            TechnicianRepository technicianRepository,
            ServiceOrderRepository orderRepository,
            MaterialRepository materialRepository,
            OrderMaterialRepository orderMaterialRepository,
            CurrentUserProvider currentUserProvider) {
        this.technicianRepository = technicianRepository;
        this.orderRepository = orderRepository;
        this.materialRepository = materialRepository;
        this.orderMaterialRepository = orderMaterialRepository;
        this.currentUserProvider = currentUserProvider;
    }

    @GetMapping("/materials")
    @RequiresTechApp
    @RequiresApprovedTechnician
    @Operation(summary = "Get Materials Catalog", description = "Lista materiais disponíveis no catálogo")
    public ResponseEntity<List<MaterialCatalogResponse>> getMaterialsCatalog(
            @RequestParam(required = false) String category) {
        JwtUserDetails user = currentUserProvider.requireCurrentUser();

        List<Material> materials;
        if (category != null && !category.isEmpty()) {
            try {
                com.oxfield.services.domain.enums.MaterialCategory cat = com.oxfield.services.domain.enums.MaterialCategory
                        .valueOf(category.toUpperCase());
                materials = materialRepository.findByCategory(cat);
            } catch (IllegalArgumentException e) {
                materials = materialRepository.findAll();
            }
        } else {
            materials = materialRepository.findAll();
        }

        List<MaterialCatalogResponse> response = materials.stream()
                .map(m -> new MaterialCatalogResponse(
                        m.getId(),
                        m.getName(),
                        m.getSku(),
                        m.getCategory().name(),
                        m.getStockQuantity() != null ? m.getStockQuantity() : 0,
                        m.getUnitPrice(),
                        m.getImageUrl()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/orders/{orderId}/materials")
    @RequiresTechApp
    @RequiresApprovedTechnician
    @Operation(summary = "Add Materials", description = "Registra materiais usados na OS")
    public ResponseEntity<List<MaterialResponse>> addMaterials(
            @PathVariable UUID orderId,
            @RequestBody AddMaterialsRequest request) {
        ServiceOrder order = getOrder(orderId);
        validateOwnership(order);

        JwtUserDetails user = currentUserProvider.requireCurrentUser();
        UUID tenantId = user.getTenantId();

        List<MaterialResponse> responses = new ArrayList<>();

        for (MaterialRequest materialReq : request.materials()) {
            Material material = materialRepository.findBySku(materialReq.sku())
                    .orElseGet(() -> {
                        Material newMaterial = new Material();
                        newMaterial.setName(materialReq.name());
                        newMaterial.setSku(materialReq.sku());
                        newMaterial.setCategory(com.oxfield.services.domain.enums.MaterialCategory.GENERAL);
                        newMaterial.setUnitPrice(materialReq.cost() != null ? materialReq.cost() : BigDecimal.ZERO);
                        newMaterial.setTenantId(tenantId);
                        return materialRepository.save(newMaterial);
                    });

            OrderMaterial orderMaterial = new OrderMaterial(material, materialReq.quantity());
            orderMaterial.setOrder(order);
            orderMaterial.setTenantId(tenantId);
            orderMaterial = orderMaterialRepository.save(orderMaterial);

            responses.add(new MaterialResponse(
                    orderMaterial.getId(),
                    material.getName(),
                    materialReq.quantity(),
                    materialReq.unit(),
                    materialReq.cost()));
        }

        return ResponseEntity.ok(responses);
    }

    // ==================== Helpers ====================

    private Technician getCurrentTechnician() {
        JwtUserDetails user = currentUserProvider.requireCurrentUser();
        return technicianRepository.findByUserId(user.getUserId())
                .orElseThrow(() -> new BusinessException(ErrorCode.TECH_NOT_FOUND, "Perfil de técnico não encontrado"));
    }

    private ServiceOrder getOrder(UUID orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND, "OS não encontrada"));
    }

    private void validateOwnership(ServiceOrder order) {
        Technician technician = getCurrentTechnician();
        if (!technician.getId().equals(order.getTechnicianId())) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED, "Esta OS não está atribuída a você");
        }
    }

    // ==================== DTOs ====================

    public record MaterialCatalogResponse(
            UUID id,
            String name,
            String sku,
            String category,
            int stockQuantity,
            BigDecimal unitPrice,
            String imageUrl) {
    }

    public record AddMaterialsRequest(List<MaterialRequest> materials) {
    }

    public record MaterialRequest(String name, String sku, int quantity, String unit, BigDecimal cost) {
    }

    public record MaterialResponse(UUID id, String name, int quantity, String unit, BigDecimal cost) {
    }
}
