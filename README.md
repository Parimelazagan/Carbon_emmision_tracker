# Carbon Emissions Tracking Platform

Centralized web app for organizations to monitor energy, fuel, and resource consumption, calculate carbon emissions, and generate sustainability reports.

This repo is a **monorepo**: React frontend in `client/`, Express API in `server/`.

## Prerequisites

- Node.js 20+
- MySQL 8+
- npm

## Setup

### 1. Clone and install

```bash
cd carbon-tracker
cd server && npm install
cd ../client && npm install
```

### 2. Environment

Copy `.env.example` to `server/.env` and fill in values:

```bash
cp .env.example server/.env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example server/.env
```

Required:

- `DATABASE_URL` — MySQL connection string (`mysql://USER:PASSWORD@localhost:3306/carbon_tracker`)
- `JWT_SECRET` — secret used to sign auth tokens

### 3. Database

Create an empty database (example):

```sql
CREATE DATABASE carbon_tracker;
```

From `server/`:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Run locally

Terminal 1 — API (http://localhost:3001):

```bash
cd server
npm run dev
```

Health check: `GET http://localhost:3001/api/health`

Terminal 2 — frontend (http://localhost:5173):

```bash
cd client
npm run dev
```

The Vite dev server proxies `/api` to the Express app.

## Project structure

```
carbon-tracker/
├── client/          # React + Vite
└── server/          # Express + Prisma
```

API response shape:

```json
{ "success": true, "data": {}, "error": null }
```

Planned route groups: `/api/auth`, `/api/organizations`, `/api/facilities`, `/api/consumption`, `/api/upload`, `/api/reports`.

## Stack

- Frontend: React (Vite), Tailwind CSS, React Router, Recharts, Axios, React Hook Form, Yup
- Backend: Node.js, Express, Prisma (MySQL), JWT + bcrypt, Joi
- Files/reports: Multer, csv-parse, exceljs, pdfkit
