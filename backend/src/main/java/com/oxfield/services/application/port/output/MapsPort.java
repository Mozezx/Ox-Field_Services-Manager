package com.oxfield.services.application.port.output;

import org.locationtech.jts.geom.Point;

/**
 * Port para serviços de mapas (Google Maps API).
 * Abstraction para cálculo de distância e rotas.
 */
public interface MapsPort {

    /**
     * Calcula a distância em quilômetros entre dois pontos.
     * Usa Distance Matrix API para distância real por estrada.
     */
    DistanceResult getDistance(Point origin, Point destination);

    /**
     * Calcula a distância em linha reta (Haversine) em metros.
     * Mais rápido, para validações simples.
     */
    double getDistanceInMeters(Point origin, Point destination);

    /**
     * Resultado do cálculo de distância
     */
    record DistanceResult(
            double distanceKm, // Distância em km
            int durationMinutes, // Tempo estimado em minutos
            String polyline // Polyline da rota (opcional)
    ) {
    }
}
