# AI VERIFY — DESIGN-LOCKED SaaS CONVERSION PROMPT

> **How to use this file:** Paste this entire document into your coding agent (Antigravity, Cursor, Claude Code, Codex, etc.) as the work order. Execute **one phase per session**, in order. Do not begin a phase until the previous phase's acceptance checks pass.
>
> This document supersedes `ANTIGRAVITY_PROMPT.md` for **Phase 2 (SaaS)** and **Phase 3 (Ops)**. `ANTIGRAVITY_PROMPT.md` Phase 0 and Phase 1 are already largely complete — see the audit below. If this document and the code disagree, **trust the code** and report the discrepancy instead of silently "fixing" it.

---

## 0. ROLE, OPERATING RULES, AND THE ONE NON-NEGOTIABLE

You are the implementation agent for **AI Verify**, a production-bound content-authenticity SaaS.

**The product rule:** AI Verify analyzes text for patterns associated with AI-generated content and returns a score, linguistic metrics, and an explanation. It is decision support — never proof of authorship.

**Rules for every task:**

1. **Keep the existing stack.** React 19 + Vite 6 + TypeScript + Tailwind v4 + React Router 7 + Clerk + Axios + Motion/GSAP + Recharts + jsPDF on the frontend; Spring Boot 3.4.5 + Java 21 + PostgreSQL + JPA + Spring Security (Clerk JWT resource server) on the backend. Do not introduce a new framework, state manager, component library, CSS framework, or icon set.
2. **THE DESIGN IS FROZEN.** Minimalism and typography are not negotiable. You are adding commercial infrastructure, not redesigning the product. Section 2 is a binding contract. Every new surface must look like it already belonged to this app.
3. **Never fabricate product output, usage, customers, logos, testimonials, accuracy claims, certifications, or latency numbers.** This is the project's #1 product rule and it applies to pricing and marketing too.
4. **Never commit secrets.** Add every new environment variable to the matching `.env.example`. Never hardcode keys, price IDs, or webhook secrets.
5. **Small, focused commits** (`feat:`, `fix:`, `chore:`, `docs:`). One concern per commit.
6. **Ask before destructive actions:** deleting files/folders, rewriting git history, dropping columns/tables, or changing existing user data in a way that cannot be reversed.
7. **Preserve existing API contracts** unless a task explicitly changes them. New endpoints follow the existing controller/`ApiResponse` patterns.
8. **Every phase ends green:** frontend `npm run lint` + `npm run build`, backend `.\mvnw.cmd -q -DskipTests compile`, and the phase's tests.
9. **Do not modify files under `frontend/src/new-ui/` or `frontend-new/`.** They are pending-deletion references (see `docs/P1.2_MIGRATION.md` §13). Work only in canonical `frontend/src/**`.
10. **Report honestly.** If a task is blocked, say what is blocked and why. Do not fake a passing check.

---

## 1. VERIFIED CURRENT STATE (READ FIRST — DO NOT RE-AUDIT FROM SCRATCH)

### 1.1 Stack and entry points

| Layer | Reality |
| :--- | :--- |
| Frontend app | `frontend/` — React 19, Vite 6, TS 5.8, Tailwind 4, React Router 7 |
| Canonical source | `frontend/src/` (`main.tsx` → `App.tsx` → `pages/*`, `components/*`) |
| Public shell | `Landing.tsx` (also rendered at `/product`), `SignIn`, `SignUp` |
| Workspace shell | `WorkspaceLayout.tsx` → `Sidebar.tsx` + `AppHeader.tsx` + `<Outlet />` |
| Auth | Clerk (`@clerk/clerk-react` 5.x). `ClerkProvider` in `main.tsx`; `AuthContext` wraps Clerk hooks; Axios attaches `Authorization: Bearer <token>` |
| Backend | `backend/` — Spring Boot 3.4.5, Java 21, PostgreSQL, JPA, Spring Security OAuth2 resource server (Clerk JWT) |
| AI providers | OpenRouter primary, plus Gemini/Mistral/NVIDIA services |
| DB schema | **No migration tool.** Dev `ddl-auto: update`, prod `ddl-auto: validate` |
| Tests | Backend: `contextLoads` only. Frontend: none |
| CI/CD | None. No root compose file. Backend has a Dockerfile |

### 1.2 Routes today (`frontend/src/App.tsx`)

| Route | Access | Renders |
| :--- | :--- | :--- |
| `/` | Public | `Landing.tsx` |
| `/product` | Public | `Landing.tsx` (stopgap) |
| `/signin/*`, `/signup/*` | Public | Clerk components |
| `/dashboard` | Protected | Dashboard |
| `/detection` | Protected | Detection |
| `/history` | Protected | History |
| `/reports` | Protected | Reports |
| `/advisor` | Protected | Advisor |
| `/how-it-works` | Protected | How It Works |
| `/forensics` | Protected | Alias of How It Works |
| `/settings` | Protected | Settings |
| `/enterprise`, `/security` | Protected | Redirect to `/how-it-works` |
| `*` | Public | Redirect to `/` |

There is **no `/pricing`, `/billing`, `/admin`, `/terms`, `/privacy`, or `/onboarding` route.**

### 1.3 Backend endpoints that exist

- `POST /api/detect/bulk-ai` — runs detection; persists history **asynchronously via `CompletableFuture.runAsync`** (no executor, no retry).
- `POST /api/chat` — Advisor.
- `GET /api/detections/recent`, `GET /api/detections/all`, `POST /api/detections`, `DELETE /api/detections/{id}`.
- `GET /api/dashboard/summary`.
- `GET /api/user/me`, `/profile`, `PUT /profile/{username,email,password}`, `POST /register`.
- `GET /api/chats/{recent,all}`, `DELETE /api/chats/{id}`.
- `GET/POST/PUT/DELETE /api/admin/users...`, `/api/admin/history/...`, `/api/chats/admin/...`.
- `/actuator/health`, Swagger at `/swagger-ui.html`.

