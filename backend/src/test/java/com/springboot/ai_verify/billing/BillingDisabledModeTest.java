package com.springboot.ai_verify.billing;

import com.springboot.ai_verify.billing.config.BillingProperties;
import com.springboot.ai_verify.billing.dto.CheckoutRequest;
import com.springboot.ai_verify.billing.dto.PortalRequest;
import com.springboot.ai_verify.billing.exception.BillingUnavailableException;
import com.springboot.ai_verify.billing.service.DisabledBillingProvider;
import com.springboot.ai_verify.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class BillingDisabledModeTest {

    @Test
    @DisplayName("C5: DisabledBillingProvider throws BillingUnavailableException for checkout, portal, and webhook")
    void testDisabledBillingProviderThrows503() {
        DisabledBillingProvider provider = new DisabledBillingProvider();

        assertFalse(provider.isEnabled(), "Provider should report disabled");

        assertThrows(BillingUnavailableException.class, () ->
                provider.createCheckoutSession(1L, 2L, "user@test.com", null, "PRO", "monthly", 1, null, null)
        );

        assertThrows(BillingUnavailableException.class, () ->
                provider.createPortalSession("cus_123", "http://return")
        );

        assertThrows(BillingUnavailableException.class, () ->
                provider.parseAndVerifyWebhook("payload", "sig")
        );
    }

    @Test
    @DisplayName("C5: GlobalExceptionHandler maps BillingUnavailableException to HTTP 503 with BILLING_UNAVAILABLE code")
    void testExceptionHandlerReturns503() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();
        BillingUnavailableException ex = new BillingUnavailableException("Billing is not enabled on this deployment.");

        ResponseEntity<Map<String, Object>> response = handler.handleBillingUnavailable(ex);

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(503, response.getBody().get("status"));
        assertEquals("BILLING_UNAVAILABLE", response.getBody().get("code"));
        assertEquals("Billing is not enabled on this deployment.", response.getBody().get("message"));
    }
}
