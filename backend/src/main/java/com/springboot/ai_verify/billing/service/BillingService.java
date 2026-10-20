package com.springboot.ai_verify.billing.service;

import com.springboot.ai_verify.audit.model.AuditEvent;
import com.springboot.ai_verify.audit.repository.AuditEventRepository;
import com.springboot.ai_verify.billing.dto.BillingWebhookEvent;
import com.springboot.ai_verify.billing.dto.CheckoutRequest;
import com.springboot.ai_verify.billing.dto.InvoiceDto;
import com.springboot.ai_verify.billing.dto.PortalRequest;
import com.springboot.ai_verify.billing.exception.BillingException;
import com.springboot.ai_verify.billing.model.BillingInvoice;
import com.springboot.ai_verify.billing.model.ProcessedWebhook;
import com.springboot.ai_verify.billing.model.Subscription;
import com.springboot.ai_verify.billing.model.SubscriptionStatus;
import com.springboot.ai_verify.billing.repository.BillingInvoiceRepository;
import com.springboot.ai_verify.billing.repository.ProcessedWebhookRepository;
import com.springboot.ai_verify.billing.repository.SubscriptionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Service
public class BillingService {

    private static final Logger log = LoggerFactory.getLogger(BillingService.class);

    private final BillingProvider billingProvider;
    private final SubscriptionRepository subscriptionRepository;
    private final ProcessedWebhookRepository processedWebhookRepository;
    private final BillingInvoiceRepository billingInvoiceRepository;
    private final AuditEventRepository auditEventRepository;

    public BillingService(BillingProvider billingProvider,
                          SubscriptionRepository subscriptionRepository,
                          ProcessedWebhookRepository processedWebhookRepository,
                          BillingInvoiceRepository billingInvoiceRepository,
                          AuditEventRepository auditEventRepository) {
        this.billingProvider = billingProvider;
        this.subscriptionRepository = subscriptionRepository;
        this.processedWebhookRepository = processedWebhookRepository;
        this.billingInvoiceRepository = billingInvoiceRepository;
        this.auditEventRepository = auditEventRepository;
    }

    public boolean isBillingEnabled() {
        return billingProvider.isEnabled();
    }

    public String createCheckoutSession(Long workspaceId,
                                         Long userId,
                                         String customerEmail,
                                         CheckoutRequest request) {
        Subscription sub = subscriptionRepository.findByWorkspaceId(workspaceId).orElse(null);
        String existingCustomerId = sub != null ? sub.getProviderCustomerId() : null;

        return billingProvider.createCheckoutSession(
                workspaceId,
                userId,
                customerEmail,
                existingCustomerId,
                request.getPlan(),
                request.getInterval(),
                request.getSeats() != null ? request.getSeats() : 1,
                request.getSuccessUrl(),
                request.getCancelUrl()
        );
    }

    public String createPortalSession(Long workspaceId, PortalRequest request) {
        Subscription sub = subscriptionRepository.findByWorkspaceId(workspaceId)
                .orElseThrow(() -> new BillingException("No subscription found for workspace"));

        if (sub.getProviderCustomerId() == null || sub.getProviderCustomerId().isBlank()) {
            throw new BillingException("No billing customer associated with workspace");
        }

        String returnUrl = request != null ? request.getReturnUrl() : null;
        return billingProvider.createPortalSession(sub.getProviderCustomerId(), returnUrl);
    }

    @Transactional
    public void processWebhook(String payload, String signatureHeader) {
        BillingWebhookEvent event = billingProvider.parseAndVerifyWebhook(payload, signatureHeader);
        if (event == null || event.getEventId() == null) {
            log.warn("Received empty or unidentifiable webhook event; ignoring");
            return;
        }

        // Idempotency check: Reject duplicate replays
        if (processedWebhookRepository.existsByProviderEventId(event.getEventId())) {
            log.info("Webhook event {} already processed; skipping (idempotent no-op)", event.getEventId());
            return;
        }

        log.info("Processing webhook event: id={}, type={}", event.getEventId(), event.getEventType());
        handleEvent(event);

        try {
            processedWebhookRepository.save(new ProcessedWebhook(event.getEventId()));
        } catch (DataIntegrityViolationException e) {
            log.info("Webhook event {} was concurrently persisted by another thread; idempotent duplicate ignored", event.getEventId());
        }
    }

    private void handleEvent(BillingWebhookEvent event) {
        String type = event.getEventType();
        if (type == null) return;

        switch (type) {
            case "checkout.session.completed" -> handleCheckoutSessionCompleted(event);
            case "customer.subscription.created", "customer.subscription.updated" -> handleSubscriptionUpsert(event);
            case "customer.subscription.deleted" -> handleSubscriptionDeleted(event);
            case "invoice.paid" -> handleInvoicePaid(event);
            case "invoice.payment_failed" -> handleInvoicePaymentFailed(event);
            default -> log.debug("Unhandled webhook event type: {}", type);
        }
    }