### 1.4 What is already done (do not redo)

- Phase 0: fake results removed, routes protected, CSRF/cookie consistency, rate-limit proxy hardening, `.gitignore`.
- Phase 1.1: `navigation.ts` is the single nav source (`NAV_GROUPS`, `isNavItemActive`, `getPageTitle`).
- Phase 1.2: workspace shell and pages ported to the modern visual layer (Steps A–D complete; Step E file deletion still **awaiting owner sign-off**).

### 1.5 What is genuinely missing (the actual SaaS gap)

| Gap | Evidence |
| :--- | :--- |
| Plans / entitlements / quotas | No `plan`, `subscription`, `usage`, `quota`, or `billing` references anywhere |
| Payments | No Stripe (or any) SDK, no checkout, no webhook, no portal |
| Teams / seats / RBAC | `User.roles` is a free-text string; no workspace/organization, no invitations |
| Report persistence | Reports are derived from detection history; no `Report` entity |
| Pagination / bulk export | History loads everything; client-side pagination only |
| Lifecycle email | No mail dependency and no templates |
| Admin UI | Admin APIs exist, no UI |
| Legal / trust pages | Terms, Privacy, DPA, Contact, cookie consent do not exist |
| Observability / analytics | No Sentry, no analytics helper |
| Tests / CI / local compose | None |
| Production DB migrations | None (`ddl-auto: update/validate`) |

### 1.6 Known defects to fix before building on top

1. **Hardcoded OpenRouter API key in `backend/src/main/resources/application-dev.yml`** (`openrouter.api.key` default value). Remove it, replace with `${OPENROUTER_API_KEY:}`, rotate the key, and confirm it never appears in git history. Treat this as **P0-A, the first task**.
2. **Tenancy is keyed by mutable `username` strings** (`DetectionHistory.username`, `ChatHistory.username`). SaaS needs a stable `user_id` and `workspace_id`. Plan a backfill, not a rename.
3. **Async persistence is fire-and-forget.** Detection results can silently fail to save, and it is untestable. Move to a bounded executor / `@Async` with a transaction or an outbox.
4. **Identity is Clerk ID stuffed into `username`** (`UserService.getOrCreateClerkUser`: `safeUsername = clerkId...`). Add a real `clerk_id` column.
5. **Two token palettes coexist** in `index.css`: legacy "Verdant Glass" (`#f5f5f0`, `#174d3b`, `#dcded7`) and new-UI slate/emerald (`#f8fafc`, `#059669`). This is the current intentional look. Do **not** normalize it as part of SaaS work; use the correct set per surface and screenshot-diff any consolidation.
6. **Typography is intentionally mixed:** DM Sans body, Manrope for `.page-title h1` and hero headings, Sora via `.font-display`, JetBrains Mono for data. Do **not** "unify" it.

---

## 2. DESIGN CONTRACT — MINIMALISM AND TYPOGRAPHY ARE FROZEN

This section is binding for every new screen, modal, email, and state.

### 2.1 Absolute prohibitions

- **No new font families.** No Inter, Geist, Satoshi, Instrument, Roboto, Poppins, or display serif. The only allowed families are already loaded in `frontend/src/index.css`: **DM Sans** (body), **Manrope** (page/hero headings), **Sora** (`.font-display`), **JetBrains Mono** (`.font-mono`).
- **No typography refactors.** Do not change `.page-title h1` from Manrope to Sora. Do not change the hero clamp. Do not add `font-display` to elements that currently use Manrope.
- **No new color palette.** Use the CSS variables and existing Tailwind neutral/emerald tokens. No purple/blue "SaaS" gradients, no neon, no glassmorphism beyond the existing `.glass-card` / `.glass-panel`.
- **No new icon library.** `lucide-react` only, rendered at `w-4 h-4` (16px) in dense UI, `w-5 h-5` (20px) in empty states. No emoji in new UI.
- **No new card style.** Pricing, billing, usage, team, and admin cards reuse `.glass-card` / `.glass-panel` or a plain `1px solid var(--line)` surface. Never stack cards inside cards.
- **No decorative illustration, stock photography, fake dashboard screenshots, or AI-generated imagery.** Data visuals must be real or honestly empty.
- **No pill-shaped containers** except badges, status dots, segmented controls, and the hero eyebrow. Cards use `--radius-md`/`--radius-lg`, not `999px`.
- **No marketing hype typography.** No 72px headlines, no all-caps shouting, no gradient text on pricing. One idea per section.
- **No dark patterns.** No countdown timers, fake "only 2 seats left", pre-checked upsells, hidden cancellation, or confirm-shaming.
- **No layout re-architecture of existing pages.** Adding a section to Settings is allowed; changing the workspace shell, sidebar, header, or page rhythm is not.

### 2.2 Locked color tokens (`frontend/src/index.css`)

**Light**

| Token | Value | Use |
| :--- | :--- | :--- |
| `--bg` | `#f5f5f0` | App background |
| `--surface` | `#ffffff` | Cards, panels |
| `--surface-2` | `#eeefe9` | Inset rows, secondary buttons |
| `--ink` | `#20241f` | Primary text |
| `--muted` | `#6b716b` | Secondary text |
| `--line` | `#dcded7` | 1px borders/dividers |
| `--green` | `#174d3b` | Primary brand, primary CTA |
| `--green-2` | `#dce8d8` | Selected/soft green fill |
| `--sage` | `#eff3e7` | Ghost hover, quiet surface |
| `--amber` | `#9a6218` | Caution / AI-pattern risk |
| `--amber-bg` | `#f7ecd7` | Caution fill |
| `--citrine` | `#c8b83d` | Sparse accent only |

