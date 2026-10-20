-- V3__billing_invoices.sql
-- Lightweight invoice persistence cache for customer billing history

CREATE TABLE IF NOT EXISTS billing_invoices (
    id BIGSERIAL PRIMARY KEY,
    workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    provider_invoice_id VARCHAR(100) NOT NULL UNIQUE,
    invoice_number VARCHAR(100),
    amount_cents INTEGER NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'usd',
    status VARCHAR(32) NOT NULL DEFAULT 'paid',
    hosted_invoice_url VARCHAR(1000),
    pdf_url VARCHAR(1000),
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_ws_created ON billing_invoices (workspace_id, created_at DESC);
