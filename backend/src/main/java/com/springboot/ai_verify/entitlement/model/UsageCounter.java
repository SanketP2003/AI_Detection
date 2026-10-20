package com.springboot.ai_verify.entitlement.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "usage_counters", uniqueConstraints = {
    @UniqueConstraint(name = "uq_usage_counters_ws_period_kind", columnNames = {"workspace_id", "period_start", "kind"})
}, indexes = {
    @Index(name = "idx_usage_counters_ws_period", columnList = "workspace_id, period_start")
})
public class UsageCounter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "workspace_id", nullable = false)
    private Long workspaceId;

    @Column(name = "period_start", nullable = false)
    private Instant periodStart;

    @Column(nullable = false, length = 50)
    private String kind;

    @Column(nullable = false)
    private Integer used = 0;

    @Column(name = "quota_limit", nullable = false)
    private Integer quotaLimit;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public UsageCounter() {}

    public UsageCounter(Long workspaceId, Instant periodStart, String kind, Integer used, Integer quotaLimit) {
        this.workspaceId = workspaceId;
        this.periodStart = periodStart;
        this.kind = kind;
        this.used = used != null ? used : 0;
        this.quotaLimit = quotaLimit;
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getWorkspaceId() { return workspaceId; }
    public void setWorkspaceId(Long workspaceId) { this.workspaceId = workspaceId; }

    public Instant getPeriodStart() { return periodStart; }
    public void setPeriodStart(Instant periodStart) { this.periodStart = periodStart; }

    public String getKind() { return kind; }
    public void setKind(String kind) { this.kind = kind; }

    public Integer getUsed() { return used; }
    public void setUsed(Integer used) { this.used = used; }

    public Integer getQuotaLimit() { return quotaLimit; }
    public void setQuotaLimit(Integer quotaLimit) { this.quotaLimit = quotaLimit; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
