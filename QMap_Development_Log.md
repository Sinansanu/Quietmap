# QMap — Development & Implementation Log

## Project Overview

**QuietMap (QMap)** is a privacy-first ambient noise and personal focus cartographer. It pairs client-side acoustic signal processing with dedicated focus session tracking to help knowledge workers, researchers, and students identify their quietest working hours and most stable physical environments.

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS (SPA)
- **Backend:** Python 3.10+ / FastAPI + SQLAlchemy 2.0 + Pydantic v2
- **Database:** Supabase Hosted PostgreSQL 16 (Connected via Supabase Session Pooler on Port 5432)
- **Database Migrations:** Alembic
- **Client Audio Engine:** Web Audio API (`AudioContext`, `AnalyserNode` with on-device RMS integration)
- **Deployment:** Single-project Vercel Services model (`vercel.json`) with unified domain routing

---

## Phase Status

| Phase | Feature | Status | Backend Tests | Frontend Build | Deployment |
|---|---|---|---|---|---|
| 1 | Authentication | 🟩 | 30 passed | ✓ Built | Ready for Vercel |
| 2 | User Profiles | ⬜ | — | — | — |
| 3 | Focus Sessions | ⬜ | — | — | — |
| 4 | Pomodoro | ⬜ | — | — | — |
| 5 | Goals | ⬜ | — | — | — |
| 6 | Calendar | ⬜ | — | — | — |
| 7 | Analytics | ⬜ | — | — | — |
| 8 | Streaks | ⬜ | — | — | — |
| 9 | Reports | ⬜ | — | — | — |
| 10 | AI Insights | ⬜ | — | — | — |
| 11 | Notifications | ⬜ | — | — | — |
| 12 | Privacy Controls | ⬜ | — | — | — |

*Legend: ⬜ Not Started | 🟨 In Progress | 🟩 Complete / Verified | 🟥 Blocked*

---

## Baseline — Existing System Audit

### Current Architecture
The current implementation is a decoupled, modern web application configured for unified deployment:
```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React 18)                      │
│  - TypeScript + Vite + Tailwind CSS                         │
│  - Lucide Icons + Web Audio API RMS Analyzer                │
│  - Zero raw audio storage (discards PCM, sends floats only) │
│  - Single-page application with responsive tab navigation   │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON REST API (/api/v1)
┌──────────────────────────────▼──────────────────────────────┐
│                    Backend (FastAPI)                        │
│  - Python 3.10+ / SQLAlchemy 2.0                            │
│  - Pydantic v2 Schemas & Input Validation                   │
│  - Layered Service-Repository Architecture                  │
│  - Alembic Migrations & UTC Normalized Datetimes            │
│  - Connection pooling with pre-ping & 300s recycling        │
└──────────────────────────────┬──────────────────────────────┘
                               │ PostgreSQL Wire Protocol (Port 5432, SSL)
┌──────────────────────────────▼──────────────────────────────┐
│             Database: Hosted Supabase PostgreSQL            │
│  - Connected via Supabase Session Pooler (Port 5432)        │
│  - Relational Schema with B-Tree & Composite Indexes        │
│  - UUID Primary Keys & Relational Foreign Keys              │
│  - Value Range Check Constraints (Noise & Focus Scores)     │
└─────────────────────────────────────────────────────────────┘
```

### Current Frontend
- **Framework & Tooling:** React 18.3.1, TypeScript 5.4.0, Vite 5.4.21, Tailwind CSS 3.4.1.
- **Routing:** State-driven page navigation (`activePage`: `'dashboard' | 'map' | 'timeline' | 'insights' | 'settings'`) hosted within `App.tsx`.
- **State Management:** React hooks (`useState`, `useCallback`, `useMemo`, `useRef`) paired with custom hooks (`useAudioMonitor.ts`).
- **Onboarding:** `OnboardingFlow.tsx` manages a 3-step walkthrough (Welcome, Privacy & Microphone permission, Activity preference) persisted in `localStorage`.
- **API Client:** Type-safe fetch wrapper in `frontend/src/api/client.ts` with centralized error handling and dynamic base URL detection (`/api/v1`).
- **Views:**
  - `DashboardPage`: Live noise gauge, active focus session timer, daily summary metrics, and dynamic insight strip.
  - `FocusMapPage`: Workspace library with focus scores, average noise ratings, 2-hour quietest windows, and CRUD modals.
  - `TimelinePage`: Interactive SVG acoustic timeline over 12h, 24h, and 7d horizons with hover inspection callouts.
  - `InsightsPage`: Algorithmic quietest window analysis, best workspace highlight, and 7-day retrospective chart.
  - `SettingsPage`: Ambient monitoring toggle, sampling rate selector, interruption threshold configuration, and database purge modal.