**Dark**

| Token | Value |
| :--- | :--- |
| `--bg` | `#161916` |
| `--surface` | `#1e221f` |
| `--surface-2` | `#252a26` |
| `--ink` | `#f1f3ed` |
| `--muted` | `#a8aea7` |
| `--line` | `#343a35` |
| `--green` | `#86b99a` |
| `--green-2` | `#273c30` |
| `--sage` | `#253029` |
| `--amber` | `#e0aa60` |
| `--amber-bg` | `#3a3022` |

**Tailwind/shell tokens (secondary, already in use):** `#f8fafc` bg, `#0f172a` text, `#64748b` muted, emerald `#059669`. Use these only where the surrounding shell already uses them (Sidebar, AppHeader, Dashboard, Detection, History, Reports, Advisor, Settings Tailwind sections). Do not mix both palettes inside one card.

### 2.3 Locked type scale

| Role | Spec |
| :--- | :--- |
| Marketing hero H1 | `700 56px/1.12 "Manrope"`, `letter-spacing: -0.035em`; 42px ≤900px; 32px ≤600px |
| Workspace page H1 | `600 34px/1.2 "Manrope"`, `letter-spacing: -0.035em` |
| Section H2 | `600 30px/1.25 "Manrope"`, `-0.03em` (hero panels); Sora 18–22px for card/section titles |
| Body | DM Sans `14px/1.6`; lede `17px/1.65`; long-form legal `15px/1.75` |
| UI text / buttons | DM Sans `12–13px`, weight 600–700 |
| Eyebrow / label | `10–11px`, uppercase, `letter-spacing: 0.06–0.14em`, muted |
| Micro labels | existing `9px` only; **new surfaces must not go below 11px** |
| Numerals (price, usage, counts) | Sora or Manrope 600–700 with `font-variant-numeric: tabular-nums` |
| IDs / endpoints / code | JetBrains Mono `11–12px` |

**Rules:** Max two weights per section (regular + semibold/bold). Line height never below 1.35 for prose. Headings never use pure black; use `--ink`. Never center long-form prose. Never use letter-spacing on body text.

### 2.4 Spacing, width, radius, shadow

| Token | Value |
| :--- | :--- |
| Workspace page container | `.page` = max-width `1240px`, padding `52px 52px 80px`; `.page.narrow` = `1000px` |
| Marketing container | `1320px` outer, `1200px` hero, `840px` hero copy, `820px` headline |
| Section rhythm | `38px` after page title; `24–32px` between sections; `16–20px` inside cards |
| Card padding | `20–28px` (workspace), `32–42px` (marketing feature panels) |
| Radii | `--radius-sm 8px` (buttons/inputs), `--radius-md 14px` (cards), `--radius-lg 20px` (large panels), `--radius-xl 28px` (rare) |
| Borders | Always `1px solid var(--line)`; never 2px+ |
| Shadows | `--shadow-card` / `--shadow-elevated` only; no colored glows on new surfaces |

### 2.5 Component recipes

- **Primary CTA:** `.button.primary` (8px radius, `--green` fill, white text, 12px/700). One primary CTA per viewport.
- **Secondary CTA:** `.button.secondary` (surface fill, 1px line). **Ghost:** `.button.ghost`.
- **Badges:** `.badge` with `sage` / `amber` / `neutral`; 9–11px uppercase, `99px` radius. Use `sage` for "Current plan", `amber` for "Trial ends soon" / quota warnings, never for celebration.
- **Cards:** `.glass-card` for content cards; `.glass-panel` for large containers. Pricing cards may use a plain `--surface` with a 1px divider grid instead (preferred).
- **Inputs:** use existing border/radius language; label 11px uppercase muted, input 13px, focus ring `--green`. Never floating labels.
- **Tables:** reuse `.table-shell` / `.table-head` / `.table-row` patterns from History. Row height 56–64px, 1px `--line` separators, no zebra striping.
- **Usage meter:** 6px track in `--surface-2`, fill in `--green`; over 80% amber, over 100% `--amber` with a text explanation. Always show "X of Y used" in 11px tabular numerals.
- **Empty states:** icon 20px, one 14px sentence, one secondary CTA. No illustrations.
- **Modals:** reuse `components/Modal.tsx`. Max width 480px, 20px radius, no full-screen takeover.
- **Motion:** existing durations 150–300ms, ease-out; reuse `PageTransition`, `ScrollReveal`, `motion/react`. Respect `prefers-reduced-motion` (already global). No new scroll-jacking, no parallax on pricing.

### 2.6 Copy and voice

- Sentence case for headings and buttons (existing legacy all-caps eyebrows are fine).
- Measured, specific, non-sensational. "Analyze text patterns", not "uncover the truth".
- Every number must be real, configurable, or clearly labeled as a limit. "20 analyses per month" is fine; "10M+ scans" is not.
- Always keep the disclaimer: a score is not proof of authorship. Pricing/legal pages must not contradict it.
- Invoices, plan names, and limits must match what the backend enforces. If UI and backend can drift, the UI reads the backend.

### 2.7 The visual regression gate (mandatory in every phase)

Before touching code, capture **baseline** screenshots at `1440px`, `1024px`, and `390px`, in light and dark, for:

`/`, `/signin`, `/dashboard`, `/detection`, `/history`, `/reports`, `/advisor`, `/how-it-works`, `/settings`

After the phase, recapture. **Acceptance:** existing routes show no pixel change beyond intentional additions; no font, spacing, radius, or color drift; no cumulative layout shift. Store screenshots in `docs/design-baseline/` (git-ignored) and list any intentional diffs in the report. New SaaS surfaces are exempt from pixel-diff but must pass the contract above.

