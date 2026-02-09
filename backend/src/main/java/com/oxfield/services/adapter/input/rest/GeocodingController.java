package com.oxfield.services.adapter.input.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Controller de Geocodificação.
 * Faz proxy para APIs de geocodificação (Nominatim) para evitar problemas de CORS.
 */
@RestController
@RequestMapping("/geocoding")
@Tag(name = "Geocoding", description = "Endpoints de geocodificação de endereços")
public class GeocodingController {

    private static final Logger log = LoggerFactory.getLogger(GeocodingController.class);
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GeocodingController(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Busca endereços usando Nominatim (OpenStreetMap).
     * Faz proxy para evitar problemas de CORS no frontend.
     */
    @GetMapping("/search")
    @Operation(
            summary = "Buscar Endereços",
            description = "Busca endereços usando Nominatim (OpenStreetMap). Retorna lista de sugestões."
    )
    public ResponseEntity<List<AddressSuggestionResponse>> searchAddresses(
            @Parameter(description = "Query de busca (ex: Rua das Flores, São Paulo)")
            @RequestParam String query
    ) {
        try {
            // Fazer requisição para Nominatim
            String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
            String url = "https://nominatim.openstreetmap.org/search?format=json&q=" +
                    encodedQuery + "&limit=10&addressdetails=1&countrycodes=br";

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "OxField-Services/1.0");
            headers.setContentType(MediaType.APPLICATION_JSON);

            org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                log.warn("Nominatim returned status: {}", response.getStatusCode());
                return ResponseEntity.ok(List.of());
            }

            // Parse JSON
            List<Map<String, Object>> results = objectMapper.readValue(response.getBody(),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));

            if (results == null) {
                return ResponseEntity.ok(List.of());
            }

            // Converter para response
            List<AddressSuggestionResponse> suggestions = new ArrayList<>();
            for (Map<String, Object> result : results) {
                @SuppressWarnings("unchecked")
                Map<String, Object> address = (Map<String, Object>) result.getOrDefault("address", Map.of());

                // Construir nome da rua
                String houseNumber = (String) address.getOrDefault("house_number", "");
                String road = (String) address.getOrDefault("road", "");
                String street = (!houseNumber.isEmpty() && !road.isEmpty())
                        ? houseNumber + " " + road
                        : (!road.isEmpty() ? road : "");

                // Cidade
                String city = (String) address.getOrDefault("city",
                        address.getOrDefault("suburb",
                                address.getOrDefault("neighbourhood", "")));

                // Estado
                String state = (String) address.getOrDefault("state", "");

                // CEP
                String postalCode = (String) address.getOrDefault("postcode", "");

                // País
                String country = (String) address.getOrDefault("country", "Brasil");

                // Display name
                String displayName = (String) result.getOrDefault("display_name", "");

                // Coordenadas
                double lat = Double.parseDouble((String) result.getOrDefault("lat", "0"));
                double lon = Double.parseDouble((String) result.getOrDefault("lon", "0"));

                suggestions.add(new AddressSuggestionResponse(
                        "osm-" + result.get("place_id"),
                        displayName,
                        !street.isEmpty() ? street : (displayName.contains(",") ? displayName.split(",")[0] : displayName),
                        city,
                        state,
                        postalCode,
                        country,
                        lat,
                        lon
                ));
            }

            return ResponseEntity.ok(suggestions);
        } catch (Exception e) {
            log.error("Error searching addresses: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(List.of());
        }
    }

    /**
     * Geocodifica um endereço (obtém coordenadas).
     */
    @GetMapping("/geocode")
    @Operation(
            summary = "Geocodificar Endereço",
            description = "Obtém coordenadas de um endereço usando Nominatim"
    )
    public ResponseEntity<GeocodeResponse> geocodeAddress(
            @Parameter(description = "Rua/Endereço")
            @RequestParam String street,

            @Parameter(description = "Cidade")
            @RequestParam String city,

            @Parameter(description = "Estado")
            @RequestParam String state,

            @Parameter(description = "CEP (opcional)")
            @RequestParam(required = false) String postalCode
    ) {
        try {
            // Construir query
            StringBuilder queryBuilder = new StringBuilder();
            if (street != null && !street.isEmpty()) queryBuilder.append(street).append(", ");
            if (city != null && !city.isEmpty()) queryBuilder.append(city).append(", ");
            if (state != null && !state.isEmpty()) queryBuilder.append(state).append(", ");
            if (postalCode != null && !postalCode.isEmpty()) queryBuilder.append(postalCode);

            String query = queryBuilder.toString().replaceAll(", $", "");

            // Fazer requisição para Nominatim
            String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
            String url = "https://nominatim.openstreetmap.org/search?format=json&q=" +
                    encodedQuery + "&limit=1&addressdetails=0&countrycodes=br";

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "OxField-Services/1.0");
            headers.setContentType(MediaType.APPLICATION_JSON);

            org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                log.warn("Nominatim geocode returned status: {}", response.getStatusCode());
                return ResponseEntity.ok(new GeocodeResponse(null, null));
            }

            // Parse JSON
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> results = objectMapper.readValue(response.getBody(),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));

            if (results == null || results.isEmpty()) {
                return ResponseEntity.ok(new GeocodeResponse(null, null));
            }

            Map<String, Object> result = results.get(0);
            double lat = Double.parseDouble((String) result.getOrDefault("lat", "0"));
            double lon = Double.parseDouble((String) result.getOrDefault("lon", "0"));

            return ResponseEntity.ok(new GeocodeResponse(lat, lon));
        } catch (Exception e) {
            log.error("Error geocoding address: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(new GeocodeResponse(null, null));
        }
    }

    // ========== Response DTOs ==========

    public record AddressSuggestionResponse(
            String id,
            String displayName,
            String street,
            String city,
            String state,
            String postalCode,
            String country,
            double latitude,
            double longitude
    ) {}

    public record GeocodeResponse(
            Double latitude,
            Double longitude
    ) {}
}
