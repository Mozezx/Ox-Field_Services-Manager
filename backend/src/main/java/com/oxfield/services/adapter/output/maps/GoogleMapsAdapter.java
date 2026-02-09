package com.oxfield.services.adapter.output.maps;

import com.oxfield.services.application.port.output.MapsPort;
import com.oxfield.services.shared.util.GeoUtils;
import org.locationtech.jts.geom.Point;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Implementação do MapsPort usando cálculo local (Haversine).
 * Em produção, integrar com Google Maps Distance Matrix API.
 */
@Component
public class GoogleMapsAdapter implements MapsPort {

    private static final Logger log = LoggerFactory.getLogger(GoogleMapsAdapter.class);
    private static final double ROAD_FACTOR = 1.3; // Fator de correção estrada vs linha reta
    private static final double AVG_SPEED_KMH = 40.0; // Velocidade média urbana

    @Value("${google.maps.api-key:}")
    private String apiKey;

    @Override
    public DistanceResult getDistance(Point origin, Point destination) {
        // Calcula distância em linha reta
        double straightLineKm = GeoUtils.distanceInKilometers(origin, destination);

        // Aplica fator de correção para estrada
        double roadDistanceKm = straightLineKm * ROAD_FACTOR;

        // Estima tempo de viagem
        int durationMinutes = (int) Math.ceil((roadDistanceKm / AVG_SPEED_KMH) * 60);

        log.debug("Distance calculated: {:.2f}km (road estimate), {}min",
                roadDistanceKm, durationMinutes);

        return new DistanceResult(roadDistanceKm, durationMinutes, null);
    }

    @Override
    public double getDistanceInMeters(Point origin, Point destination) {
        return GeoUtils.distanceInMeters(origin, destination);
    }

    // TODO: Implementar integração real com Google Maps API
    // private DistanceResult callGoogleMapsApi(Point origin, Point destination) {
    // ... }
}
