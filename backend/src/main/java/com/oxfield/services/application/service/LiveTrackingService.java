package com.oxfield.services.application.service;

import com.oxfield.services.adapter.output.persistence.ServiceOrderRepository;
import com.oxfield.services.adapter.output.persistence.TechnicianRepository;
import com.oxfield.services.domain.entity.ServiceOrder;
import com.oxfield.services.domain.entity.Technician;
import com.oxfield.services.shared.util.GeoUtils;
import org.locationtech.jts.geom.Point;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * Serviço de Live Tracking via WebSocket.
 * Permite que clientes acompanhem técnicos em tempo real.
 */
@Service
public class LiveTrackingService {

    private static final Logger log = LoggerFactory.getLogger(LiveTrackingService.class);

    @Value("${oxfield.arrival-radius-meters:200}")
    private double arrivalRadiusMeters;

    private final SimpMessagingTemplate messagingTemplate;
    private final TechnicianRepository technicianRepository;
    private final ServiceOrderRepository orderRepository;

    public LiveTrackingService(
            SimpMessagingTemplate messagingTemplate,
            TechnicianRepository technicianRepository,
            ServiceOrderRepository orderRepository) {
        this.messagingTemplate = messagingTemplate;
        this.technicianRepository = technicianRepository;
        this.orderRepository = orderRepository;
    }

    /**
     * Atualiza localização do técnico e faz broadcast para subscribers.
     */
    @Transactional
    public void updateLocation(UUID technicianId, UUID orderId, double latitude, double longitude) {
        log.debug("Updating location for technician {}: ({}, {})",
                technicianId, latitude, longitude);

        // Atualizar no banco
        Point location = GeoUtils.createPoint(latitude, longitude);
        Technician technician = technicianRepository.findById(technicianId)
                .orElse(null);

        if (technician != null) {
            technician.updateLocation(location);
            technicianRepository.save(technician);
        }

        // Broadcast para o tópico da OS: coordenadas só quando técnico está a ≤ 200m (OS-87378)
        if (orderId != null) {
            Double broadcastLat = null;
            Double broadcastLng = null;
            var orderOpt = orderRepository.findById(orderId);
            if (orderOpt.isPresent()) {
                ServiceOrder order = orderOpt.get();
                if (order.getAddress() != null && order.getAddress().getLocation() != null) {
                    double distanceMeters = GeoUtils.distanceInMeters(location, order.getAddress().getLocation());
                    if (distanceMeters <= arrivalRadiusMeters) {
                        broadcastLat = latitude;
                        broadcastLng = longitude;
                    }
                    log.debug("Broadcast location for order {}: distance={}m, withinRadius={}",
                            orderId, String.format("%.0f", distanceMeters), broadcastLat != null);
                }
            }
            LocationUpdate update = new LocationUpdate(
                    technicianId,
                    orderId,
                    broadcastLat,
                    broadcastLng,
                    Instant.now());

            String destination = "/topic/order/" + orderId + "/tracking";
            messagingTemplate.convertAndSend(destination, update);
            log.debug("Broadcast location to {}", destination);
        }
    }

    /**
     * Envia status de rota para os subscribers.
     */
    public void broadcastRouteStatus(UUID orderId, RouteStatus status) {
        String destination = "/topic/order/" + orderId + "/status";
        messagingTemplate.convertAndSend(destination, status);
        log.debug("Broadcast route status to {}: {}", destination, status.status());
    }

    /**
     * Envia ETA atualizado para os subscribers.
     */
    public void broadcastEta(UUID orderId, EtaUpdate eta) {
        String destination = "/topic/order/" + orderId + "/eta";
        messagingTemplate.convertAndSend(destination, eta);
        log.debug("Broadcast ETA to {}: {} minutes", destination, eta.etaMinutes());
    }

    // ========== DTOs ==========

    /** latitude/longitude null when technician is > arrivalRadiusMeters from order address (OS-87378) */
    public record LocationUpdate(
            UUID technicianId,
            UUID orderId,
            Double latitude,
            Double longitude,
            Instant timestamp) {
    }

    public record RouteStatus(
            UUID orderId,
            String status, // "en_route", "arrived", "in_progress"
            Instant timestamp) {
    }

    public record EtaUpdate(
            UUID orderId,
            int etaMinutes,
            double distanceKm,
            Instant timestamp) {
    }
}