### Current Backend
- **Framework:** FastAPI with Python 3.10+ (tested on Python 3.14).
- **Architecture Pattern:** Clean Layered Architecture:
  - `api/v1/endpoints/`: `dashboard`, `focus_map`, `health`, `insights`, `locations`, `noise`, `seed`, `sessions`, `settings`, `timeline`, `weekly`.
  - `services/`: `analytics_service`, `focus_session_service`, `location_service`, `noise_monitoring_service`, `settings_service`.
  - `repositories/`: `analytics_repository`, `location_repository`, `noise_repository`, `session_repository`.
  - `models/`: `Location`, `FocusSession`, `NoiseSample`, `Interruption`, `DailyStatistic`, `Setting`.
  - `schemas/`: Pydantic v2 schemas for request validation and response serialization.
  - `core/math.py`: Deterministic math utilities for RMS-to-decibel normalization, stability scores, composite Focus Scores, and 24-hour hour window calculations.
  - `db/`: SQLAlchemy session management with generator-based dependency injection (`get_db`).
- **CORS:** `CORSMiddleware` configured with allowed local origins and Vercel preview regex (`^https://.*\.vercel\.app$`).
- **Error Handling:** Centralized request validation handler and global internal exception handler returning clean JSON error responses.

### Current Database
- **Engine:** PostgreSQL 16 on Supabase connected via the Supabase Session Pooler (port 5432) using driver `postgresql+psycopg://`.
- **Migrations:** Alembic version `0001_initial_schema` (currently at head).
- **Tables and Constraints:**
  1. `locations`: `id` (VARCHAR(36) PK), `name` (VARCHAR(64) UNIQUE), `created_at` (TIMESTAMPTZ).
  2. `focus_sessions`: `id` (VARCHAR(36) PK), `started_at` (TIMESTAMPTZ), `ended_at` (TIMESTAMPTZ), `location_id` (FK -> locations.id ON DELETE SET NULL), `activity` (VARCHAR(64)), `focus_score` (INT with check constraint 0–100), `average_noise` (FLOAT), `stability_score` (FLOAT), `interruption_count` (INT default 0), `created_at` (TIMESTAMPTZ).
  3. `noise_samples`: `id` (VARCHAR(36) PK), `recorded_at` (TIMESTAMPTZ), `noise_level` (FLOAT with check constraint 0.0–100.0), `location_id` (FK), `focus_session_id` (FK). Composite indexes on `(location_id, recorded_at)` and `(focus_session_id, recorded_at)`.
  4. `interruptions`: `id` (VARCHAR(36) PK), `focus_session_id` (FK -> focus_sessions.id ON DELETE CASCADE), `started_at` (TIMESTAMPTZ), `duration_seconds` (FLOAT), `intensity` (FLOAT), `peak_level` (FLOAT), `created_at` (TIMESTAMPTZ).
  5. `daily_statistics`: `date` (DATE PK), `average_noise` (FLOAT), `quietest_hour` (INT), `quietest_period_label` (VARCHAR(32)), `interruption_count` (INT), `average_focus_score` (FLOAT), `total_focus_minutes` (FLOAT), `sample_count` (INT), `updated_at` (TIMESTAMPTZ).
  6. `settings`: `key` (VARCHAR(64) PK), `value` (VARCHAR(256)).
- **Ownership Model:** **Single-Tenant.** There is currently no `user_id` column or `users` table.

