package com.springboot.ai_verify.billing.dto;

import com.springboot.ai_verify.billing.model.BillingInvoice;

import java.time.Instant;

public class InvoiceDto {

    private Long id;
    private String providerInvoiceId;
    private String invoiceNumber;
    private Integer amountCents;
    private String amountFormatted;
    private String currency;
    private String status;
    private String hostedInvoiceUrl;
    private String pdfUrl;
    private Instant periodStart;
    private Instant periodEnd;
    private Instant createdAt;

    public InvoiceDto() {}

    public static InvoiceDto fromEntity(BillingInvoice invoice) {
        InvoiceDto dto = new InvoiceDto();
        dto.setId(invoice.getId());
        dto.setProviderInvoiceId(invoice.getProviderInvoiceId());
        dto.setInvoiceNumber(invoice.getInvoiceNumber());
        dto.setAmountCents(invoice.getAmountCents());
        dto.setCurrency(invoice.getCurrency());
        dto.setStatus(invoice.getStatus());
        dto.setHostedInvoiceUrl(invoice.getHostedInvoiceUrl());
        dto.setPdfUrl(invoice.getPdfUrl());
        dto.setPeriodStart(invoice.getPeriodStart());
        dto.setPeriodEnd(invoice.getPeriodEnd());
        dto.setCreatedAt(invoice.getCreatedAt());

        double dollars = (invoice.getAmountCents() != null ? invoice.getAmountCents() : 0) / 100.0;
        dto.setAmountFormatted(String.format("$%.2f", dollars));
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getProviderInvoiceId() { return providerInvoiceId; }
    public void setProviderInvoiceId(String providerInvoiceId) { this.providerInvoiceId = providerInvoiceId; }

    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }

    public Integer getAmountCents() { return amountCents; }
    public void setAmountCents(Integer amountCents) { this.amountCents = amountCents; }

    public String getAmountFormatted() { return amountFormatted; }
    public void setAmountFormatted(String amountFormatted) { this.amountFormatted = amountFormatted; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getHostedInvoiceUrl() { return hostedInvoiceUrl; }
    public void setHostedInvoiceUrl(String hostedInvoiceUrl) { this.hostedInvoiceUrl = hostedInvoiceUrl; }

    public String getPdfUrl() { return pdfUrl; }
    public void setPdfUrl(String pdfUrl) { this.pdfUrl = pdfUrl; }

    public Instant getPeriodStart() { return periodStart; }
    public void setPeriodStart(Instant periodStart) { this.periodStart = periodStart; }

    public Instant getPeriodEnd() { return periodEnd; }
    public void setPeriodEnd(Instant periodEnd) { this.periodEnd = periodEnd; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
