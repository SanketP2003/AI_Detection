package com.springboot.ai_verify.billing.repository;

import com.springboot.ai_verify.billing.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    Optional<Subscription> findByWorkspaceId(Long workspaceId);
    Optional<Subscription> findByProviderCustomerId(String providerCustomerId);
    Optional<Subscription> findByProviderSubscriptionId(String providerSubscriptionId);
}
