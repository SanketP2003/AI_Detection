package com.springboot.ai_verify.billing.service;

import com.springboot.ai_verify.billing.config.BillingProperties;
import com.springboot.ai_verify.billing.dto.BillingWebhookEvent;
import com.springboot.ai_verify.billing.exception.BillingException;
import com.springboot.ai_verify.billing.exception.BillingUnavailableException;
import com.springboot.ai_verify.billing.model.SubscriptionStatus;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.Invoice;
import com.stripe.model.StripeObject;
import com.stripe.model.Subscription;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.billingportal.SessionCreateParams;
import com.stripe.param.checkout.SessionCreateParams.LineItem;
import com.stripe.param.checkout.SessionCreateParams.Mode;
import com.stripe.param.checkout.SessionCreateParams.SubscriptionData;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.Optional;

public class StripeBillingProvider implements BillingProvider {

    private static final Logger log = LoggerFactory.getLogger(StripeBillingProvider.class);

    private final BillingProperties properties;

    public StripeBillingProvider(BillingProperties properties) {
        this.properties = properties;
        if (properties.getStripe() != null && properties.getStripe().getSecretKey() != null
                && !properties.getStripe().getSecretKey().isBlank()) {
            Stripe.apiKey = properties.getStripe().getSecretKey();
        }
    }

    @Override
    public boolean isEnabled() {
        return properties.isEnabled()
                && properties.getStripe() != null
                && properties.getStripe().getSecretKey() != null
                && !properties.getStripe().getSecretKey().isBlank();
    }

    private void ensureEnabled() {
        if (!isEnabled()) {
            throw new BillingUnavailableException();
        }
        Stripe.apiKey = properties.getStripe().getSecretKey();
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
        ensureEnabled();

        String priceId = resolvePriceId(plan, interval);
        if (priceId == null || priceId.isBlank()) {
            throw new BillingException("No price configured for plan: " + plan + ", interval: " + interval);
        }

        String resolvedSuccessUrl = (successUrl != null && !successUrl.isBlank())
                ? successUrl
                : properties.getPublicUrl() + "/settings?tab=billing&session_id={CHECKOUT_SESSION_ID}";

        String resolvedCancelUrl = (cancelUrl != null && !cancelUrl.isBlank())
                ? cancelUrl
                : properties.getPublicUrl() + "/pricing";

        int quantity = Math.max(1, seats);

        com.stripe.param.checkout.SessionCreateParams.Builder builder =
                com.stripe.param.checkout.SessionCreateParams.builder()
                        .setMode(Mode.SUBSCRIPTION)
                        .setClientReferenceId(workspaceId.toString())
                        .setSuccessUrl(resolvedSuccessUrl)
                        .setCancelUrl(resolvedCancelUrl)
                        .putMetadata("workspace_id", workspaceId.toString())
                        .putMetadata("user_id", userId != null ? userId.toString() : "")
                        .putMetadata("plan", plan.toUpperCase());

        if (existingCustomerId != null && !existingCustomerId.isBlank()) {
            builder.setCustomer(existingCustomerId);
        } else if (customerEmail != null && !customerEmail.isBlank()) {
            builder.setCustomerEmail(customerEmail);
        }

        builder.addLineItem(
                LineItem.builder()
                        .setPrice(priceId)
                        .setQuantity((long) quantity)
                        .build()
        );

        SubscriptionData.Builder subDataBuilder = SubscriptionData.builder()
                .putMetadata("workspace_id", workspaceId.toString())
                .putMetadata("plan", plan.toUpperCase());

        if (properties.getTrialDays() > 0) {
            subDataBuilder.setTrialPeriodDays((long) properties.getTrialDays());
        }

        builder.setSubscriptionData(subDataBuilder.build());

        try {
            Session session = Session.create(builder.build());
            return session.getUrl();
        } catch (StripeException e) {
            log.error("Failed to create Stripe Checkout session: {}", e.getMessage(), e);
            throw new BillingException("Failed to initiate checkout: " + e.getMessage(), e);
        }
    }

