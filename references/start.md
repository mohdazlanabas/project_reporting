# Quick Start Guide

## Startup Procedure

1. **Start Docker containers**
   ```bash
   docker-compose up -d
   ```

2. **Verify containers are running**
   ```bash
   docker-compose ps
   ```

   You should see:
   - `landfill_postgres` - Status: Up (healthy)
   - `landfill_backend` - Status: Up

3. **Check backend is ready**
   ```bash
   docker logs landfill_backend
   ```

   Look for: `API listening on http://localhost:4000`

4. **Open the frontend**
   - Open `frontend/index.html` in your browser
   - Register a new user account
   - Start creating reports

## Shutdown Procedure

1. **Stop all containers**
   ```bash
   docker-compose down
   ```

2. **Stop and remove all data** (fresh start next time)
   ```bash
   docker-compose down -v
   ```

## Quick Commands

- **View logs**: `docker logs -f landfill_backend`
- **View all logs**: `docker-compose logs -f`
- **Restart**: `docker-compose restart`
- **Rebuild after code changes**: `docker-compose build backend && docker-compose up -d`

## Access Points

- **Frontend**: `frontend/index.html` (open in browser)
- **Backend API**: http://localhost:4000
- **Database**: localhost:5433 (user: landfill_user, db: landfill_reports)
