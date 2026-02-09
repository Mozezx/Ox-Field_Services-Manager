package com.oxfield.services.adapter.output.persistence;

import com.oxfield.services.domain.entity.TechnicianInvite;
import com.oxfield.services.domain.enums.InviteStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TechnicianInviteRepository extends JpaRepository<TechnicianInvite, UUID> {

    Optional<TechnicianInvite> findByToken(UUID token);

    List<TechnicianInvite> findByTenantIdAndStatusOrderByCreatedAtDesc(UUID tenantId, InviteStatus status);
}
