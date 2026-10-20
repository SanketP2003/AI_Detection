package com.springboot.ai_verify.billing.config;

import com.springboot.ai_verify.billing.service.BillingProvider;
import com.springboot.ai_verify.billing.service.DisabledBillingProvider;
import com.springboot.ai_verify.billing.service.StripeBillingProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class BillingConfiguration {

    private static final Logger log = LoggerFactory.getLogger(BillingConfiguration.class);

    @Bean
    public BillingProvider billingProvider(BillingProperties billingProperties) {
        if (billingProperties.isEnabled() && "stripe".equalsIgnoreCase(billingProperties.getProvider())) {
            log.info("Billing is ENABLED with Stripe provider.");
            return new StripeBillingProvider(billingProperties);
        }
        log.info("Billing is DISABLED or configured without active provider; using DisabledBillingProvider.");
        return new DisabledBillingProvider();
    }
}
