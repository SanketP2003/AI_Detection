package com.springboot.ai_verify.entitlement.service;

import com.springboot.ai_verify.entitlement.config.PlanProperties;
import com.springboot.ai_verify.entitlement.dto.PlanDefinition;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class PlanCatalog {

    public static final String FREE = "FREE";
    public static final String PRO = "PRO";
    public static final String TEAM = "TEAM";

    private final PlanProperties planProperties;
    private final Map<String, PlanDefinition> plans = new LinkedHashMap<>();

    public PlanCatalog(PlanProperties planProperties) {
        this.planProperties = planProperties;
    }

    @PostConstruct
    public void init() {
        // Defaults per Section 3 of SAAS_CONVERSION_PROMPT.md
        PlanDefinition defaultFree = new PlanDefinition(
                FREE, "Free", 0, 0,
                20, 5000, 2 * 1024 * 1024L,
                10, 30, 1,
                false, false, "Community", false
        );

        PlanDefinition defaultPro = new PlanDefinition(
                PRO, "Pro", 1900, 19000,
                1000, 50000, 10 * 1024 * 1024L,
                300, 365, 1,
                true, false, "Email", true
        );

        PlanDefinition defaultTeam = new PlanDefinition(
                TEAM, "Team", 4900, 49000,
                10000, 200000, 25 * 1024 * 1024L,
                2000, 730, 25,
                true, true, "Priority Email", true
        );

        plans.put(FREE, defaultFree);
        plans.put(PRO, defaultPro);
        plans.put(TEAM, defaultTeam);

        // Override or supplement with configured catalog if provided
        if (planProperties.getCatalog() != null && !planProperties.getCatalog().isEmpty()) {
            planProperties.getCatalog().forEach((key, planDef) -> {
                String id = (planDef.getId() != null ? planDef.getId() : key).toUpperCase();
                planDef.setId(id);
                plans.put(id, planDef);
            });
        }
    }

    public PlanDefinition getPlan(String planId) {
        if (planId == null) {
            return plans.get(FREE);
        }
        return plans.getOrDefault(planId.toUpperCase(), plans.get(FREE));
    }

    public List<PlanDefinition> getAllPlans() {
        return new ArrayList<>(plans.values());
    }

    public PlanDefinition getFreePlan() {
        return plans.get(FREE);
    }
}
