package com.springboot.ai_verify.billing;

import com.springboot.ai_verify.audit.repository.AuditEventRepository;
import com.springboot.ai_verify.billing.dto.BillingWebhookEvent;
import com.springboot.ai_verify.billing.dto.CheckoutRequest;
import com.springboot.ai_verify.billing.dto.InvoiceDto;
import com.springboot.ai_verify.billing.dto.PortalRequest;
import com.springboot.ai_verify.billing.exception.BillingException;
import com.springboot.ai_verify.billing.exception.BillingUnavailableException;
import com.springboot.ai_verify.billing.model.BillingInvoice;
import com.springboot.ai_verify.billing.model.Subscription;
import com.springboot.ai_verify.billing.model.SubscriptionStatus;
import com.springboot.ai_verify.billing.repository.BillingInvoiceRepository;
import com.springboot.ai_verify.billing.repository.ProcessedWebhookRepository;
import com.springboot.ai_verify.billing.repository.SubscriptionRepository;
import com.springboot.ai_verify.billing.service.BillingProvider;
import com.springboot.ai_verify.billing.service.BillingService;
import com.springboot.ai_verify.entitlement.dto.PlanDefinition;
import com.springboot.ai_verify.entitlement.service.EntitlementService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@SpringBootTest
@ActiveProfiles("test")
public class BillingServiceTest {

    @MockBean
    private JwtDecoder jwtDecoder;

    @MockBean
    private BillingProvider mockBillingProvider;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @Autowired
    private ProcessedWebhookRepository processedWebhookRepository;

    @Autowired
    private BillingInvoiceRepository billingInvoiceRepository;

    @Autowired
    private AuditEventRepository auditEventRepository;

    @Autowired
    private EntitlementService entitlementService;

    private BillingService billingService;

    @BeforeEach
    void setUp() {
        billingInvoiceRepository.deleteAll();
        processedWebhookRepository.deleteAll();
        subscriptionRepository.deleteAll();
        auditEventRepository.deleteAll();

        billingService = new BillingService(
                mockBillingProvider,
                subscriptionRepository,
                processedWebhookRepository,
                billingInvoiceRepository,
                auditEventRepository
        );
    }

    @Test
    @DisplayName("C1: Create checkout session delegates to provider with customer reuse")
    void testCreateCheckoutDelegation() {
        Long workspaceId = 101L;
        Long userId = 5L;
        String email = "pro@example.com";

        // Seed existing subscription with customer ID
        Subscription sub = new Subscription(workspaceId, "FREE");
        sub.setProviderCustomerId("cus_existing_123");
        subscriptionRepository.save(sub);

        when(mockBillingProvider.createCheckoutSession(
                eq(workspaceId), eq(userId), eq(email), eq("cus_existing_123"),
                eq("PRO"), eq("monthly"), eq(1), isNull(), isNull()
        )).thenReturn("https://checkout.stripe.com/pay/cs_test_abc");

        CheckoutRequest req = new CheckoutRequest("PRO", "monthly", 1);
        String url = billingService.createCheckoutSession(workspaceId, userId, email, req);

        assertEquals("https://checkout.stripe.com/pay/cs_test_abc", url);
        verify(mockBillingProvider).createCheckoutSession(
                eq(workspaceId), eq(userId), eq(email), eq("cus_existing_123"),
                eq("PRO"), eq("monthly"), eq(1), isNull(), isNull()
        );
    }

    @Test
    @DisplayName("C1: Create customer portal session delegates to provider")
    void testCreatePortalDelegation() {
        Long workspaceId = 202L;
        Subscription sub = new Subscription(workspaceId, "PRO");
        sub.setProviderCustomerId("cus_pro_456");
        subscriptionRepository.save(sub);

        when(mockBillingProvider.createPortalSession(eq("cus_pro_456"), eq("http://localhost:3000/settings")))
                .thenReturn("https://billing.stripe.com/p/session/portal_xyz");

        PortalRequest req = new PortalRequest("http://localhost:3000/settings");
        String url = billingService.createPortalSession(workspaceId, req);

        assertEquals("https://billing.stripe.com/p/session/portal_xyz", url);
    }