    private void handleCheckoutSessionCompleted(BillingWebhookEvent event) {
        Long workspaceId = event.getWorkspaceId();
        if (workspaceId == null) {
            log.warn("Checkout session completed without workspace ID in metadata or client reference");
            return;
        }

        Subscription sub = subscriptionRepository.findByWorkspaceId(workspaceId)
                .orElseGet(() -> new Subscription(workspaceId, event.getPlan() != null ? event.getPlan() : "PRO"));

        if (event.getCustomerId() != null) {
            sub.setProviderCustomerId(event.getCustomerId());
        }
        if (event.getSubscriptionId() != null) {
            sub.setProviderSubscriptionId(event.getSubscriptionId());
        }
        if (event.getPlan() != null) {
            sub.setPlan(event.getPlan());
        }
        sub.setStatus(SubscriptionStatus.ACTIVE);
        subscriptionRepository.save(sub);

        auditEventRepository.save(new AuditEvent(
                workspaceId,
                null,
                "BILLING_CHECKOUT_COMPLETED",
                "workspace:" + workspaceId,
                "Plan: " + sub.getPlan() + ", Customer: " + sub.getProviderCustomerId()
        ));
        log.info("Linked checkout session to workspace {}: plan={}", workspaceId, sub.getPlan());
    }

    private void handleSubscriptionUpsert(BillingWebhookEvent event) {
        Subscription sub = resolveSubscription(event);
        if (sub == null) {
            log.warn("Could not find subscription to update for event: id={}, subId={}, customerId={}, wsId={}",
                    event.getEventId(), event.getSubscriptionId(), event.getCustomerId(), event.getWorkspaceId());
            return;
        }

        if (event.getPlan() != null) {
            sub.setPlan(event.getPlan());
        }
        if (event.getStatus() != null) {
            sub.setStatus(event.getStatus());
        }
        if (event.getCurrentPeriodStart() != null) {
            sub.setCurrentPeriodStart(event.getCurrentPeriodStart());
        }
        if (event.getCurrentPeriodEnd() != null) {
            sub.setCurrentPeriodEnd(event.getCurrentPeriodEnd());
        }
        if (event.getCancelAtPeriodEnd() != null) {
            sub.setCancelAtPeriodEnd(event.getCancelAtPeriodEnd());
        }
        if (event.getTrialEnd() != null) {
            sub.setTrialEnd(event.getTrialEnd());
        }
        if (event.getSeats() != null) {
            sub.setSeats(event.getSeats());
        }
        subscriptionRepository.save(sub);

        auditEventRepository.save(new AuditEvent(
                sub.getWorkspaceId(),
                null,
                "SUBSCRIPTION_UPDATED",
                "subscription:" + sub.getId(),
                "Status: " + sub.getStatus() + ", Plan: " + sub.getPlan()
        ));
        log.info("Updated subscription for workspace {}: status={}, plan={}",
                sub.getWorkspaceId(), sub.getStatus(), sub.getPlan());
    }

    private void handleSubscriptionDeleted(BillingWebhookEvent event) {
        Subscription sub = resolveSubscription(event);
        if (sub == null) {
            log.warn("Could not find subscription to delete for subId={}", event.getSubscriptionId());
            return;
        }

        // Never revoke mid-period: if periodEnd is in the future, retain access until then.
        Instant now = Instant.now();
        if (sub.getCurrentPeriodEnd() != null && sub.getCurrentPeriodEnd().isAfter(now)) {
            sub.setStatus(SubscriptionStatus.CANCELED);
            sub.setCancelAtPeriodEnd(true);
            log.info("Subscription canceled for workspace {}; access retained until period end {}",
                    sub.getWorkspaceId(), sub.getCurrentPeriodEnd());
        } else {
            sub.setPlan("FREE");
            sub.setStatus(SubscriptionStatus.ACTIVE);
            sub.setCancelAtPeriodEnd(false);
            log.info("Subscription ended for workspace {}; downgraded to FREE", sub.getWorkspaceId());
        }
        subscriptionRepository.save(sub);

        auditEventRepository.save(new AuditEvent(
                sub.getWorkspaceId(),
                null,
                "SUBSCRIPTION_CANCELED",
                "subscription:" + sub.getId(),
                "Period end: " + sub.getCurrentPeriodEnd()
        ));
    }

