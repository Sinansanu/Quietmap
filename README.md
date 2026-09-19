# QuietMap (QMap)

**QuietMap** is a privacy-first ambient noise and personal focus cartographer. It monitors only relative ambient noise levels on the client device, preserving privacy with a **zero-audio-storage** guarantee, and correlates environment stability with personal deep work productivity.

Modernized from a legacy Electron prototype into a decoupled, production-grade client-server architecture.

---

## Architecture Overview

```
QuietMap Modern Architecture
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React 18)                      │
│  - TypeScript + Vite + Tailwind CSS                         │
│  - Lucide Icons + Web Audio API RMS Analyzer                │
│  - Zero raw audio storage (discards PCM, sends floats only) │
│  - Port 5173 (Dev) -> Proxies /api to FastAPI               │
│  - NEVER accesses database or receives DB credentials       │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON REST API
┌──────────────────────────────▼──────────────────────────────┐
│                    Backend (FastAPI)                        │
│  - Python 3.10+ / SQLAlchemy 2.0                            │
│  - Pydantic v2 Schemas & Input Validation                   │
│  - Service-Repository Layered Architecture                  │
│  - Alembic Migrations & UTC Normalized Datetimes            │
│  - Connection pooling with pre-ping & 300s recycling        │
│  - Port 8000 (OpenAPI / Swagger at /docs)                   │
└──────────────────────────────┬──────────────────────────────┘
                               │ async / psycopg connection (SSL)
┌──────────────────────────────▼──────────────────────────────┐
│             Database: Hosted Supabase PostgreSQL            │
│  - Connected via Supabase SESSION POOLER (Port 5432)        │
│  - Relational Schema with B-Tree & Composite Indexes        │
│  - UUID Primary Keys & Relational Foreign Keys              │
│  - Value Range Check Constraints (Noise & Focus Scores)     │
│  - Fully cloud-hosted, zero local container overhead        │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Configuration (Supabase Hosted PostgreSQL)

QuietMap uses a hosted **Supabase PostgreSQL** instance connecting through the **Session Pooler** on port **5432**.

### Why the Session Pooler?
- **Full Session-Level Compatibility**: Supports prepared statements, temporary tables, and session-level parameters required by SQLAlchemy 2.0 and Alembic.
- **Port 5432**: Connects through Supavisor session mode.
- **Reliable Cloud Pooling**: The application engine uses `pool_pre_ping=True` and `pool_recycle=300` to automatically recover from idle firewall drops.

### 1. Creating and Configuring your Supabase Project
1. Create a project at [supabase.com](https://supabase.com).
2. Go to **Project Settings** -> **Database**.
3. Under **Connection string**, select **URI** and choose **Session Pooler** (Port 5432).
4. Copy the connection string. It will look like:
   ```text
   postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@[YOUR-POOLER-HOST]:5432/postgres
   ```

### 2. Setting `DATABASE_URL`
The only place real database credentials should reside locally is in `backend/.env`.

Create or edit `backend/.env`:
```bash
DATABASE_URL=postgresql+psycopg://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@[POOLER-HOST]:5432/postgres?sslmode=require
```

> [!IMPORTANT]
> **Password Handling**:
> If your database password contains reserved URL characters such as `&`, `#`, `?`, `/`, `@`, spaces, etc., ensure they are URL-encoded in the connection string.
> **Security Guarantee**:
> `backend/.env` is strictly ignored by `.gitignore`. Credentials must never be committed to Git or exposed to the frontend.

---

## Quickstart

### 1. Run Alembic Database Migrations

With `backend/.env` configured with your Supabase Session Pooler connection:

```bash
cd backend
python -m alembic upgrade head
```

This applies the initial schema (`0001_initial_schema.py`) to create all tables, indexes, constraints, and relationships in Supabase.

---

### 2. Backend Setup & Run

Navigate to the `backend` directory:

```bash
cd backend
```

Create and activate a virtual environment (recommended):

```bash
python -m venv venv
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI application:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- API Base URL: `http://127.0.0.1:8000/api/v1`
- Interactive OpenAPI / Swagger UI: `http://127.0.0.1:8000/docs`
- Health Check: `http://127.0.0.1:8000/api/v1/health`

---

### 3. Frontend Setup & Run

In a new terminal window, navigate to the `frontend` directory:

```bash
cd frontend
npm install
npm run dev
```

Open your browser at `http://localhost:5173`. The Vite dev server will proxy all `/api/*` calls directly to the FastAPI server at `http://127.0.0.1:8000`.

To build the frontend for production:

```bash
npm run build
```

---

## Deploying to Vercel via GitHub (Vercel Services Model)

