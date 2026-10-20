# ANTIGRAVITY EXECUTION PROMPT — AI Verify SaaS Hardening & UI Overhaul

> **For the coding agent (Antigravity):** This is your work order. Execute the phases **in order**, one phase per session, and do not start a phase until the previous phase's Definition of Done (section 6) passes. Verify with the commands given, report results after each task, and ask the user before anything destructive (file deletions, git history changes, dropping data).

---

## 1. Project context (read first)

**Product:** "AI Verify" — a web app that analyzes text for AI-generated content patterns ("content authenticity"). Users paste text, receive a pattern score + linguistic metrics + explanation, save scan history, export PDF reports, and chat with an "AI Advisor". The goal is to become a commercial SaaS product.

**Repo layout (monorepo):**
- `backend/` — Spring Boot 3.4.5 (Java 21), PostgreSQL + JPA, Spring Security with session-cookie auth + Google OAuth2, REST under `/api/**`. Detection engine: `GeminiDetectionService` (Gemini 2.5 Flash). Advisor: `MistralController`, `NvidiaAdvisorService`, `ChatController`. In-memory rate limiting: `RateLimitingFilter`. Swagger via springdoc. Dockerfile for Render.
- `frontend/` — React 19 + Vite 6 + react-router 7 + Tailwind v4. **ACTIVE app:** `index.html` → `src/main.tsx` → `src/App.tsx` → `src/pages/*` + `src/components/*` (legacy vanilla-CSS style, emoji icons). There is also `src/new-ui/` — a newer Tailwind + lucide-react redesign that is **duplicated and not wired into the router**. Treat `new-ui` as the design language to migrate TO.
- `frontend-new/` — a Figma Make mock prototype with fake data and no backend. **Delete it from the repo.**

**Local dev:**
- Backend: `cd backend && .\mvnw.cmd spring-boot:run` (Windows) — needs PostgreSQL and `backend/.env` (see `.env.example`).
- Frontend: `cd frontend && npm install && npm run dev` → http://localhost:3000 (Vite proxies `/api` to :8080).
- Checks: frontend `npm run lint` (= `tsc --noEmit`) and `npm run build` (= vite build); backend `.\mvnw.cmd -q -DskipTests compile`.

**Global rules for every task:**
1. Keep the existing stack. Do not swap frameworks or libraries unless a task explicitly says so.
2. After every change: frontend `npm run lint` + `npm run build` pass; backend compile passes.
3. Never commit or log real secrets. Never hardcode API keys. Add every new env var to the relevant `.env.example`.
4. Make small, focused change-sets with clear messages (`fix:`, `feat:`, `chore:`).
5. Preserve existing API contracts unless a task says to change them. New endpoints follow the patterns of neighbouring controllers (use the `ApiResponse` envelope where the file already does).
6. **Never fabricate product output.** No demo/fake analysis results, scores, history rows, or canned "AI" replies may ever appear in a user-facing path. Honest empty states and error states only. This is the project's #1 product rule.
7. When a task needs an external paid service (Stripe, email provider), implement it env-driven with a safe disabled/test mode when keys are absent, and document setup in `docs/SAAS_SETUP.md` (create it).
8. If this document disagrees with the current code (files renamed, code moved), trust the code and report the discrepancy.

---

## 2. PHASE 0 — Critical fixes (security, trust, auth)

### Task 0.1 — Stop the secret leak (do this FIRST)
- The repo root `.gitignore` is currently **empty (0 bytes)** while `backend/.env` contains real API keys (Gemini, Mistral, Google OAuth secret, DB password). Create a proper root `.gitignore`:
  ```gitignore
  # env/secrets
  .env
  .env.*
  !.env.example
  **/.env
  **/.env.*
  !**/.env.example
  # logs
  *.log
  # deps & builds
  node_modules/
  dist/
  target/
  # IDE
  .idea/
  .vscode/
  *.iml
  # OS
  .DS_Store
  Thumbs.db
  ```
- Untrack `frontend/.env` (it is currently committed): `git rm --cached frontend/.env` — keep the file on disk. Keep `frontend/.env.example`.
- Run `git status` and `git ls-files` and report any tracked file that looks like a secret.
- In `docs/SAAS_SETUP.md`, note that the user must **rotate** the Gemini / Mistral / Google OAuth / DB credentials as a precaution, and that `backend/.env` must never be committed.
- Do NOT rewrite git history yourself; just report if secrets appear in `git log` and flag it to the user.

**Acceptance:** `git check-ignore -v backend/.env` and `git check-ignore -v frontend/.env` both match; only `.env.example` files are tracked.

