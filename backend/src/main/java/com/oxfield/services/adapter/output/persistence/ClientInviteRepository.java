package com.oxfield.services.adapter.output.persistence;

import com.oxfield.services.domain.entity.ClientInvite;
import com.oxfield.services.domain.enums.InviteStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClientInviteRepository extends JpaRepository<ClientInvite, UUID> {

    Optional<ClientInvite> findByToken(UUID token);

    List<ClientInvite> findByTenantIdAndStatusOrderByCreatedAtDesc(UUID tenantId, InviteStatus status);
}
