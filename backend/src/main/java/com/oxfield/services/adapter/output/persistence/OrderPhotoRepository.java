package com.oxfield.services.adapter.output.persistence;

import com.oxfield.services.domain.entity.OrderPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrderPhotoRepository extends JpaRepository<OrderPhoto, UUID> {
    List<OrderPhoto> findByOrderId(UUID orderId);
}
