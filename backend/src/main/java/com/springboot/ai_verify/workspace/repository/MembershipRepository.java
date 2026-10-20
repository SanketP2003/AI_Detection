package com.springboot.ai_verify.workspace.repository;

import com.springboot.ai_verify.workspace.model.Membership;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MembershipRepository extends JpaRepository<Membership, Long> {
    Optional<Membership> findByWorkspaceIdAndUserId(Long workspaceId, Long userId);
    List<Membership> findByUserId(Long userId);
    List<Membership> findByWorkspaceId(Long workspaceId);
    boolean existsByWorkspaceIdAndUserId(Long workspaceId, Long userId);
    long countByWorkspaceId(Long workspaceId);
    void deleteByWorkspaceIdAndUserId(Long workspaceId, Long userId);
    void deleteByWorkspaceId(Long workspaceId);
}