---

## 3. COMMERCIAL MODEL (DEFAULTS — ALL CONFIGURABLE SERVER-SIDE)

Do not hardcode these in the frontend. Define a single server-side catalog; the UI fetches it.

| Entitlement | FREE | PRO | TEAM |
| :--- | :--- | :--- | :--- |
| Price | $0 | $19 / month, $190 / year | $49 / seat / month |
| Analyses | 20 / month | 1,000 / month | 10,000 / month pooled (fair use) |
| Max characters per analysis | 5,000 | 50,000 | 200,000 |
| Max upload size | 2 MB | 10 MB | 25 MB |
| Advisor messages | 10 / month | 300 / month | 2,000 / month pooled |
| History retention | 30 days | 365 days | 730 days |
| Seats | 1 | 1 | 3–25 |
| CSV/JSON export | ✗ | ✓ | ✓ |
| API access | ✗ | ✗ | ✓ |
| Support | Community | Email | Priority email |
| Overage | Hard stop | Soft grace, then stop | Soft grace, then stop |

**Enforcement rules:**
- Enforce **server-side**, before the AI provider call, in one place (`EntitlementService` + quota check). The frontend is never the source of truth.
- Reserve usage atomically (`UPDATE ... WHERE used < limit`) to prevent concurrent overspend.
- Record every billable action in an append-only `usage_event` table. Counters are derived/cached, never hand-edited.
- Hard limit → HTTP `402` with a machine-readable code. Rate limiting → `429`. Never return `200` with a silent downgrade.
- Annual plans: 2 months free. Trials: 14 days, once per customer, card optional (configurable). Grace period: 7 days after failed payment, then downgrade to FREE (data retained per retention policy).

**Error envelope (must match existing style):**

```json
{
  "timestamp": "2026-10-19T10:00:00Z",
  "status": 402,
  "code": "QUOTA_EXCEEDED",
  "message": "You have used all 20 analyses in your current period.",
  "details": {
    "entitlement": "scans",
    "used": 20,
    "limit": 20,
    "resetsAt": "2026-11-01T00:00:00Z",
    "upgradeUrl": "/pricing"
  }
}
```

Codes: `QUOTA_EXCEEDED`, `PLAN_REQUIRED`, `TRIAL_EXPIRED`, `SUBSCRIPTION_PAST_DUE`, `SEAT_LIMIT_REACHED`, `FEATURE_NOT_IN_PLAN`.

---

## 4. TARGET ARCHITECTURE

### 4.1 Data model (additive, Flyway-managed)

Create migrations with **Flyway** (`spring-boot-starter-flyway` / `flyway-core` + `flyway-database-postgresql`); baseline the existing schema, then add:

- `users`: `clerk_id` (unique, nullable for legacy rows), `default_workspace_id`, `plan` (denormalized cache only), `trial_ends_at`, `deleted_at`.
- `workspaces`: `id`, `name`, `slug`, `owner_user_id`, `created_at`.
- `memberships`: `workspace_id`, `user_id`, `role` (`OWNER|ADMIN|MEMBER|VIEWER`), unique pair.
- `invitations`: `workspace_id`, `email`, `role`, `token_hash`, `expires_at`, `accepted_at`.
- `subscriptions`: `workspace_id`, `provider` (`stripe`), `provider_customer_id`, `provider_subscription_id`, `plan`, `status`, `current_period_start/end`, `cancel_at_period_end`, `seats`, `trial_end`.
- `usage_events`: `id`, `workspace_id`, `user_id`, `kind`, `quantity`, `request_id`, `created_at` (append-only; indexed by workspace + period).
- `usage_counters`: `workspace_id`, `period_start`, `kind`, `used`, `limit` (atomic update; rebuildable from events).
- `processed_webhooks`: `provider_event_id` unique, `processed_at` (idempotency).
- `audit_events`: `workspace_id`, `actor_user_id`, `action`, `target`, `metadata`, `created_at` (security-relevant events only).
- `reports`: `id`, `workspace_id`, `user_id`, `detection_id`, `title`, `created_at` (real persistence; no fake `READY` status).
- Add `workspace_id` + `user_id` to `detection_history` and `chat_history`; keep `username` temporarily for compatibility, then stop reading it.

**Backfill:** every existing user gets a personal workspace; existing detections/chats are attached by resolving `username` → user → workspace. Log unmatched rows; do not delete them.

**Prod safety:** switch `ddl-auto` to `validate` in dev too once Flyway is in place. Never let Hibernate mutate production schema.

### 4.2 Backend layering (follow existing package style)

`com.springboot.ai_verify`:

- `billing/` — `BillingProvider` interface (`createCheckout`, `createPortal`, `parseWebhook`, `syncSubscription`), `StripeBillingProvider`, `BillingController`, `BillingService`, `WebhookVerifier`.
- `entitlement/` — `PlanCatalog` (config-bound), `EntitlementService`, `QuotaService`, `UsageService`, `EntitlementException`.
- `workspace/` — `WorkspaceService`, `MembershipService`, `InvitationService`, `WorkspaceController`.
- `report/` — `Report` entity, repository, service, controller.
- `audit/` — `AuditService`.
- `config/` — `BillingProperties`, `PlanProperties`, `AsyncConfig`, `SecurityConfig` additions.

**RBAC:** keep `ROLE_ADMIN` for the platform admin. Add workspace roles evaluated in the service layer (`@PreAuthorize` or explicit checks). Never trust a `workspaceId` from the request without verifying membership. A user must never read, export, or delete another user's/workspace's records (add the missing authorization tests).

**Billing provider isolation:** all Stripe types stay inside `StripeBillingProvider`. The rest of the app sees plans/status only. If Stripe is unavailable in your operating country, implement the same interface with Razorpay/Paddle; do not fork business logic.