    @Override
    public String createPortalSession(String customerId, String returnUrl) {
        ensureEnabled();

        if (customerId == null || customerId.isBlank()) {
            throw new BillingException("No billing customer associated with workspace");
        }

        String resolvedReturnUrl = (returnUrl != null && !returnUrl.isBlank())
                ? returnUrl
                : properties.getPublicUrl() + "/settings?tab=billing";

        SessionCreateParams.Builder builder = SessionCreateParams.builder()
                .setCustomer(customerId)
                .setReturnUrl(resolvedReturnUrl);

        if (properties.getStripe().getPortalConfigurationId() != null
                && !properties.getStripe().getPortalConfigurationId().isBlank()) {
            builder.setConfiguration(properties.getStripe().getPortalConfigurationId());
        }

        try {
            com.stripe.model.billingportal.Session session =
                    com.stripe.model.billingportal.Session.create(builder.build());
            return session.getUrl();
        } catch (StripeException e) {
            log.error("Failed to create Stripe Customer Portal session: {}", e.getMessage(), e);
            throw new BillingException("Failed to open billing portal: " + e.getMessage(), e);
        }
    }

    @Override
    public BillingWebhookEvent parseAndVerifyWebhook(String payload, String signatureHeader) {
        String webhookSecret = properties.getStripe() != null ? properties.getStripe().getWebhookSecret() : null;
        if (webhookSecret == null || webhookSecret.isBlank()) {
            throw new BillingException("Webhook secret is not configured");
        }
        if (signatureHeader == null || signatureHeader.isBlank()) {
            throw new BillingException("Missing Stripe-Signature header");
        }

        Event event;
        try {
            event = Webhook.constructEvent(payload, signatureHeader, webhookSecret);
        } catch (SignatureVerificationException e) {
            log.warn("Invalid webhook signature: {}", e.getMessage());
            throw new BillingException("Invalid webhook signature: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Webhook construction error: {}", e.getMessage(), e);
            throw new BillingException("Webhook processing error: " + e.getMessage(), e);
        }

        return normalizeEvent(event);
    }

    public BillingWebhookEvent normalizeEvent(Event event) {
        BillingWebhookEvent dto = new BillingWebhookEvent();
        dto.setEventId(event.getId());
        dto.setEventType(event.getType());

        EventDataObjectDeserializer deserializer = event.getDataObjectDeserializer();
        Optional<StripeObject> stripeObjectOpt = deserializer.getObject();
        StripeObject stripeObject = stripeObjectOpt.orElse(null);

        if ("checkout.session.completed".equals(event.getType())) {
            if (stripeObject instanceof Session session) {
                if (session.getClientReferenceId() != null) {
                    try {
                        dto.setWorkspaceId(Long.parseLong(session.getClientReferenceId()));
                    } catch (NumberFormatException ignored) {}
                }
                if (dto.getWorkspaceId() == null && session.getMetadata() != null && session.getMetadata().containsKey("workspace_id")) {
                    try {
                        dto.setWorkspaceId(Long.parseLong(session.getMetadata().get("workspace_id")));
                    } catch (NumberFormatException ignored) {}
                }
                dto.setCustomerId(session.getCustomer());
                dto.setSubscriptionId(session.getSubscription());
                if (session.getMetadata() != null && session.getMetadata().containsKey("plan")) {
                    dto.setPlan(session.getMetadata().get("plan").toUpperCase());
                }
            }
        } else if (event.getType() != null && event.getType().startsWith("customer.subscription.")) {
            if (stripeObject instanceof Subscription sub) {
                dto.setSubscriptionId(sub.getId());
                dto.setCustomerId(sub.getCustomer());
                if (sub.getMetadata() != null && sub.getMetadata().containsKey("workspace_id")) {
                    try {
                        dto.setWorkspaceId(Long.parseLong(sub.getMetadata().get("workspace_id")));
                    } catch (NumberFormatException ignored) {}
                }
                if (sub.getMetadata() != null && sub.getMetadata().containsKey("plan")) {
                    dto.setPlan(sub.getMetadata().get("plan").toUpperCase());
                }
                dto.setStatus(mapSubscriptionStatus(sub.getStatus()));
                if (sub.getCurrentPeriodStart() != null) {
                    dto.setCurrentPeriodStart(Instant.ofEpochSecond(sub.getCurrentPeriodStart()));
                }
                if (sub.getCurrentPeriodEnd() != null) {
                    dto.setCurrentPeriodEnd(Instant.ofEpochSecond(sub.getCurrentPeriodEnd()));
                }
                dto.setCancelAtPeriodEnd(Boolean.TRUE.equals(sub.getCancelAtPeriodEnd()));
                if (sub.getTrialEnd() != null) {
                    dto.setTrialEnd(Instant.ofEpochSecond(sub.getTrialEnd()));
                }
                if (sub.getItems() != null && sub.getItems().getData() != null && !sub.getItems().getData().isEmpty()) {
                    Long qty = sub.getItems().getData().get(0).getQuantity();
                    dto.setSeats(qty != null ? qty.intValue() : 1);
                } else {
                    dto.setSeats(1);
                }
            }
        } else if (event.getType() != null && event.getType().startsWith("invoice.")) {
            if (stripeObject instanceof Invoice inv) {
                dto.setInvoiceId(inv.getId());
                dto.setInvoiceNumber(inv.getNumber());
                Long amount = inv.getAmountPaid() != null && inv.getAmountPaid() > 0 ? inv.getAmountPaid() : inv.getAmountDue();
                dto.setAmountCents(amount != null ? amount.intValue() : 0);
                dto.setCurrency(inv.getCurrency() != null ? inv.getCurrency() : "usd");
                dto.setInvoiceStatus(inv.getStatus() != null ? inv.getStatus() : "paid");
                dto.setHostedInvoiceUrl(inv.getHostedInvoiceUrl());
                dto.setPdfUrl(inv.getInvoicePdf());
                dto.setCustomerId(inv.getCustomer());
                dto.setSubscriptionId(inv.getSubscription());
                if (inv.getPeriodStart() != null) {
                    dto.setInvoicePeriodStart(Instant.ofEpochSecond(inv.getPeriodStart()));
                }
                if (inv.getPeriodEnd() != null) {
                    dto.setInvoicePeriodEnd(Instant.ofEpochSecond(inv.getPeriodEnd()));
                }
                if (inv.getMetadata() != null && inv.getMetadata().containsKey("workspace_id")) {
                    try {
                        dto.setWorkspaceId(Long.parseLong(inv.getMetadata().get("workspace_id")));
                    } catch (NumberFormatException ignored) {}
                }
            }
        }

        return dto;
    }

