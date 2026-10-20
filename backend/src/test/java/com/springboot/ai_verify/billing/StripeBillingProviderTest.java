package com.springboot.ai_verify.billing;

import com.springboot.ai_verify.billing.config.BillingProperties;
import com.springboot.ai_verify.billing.exception.BillingException;
import com.springboot.ai_verify.billing.exception.BillingUnavailableException;
import com.springboot.ai_verify.billing.service.StripeBillingProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class StripeBillingProviderTest {

    @Test
    @DisplayName("C1: StripeBillingProvider throws BillingUnavailableException when secret key is missing")
    void testMissingApiKeyThrowsUnavailable() {
        BillingProperties props = new BillingProperties();
        props.setEnabled(false);

        StripeBillingProvider provider = new StripeBillingProvider(props);
        assertFalse(provider.isEnabled());

        assertThrows(BillingUnavailableException.class, () ->
                provider.createCheckoutSession(1L, 2L, "test@test.com", null, "PRO", "monthly", 1, null, null)
        );

        assertThrows(BillingUnavailableException.class, () ->
                provider.createPortalSession("cus_123", "http://return")
        );
    }

    @Test
    @DisplayName("C1: StripeBillingProvider throws BillingException when webhook secret or signature is blank")
    void testBlankWebhookSecretThrowsBillingException() {
        BillingProperties props = new BillingProperties();
        props.setEnabled(true);
        props.getStripe().setSecretKey("sk_test_fake");
        props.getStripe().setWebhookSecret("");

        StripeBillingProvider provider = new StripeBillingProvider(props);

        BillingException ex = assertThrows(BillingException.class, () ->
                provider.parseAndVerifyWebhook("payload", "sig")
        );
        assertTrue(ex.getMessage().contains("Webhook secret is not configured"));
    }

    @Test
    @DisplayName("C1: StripeBillingProvider rejects null signature header")
    void testNullSignatureThrowsBillingException() {
        BillingProperties props = new BillingProperties();
        props.setEnabled(true);
        props.getStripe().setSecretKey("sk_test_fake");
        props.getStripe().setWebhookSecret("whsec_fake");

        StripeBillingProvider provider = new StripeBillingProvider(props);

        BillingException ex = assertThrows(BillingException.class, () ->
                provider.parseAndVerifyWebhook("payload", null)
        );
        assertTrue(ex.getMessage().contains("Missing Stripe-Signature header"));
    }
}
