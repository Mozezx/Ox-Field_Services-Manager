package com.oxfield.services.application.service;

import com.oxfield.services.adapter.output.persistence.ClientInviteRepository;
import com.oxfield.services.domain.entity.ClientInvite;
import com.oxfield.services.shared.exception.BusinessException;
import com.oxfield.services.shared.exception.ErrorCode;
import jakarta.persistence.PersistenceException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Service for creating and resolving client invite links.
 */
@Service
public class ClientInviteService {

    private final ClientInviteRepository clientInviteRepository;

    @Value("${oxfield.client-app-base-url:http://localhost:3005}")
    private String clientAppBaseUrl;

    public ClientInviteService(ClientInviteRepository clientInviteRepository) {
        this.clientInviteRepository = clientInviteRepository;
    }

    @Transactional
    public ClientInviteResult createInvite(UUID tenantId) {
        UUID token = UUID.randomUUID();
        ClientInvite invite = new ClientInvite(tenantId, token);
        try {
            invite = clientInviteRepository.save(invite);
        } catch (PersistenceException | DataAccessException e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR,
                    "Could not create client invite link. The database may not be up to date. Restart the backend to run migrations (client_invites table). Detail: " + (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()));
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR,
                    "Could not create client invite link. The database may not be up to date. Restart the backend to run migrations (client_invites table). Detail: " + (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()));
        }

        String base = clientAppBaseUrl == null || clientAppBaseUrl.isEmpty()
                ? "http://localhost:3005"
                : (clientAppBaseUrl.endsWith("/") ? clientAppBaseUrl.substring(0, clientAppBaseUrl.length() - 1) : clientAppBaseUrl);
        String inviteLink = base + "/#/join/" + token.toString();

        return new ClientInviteResult(invite.getId(), invite.getToken(), inviteLink);
    }

    public record ClientInviteResult(UUID inviteId, UUID token, String inviteLink) {}
}
