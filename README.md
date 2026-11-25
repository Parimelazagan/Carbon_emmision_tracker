# CarbonTrack — Carbon Emissions Tracking Platform

A full-stack sustainability and carbon accounting platform for organizations to track energy, fuel, and resource consumption, calculate Greenhouse Gas (GHG) Protocol emissions across Scopes 1, 2, and 3, verify activity data, and generate downloadable PDF sustainability reports.

---

## Table of Contents

- [Features](#features)
- [Roles & Permissions](#roles--permissions)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone & Install Dependencies](#1-clone--install-dependencies)
  - [2. Environment Configuration](#2-environment-configuration)
  - [3. Seed Database](#3-seed-database)
  - [4. Run Locally](#4-run-locally)
- [API Overview](#api-overview)
- [Bulk Upload Format](#bulk-upload-format)
- [Available Scripts](#available-scripts)
- [Deployment](#deployment)

---

## Features

- **Multi-Tenant Organizations & RBAC**
  - Organization-scoped data isolation with JWT authentication and `bcrypt` password hashing.
  - Automatic default facility provisioning upon organization signup so teams can start logging data immediately.
  - Role-based access control supporting three roles: `admin`, `data_entry`, and `viewer`.
  - Token-based team invitation workflow (`/api/auth/invite`, `/api/auth/accept-invite`) with automatic TTL expiration.
- **Facility Management**
  - Manage multiple organizational facilities with metadata including location, floor area (`floorAreaSqM`), and headcount.
  - Dedicated facility detail views with facility-level emissions analytics.
- **GHG Protocol Emissions Calculation & Factor Management**
  - Automatic classification into **Scope 1** (`diesel`, `petrol`, `natural_gas`), **Scope 2** (`electricity`), and **Scope 3** (`water`).
  - Region- and unit-specific `EmissionFactor` lookup (`type`, `region`, `unit`, `factorValue`) to compute `calculatedCO2e` in kg CO₂e.
  - Includes seed data sourced from published government conversion factors (UK DESNZ/BEIS, US EPA eGRID, IEA, Australian NGER, India CEA), plus admin CRUD for custom factors.
- **Consumption Tracking & Verification**
  - Manual entry, filtering, editing, and deletion of consumption records.
  - Audit status workflow (`verified`, `estimated`, `unverified`) with admin verification sign-off.
- **Bulk CSV / Excel Import**
  - Upload `.csv`, `.xlsx`, or `.xls` files (up to 5 MB) with row-level `Joi` validation.
  - Tracks every import in `UploadBatch` with counts for total, imported, and rejected rows plus per-row error reasons.
- **Analytics Dashboard & PDF Reporting**
  - Interactive Recharts visualizations powered by MongoDB aggregation pipelines (monthly trends, emissions by scope, type, and facility).
  - Server-side PDF sustainability report generation (`pdfkit`) with persistent report history, download, and management.

---

## Roles & Permissions

| Capability | `admin` | `data_entry` | `viewer` |
| :--- | :---: | :---: | :---: |
| View dashboard, analytics & facility details | Yes | Yes | Yes |
| Download generated PDF reports | Yes | Yes | Yes |
| Create / edit consumption records & bulk upload | Yes | Yes | — |
| Generate PDF sustainability reports | Yes | Yes | — |
| Verify consumption records & delete reports | Yes | — | — |
| Manage facilities, emission factors, org settings & invites | Yes | — | — |

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, Tailwind CSS v4, React Router v7, Recharts, Axios, React Hook Form, Yup, Lucide React |
| **Backend** | Node.js (ESM), Express 5, MongoDB, Mongoose 8, JWT (`jsonwebtoken`), `bcrypt`, `joi` |
| **Files & Reports** | Multer (in-memory), `csv-parse`, `exceljs`, `pdfkit` |
| **Linting & Tooling** | `oxlint`, Vite dev proxy, Vercel SPA routing |

---

## Project Structure

```text
carbon-tracker/
├── .env.example                 # Root environment variable template
├── client/                      # React + Vite frontend
│   ├── src/
│   │   ├── components/          # Layout, logo, protected routes, chart helpers
│   │   ├── context/             # AuthContext for session & role state
│   │   ├── pages/               # Dashboard, Consumption, Upload, Facilities, EmissionFactors, Reports, Settings, Auth
│   │   └── services/            # Axios API client & domain service modules
│   ├── vercel.json              # SPA rewrite rules for Vercel
│   └── vite.config.js           # Vite + Tailwind v4 + /api dev proxy
└── server/                      # Express + Mongoose API
    └── src/
        ├── controllers/         # Request handlers for each domain
        ├── lib/                 # MongoDB connection setup
        ├── middleware/          # JWT auth, RBAC, 404 & error handlers
        ├── models/              # Mongoose schemas (Organization, Facility, User, ConsumptionRecord, EmissionFactor, UploadBatch, Report, Invite)
        ├── routes/              # Express routers mounted under /api/*
        ├── scripts/             # Database seed & utility scripts
        ├── services/            # Emissions calculator, upload parser, aggregations, PDF generator
        ├── app.js               # Express app, CORS, and route registration
        └── index.js             # Server entry point
```

---

## Prerequisites

- **Node.js** 20+
- **MongoDB** (local instance or MongoDB Atlas connection string)
- **npm**

---

## Getting Started

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/Parimelazagan/Carbon_emmision_tracker.git
cd Carbon_emmision_tracker

# Install backend dependencies
cd server && npm install

# Install frontend dependencies
cd ../client && npm install
```

### 2. Environment Configuration

Copy `.env.example` to `server/.env` and update the values for your environment:

```bash
# macOS / Linux
cp .env.example server/.env
```

```powershell
# Windows PowerShell
Copy-Item .env.example server/.env
```

Environment variables in `server/.env`:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/carbon_tracker` |
| `PORT` | API server port | `3001` |
| `NODE_ENV` | Runtime environment | `development` |
| `CLIENT_ORIGIN` | Allowed CORS origin(s), comma-separated | `http://localhost:5173` |
| `JWT_SECRET` | Secret key used to sign JWT tokens | `replace-with-a-long-random-string` |
| `JWT_EXPIRES_IN` | JWT expiration duration | `7d` |
| `REPORTS_DIR` | Directory where generated PDFs are stored | `storage/reports` |

> **Frontend API URL:** In local development, Vite proxies `/api` requests to `http://localhost:3001`. For production deployments where the frontend and backend are hosted separately, set `VITE_API_URL` in `client/.env` to your deployed API base URL.

### 3. Seed Database

Populate the `EmissionFactor` collection with baseline regional conversion factors before logging consumption records:

```bash
cd server
npm run seed
```

*(Optional)* Seed a demo organization, facilities, and sample consumption records for local development:

```bash
cd server
npm run seed:sample
```

> **Note:** Do not run `seed:sample` against a production database.

### 4. Run Locally

Start the backend API (`http://localhost:3001`) and frontend dev server (`http://localhost:5173`) in separate terminals:

**Terminal 1 — API:**
```bash
cd server
npm run dev
```

Verify the API is running via `GET http://localhost:3001/api/health`.

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```

---

## API Overview

All endpoints return a consistent JSON envelope:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

Routes are mounted under `/api/*` (and mirrored at root `/*`):

| Route Group | Description |
| :--- | :--- |
| `/api/health` | Service health check |
| `/api/auth` | Signup, login, current user (`/me`), team invites, invite acceptance |
| `/api/organizations` | Fetch and update organization profile & `baselineYear` |
| `/api/facilities` | List, create, update, and delete organizational facilities |
| `/api/consumption` | CRUD for consumption records and admin verification (`/verify`) |
| `/api/upload` | Bulk CSV/Excel upload and batch history (`/batches`, `/batches/:id`) |
| `/api/reports` | Aggregations (`/trend`, `/by-scope`, `/by-type`, `/by-facility`, `/summary`) and PDF report generation/download |
| `/api/emission-factors` | Read and manage regional emission conversion factors |

---

## Bulk Upload Format

Bulk uploads accept `.csv`, `.xlsx`, and `.xls` files (max 5 MB) with the following required columns:

| Column | Accepted Values / Format |
| :--- | :--- |
| `date` | ISO date (`YYYY-MM-DD`), cannot be in the future |
| `facilityId` | Valid Facility ID belonging to your organization |
| `type` | `electricity`, `diesel`, `petrol`, `natural_gas`, or `water` |
| `amount` | Positive number |
| `unit` | Unit matching a configured emission factor (e.g., `kWh`, `litre`, `m3`) |
| `region` | Region matching a configured emission factor (e.g., `UK`, `US`, `EU`, `Australia`, `India`, `Global`) |

---

## Available Scripts

### Backend (`server/`)

- `npm run dev` — Start Express API with Node `--watch` mode
- `npm start` — Start Express API in standard mode
- `npm run seed` — Seed `EmissionFactor` records
- `npm run seed:sample` — Seed sample organization, facilities, and consumption records

### Frontend (`client/`)

- `npm run dev` — Start Vite development server
- `npm run build` — Build production bundle into `client/dist/`
- `npm run preview` — Preview production build locally
- `npm run lint` — Run `oxlint`

---

## Deployment

- **Frontend (`client/`):** Configured with `client/vercel.json` to rewrite all routes to `/index.html` for React Router SPA support on Vercel. Set `VITE_API_URL` to your hosted backend URL.
- **Backend (`server/`):** Set all required environment variables (`MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`, etc.) and run `npm start`. Ensure `REPORTS_DIR` points to writable storage if PDF generation is enabled.