### 4.3 Stripe configuration (disabled cleanly when absent)

Add to `backend/.env.example` and `backend/.env`:

```env
BILLING_ENABLED=false
BILLING_PROVIDER=stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PRO_MONTHLY=
STRIPE_PRICE_PRO_YEARLY=
STRIPE_PRICE_TEAM_MONTHLY=
STRIPE_PORTAL_CONFIGURATION_ID=
APP_PUBLIC_URL=http://localhost:3000
BILLING_TRIAL_DAYS=14
BILLING_GRACE_DAYS=7
```

When `BILLING_ENABLED=false`: `/pricing` still renders from the catalog, checkout returns `503 BILLING_UNAVAILABLE`, and no Stripe bean loads. **The app must boot and remain fully usable on FREE.**

Webhook endpoint: `POST /api/billing/webhook` — must be public in Security config, verify signature, reject replays via `processed_webhooks`, and be idempotent. Never trust the event body without verification. Handle at minimum: `checkout.session.completed`, `customer.subscription.created|updated|deleted`, `invoice.paid`, `invoice.payment_failed`.

---

## 5. PHASES

### PHASE A — Baseline, security, design lock (do this first)

**Tasks**

1. **A1 — Remove the leaked OpenRouter key.** `backend/src/main/resources/application-dev.yml`: replace the hardcoded `openrouter.api.key` default with `${OPENROUTER_API_KEY:}`. Delete the stale compiled copy under `backend/target/classes/` (rebuild will regenerate it). Rotate the key in the provider console; treat it as compromised. Confirm `git log -S` and a tracked-file scan find no other copy. Add a rotation note to `docs/SAAS_SETUP.md`.
2. **A2 — Capture the design baseline.** Screenshots per §2.7. Record computed styles for body, `.page-title h1`, `.hero-copy h1`, buttons, cards. Save a `docs/design-baseline/README.md` with the commands used.
3. **A3 — Add Flyway + baseline migration.** Verify the app starts against a fresh Postgres DB and against an existing one. Add `docs/SAAS_SETUP.md` migration instructions.
4. **A4 — Add async executor.** Replace bare `CompletableFuture.runAsync` with a bounded `ThreadPoolTaskExecutor` (`AsyncConfig`), log failures, and add a test that a persistence failure does not fail the detection response but is recorded.
5. **A5 — Add missing guardrails:** `NotFound.tsx`, React `ErrorBoundary`, per-route `document.title`, dynamic footer year, and unify branding to **AI Verify** (currently "AI-Verify" in the sidebar). Keep the existing visual style exactly.
6. **A6 — Stop the remaining dead routes or give them honest pages.** `/product` currently renders Landing; `/enterprise` and `/security` redirect. Either build honest pages or remove them from navigation/footer. No dead links.

**Acceptance:** no secret in tracked files; app boots with `BILLING_ENABLED` absent; baseline screenshots stored; Flyway migrates cleanly; packaging still builds.

---

### PHASE B — Tenancy, plans, entitlements, quotas (backend-first)

**Tasks**

1. **B1 — Schema + entities** from §4.1. Personal workspace auto-created on Clerk provisioning; backfill existing users and rows.
2. **B2 — `PlanCatalog`** bound to `application.yml` (`app.plans.free.*`, `app.plans.pro.*`, `app.plans.team.*`). One source of truth. Expose `GET /api/billing/plans` (public, cached 5 min).
3. **B3 — `EntitlementService`** resolving effective plan: active subscription → plan; trial → plan with trial end; past due within grace → plan; else FREE.
4. **B4 — `QuotaService`**: atomic reservation + commit/rollback around each billable action. Wire into:
   - `POST /api/detect/bulk-ai` (scan count + characters; reject before provider call)
   - `POST /api/chat` (advisor messages)
   - file upload size (server-side check; never trust the client limit)
   - CSV/JSON export (plan feature)
   - history retention (read filter; scheduled purge job)
5. **B5 — `GET /api/usage`** returns current period, per-entitlement used/limit/resetsAt, plan, subscription status, and seats. Cacheable for 30s.
6. **B6 — `GET /api/billing/entitlements`** for the UI. Frontend may use it to hide unavailable affordances, but the server remains authoritative.
7. **B7 — Audit + authorization tests:** user A cannot read/delete user B; non-member cannot access workspace; FREE cannot exceed limits; concurrent requests cannot overspend (test with parallel calls).

**Acceptance:** FREE user blocked at 20 analyses with `402 QUOTA_EXCEEDED`; usage increments exactly once per successful scan; failed provider calls consume no quota; all authorization tests pass.

**Do not build UI yet.**

---

### PHASE C — Billing (Stripe, env-driven)

**Tasks**

1. **C1 — `BillingProvider` + `StripeBillingProvider`.** Checkout Session (subscription mode, `client_reference_id = workspaceId`, customer reuse, trial per config), Billing Portal session, webhook verification.
2. **C2 — Webhook processing** with idempotency, signature verification, and a state machine: `trialing → active → past_due → canceled/unpaid`. On `checkout.session.completed`, link customer/subscription to the workspace. On deletion, set `cancel_at_period_end` or downgrade at period end — never revoke mid-period.
3. **C3 — Invoices for the customer.** Persist a lightweight `billing_invoices` cache from webhook events (number, amount, currency, status, hosted invoice URL, PDF URL). Do not call Stripe on every page load.
4. **C4 — Plan changes.** Upgrade (immediate, prorated), downgrade (at period end), seat quantity update for TEAM. Confirm with a modal that states the effective date and the amount.
5. **C5 — Disabled mode.** `BILLING_ENABLED=false` → no Stripe bean, checkout returns `503`, `/pricing` still renders, Settings shows "Billing is not enabled on this deployment" honestly.
6. **C6 — Tests:** webhook replay ignored; signature invalid → 400; upgrade/downgrade transitions; grace period; portal URL creation mocked.