### Current Noise Monitoring
- **Capture:** Browser Web Audio API (`AudioContext`, `AnalyserNode` with `fftSize=1024`, `smoothingTimeConstant=0.8`).
- **Hardware Constraints:** System-level `echoCancellation`, `autoGainControl`, and `noiseSuppression` are explicitly turned off to capture true physical acoustic levels.
- **Processing:** Root Mean Square (RMS) calculation over 1024-sample byte time-domain buffers. Converted to dBFS ($20 \log_{10}(\text{RMS})$) and normalized to a bounded $0–100$ scale.
- **Privacy Guarantee:** Audio buffers are destroyed in browser memory upon processing. No PCM, audio clips, speech recognition, or audio recordings are stored or transmitted.
- **Telemetry:** Transmits only numeric samples (`noise_level`, `location_id`, `focus_session_id`) via `POST /api/v1/noise/sample` at intervals (default 10s).

### Current Focus/Session System
- **Session Lifecycle:** Only one active session is permitted at a time (concurrent starts return HTTP 409 Conflict).
- **Creation:** `POST /api/v1/sessions/start` with optional `location_id` and `activity` label.
- **Completion:** `POST /api/v1/sessions/{id}/end` computes duration, queries noise samples and interruptions, and calculates the composite Focus Score:
  $$\text{Focus Score} = (\text{Quietness} \times 0.40) + (\text{Stability} \times 0.30) + (\text{Interruption Score} \times 0.24) + (\text{Duration Score} \times 0.06)$$
- **Auto-Recovery:** Backend startup checks for orphaned active sessions older than 12 hours and auto-closes them.

### Current Deployment
- **Platform:** Vercel Services via root `vercel.json`.
- **Routing:** Single domain; `/api/(.*)` rewrites to FastAPI backend service, `/(.*)` rewrites to Vite frontend service.
- **Database Connection:** Supabase Session Pooler (port 5432) with connection recycling (`pool_recycle=300`) to prevent dropped connections.

### Existing Tests
- **Backend Tests:** Located in `backend/tests/`:
  - `test_core_math.py`: 6 tests verifying noise clamping, normalization, stability score, focus score formula, and 24-hour midnight boundary formatting.
  - `test_insights.py`: 1 test verifying sparse-data safety and threshold requirements.
  - `test_locations.py`: 1 test verifying workspace CRUD and unique name constraints.
  - `test_noise_monitoring.py`: 1 test verifying stateful spike and interruption detection.
  - `test_seed.py`: 1 test verifying demo data generator (7, 14, 30 days).
  - `test_sessions.py`: 1 test verifying session start, end, score computation, and conflict handling.
  - `test_timeline.py`: 1 test verifying timeline downsampling and bucketed aggregations.
  - `test_weekly.py`: 1 test verifying 7-day retrospective calculations.

### Baseline Test Results
All baseline verification checks executed with 100% passing status:

1. **Backend Pytest Suite:**
   ```text
   $ python -m pytest
   collected 13 items
   tests\test_core_math.py ......                               [ 46%]
   tests\test_insights.py .                                     [ 53%]
   tests\test_locations.py .                                    [ 61%]
   tests\test_noise_monitoring.py .                             [ 69%]
   tests\test_seed.py .                                         [ 76%]
   tests\test_sessions.py .                                     [ 84%]
   tests\test_timeline.py .                                     [ 92%]
   tests\test_weekly.py .                                       [100%]
   ======================= 13 passed, 3 warnings in 0.40s ========================
   ```
2. **FastAPI Import & Health Startup:**
   ```text
   $ python -c "from fastapi.testclient import TestClient; from app.main import app; client = TestClient(app); print(client.get('/api/v1/health').json())"
   {'status': 'ok', 'database': 'connected'} (HTTP 200)
   ```
3. **Frontend TypeScript & Production Build:**
   ```text
   $ cd frontend && npm run build
   vite v5.4.21 building for production...
   ✓ 1505 modules transformed.
   dist/index.html                   0.88 kB │ gzip:  0.51 kB
   dist/assets/index-CNjQZDp7.css   29.29 kB │ gzip:  5.48 kB
   dist/assets/index-5Jne4632.js   219.10 kB │ gzip: 64.14 kB
   ✓ built in 2.60s (0 errors)
   ```
