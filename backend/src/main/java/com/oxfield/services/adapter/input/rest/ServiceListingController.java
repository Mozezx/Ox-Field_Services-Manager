package com.oxfield.services.adapter.input.rest;

import com.oxfield.services.application.service.ServiceListingService;
import com.oxfield.services.application.service.ServiceListingService.CreateListingRequest;
import com.oxfield.services.application.service.ServiceListingService.ListingResponse;
import com.oxfield.services.application.service.ServiceListingService.UpdateListingRequest;
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
 * CRUD for marketplace service listings (empresa scope).
 */
@RestController
@RequestMapping("/empresa/listings")
@Tag(name = "Service Listings", description = "Marketplace listings CRUD per company")
@PreAuthorize("hasAnyRole('ADMIN_EMPRESA', 'GESTOR')")
public class ServiceListingController {

    private static final Logger log = LoggerFactory.getLogger(ServiceListingController.class);

    private final ServiceListingService listingService;

    public ServiceListingController(ServiceListingService listingService) {
        this.listingService = listingService;
    }

    @GetMapping
    @Operation(summary = "List listings", description = "List all listings for the current tenant")
    public ResponseEntity<List<ListingResponse>> list() {
        return ResponseEntity.ok(listingService.listByTenant());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get listing", description = "Get a listing by ID")
    public ResponseEntity<ListingResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(listingService.getById(id));
    }

    @PostMapping
    @Operation(summary = "Create listing", description = "Create a new marketplace listing")
    public ResponseEntity<ListingResponse> create(@RequestBody CreateListingRequest request) {
        log.info("Creating listing: {}", request.title());
        return ResponseEntity.ok(listingService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update listing", description = "Update an existing listing")
    public ResponseEntity<ListingResponse> update(@PathVariable UUID id, @RequestBody UpdateListingRequest request) {
        log.info("Updating listing: {}", id);
        return ResponseEntity.ok(listingService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete listing", description = "Delete a listing")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        log.info("Deleting listing: {}", id);
        listingService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
