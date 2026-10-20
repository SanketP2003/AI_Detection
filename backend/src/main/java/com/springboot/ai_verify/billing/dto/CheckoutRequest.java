package com.springboot.ai_verify.billing.dto;

import jakarta.validation.constraints.NotBlank;

public class CheckoutRequest {

    @NotBlank(message = "Plan is required")
    private String plan;

    private String interval = "monthly";

    private Integer seats = 1;

    private String successUrl;

    private String cancelUrl;

    public CheckoutRequest() {}

    public CheckoutRequest(String plan, String interval, Integer seats) {
        this.plan = plan;
        this.interval = interval != null ? interval : "monthly";
        this.seats = seats != null && seats > 0 ? seats : 1;
    }

    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }

    public String getInterval() { return interval; }
    public void setInterval(String interval) { this.interval = interval; }

    public Integer getSeats() { return seats != null && seats > 0 ? seats : 1; }
    public void setSeats(Integer seats) { this.seats = seats; }

    public String getSuccessUrl() { return successUrl; }
    public void setSuccessUrl(String successUrl) { this.successUrl = successUrl; }

    public String getCancelUrl() { return cancelUrl; }
    public void setCancelUrl(String cancelUrl) { this.cancelUrl = cancelUrl; }
}
