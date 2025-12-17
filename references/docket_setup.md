# Docker Setup Guide

## What's Configured

This project now uses Docker for both PostgreSQL and the Node.js backend, making it easy to run locally and deploy to GCP later.

### Components
- **PostgreSQL 15** - Database running on port 5433 (to avoid conflicts)
- **Node.js Backend** - API server running on port 4000
- **Automatic Schema Setup** - Database schema is applied automatically on first run

## Running Locally

### Start the application
```bash
docker-compose up -d
```

This will:
1. Pull PostgreSQL 15 Alpine image (first time only)
2. Build the backend Docker image (first time only)
3. Create and start both containers
4. Apply the database schema automatically
5. Start the API server with hot-reload enabled

### Check status
```bash
docker-compose ps
```

### View logs
```bash
# All services
docker-compose logs -f

# Just backend
docker logs -f landfill_backend

# Just database
docker logs -f landfill_postgres
```

### Stop the application
```bash
docker-compose down
```

### Stop and remove all data (fresh start)
```bash
docker-compose down -v
```

## Accessing the Application

1. **Backend API**: http://localhost:4000
   - Available endpoints: `/api/auth/*`, `/api/reports/*`
   - See [README.md](README.md) for API documentation

2. **Frontend**: Open [frontend/index.html](frontend/index.html) in your browser
   - The HTML file will connect to the API at localhost:4000

3. **PostgreSQL**:
   - Host: localhost
   - Port: 5433
   - Database: landfill_reports
   - User: landfill_user
   - Password: landfill_pass

## Development Workflow

The backend has hot-reload enabled via nodemon, so:
1. Edit any file in `backend/src/`
2. Save the file
3. The server automatically restarts
4. Check logs: `docker logs -f landfill_backend`

## Troubleshooting

### Port conflicts
If you see "port already allocated":
```bash
# Check what's using the port
lsof -ti:4000  # or :5433

# Stop other services or change ports in docker-compose.yml
```

### Database issues
```bash
# Connect to the database
docker exec -it landfill_postgres psql -U landfill_user -d landfill_reports

# Reset database
docker-compose down -v
docker-compose up -d
```

### Backend not starting
```bash
# Check logs
docker logs landfill_backend

# Rebuild the image
docker-compose build backend
docker-compose up -d
```

## GCP Deployment Benefits

This Docker setup makes GCP deployment straightforward:

1. **Cloud Run**: Deploy the backend container directly
   ```bash
   gcloud run deploy landfill-api --source ./backend
   ```

2. **Cloud SQL**: Use managed PostgreSQL
   - The same schema.sql works
   - Just update DATABASE_URL environment variable

3. **Cloud Storage**: Replace local uploads with GCS
   - Minimal code changes needed
   - Use signed URLs for photo uploads

4. **Environment Variables**:
   - All config is in environment variables
   - Easy to manage via Cloud Run or Secret Manager

## Files Created

- [docker-compose.yml](docker-compose.yml) - Orchestrates PostgreSQL and backend
- [backend/Dockerfile](backend/Dockerfile) - Backend container definition
- [backend/.dockerignore](backend/.dockerignore) - Excludes unnecessary files
- [backend/.env](backend/.env) - Environment variables (git-ignored)
