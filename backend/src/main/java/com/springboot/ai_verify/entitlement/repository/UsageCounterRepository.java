package com.springboot.ai_verify.entitlement.repository;

import com.springboot.ai_verify.entitlement.model.UsageCounter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface UsageCounterRepository extends JpaRepository<UsageCounter, Long> {

    Optional<UsageCounter> findByWorkspaceIdAndPeriodStartAndKind(Long workspaceId, Instant periodStart, String kind);

    List<UsageCounter> findByWorkspaceIdAndPeriodStart(Long workspaceId, Instant periodStart);

    @Modifying
    @Query("UPDATE UsageCounter u SET u.used = u.used + :qty, u.updatedAt = :now " +
           "WHERE u.workspaceId = :workspaceId AND u.periodStart = :periodStart AND u.kind = :kind " +
           "AND (u.quotaLimit < 0 OR (u.used + :qty) <= u.quotaLimit)")
    int incrementIfWithinLimit(
            @Param("workspaceId") Long workspaceId,
            @Param("periodStart") Instant periodStart,
            @Param("kind") String kind,
            @Param("qty") int qty,
            @Param("now") Instant now
    );

    @Modifying
    @Query("UPDATE UsageCounter u SET u.used = CASE WHEN (u.used - :qty) < 0 THEN 0 ELSE (u.used - :qty) END, u.updatedAt = :now " +
           "WHERE u.workspaceId = :workspaceId AND u.periodStart = :periodStart AND u.kind = :kind")
    int decrement(
            @Param("workspaceId") Long workspaceId,
            @Param("periodStart") Instant periodStart,
            @Param("kind") String kind,
            @Param("qty") int qty,
            @Param("now") Instant now
    );
}
