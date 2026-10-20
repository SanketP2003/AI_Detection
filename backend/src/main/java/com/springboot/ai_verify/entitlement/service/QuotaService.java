package com.springboot.ai_verify.entitlement.service;

import com.springboot.ai_verify.billing.model.Subscription;
import com.springboot.ai_verify.billing.repository.SubscriptionRepository;
import com.springboot.ai_verify.entitlement.dto.PlanDefinition;
import com.springboot.ai_verify.entitlement.exception.EntitlementException;
import com.springboot.ai_verify.entitlement.model.UsageCounter;
import com.springboot.ai_verify.entitlement.model.UsageEvent;
import com.springboot.ai_verify.entitlement.repository.UsageCounterRepository;
import com.springboot.ai_verify.entitlement.repository.UsageEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.*;

@Service
public class QuotaService {

    private static final Logger log = LoggerFactory.getLogger(QuotaService.class);

    public static final String KIND_SCANS = "scans";
    public static final String KIND_ADVISOR_MESSAGES = "advisor_messages";

    private final UsageCounterRepository usageCounterRepository;
    private final UsageEventRepository usageEventRepository;
    private final EntitlementService entitlementService;
    private final SubscriptionRepository subscriptionRepository;

    public QuotaService(UsageCounterRepository usageCounterRepository,
                        UsageEventRepository usageEventRepository,
                        EntitlementService entitlementService,
                        SubscriptionRepository subscriptionRepository) {
        this.usageCounterRepository = usageCounterRepository;
        this.usageEventRepository = usageEventRepository;
        this.entitlementService = entitlementService;
        this.subscriptionRepository = subscriptionRepository;
    }

    public Instant getCurrentPeriodStart() {
        return YearMonth.now(ZoneOffset.UTC).atDay(1).atStartOfDay(ZoneOffset.UTC).toInstant();
    }

    public Instant getNextPeriodReset() {
        return YearMonth.now(ZoneOffset.UTC).plusMonths(1).atDay(1).atStartOfDay(ZoneOffset.UTC).toInstant();
    }

    @Transactional
    public QuotaReservation reserveQuota(Long workspaceId, Long userId, String kind, int quantity, String requestId) {
        if (workspaceId == null) {
            throw new IllegalArgumentException("Workspace ID is required for quota reservation");
        }

        PlanDefinition plan = entitlementService.getEffectivePlan(workspaceId);
        int limit = resolveLimit(plan, kind);
        Instant periodStart = getCurrentPeriodStart();
        Instant resetsAt = getNextPeriodReset();

        // Ensure counter row exists
        ensureCounterRow(workspaceId, periodStart, kind, limit);

        // Attempt atomic increment
        int updated = usageCounterRepository.incrementIfWithinLimit(workspaceId, periodStart, kind, quantity, Instant.now());
        if (updated == 0) {
            UsageCounter counter = usageCounterRepository
                    .findByWorkspaceIdAndPeriodStartAndKind(workspaceId, periodStart, kind)
                    .orElse(null);
            int used = counter != null ? counter.getUsed() : limit;
            log.warn("Quota exceeded for workspace {} [kind={}, used={}, limit={}]", workspaceId, kind, used, limit);
            throw EntitlementException.quotaExceeded(kind, used, limit, resetsAt);
        }

        log.debug("Reserved {} {} for workspace {} (request={})", quantity, kind, workspaceId, requestId);
        return new QuotaReservation(workspaceId, userId, kind, quantity, requestId, periodStart);
    }

    @Transactional
    public void commit(QuotaReservation reservation) {
        if (reservation == null) return;
        if (reservation.markCompleted()) {
            UsageEvent event = new UsageEvent(
                    reservation.getWorkspaceId(),
                    reservation.getUserId(),
                    reservation.getKind(),
                    reservation.getQuantity(),
                    reservation.getRequestId()
            );
            usageEventRepository.save(event);
            log.debug("Committed quota reservation {} for workspace {}", reservation.getKind(), reservation.getWorkspaceId());
        }
    }

