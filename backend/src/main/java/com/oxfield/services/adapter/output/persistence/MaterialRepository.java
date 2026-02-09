package com.oxfield.services.adapter.output.persistence;

import com.oxfield.services.domain.entity.Material;
import com.oxfield.services.domain.enums.MaterialCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositório JPA para Material.
 */
@Repository
public interface MaterialRepository extends JpaRepository<Material, UUID> {

    Optional<Material> findBySku(String sku);

    boolean existsBySku(String sku);

    List<Material> findByCategory(MaterialCategory category);

    List<Material> findByStockQuantityLessThan(Integer threshold);
}
