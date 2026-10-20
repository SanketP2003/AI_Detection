package com.springboot.ai_verify.workspace.repository;

import com.springboot.ai_verify.workspace.model.Invitation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InvitationRepository extends JpaRepository<Invitation, Long> {
    Optional<Invitation> findByTokenHash(String tokenHash);
    List<Invitation> findByWorkspaceId(Long workspaceId);
    List<Invitation> findByWorkspaceIdAndAcceptedAtIsNull(Long workspaceId);
    long countByWorkspaceIdAndAcceptedAtIsNull(Long workspaceId);
    Optional<Invitation> findByWorkspaceIdAndEmailAndAcceptedAtIsNull(Long workspaceId, String email);
}
