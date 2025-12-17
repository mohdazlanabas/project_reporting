# Municipal Waste Landfill Daily Reporting

Node.js + PostgreSQL stack to digitize daily landfill facility reporting (login, data capture with text/dropdowns/photos, past reports view). Frontend prototype lives in `frontend/` and backend API in `backend/`. Sample manual forms are in `current manual/` for reference.
A Node.js and PostgreSQL application to digitize daily reporting for municipal waste landfill facilities. This project includes a backend API and a lightweight frontend prototype for data entry and viewing.

## Features (initial cut)
- JWT auth (register/login) with hashed passwords.
- Create daily reports: site info, date, status, tonnage, weather, cover material, notes, extra JSON payload for dropdowns, up to 5 photos (stored locally for now).
- List and fetch past reports with basic filters.
- Simple HTML prototype (`frontend/index.html`) to exercise the API without a build step.
## Features

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
-   **Authentication**: Secure user registration and login using JWT with hashed passwords.
-   **Report Creation**: Users can create detailed daily reports including site information, status, tonnage, weather, photos, and other notes.
-   **Photo Uploads**: Supports up to 5 photos per report, stored on the local file system.
-   **Report History**: Ability to list and retrieve past reports with basic filtering.
-   **Simple Frontend**: A vanilla HTML/JS prototype to test and demonstrate API functionality without a complex build setup.

## API quick reference
- `POST /api/auth/register` { email, password, displayName? }
- `POST /api/auth/login` { email, password }
- `POST /api/reports` (multipart/form-data with Authorization: Bearer token)
  - Fields: siteName*, reportDate* (ISO date), status, tonnage, weather, coverMaterial, notes, extras (JSON string), photos[] up to 5.
- `GET /api/reports?siteName&dateFrom&dateTo&limit&offset` (auth required)
- `GET /api/reports/:id` (auth required)
## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── server.js         # App entrypoint
│   │   ├── routes/           # API routes (auth, reports)
│   │   ├── middleware/       # JWT auth middleware
│   │   └── utils/            # Multer storage config
│   ├── db/
│   │   └── schema.sql        # Postgres table definitions
│   ├── .env.example          # Environment variable template
│   └── package.json
├── frontend/
│   └── index.html            # HTML prototype for API interaction
└── current manual/
    └── (sample PDFs)         # Reference manual forms
```

## API Quick Reference

-   `POST /api/auth/register`
    -   Body: `{ "email", "password", "displayName"? }`
-   `POST /api/auth/login`
    -   Body: `{ "email", "password" }`
-   `POST /api/reports` (multipart/form-data)
    -   Requires `Authorization: Bearer <token>` header.
    -   Fields: `siteName`, `reportDate` (ISO), `status`, `tonnage`, `weather`, `coverMaterial`, `notes`, `extras` (JSON string), `photos[]` (up to 5).
-   `GET /api/reports?siteName&dateFrom&dateTo&limit&offset`
    -   Requires `Authorization: Bearer <token>` header.
-   `GET /api/reports/:id`
    -   Requires `Authorization: Bearer <token>` header.

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
### Prerequisites

## Next steps
- Flesh out frontend with a real framework (e.g., Vite + React) and auth-aware routing.
- Add stronger validation and structured dropdown vocabularies (sites, waste types, equipment status, etc.).
- Add pagination UI, per-report detail view with attachments, and report export (PDF/CSV) to mirror current manual templates.
- Add migrations/seed scripts (e.g., db-migrate/Prisma) and automated tests.
-   Node.js (v18.x or later recommended)
-   PostgreSQL

### Instructions

1.  **Install Dependencies:**
    Navigate to the backend directory and install the required npm packages.
    ```bash
    cd backend
    npm install
    ```

2.  **Set up the Database:**
    Create a new PostgreSQL database and apply the schema.
    ```bash
    createdb landfill_reports
    psql -d landfill_reports -f db/schema.sql
    ```

3.  **Configure Environment Variables:**
    In the `backend/` directory, copy the example `.env` file and fill in your specific configuration.
    ```bash
    cp .env.example .env
    ```
    Now, edit the `.env` file with your database URL, a unique JWT secret, and other settings.

4.  **Run the API Server:**
    ```bash
    npm run dev
    ```
    The API will be running at `http://localhost:4000`.

5.  **Use the Frontend Prototype:**
    Open the `frontend/index.html` file in your web browser to interact with the API. You can register, log in, and submit a new report.

## GCP Deployment Sketch

-   **Database**: Use Cloud SQL for PostgreSQL. Store connection details in Secret Manager.
-   **Backend API**: Containerize the Node.js application and deploy it to Cloud Run.
-   **File Storage**: Use Cloud Storage for photo uploads instead of the local filesystem. This can be achieved by mapping a volume in Cloud Run or, preferably, by using signed URLs to upload directly from the client.
-   **Networking**: Use a Cloud Load Balancer to manage traffic and enable HTTPS.

## Next Steps

-   [ ] **Frontend**: Develop a full-featured frontend using a modern framework like React or Vue.
-   [ ] **Validation**: Implement robust server-side validation for all API inputs.
-   [ ] **Data Structure**: Define and enforce structured vocabularies for dropdowns (e.g., sites, equipment status).
-   [ ] **Database Management**: Integrate a migration tool like `node-pg-migrate` or an ORM like Prisma.
-   [ ] **Testing**: Add a comprehensive suite of unit and integration tests.
-   [ ] **Features**: Implement report exporting (PDF/CSV) and a detailed per-report view.