**Acceptance:** Stripe CLI forwards events locally; a test-mode checkout upgrades the workspace; cancellation retains access until period end; replaying a webhook does not double-apply; app boots with billing disabled.

---

### PHASE D — SaaS product surfaces (the visible part — obey §2 exactly)

Add only these new routes. Do not restyle existing ones.

#### D1 — `/pricing` (public)

**Layout (minimal, editorial):**
- Reuse the public marketing shell (landing nav + footer). Container `1200px`, top padding `72px`, bottom `84px`.
- Header: centered, max `720px`. Eyebrow `PRICING` (10px, 0.14em, muted). H1 `600 40px/1.15 "Manrope"`, `-0.03em`. One sentence of 15px muted copy. Nothing else.
- Monthly/Annual segmented control: 11px, 8px radius, `--surface-2` track, selected `--surface` + 1px line. Annual shows "2 months free" as a plain `sage` badge, not a starburst.
- Three plan columns inside **one** `--surface` container with `1px solid var(--line)` and `--radius-lg`. Desktop: 3 equal columns separated by 1px vertical `--line`; mobile: stacked with horizontal dividers. No floating cards, no shadows, no scale-on-hover.
- Plan header: name in Sora 15px/700, price in Manrope 40px/700 with `tabular-nums`, `/month` or `/year` in 13px muted, one 13px muted sentence.
- Feature list: 13px, `1.75` line height, 1px separators, check icons 14px in `--green`. No emoji.
- CTA per column: FREE = secondary "Start free"; PRO = primary "Start 14-day trial"; TEAM = secondary "Contact sales" (mailto or `/contact`). One primary CTA total.
- PRO emphasis: `sage` "Most popular" badge and a 1px `--green` top border. No glow, no black card, no oversized price.
- Below: a comparison table (13px, sticky header, `--line` rows) and an FAQ using the landing FAQ disclosure pattern. Include: what counts as an analysis, what happens at the limit, can I cancel, is my text stored, refunds, VAT/tax.
- Footnotes must state: prices exclude tax where applicable; limits reset monthly; "AI pattern score is not proof of authorship."

**Behavior:** read plans from `GET /api/billing/plans`; if billing is disabled, CTAs open sign-up (`/signup`) and TEAM opens mailto. If signed in, checkout goes straight to Stripe; if not, send to `/signup?next=/pricing&plan=pro`.

**Acceptance:** no fabricated logos/testimonials/stats; mobile at 390px has no horizontal scroll; both themes pass contrast; Lighthouse a11y ≥95; no font outside the four allowed families.

#### D2 — `/settings/billing` (protected) or a Billing tab inside Settings

Prefer a **Billing section inside the existing Settings page** to avoid navigation sprawl; add `?tab=billing` only if needed.

Sections, each a `.glass-card` with a 16px gap:
1. **Current plan** — plan name (Sora 18px), status badge (`sage` active/trial, `amber` past due), renewal date 13px muted, seats. Buttons: "Change plan" (secondary → `/pricing`), "Manage billing" (secondary → portal), "Cancel" (ghost, destructive confirmation).
2. **Usage this period** — three rows: analyses, advisor messages, storage/characters. Each row: label 11px uppercase muted, value `used / limit` 13px tabular, 6px meter. Reset date at the bottom in 11px muted. If no usage, show `0 / 20` honestly, not a fake chart.
3. **Invoices** — table rows: date (13px), invoice number (JetBrains Mono 11px), amount (tabular), status badge, "PDF" link. Empty state: "No invoices yet." Never fake one.
4. **Payment method** — last four + brand from Stripe; "Update" opens the portal. If unavailable, say so.
5. **Danger zone** — cancellation terms, data retention statement, link to delete account. Keep existing honesty language for "Clear local browser data".

**Acceptance:** a FREE user sees upgrade CTAs and an honest empty invoice table; a PRO user sees renewal date and portal; no plan data is inferred from the URL; all states render in light/dark.

#### D3 — Quota and upgrade surfaces

- **Inline usage strip** on `/dashboard` and `/detection`, directly under the page title: 11px muted text + 6px meter + text link "View plans". No card, no border, no icon unless needed.
- **At 80%:** amber text, no modal. **At 100%:** `--amber` fill + honest sentence and a secondary "View plans" button. The analyze button remains enabled but the request returns `402`; render the returned message inline above the editor with the reset date.
- **Hard-limit modal** only when the user attempts an action that cannot proceed: reuse `Modal.tsx`, title "Monthly limit reached", body with used/limit/reset, primary "View plans", secondary "Not now". No countdown, no discount popup.
- **Trial banner:** a single 1px-bordered row at the top of the workspace (not a floating toast) for trials ending in ≤3 days: "Trial ends in 3 days" + "Add payment method". Dismissible for the session only.
- Never block reading existing history/reports when over quota. Never delete data on downgrade; only restrict new analyses beyond retention.

#### D4 — `/admin` (ADMIN only)

- Guard with `ProtectedRoute` + admin check; backend already guards `/api/admin/**`.
- Reuse the workspace shell. Page title "Admin". Dense table: user, plan, status, scans (30d), last active, actions. Search + pagination (server-side). Mono IDs. Row actions: view, disable, delete (typed confirmation).
- Detail drawer reuses the History inspect drawer pattern: user, workspace, plan, usage, recent scans/chats, audit events.
- No new colors, no charts unless real data exists. Empty states honest.

#### D5 — Navigation updates

