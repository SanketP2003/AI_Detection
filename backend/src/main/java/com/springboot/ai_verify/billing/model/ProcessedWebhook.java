package com.springboot.ai_verify.billing.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "processed_webhooks")
public class ProcessedWebhook {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "provider_event_id", nullable = false, unique = true, length = 255)
    private String providerEventId;

    @Column(name = "processed_at", nullable = false, updatable = false)
    private Instant processedAt = Instant.now();

    public ProcessedWebhook() {}

    public ProcessedWebhook(String providerEventId) {
        this.providerEventId = providerEventId;
        this.processedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getProviderEventId() { return providerEventId; }
    public void setProviderEventId(String providerEventId) { this.providerEventId = providerEventId; }

    public Instant getProcessedAt() { return processedAt; }
    public void setProcessedAt(Instant processedAt) { this.processedAt = processedAt; }
}
