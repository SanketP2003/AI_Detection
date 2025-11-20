package com.springboot.ai_verify.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "detection_history")
public class DetectionHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;

    @Column(length = 255)
    private String contentPreview;

    private String result;

    private int confidence;

    private Instant createdAt = Instant.now();

    // No-args constructor required by JPA
    public DetectionHistory() {}

    // Explicit getters and setters to avoid reliance on Lombok
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getContentPreview() { return contentPreview; }
    public void setContentPreview(String contentPreview) { this.contentPreview = contentPreview; }

    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }

    public int getConfidence() { return confidence; }
    public void setConfidence(int confidence) { this.confidence = confidence; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
