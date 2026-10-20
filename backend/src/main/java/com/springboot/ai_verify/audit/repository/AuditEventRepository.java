package com.springboot.ai_verify.audit.repository;

import com.springboot.ai_verify.audit.model.AuditEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditEventRepository extends JpaRepository<AuditEvent, Long> {
    List<AuditEvent> findByWorkspaceIdOrderByCreatedAtDesc(Long workspaceId);
}