### Task 0.2 — Remove ALL fake/fabricated results (PRODUCT-TRUST CRITICAL)
- `frontend/src/pages/Detection.tsx`:
  - Delete the `catch` block that fabricates a score ("Backend unavailable, evaluating with local forensic model") including the burstiness math and the `sampleText === text ? 0.68` special case. On failure, show a real error banner with a **Retry** button; if the failure is 401, show "Sign in to analyze". Never invent metrics, signals, or analysis text.
  - In the results metadata, replace the invented model name **"Text Forensic Core v2.4"** with either a model label returned by the backend or the honest label "AI Verify Detection Engine (Gemini-based)".
- `frontend/src/pages/Dashboard.tsx`: remove the `fallbackScans` demo array. If no analyses exist → empty state ("No analyses yet" + CTA to New Analysis). If signed out → sign-in CTA. Never show fabricated history.
- `frontend/src/pages/History.tsx`: remove all demo rows (the `AV-2048`/`AV-2047` entries and similar). Keep search/filter/sort; otherwise show an empty state.
- `frontend/src/pages/Reports.tsx`: remove `fallbackReports`. Build the list only from real user data; show an empty state otherwise.
- `frontend/src/pages/Advisor.tsx`: remove `fallbackReplies` / canned replies. On API error show an inline error bubble ("Advisor is temporarily unavailable") with Retry.
- `frontend/src/components/Sidebar.tsx`: remove the hardcoded "Service operational / Last checked just now" block. Replace with a real status: poll `/actuator/health` every ~60s and honestly show Operational / Degraded / Offline.
- Grep the frontend for remaining fake data (`AV-2048`, "Research abstract", "Editorial draft", hardcoded `68`, "Coursework introduction") and remove or convert to a clearly-labeled sample mode that never mixes with real data.

**Acceptance:** with the backend stopped, no page shows a fabricated score/history/chat reply — only clear error or empty states. Grep finds no demo arrays left.

### Task 0.3 — Protect workspace routes + fix the 401 redirect
- `frontend/src/App.tsx` (the ACTIVE router): wrap all `WorkspaceLayout` child routes with `ProtectedRoute` (it exists at `src/context/ProtectedRoute.tsx` but is currently UNUSED). Public routes stay: `/`, `/product`, `/signin`, `/signup`, marketing pages.
- `frontend/src/api/client.ts`: the 401 interceptor currently does `window.location.href = '/signin'`, losing the current page. Change to `/signin?next=<encoded current path + search>` (skip when already on `/signin` or when the failing request is the auth bootstrap `/api/user/me`).
- `frontend/src/pages/SignIn.tsx`: after successful login, navigate to the validated `next` param (must start with `/` — reject anything else to avoid open redirects) instead of always `/dashboard`. Show a "session expired, please sign in" notice when `next` is present.

**Acceptance:** visiting `/dashboard` signed-out redirects to sign-in; after login the user lands back on `/dashboard`.

### Task 0.4 — Cookie & CSRF consistency
- `backend/src/main/java/.../config/SecurityConfig.java`:
  - CSRF cookie attributes are hardcoded `sameSite("None")` + `secure(true)`, while `application.yml` uses `SESSION_COOKIE_SAME_SITE=lax` / `SESSION_COOKIE_SECURE=false` — policies conflict. Make both env/property-driven with matching defaults: dev → `Lax` + `false`, prod → `None` + `true`.
  - Remove the blanket `.ignoringRequestMatchers("/api/**")` from CSRF. Keep CSRF enforcement for state-changing API calls; keep ignores only for `/login`, `/logout`, `/oauth2/**`, swagger paths, and GET/OPTIONS.
  - Frontend: make `src/api/client.ts` (axios) participate in CSRF: `xsrfCookieName: 'XSRF-TOKEN'`, `xsrfHeaderName: 'X-XSRF-TOKEN'`, `withCredentials: true` (already set). Keep `CookieCsrfTokenRepository.withHttpOnlyFalse()` so the cookie is readable.
  - If a specific endpoint genuinely cannot do CSRF, document why in a comment — no mixed strategies.
- `backend/.../security/RateLimitingFilter.java`: `X-Forwarded-For` is trusted unconditionally (spoofable). Add a property `security.rate-limit.trust-proxy` (default `false`); when false, always use `request.getRemoteAddr()`. Add a TODO/commented note that multi-instance deploys need Redis-based limiting.

**Acceptance:** local login (form + Google), detection, and logout all work over http://localhost:3000; a POST to `/api/detections` without the CSRF header from a logged-in session is rejected (403); the app's own requests succeed.

---

## 3. PHASE 1 — Navigation & UI/UX (one design system)

