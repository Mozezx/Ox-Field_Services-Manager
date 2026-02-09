package com.oxfield.services.application.port.output;

import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

/**
 * Port para serviços de armazenamento (S3).
 */
public interface StoragePort {

    /**
     * Faz upload de um arquivo e retorna a URL pública.
     */
    UploadResult upload(UploadRequest request);

    /**
     * Deleta um arquivo pelo path.
     */
    void delete(String filePath);

    /**
     * Gera URL pré-assinada para upload direto do cliente.
     */
    PresignedUrlResult generateUploadUrl(String fileName, String contentType);

    // ========== DTOs ==========

    record UploadRequest(
            UUID tenantId,
            String folder, // ex: "orders/photos", "orders/signatures"
            String fileName,
            byte[] content,
            String contentType) {
    }

    record UploadResult(
            String fileUrl,
            String filePath,
            long sizeBytes) {
    }

    record PresignedUrlResult(
            String uploadUrl,
            String fileUrl,
            long expiresInSeconds) {
    }
}
