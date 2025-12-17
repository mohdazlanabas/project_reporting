Grenviro Solutions Sdn Bhd
Attn: Management Team

Dear Grenviro Solutions Team,

net1io.com proposes to design and build a Site Daily Report System to replace your manual landfill reporting process with a secure, auditable, and cloud-ready application. Our goal is to deliver faster data capture, higher data quality, and immediate visibility across your facilities.

What we’ll deliver

Web app with secure login and role-based access (Ops, QA, Management).
Daily report capture aligned to your existing templates: site, date, operation hours, manpower, equipment status, activities (operations/LTP/projects/others), rainfall, forecast, LTP discharge, tonnage breakdown, notes, and photo uploads.
Past report search and retrieval with filters (site/date), attachment access, and export-ready data.
PostgreSQL data store with auditability; API-first architecture for future mobile app integration.
Cloud-ready deployment (Google Cloud Run + Cloud SQL + Cloud Storage) with environment-based configuration and CI/CD pipelines.
Admin setup for sites, dropdown vocabularies, and user provisioning.
Security: JWT auth, hashed passwords, storage isolation for uploads, HTTPS-ready deployment.
Implementation approach

Discovery and alignment: confirm fields, dropdown vocabularies, and roles; map current manual PDFs to structured data.
Build: Node.js/Express backend, PostgreSQL schema, secure file handling; modern web frontend for desktop/tablet use.
QA and UAT: walkthroughs with your team, refinement of validations and exports.
Deployment: containerized release to GCP (or your preferred environment), with runbooks and handover.
Timeline

2 weeks: Discovery and UX mockups.
4 weeks: Build core features (auth, reporting, listing, attachments, exports).
2 weeks: UAT, hardening, and go-live support.
Total: ~8 weeks from kickoff.

Investment
Fixed project fee: RM 50,000.
Includes build, testing, deployment assistance, and knowledge transfer. (Cloud hosting costs are included for one year and after which billed directly by the provider.)

Why net1io.com

Experience delivering operational systems for regulated and high-uptime environments.
API-first design for future mobile or BI integrations.
Secure-by-default patterns and cloud-native deployment.
Next steps

We schedule a 60-minute workshop to finalize fields, roles, and reporting outputs.
Sign off on scope and timeline; kick off discovery.
We look forward to partnering with Grenviro Solutions to modernize your daily reporting. Please let us know a convenient time to proceed.

---

## System Architecture Overview (Layman's Explanation)

### How the System Works

Think of this system like a digital filing cabinet combined with a smart form assistant. Instead of filling out paper forms and storing them in physical folders, everything happens on your computer or tablet and gets saved automatically in a secure cloud database.

### The Three Main Parts

**1. The Frontend (What You See and Use)**
- This is the web page you'll interact with - like filling out a form in your browser
- It has dropdown menus to reduce typing errors (e.g., weather options like "Sunny," "Rainy")
- Fields are organized logically: site info, operation hours, manpower, equipment, activities, photos
- You can view past reports, search by date or site, and see detailed summaries
- **File location:** `frontend/index.html` - A single HTML file with built-in styling and logic

**2. The Backend (The Brain)**
- This is the "engine room" that processes your data and talks to the database
- When you submit a report, the backend validates it (checks for required fields, photo limits)
- It securely stores your photos and organizes all the data
- Handles user login/registration with encrypted passwords
- **File structure:**
  - `backend/src/server.js` - Main application entry point
  - `backend/src/routes/auth.js` - Handles login and registration
  - `backend/src/routes/reports.js` - Manages creating and viewing reports
  - `backend/src/middleware/auth.js` - Ensures only logged-in users can access data
  - `backend/src/db.js` - Connects to the database

**3. The Database (The Filing Cabinet)**
- PostgreSQL stores everything in organized tables (like spreadsheet tabs)
- Three main tables:
  - `users` - Who can log in
  - `reports` - All your daily reports
  - `report_media` - Photo attachments linked to reports
- **File:** `backend/db/schema.sql` - Blueprint for database structure

### Design Philosophy

**Simplicity First**
- We start with the essentials: login, create reports, view past reports
- No complex features that slow you down
- Interface mirrors your existing paper forms for easy adoption

**Security Built-In**
- Passwords are encrypted (hashed) - even administrators can't see them
- Login tokens expire automatically
- Only authenticated users can access data

**Cloud-Ready from Day One**
- Using Docker means the same setup works on your laptop and in Google Cloud
- Database, backend, and files all stay together
- Easy to backup, scale up, or move to different cloud providers

**Data Integrity**
- Required fields prevent incomplete reports
- Dropdowns eliminate typos ("Rainy" vs "Rain" vs "Raining")
- Date/time pickers ensure consistent formats
- Photo limits (1-5) keep file sizes manageable

**Future-Proof**
- API-first design means mobile apps can connect later
- Structured data (JSON) makes it easy to export to Excel or BI tools
- All timestamps and user tracking for auditing

### How Data Flows

1. **User logs in** → Backend checks credentials → Issues secure token
2. **User fills form** → Frontend validates locally → Sends to backend
3. **Backend processes** → Saves to database → Stores photos → Returns confirmation
4. **User views reports** → Backend fetches from database → Frontend displays nicely

### Why This Architecture?

- **Familiar:** Web forms work like Google Forms or online shopping
- **Reliable:** PostgreSQL is used by major companies worldwide
- **Portable:** Docker containers run anywhere (laptop, server, cloud)
- **Maintainable:** Clear separation of concerns (UI, logic, data)
- **Scalable:** Start with one site, expand to multiple sites easily

### What You Can Do With It

- Create daily reports from any device with a web browser
- Search and review past 60 days of reports instantly
- Track equipment status, manpower, and tonnage trends over time
- Access from office or field (when deployed to cloud)
- Export data for management reports or compliance audits

This architecture balances simplicity (easy to understand and use) with robustness (secure, reliable, and ready to grow).

Sincerely,
net1io.com