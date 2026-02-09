package com.oxfield.services.domain.entity;

import com.oxfield.services.domain.enums.OsStatus;
import com.oxfield.services.domain.enums.PriorityLevel;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Entidade ServiceOrder - Ordem de Serviço.
 * Núcleo do sistema FSM.
 */
@Entity
@Table(name = "service_orders", uniqueConstraints = @UniqueConstraint(columnNames = { "tenant_id", "os_number" }))
public class ServiceOrder extends TenantAwareEntity {

    /**
     * Número da OS (formato: OS-XXXXX)
     * Gerado automaticamente por tenant
     */
    @Column(name = "os_number", nullable = false, length = 50)
    private String osNumber;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private ServiceCategory category;

    @Column(name = "category_id", insertable = false, updatable = false)
    private UUID categoryId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private OsStatus status = OsStatus.SCHEDULED;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false)
    private PriorityLevel priority = PriorityLevel.MEDIUM;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "customer_id", insertable = false, updatable = false)
    private UUID customerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "address_id", nullable = false)
    private CustomerAddress address;

    @Column(name = "address_id", insertable = false, updatable = false)
    private UUID addressId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "technician_id")
    private Technician technician;

    @Column(name = "technician_id", insertable = false, updatable = false)
    private UUID technicianId;

    @Column(name = "scheduled_date", nullable = false)
    private LocalDate scheduledDate;

    @Column(name = "scheduled_start", nullable = false)
    private LocalTime scheduledStart;

    @Column(name = "scheduled_duration", nullable = false)
    private Integer scheduledDuration; // em minutos

    @Column(name = "actual_start")
    private Instant actualStart;

    @Column(name = "actual_end")
    private Instant actualEnd;

    @Column(name = "estimated_price", precision = 10, scale = 2)
    private BigDecimal estimatedPrice;

    @Column(name = "final_price", precision = 10, scale = 2)
    private BigDecimal finalPrice;

    // Relacionamentos
    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private OrderChecklist checklist;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<OrderPhoto> photos = new ArrayList<>();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<OrderMaterial> materials = new ArrayList<>();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<OrderMessage> messages = new ArrayList<>();

    /**
     * Assinatura digital do cliente (base64 encoded PNG ou URL do arquivo)
     */
    @Column(name = "signature", columnDefinition = "TEXT")
    private String signature;

    /**
     * Token para partilhar link da OS com o cliente (acesso sem auth). Null após o cliente reclamar a ordem.
     */
    @Column(name = "share_token", unique = true)
    private UUID shareToken;

    // ========== Constructors ==========

    public ServiceOrder() {
    }

    public ServiceOrder(String title, ServiceCategory category, Customer customer, CustomerAddress address) {
        this.title = title;
        this.category = category;
        this.customer = customer;
        this.address = address;
        if (category != null) this.categoryId = category.getId();
    }

    // ========== Business Methods ==========

    /**
     * Gera o número da OS no formato OS-XXXXX
     */
    public static String generateOsNumber(long sequence) {
        return String.format("OS-%05d", sequence);
    }

    /**
     * Verifica se a OS pode iniciar (técnico chegou)
     */
    public boolean canStart() {
        return status == OsStatus.IN_ROUTE;
    }

    /**
     * Verifica se a OS pode ser completada
     */
    public boolean canComplete() {
        return status == OsStatus.IN_PROGRESS;
    }

    /**
     * Inicia a rota para o cliente
     */
    public void startRoute() {
        if (status != OsStatus.SCHEDULED) {
            throw new IllegalStateException("OS deve estar agendada para iniciar rota");
        }
        this.status = OsStatus.IN_ROUTE;
    }

    /**
     * Marca chegada no local
     */
    public void arrive() {
        if (status != OsStatus.IN_ROUTE) {
            throw new IllegalStateException("OS deve estar em rota para marcar chegada");
        }
        this.status = OsStatus.IN_PROGRESS;
        this.actualStart = Instant.now();
    }

    /**
     * Completa a OS
     */
    public void complete() {
        if (status != OsStatus.IN_PROGRESS) {
            throw new IllegalStateException("OS deve estar em progresso para completar");
        }
        this.status = OsStatus.COMPLETED;
        this.actualEnd = Instant.now();
    }

    /**
     * Cancela a OS
     */
    public void cancel() {
        if (status.isFinal()) {
            throw new IllegalStateException("OS já está em estado final");
        }
        this.status = OsStatus.CANCELLED;
    }

    /**
     * Adiciona foto à OS
     */
    public void addPhoto(OrderPhoto photo) {
        photos.add(photo);
        photo.setOrder(this);
    }

    /**
     * Adiciona material usado
     */
    public void addMaterial(OrderMaterial material) {
        materials.add(material);
        material.setOrder(this);
    }

    /**
     * Verifica se tem foto "AFTER"
     */
    public boolean hasAfterPhoto() {
        return photos.stream()
                .anyMatch(p -> p.getCaption() != null &&
                        p.getCaption().toUpperCase().contains("AFTER"));
    }

    // ========== Getters and Setters ==========

    public String getOsNumber() {
        return osNumber;
    }

    public void setOsNumber(String osNumber) {
        this.osNumber = osNumber;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public ServiceCategory getCategory() {
        return category;
    }

    public void setCategory(ServiceCategory category) {
        this.category = category;
        this.categoryId = category != null ? category.getId() : null;
    }

    public UUID getCategoryId() {
        return categoryId;
    }

    public OsStatus getStatus() {
        return status;
    }

    public void setStatus(OsStatus status) {
        this.status = status;
    }

    public PriorityLevel getPriority() {
        return priority;
    }

    public void setPriority(PriorityLevel priority) {
        this.priority = priority;
    }

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(Customer customer) {
        this.customer = customer;
    }

    public UUID getCustomerId() {
        return customerId;
    }

    public CustomerAddress getAddress() {
        return address;
    }

    public void setAddress(CustomerAddress address) {
        this.address = address;
    }

    public UUID getAddressId() {
        return addressId;
    }

    public Technician getTechnician() {
        return technician;
    }

    public void setTechnician(Technician technician) {
        this.technician = technician;
    }

    public UUID getTechnicianId() {
        return technicianId;
    }

    public UUID getShareToken() {
        return shareToken;
    }

    public void setShareToken(UUID shareToken) {
        this.shareToken = shareToken;
    }

    public LocalDate getScheduledDate() {
        return scheduledDate;
    }

    public void setScheduledDate(LocalDate scheduledDate) {
        this.scheduledDate = scheduledDate;
    }

    public LocalTime getScheduledStart() {
        return scheduledStart;
    }

    public void setScheduledStart(LocalTime scheduledStart) {
        this.scheduledStart = scheduledStart;
    }

    public Integer getScheduledDuration() {
        return scheduledDuration;
    }

    public void setScheduledDuration(Integer scheduledDuration) {
        this.scheduledDuration = scheduledDuration;
    }

    public Instant getActualStart() {
        return actualStart;
    }

    public void setActualStart(Instant actualStart) {
        this.actualStart = actualStart;
    }

    public Instant getActualEnd() {
        return actualEnd;
    }

    public void setActualEnd(Instant actualEnd) {
        this.actualEnd = actualEnd;
    }

    public BigDecimal getEstimatedPrice() {
        return estimatedPrice;
    }

    public void setEstimatedPrice(BigDecimal estimatedPrice) {
        this.estimatedPrice = estimatedPrice;
    }

    public BigDecimal getFinalPrice() {
        return finalPrice;
    }

    public void setFinalPrice(BigDecimal finalPrice) {
        this.finalPrice = finalPrice;
    }

    public OrderChecklist getChecklist() {
        return checklist;
    }

    public void setChecklist(OrderChecklist checklist) {
        this.checklist = checklist;
    }

    public List<OrderPhoto> getPhotos() {
        return photos;
    }

    public void setPhotos(List<OrderPhoto> photos) {
        this.photos = photos;
    }

    public List<OrderMaterial> getMaterials() {
        return materials;
    }

    public void setMaterials(List<OrderMaterial> materials) {
        this.materials = materials;
    }

    public List<OrderMessage> getMessages() {
        return messages;
    }

    public void setMessages(List<OrderMessage> messages) {
        this.messages = messages;
    }

    public String getSignature() {
        return signature;
    }

    public void setSignature(String signature) {
        this.signature = signature;
    }

    /**
     * Verifica se tem assinatura do cliente
     */
    public boolean hasSignature() {
        return signature != null && !signature.isEmpty();
    }
}
