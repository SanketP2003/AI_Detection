package com.springboot.ai_verify.entitlement.service;

import com.springboot.ai_verify.billing.model.Subscription;
import com.springboot.ai_verify.billing.model.SubscriptionStatus;
import com.springboot.ai_verify.billing.repository.SubscriptionRepository;
import com.springboot.ai_verify.entitlement.dto.PlanDefinition;
import com.springboot.ai_verify.model.User;
import com.springboot.ai_verify.workspace.model.Workspace;
import com.springboot.ai_verify.workspace.service.WorkspaceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

@Service
public class EntitlementService {

    private static final Logger log = LoggerFactory.getLogger(EntitlementService.class);

    private final SubscriptionRepository subscriptionRepository;
    private final PlanCatalog planCatalog;
    private final WorkspaceService workspaceService;

    @Value("${billing.grace-days:7}")
    private int graceDays = 7;

    public EntitlementService(SubscriptionRepository subscriptionRepository,
                              PlanCatalog planCatalog,
                              WorkspaceService workspaceService) {
        this.subscriptionRepository = subscriptionRepository;
        this.planCatalog = planCatalog;
        this.workspaceService = workspaceService;
    }

    public PlanDefinition getEffectivePlan(Long workspaceId) {
        if (workspaceId == null) {
            return planCatalog.getFreePlan();
        }

        Optional<Subscription> subOpt = subscriptionRepository.findByWorkspaceId(workspaceId);
        if (subOpt.isEmpty()) {
            return planCatalog.getFreePlan();
        }

        Subscription sub = subOpt.get();
        Instant now = Instant.now();

        if (sub.getStatus() == SubscriptionStatus.ACTIVE) {
            return planCatalog.getPlan(sub.getPlan());
        }

        if (sub.getStatus() == SubscriptionStatus.TRIALING) {
            if (sub.getTrialEnd() == null || sub.getTrialEnd().isAfter(now)) {
                return planCatalog.getPlan(sub.getPlan());
            }
            log.info("Workspace {} trial expired; falling back to FREE", workspaceId);
            return planCatalog.getFreePlan();
        }

        if (sub.getStatus() == SubscriptionStatus.PAST_DUE) {
            Instant periodEnd = sub.getCurrentPeriodEnd() != null ? sub.getCurrentPeriodEnd() : sub.getCreatedAt();
            Instant graceEnd = periodEnd.plus(graceDays, ChronoUnit.DAYS);
            if (now.isBefore(graceEnd)) {
                // Soft grace period allowed
                return planCatalog.getPlan(sub.getPlan());
            }
            log.warn("Workspace {} subscription past due past grace period ({} days); falling back to FREE", workspaceId, graceDays);
            return planCatalog.getFreePlan();
        }

        if (sub.getStatus() == SubscriptionStatus.CANCELED) {
            if (sub.getCurrentPeriodEnd() != null && sub.getCurrentPeriodEnd().isAfter(now)) {
                return planCatalog.getPlan(sub.getPlan());
            }
            return planCatalog.getFreePlan();
        }

        return planCatalog.getFreePlan();
    }

    public PlanDefinition getEffectivePlanForUser(User user) {
        if (user == null) {
            return planCatalog.getFreePlan();
        }
        Workspace ws = workspaceService.getOrCreateDefaultWorkspace(user);
        return getEffectivePlan(ws.getId());
    }

    public boolean canExport(Long workspaceId) {
        return getEffectivePlan(workspaceId).isExportEnabled();
    }

    public int getMaxCharsPerAnalysis(Long workspaceId) {
        return getEffectivePlan(workspaceId).getMaxCharsPerAnalysis();
    }

    public long getMaxUploadBytes(Long workspaceId) {
        return getEffectivePlan(workspaceId).getMaxUploadBytes();
    }

    public int getHistoryRetentionDays(Long workspaceId) {
        return getEffectivePlan(workspaceId).getHistoryRetentionDays();
    }

    public boolean isApiAccessEnabled(Long workspaceId) {
        return getEffectivePlan(workspaceId).isApiAccessEnabled();
    }
}