- Add "Plans & billing" to the Preferences nav group (Settings stays). Add `/pricing` to the public nav and footer.
- Keep `navigation.ts` as the only nav source. Add the icon mapping in `Sidebar.tsx` (`CreditCard` for billing, `ShieldCheck` for admin if shown).
- Admin link visible only to admins. Do not show dead links.

---

### PHASE E — Teams, seats, invitations (only if selling TEAM at launch)

1. Workspace switcher in the sidebar footer (a compact select, 12px, no new card). Personal workspace cannot be deleted.
2. `/settings/team`: member rows (avatar initials 24px, name, email, role, joined date), role select, remove, "Invite member" → existing Modal with email + role. Seat count must reconcile with Stripe quantity before inviting; if payment fails, do not add the seat.
3. Invitations: hashed single-use token, 7-day expiry, accept page `/invite/:token` (public, Clerk-aware). Must verify the signed-in email matches the invite.
4. RBAC: VIEWER read-only; MEMBER create scans; ADMIN manage members/settings; OWNER billing + delete workspace. Enforce server-side and hide (not just disable) forbidden actions.
5. Transfer ownership + leave workspace flows with typed confirmation.

**Acceptance:** cross-workspace access is impossible; seat limit blocks the 4th invite on a 3-seat plan with a clear `SEAT_LIMIT_REACHED` message; removing a member revokes access immediately.

---

### PHASE F — Reports, trust, lifecycle, and honest operations

1. **F1 — Persist reports.** "Create report" writes a `reports` row tied to a detection; the Reports page lists only real rows. No `READY`/`DRAFT` status unless the lifecycle is real. PDF export unchanged.
2. **F2 — History pagination + bulk actions.** Server-side `page/size/query/from/to/verdict`; bulk delete; CSV/JSON export gated by plan. Keep `/all` for compatibility but mark deprecated.
3. **F3 — Legal pages:** `/terms`, `/privacy`, `/dpa`, `/contact`, `/subprocessors`. Use the editorial long-form style: `760px` measure, 15px/1.75, Sora 22px H2, 1px section rules, no cards. Required content: data retention, AI provider subprocessors, no-training statement only if contractually true, deletion/export rights, governing law, contact. Add a signup agreement checkbox and a cookie/consent banner (functional only; no pre-checked analytics).
4. **F4 — Lifecycle email** (env-driven, safe log-only when unconfigured): welcome, trial ending (3 days), payment failed, receipt, quota 80%, invitation. Plain, text-first, minimal; no marketing blasts. Add `spring-boot-starter-mail` and templates.
5. **F5 — Account lifecycle:** export my data (JSON), delete account (typed confirmation, hard delete, cancel subscription first), email verification. Keep "Clear local browser data" clearly separate.
6. **F6 — Dunning and downgrade job:** daily scheduled job to expire trials, apply grace, downgrade, purge per retention, and rebuild usage counters. Idempotent, logged, tested.

---

### PHASE G — Ops, quality, launch

1. **G1 — Tests.** Backend: MockMvc integration tests for auth, quota, billing webhooks, workspace authorization, report persistence, pagination. Frontend: Vitest + Testing Library smoke tests for landing, protected redirect, honest error state, pricing render, quota modal.
2. **G2 — CI.** GitHub Actions: backend `./mvnw -B verify`, frontend `npm ci && npm run lint && npm run build && npm test`. Run on PR + main.
3. **G3 — Containers.** Root `docker-compose.yml` (Postgres + backend + frontend). Multi-stage frontend Dockerfile with SPA fallback and optional `/api` proxy. One-command local start.
4. **G4 — Observability.** Sentry frontend/backend, env-driven, disabled when empty; scrub PII/secrets. Provider-agnostic `track()` helper: page view, scan started/completed, quota hit, upgrade clicked, checkout completed, invite sent. Console-only in dev.
5. **G5 — Performance.** `/pricing` and `/` LCP < 2.5s on mid-tier mobile; route-level code splitting; no new heavy dependencies.
6. **G6 — Launch checklist.** Rotate every key; production cookie/CSRF/CORS; backups + restore test; refund/cancellation policy; support inbox; status page; incident runbook; Stripe live-mode smoke test; tax registration; DPA/subprocessors accurate.

---

## 6. API CONTRACT (NEW)

All authenticated endpoints require the Clerk bearer token. All workspace-scoped endpoints verify membership server-side.

```
GET    /api/billing/plans                 → public, plan catalog
GET    /api/billing/entitlements          → current plan + entitlements + seats
GET    /api/usage?period=current          → used/limit/resetsAt per entitlement
POST   /api/billing/checkout              → { plan, interval, seats? } → { url }
POST   /api/billing/portal                → { returnUrl } → { url }
POST   /api/billing/webhook                → public, signature-verified, idempotent
GET    /api/billing/invoices?page=0&size=20
GET    /api/workspaces                    → memberships for current user
POST   /api/workspaces                    → { name }
GET    /api/workspaces/{id}/members
POST   /api/workspaces/{id}/invitations   → { email, role }
DELETE /api/workspaces/{id}/members/{userId}
GET    /api/admin/users?page=&size=&q=    → admin only
GET    /api/reports?page=&size=           → real persisted reports
POST   /api/reports                       → { detectionId, title }
```

**Rules:** every list endpoint is paginated (`page`, `size` ≤ 100, `sort`). Never return unbounded user data. Every mutation is idempotent where retries are likely (billing, invitations, webhooks). Use the existing `ApiResponse` envelope where the neighboring controller already does; do not invent a second envelope style.

---

## 7. ACCEPTANCE GATES (BINARY — DO NOT SKIP)

