package com.springboot.ai_verify.entitlement.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "usage_events", indexes = {
    @Index(name = "idx_usage_events_ws_kind_created", columnList = "workspace_id, kind, created_at")
})
public class UsageEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "workspace_id", nullable = false)
    private Long workspaceId;

    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false, length = 50)
    private String kind; // e.g., "scans", "advisor_messages"

    @Column(nullable = false)
    private Integer quantity = 1;

    @Column(name = "request_id", length = 100)
    private String requestId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public UsageEvent() {}

    public UsageEvent(Long workspaceId, Long userId, String kind, Integer quantity, String requestId) {
        this.workspaceId = workspaceId;
        this.userId = userId;
        this.kind = kind;
        this.quantity = quantity != null ? quantity : 1;
        this.requestId = requestId;
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getWorkspaceId() { return workspaceId; }
    public void setWorkspaceId(Long workspaceId) { this.workspaceId = workspaceId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getKind() { return kind; }
    public void setKind(String kind) { this.kind = kind; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public String getRequestId() { return requestId; }
    public void setRequestId(String requestId) { this.requestId = requestId; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