### Task 1.1 — Single navigation source of truth
- Create `frontend/src/navigation.ts` exporting the workspace nav config (sections, labels, paths, lucide icons). Known inconsistencies to fix:
  - Desktop `Sidebar` shows **Reports**; mobile `MobileNav` **drops Reports entirely** → both must render the same items from the shared config.
  - The same page is called "How It Works" (sidebar) / "Methodology & Tech" (mobile) / "Detection limitations" (footer) → pick ONE name and use it everywhere (nav, footer, page title, header).
- Refactor `Sidebar.tsx` and `MobileNav.tsx` to consume `navigation.ts`. Remove emoji icons; standardize on lucide-react.

### Task 1.2 — Finish the design migration, delete duplicates
- Adopt the `src/new-ui` design (Tailwind + lucide + motion patterns) as the ONLY design. Migrate the remaining legacy pages/components in `src/pages` + `src/components` to that visual style while **keeping their working logic** (API calls, PDF export via jsPDF, history handling, auth) — do not lose features.
- Move the new-ui components into their canonical homes (`src/components/...`, `src/context/...`) and update imports; then delete the `src/new-ui` folder (it is dead code today).
- Delete `frontend-new/` from the repo (if the user wants it as reference, keep a copy outside the repo).
- One theme system only (`ThemeContext`). After the migration, prune dead CSS from `src/index.css` (check no referenced classes are removed).

### Task 1.3 — Route & marketing cleanup
- Current dead/duplicated routes: `/forensics` renders the same page as `/how-it-works`; `/enterprise` and `/security` just redirect; the Navbar advertises `/product`, `/forensics`, `/enterprise`, `/security` regardless. Fix:
  - Either give `/enterprise` and `/security` real, honest content pages (static product/security overview), or remove them from the Navbar and routes. No dead links, no silent redirects from navigation.
  - De-duplicate `/forensics` (keep one route).
- Add a real 404 page (`NotFound.tsx`) for the catch-all `*` route (currently redirects to `/`). Wrap the router in a React ErrorBoundary.
- Set per-route `document.title` ("New Analysis — AI Verify", etc.). Replace hardcoded "© 2025" with a dynamic year. Unify branding to one name: **AI Verify** (the codebase says "AI Verify", "AI-Verify v3.0", and Swagger shows "Guardian Verify API" — pick "AI Verify" and fix the others).

### Task 1.4 — Loading, a11y, SEO polish
- Replace the full-page Suspense "Loading AI Verify…" fallback with per-route skeletons (keep the full-page loader only for the very first app load). Optional: prefetch lazy route chunks on nav hover.
- Fix Lighthouse findings: color contrast (muted/amber text), heading order (single h1 per page, then h2/h3 descending), and add a valid `frontend/public/robots.txt` (missing/invalid today) plus `sitemap.xml`.
- Add a shared EmptyState component (used by Dashboard/History/Reports) and a toast/notification helper for success/error messages.

**Acceptance:** one design system; nav identical on desktop and mobile; no dead routes; Lighthouse Accessibility ≥ 95 and SEO ≥ 90 on `/` and `/dashboard`.

---

## 4. PHASE 2 — SaaS features

