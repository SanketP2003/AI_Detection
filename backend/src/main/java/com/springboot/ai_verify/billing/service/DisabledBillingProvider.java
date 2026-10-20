package com.springboot.ai_verify.billing.service;

import com.springboot.ai_verify.billing.dto.BillingWebhookEvent;
import com.springboot.ai_verify.billing.exception.BillingUnavailableException;

public class DisabledBillingProvider implements BillingProvider {

    @Override
    public boolean isEnabled() {
        return false;
    }

    @Override
    public String createCheckoutSession(Long workspaceId,
                                         Long userId,
                                         String customerEmail,
                                         String existingCustomerId,
                                         String plan,
                                         String interval,
                                         int seats,
                                         String successUrl,
                                         String cancelUrl) {
        throw new BillingUnavailableException();
    }

    @Override
    public String createPortalSession(String customerId, String returnUrl) {
        throw new BillingUnavailableException();
    }

    @Override
    public BillingWebhookEvent parseAndVerifyWebhook(String payload, String signatureHeader) {
        throw new BillingUnavailableException();
    }

    @Override
    public void updateSubscriptionSeats(String providerSubscriptionId, int newSeats) {
        // No-op when billing is disabled
    }
}
