package com.oxfield.services.application.service;

import com.oxfield.services.adapter.output.persistence.TechnicianDocumentRepository;
import com.oxfield.services.adapter.output.persistence.TechnicianRepository;
import com.oxfield.services.adapter.output.persistence.UserRepository;
import com.oxfield.services.application.port.output.StoragePort;
import com.oxfield.services.domain.entity.Technician;
import com.oxfield.services.domain.entity.TechnicianDocument;
import com.oxfield.services.domain.entity.User;
import com.oxfield.services.shared.exception.BusinessException;
import com.oxfield.services.shared.exception.ErrorCode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service para gestão do perfil do técnico e seus documentos.
 * Encapsula lógica de negócio relacionada ao perfil, avatar e documentos.
 */
@Service
public class TechnicianProfileService {

    private static final Logger log = LoggerFactory.getLogger(TechnicianProfileService.class);

    private final TechnicianRepository technicianRepository;
    private final TechnicianDocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final StoragePort storagePort;

    public TechnicianProfileService(
            TechnicianRepository technicianRepository,
            TechnicianDocumentRepository documentRepository,
            UserRepository userRepository,
            StoragePort storagePort) {
        this.technicianRepository = technicianRepository;
        this.documentRepository = documentRepository;
        this.userRepository = userRepository;
        this.storagePort = storagePort;
    }

    /**
     * Obtém o perfil do técnico pelo ID do usuário.
     */
    @Transactional(readOnly = true)
    public TechnicianProfile getProfileByUserId(UUID userId) {
        Technician technician = technicianRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.TECH_NOT_FOUND, "Perfil de técnico não encontrado"));
        return toProfile(technician);
    }

    /**
     * Obtém o perfil do técnico pelo ID do técnico.
     */
    @Transactional(readOnly = true)
    public TechnicianProfile getProfile(UUID technicianId) {
        Technician technician = technicianRepository.findById(technicianId)
                .orElseThrow(() -> new BusinessException(ErrorCode.TECH_NOT_FOUND, "Técnico não encontrado"));
        return toProfile(technician);
    }

    /**
     * Atualiza o avatar do técnico.
     * 
     * @param userId      ID do usuário (não do técnico)
     * @param imageData   Dados da imagem em bytes
     * @param fileName    Nome do arquivo
     * @param contentType Tipo MIME da imagem
     * @param tenantId    ID do tenant
     * @return Perfil atualizado
     */
    @Transactional
    public TechnicianProfile updateAvatar(UUID userId, byte[] imageData, String fileName, String contentType,
            UUID tenantId) {
        Technician technician = technicianRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.TECH_NOT_FOUND, "Perfil de técnico não encontrado"));

        User user = technician.getUser();

        StoragePort.UploadResult upload = storagePort.upload(new StoragePort.UploadRequest(
                tenantId, "profile-technician", fileName, imageData, contentType));

        user.setAvatarUrl(upload.fileUrl());
        userRepository.save(user);

        log.info("Avatar updated for technician userId={}", userId);

        return getProfileByUserId(userId);
    }

    /**
     * Atualiza o status online/offline do técnico.
     */
    @Transactional
    public void updateOnlineStatus(UUID userId, boolean online) {
        Technician technician = technicianRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.TECH_NOT_FOUND, "Perfil de técnico não encontrado"));

        if (online) {
            technician.goOnline();
        } else {
            technician.goOffline();
        }

        technicianRepository.save(technician);
        log.debug("Status updated for technician {}: online={}", technician.getId(), online);
    }

    /**
     * Lista documentos do técnico.
     */
    @Transactional(readOnly = true)
    public List<DocumentInfo> getDocuments(UUID userId) {
        Technician technician = technicianRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.TECH_NOT_FOUND, "Perfil de técnico não encontrado"));

        List<TechnicianDocument> docs = documentRepository.findByTechnicianIdOrderByCreatedAtDesc(technician.getId());

        return docs.stream()
                .map(this::toDocumentInfo)
                .collect(Collectors.toList());
    }

    /**
     * Faz upload de um documento do técnico.
     */
    @Transactional
    public DocumentInfo uploadDocument(UUID userId, UUID tenantId, String type, byte[] fileData,
            String originalFileName) {
        Technician technician = technicianRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.TECH_NOT_FOUND, "Perfil de técnico não encontrado"));

        String fileName = UUID.randomUUID() + "_" + originalFileName;

        StoragePort.UploadResult upload = storagePort.upload(new StoragePort.UploadRequest(
                tenantId, "documents-technician", fileName, fileData, "application/octet-stream"));

        TechnicianDocument doc = new TechnicianDocument();
        doc.setTechnicianId(technician.getId());
        doc.setTenantId(tenantId);
        doc.setType(type.toUpperCase());
        doc.setFileName(originalFileName);
        doc.setFilePath(upload.fileUrl());
        doc.setStatus("PENDING");
        doc = documentRepository.save(doc);

        log.info("Document uploaded: technicianId={}, type={}, docId={}", technician.getId(), type, doc.getId());

        return toDocumentInfo(doc);
    }

    // ==================== Helpers ====================

    private TechnicianProfile toProfile(Technician technician) {
        return new TechnicianProfile(
                technician.getId(),
                technician.getUser().getName(),
                technician.getUser().getEmail(),
                technician.getUser().getAvatarUrl(),
                technician.getSkills(),
                technician.getRating() != null ? technician.getRating().doubleValue() : 5.0,
                technician.getIsOnline(),
                technician.getVehicleModel(),
                technician.getVehiclePlate());
    }

    private DocumentInfo toDocumentInfo(TechnicianDocument doc) {
        String uploadedAt = (doc.getCreatedAt() != null)
                ? LocalDateTime.ofInstant(doc.getCreatedAt(), ZoneId.systemDefault()).toString()
                : null;
        return new DocumentInfo(
                doc.getId(),
                doc.getType() != null ? doc.getType() : "",
                doc.getFileName() != null ? doc.getFileName() : "",
                doc.getStatus() != null ? doc.getStatus() : "PENDING",
                uploadedAt,
                doc.getFilePath());
    }

    // ==================== DTOs ====================

    public record TechnicianProfile(
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

    public record DocumentInfo(
            UUID id,
            String type,
            String fileName,
            String status,
            String uploadedAt,
            String url) {
    }
}
