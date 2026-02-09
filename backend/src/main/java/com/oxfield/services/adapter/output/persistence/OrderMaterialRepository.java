package com.oxfield.services.adapter.output.persistence;

import com.oxfield.services.domain.entity.OrderMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrderMaterialRepository extends JpaRepository<OrderMaterial, UUID> {
    List<OrderMaterial> findByOrderId(UUID orderId);
}
