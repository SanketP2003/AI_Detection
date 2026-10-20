# AI Verify — Production SaaS Evolution Progress

Tracking work against `ANTIGRAVITY_PROMPT.md`.

---

## Phase 0: Critical Fixes (Security, Trust, Auth)
- [x] **P0.1 Stop the secret leak**
  - [x] Create root `.gitignore` covering `.env`, `**/.env`, `node_modules/`, `dist/`, `target/`, `.idea/`, etc.
  - [x] Untrack `frontend/.env` (`git rm --cached frontend/.env`) while retaining the file on disk.
  - [x] Update `backend/.env.example` with complete placeholder list matching `EnvConfig.java`.
  - [x] Update `docs/SAAS_SETUP.md` with DB env var names (`DB_URL`, `DB_USER`, `DB_PASSWORD`) and precautionary rotation notice.
  - [x] Verify ignore rules via `git check-ignore`.
- [x] **P0.2 Remove ALL fake/fabricated results (Product Trust Critical)**
  - [x] `frontend/src/pages/Detection.tsx`: Removed fallback burstiness calculation & 0.68 score; replaced model label with "AI Verify Detection Engine (Gemini-based)"; added error banner with Retry and 401 prompt.
  - [x] `frontend/src/pages/Dashboard.tsx`: Removed `fallbackScans` demo array; added honest empty state with Sign-in / New Analysis CTA.
  - [x] `frontend/src/pages/History.tsx`: Removed demo rows (`AV-2048`, `AV-2047`, etc.); added honest empty state with Sign-in / New Analysis CTA.
  - [x] `frontend/src/pages/Reports.tsx`: Removed `fallbackReports`; added honest empty state with Sign-in / New Analysis CTA.
  - [x] `frontend/src/pages/Advisor.tsx`: Removed `fallbackReplies` / canned replies; added inline error notice with Retry; logged errors via `console.error`.
  - [x] `frontend/src/components/Sidebar.tsx`: Removed hardcoded operational status; polls `/actuator/health` every 60s with live timestamp.
  - [x] `frontend/src/components/CommonUI.tsx`: Removed hardcoded default 68 in `ScoreRing`.
  - [x] Grep confirmed zero occurrences across `frontend/src` for all 11 prohibited strings.
  - [x] Full offline acceptance browser verification completed.
- [x] **P0.2b Clean Success Path & Stored Analysis Fidelity (Zero Derived Metrics)**
  - [x] `Detection.tsx`: Removed metric defaults (`{ perplexity: 0.5, ... }`), `||` substitutions (`perplexity || prob`), and invented `vocabulary` signal (`100 - resp.aiProbability * 60`).
  - [x] `Detection.tsx`: Removed "Vocabulary distribution" from UI signal list and PDF export.
  - [x] `Detection.tsx`: If metrics/signals are absent, renders "Signal breakdown unavailable for this analysis." without bars; displays "—" for missing confidence score.
  - [x] `Detection.tsx`: Removed `|| 0.85` from stored-analysis reader and history/reports readers.
  - [x] `Sidebar.tsx`: Added neutral initial `'checking'` state so badge never displays "Operational" before first health poll finishes.
