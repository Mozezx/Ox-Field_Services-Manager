package com.oxfield.services.adapter.output.storage;

import com.oxfield.services.application.port.output.StoragePort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.util.UUID;

/**
 * Implementação do StoragePort usando AWS S3.
 * Só é criado quando oxfield.upload.use-s3=true (ex.: produção com credenciais AWS).
 * Caso contrário, usa-se apenas LocalStorageAdapter (pasta local).
 */
@Component
@ConditionalOnProperty(name = "oxfield.upload.use-s3", havingValue = "true")
public class S3StorageAdapter implements StoragePort {

    private static final Logger log = LoggerFactory.getLogger(S3StorageAdapter.class);
    private static final Duration PRESIGN_DURATION = Duration.ofMinutes(15);

    @Value("${aws.s3.bucket-name:ox-field-services}")
    private String bucketName;

    @Value("${aws.s3.region:eu-central-1}")
    private String region;

    @Value("${aws.s3.cdn-url:}")
    private String cdnUrl;

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    public S3StorageAdapter(S3Client s3Client, S3Presigner s3Presigner) {
        this.s3Client = s3Client;
        this.s3Presigner = s3Presigner;
    }

    @Override
    public UploadResult upload(UploadRequest request) {
        String key = buildKey(request.tenantId(), request.folder(), request.fileName());

        log.info("Uploading file to S3: {}/{}", bucketName, key);

        try {
            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(request.contentType())
                    .build();

            s3Client.putObject(putRequest, RequestBody.fromBytes(request.content()));

            String fileUrl = buildFileUrl(key);

            log.info("File uploaded successfully: {}", fileUrl);

            return new UploadResult(
                    fileUrl,
                    key,
                    request.content().length);

        } catch (S3Exception e) {
            log.error("Failed to upload file to S3: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to upload file to S3", e);
        }
    }

    @Override
    public void delete(String filePath) {
        log.info("Deleting file from S3: {}/{}", bucketName, filePath);

        try {
            DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(filePath)
                    .build();

            s3Client.deleteObject(deleteRequest);
            log.info("File deleted successfully: {}", filePath);

        } catch (S3Exception e) {
            log.error("Failed to delete file from S3: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to delete file from S3", e);
        }
    }

    @Override
    public PresignedUrlResult generateUploadUrl(String fileName, String contentType) {
        String key = "uploads/" + UUID.randomUUID() + "/" + fileName;

        PutObjectRequest objectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(contentType)
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(PRESIGN_DURATION)
                .putObjectRequest(objectRequest)
                .build();

        PresignedPutObjectRequest presignedRequest = s3Presigner.presignPutObject(presignRequest);

        return new PresignedUrlResult(
                presignedRequest.url().toString(),
                buildFileUrl(key),
                PRESIGN_DURATION.toSeconds());
    }

    private String buildKey(UUID tenantId, String folder, String fileName) {
        return String.format("tenants/%s/%s/%s", tenantId, folder, fileName);
    }

    private String buildFileUrl(String key) {
        if (cdnUrl != null && !cdnUrl.isEmpty()) {
            return cdnUrl + "/" + key;
        }
        return String.format("https://%s.s3.%s.amazonaws.com/%s", bucketName, region, key);
    }
}
