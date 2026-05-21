# Helpdesk Ticket Management System

A full-stack enterprise support ticket platform with role-based access control, built with **FastAPI**, **React**, and **MySQL**. Employees raise and track their own tickets; administrators manage the full support queue.

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
- [API Reference](#api-reference)
- [Screenshots](#screenshots)

---

## Project Overview

The Helpdesk Ticket Management System provides two distinct experiences:

- **Employees** see only the tickets they submitted, with a personal dashboard showing their own stats and a locked-name create form so tickets are always attributed correctly.
- **Admins** see every ticket across all employees, can update status and resolution notes, and delete records — with a full operations dashboard showing global metrics.

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
- Operations dashboard with global ticket statistics (total, open, in-progress, resolved)
- Full ticket inventory across all employees
- Edit any ticket: status, priority, category, description, resolution notes
- Delete tickets with confirmation dialog
- Search and filter all tickets by keyword, category, status, or priority

### UI / UX
- Dark glass-panel design with layered gradient accents
- Animated page transitions powered by Framer Motion
- Active navigation indicator with aqua left-border accent
- Click-to-fill demo credential cards on the login screen
- Fixed toast notification during background data refreshes
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

### Database

| Technology | Purpose |
|---|---|
| MySQL 8.0 | Primary relational database |
| PyMySQL 1.1.1 | Pure-Python MySQL driver |

---

## Project Structure

```
Helpdesk Ticket Management System/
├── backend/
│   ├── core/
│   │   ├── config.py             # Pydantic settings — reads from .env
│   │   └── security.py           # Password hashing and JWT creation
│   ├── routers/
│   │   ├── auth.py               # POST /auth/login, get_current_user, require_admin
│   │   └── tickets.py            # All ticket CRUD endpoints
│   ├── services/
│   │   └── bootstrap.py          # Per-account demo user and ticket seeding
│   ├── crud.py                   # SQLAlchemy database operations with role filtering
│   ├── database.py               # Engine, session factory, schema migrations
│   ├── main.py                   # FastAPI app entry point, CORS, lifespan startup
│   ├── models.py                 # User and Ticket SQLAlchemy ORM models
│   ├── schemas.py                # Pydantic request/response schemas
│   ├── requirements.txt          # Python dependencies
│   └── .env                      # Environment variables (not committed to git)
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MetricCard.jsx        # Stat tile used on the dashboard
│   │   │   ├── Shell.jsx             # App layout — sidebar navigation + workspace
│   │   │   └── TicketTable.jsx       # Reusable ticket list table with actions
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx         # Login form with click-to-fill demo cards
│   │   │   ├── DashboardPage.jsx     # Role-split admin / employee dashboard
│   │   │   ├── TicketsPage.jsx       # Ticket list (data scoped by role)
│   │   │   ├── CreateTicketPage.jsx  # New ticket form
│   │   │   ├── SearchPage.jsx        # Keyword and filter search
│   │   │   └── TicketDetailsPage.jsx # Detail view with admin edit panel
│   │   ├── api.js                # Axios client, session helpers, all API calls
│   │   ├── App.jsx               # Root component, routing, global state
│   │   ├── main.jsx              # React entry point
│   │   └── styles.css            # Global dark-theme CSS with custom properties
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── screenshots/                  # Add your screenshots here
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

# Install dependencies
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
1. Creates all database tables
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


## API Reference

All protected routes require a valid JWT in the `Authorization` header:

```http
Authorization: Bearer <access_token>
```

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/auth/login` | Authenticate a user and receive a JWT access token | Public |
| GET | `/tickets` | Retrieve tickets visible to the current user | Protected |
| GET | `/tickets/{ticket_id}` | Retrieve a single ticket by ID | Protected |
| POST | `/tickets` | Create a new ticket | Protected |
| PUT | `/tickets/{ticket_id}` | Update a ticket’s details, status, and resolution notes | Admin only |
| DELETE | `/tickets/{ticket_id}` | Delete a ticket | Admin only |
| GET | `/search` | Search tickets by keyword, category, status, or priority | Protected |

### Notes

- Employees can only see tickets they created.
- Admins can see and manage all tickets.
- The backend enforces ownership and role checks server-side, not just in the UI.




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

### Swagger API Docs
![Swagger Docs](screenshots/swagger.png)

![API Testing](screenshots/api-testing.png)
---

> Built with FastAPI · React · MySQL
