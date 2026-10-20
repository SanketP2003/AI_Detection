package com.springboot.ai_verify.billing.exception;

public class BillingUnavailableException extends RuntimeException {
    public BillingUnavailableException() {
        super("Billing is not enabled on this deployment.");
    }

    public BillingUnavailableException(String message) {
        super(message);
    }
}
