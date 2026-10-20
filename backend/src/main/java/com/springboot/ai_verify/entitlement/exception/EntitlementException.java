package com.springboot.ai_verify.entitlement.exception;

import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.Map;

public class EntitlementException extends RuntimeException {

    private final HttpStatus status;
    private final String code;
    private final Map<String, Object> details;
    private final Instant timestamp;

    public EntitlementException(HttpStatus status, String code, String message, Map<String, Object> details) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = details;
        this.timestamp = Instant.now();
    }

    public static EntitlementException quotaExceeded(String entitlement, int used, int limit, Instant resetsAt) {
        return new EntitlementException(
                HttpStatus.PAYMENT_REQUIRED,
                "QUOTA_EXCEEDED",
                "You have used all " + limit + " " + entitlement + " in your current period.",
                Map.of(
                        "entitlement", entitlement,
                        "used", used,
                        "limit", limit,
                        "resetsAt", resetsAt != null ? resetsAt.toString() : "",
                        "upgradeUrl", "/pricing"
                )
        );
    }

    public static EntitlementException seatLimitReached(int used, int limit, String message) {
        return new EntitlementException(
                HttpStatus.PAYMENT_REQUIRED,
                "SEAT_LIMIT_REACHED",
                message,
                Map.of(
                        "entitlement", "seats",
                        "used", used,
                        "limit", limit,
                        "upgradeUrl", "/pricing"
                )
        );
    }

    public static EntitlementException planRequired(String message, String feature) {
        return new EntitlementException(
                HttpStatus.PAYMENT_REQUIRED,
                "PLAN_REQUIRED",
                message,
                Map.of(
                        "feature", feature,
                        "upgradeUrl", "/pricing"
                )
        );
    }

    public static EntitlementException featureNotInPlan(String feature) {
        return new EntitlementException(
                HttpStatus.PAYMENT_REQUIRED,
                "FEATURE_NOT_IN_PLAN",
                "Feature '" + feature + "' is not included in your current plan. Upgrade to access.",
                Map.of(
                        "feature", feature,
                        "upgradeUrl", "/pricing"
                )
        );
    }

    public HttpStatus getStatus() { return status; }
    public String getCode() { return code; }
    public Map<String, Object> getDetails() { return details; }
    public Instant getTimestamp() { return timestamp; }
}