QuietMap is deployed as **one Vercel project** using the **Vercel Services** model:
- **Single Public Domain**: Both frontend and backend share the same domain (e.g. `https://quietmap.vercel.app`).
- **Unified Edge Routing**:
  - `/api/*` routes directly to the **FastAPI backend** service (`entrypoint: app.main:app`).
  - `/(.*)` routes directly to the **React/Vite frontend** service (SPA rewrite to `/index.html`).
- **Database**: Hosted on **Supabase PostgreSQL** via Session Pooler (port 5432).

---

### Step 1: Push Repository to GitHub

Ensure all files are committed and pushed to your GitHub repository:

```bash
git add .
git commit -m "feat: configure QuietMap for Vercel Services deployment"
git push origin main
```

---

### Step 2: Import Project in Vercel

1. Log into your [Vercel Dashboard](https://vercel.com) and click **Add New...** -> **Project**.
2. Select your `QMap` GitHub repository.
3. In **Project Settings**:
   - **Project Name**: `quietmap` (or your preferred name)
   - **Root Directory**: Leave as `./` (repository root)
   - Vercel automatically detects the root [`vercel.json`](file:///c:/Users/sinan/OneDrive/Desktop/QMap/vercel.json) with `services`.
4. Expand **Environment Variables** and add:
   | Variable | Value | Description |
   | :--- | :--- | :--- |
   | `DATABASE_URL` | `postgresql+psycopg://postgres.[PROJECT-REF]:[PASSWORD]@[POOLER-HOST]:5432/postgres?sslmode=require` | Supabase Session Pooler connection string (Server-side only) |
   | `ENVIRONMENT` | `production` | Production environment flag |
5. Click **Deploy**.

> [!NOTE]
> - **Zero Frontend Exposure**: `DATABASE_URL` is a server-side environment variable and is never exposed to the client bundle.
> - **No `VITE_API_URL` Required**: Because frontend and backend share the same public domain, production API calls naturally use the same-origin path `/api/v1/...`.

---

### Step 3: Verify Deployment

Once the deployment finishes:
- **Web App**: Visit `https://your-project.vercel.app/`
- **SPA Direct Routes**: Visit `https://your-project.vercel.app/dashboard`, `/settings`, etc.
- **API Health**: Visit `https://your-project.vercel.app/api/v1/health`
- **Swagger Documentation**: Visit `https://your-project.vercel.app/docs`

---

## Running Automated Tests

### Backend Test Suite (Pytest)

Run all unit, repository, and integration tests:

```bash
cd backend
python -m pytest
```

Test coverage includes:
- **Core Math**: Noise clamping, normalization, stability score calculation, focus score formula, and 24-hour midnight boundary formatting (`23:00 -> 01:00`).
- **Locations**: Workspace CRUD, duplicate name handling, and metrics aggregation.
- **Focus Sessions**: Starting, updating activity, ending with calculation of scores, and automatic recovery of orphaned sessions.
- **Noise Monitoring**: Stateful spike and interruption detection.
- **Timeline**: Downsampled time-bucketed aggregations (12h, 24h, 7d).
- **Insights & Weekly**: Sparse-data safety and weekly aggregation.
- **Seed Generator**: Generating 7, 14, or 30 days of realistic demo records.

### Frontend Typecheck & Build

```bash
cd frontend
npm run build
```

Validates strict TypeScript types across all components, hooks, and API bridges, and bundles the production asset distribution.

---

## Key Modernization Fixes

| Issue Identified in Audit | Solution Implemented |
| :--- | :--- |
| **Cartesian Join Explosion** in Focus Map | Replaced multi-table left joins with separate aggregated CTEs/subqueries in `AnalyticsRepository`. |
| **Sparse Insights Null Pointer Crash** | Handled nullable stats safely with graceful fallback UI and dynamic "Seed Demo Data" prompt. |
| **24-Hour Midnight Boundary Bug** (`23:00 -> 01:00`) | Replaced `(start + 2) % 24` with continuous modulo window math in `format_hour_window`. |
| **60,000 DOM Node Timeline Freeze** | Implemented SQL time-bucket downsampling (max ~360 data points) and custom SVG timeline renderer. |
| **Stateful Interruption Tracking** | Replaced stateless sample checks with a stateful `NoiseMonitoringService` tracking continuous duration and intensity spikes. |
| **Unmodifiable Session Activity** | Enabled live and pre-session dynamic activity input in `SessionCard`. |
| **Inaccessible Toggle Controls** | Built fully accessible switch toggles using WAI-ARIA `role="switch"`, `aria-checked`, and keyboard navigation. |
| **Redundant Tab Polling** | Implemented selective on-demand data fetching per active tab view in React. |