4. **Database & Migrations:**
   ```text
   $ python -m alembic current
   INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
   0001_initial_schema (head)
   ```

### Existing Issues
1. **In-Memory Interruption Tracking:** `NoiseMonitoringService._session_trackers` maintains rolling spike state in an in-memory dictionary. While functional for single-process local servers, this state is volatile in serverless environments across cold starts.
2. **Browser Background Timer Throttling:** When browser tabs are backgrounded or minimized, browsers throttle `setInterval` timers, which can cause telemetry intervals to space out until the tab is refocused.
3. **Deprecation Warnings:** Pytest outputs Starlette deprecation warnings regarding `starlette.testclient` and HTTP status codes (`HTTP_422_UNPROCESSABLE_ENTITY`).

### Technical Debt
1. **Single-Tenant Model:** The database schema has no concept of users or authentication. Introducing multi-tenancy in Phase 1 will require updating all tables with user foreign keys.
2. **Tab-Based Frontend Navigation:** Frontend page routing is driven by React component state (`activePage`) rather than browser history URLs (e.g. React Router).
3. **Daily Statistics Rollup:** The `daily_statistics` table exists in Alembic, but weekly and daily analytics are currently calculated on the fly in `AnalyticsRepository`.

### Risks for Future Phases
1. **Multi-User Migration (Phase 1):** Adding non-nullable `user_id` columns to existing tables (`locations`, `focus_sessions`, `noise_samples`, `interruptions`, `settings`) requires a multi-step migration (create `users`, add nullable `user_id`, assign existing data, make non-nullable).
2. **Noise Telemetry Volume:** With multi-user monitoring at 10-second intervals, database row volume on `noise_samples` will grow rapidly ($~8,640$ rows per active user per day), requiring indexing care and partition planning.
3. **Cold Starts & Stateless Processing:** Future phases involving timers (Pomodoro, streaks, notifications) must rely on database timestamps rather than server-memory timers.

### Recommended Phase 1 Prerequisites
1. Select a secure authentication strategy (e.g., Supabase Auth or FastAPI JWT with bcrypt/passlib/argon2).
2. Create a versioned Alembic migration introducing the `users` table with standard security fields (`id`, `email`, `hashed_password`, `created_at`, `is_active`).
3. Add `user_id` foreign keys to existing tables with proper cascading rules.
4. Establish FastAPI dependency injection (`get_current_user`) to secure `/api/v1` routes.
5. Create React Authentication Context with persistent tokens in `frontend/src/api/client.ts`.

---

# Phase 1 — Authentication
**Status:** 🟩 Complete & Verified  
**Completed Date:** 2026-09-19  

### Overview & Architecture
Phase 1 implements complete, secure user authentication for QMap while maintaining the privacy-first architecture, local audio processing guarantees, and zero credential leakage.

- **Authentication Paradigm:**
  - **Browser Clients:** Pure `HttpOnly` cookie-based authentication (`access_token` cookie, `SameSite=Lax`, `Path=/`, secure in production, `credentials: 'same-origin'`).
  - **Zero JWT Exposure:** Browser registration and login endpoints return strictly `AuthSuccessResponse` containing user profile details (`user: UserResponse`). The JWT access token is never delivered in JSON responses, eliminating XSS token theft vectors.
  - **API / Automated Testing Clients:** Fallback support for `Authorization: Bearer <token>` via dedicated `/api/v1/auth/token` endpoint.
- **Security & Cryptography:**
  - Standard `bcrypt` (via `bcrypt>=4.1.0`) salted password hashing.
  - Password strength validation: 8–128 characters, requiring both letters and numbers.
  - JWT generation and decoding using `pyjwt>=2.8.0` with `HS256`.
  - Startup production secret validation in FastAPI lifespan (`validate_production_secret()` requiring >= 32 characters in production).
