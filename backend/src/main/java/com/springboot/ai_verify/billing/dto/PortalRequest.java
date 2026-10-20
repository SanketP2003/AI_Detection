package com.springboot.ai_verify.billing.dto;

public class PortalRequest {

    private String returnUrl;

    public PortalRequest() {}

    public PortalRequest(String returnUrl) {
        this.returnUrl = returnUrl;
    }

    public String getReturnUrl() { return returnUrl; }
    public void setReturnUrl(String returnUrl) { this.returnUrl = returnUrl; }
}
