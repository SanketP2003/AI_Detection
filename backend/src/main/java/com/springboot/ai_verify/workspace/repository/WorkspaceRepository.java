package com.springboot.ai_verify.workspace.repository;

import com.springboot.ai_verify.workspace.model.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WorkspaceRepository extends JpaRepository<Workspace, Long> {
    Optional<Workspace> findBySlug(String slug);
    List<Workspace> findByOwnerUserId(Long ownerUserId);
}
