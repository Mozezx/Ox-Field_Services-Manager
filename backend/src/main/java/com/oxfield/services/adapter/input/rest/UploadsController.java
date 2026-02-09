package com.oxfield.services.adapter.input.rest;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Serves files from the local uploads directory.
 * GET /api/v1/uploads/tenantId/technicians/techId/documents/fileName
 */
@RestController
@RequestMapping("/uploads")
public class UploadsController {

    @Value("${oxfield.upload.local-dir:uploads}")
    private String uploadsDir;

    @GetMapping("/**")
    public ResponseEntity<Resource> serveFile(HttpServletRequest request) {
        String requestUri = request.getRequestURI();
        int uploadsIndex = requestUri.indexOf("/uploads/");
        if (uploadsIndex < 0) {
            return ResponseEntity.notFound().build();
        }
        String pathAfterUploads = requestUri.substring(uploadsIndex + "/uploads/".length());
        Path baseDir = Paths.get(uploadsDir).toAbsolutePath();
        String safePath = pathAfterUploads.replace("..", "").replace("\\", "/");
        Path target = baseDir.resolve(safePath).normalize();
        if (!target.startsWith(baseDir)) {
            return ResponseEntity.notFound().build();
        }
        Resource resource = new PathResource(target);
        if (!resource.exists() || !resource.isReadable()) {
            return ResponseEntity.notFound().build();
        }
        String contentType = getContentType(target.getFileName().toString());
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + target.getFileName().toString() + "\"")
                .body(resource);
    }

    private static String getContentType(String fileName) {
        String lower = fileName.toLowerCase();
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".gif")) return "image/gif";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".pdf")) return "application/pdf";
        return "application/octet-stream";
    }
}
