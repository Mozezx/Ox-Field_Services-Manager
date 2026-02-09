package com.oxfield.services.domain.entity;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import org.hibernate.annotations.Type;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Entidade OrderChecklist - checklist de itens a verificar na OS.
 * Os itens são armazenados como JSONB para flexibilidade.
 */
@Entity
@Table(name = "order_checklists")
public class OrderChecklist extends TenantAwareEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private ServiceOrder order;

    @Column(name = "order_id", insertable = false, updatable = false)
    private UUID orderId;

    /**
     * Itens do checklist no formato JSONB:
     * [
     * {"id": 1, "text": "Verificar conexões", "done": true},
     * {"id": 2, "text": "Testar funcionamento", "done": false}
     * ]
     */
    @Type(JsonType.class)
    @Column(name = "items", columnDefinition = "jsonb", nullable = false)
    private List<Map<String, Object>> items = new ArrayList<>();

    // ========== Constructors ==========

    public OrderChecklist() {
    }

    public OrderChecklist(ServiceOrder order, List<Map<String, Object>> items) {
        this.order = order;
        this.items = items;
    }

    // ========== Business Methods ==========

    /**
     * Verifica se todos os itens estão completos
     */
    public boolean isAllCompleted() {
        if (items == null || items.isEmpty()) {
            return true;
        }
        return items.stream()
                .allMatch(item -> Boolean.TRUE.equals(item.get("done")));
    }

    /**
     * Retorna a porcentagem de conclusão
     */
    public int getCompletionPercentage() {
        if (items == null || items.isEmpty()) {
            return 100;
        }
        long completed = items.stream()
                .filter(item -> Boolean.TRUE.equals(item.get("done")))
                .count();
        return (int) ((completed * 100) / items.size());
    }

    /**
     * Retorna contagem de itens completos
     */
    public int getCompletedCount() {
        return (int) items.stream()
                .filter(item -> Boolean.TRUE.equals(item.get("done")))
                .count();
    }

    /**
     * Retorna total de itens
     */
    public int getTotalCount() {
        return items.size();
    }

    /**
     * Marca um item como completo
     */
    public void markItemComplete(int itemId) {
        items.stream()
                .filter(item -> itemId == ((Number) item.get("id")).intValue())
                .findFirst()
                .ifPresent(item -> item.put("done", true));
    }

    // ========== Getters and Setters ==========

    public ServiceOrder getOrder() {
        return order;
    }

    public void setOrder(ServiceOrder order) {
        this.order = order;
    }

    public UUID getOrderId() {
        return orderId;
    }

    public List<Map<String, Object>> getItems() {
        return items;
    }

    public void setItems(List<Map<String, Object>> items) {
        this.items = items;
    }
}
