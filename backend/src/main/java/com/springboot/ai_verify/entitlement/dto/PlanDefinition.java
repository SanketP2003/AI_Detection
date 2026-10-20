package com.springboot.ai_verify.entitlement.dto;

public class PlanDefinition {
    private String id;
    private String name;
    private int priceMonthlyCents;
    private int priceYearlyCents;
    private int monthlyScans;
    private int maxCharsPerAnalysis;
    private long maxUploadBytes;
    private int monthlyAdvisorMessages;
    private int historyRetentionDays;
    private int maxSeats;
    private boolean exportEnabled;
    private boolean apiAccessEnabled;
    private String supportTier;
    private boolean overageAllowed;

    public PlanDefinition() {}

    public PlanDefinition(String id, String name, int priceMonthlyCents, int priceYearlyCents,
                          int monthlyScans, int maxCharsPerAnalysis, long maxUploadBytes,
                          int monthlyAdvisorMessages, int historyRetentionDays, int maxSeats,
                          boolean exportEnabled, boolean apiAccessEnabled, String supportTier,
                          boolean overageAllowed) {
        this.id = id;
        this.name = name;
        this.priceMonthlyCents = priceMonthlyCents;
        this.priceYearlyCents = priceYearlyCents;
        this.monthlyScans = monthlyScans;
        this.maxCharsPerAnalysis = maxCharsPerAnalysis;
        this.maxUploadBytes = maxUploadBytes;
        this.monthlyAdvisorMessages = monthlyAdvisorMessages;
        this.historyRetentionDays = historyRetentionDays;
        this.maxSeats = maxSeats;
        this.exportEnabled = exportEnabled;
        this.apiAccessEnabled = apiAccessEnabled;
        this.supportTier = supportTier;
        this.overageAllowed = overageAllowed;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getPriceMonthlyCents() { return priceMonthlyCents; }
    public void setPriceMonthlyCents(int priceMonthlyCents) { this.priceMonthlyCents = priceMonthlyCents; }

    public int getPriceYearlyCents() { return priceYearlyCents; }
    public void setPriceYearlyCents(int priceYearlyCents) { this.priceYearlyCents = priceYearlyCents; }

    public int getMonthlyScans() { return monthlyScans; }
    public void setMonthlyScans(int monthlyScans) { this.monthlyScans = monthlyScans; }

    public int getMaxCharsPerAnalysis() { return maxCharsPerAnalysis; }
    public void setMaxCharsPerAnalysis(int maxCharsPerAnalysis) { this.maxCharsPerAnalysis = maxCharsPerAnalysis; }

    public long getMaxUploadBytes() { return maxUploadBytes; }
    public void setMaxUploadBytes(long maxUploadBytes) { this.maxUploadBytes = maxUploadBytes; }

    public int getMonthlyAdvisorMessages() { return monthlyAdvisorMessages; }
    public void setMonthlyAdvisorMessages(int monthlyAdvisorMessages) { this.monthlyAdvisorMessages = monthlyAdvisorMessages; }

    public int getHistoryRetentionDays() { return historyRetentionDays; }
    public void setHistoryRetentionDays(int historyRetentionDays) { this.historyRetentionDays = historyRetentionDays; }

    public int getMaxSeats() { return maxSeats; }
    public void setMaxSeats(int maxSeats) { this.maxSeats = maxSeats; }
    public int getSeats() { return maxSeats; }

    public boolean isExportEnabled() { return exportEnabled; }
    public void setExportEnabled(boolean exportEnabled) { this.exportEnabled = exportEnabled; }

    public boolean isApiAccessEnabled() { return apiAccessEnabled; }
    public void setApiAccessEnabled(boolean apiAccessEnabled) { this.apiAccessEnabled = apiAccessEnabled; }

    public String getSupportTier() { return supportTier; }
    public void setSupportTier(String supportTier) { this.supportTier = supportTier; }

    public boolean isOverageAllowed() { return overageAllowed; }
    public void setOverageAllowed(boolean overageAllowed) { this.overageAllowed = overageAllowed; }
}
