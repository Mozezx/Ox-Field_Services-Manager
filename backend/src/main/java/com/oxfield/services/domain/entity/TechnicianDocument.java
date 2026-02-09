package com.oxfield.services.domain.entity;

import jakarta.persistence.*;

import java.util.UUID;

/**
 * Document uploaded by a technician (e.g. ID, certificate).
 * Stored in local uploads folder; filePath is relative for serving via /api/v1/uploads/...
 */
@Entity
@Table(name = "technician_documents")
public class TechnicianDocument extends BaseEntity {

    @Column(name = "technician_id", nullable = false, updatable = false)
    private UUID technicianId;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(name = "type", nullable = false, length = 50)
    private String type;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "file_path", nullable = false, length = 512)
    private String filePath;

    @Column(name = "status", nullable = false, length = 20)
    private String status = "PENDING";

    public UUID getTechnicianId() {
        return technicianId;
    }

    public void setTechnicianId(UUID technicianId) {
        this.technicianId = technicianId;
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
