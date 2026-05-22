# Helpdesk Ticket Management System

A full-stack enterprise support ticket platform with role-based access control and a built-in ETL analytics pipeline, built with **FastAPI**, **React**, and **MySQL**. Employees raise and track their own tickets; administrators manage the full support queue and run data analytics on historical records.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
  - [Prerequisites](#prerequisites)
  - [Database Setup](#database-setup)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Demo Accounts](#demo-accounts)
- [ETL Workflow](#etl-workflow)
  - [Overview](#overview)
  - [Dataset](#dataset)
  - [Extract](#extract)
  - [Transform](#transform)
  - [Load](#load)
  - [Database Tables](#database-tables)
  - [Running the Pipeline](#running-the-pipeline)
- [API Reference](#api-reference)
  - [Authentication](#authentication-endpoints)
  - [Tickets](#ticket-endpoints)
  - [Analytics](#analytics-endpoints)
- [Screenshots](#screenshots)

---

## Project Overview

The Helpdesk Ticket Management System provides two distinct experiences:

- **Employees** see only the tickets they submitted, with a personal dashboard showing their own stats and a locked-name create form so tickets are always attributed correctly.
- **Admins** see every ticket across all employees, can update status and resolution notes, delete records, and access a dedicated **Analytics** page backed by an ETL pipeline that processes historical CSV data into a clean reporting table.

Authentication is JWT-based with an 8-hour token lifetime. All ticket reads are filtered server-side by `owner_email`, ensuring one employee can never access another's data even with a direct API call.

---

## Features

### Authentication
- JWT login with email and password
- Role claim stored in database (`admin` / `employee`)
- Protected API routes via `get_current_user` dependency
- Admin-only mutation endpoints via `require_admin` dependency
- Credentials stored securely using PBKDF2-SHA256 hashing

### Employee
- Personal dashboard — ticket counts and recent list scoped to their account only
- Submit tickets with their name pre-filled and locked (cannot submit as someone else)
- View and search only their own ticket history
- Track live status and resolution notes per ticket

### Admin
- Operations dashboard with global ticket statistics (total, open, in-progress, resolved) and a conic-gradient status donut chart
- Full ticket inventory across all employees
- Edit any ticket: status, priority, category, description, resolution notes
- Delete tickets with confirmation dialog
- Search and filter all tickets by keyword, category, status, or priority

### ETL Analytics (Admin only)
- One-click ETL pipeline triggered from the Analytics page
- Extracts 223-row historical CSV with intentionally dirty data
- Transforms: strips whitespace, normalises category/priority/status values, drops bad rows, deduplicates, computes resolution hours
- Loads clean records into a dedicated `reporting_tickets` table (full reload — idempotent)
- Every run is logged to an `etl_runs` audit table
- 7 analytics API endpoints powering live charts: category bar chart, priority distribution, department breakdown with resolution rates, and monthly volume trend

### UI / UX
- Dark glass-panel design with layered gradient accents and ambient blur orbs
- Animated page transitions powered by Framer Motion
- Active navigation indicator with aqua left-border accent
- Click-to-fill demo credential cards on the login screen
- Fixed toast notification during background data refreshes
- Analytics page: pipeline control card with Extract → Transform → Load stage display, gradient bar charts with glow fills, department resolution-rate progress bars, and a vertical trend chart with Y-axis grid
- Fully responsive layout down to 840 px
- Custom scrollbar and placeholder styling

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 18.3.1 | UI component framework |
| Vite | 6.0.11 | Build tool and dev server |
| React Router DOM | 7.3.0 | Client-side routing |
| Framer Motion | 11.18.2 | Page transition animations |
| Axios | 1.8.1 | HTTP client with JWT interceptor |
| Lucide React | 0.474.0 | Icon library |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| FastAPI | 0.115.6 | REST API framework |
| Uvicorn | 0.32.1 | ASGI server |
| SQLAlchemy | 2.0.36 | ORM and query builder |
| Pydantic Settings | 2.6.1 | Environment config validation |
| python-jose | 3.3.0 | JWT encoding and decoding |
| Passlib (bcrypt) | 1.7.4 | Password hashing |
| email-validator | 2.2.0 | Email format validation |
| **Pandas** | **2.2.3** | **ETL data processing** |
| **openpyxl** | **3.1.5** | **Excel read support (Pandas dependency)** |

### Database

| Technology | Purpose |
|---|---|
| MySQL 8.0 | Primary relational database |
| PyMySQL 1.1.1 | Pure-Python MySQL driver |

---

## Project Structure

```
Helpdesk Ticket Management System/
├── datasets/
│   └── helpdesk_historical.csv       # 223-row historical dataset with dirty data
│
├── backend/
│   ├── core/
│   │   ├── config.py                 # Pydantic settings — reads from .env
│   │   └── security.py              # Password hashing and JWT creation
│   ├── routers/
│   │   ├── auth.py                  # POST /auth/login, get_current_user, require_admin
│   │   ├── tickets.py               # All ticket CRUD endpoints
│   │   └── analytics.py             # 7 admin-only analytics + ETL trigger endpoints
│   ├── services/
│   │   ├── bootstrap.py             # Per-account demo user and ticket seeding
│   │   └── etl.py                   # Extract → Transform → Load pipeline logic
│   ├── crud.py                      # SQLAlchemy database operations with role filtering
│   ├── database.py                  # Engine, session factory, schema migrations
│   ├── main.py                      # FastAPI app entry point, CORS, lifespan startup
│   ├── models.py                    # User, Ticket, ReportingTicket, EtlRun ORM models
│   ├── schemas.py                   # Pydantic request/response schemas
│   ├── requirements.txt             # Python dependencies
│   └── .env                         # Environment variables (not committed to git)
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MetricCard.jsx       # Stat tile used on dashboards
│   │   │   ├── Shell.jsx            # App layout — sidebar navigation + workspace
│   │   │   └── TicketTable.jsx      # Reusable ticket list table with actions
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx        # Login form with click-to-fill demo cards
│   │   │   ├── DashboardPage.jsx    # Role-split admin / employee dashboard
│   │   │   ├── TicketsPage.jsx      # Ticket list (data scoped by role)
│   │   │   ├── CreateTicketPage.jsx # New ticket form
│   │   │   ├── SearchPage.jsx       # Keyword and filter search
│   │   │   ├── TicketDetailsPage.jsx# Detail view with admin edit panel
│   │   │   └── AnalyticsPage.jsx    # ETL pipeline control + analytics charts
│   │   ├── api.js                   # Axios client, session helpers, all API calls
│   │   ├── App.jsx                  # Root component, routing, global state
│   │   ├── main.jsx                 # React entry point
│   │   └── styles.css               # Global dark-theme CSS with custom properties
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── screenshots/
├── .gitignore
└── README.md
```

---

## Setup Instructions

### Prerequisites

- **Node.js** v18 or higher — [nodejs.org](https://nodejs.org)
- **Python** 3.11 or higher — [python.org](https://python.org)
- **MySQL** 8.0 or higher — [mysql.com](https://www.mysql.com)
- **Git**

---

### Database Setup

1. Start your MySQL server.

2. Create the database (tables are created automatically on first backend start):

```sql
CREATE DATABASE helpdesk_ticket_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. Make sure your MySQL user has full privileges on this database:

```sql
GRANT ALL PRIVILEGES ON helpdesk_ticket_db.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

> The default credentials in `.env` use `root:root`. Update them to match your local MySQL setup.

---

### Backend Setup

```bash
cd backend

# Create a virtual environment
python -m venv .venv

# Activate — Windows
.venv\Scripts\activate

# Activate — macOS / Linux
source .venv/bin/activate

# Install dependencies (includes Pandas and openpyxl for ETL)
pip install -r requirements.txt
```

Create a `.env` file inside the `backend/` directory:

```env
DATABASE_URL=mysql+pymysql://root:root@localhost:3306/helpdesk_ticket_db
SECRET_KEY=replace-this-with-a-long-random-secret
ACCESS_TOKEN_EXPIRE_MINUTES=480
CORS_ORIGINS=http://localhost:5173
```

> **Security note:** Replace `SECRET_KEY` with a securely generated random string (e.g. `openssl rand -hex 32`). Never commit `.env` to version control — it is excluded by `.gitignore`.

Start the development server:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

On first startup the backend automatically:
1. Creates all database tables (including `reporting_tickets` and `etl_runs`)
2. Adds the `owner_email` column if it was missing (migration safety)
3. Seeds demo users and their tickets (per-account, non-destructive)
4. Fixes any misattributed legacy seed data

**API base URL:** `http://localhost:8000`  
**Swagger UI:** `http://localhost:8000/docs`  
**ReDoc:** `http://localhost:8000/redoc`

---

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

**App URL:** `http://localhost:5173`

Production build:

```bash
npm run build      # outputs to frontend/dist/
npm run preview    # preview the production build locally
```

---

## Demo Accounts

All accounts and their tickets are seeded automatically on first backend startup.

| Role | Name | Email | Password | Tickets |
|---|---|---|---|---|
| Admin | Support Admin | `admin@helpdesk.example.com` | `admin123` | Aisha Khan (HR), James Wright (Finance) |
| Employee | Demo Employee | `employee@helpdesk.example.com` | `employee123` | VPN Issue, Software Installation, Laptop Issue |
| Employee | Marcus Chen | `marcus.chen@helpdesk.example.com` | `marcus123` | Network Connectivity, JetBrains License, VPN Issue |
| Employee | Priya Patel | `priya.patel@helpdesk.example.com` | `priya123` | Email Access, Hardware Request |

---

## ETL Workflow

### Overview

The analytics feature is powered by a three-phase **Extract → Transform → Load** pipeline implemented in `backend/services/etl.py`. It processes a raw historical CSV file, cleans it, and populates a dedicated `reporting_tickets` table that is queried by the analytics API. The pipeline is idempotent — every run fully truncates and reloads the reporting table, so it can be re-run safely at any time.

```
datasets/
└── helpdesk_historical.csv
        │
        ▼
┌───────────────┐     ┌─────────────────────┐     ┌──────────────────────┐
│    EXTRACT    │────▶│     TRANSFORM        │────▶│        LOAD          │
│               │     │                     │     │                      │
│ pd.read_csv() │     │ • Strip whitespace  │     │ DELETE reporting_    │
│ 223 raw rows  │     │ • Drop bad rows     │     │   tickets (truncate) │
│               │     │ • Parse datetimes   │     │                      │
│               │     │ • Normalise values  │     │ INSERT clean rows    │
│               │     │ • Deduplicate       │     │                      │
│               │     │ • Calc resolution_  │     │ INSERT etl_runs      │
│               │     │   hours             │     │   (audit log)        │
└───────────────┘     └─────────────────────┘     └──────────────────────┘
```

Every pipeline run is recorded in the `etl_runs` table with row counts and timestamps, and the result is displayed in the Analytics page pipeline card.

---

### Dataset

**File:** `datasets/helpdesk_historical.csv`  
**Rows:** 223 (200 base records + 15 exact duplicates + 8 intentionally bad rows)  
**Date range:** January 2024 – May 2026  
**Columns:**

| Column | Type | Description |
|---|---|---|
| `employee_name` | string | Name of the employee who raised the ticket |
| `department` | string | Employee's department |
| `issue_category` | string | Type of support issue (may contain dirty values) |
| `description` | string | Free-text description of the problem |
| `priority` | string | Ticket priority (may contain dirty values) |
| `status` | string | Current ticket status (may contain dirty values) |
| `created_at` | datetime | When the ticket was opened (may be malformed) |
| `resolved_at` | datetime | When the ticket was resolved (empty if unresolved) |

The dataset is intentionally imperfect to demonstrate data cleaning. Dirty patterns include:

| Field | Dirty examples | Cleaned to |
|---|---|---|
| `issue_category` | `"laptop problem"`, `"vpn issue"`, `"pasword reset"`, `"email"`, `"network"`, `"office365"` | `"Laptop Issue"`, `"VPN Issue"`, `"Password Reset"`, `"Email Access"`, `"Network Connectivity"`, `"Office 365 Issue"` |
| `priority` | `"med"`, `"HIGH"`, `"critical "` (trailing space), `"MEDIUM"` | `"Medium"`, `"High"`, `"Critical"`, `"Medium"` |
| `status` | `"done"`, `"in progress"`, `"OPEN"`, `"RESOLVED"` | `"Resolved"`, `"In Progress"`, `"Open"`, `"Resolved"` |
| `created_at` | `"NOT-A-DATE"`, `"2024-13-45 25:99:00"` | Dropped (bad row) |
| `employee_name` | `""` (empty) | Dropped (bad row) |

---

### Extract

```python
df = pd.read_csv(csv_path, dtype=str, keep_default_na=False)
```

- All columns read as strings to prevent Pandas from silently coercing values.
- `keep_default_na=False` prevents empty strings from becoming `NaN` before explicit cleaning.
- The raw row count is recorded for the ETL audit log.

---

### Transform

Transformation happens in a strict sequence inside `backend/services/etl.py`:

**1. Strip whitespace**
```python
df = df.apply(lambda col: col.str.strip() if col.dtype == object else col)
```
Removes leading/trailing spaces from every string column — catches cases like `"critical "`.

**2. Drop bad rows**

Rows are dropped if:
- `employee_name` is an empty string after stripping, or
- `created_at` cannot be parsed into a valid datetime.

```python
df = df[df["employee_name"].str.len() > 0]
df["created_at_parsed"] = pd.to_datetime(df["created_at"], errors="coerce", utc=True)
df = df[df["created_at_parsed"].notna()]
```

The count of dropped rows is saved as `bad_rows_dropped` in the audit log.

**3. Parse datetimes**
```python
df["resolved_at_parsed"] = pd.to_datetime(
    df["resolved_at"].replace("", pd.NaT), errors="coerce", utc=True
)
```
Both timestamps are parsed to UTC-aware `datetime` objects. `resolved_at` is nullable — open tickets have an empty string which becomes `NaT`.

**4. Normalise lookup values**

Each lookup column is mapped through a dictionary. Unknown values fall back to `.strip().title()` rather than raising an error:

```python
CATEGORY_MAP = {
    "laptop problem": "Laptop Issue",
    "vpn issue":      "VPN Issue",
    "pasword reset":  "Password Reset",
    "email":          "Email Access",
    "network":        "Network Connectivity",
    "office365":      "Office 365 Issue",
    # ... 20+ entries
}

PRIORITY_MAP = { "med": "Medium", "high": "High", "critical": "Critical", "low": "Low" }
STATUS_MAP   = { "done": "Resolved", "in progress": "In Progress", "open": "Open", "closed": "Closed" }
```

Department names are title-cased (`"HR"` → `"Hr"` is avoided because title-case already handles `"hr"` → `"Hr"`; the seeded data uses properly cased department names).

**5. Compute `resolution_hours`**
```python
df.loc[has_both, "resolution_hours"] = (
    (df.loc[has_both, "resolved_at_parsed"] - df.loc[has_both, "created_at_parsed"])
    .dt.total_seconds() / 3600
)
```
Only computed when both `created_at` and `resolved_at` are valid. Stored as a float (hours). Used by the department stats endpoint to compute average resolution time.

**6. Add time dimension columns**
```python
df["month"]       = df["created_at_parsed"].dt.month        # 1–12
df["year"]        = df["created_at_parsed"].dt.year
df["month_label"] = df["created_at_parsed"].dt.strftime("%b %Y")  # e.g. "Jan 2024"
```
Pre-computed to avoid expensive GROUP BY expressions on datetime strings.

**7. Deduplicate**
```python
df = df.drop_duplicates(subset=["employee_name", "department", "issue_category", "created_at"])
```
The natural key is the combination of employee, department, category, and exact creation timestamp. Exact duplicate rows (same values in all four columns) are dropped. The count is saved as `duplicates_removed` in the audit log.

**Typical result for the included dataset:**

| Stage | Count |
|---|---|
| Rows in CSV | 223 |
| Bad rows dropped | ~8 |
| Duplicates removed | ~15 |
| **Rows loaded** | **~200** |

---

### Load

The load step is a full reload (truncate + insert), making every ETL run idempotent:

```python
db.query(ReportingTicket).delete()   # truncate reporting_tickets
db.flush()

for _, row in df.iterrows():
    db.add(ReportingTicket(...))      # insert all clean rows

db.add(EtlRun(...))                  # write audit record
db.commit()
```

Using a full reload rather than an upsert keeps the logic simple and guarantees the reporting table always reflects exactly what the current CSV contains after cleaning.

---

### Database Tables

**`reporting_tickets`** — stores the cleaned, analytics-ready records:

| Column | Type | Description |
|---|---|---|
| `id` | INT PK | Auto-increment primary key |
| `employee_name` | VARCHAR(255) | Normalised employee name |
| `department` | VARCHAR(255) | Title-cased department |
| `issue_category` | VARCHAR(100) | Canonical category name |
| `description` | TEXT | Original free-text description |
| `priority` | VARCHAR(20) | `Low` / `Medium` / `High` / `Critical` |
| `status` | VARCHAR(20) | `Open` / `In Progress` / `Resolved` / `Closed` |
| `created_at` | DATETIME(tz) | UTC-aware creation timestamp |
| `resolved_at` | DATETIME(tz) | UTC-aware resolution timestamp (nullable) |
| `resolution_hours` | FLOAT | Hours between open and resolved (nullable) |
| `month` | INT | Creation month (1–12) |
| `year` | INT | Creation year |
| `month_label` | VARCHAR(20) | Human label e.g. `"Mar 2025"` |

**`etl_runs`** — immutable audit log of every pipeline execution:

| Column | Type | Description |
|---|---|---|
| `id` | INT PK | Auto-increment primary key |
| `ran_at` | DATETIME(tz) | UTC timestamp of the run |
| `rows_in_csv` | INT | Total rows read from CSV |
| `bad_rows_dropped` | INT | Rows removed due to bad data |
| `duplicates_removed` | INT | Rows removed as duplicates |
| `rows_loaded` | INT | Final rows inserted into `reporting_tickets` |
| `csv_path` | VARCHAR(500) | Absolute path of the source CSV |

---

### Running the Pipeline

1. Log in as an **admin** account (e.g. `admin@helpdesk.example.com`).
2. Click **Analytics** in the sidebar navigation.
3. The Analytics page shows the ETL pipeline control card with the three stages (Extract, Transform, Load). If the pipeline has never been run, all stage values show `—`.
4. Click **Run ETL Pipeline**. The button spins while the pipeline processes the CSV.
5. On completion, the stage values update with the row counts, a mint-coloured success bar appears at the bottom of the control card, and all charts below populate with live data.
6. The pipeline can be re-run at any time — each run fully reloads the reporting table and appends a new record to `etl_runs`.

To trigger the pipeline directly via the API:

```bash
curl -X POST http://localhost:8000/analytics/run-etl \
  -H "Authorization: Bearer <admin_access_token>"
```

Response:
```json
{
  "rows_in_csv": 223,
  "bad_rows_dropped": 8,
  "duplicates_removed": 15,
  "rows_loaded": 200
}
```

---

## API Reference

All protected routes require a valid JWT in the `Authorization` header:

```http
Authorization: Bearer <access_token>
```

### Authentication Endpoints

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/auth/login` | Authenticate and receive a JWT access token | Public |

### Ticket Endpoints

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/tickets` | Retrieve tickets visible to the current user | Protected |
| GET | `/tickets/{ticket_id}` | Retrieve a single ticket by ID | Protected |
| POST | `/tickets` | Create a new ticket | Protected |
| PUT | `/tickets/{ticket_id}` | Update status, priority, category, resolution notes | Admin only |
| DELETE | `/tickets/{ticket_id}` | Delete a ticket permanently | Admin only |
| GET | `/search` | Search tickets by keyword, category, status, or priority | Protected |

### Analytics Endpoints

All analytics endpoints are **admin-only** and query the `reporting_tickets` table. Run the ETL pipeline first to populate data.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/analytics/summary` | Total, resolved, open, in-progress counts and average resolution hours |
| GET | `/analytics/categories` | Ticket count per issue category, sorted descending |
| GET | `/analytics/priority-distribution` | Count and percentage share per priority level |
| GET | `/analytics/department-stats` | Per-department totals, resolved count, and average resolution hours |
| GET | `/analytics/resolution-trends` | Monthly ticket volume sorted chronologically |
| GET | `/analytics/etl-status` | Metadata of the most recent ETL run (or `null` if never run) |
| POST | `/analytics/run-etl` | Trigger the ETL pipeline; returns row counts |

### Access Rules

- Employees can only read tickets they created — enforced server-side via `owner_email` filtering.
- Admins can read and modify all tickets.
- Analytics endpoints reject non-admin tokens with HTTP 403.
- The backend enforces all ownership and role checks; the UI restrictions are a secondary layer.

---

## Screenshots

> To add screenshots: take captures of the running app, save them as `.png` files inside the `screenshots/` folder, and they will render automatically below.

### Login Page
![Login Page](screenshots/login.png)

### Admin Dashboard
![Admin Dashboard](screenshots/dashboard.png)

### Employee Dashboard
![Employee Dashboard](screenshots/dashboard-employee.png)

### Ticket List — Admin View
![Ticket List Admin](screenshots/ticket-queue.png)

### Ticket List — Employee View
![Ticket List Employee](screenshots/ticket-employee.png)

### Create Ticket Form
![Create Ticket](screenshots/new-ticket.png)

### Ticket Detail and Admin Edit Panel
![Ticket Detail](screenshots/ticket-admin.png)

### Search and Filter
![Search Page](screenshots/ticket-search.png)

### Analytics — ETL Pipeline Control
![ETL Pipeline](screenshots/ETL.png)

### Analytics — Charts
![Analytics Charts](screenshots/ETL-2.png)

### Analytics — Department & Trends
![Analytics Lower](screenshots/ETL-3.png)

### Swagger API Docs
![Swagger Docs](screenshots/swagger.png)

![API Testing](screenshots/api-testing.png)

---

> Built with FastAPI · React · MySQL · Pandas
