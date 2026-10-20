package com.springboot.ai_verify.entitlement.service;

import java.time.Instant;

public class QuotaReservation {
    private final Long workspaceId;
    private final Long userId;
    private final String kind;
    private final int quantity;
    private final String requestId;
    private final Instant periodStart;
    private boolean completed = false;

    public QuotaReservation(Long workspaceId, Long userId, String kind, int quantity, String requestId, Instant periodStart) {
        this.workspaceId = workspaceId;
        this.userId = userId;
        this.kind = kind;
        this.quantity = quantity;
        this.requestId = requestId;
        this.periodStart = periodStart;
    }

    public Long getWorkspaceId() { return workspaceId; }
    public Long getUserId() { return userId; }
    public String getKind() { return kind; }
    public int getQuantity() { return quantity; }
    public String getRequestId() { return requestId; }
    public Instant getPeriodStart() { return periodStart; }

    public synchronized boolean markCompleted() {
        if (completed) return false;
        completed = true;
        return true;
    }
}