- **Atomic Legacy Data Claim:**
  - Pre-auth records (`user_id IS NULL`) in `locations`, `focus_sessions`, `noise_samples`, `interruptions`, and `settings` are claimed atomically by the **first** registered user via `claim_legacy_data_if_first_user()`.
  - Once claimed, unassigned records are zero; subsequent registered users start completely clean and can never access legacy records or other users' data.
- **Strict Data Isolation:**
  - All domain endpoints (`locations`, `sessions`, `noise`, `dashboard`, `timeline`, `insights`, `weekly`, `settings`) enforce user ownership through FastAPI dependency `get_current_user` and scoped database repository queries.
  - Workspace unique names scoped per user (`uq_locations_user_name (user_id, name)`).

### Database Changes (Alembic Migration 0002)
- **New Table:** `users`
  - `id` (VARCHAR(36) PK)
  - `email` (VARCHAR(255) UNIQUE NOT NULL, B-Tree indexed)
  - `hashed_password` (VARCHAR(255) NOT NULL)
  - `full_name` (VARCHAR(128) NULL)
  - `is_active` (BOOLEAN DEFAULT TRUE)
  - `created_at` (TIMESTAMPTZ NOT NULL)
  - `updated_at` (TIMESTAMPTZ NOT NULL)
- **Altered Tables (Added `user_id` Foreign Keys):**
  - `locations`: Added `user_id` (FK -> `users.id` ON DELETE CASCADE). Dropped global unique constraint on `name`; added composite unique constraint `uq_locations_user_name (user_id, name)`.
  - `focus_sessions`: Added `user_id` (FK -> `users.id` ON DELETE CASCADE, indexed).
  - `noise_samples`: Added `user_id` (FK -> `users.id` ON DELETE CASCADE). Added composite index `(user_id, recorded_at)`.
  - `interruptions`: Linked through `focus_sessions.id`.
  - `settings`: Added `id` (VARCHAR(36) PK), `user_id` (FK -> `users.id` ON DELETE CASCADE), composite unique constraint `uq_settings_user_key (user_id, key)`.
- **Migration Status:** Applied to Supabase PostgreSQL (`0002_add_user_authentication (head)`).

### Backend Endpoints Implemented
- `POST /api/v1/auth/register` — Registers user, executes atomic legacy claim if user #1, sets `HttpOnly` cookie, returns `AuthSuccessResponse`.
- `POST /api/v1/auth/login` — Verifies password, sets `HttpOnly` cookie, returns `AuthSuccessResponse`.
- `POST /api/v1/auth/token` — API/test client endpoint returning JSON `TokenResponse` (`access_token`, `token_type: "bearer"`).
- `POST /api/v1/auth/logout` — Clears `access_token` cookie, returns status message.
- `GET /api/v1/auth/me` — Returns current authenticated `UserResponse`.

### Frontend Implementation
- **Components & Routing:**
  - `frontend/src/components/auth/AuthPage.tsx`: Elegant tabbed Sign In / Create Account forms with password validation indicators, error alerts, and field validation.
  - `frontend/src/App.tsx`: Auth checking on mount (`api.auth.me()`), view gating rendering `<AuthPage>` if unauthenticated, automatic session expiry redirection on HTTP 401, clean loading splash.
  - `frontend/src/components/layout/Sidebar.tsx`: User profile badge with initials and email, plus accessible "Sign Out" button in sidebar footer.
- **Client Networking:**
  - `frontend/src/api/client.ts`: `credentials: 'same-origin'` on all fetch requests for seamless cookie transport, typed `api.auth` client namespace.

### Verification Results
- **Automated Backend Tests:** 28 passed, 0 failed in 7.12s (`pytest`).
  - 15 dedicated authentication tests: registration, password strength, duplicate emails, cookie auth, bearer auth, invalid credentials, unauthorized access, token expiry, logout cookie clearing, atomic legacy claim, second user isolation, cross-user location isolation, cross-user session/noise isolation.
  - 13 existing domain regression tests (locations, sessions, noise monitoring, timeline, insights, weekly, seed, math).
