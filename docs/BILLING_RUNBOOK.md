# AI Verify — Billing Runbook (Stripe)

This runbook documents how commercial billing is configured, tested locally with Stripe CLI, and operated.

---

## 1. Architecture Overview

Billing is env-driven and completely decoupled:
- **`BillingProvider` interface**: All Stripe-specific SDK calls (`com.stripe.*`) are encapsulated inside `StripeBillingProvider`. The rest of the backend only deals with internal plan definitions, workspace IDs, and entitlements.
- **`DisabledBillingProvider`**: When `BILLING_ENABLED=false` or Stripe keys are absent, the application boots cleanly on the `FREE` plan. Checkout and customer portal endpoints return HTTP `503 BILLING_UNAVAILABLE`.
- **Idempotency**: Webhook events are deduplicated via the `processed_webhooks` table (`existsByProviderEventId`). Duplicate webhook replays are safely ignored as no-ops.
- **Subscription State Machine**:
  - `trialing` → Plan active with trial end date.
  - `active` → Full plan entitlements.
  - `past_due` → 7-day soft grace period before dropping back to `FREE`.
  - `canceled` → Access retained until `current_period_end` (never revoked mid-period). Downgraded to `FREE` only after period expiry.
- **Invoice Cache**: Customer invoices are asynchronously persisted to `billing_invoices` upon receiving `invoice.paid` and `invoice.payment_failed` webhooks, avoiding external Stripe API calls on page visits.

---

## 2. Environment Configuration

Add the following to `backend/.env` (or environment variables in production):

```env
# Billing toggles
BILLING_ENABLED=true
BILLING_PROVIDER=stripe
APP_PUBLIC_URL=http://localhost:3000
BILLING_TRIAL_DAYS=14
BILLING_GRACE_DAYS=7

# Stripe API Keys (Test or Live)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PORTAL_CONFIGURATION_ID=bpc_...

# Stripe Price IDs
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
STRIPE_PRICE_TEAM_MONTHLY=price_...
```

---

## 3. Local Development with Stripe CLI

To test Stripe Checkout, Customer Portal, and Webhooks locally:

1. **Log in to Stripe CLI**:
   ```bash
   stripe login
   ```

2. **Forward Webhook Events**:
   ```bash
   stripe listen --forward-to localhost:8080/api/billing/webhook
   ```
   *Note the webhook signing secret printed by the CLI (`whsec_...`) and place it into `STRIPE_WEBHOOK_SECRET` in `backend/.env`.*

3. **Trigger Test Events**:
   ```bash
   # Test checkout session completion
   stripe trigger checkout.session.completed

   # Test invoice payment
   stripe trigger invoice.paid

   # Test failed payment
   stripe trigger invoice.payment_failed

   # Test subscription cancellation
   stripe trigger customer.subscription.deleted
   ```

---

## 4. Operational Endpoints

| Endpoint | Method | Auth | Description |
| :--- | :--- | :--- | :--- |
| `/api/billing/plans` | `GET` | Public | Commercial plan definitions (cached 5 min) |
| `/api/billing/entitlements` | `GET` | Authenticated | Effective workspace plan limits and flags |
| `/api/billing/checkout` | `POST` | Authenticated | Creates a Stripe Checkout session |
| `/api/billing/portal` | `POST` | Authenticated | Creates a Stripe Customer Portal session |
| `/api/billing/webhook` | `POST` | Public | Signature-verified webhook receiver |
| `/api/billing/invoices` | `GET` | Authenticated | Paginated customer invoice history |
| `/api/usage` | `GET` | Authenticated | Current usage counters and quota limits |

---

## 5. Troubleshooting & FAQ

- **Checkout returns 503 `BILLING_UNAVAILABLE`:**
  Check that `BILLING_ENABLED=true` and `STRIPE_SECRET_KEY` is not empty in the backend environment.
- **Webhook returns 400 `BILLING_ERROR`:**
  Verify that `STRIPE_WEBHOOK_SECRET` matches the endpoint secret in the Stripe Dashboard or the active `stripe listen` session.
- **Replayed webhook has no effect:**
  Expected behavior. The `processed_webhooks` table enforces idempotency and records each event ID once.