    @Test
    @DisplayName("C2: Webhook signature verification failure throws BillingException")
    void testInvalidSignatureThrowsException() {
        when(mockBillingProvider.parseAndVerifyWebhook(anyString(), anyString()))
                .thenThrow(new BillingException("Invalid webhook signature"));

        assertThrows(BillingException.class, () ->
                billingService.processWebhook("payload", "bad_signature")
        );
    }

    @Test
    @DisplayName("C2: Webhook replay is ignored idempotently")
    void testWebhookReplayIgnored() {
        String eventId = "evt_replay_test_001";
        Long workspaceId = 303L;

        BillingWebhookEvent event = new BillingWebhookEvent();
        event.setEventId(eventId);
        event.setEventType("checkout.session.completed");
        event.setWorkspaceId(workspaceId);
        event.setCustomerId("cus_001");
        event.setSubscriptionId("sub_001");
        event.setPlan("PRO");

        when(mockBillingProvider.parseAndVerifyWebhook(anyString(), anyString())).thenReturn(event);

        // First delivery
        billingService.processWebhook("payload1", "sig1");
        assertTrue(processedWebhookRepository.existsByProviderEventId(eventId));

        Subscription sub = subscriptionRepository.findByWorkspaceId(workspaceId).orElseThrow();
        assertEquals("PRO", sub.getPlan());
        assertEquals("cus_001", sub.getProviderCustomerId());

        // Modify sub plan locally to verify replay does NOT alter state
        sub.setPlan("TEAM");
        subscriptionRepository.save(sub);

        // Replay of same event
        billingService.processWebhook("payload1", "sig1");

        // Plan remains unchanged because replay was rejected idempotently
        Subscription rechecked = subscriptionRepository.findByWorkspaceId(workspaceId).orElseThrow();
        assertEquals("TEAM", rechecked.getPlan());
    }