    @Transactional
    public void rollback(QuotaReservation reservation) {
        if (reservation == null) return;
        if (reservation.markCompleted()) {
            usageCounterRepository.decrement(
                    reservation.getWorkspaceId(),
                    reservation.getPeriodStart(),
                    reservation.getKind(),
                    reservation.getQuantity(),
                    Instant.now()
            );
            log.info("Rolled back {} quota units of {} for workspace {}",
                    reservation.getQuantity(), reservation.getKind(), reservation.getWorkspaceId());
        }
    }

    public void validateCharacterLimit(Long workspaceId, int characterCount) {
        PlanDefinition plan = entitlementService.getEffectivePlan(workspaceId);
        if (characterCount > plan.getMaxCharsPerAnalysis()) {
            throw EntitlementException.planRequired(
                    "Text length (" + characterCount + " characters) exceeds your " + plan.getName()
                            + " plan limit of " + plan.getMaxCharsPerAnalysis() + " characters. Upgrade to analyze longer texts.",
                    "max_chars"
            );
        }
    }

    public void validateUploadSize(Long workspaceId, long fileSizeBytes) {
        PlanDefinition plan = entitlementService.getEffectivePlan(workspaceId);
        if (fileSizeBytes > plan.getMaxUploadBytes()) {
            throw EntitlementException.planRequired(
                    "File upload size exceeds your " + plan.getName() + " plan limit of "
                            + (plan.getMaxUploadBytes() / (1024 * 1024)) + " MB.",
                    "upload_size"
            );
        }
    }

    public void validateCanExport(Long workspaceId) {
        if (!entitlementService.canExport(workspaceId)) {
            throw EntitlementException.featureNotInPlan("csv_export");
        }
    }

    public Map<String, Object> getUsageSummary(Long workspaceId) {
        PlanDefinition plan = entitlementService.getEffectivePlan(workspaceId);
        Instant periodStart = getCurrentPeriodStart();
        Instant resetsAt = getNextPeriodReset();

        List<UsageCounter> counters = usageCounterRepository.findByWorkspaceIdAndPeriodStart(workspaceId, periodStart);
        Map<String, Integer> usedMap = new HashMap<>();
        for (UsageCounter c : counters) {
            usedMap.put(c.getKind(), c.getUsed());
        }

        int scansUsed = usedMap.getOrDefault(KIND_SCANS, 0);
        int scansLimit = plan.getMonthlyScans();

        int messagesUsed = usedMap.getOrDefault(KIND_ADVISOR_MESSAGES, 0);
        int messagesLimit = plan.getMonthlyAdvisorMessages();

        Optional<Subscription> subOpt = subscriptionRepository.findByWorkspaceId(workspaceId);
        String subStatus = subOpt.map(s -> s.getStatus().name()).orElse("ACTIVE");
        int seats = subOpt.map(Subscription::getSeats).orElse(1);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("periodStart", periodStart.toString());
        response.put("resetsAt", resetsAt.toString());
        response.put("plan", plan.getId());
        response.put("planName", plan.getName());
        response.put("subscriptionStatus", subStatus);
        response.put("seats", seats);

        Map<String, Object> entitlements = new LinkedHashMap<>();
        entitlements.put(KIND_SCANS, Map.of(
                "used", scansUsed,
                "limit", scansLimit,
                "remaining", Math.max(0, scansLimit - scansUsed)
        ));
        entitlements.put(KIND_ADVISOR_MESSAGES, Map.of(
                "used", messagesUsed,
                "limit", messagesLimit,
                "remaining", Math.max(0, messagesLimit - messagesUsed)
        ));
        response.put("entitlements", entitlements);

        return response;
    }

    private synchronized void ensureCounterRow(Long workspaceId, Instant periodStart, String kind, int limit) {
        Optional<UsageCounter> opt = usageCounterRepository.findByWorkspaceIdAndPeriodStartAndKind(workspaceId, periodStart, kind);
        if (opt.isEmpty()) {
            UsageCounter initial = new UsageCounter(workspaceId, periodStart, kind, 0, limit);
            usageCounterRepository.saveAndFlush(initial);
        }
    }

    private int resolveLimit(PlanDefinition plan, String kind) {
        if (KIND_SCANS.equalsIgnoreCase(kind)) {
            return plan.getMonthlyScans();
        }
        if (KIND_ADVISOR_MESSAGES.equalsIgnoreCase(kind)) {
            return plan.getMonthlyAdvisorMessages();
        }
        return -1;
    }
}
