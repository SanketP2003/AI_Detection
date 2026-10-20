package com.springboot.ai_verify.billing.controller;

import com.springboot.ai_verify.billing.dto.CheckoutRequest;
import com.springboot.ai_verify.billing.dto.InvoiceDto;
import com.springboot.ai_verify.billing.dto.PortalRequest;
import com.springboot.ai_verify.billing.service.BillingService;
import com.springboot.ai_verify.entitlement.dto.PlanDefinition;
import com.springboot.ai_verify.entitlement.service.EntitlementService;
import com.springboot.ai_verify.entitlement.service.PlanCatalog;
import com.springboot.ai_verify.model.User;
import com.springboot.ai_verify.service.UserService;
import com.springboot.ai_verify.workspace.model.Workspace;
import com.springboot.ai_verify.workspace.service.WorkspaceService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/billing")
public class BillingController {

    private final PlanCatalog planCatalog;
    private final EntitlementService entitlementService;
    private final UserService userService;
    private final WorkspaceService workspaceService;
    private final BillingService billingService;

    public BillingController(PlanCatalog planCatalog,
                             EntitlementService entitlementService,
                             UserService userService,
                             WorkspaceService workspaceService,
                             BillingService billingService) {
        this.planCatalog = planCatalog;
        this.entitlementService = entitlementService;
        this.userService = userService;
        this.workspaceService = workspaceService;
        this.billingService = billingService;
    }

    /**
     * Public endpoint to list all commercial plans. Cached for 5 minutes.
     */
    @GetMapping("/plans")
    public ResponseEntity<List<PlanDefinition>> getPlans() {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(5, TimeUnit.MINUTES).cachePublic())
                .body(planCatalog.getAllPlans());
    }

    /**
     * Authenticated endpoint to retrieve the active entitlements for the current user's workspace.
     */
    @GetMapping("/entitlements")
    public ResponseEntity<Map<String, Object>> getEntitlements(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }

        User user = resolveUser(auth);
        Workspace ws = workspaceService.getOrCreateDefaultWorkspace(user);
        PlanDefinition plan = entitlementService.getEffectivePlan(ws.getId());

        Map<String, Object> details = new LinkedHashMap<>();
        details.put("plan", plan.getId());
        details.put("planName", plan.getName());
        details.put("maxCharsPerAnalysis", plan.getMaxCharsPerAnalysis());
        details.put("maxUploadBytes", plan.getMaxUploadBytes());
        details.put("monthlyScans", plan.getMonthlyScans());
        details.put("monthlyAdvisorMessages", plan.getMonthlyAdvisorMessages());
        details.put("historyRetentionDays", plan.getHistoryRetentionDays());
        details.put("exportEnabled", plan.isExportEnabled());
        details.put("apiAccessEnabled", plan.isApiAccessEnabled());
        details.put("supportTier", plan.getSupportTier());
        details.put("overageAllowed", plan.isOverageAllowed());

        return ResponseEntity.ok(details);
    }

    /**
     * Authenticated endpoint to initiate a checkout session.
     */
    @PostMapping("/checkout")
    public ResponseEntity<Map<String, String>> createCheckout(@Valid @RequestBody CheckoutRequest request,
                                                              Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }

        User user = resolveUser(auth);
        Workspace ws = workspaceService.getOrCreateDefaultWorkspace(user);

        String sessionUrl = billingService.createCheckoutSession(
                ws.getId(),
                user.getId(),
                user.getEmail(),
                request
        );

        return ResponseEntity.ok(Map.of("url", sessionUrl));
    }

    /**
     * Authenticated endpoint to initiate a billing customer portal session.
     */
    @PostMapping("/portal")
    public ResponseEntity<Map<String, String>> createPortal(@RequestBody(required = false) PortalRequest request,
                                                            Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }

        User user = resolveUser(auth);
        Workspace ws = workspaceService.getOrCreateDefaultWorkspace(user);

        String portalUrl = billingService.createPortalSession(ws.getId(), request);
        return ResponseEntity.ok(Map.of("url", portalUrl));
    }

    /**
     * Public webhook endpoint for Stripe events.
     * Verified with HMAC signature, rejects replays via idempotency store.
     */
    @PostMapping("/webhook")
    public ResponseEntity<Map<String, Object>> handleWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "Stripe-Signature", required = false) String signatureHeader) {
        billingService.processWebhook(payload, signatureHeader);
        return ResponseEntity.ok(Map.of("received", true));
    }

    /**
     * Authenticated endpoint to list customer invoices for the active workspace.
     */
    @GetMapping("/invoices")
    public ResponseEntity<Page<InvoiceDto>> getInvoices(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        User user = resolveUser(auth);
        Workspace ws = workspaceService.getOrCreateDefaultWorkspace(user);

        int boundedSize = Math.min(Math.max(1, size), 100);
        int boundedPage = Math.max(0, page);

        Page<InvoiceDto> invoices = billingService.getInvoices(
                ws.getId(),
                PageRequest.of(boundedPage, boundedSize)
        );

        return ResponseEntity.ok(invoices);
    }

    private User resolveUser(Authentication auth) {
        User user = userService.getUserByUsername(auth.getName());
        if (user == null) {
            user = userService.getOrCreateClerkUser(auth.getName(), null);
        }
        return user;
    }
}