    private SubscriptionStatus mapSubscriptionStatus(String status) {
        if (status == null) return SubscriptionStatus.ACTIVE;
        return switch (status.toLowerCase()) {
            case "trialing" -> SubscriptionStatus.TRIALING;
            case "active" -> SubscriptionStatus.ACTIVE;
            case "past_due" -> SubscriptionStatus.PAST_DUE;
            case "canceled" -> SubscriptionStatus.CANCELED;
            case "unpaid" -> SubscriptionStatus.UNPAID;
            case "incomplete", "incomplete_expired" -> SubscriptionStatus.INCOMPLETE;
            default -> SubscriptionStatus.ACTIVE;
        };
    }

    private String resolvePriceId(String plan, String interval) {
        if (plan == null) return null;
        String cleanPlan = plan.trim().toUpperCase();
        String cleanInterval = interval != null ? interval.trim().toLowerCase() : "monthly";

        BillingProperties.StripeProperties stripe = properties.getStripe();
        if (stripe == null) return null;

        if ("PRO".equals(cleanPlan)) {
            if ("yearly".equals(cleanInterval) || "annual".equals(cleanInterval)) {
                return stripe.getPriceProYearly();
            }
            return stripe.getPriceProMonthly();
        } else if ("TEAM".equals(cleanPlan)) {
            return stripe.getPriceTeamMonthly();
        }
        return null;
    }

    @Override
    public void updateSubscriptionSeats(String providerSubscriptionId, int newSeats) {
        if (!isEnabled() || providerSubscriptionId == null || providerSubscriptionId.isBlank()) {
            return;
        }
        try {
            ensureEnabled();
            Subscription sub = Subscription.retrieve(providerSubscriptionId);
            if (sub != null && sub.getItems() != null && !sub.getItems().getData().isEmpty()) {
                var firstItem = sub.getItems().getData().get(0);
                com.stripe.param.SubscriptionUpdateParams params = com.stripe.param.SubscriptionUpdateParams.builder()
                        .addItem(com.stripe.param.SubscriptionUpdateParams.Item.builder()
                                .setId(firstItem.getId())
                                .setQuantity((long) newSeats)
                                .build())
                        .setProrationBehavior(com.stripe.param.SubscriptionUpdateParams.ProrationBehavior.ALWAYS_INVOICE)
                        .build();
                sub.update(params);
                log.info("Updated Stripe subscription {} seats to {}", providerSubscriptionId, newSeats);
            }
        } catch (StripeException e) {
            log.error("Failed to update Stripe subscription seats for {}: {}", providerSubscriptionId, e.getMessage(), e);
            throw new BillingException("Failed to update billing seats: " + e.getMessage(), e);
        }
    }
}