- **FastAPI Startup & Health Check:** `200 {'status': 'ok', 'database': 'connected'}`.
- **TypeScript Typecheck:** `npx tsc --noEmit` exited 0 with zero errors.
- **Frontend Production Build:** `npm run build` succeeded cleanly (1506 modules transformed, `dist/` created in 3.43s).

### Final Phase 1 Pre-Phase 2 Verification Pass
**Verification Date:** 2026-09-19  

1. **Automated Authentication Lifecycle E2E:** PASS
   - Verified complete user flow via `tests/test_e2e_verification.py::test_automated_auth_lifecycle_e2e` (FastAPI TestClient with cookie-jar session simulation):
     - Account registration (`/api/v1/auth/register`) with zero JWT exposure in JSON body and `HttpOnly` cookie generation.
     - Profile retrieval via `/api/v1/auth/me` with cookie authentication.
     - Dashboard load with user data.
     - Re-verification of preserved cookie authentication across simulated browser refresh.
     - Workspace creation (`POST /api/v1/locations`).
     - Live focus session initialization (`POST /api/v1/sessions/start`).
     - Ambient noise sample telemetry ingestion (`POST /api/v1/noise/sample`).
     - Focus session termination with Focus Score calculation (`POST /api/v1/sessions/{id}/end`).
     - User logout with `access_token` cookie invalidation (`POST /api/v1/auth/logout`).
     - Unauthenticated access gating (HTTP 401 on `/auth/me` and `/dashboard`).
     - Re-login and historical session/workspace restoration.

2. **Automated Multi-User Isolation E2E:** PASS
   - Verified via `tests/test_e2e_verification.py::test_automated_multi_user_isolation_e2e` (FastAPI TestClient with cookie-jar session simulation):
     - User A registers, creates private workspace, runs focus session, logs noise samples.
     - User B registers and logs in:
       - User A's workspace is NOT visible in User B's `/locations` list.
       - User A's workspace returns HTTP 404 on direct access by ID.
       - User A's focus session is NOT visible in User B's `/sessions/history`.
       - User A's noise telemetry is NOT present in User B's `/timeline`.
     - User B creates separate workspace, focus session, and noise samples.
     - User A logs back in:
       - User B's workspace is NOT visible in User A's `/locations`.
       - User B's workspace returns HTTP 404 on direct access by ID.
       - User B's session history is completely absent from User A's account.

3. **CSRF Review & Assessment:** PASS
   - **Cookie Defenses:** `HttpOnly`, `SameSite=Lax`, `Secure` (production), `Path=/`.
   - **Cross-Site Request Handling:** In modern browsers complying with RFC 6265bis, `SameSite=Lax` restricts ambient cookie attachment on cross-site state-changing requests (such as cross-origin `fetch`, `XMLHttpRequest`, and standard form POSTs), providing standard baseline CSRF defense.
   - **Preflight & JSON Payloads:** State-changing endpoints require `Content-Type: application/json` or non-simple HTTP methods (`PUT`, `DELETE`), prompting browsers to initiate CORS preflight (`OPTIONS`) checks before dispatching cross-origin requests.
   - **Same-Origin Unified Deployment:** On Vercel (`vercel.json`), frontend static assets and backend API endpoints are routed under the identical origin. Client network calls use `credentials: 'same-origin'`. Additionally, `vercel.app` is recognized on the Public Suffix List (PSL), providing cross-subdomain boundary separation.
   - **Idempotent Safe Methods:** All `GET` endpoints are strictly read-only and do not mutate state.
   - **Bearer Token Separation:** Automated tools and external API clients utilize explicit `Authorization: Bearer <token>` headers, which do not rely on browser ambient credential mechanics.
   - **Conclusion:** The current architecture provides sufficient, standards-aligned CSRF protection for same-origin single-page applications without requiring brittle custom header middleware that could disrupt automated test runners or external API integrations.

4. **Regression Test Suite:** PASS
   - Pytest suite: **30 passed, 0 failed** in 8.74s (15 auth unit/integration tests, 2 automated E2E lifecycle/isolation tests, 13 core regression tests).
   - FastAPI health check: HTTP 200 `{'status': 'ok', 'database': 'connected'}`.
   - Alembic migration head: `0002_add_user_authentication (head)` verified on Supabase PostgreSQL.

