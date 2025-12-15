# Municipal Waste Landfill Daily Reporting

Node.js + PostgreSQL stack to digitize daily landfill facility reporting (login, data capture with text/dropdowns/photos, past reports view). Frontend prototype lives in `frontend/` and backend API in `backend/`. Sample manual forms are in `current manual/` for reference.

## Features (initial cut)
- JWT auth (register/login) with hashed passwords.
- Create daily reports: site info, date, status, tonnage, weather, cover material, notes, extra JSON payload for dropdowns, up to 5 photos (stored locally for now).
- List and fetch past reports with basic filters.
- Simple HTML prototype (`frontend/index.html`) to exercise the API without a build step.

## Project structure
- `backend/` — Express API, Postgres access, file uploads.
  - `src/server.js` — app entrypoint.
  - `src/routes/auth.js` — auth endpoints.
  - `src/routes/reports.js` — report CRUD (create/list/detail).
  - `src/middleware/auth.js` — JWT guard.
  - `src/utils/storage.js` — multer storage config for photos.
  - `db/schema.sql` — tables for users, reports, and report_media.
  - `uploads/` — local upload target (kept out of git).
- `frontend/` — lightweight HTML prototype that hits the API directly; includes a separate auth view and daily data entry view with 3 preset sites (Sungai Udang, Ampang Jajar, Jabi) and fields mapped to the PDF template (operation hours, manpower, equipment, activities, rainfall, forecast, LTP discharge, tonnage breakdown, notes, photos).
- `current manual/` — existing PDF templates for reference.

## API quick reference
- `POST /api/auth/register` { email, password, displayName? }
- `POST /api/auth/login` { email, password }
- `POST /api/reports` (multipart/form-data with Authorization: Bearer token)
  - Fields: siteName*, reportDate* (ISO date), status, tonnage, weather, coverMaterial, notes, extras (JSON string), photos[] up to 5.
- `GET /api/reports?siteName&dateFrom&dateTo&limit&offset` (auth required)
- `GET /api/reports/:id` (auth required)

## Local setup
1. Install dependencies (no network here yet, but once online):
   ```bash
   cd backend
   npm install
   ```
2. Create a Postgres database and apply schema:
   ```bash
   createdb landfill_reports
   psql $DATABASE_URL -f db/schema.sql
   ```
3. Copy `.env.example` to `.env` in `backend/` and fill values (DATABASE_URL, JWT_SECRET, PORT, UPLOAD_DIR).
4. Run the API:
   ```bash
   npm run dev
   # API at http://localhost:4000
   ```
5. Open the prototype UI: `frontend/index.html` (served locally or via a simple static server) and use register/login then submit a report with photos.

## GCP deployment sketch
- Use Cloud SQL for Postgres; store `DATABASE_URL`/secrets in Secret Manager or Cloud Run env vars.
- Build API into a container and deploy to Cloud Run; map `/uploads` to Cloud Storage or use signed uploads instead of disk.
- Add Cloud Storage bucket for photos and signed URLs, and a load balancer/HTTPS as needed.

## Next steps
- Flesh out frontend with a real framework (e.g., Vite + React) and auth-aware routing.
- Add stronger validation and structured dropdown vocabularies (sites, waste types, equipment status, etc.).
- Add pagination UI, per-report detail view with attachments, and report export (PDF/CSV) to mirror current manual templates.
- Add migrations/seed scripts (e.g., db-migrate/Prisma) and automated tests.