**Design**
- [ ] No new font family appears in the built CSS; computed body = DM Sans, `.page-title h1` = Manrope, `.font-display` = Sora.
- [ ] New surfaces use only the tokens in §2.2 and radii 8/14/20; no 999px cards.
- [ ] Baseline routes are pixel-stable at 1440/1024/390 in both themes (unintentional diff = 0).
- [ ] Light and dark contrast ≥ 4.5:1 for body text; ≥ 3:1 for large text and UI borders.
- [ ] Lighthouse Accessibility ≥ 95 on `/`, `/pricing`, `/dashboard`; SEO ≥ 90 on `/` and `/pricing`.
- [ ] No emoji, no stock images, no fake dashboards, no invented stats anywhere.

**SaaS correctness**
- [ ] Free user cannot exceed 20 analyses; the 21st returns `402` with reset date.
- [ ] Quota is consumed exactly once per successful analysis; failures consume none.
- [ ] Plan/usage shown in UI equals `GET /api/usage`; no client-side inference.
- [ ] Webhook replay is a no-op; invalid signature rejected.
- [ ] Upgrade/downgrade/cancel/grace behave as specified; data is never deleted on downgrade.
- [ ] Cross-user and cross-workspace access is impossible (tests prove it).
- [ ] Billing disabled → app boots, pricing renders, no Stripe dependency required.

**Engineering**
- [ ] `npm run lint`, `npm run build`, backend compile, and all tests pass.
- [ ] Flyway migrations apply to a fresh DB and an existing DB; prod uses `validate`.
- [ ] Every new env var exists in both `.env.example` files with a safe default.
- [ ] No secret appears in tracked files or logs.
- [ ] One-command local start works (`docker compose up`).
- [ ] Docs updated: `docs/SAAS_SETUP.md`, `docs/PROGRESS.md`, and a short `docs/BILLING_RUNBOOK.md`.

---

## 8. VERIFICATION COMMANDS

```powershell
# Frontend
cd frontend
npm ci
npm run lint
npm run build
npm test          # after G1

# Backend
cd backend
.\mvnw.cmd -q -DskipTests compile
.\mvnw.cmd -B verify

# Stripe (test mode, after C)
stripe listen --forward-to localhost:8080/api/billing/webhook
stripe trigger checkout.session.completed

# Secret scan
git grep -nE "(sk-|sk_live_|sk_test_|whsec_|CLERK_SECRET_KEY=.{8,}|OPENROUTER_API_KEY=.{8,})" -- . ":(exclude)*.example"
```

Report the exact commands and their output. "Should work" is not a result.

---

## 9. REPORTING FORMAT (PER PHASE)

1. **Files changed** — path + one-line purpose.
2. **Design impact** — new surfaces, any intentional diff, screenshots checked at 1440/1024/390 (light/dark).
3. **Verification** — commands run + results (pass/fail, counts).
4. **Data/migration notes** — tables added, backfill results, rollback plan.
5. **Blockers/questions** — anything requiring owner sign-off.
6. **PROGRESS.md** — tick the phase items with the same wording used here.

Keep a running checklist in `docs/PROGRESS.md` under a new **Phase 2 (SaaS)** section; do not rewrite the existing Phase 0/1 history.

---

## 10. KICKOFF MESSAGES (COPY ONE PER SESSION)

- **Phase A:** "Read `SAAS_CONVERSION_PROMPT.md`. Execute Phase A only. First remove the hardcoded OpenRouter key and rotate it, then capture the design baseline, add Flyway, and fix the async executor. Do not start SaaS features yet. Report results."
- **Phase B:** "Read `SAAS_CONVERSION_PROMPT.md`. Execute Phase B only: schema, workspaces, plan catalog, entitlements, quotas, usage API, and authorization tests. No UI. Show me the quota test results."
- **Phase C:** "Read `SAAS_CONVERSION_PROMPT.md`. Execute Phase C only: Stripe provider, checkout, portal, idempotent webhooks, invoices, disabled mode. Use Stripe test keys via env only."
- **Phase D:** "Read `SAAS_CONVERSION_PROMPT.md`. Execute Phase D only: `/pricing`, Settings → Billing, quota/upgrade surfaces, admin, and nav updates. Obey the design contract exactly — no new fonts, colors, or card styles. Capture before/after screenshots."
- **Phase E:** "Read `SAAS_CONVERSION_PROMPT.md`. Execute Phase E only: workspaces, seats, invitations, RBAC, Stripe seat sync. Prove cross-workspace isolation with tests."
- **Phase F:** "Read `SAAS_CONVERSION_PROMPT.md`. Execute Phase F only: reports persistence, paginated history, legal pages, lifecycle email, account export/delete, scheduled jobs."
- **Phase G:** "Read `SAAS_CONVERSION_PROMPT.md`. Execute Phase G only: tests, CI, compose, Sentry, analytics, performance, launch checklist. Keep everything green."

---

## 11. DECISIONS TO CONFIRM BEFORE PHASE B (defaults are safe to proceed)

| Decision | Default if no answer |
| :--- | :--- |
| Payment provider / country | Stripe test mode; keep `BillingProvider` adapter |
| Currency | USD; make it config, display `Intl.NumberFormat` |
| PRO price | $19/mo, $190/yr |
| TEAM price | $49/seat/mo, 3-seat minimum |
| Trial | 14 days, card optional, once per workspace |
| Overage | Hard stop on FREE; 7-day grace on paid |
| Seats at launch | Single-user plans only; TEAM shown as "Contact sales" until Phase E |
| Tax handling | Stripe Tax if available; otherwise state "excludes tax" |
| Data region | Hosting provider's default; document it in Privacy |
| Support channel | `support@` mailbox + Contact page |

If any answer changes the schema (e.g., teams at launch), implement Phase E before Phase D's team UI. Everything else is additive.

---

**Final reminder to the agent:** The fastest way to fail this project is to "modernize" the UI. The product's value is its calm, editorial minimalism and its typographic discipline. Add capabilities behind it. Never restyle it.