    private void handleInvoicePaid(BillingWebhookEvent event) {
        Long workspaceId = resolveWorkspaceIdForInvoice(event);
        if (workspaceId == null) {
            log.warn("Could not find workspace for invoice event: invoiceId={}", event.getInvoiceId());
            return;
        }

        BillingInvoice invoice = billingInvoiceRepository.findByProviderInvoiceId(event.getInvoiceId())
                .orElseGet(BillingInvoice::new);

        invoice.setWorkspaceId(workspaceId);
        invoice.setProviderInvoiceId(event.getInvoiceId());
        invoice.setInvoiceNumber(event.getInvoiceNumber());
        invoice.setAmountCents(event.getAmountCents() != null ? event.getAmountCents() : 0);
        invoice.setCurrency(event.getCurrency() != null ? event.getCurrency() : "usd");
        invoice.setStatus("paid");
        invoice.setHostedInvoiceUrl(event.getHostedInvoiceUrl());
        invoice.setPdfUrl(event.getPdfUrl());
        invoice.setPeriodStart(event.getInvoicePeriodStart());
        invoice.setPeriodEnd(event.getInvoicePeriodEnd());

        billingInvoiceRepository.save(invoice);

        // If subscription was PAST_DUE, restore to ACTIVE
        subscriptionRepository.findByWorkspaceId(workspaceId).ifPresent(sub -> {
            if (sub.getStatus() == SubscriptionStatus.PAST_DUE || sub.getStatus() == SubscriptionStatus.UNPAID) {
                sub.setStatus(SubscriptionStatus.ACTIVE);
                subscriptionRepository.save(sub);
                log.info("Restored subscription for workspace {} to ACTIVE following paid invoice", workspaceId);
            }
        });

        log.info("Persisted paid invoice {} for workspace {}", event.getInvoiceNumber(), workspaceId);
    }

    private void handleInvoicePaymentFailed(BillingWebhookEvent event) {
        Long workspaceId = resolveWorkspaceIdForInvoice(event);
        if (workspaceId == null) {
            log.warn("Could not find workspace for failed invoice: invoiceId={}", event.getInvoiceId());
            return;
        }

        BillingInvoice invoice = billingInvoiceRepository.findByProviderInvoiceId(event.getInvoiceId())
                .orElseGet(BillingInvoice::new);

        invoice.setWorkspaceId(workspaceId);
        invoice.setProviderInvoiceId(event.getInvoiceId());
        invoice.setInvoiceNumber(event.getInvoiceNumber());
        invoice.setAmountCents(event.getAmountCents() != null ? event.getAmountCents() : 0);
        invoice.setCurrency(event.getCurrency() != null ? event.getCurrency() : "usd");
        invoice.setStatus("payment_failed");
        invoice.setHostedInvoiceUrl(event.getHostedInvoiceUrl());
        invoice.setPdfUrl(event.getPdfUrl());
        invoice.setPeriodStart(event.getInvoicePeriodStart());
        invoice.setPeriodEnd(event.getInvoicePeriodEnd());

        billingInvoiceRepository.save(invoice);

        // Mark subscription PAST_DUE
        subscriptionRepository.findByWorkspaceId(workspaceId).ifPresent(sub -> {
            sub.setStatus(SubscriptionStatus.PAST_DUE);
            subscriptionRepository.save(sub);
            log.warn("Subscription for workspace {} marked PAST_DUE following failed payment", workspaceId);
        });

        auditEventRepository.save(new AuditEvent(
                workspaceId,
                null,
                "INVOICE_PAYMENT_FAILED",
                "invoice:" + event.getInvoiceId(),
                "Amount: " + event.getAmountCents()
        ));
    }

    private Subscription resolveSubscription(BillingWebhookEvent event) {
        if (event.getWorkspaceId() != null) {
            Optional<Subscription> byWs = subscriptionRepository.findByWorkspaceId(event.getWorkspaceId());
            if (byWs.isPresent()) return byWs.get();
        }
        if (event.getSubscriptionId() != null) {
            Optional<Subscription> bySub = subscriptionRepository.findByProviderSubscriptionId(event.getSubscriptionId());
            if (bySub.isPresent()) return bySub.get();
        }
        if (event.getCustomerId() != null) {
            Optional<Subscription> byCus = subscriptionRepository.findByProviderCustomerId(event.getCustomerId());
            if (byCus.isPresent()) return byCus.get();
        }
        return null;
    }

    private Long resolveWorkspaceIdForInvoice(BillingWebhookEvent event) {
        if (event.getWorkspaceId() != null) {
            return event.getWorkspaceId();
        }
        Subscription sub = resolveSubscription(event);
        return sub != null ? sub.getWorkspaceId() : null;
    }

    public Page<InvoiceDto> getInvoices(Long workspaceId, Pageable pageable) {
        return billingInvoiceRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId, pageable)
                .map(InvoiceDto::fromEntity);
    }
}
