package com.oxfield.services.application.service;

import com.oxfield.services.adapter.output.persistence.ServiceOrderRepository;
import com.oxfield.services.adapter.output.persistence.TechnicianRepository;
import com.oxfield.services.application.port.output.MapsPort;
import com.oxfield.services.domain.entity.ServiceCategory;
import com.oxfield.services.domain.entity.ServiceOrder;
import com.oxfield.services.domain.entity.Technician;
import com.oxfield.services.domain.enums.OsStatus;
import com.oxfield.services.domain.enums.UserStatus;
import com.oxfield.services.shared.util.GeoUtils;
import org.locationtech.jts.geom.Point;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Serviço de Despacho Inteligente.
 * 
 * Sugere o melhor técnico baseado em:
 * - Skill Match (30%): Técnico possui habilidades para a categoria
 * - Proximidade (40%): Distância até o cliente
 * - Carga de Trabalho (30%): Quantidade de OS no dia
 */
@Service
public class SmartDispatchService {

    private static final Logger log = LoggerFactory.getLogger(SmartDispatchService.class);

    // Pesos para cálculo de score
    private static final double SKILL_WEIGHT = 0.30;
    private static final double PROXIMITY_WEIGHT = 0.40;
    private static final double WORKLOAD_WEIGHT = 0.30;

    // Raio máximo de busca (km)
    @Value("${oxfield.dispatch.max-radius-km:50}")
    private double maxRadiusKm;

    // Carga máxima de OS por dia
    @Value("${oxfield.dispatch.max-orders-per-day:8}")
    private int maxOrdersPerDay;

    private final TechnicianRepository technicianRepository;
    private final ServiceOrderRepository orderRepository;
    private final MapsPort mapsPort;

    public SmartDispatchService(
            TechnicianRepository technicianRepository,
            ServiceOrderRepository orderRepository,
            MapsPort mapsPort) {
        this.technicianRepository = technicianRepository;
        this.orderRepository = orderRepository;
        this.mapsPort = mapsPort;
    }

    /**
     * Sugere técnicos para uma OS ordenados por score.
     */
    @Transactional(readOnly = true)
    public List<TechnicianSuggestion> suggestTechnicians(DispatchRequest request) {
        log.info("Finding technicians for category: {} on date: {}",
                request.category() != null ? request.category().getCode() : null, request.date());

        // 1. Buscar técnicos disponíveis (online e aprovados)
        List<Technician> availableTechnicians = technicianRepository.findOnlineAndApproved(UserStatus.APPROVED);

        if (availableTechnicians.isEmpty()) {
            log.warn("No available technicians found");
            return Collections.emptyList();
        }

        // 2. Filtrar e calcular scores
        List<TechnicianSuggestion> suggestions = availableTechnicians.stream()
                .filter(tech -> tech.getCurrentLocation() != null) // Tem localização
                .map(tech -> calculateScore(tech, request))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .sorted(Comparator.comparingDouble(TechnicianSuggestion::totalScore).reversed())
                .limit(5) // Top 5
                .collect(Collectors.toList());

        log.info("Found {} technician suggestions", suggestions.size());
        return suggestions;
    }

    /**
     * Calcula o score de um técnico para uma OS.
     */
    private Optional<TechnicianSuggestion> calculateScore(Technician technician, DispatchRequest request) {
        // 1. Skill Score
        double skillScore = calculateSkillScore(technician, request.category());
        if (skillScore == 0) {
            return Optional.empty(); // Sem skills compatíveis
        }

        // 2. Proximity Score
        double distanceKm = GeoUtils.distanceInKilometers(
                technician.getCurrentLocation(),
                request.customerLocation());

        if (distanceKm > maxRadiusKm) {
            return Optional.empty(); // Fora do raio
        }

        double proximityScore = calculateProximityScore(distanceKm);

        // 3. Workload Score
        int ordersOnDate = getOrderCountForDate(technician.getId(), request.date());
        if (ordersOnDate >= maxOrdersPerDay) {
            return Optional.empty(); // Sem capacidade
        }

        double workloadScore = calculateWorkloadScore(ordersOnDate);

        // 4. Total Score (média ponderada)
        double totalScore = (skillScore * SKILL_WEIGHT) +
                (proximityScore * PROXIMITY_WEIGHT) +
                (workloadScore * WORKLOAD_WEIGHT);

        // 5. Estimar tempo de viagem
        MapsPort.DistanceResult distanceResult = mapsPort.getDistance(
                technician.getCurrentLocation(),
                request.customerLocation());

        return Optional.of(new TechnicianSuggestion(
                technician.getId(),
                technician.getUserId(),
                technician.getUser().getName(),
                technician.getSkills(),
                technician.getRating() != null ? technician.getRating().doubleValue() : 5.0,
                distanceResult.distanceKm(),
                distanceResult.durationMinutes(),
                ordersOnDate,
                skillScore,
                proximityScore,
                workloadScore,
                totalScore));
    }

    /**
     * Score de skills (0-100).
     * 100 = skills perfeitas, 0 = sem match
     */
    private double calculateSkillScore(Technician technician, ServiceCategory category) {
        if (technician.getSkills() == null || technician.getSkills().isEmpty()) {
            return 0;
        }
        if (category == null) return 0;

        String requiredSkill = category.getCode().toLowerCase();

        boolean hasSkill = technician.getSkills().stream()
                .anyMatch(skill -> skill.toLowerCase().contains(requiredSkill) ||
                        requiredSkill.contains(skill.toLowerCase()));

        // Skill exato = 100, GENERAL sempre aceito = 50
        if (hasSkill) {
            return 100.0;
        } else if (technician.getSkills().stream().anyMatch(s -> s.contains("general"))) {
            return 50.0;
        }

        return 0;
    }

    /**
     * Score de proximidade (0-100).
     * 0km = 100, maxRadiusKm = 0
     */
    private double calculateProximityScore(double distanceKm) {
        if (distanceKm <= 0)
            return 100.0;
        if (distanceKm >= maxRadiusKm)
            return 0.0;

        return 100.0 * (1.0 - (distanceKm / maxRadiusKm));
    }

    /**
     * Score de carga de trabalho (0-100).
     * 0 ordens = 100, maxOrdersPerDay = 0
     */
    private double calculateWorkloadScore(int ordersOnDate) {
        if (ordersOnDate >= maxOrdersPerDay)
            return 0.0;
        return 100.0 * (1.0 - ((double) ordersOnDate / maxOrdersPerDay));
    }

    /**
     * Conta ordens agendadas para um técnico em uma data.
     */
    private int getOrderCountForDate(UUID technicianId, LocalDate date) {
        return orderRepository.countByTechnicianIdAndScheduledDateAndStatusNot(
                technicianId, date, OsStatus.CANCELLED);
    }

    // ========== DTOs ==========

    public record DispatchRequest(
            ServiceCategory category,
            Point customerLocation,
            LocalDate date,
            UUID tenantId) {
    }

    public record TechnicianSuggestion(
            UUID technicianId,
            UUID userId,
            String name,
            List<String> skills,
            double rating,
            double distanceKm,
            int estimatedMinutes,
            int ordersToday,
            double skillScore,
            double proximityScore,
            double workloadScore,
            double totalScore) {
    }
}
