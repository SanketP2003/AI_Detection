package com.springboot.ai_verify.billing.service;

import com.springboot.ai_verify.billing.dto.BillingWebhookEvent;

public interface BillingProvider {

    /**
     * Whether this billing provider is actively configured and enabled.
     */
    boolean isEnabled();

    /**
     * Create a Stripe Checkout Session for subscription checkout.
     */
    String createCheckoutSession(Long workspaceId,
                                 Long userId,
                                 String customerEmail,
                                 String existingCustomerId,
                                 String plan,
                                 String interval,
                                 int seats,
                                 String successUrl,
                                 String cancelUrl);

    /**
     * Create a Stripe Customer Portal session URL.
     */
    String createPortalSession(String customerId, String returnUrl);

    /**
     * Parse and cryptographically verify an incoming webhook payload using the provider signature.
     */
    BillingWebhookEvent parseAndVerifyWebhook(String payload, String signatureHeader);

    /**
     * Update subscription seat quantity in the provider if applicable.
     */
    void updateSubscriptionSeats(String providerSubscriptionId, int newSeats);
}