- [x] **P0.3 Protect workspace routes + fix 401 redirect**
  - [x] `frontend/src/App.tsx`: Wrapped all `WorkspaceLayout` child routes with `ProtectedRoute`.
  - [x] `frontend/src/context/ProtectedRoute.tsx`: Preserves destination in redirect via `/signin?next=<encodeURIComponent(pathname + search)>`.
  - [x] `frontend/src/api/client.ts`: 401 interceptor encodes `pathname + search` into `/signin?next=...`, skips `/api/user/me` and `/login`, and prevents duplicate redirects with a re-entrancy lock.
  - [x] `frontend/src/pages/SignIn.tsx`: Validates `next` param against open-redirects (rejects `//` and `\`), displays session expiration notice, and navigates to `safeNext` upon login.
  - [x] `frontend/src/pages/SignUp.tsx`: Validates `next` param and navigates to `safeNext` upon registration.
- [x] **P0.4 Cookie & CSRF consistency**
  - [x] `SecurityConfig.java`: Bound CSRF cookie SameSite and Secure policies directly to `${server.servlet.session.cookie.same-site:lax}` and `${server.servlet.session.cookie.secure:false}`, ensuring unified cookie policy between `JSESSIONID` and `XSRF-TOKEN`.
  - [x] `SecurityConfig.java`: Removed blanket `.ignoringRequestMatchers("/api/**")`; enforced CSRF for state-changing requests while keeping only auth endpoints and documentation paths (`/login`, `/logout`, `/oauth2/**`, `/login/oauth2/**`, `/v3/api-docs/**`, `/swagger-ui/**`, `/swagger-ui.html`).
  - [x] `SecurityConfig.java`: Registered `CsrfCookieFilter` to ensure deferred CSRF tokens write the `XSRF-TOKEN` cookie on responses.
  - [x] `client.ts`: Configured explicit Axios CSRF participation (`xsrfCookieName: 'XSRF-TOKEN'`, `xsrfHeaderName: 'X-XSRF-TOKEN'`, `withXSRFToken: true`) and request interceptor header attachment. Maintained 403 as API error without redirect.
  - [x] `RateLimitingFilter.java`: Added `@Value("${security.rate-limit.trust-proxy:false}")` to default to `request.getRemoteAddr()`; proxy headers are evaluated only when `trustProxy == true`.
  - [x] `backend/.env.example`, `application.yml`, and `EnvConfig.java`: Wired `SECURITY_RATE_LIMIT_TRUST_PROXY=false`.
  - [x] `docs/SAAS_SETUP.md`: Added detailed "Cookie & CSRF Policy" documentation.
  - [x] End-to-end verified via curl (403 without CSRF token, 200 with CSRF token) and in-browser (form login, detection, history persistence, logout, Google OAuth).
- [x] **P0.5 Auth architecture update (Clerk migration)**: Full migration to Clerk (ClerkProvider at root, Bearer tokens in Axios, Spring oauth2-resource-server JWT validation, auto-provisioning); guest mode / "Try without account" and session-expiration banner superseded; legacy `/login` retained as dual-mode fallback until P2.

---

## Phase 1: Navigation & UI/UX (One Design System)
- [x] **P1.1 Single navigation source of truth**
  - [x] `frontend/src/navigation.ts`: Created single source of truth exporting `NavItem`, `NavGroup`, `NAV_GROUPS` (7 items across Workspace, Intelligence, Preferences), `isNavItemActive` (alias-aware), and `getPageTitle` (fallback to 'Workspace').
  - [x] `frontend/src/components/Sidebar.tsx`: Deleted local `navSections` array; consumes `NAV_GROUPS` and `isNavItemActive`.
  - [x] `frontend/src/components/AppHeader.tsx`: Deleted local `pageTitles` map; consumes `getPageTitle(location.pathname)`.
  - [x] MobileNav.tsx confirmed dead code and removed; new-ui/ is the migration source for P1.2 (audit for fabricated fallbacks first).
- [x] **P1.2 Finish design migration & remove duplicates** (consolidate `src/new-ui` to canonical paths, owner sign-off received for deletions of `frontend-new/` and `src/new-ui/`).
  - [x] Step A: Design migration audit & inventory complete — see `docs/P1.2_MIGRATION.md` (purged dead new-ui fallbacks; completed file inventory, route parity, P0 checklist, Lucide map, deletion candidate list, and marketing claims audit).
  - [x] Step B: Canonical honesty gap fixes complete (purged fabricated defaults `: 50` and `: 0` across canonical `History.tsx`, `Dashboard.tsx`, and `Reports.tsx`; made `confidenceScore` and `metrics` optional in `DetectionResponse` & `client.ts` with no synthetic fills; restricted `confidenceScore` to engine-provided numeric values; removed score-derived interpretations and dummy `status: 'READY'` badges; verified zero grep hits for legacy derivation tokens; verified browser honest absence handling).
  - [x] Step C: Workspace shell adoption complete (reimplemented `Sidebar.tsx` with new-ui visual layer, Lucide icons, live health polling pill, user footer; updated `AppHeader.tsx` with glassmorphic topbar, breadcrumbs via `getPageTitle`, user initials, `ThemeToggle`; added `@custom-variant dark` and new-ui tokens to `index.css`; verified responsive drawer mechanics at 1440px and 390px; verified Step B follow-ups in `Detection.tsx` and `Reports.tsx`).
  - [x] Step D1: Workspace Pages: Dashboard + History visual port complete (ported Recharts 7-day activity area chart, stats cards, recent scans list, history search/sort/filter, inspect drawer, and CSV export; strictly preserved all Step B canonical data logic, no `: 50` defaults, honest absence strings `"—"`, `'Not scored'`, `"Signal breakdown unavailable for this analysis."`, `"No analysis details were returned for this scan."`; fixed mobile drawer breakpoint `min-[901px]:hidden` and `.scrim` `z-index: 35`; verified clean lint, clean build, and responsive screenshots across 1440px, 950px, and 390px in light/dark themes).
  - [x] Step D1.1: Dashboard honesty cleanup complete (purged hardcoded Live Signal Spectrum, removed fabricated Detection Engine 4.0 and AI Advisor cards, honest Average Score with `—` fallback, verified zero grep hits for fabricated strings).
  - [x] Step D2: Workspace Pages: Detection + Reports visual port complete (ported dual-tab editor and 3-metric diagnostic cards to `Detection.tsx` bound strictly to real metrics, honest missing metrics fallback, `"—"` confidence, absent analysis fallback; ported `Reports.tsx` into Tailwind/glassmorphic design with PDF export, honest absence strings, disabled Open analysis for unscored reports; zero lint/build errors).
  - [x] Step D (Complete): All workspace pages ported (`Dashboard.tsx` honesty cleanup, `Detection.tsx` text/doc dual-tab port, `History.tsx` table/filter/export, `Reports.tsx` preview/PDF, `Advisor.tsx` live chat, `Settings.tsx` glass-card visual port with theme/profile/password/browser-reset, `HowItWorks.tsx` Sora typography & glass-panel reskin; zero fabricated metrics; clean lint & build; strictly preserved core typography and minimalism).
  - [x] Step E (Complete): Full dead code and file purge executed under owner sign-off:
    - Removed obsolete prototype repository `frontend-new/` (eliminated duplicate unneeded node_modules, build artifacts, and configs).
    - Removed duplicate unimported directory `frontend/src/new-ui/` (28 obsolete parallel files).
    - Removed orphaned marketing and re-export pages: `Product.tsx`, `Forensics.tsx`, `Enterprise.tsx`, `Security.tsx`.
    - Removed unused components/animations: `GlowCard.tsx`, `Modal.tsx`, `Badge.tsx`, `ParallaxSection.tsx`.
    - Removed unused boilerplate `frontend/metadata.json`.
    - Pruned unused dependencies from `frontend/package.json`: `express`, `@types/express`, `@google/genai`, `dotenv`, `tsx`, and duplicate `vite`.
    - Removed dead backend files: 0-byte `GeminiController.java` and unreferenced `AiAdvisorService.java`.
    - Cleaned unused imports in `Navbar.tsx` and `Sidebar.tsx`.
    - Verified clean TypeScript compilation (`tsc --noEmit`), Vite build (`npm run build`), and Spring Boot backend compile (`mvnw compile`).

---

## Phase A: Baseline, Security, Design Lock (SAAS_CONVERSION_PROMPT.md)
- [x] **A1 — Remove the leaked OpenRouter key**
  - [x] Replaced hardcoded `openrouter.api.key` default in `application-dev.yml` with `${OPENROUTER_API_KEY:}`.
  - [x] Verified `git log -S` and tracked-file scans show no secret committed in git history.
  - [x] Added key rotation notice and credential guidance to `docs/SAAS_SETUP.md`.
- [x] **A2 — Capture the design baseline**
  - [x] Captured 28 full-page baseline screenshots across 9 canonical routes (`/`, `/signin`, `/dashboard`, `/detection`, `/history`, `/reports`, `/advisor`, `/how-it-works`, `/settings`) at 1440px, 1024px, and 390px using headless Chrome.
  - [x] Created `docs/design-baseline/README.md` recording reproduction commands, typography scale, and color/surface tokens.
  - [x] Added `docs/design-baseline/*.png` to `.gitignore`.
- [x] **A3 — Add Flyway + baseline migration**
  - [x] Added `org.flywaydb:flyway-core` and `org.flywaydb:flyway-database-postgresql` to `pom.xml`.
  - [x] Configured `spring.flyway` in `application.yml` (`baseline-on-migrate: true`, `baseline-version: 0`).
  - [x] Created `V1__baseline_schema.sql` defining baseline schema (`users`, `detection_history`, `chat_history`).
  - [x] Documented Flyway migration flow in `docs/SAAS_SETUP.md`.
- [x] **A4 — Add bounded async executor**
  - [x] Created `AsyncConfig.java` defining `applicationTaskExecutor` (`ThreadPoolTaskExecutor` with core=4, max=16, queue=200, CallerRunsPolicy).
  - [x] Refactored `AiDetection.java` and `AiAdvisor.java` to inject `@Qualifier("applicationTaskExecutor") Executor taskExecutor`.
  - [x] Created `AiDetectionPersistenceTest.java` verifying that database persistence failures log a warning and do not fail the HTTP 200 detection response.
- [x] **A5 — Add missing guardrails & branding unification**
  - [x] Created `frontend/src/pages/NotFound.tsx` adhering to frozen typography and design tokens.
  - [x] Created `frontend/src/components/ErrorBoundary.tsx` wrapping the application router in `App.tsx`.
  - [x] Added `TitleUpdater` in `App.tsx` maintaining dynamic per-route `document.title`.
  - [x] Made footer copyright year dynamic (`new Date().getFullYear()`).
  - [x] Unified all branding references to **AI Verify** across `Navbar.tsx`, `Sidebar.tsx`, and `Footer.tsx`.
- [x] **A6 — Stop dead routes / honest routes**
  - [x] Removed dead links (`/product`, `/enterprise`, `/security`) from `Navbar.tsx` and `Footer.tsx`.
  - [x] Removed obsolete route definitions from `App.tsx` and wired `*` catch-all route to `<NotFound />`.
  - [x] Verified `npm run lint` (`tsc --noEmit`), `npm run build`, and backend tests all pass green.

---

## Phase B: Tenancy, Plans, Entitlements, Quotas (SAAS_CONVERSION_PROMPT.md)
- [x] **B1 — Schema + entities**
  - [x] Created `V2__tenancy_and_entitlements.sql` Flyway migration adding `workspaces`, `memberships`, `subscriptions`, `usage_events`, `usage_counters`, `reports`, `audit_events`, `processed_webhooks`, and indexing.
  - [x] Added `clerk_id`, `default_workspace_id`, `plan`, `trial_ends_at`, `deleted_at` to `users`.
  - [x] Created entity models & repositories: `Workspace`, `Membership`, `WorkspaceRole`, `Invitation`, `Subscription`, `SubscriptionStatus`, `UsageEvent`, `UsageCounter`, `AuditEvent`, `Report`.
  - [x] Auto-provisioned personal workspaces on Clerk user creation & registration in `UserService` via `WorkspaceService`.
- [x] **B2 — PlanCatalog**
  - [x] Defined `app.plans.catalog` in `application.yml` for `FREE`, `PRO`, `TEAM` matching Section 3 defaults.
  - [x] Created `PlanDefinition`, `PlanProperties`, and `PlanCatalog` service with startup validation.
  - [x] Implemented public `GET /api/billing/plans` with 5-minute cache header; permitted in `SecurityConfig`.
- [x] **B3 — EntitlementService**
  - [x] Implemented `EntitlementService` resolving effective plan (Active subscription, Trialing, Past Due with 7-day grace period, or FREE fallback).
  - [x] Bound feature getters: `canExport`, `getMaxCharsPerAnalysis`, `getMaxUploadBytes`, `getHistoryRetentionDays`, `isApiAccessEnabled`.
- [x] **B4 — QuotaService**
  - [x] Implemented `QuotaService` with atomic reservation via `incrementIfWithinLimit` in `usage_counters` to prevent concurrent overspend.
  - [x] Created `QuotaReservation` token with `commit()` (saving `usage_events`) and `rollback()` (decrementing counter on provider failures).
  - [x] Wired pre-call scan & character quota check into `POST /api/detect/bulk-ai`.
  - [x] Wired pre-call advisor message quota check into `POST /api/chat`.
  - [x] Wired server-side upload limit check and export entitlement check into `GET /api/detections/export`.
  - [x] Added `GlobalExceptionHandler` mapping `EntitlementException` to HTTP 402 with structured error envelope.
  - [x] Implemented history retention filtering in `DetectionHistoryService` and `ChatHistoryService`.
- [x] **B5 — GET /api/usage**
  - [x] Implemented `UsageController` (`GET /api/usage`) returning current period, per-entitlement used/limit/resetsAt, plan, subscription status, and seats with `private, max-age=30` cache header.
- [x] **B6 — GET /api/billing/entitlements**
  - [x] Implemented `GET /api/billing/entitlements` returning authoritative limits and feature flags for authenticated workspace.
- [x] **B7 — Authorization & quota tests**
  - [x] Created `QuotaAndEntitlementTest` verifying FREE user blocked at 20 analyses with 402, rollbacks on failure, character limits, export permissions, and concurrent race-condition prevention (30 concurrent threads vs 20 limit).
  - [x] Created `TenancyAndAuthorizationTest` verifying non-member workspace access rejection, cross-user detection and chat deletion prevention, and retention cutoff filtering.
  - [x] All 12 backend unit/integration tests pass green. No UI created (backend-first constraint respected).

---

## Phase C: Billing — Stripe, Env-Driven (SAAS_CONVERSION_PROMPT.md)
- [x] **C1 — BillingProvider + StripeBillingProvider**
  - [x] Added `com.stripe:stripe-java:28.2.0` dependency to `backend/pom.xml`.
  - [x] Defined `BillingProvider` interface completely encapsulating provider SDK types.
  - [x] Implemented `StripeBillingProvider` handling Checkout Session (`subscription` mode, `client_reference_id = workspaceId`, customer reuse, trial per config, metadata), Billing Portal session, and signature verification.
  - [x] Implemented `DisabledBillingProvider` and conditional `BillingConfiguration` bean factory.
- [x] **C2 — Webhook processing & subscription state machine**
  - [x] Public webhook endpoint `POST /api/billing/webhook` with HMAC signature validation and CSRF exemption in `SecurityConfig`.
  - [x] Webhook idempotency via `processed_webhooks` (`existsByProviderEventId` check and deduplication).
  - [x] Full subscription lifecycle state machine: `trialing` → `active` → `past_due` → `canceled` / `unpaid`.
  - [x] On `checkout.session.completed`, links customer and subscription to workspace.
  - [x] On `customer.subscription.deleted`, retains access until current period end (never revokes mid-period).
- [x] **C3 — Invoices for the customer**
  - [x] Created `V3__billing_invoices.sql` Flyway migration establishing `billing_invoices` table with indexing on `(workspace_id, created_at DESC)`.
  - [x] Created `BillingInvoice` entity and `BillingInvoiceRepository` with pagination.
  - [x] Automatically persists invoice records from `invoice.paid` and `invoice.payment_failed` webhook events.
  - [x] Implemented `GET /api/billing/invoices` returning paginated customer invoices.
- [x] **C4 — Plan changes (Checkout & Portal sessions)**
  - [x] Implemented `POST /api/billing/checkout` initiating Stripe Checkout sessions with plan and billing interval.
  - [x] Implemented `POST /api/billing/portal` generating Stripe Customer Portal sessions for subscription management.
- [x] **C5 — Clean disabled mode**
  - [x] `BILLING_ENABLED=false` (or empty keys) defaults to `DisabledBillingProvider` without calling Stripe SDK.
  - [x] Checkout and Portal endpoints throw `BillingUnavailableException` mapped by `GlobalExceptionHandler` to HTTP 503 `BILLING_UNAVAILABLE`.
  - [x] Application boots cleanly and remains fully usable on `FREE` plan with blank Stripe keys.
- [x] **C6 — Phase C test suite**
  - [x] Created `BillingServiceTest` verifying webhook idempotency (replays ignored), invalid signature rejection, subscription transitions (`trialing` → `active` → `past_due` → `canceled`), soft grace period, and invoice caching.
  - [x] Created `BillingDisabledModeTest` verifying 503 `BILLING_UNAVAILABLE` error mapping.
  - [x] Created `StripeBillingProviderTest` verifying configuration requirements and signature header validation.
  - [x] All 23 backend tests pass green (`mvn test`).

---

## Phase D: SaaS Product Surfaces — Minimalist & Editorial
- [x] **D1 — /pricing (Public)**
  - [x] 1200px container, centered header with eyebrow `PRICING`, H1 `600 40px/1.15 "Manrope"`, single-sentence lede.
  - [x] Segmented monthly/annual billing toggle with sage `2 months free` badge; auto-adjusts prices ($0, $19/mo or $190/yr, custom).
  - [x] 3 plan columns in ONE `--surface` container with 1px border grid, no floating cards, no colored glows.
  - [x] Features list with 14px green checkmarks, no emojis. Single primary CTA total ("Start 14-day trial" on PRO).
  - [x] Sticky comparison table with clear category groups (`Analysis & Limits`, `Features & Intelligence`, `Support & Governance`).
  - [x] Accessible disclosure FAQ accordion (keyboard friendly, animated expand/collapse).
  - [x] Mandatory disclaimers (probabilistic signal disclaimer, VAT/tax notice, cancel anytime).
  - [x] Dynamic plan loader from `GET /api/billing/plans` with fallback to catalog, direct Stripe Checkout integration for PRO plan.
- [x] **D2 — Settings Billing Tab (/settings?tab=billing)**
  - [x] Tab query-param navigation (`/settings?tab=billing`) with 5 glass-card sections:
    - [x] Current plan card (Sora 18px font, status badge, renewal date, cancel button).
    - [x] Usage this period (scans, advisor messages, max chars; 6px progress meter; reset date; honest numbers).
    - [x] Invoices table (date, JetBrains Mono invoice #, tabular amount, status badge, PDF link, honest empty state).
    - [x] Payment method ("Managed via Stripe Customer Portal" link button).
    - [x] Danger zone (data retention warning + clear browser storage).
  - [x] Cancellation confirmation modal (`Modal.tsx`) stating access continues through current period end.
- [x] **D3 — Quota & Upgrade Surfaces**
  - [x] Reusable `UsageStrip.tsx`: 11px muted tabular text + 6px progress meter + "View plans →" link.
  - [x] Embedded `UsageStrip` on `/dashboard` and `/detection` directly under header.
  - [x] Quota state thresholds: normal (<80%), warning (≥80%, amber text), hard-blocked (100%, amber meter + inline warning sentence).
  - [x] Global HTTP 402 interceptor in `Detection.tsx` triggering Hard-limit modal with used/limit/resetsAt, primary "View plans", secondary "Not now".
  - [x] Reusable `TrialBanner.tsx` at top of workspace for trials ending in ≤3 days, dismissible per session.
- [x] **D4 — /admin (ADMIN only)**
  - [x] Guarded route with `ProtectedRoute` + admin role verification (`contextIsAdmin || user.isAdmin || user.roles.includes('ADMIN')`).
  - [x] Dense tabular layout (user, plan, status, created, last active, actions), search input, server-side pagination, mono IDs.
  - [x] Account lock/unlock status toggle via `PATCH /api/admin/users/{id}/lock`.
  - [x] User detail drawer inspecting workspace ID, subscription plan, usage, recent scans, and chat sessions.
  - [x] Typed delete confirmation modal requiring the user's exact username before deletion.
- [x] **D5 — Navigation Updates**
  - [x] `navigation.ts`: Added "Plans & billing" under Preferences and "Admin" with `adminOnly: true`.
  - [x] Query-param-aware active state in `isNavItemActive` distinguishing `/settings?tab=billing` from `/settings`.
  - [x] `Sidebar.tsx`: Added `CreditCard` and `ShieldCheck` icons, filtered `adminOnly` items for non-admins.
  - [x] `Navbar.tsx` & `Footer.tsx`: Added `/pricing` link.
  - [x] `App.tsx`: Added `/pricing`, `/admin`, and `/settings/billing` alias redirect.
- [x] **D6 — Verification & Quality Gates**
  - [x] `npx tsc --noEmit` passed with 0 errors across entire frontend.
  - [x] `npm run build` completed cleanly, bundling all chunks without error.
  - [x] Backend test suite passed 23/23 tests green (`mvn test`).
  - [x] Browser visual & responsive audit verified zero horizontal scroll at 390px, responsive desktop (1440px), working billing toggle, and interactive FAQ accordion.

---

## Phase E: Production Readiness (Pending)
- [ ] **E1 — Database switch to validate** (lock down Flyway in production).
- [ ] **E2 — Observability & Sentry**.
- [ ] **E3 — Root Docker Compose & CI/CD** (GitHub Actions, multi-stage Docker build).
- [ ] **E4 — End-to-end verification**.
