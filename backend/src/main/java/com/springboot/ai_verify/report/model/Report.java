package com.springboot.ai_verify.report.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "reports", indexes = {
    @Index(name = "idx_reports_ws_created", columnList = "workspace_id, created_at")
})
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "workspace_id", nullable = false)
    private Long workspaceId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "detection_id")
    private Long detectionId;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Report() {}

    public Report(Long workspaceId, Long userId, Long detectionId, String title) {
        this.workspaceId = workspaceId;
        this.userId = userId;
        this.detectionId = detectionId;
        this.title = title;
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getWorkspaceId() { return workspaceId; }
    public void setWorkspaceId(Long workspaceId) { this.workspaceId = workspaceId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getDetectionId() { return detectionId; }
    public void setDetectionId(Long detectionId) { this.detectionId = detectionId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
