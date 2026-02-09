package com.oxfield.services.adapter.output.storage;

import com.oxfield.services.application.port.output.StoragePort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Armazena arquivos na pasta local (ex.: uploads/). Usado quando S3 não está configurado.
 * Os arquivos são servidos via GET /api/v1/uploads/...
 */
@Component
@Primary
public class LocalStorageAdapter implements StoragePort {

    private static final Logger log = LoggerFactory.getLogger(LocalStorageAdapter.class);

    @Value("${oxfield.upload.local-dir:uploads}")
    private String uploadsDir;

    @Value("${server.servlet.context-path:/api/v1}")
    private String contextPath;

    @PostConstruct
    public void init() {
        try {
            Path base = Paths.get(uploadsDir).toAbsolutePath();
            Files.createDirectories(base);
            log.info("Uploads directory ready: {}", base);
        } catch (IOException e) {
            log.error("Could not create uploads directory: {}", e.getMessage());
            throw new IllegalStateException("Uploads directory could not be created: " + uploadsDir, e);
        }
    }

    @Override
    public UploadResult upload(UploadRequest request) {
        String relativePath = String.format("%s/%s/%s", request.tenantId(), request.folder(), request.fileName());
        Path baseDir = Paths.get(uploadsDir).toAbsolutePath();
        Path targetFile = baseDir.resolve(relativePath);

        try {
            Files.createDirectories(targetFile.getParent());
            Files.write(targetFile, request.content());
            String fileUrl = contextPath + "/uploads/" + relativePath.replace("\\", "/");
            log.info("File saved locally: {} -> {}", targetFile, fileUrl);
            return new UploadResult(fileUrl, relativePath, request.content().length);
        } catch (IOException e) {
            log.error("Failed to save file: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to save file: " + e.getMessage(), e);
        }
    }

    @Override
    public void delete(String filePath) {
        Path baseDir = Paths.get(uploadsDir).toAbsolutePath();
        Path target = baseDir.resolve(filePath);
        try {
            if (Files.exists(target)) {
                Files.delete(target);
                log.info("File deleted: {}", target);
            }
        } catch (IOException e) {
            log.error("Failed to delete file {}: {}", filePath, e.getMessage());
            throw new RuntimeException("Failed to delete file: " + e.getMessage(), e);
        }
    }

    @Override
    public PresignedUrlResult generateUploadUrl(String fileName, String contentType) {
        throw new UnsupportedOperationException("Presigned URLs are not supported for local storage");
    }
}
