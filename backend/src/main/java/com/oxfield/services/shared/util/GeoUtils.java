package com.oxfield.services.shared.util;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;

/**
 * Utilitários para cálculos geográficos.
 */
public final class GeoUtils {

    private static final double EARTH_RADIUS_METERS = 6_371_000.0;
    private static final GeometryFactory GEOMETRY_FACTORY = new GeometryFactory(new PrecisionModel(), 4326);

    private GeoUtils() {
        // Classe utilitária
    }

    /**
     * Cria um Point a partir de latitude e longitude.
     * SRID 4326 = WGS84 (padrão GPS)
     */
    public static Point createPoint(double latitude, double longitude) {
        // PostGIS usa (longitude, latitude) - X, Y
        Point point = GEOMETRY_FACTORY.createPoint(new Coordinate(longitude, latitude));
        point.setSRID(4326);
        return point;
    }

    /**
     * Calcula a distância em metros entre dois pontos usando fórmula Haversine.
     */
    public static double distanceInMeters(Point p1, Point p2) {
        if (p1 == null || p2 == null) {
            throw new IllegalArgumentException("Points cannot be null");
        }
        return haversine(p1.getY(), p1.getX(), p2.getY(), p2.getX());
    }

    /**
     * Calcula a distância em quilômetros entre dois pontos.
     */
    public static double distanceInKilometers(Point p1, Point p2) {
        return distanceInMeters(p1, p2) / 1000.0;
    }

    /**
     * Verifica se dois pontos estão dentro de um raio (em metros).
     */
    public static boolean isWithinRadius(Point p1, Point p2, double radiusMeters) {
        return distanceInMeters(p1, p2) <= radiusMeters;
    }

    /**
     * Fórmula Haversine para calcular distância entre coordenadas.
     * Retorna distância em metros.
     */
    private static double haversine(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                        * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS_METERS * c;
    }

    /**
     * Extrai latitude de um Point.
     */
    public static double getLatitude(Point point) {
        return point.getY();
    }

    /**
     * Extrai longitude de um Point.
     */
    public static double getLongitude(Point point) {
        return point.getX();
    }
}
