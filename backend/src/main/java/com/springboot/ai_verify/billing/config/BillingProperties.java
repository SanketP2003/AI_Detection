package com.springboot.ai_verify.billing.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "billing")
public class BillingProperties {

    private boolean enabled = false;
    private String provider = "stripe";
    private int trialDays = 14;
    private int graceDays = 7;
    private String publicUrl = "http://localhost:3000";
    private StripeProperties stripe = new StripeProperties();

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public int getTrialDays() { return trialDays; }
    public void setTrialDays(int trialDays) { this.trialDays = trialDays; }

    public int getGraceDays() { return graceDays; }
    public void setGraceDays(int graceDays) { this.graceDays = graceDays; }

    public String getPublicUrl() { return publicUrl; }
    public void setPublicUrl(String publicUrl) { this.publicUrl = publicUrl; }

    public StripeProperties getStripe() { return stripe; }
    public void setStripe(StripeProperties stripe) { this.stripe = stripe; }

    public static class StripeProperties {
        private String secretKey = "";
        private String webhookSecret = "";
        private String portalConfigurationId = "";
        private String priceProMonthly = "";
        private String priceProYearly = "";
        private String priceTeamMonthly = "";

        public String getSecretKey() { return secretKey; }
        public void setSecretKey(String secretKey) { this.secretKey = secretKey; }

        public String getWebhookSecret() { return webhookSecret; }
        public void setWebhookSecret(String webhookSecret) { this.webhookSecret = webhookSecret; }

        public String getPortalConfigurationId() { return portalConfigurationId; }
        public void setPortalConfigurationId(String portalConfigurationId) { this.portalConfigurationId = portalConfigurationId; }

        public String getPriceProMonthly() { return priceProMonthly; }
        public void setPriceProMonthly(String priceProMonthly) { this.priceProMonthly = priceProMonthly; }

        public String getPriceProYearly() { return priceProYearly; }
        public void setPriceProYearly(String priceProYearly) { this.priceProYearly = priceProYearly; }

        public String getPriceTeamMonthly() { return priceTeamMonthly; }
        public void setPriceTeamMonthly(String priceTeamMonthly) { this.priceTeamMonthly = priceTeamMonthly; }
    }
}
