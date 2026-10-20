package com.springboot.ai_verify.entitlement.repository;

import com.springboot.ai_verify.entitlement.model.UsageEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface UsageEventRepository extends JpaRepository<UsageEvent, Long> {
    List<UsageEvent> findByWorkspaceIdAndKindAndCreatedAtBetween(
            Long workspaceId, String kind, Instant start, Instant end
    );
}