    @Test
    @DisplayName("C2: Subscription state transitions: trialing -> active -> past_due -> canceled")
    void testSubscriptionStateTransitions() {
        Long workspaceId = 404L;
        Subscription sub = new Subscription(workspaceId, "PRO");
        sub.setProviderSubscriptionId("sub_state_test");
        sub.setCurrentPeriodEnd(Instant.now().plus(30, ChronoUnit.DAYS));
        subscriptionRepository.save(sub);

        // 1. Transition to TRIALING
        BillingWebhookEvent trialEvent = new BillingWebhookEvent();
        trialEvent.setEventId("evt_trial");
        trialEvent.setEventType("customer.subscription.updated");
        trialEvent.setSubscriptionId("sub_state_test");
        trialEvent.setStatus(SubscriptionStatus.TRIALING);
        trialEvent.setTrialEnd(Instant.now().plus(14, ChronoUnit.DAYS));
        when(mockBillingProvider.parseAndVerifyWebhook(eq("payload_trial"), any())).thenReturn(trialEvent);

        billingService.processWebhook("payload_trial", "sig");
        assertEquals(SubscriptionStatus.TRIALING, subscriptionRepository.findByWorkspaceId(workspaceId).orElseThrow().getStatus());
        PlanDefinition plan1 = entitlementService.getEffectivePlan(workspaceId);
        assertEquals("PRO", plan1.getId());

        // 2. Transition to ACTIVE
        BillingWebhookEvent activeEvent = new BillingWebhookEvent();
        activeEvent.setEventId("evt_active");
        activeEvent.setEventType("customer.subscription.updated");
        activeEvent.setSubscriptionId("sub_state_test");
        activeEvent.setStatus(SubscriptionStatus.ACTIVE);
        when(mockBillingProvider.parseAndVerifyWebhook(eq("payload_active"), any())).thenReturn(activeEvent);

        billingService.processWebhook("payload_active", "sig");
        assertEquals(SubscriptionStatus.ACTIVE, subscriptionRepository.findByWorkspaceId(workspaceId).orElseThrow().getStatus());

        // 3. Payment failed -> PAST_DUE
        BillingWebhookEvent failedEvent = new BillingWebhookEvent();
        failedEvent.setEventId("evt_fail");
        failedEvent.setEventType("invoice.payment_failed");
        failedEvent.setInvoiceId("in_fail_1");
        failedEvent.setSubscriptionId("sub_state_test");
        failedEvent.setAmountCents(1900);
        when(mockBillingProvider.parseAndVerifyWebhook(eq("payload_fail"), any())).thenReturn(failedEvent);

        billingService.processWebhook("payload_fail", "sig");
        assertEquals(SubscriptionStatus.PAST_DUE, subscriptionRepository.findByWorkspaceId(workspaceId).orElseThrow().getStatus());

        // Under 7-day grace period, plan remains effective PRO
        PlanDefinition gracePlan = entitlementService.getEffectivePlan(workspaceId);
        assertEquals("PRO", gracePlan.getId());

        // 4. Cancellation (never revoke mid-period!)
        BillingWebhookEvent cancelEvent = new BillingWebhookEvent();
        cancelEvent.setEventId("evt_cancel");
        cancelEvent.setEventType("customer.subscription.deleted");
        cancelEvent.setSubscriptionId("sub_state_test");
        when(mockBillingProvider.parseAndVerifyWebhook(eq("payload_cancel"), any())).thenReturn(cancelEvent);

        billingService.processWebhook("payload_cancel", "sig");
        Subscription canceledSub = subscriptionRepository.findByWorkspaceId(workspaceId).orElseThrow();
        assertEquals(SubscriptionStatus.CANCELED, canceledSub.getStatus());
        assertTrue(canceledSub.getCancelAtPeriodEnd());

        // Since currentPeriodEnd is in the future (+30 days), effective plan is still PRO until period ends!
        PlanDefinition retainedPlan = entitlementService.getEffectivePlan(workspaceId);
        assertEquals("PRO", retainedPlan.getId());
    }

    @Test
    @DisplayName("C3: Persist and retrieve customer billing invoices from webhook events")
    void testInvoicePersistenceAndRetrieval() {
        Long workspaceId = 505L;
        Subscription sub = new Subscription(workspaceId, "PRO");
        sub.setProviderSubscriptionId("sub_inv_505");
        subscriptionRepository.save(sub);

        BillingWebhookEvent invEvent = new BillingWebhookEvent();
        invEvent.setEventId("evt_inv_001");
        invEvent.setEventType("invoice.paid");
        invEvent.setInvoiceId("in_test_1001");
        invEvent.setInvoiceNumber("INV-2026-0001");
        invEvent.setAmountCents(1900);
        invEvent.setCurrency("usd");
        invEvent.setHostedInvoiceUrl("https://invoice.stripe.com/i/test_1001");
        invEvent.setPdfUrl("https://invoice.stripe.com/i/test_1001/pdf");
        invEvent.setSubscriptionId("sub_inv_505");
        invEvent.setInvoicePeriodStart(Instant.now().minus(30, ChronoUnit.DAYS));
        invEvent.setInvoicePeriodEnd(Instant.now());

        when(mockBillingProvider.parseAndVerifyWebhook(anyString(), any())).thenReturn(invEvent);
        billingService.processWebhook("payload", "sig");

        Page<InvoiceDto> invoices = billingService.getInvoices(workspaceId, PageRequest.of(0, 10));
        assertEquals(1, invoices.getTotalElements());

        InvoiceDto dto = invoices.getContent().get(0);
        assertEquals("in_test_1001", dto.getProviderInvoiceId());
        assertEquals("INV-2026-0001", dto.getInvoiceNumber());
        assertEquals(1900, dto.getAmountCents());
        assertEquals("$19.00", dto.getAmountFormatted());
        assertEquals("paid", dto.getStatus());
        assertEquals("https://invoice.stripe.com/i/test_1001/pdf", dto.getPdfUrl());
    }
}
