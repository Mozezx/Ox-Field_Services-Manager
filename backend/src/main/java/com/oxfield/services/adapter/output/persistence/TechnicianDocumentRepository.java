package com.oxfield.services.adapter.output.persistence;

import com.oxfield.services.domain.entity.TechnicianDocument;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TechnicianDocumentRepository extends JpaRepository<TechnicianDocument, UUID> {

    List<TechnicianDocument> findByTechnicianIdOrderByCreatedAtDesc(UUID technicianId);
}