### Task 2.1 — Plans, quotas, billing
- Backend: add `plan` (FREE/PRO/TEAM) and usage tracking on `User` (e.g., `usage_period_start`, `scans_used`). Create `UsageService`; enforce limits in `/api/detect/bulk-ai` (suggested defaults, all property-configurable: FREE 20 scans/day + 5,000 chars, PRO 1,000 scans/month, TEAM unlimited/negotiated). Return a clear 402/429 payload ("upgrade required" / "quota exceeded") that the frontend can render.
- Frontend: pricing page (`/pricing`) + upgrade CTAs; when a quota error occurs, show a friendly upgrade prompt with current usage.
- Stripe (env-driven; cleanly disabled when keys are absent): backend `BillingController` with (1) create Checkout Session, (2) Billing Portal session, (3) webhook endpoint verifying the signature and syncing `plan` on `checkout.session.completed` + `customer.subscription.*` events. Frontend: redirect to Checkout from pricing; "Manage billing" button in Settings → Portal. Env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_TEAM`, `STRIPE_ENABLED`. Document setup in `docs/SAAS_SETUP.md`.

### Task 2.2 — Account lifecycle
- Email verification on registration (add `spring-boot-starter-mail` or a provider API via env; simple HTML templates). Allow a small number of scans before verification for onboarding, then require verification.
- Forgot-password + reset flow (expiring, single-use token; email link → reset page). Add a password-change form in Settings (API already exists: `PUT /api/user/profile/password`).
- Settings "Danger zone": **delete account** (hard-delete user + their histories/chats, typed confirmation) and **export my data** (JSON download). The current "Delete workspace data" only clears localStorage — label that honestly ("Clear local browser data") and keep it separate.
- Stretch: TOTP 2FA.

### Task 2.3 — History & Reports as real features
- Backend: paginate/filter detections (`page`, `size`, `query`, `from`, `to`, verdict) via a new or extended endpoint (e.g., `GET /api/detections?...`); add bulk delete and CSV export. Keep the old `/all` for compatibility or mark it deprecated.
- Frontend History: wire server-side pagination + filters (remove the fake pagination UI), add row + bulk delete, CSV/JSON export buttons.
- Reports: "Create report" must persist a real Report record (backend) so it appears in the Reports page from the database (not localStorage). Reports page lists only real reports.
- Advisor: persist conversations to the backend (`ChatHistory` model/service already exist) so chats survive reload; show a recent-conversations list.

### Task 2.4 — Admin console (APIs exist, UI missing)
- Add admin-only `/admin` routes (guard via `ProtectedRoute adminOnly`): paginated user list + search, user detail (their history/usage), disable/delete user, basic metrics (total scans, active users). Backend has `/api/admin/**` (`AdminController`) — extend with pagination if needed.

### Task 2.5 — Legal & trust surfaces
- Static pages: Terms of Service, Privacy Policy, DPA placeholder, Contact. Signup checkbox ("I agree to Terms & Privacy") linking to them. Cookie/consent banner (remember choice). Keep the "not proof of authorship" disclaimers already present.

---

## 5. PHASE 3 — Ops & quality

### Task 3.1 — Tests
- Backend (`spring-boot-starter-test` is already present; there is currently only a `contextLoads` test): integration tests with MockMvc + mocked `GeminiDetectionService` (`@MockBean`) covering: register/login/logout, CSRF enforcement, detection endpoint happy path, quota enforcement, history pagination, authorization (user A cannot read/delete user B's records), admin-only access.
- Frontend: Vitest + Testing Library smoke tests — landing renders; protected route redirects when signed out; Detection shows an honest error state (no fabricated results) when the API fails; History empty state. Add `npm test`.

### Task 3.2 — CI/CD & containers
- `.github/workflows/ci.yml`: backend job (`.\mvnw.cmd -B verify` on windows runners or `./mvnw` on ubuntu) and frontend job (`npm ci`, `npm run lint`, `npm run build`, `npm test`). Run on PRs and main.
- Root `docker-compose.yml` for local dev: postgres + backend + frontend. Document usage.
- `frontend/Dockerfile` (multi-stage build → nginx) with SPA fallback (`try_files $uri /index.html`) and a documented option to proxy `/api` to the backend.

### Task 3.3 — Observability
- Sentry (frontend `@sentry/react`, backend `sentry-spring-boot-starter`), env-driven DSNs, disabled when empty. Verify no secrets/PII are sent in events.
- Simple, provider-agnostic `track()` analytics helper for key events (page view, scan started/completed, upgrade clicked); console-only in dev.

---

## 6. Definition of Done (global gate)

- [ ] **Phase 0:** no secret can be accidentally committed; zero fabricated results anywhere; workspace routes protected; CSRF/cookie policy consistent; full local flow works (login → detect → history → logout).
- [ ] **Phase 1:** exactly one design system and one nav config; no dead/duplicated routes; Lighthouse a11y ≥ 95, SEO ≥ 90 on `/` and `/dashboard`.
- [ ] **Phase 2:** pricing + Stripe test-mode checkout works; quotas enforced server-side; verify/reset email flows; paginated history + exports; reports persisted server-side; admin UI; legal pages live.
- [ ] **Phase 3:** CI green; `docker compose up` works for local dev; critical paths covered by tests; Sentry wired (optional keys).
- [ ] Every new env var documented in the matching `.env.example`; `docs/SAAS_SETUP.md` up to date.

---

## 7. Reporting format (per task)

After each task, report: **(1)** files changed with short descriptions, **(2)** verification commands run and their results, **(3)** blockers/questions. Keep a running checklist in `docs/PROGRESS.md` (create it) mirroring section 6.

---

## 8. Kickoff messages (copy per phase)

- **Phase 0:** "Read ANTIGRAVITY_PROMPT.md in the repo root. Execute Phase 0 only (Tasks 0.1–0.4) in order. Follow the verification steps and show me the results before moving on. Ask before deleting anything."
- **Phase 1:** "Read ANTIGRAVITY_PROMPT.md. Execute Phase 1 only (Tasks 1.1–1.4). Keep all existing functionality; run lint + build and the Lighthouse checks at the end."
- **Phase 2:** "Read ANTIGRAVITY_PROMPT.md. Execute Phase 2 (Tasks 2.1–2.5). Implement external integrations in disabled/test mode with env vars and update docs/SAAS_SETUP.md."
- **Phase 3:** "Read ANTIGRAVITY_PROMPT.md. Execute Phase 3 (Tasks 3.1–3.3). Set up CI, tests, containers, and observability; keep everything green."
