package com.oxfield.services.adapter.input.rest;

import com.oxfield.services.application.service.TechnicianProfileService;
import com.oxfield.services.application.service.TechnicianProfileService.DocumentInfo;
import com.oxfield.services.application.service.TechnicianProfileService.TechnicianProfile;
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
import org.springframework.web.multipart.MultipartFile;

import java.util.Base64;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Controller para perfil e documentos do técnico.
 * Delega lógica de negócio para TechnicianProfileService.
 */
@RestController
@RequestMapping("/tech")
@PreAuthorize("hasRole('TECNICO')")
@Tag(name = "Tech Profile", description = "Endpoints para perfil e documentos do técnico")
public class TechProfileController {

    private static final Logger log = LoggerFactory.getLogger(TechProfileController.class);

    private final TechnicianProfileService profileService;
    private final CurrentUserProvider currentUserProvider;

    public TechProfileController(
            TechnicianProfileService profileService,
            CurrentUserProvider currentUserProvider) {
        this.profileService = profileService;
        this.currentUserProvider = currentUserProvider;
    }

    // ==================== Profile ====================

    @GetMapping("/profile")
    @RequiresTechApp
    @Operation(summary = "Perfil", description = "Retorna dados do técnico logado")
    public ResponseEntity<TechnicianProfileResponse> getProfile() {
        JwtUserDetails user = currentUserProvider.requireCurrentUser();
        TechnicianProfile profile = profileService.getProfileByUserId(user.getUserId());
        return ResponseEntity.ok(toResponse(profile));
    }

    @PostMapping("/profile/avatar")
    @RequiresTechApp
    @Operation(summary = "Upload Avatar", description = "Altera a foto de perfil do técnico")
    public ResponseEntity<TechnicianProfileResponse> uploadProfileAvatar(
            @RequestParam(required = false) MultipartFile photo,
            @RequestParam(required = false) String photoBase64) {
        JwtUserDetails user = currentUserProvider.requireCurrentUser();

        byte[] imageData;
        String fileName;
        String contentType = "image/jpeg";

        try {
            if (photo != null && !photo.isEmpty()) {
                imageData = photo.getBytes();
                fileName = UUID.randomUUID() + "_"
                        + (photo.getOriginalFilename() != null ? photo.getOriginalFilename() : "avatar.jpg");
                contentType = photo.getContentType() != null ? photo.getContentType() : contentType;
            } else if (photoBase64 != null && !photoBase64.isEmpty()) {
                String base64Data = photoBase64.contains(",") ? photoBase64.split(",")[1] : photoBase64;
                imageData = Base64.getDecoder().decode(base64Data);
                fileName = UUID.randomUUID() + ".jpg";
            } else {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Foto é obrigatória (photo ou photoBase64)");
            }
        } catch (java.io.IOException e) {
            throw new BusinessException(ErrorCode.STORAGE_UPLOAD_FAILED, "Erro ao processar foto: " + e.getMessage());
        }

        TechnicianProfile profile = profileService.updateAvatar(user.getUserId(), imageData, fileName, contentType,
                user.getTenantId());
        return ResponseEntity.ok(toResponse(profile));
    }

    @PostMapping("/status")
    @RequiresTechApp
    @RequiresApprovedTechnician
    @Operation(summary = "Atualizar Status", description = "Atualiza status online/offline")
    public ResponseEntity<Void> updateStatus(@RequestParam boolean online) {
        JwtUserDetails user = currentUserProvider.requireCurrentUser();
        profileService.updateOnlineStatus(user.getUserId(), online);
        return ResponseEntity.ok().build();
    }

    // ==================== Documents ====================

    @GetMapping("/documents")
    @RequiresTechApp
    @Operation(summary = "Get Documents", description = "Lista documentos do técnico")
    public ResponseEntity<List<DocumentResponse>> getDocuments() {
        JwtUserDetails user = currentUserProvider.requireCurrentUser();
        List<DocumentInfo> docs = profileService.getDocuments(user.getUserId());
        return ResponseEntity.ok(docs.stream().map(this::toDocumentResponse).collect(Collectors.toList()));
    }

    @PostMapping("/documents")
    @RequiresTechApp
    @Operation(summary = "Upload Document", description = "Faz upload de documento do técnico")
    public ResponseEntity<DocumentResponse> uploadDocument(
            @RequestParam String type,
            @RequestParam MultipartFile file) {
        try {
            JwtUserDetails user = currentUserProvider.requireCurrentUser();

            if (file == null || file.isEmpty()) {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Arquivo é obrigatório");
            }

            byte[] data = file.getBytes();
            String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";

            DocumentInfo doc = profileService.uploadDocument(user.getUserId(), user.getTenantId(), type, data,
                    originalFilename);
            return ResponseEntity.ok(toDocumentResponse(doc));
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error uploading document: {}", e.getMessage(), e);
            throw new BusinessException(ErrorCode.INTERNAL_ERROR,
                    "Erro ao fazer upload do documento: " + e.getMessage());
        }
    }

    // ==================== Mappers ====================

    private TechnicianProfileResponse toResponse(TechnicianProfile profile) {
        return new TechnicianProfileResponse(
                profile.id(),
                profile.name(),
                profile.email(),
                profile.avatarUrl(),
                profile.skills(),
                profile.rating(),
                profile.isOnline(),
                profile.vehicleModel(),
                profile.vehiclePlate());
    }

    private DocumentResponse toDocumentResponse(DocumentInfo doc) {
        return new DocumentResponse(doc.id(), doc.type(), doc.fileName(), doc.status(), doc.uploadedAt(), doc.url());
    }

    // ==================== DTOs ====================

    public record TechnicianProfileResponse(
            UUID id,
            String name,
            String email,
            String avatarUrl,
            List<String> skills,
            double rating,
            boolean isOnline,
            String vehicleModel,
            String vehiclePlate) {
    }

    public record DocumentResponse(
            UUID id,
            String type,
            String fileName,
            String status,
            String uploadedAt,
            String url) {
    }
}
