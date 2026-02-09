package com.oxfield.services.adapter.output.persistence;

import com.oxfield.services.domain.entity.OrderChecklist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderChecklistRepository extends JpaRepository<OrderChecklist, UUID> {
    Optional<OrderChecklist> findByOrderId(UUID orderId);
}
