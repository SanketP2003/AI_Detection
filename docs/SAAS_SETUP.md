# AI Verify — SaaS Setup & Environment Configuration Guide

## 1. Security Alert: Credential Rotation (P0 Action Item)

> [!NOTE]
> **Precautionary Notice:** A full git history audit confirmed that no production secrets or `backend/.env` files were committed in git history (`frontend/.env` contained only local URLs). However, because unignored `.env` files previously existed in the workspace, credential rotation is advised as a standard precautionary best practice.

### Credentials to Verify & Rotate (Precautionary):
1. **OpenRouter API Key** (`OPENROUTER_API_KEY`): Rotate immediately in [OpenRouter Dashboard](https://openrouter.ai/keys) (a hardcoded key in `application-dev.yml` was purged; confirm replacement in local `backend/.env`).
2. **Google Gemini API Key** (`GEMINI_API_KEY`): Obtain or rotate in [Google AI Studio](https://aistudio.google.com/).
3. **Mistral / NVIDIA API Keys** (`MISTRAL_API_KEY`, `NVIDIA_API_KEY`): Mistral Console / NVIDIA Build Console.
4. **Google OAuth Client ID & Secret** (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`): [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
5. **PostgreSQL Database Password** (`DB_PASSWORD`): Update local/production database password.
6. **Session & Cookie Settings**: Ensure production secret strings and cookies are configured appropriately.

> [!IMPORTANT]
> **Never commit `.env` files to git.** Root `.gitignore` prevents staging any `.env` or `.env.*` files. Only `.env.example` templates may be committed.

---

## 2. Environment Configuration

### Backend (`backend/.env`)
Create `backend/.env` based on `backend/.env.example`:

```env
# Server & Database
PORT=8080
DB_URL=jdbc:postgresql://localhost:5432/ai_verify
DB_USER=postgres
DB_PASSWORD=your_secure_db_password

# Authentication (Google OAuth2)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# AI Detection Engine (Google Gemini Flash)
GEMINI_API_KEY=your_gemini_api_key

# Advisor / Assistant LLMs
MISTRAL_API_KEY=your_mistral_api_key
MISTRAL_API_URL=https://api.mistral.ai/v1/chat/completions
MISTRAL_DETECTION_MODEL=mistral-large-latest
NVIDIA_API_KEY=your_nvidia_api_key

# Security & Sessions
SESSION_COOKIE_SAME_SITE=lax
SESSION_COOKIE_SECURE=false
SECURITY_RATE_LIMIT_TRUST_PROXY=false
```

### Frontend (`frontend/.env`)
Create `frontend/.env` based on `frontend/.env.example`:

```env
VITE_API_BASE_URL=http://localhost:8080
PORT=3000
VITE_APP_NAME=AI Verify
VITE_APP_VERSION=1.0.0
```

### Cookie & CSRF Policy
The backend CSRF cookie (`XSRF-TOKEN`) is bound to the exact same SameSite and Secure policies as the session cookie (`JSESSIONID`), driven by `SESSION_COOKIE_SAME_SITE` and `SESSION_COOKIE_SECURE`:
- **Development (HTTP localhost):**
  - `SESSION_COOKIE_SAME_SITE=lax`
  - `SESSION_COOKIE_SECURE=false`
  - Vite dev server proxies `/api`, `/login`, `/logout`, and `/actuator` to backend port 8080.
- **Production Cross-Site Deployments (e.g. frontend and backend on distinct domains):**
  - `SESSION_COOKIE_SAME_SITE=None`
  - `SESSION_COOKIE_SECURE=true`
- **Production Recommended Architecture (Same-Origin Reverse Proxy):**
  - Serve frontend and backend behind a single domain reverse proxy (e.g., Nginx, Cloudflare, AWS CloudFront, or Render route rewrites).
  - Keeps cookies first-party (`SameSite=Lax`, `Secure=true`), allowing client-side JavaScript to read the `XSRF-TOKEN` cookie reliably across all browsers without third-party cookie blocking.


---

## 3. External Paid Services Setup (Phase 2 Preview)

### Stripe Billing (Disabled cleanly when keys are absent)
- `STRIPE_ENABLED=false` (default)
- `STRIPE_SECRET_KEY=`
- `STRIPE_WEBHOOK_SECRET=`
- `STRIPE_PRICE_PRO=`
- `STRIPE_PRICE_TEAM=`

### Email Verification & Password Reset
- `SPRING_MAIL_HOST=`
- `SPRING_MAIL_PORT=`
- `SPRING_MAIL_USERNAME=`
- `SPRING_MAIL_PASSWORD=`
- If absent, email verification operates in safe mock/log-only mode during development.

---

## 4. Database Migrations (Flyway)

All relational schema changes are managed via Flyway under `backend/src/main/resources/db/migration/`:
- **Baseline Migration:** `V1__baseline_schema.sql` establishes the initial `users`, `detection_history`, and `chat_history` tables and indexes using idempotent `CREATE TABLE IF NOT EXISTS` syntax.
- **Fresh Databases:** Running `.\mvnw.cmd spring-boot:run` automatically executes all pending migrations up to the current version.
- **Existing Databases:** Flyway is configured with `baseline-on-migrate: true` and `baseline-version: 0`, allowing seamless adoption without data loss.
- **Production Validation:** Production configurations (`application-prod.yml`) enforce `jpa.hibernate.ddl-auto: validate`, ensuring schema mutations occur exclusively via versioned Flyway scripts.

