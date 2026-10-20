package com.springboot.ai_verify.billing.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "billing_invoices", indexes = {
    @Index(name = "idx_billing_invoices_ws_created", columnList = "workspace_id, created_at DESC")
})
public class BillingInvoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "workspace_id", nullable = false)
    private Long workspaceId;

    @Column(name = "provider_invoice_id", nullable = false, unique = true, length = 100)
    private String providerInvoiceId;

    @Column(name = "invoice_number", length = 100)
    private String invoiceNumber;

    @Column(name = "amount_cents", nullable = false)
    private Integer amountCents = 0;

    @Column(nullable = false, length = 10)
    private String currency = "usd";

    @Column(nullable = false, length = 32)
    private String status = "paid";

    @Column(name = "hosted_invoice_url", length = 1000)
    private String hostedInvoiceUrl;

    @Column(name = "pdf_url", length = 1000)
    private String pdfUrl;

    @Column(name = "period_start")
    private Instant periodStart;

    @Column(name = "period_end")
    private Instant periodEnd;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public BillingInvoice() {}

    public BillingInvoice(Long workspaceId, String providerInvoiceId, String invoiceNumber,
                          Integer amountCents, String currency, String status,
                          String hostedInvoiceUrl, String pdfUrl,
                          Instant periodStart, Instant periodEnd) {
        this.workspaceId = workspaceId;
        this.providerInvoiceId = providerInvoiceId;
        this.invoiceNumber = invoiceNumber;
        this.amountCents = amountCents != null ? amountCents : 0;
        this.currency = currency != null ? currency : "usd";
        this.status = status != null ? status : "paid";
        this.hostedInvoiceUrl = hostedInvoiceUrl;
        this.pdfUrl = pdfUrl;
        this.periodStart = periodStart;
        this.periodEnd = periodEnd;
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getWorkspaceId() { return workspaceId; }
    public void setWorkspaceId(Long workspaceId) { this.workspaceId = workspaceId; }

    public String getProviderInvoiceId() { return providerInvoiceId; }
    public void setProviderInvoiceId(String providerInvoiceId) { this.providerInvoiceId = providerInvoiceId; }

    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }

    public Integer getAmountCents() { return amountCents; }
    public void setAmountCents(Integer amountCents) { this.amountCents = amountCents; }

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
