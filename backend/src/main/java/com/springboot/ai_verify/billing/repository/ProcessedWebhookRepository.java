package com.springboot.ai_verify.billing.repository;

import com.springboot.ai_verify.billing.model.ProcessedWebhook;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProcessedWebhookRepository extends JpaRepository<ProcessedWebhook, Long> {
    boolean existsByProviderEventId(String providerEventId);
}
