package com.oxfield.services.adapter.input.rest;

import com.oxfield.services.application.service.ServiceCategoryService;
import com.oxfield.services.application.service.ServiceCategoryService.CreateServiceCategoryRequest;
import com.oxfield.services.application.service.ServiceCategoryService.ServiceCategoryResponse;
import com.oxfield.services.application.service.ServiceCategoryService.UpdateServiceCategoryRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller para CRUD de categorias de serviço (por tenant).
 */
@RestController
@RequestMapping("/empresa/categories")
@Tag(name = "Categorias de Serviço", description = "CRUD de categorias por empresa")
@PreAuthorize("hasAnyRole('ADMIN_EMPRESA', 'GESTOR')")
public class ServiceCategoryController {

    private static final Logger log = LoggerFactory.getLogger(ServiceCategoryController.class);

    private final ServiceCategoryService categoryService;

    public ServiceCategoryController(ServiceCategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    @Operation(summary = "Listar categorias", description = "Lista categorias do tenant atual")
    public ResponseEntity<List<ServiceCategoryResponse>> list() {
        log.info("Listing categories for current tenant");
        return ResponseEntity.ok(categoryService.listByTenant());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obter categoria", description = "Retorna uma categoria por ID")
    public ResponseEntity<ServiceCategoryResponse> getById(@PathVariable UUID id) {
        log.info("Getting category: {}", id);
        return ResponseEntity.ok(categoryService.getById(id));
    }

    @PostMapping
    @Operation(summary = "Criar categoria", description = "Cria nova categoria para o tenant")
    public ResponseEntity<ServiceCategoryResponse> create(@RequestBody CreateServiceCategoryRequest request) {
        log.info("Creating category: {}", request.code());
        return ResponseEntity.ok(categoryService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar categoria", description = "Atualiza uma categoria existente")
    public ResponseEntity<ServiceCategoryResponse> update(
            @PathVariable UUID id,
            @RequestBody UpdateServiceCategoryRequest request) {
        log.info("Updating category: {}", id);
        return ResponseEntity.ok(categoryService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir categoria", description = "Exclui categoria (não permitido se houver ordens usando)")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        log.info("Deleting category: {}", id);
        categoryService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