5. **Frontend Verification:** PASS
   - TypeScript typecheck (`npx tsc --noEmit`): 0 errors (clean exit code 0).
   - Production Vite build (`npm run build`): 1506 modules transformed, `dist/` bundle created in 2.43s.

6. **Known Issues:**
   - None. All 30 tests pass cleanly, database migrations are at head, build is green, and multi-user isolation is enforced at repository level.

7. **Post-Phase 1 Deployment Startup Resolution:**
   - **Observed Issue:** Vercel runtime logged `Application startup failed. Exiting.` and returned HTTP 500 on all endpoints.
   - **Root Cause:** When `ENVIRONMENT=production` was active on Vercel, `settings.validate_production_secret()` executed during FastAPI's lifespan. Because `SECRET_KEY` had not yet been configured in the Vercel Project Environment Variables, `Settings.SECRET_KEY` retained its insecure default placeholder containing `"replace-in-production"`, raising `RuntimeError` during startup to prevent insecure deployment.
   - **Resolution:**
     - Configured `SECRET_KEY` as a required Vercel environment variable for **Production** and **Preview** environments (min 32 characters).
     - Hardened `backend/app/config.py` with defensive field validators for `SECRET_KEY` (whitespace/quote stripping), `DATABASE_URL` protocol normalization (`postgresql+psycopg://`), and case-insensitive `ENVIRONMENT.lower()` checks.

---

# Phase 2 — User Profiles
*(Pending implementation following Phase 1)*

---

# Phase 3 — Focus Sessions
*(Pending implementation following Phase 2)*

---

# Phase 4 — Pomodoro
*(Pending implementation following Phase 3)*

---

# Phase 5 — Goals
*(Pending implementation following Phase 4)*

---

# Phase 6 — Calendar
*(Pending implementation following Phase 5)*

---

# Phase 7 — Analytics
*(Pending implementation following Phase 6)*

---

# Phase 8 — Streaks
*(Pending implementation following Phase 7)*

---

# Phase 9 — Reports
*(Pending implementation following Phase 8)*

---

# Phase 10 — AI Insights
*(Pending implementation following Phase 9)*

---

# Phase 11 — Notifications
*(Pending implementation following Phase 10)*

---

# Phase 12 — Privacy Controls
*(Pending implementation following Phase 11)*

---

## Development Roadmap

1. **Phase 1: Authentication** — User registration, secure login, password hashing, JWT/token issuance, session management, and auth context.
2. **Phase 2: User Profiles** — User preferences, profile settings, display names, avatars, and personal defaults.
3. **Phase 3: Focus Sessions** — Advanced session controls, structured focus tags, live session notes, and retroactive editing.
4. **Phase 4: Pomodoro** — Configurable work/break intervals, audio chimes, automatic break tracking, and interval cycles.
5. **Phase 5: Goals** — Daily/weekly focus time targets, minimum quietness thresholds, and goal tracking.
6. **Phase 6: Calendar** — Calendar view of focus history, scheduling deep work blocks, and external calendar sync.
7. **Phase 7: Analytics** — Deep productivity metrics, acoustic trend correlations, and workspace comparative rankings.
8. **Phase 8: Streaks** — Focus consistency streaks, daily habit milestones, and streak protection mechanisms.
9. **Phase 9: Reports** — Weekly/monthly executive summaries and CSV/JSON telemetry data exports.
10. **Phase 10: AI Insights** — Intelligent personalized recommendations based on acoustic patterns and focus rhythms.
11. **Phase 11: Notifications** — In-app alerts, browser push notifications, sound prompts, and break reminders.
12. **Phase 12: Privacy Controls** — Granular telemetry retention rules, auto-expiring noise samples, and data export/erasure tools.

### Roadmap Execution Guidelines
- Each phase must be implemented strictly sequentially.
- Each phase requires comprehensive automated backend tests and frontend typecheck/build verification.
- Full regression testing must pass before advancing to the next phase.
