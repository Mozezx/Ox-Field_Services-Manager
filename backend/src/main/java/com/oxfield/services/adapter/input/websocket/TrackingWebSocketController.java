package com.oxfield.services.adapter.input.websocket;

import com.oxfield.services.application.service.LiveTrackingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.util.UUID;

/**
 * Controller WebSocket para tracking em tempo real.
 */
@Controller
public class TrackingWebSocketController {

    private static final Logger log = LoggerFactory.getLogger(TrackingWebSocketController.class);

    private final LiveTrackingService trackingService;

    public TrackingWebSocketController(LiveTrackingService trackingService) {
        this.trackingService = trackingService;
    }

    /**
     * Recebe atualização de localização do técnico via WebSocket.
     * Cliente envia para: /app/order/{orderId}/location
     * Broadcast para: /topic/order/{orderId}/tracking
     */
    @MessageMapping("/order/{orderId}/location")
    public void updateLocation(
            @DestinationVariable UUID orderId,
            @Payload LocationMessage message) {
        log.debug("Received location update for order {} from technician {}",
                orderId, message.technicianId());

        trackingService.updateLocation(
                message.technicianId(),
                orderId,
                message.latitude(),
                message.longitude());
    }

    /**
     * Recebe mensagem de status de rota.
     */
    @MessageMapping("/order/{orderId}/route-status")
    public void updateRouteStatus(
            @DestinationVariable UUID orderId,
            @Payload RouteStatusMessage message) {
        log.debug("Received route status for order {}: {}", orderId, message.status());

        trackingService.broadcastRouteStatus(orderId,
                new LiveTrackingService.RouteStatus(orderId, message.status(), message.timestamp()));
    }

    // ========== Message DTOs ==========

    public record LocationMessage(
            UUID technicianId,
            double latitude,
            double longitude) {
    }

    public record RouteStatusMessage(
            String status,
            java.time.Instant timestamp) {
    }
}
