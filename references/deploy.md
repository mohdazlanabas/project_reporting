# Deployment Guide - Google Cloud Platform (GCP)

This guide explains how to deploy the Landfill Daily Reporting System to Google Cloud Platform using Cloud Run and Cloud SQL.

## Overview

We'll deploy:
- **Backend API** → Cloud Run (containerized service)
- **PostgreSQL Database** → Cloud SQL (managed database)
- **File Uploads** → Cloud Storage (photos and attachments)
- **Frontend** → Cloud Storage + CDN or bundled with backend

## Prerequisites

1. **GCP Account** with billing enabled
2. **gcloud CLI** installed and configured
3. **Docker** installed locally
4. **Project setup** in GCP Console

## Step 1: Initial GCP Setup

### 1.1 Install and Configure gcloud CLI

```bash
# Install gcloud CLI (if not already installed)
# Visit: https://cloud.google.com/sdk/docs/install

# Login to your GCP account
gcloud auth login

# Set your project ID
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### 1.2 Set Environment Variables

```bash
export PROJECT_ID="YOUR_PROJECT_ID"
export REGION="asia-southeast1"  # Singapore region, change as needed
export SERVICE_NAME="landfill-reports-api"
export DB_INSTANCE_NAME="landfill-db"
```

## Step 2: Create Cloud SQL Database

### 2.1 Create PostgreSQL Instance

```bash
# Create Cloud SQL PostgreSQL instance
gcloud sql instances create $DB_INSTANCE_NAME \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=$REGION \
  --storage-type=SSD \
  --storage-size=10GB \
  --backup \
  --backup-start-time=03:00

# Note: db-f1-micro is the smallest tier. For production, use db-custom or db-n1-standard-1
```

### 2.2 Create Database and User

```bash
# Create database
gcloud sql databases create landfill_reports \
  --instance=$DB_INSTANCE_NAME

# Create database user
gcloud sql users create landfill_user \
  --instance=$DB_INSTANCE_NAME \
  --password=CHANGE_THIS_SECURE_PASSWORD
```

### 2.3 Apply Database Schema

```bash
# Get Cloud SQL connection name
gcloud sql instances describe $DB_INSTANCE_NAME \
  --format='value(connectionName)'

# Install Cloud SQL Proxy
# Download from: https://cloud.google.com/sql/docs/postgres/sql-proxy

# Connect to database using proxy
./cloud-sql-proxy $PROJECT_ID:$REGION:$DB_INSTANCE_NAME &

# Apply schema
psql "host=127.0.0.1 port=5432 dbname=landfill_reports user=landfill_user" \
  -f backend/db/schema.sql
```

## Step 3: Create Cloud Storage Bucket for Uploads

```bash
# Create bucket for file uploads
gsutil mb -l $REGION gs://${PROJECT_ID}-landfill-uploads

# Set bucket permissions (private by default)
gsutil iam ch allUsers:objectViewer gs://${PROJECT_ID}-landfill-uploads

# Or for more secure setup, use signed URLs (recommended)
```

## Step 4: Store Secrets in Secret Manager

```bash
# Create JWT secret
echo -n "your-super-secret-jwt-key-$(openssl rand -base64 32)" | \
  gcloud secrets create jwt-secret --data-file=-

# Create database password secret
echo -n "CHANGE_THIS_SECURE_PASSWORD" | \
  gcloud secrets create db-password --data-file=-
```

## Step 5: Prepare Backend for Deployment

### 5.1 Update Backend Configuration

Create a production Dockerfile (if needed):

```dockerfile
# backend/Dockerfile.prod
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 8080

CMD ["node", "src/server.js"]
```

### 5.2 Update server.js for Cloud Run

Modify `backend/src/server.js` to use PORT environment variable:

```javascript
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
```

### 5.3 Create .gcloudignore

```bash
# backend/.gcloudignore
node_modules/
.env
.git/
.gitignore
*.md
uploads/*
!uploads/.gitkeep
```

## Step 6: Deploy Backend to Cloud Run

### 6.1 Build and Deploy

```bash
# Navigate to backend directory
cd backend

# Get database connection name
DB_CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE_NAME \
  --format='value(connectionName)')

# Deploy to Cloud Run
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production" \
  --set-env-vars="UPLOAD_DIR=uploads" \
  --set-env-vars="DATABASE_URL=postgresql://landfill_user:$(gcloud secrets versions access latest --secret=db-password)@localhost/landfill_reports?host=/cloudsql/$DB_CONNECTION_NAME" \
  --set-secrets="JWT_SECRET=jwt-secret:latest" \
  --add-cloudsql-instances=$DB_CONNECTION_NAME \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=60

# Note: This uses Cloud SQL Unix socket connection via /cloudsql/
```

### 6.2 Get Service URL

```bash
# Get the deployed service URL
gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --format='value(status.url)'
```

## Step 7: Deploy Frontend

### Option A: Bundle with Backend (Simplest)

```bash
# Copy frontend files to backend
cp -r ../frontend ./public

# Update backend/src/server.js to serve static files:
# app.use(express.static('public'));

# Redeploy
gcloud run deploy $SERVICE_NAME --source . --region=$REGION
```

### Option B: Separate Static Hosting (Recommended)

```bash
# Create bucket for frontend
gsutil mb -l $REGION gs://${PROJECT_ID}-landfill-frontend

# Upload frontend files
gsutil -m cp -r frontend/* gs://${PROJECT_ID}-landfill-frontend/

# Make bucket public
gsutil iam ch allUsers:objectViewer gs://${PROJECT_ID}-landfill-frontend

# Set default page
gsutil web set -m index.html gs://${PROJECT_ID}-landfill-frontend

# Update frontend/index.html with backend URL:
# const apiBase = 'https://YOUR_CLOUD_RUN_URL';
```

## Step 8: Configure Custom Domain (Optional)

```bash
# Map custom domain
gcloud run domain-mappings create \
  --service=$SERVICE_NAME \
  --domain=reports.yourdomain.com \
  --region=$REGION

# Follow DNS instructions provided by the command
```

## Step 9: Set Up Cloud Storage for File Uploads

### 9.1 Update Backend to Use Cloud Storage

Install Google Cloud Storage SDK:

```bash
cd backend
npm install @google-cloud/storage
```

Update `backend/src/utils/storage.js`:

```javascript
const { Storage } = require('@google-cloud/storage');
const multer = require('multer');

const storage = new Storage();
const bucketName = `${process.env.PROJECT_ID}-landfill-uploads`;

const multerStorage = multer.memoryStorage();

const uploadToGCS = async (file) => {
  const bucket = storage.bucket(bucketName);
  const blob = bucket.file(`${Date.now()}-${file.originalname}`);

  await blob.save(file.buffer, {
    contentType: file.mimetype,
  });

  return blob.publicUrl();
};

module.exports = { uploadToGCS, multerStorage };
```

## Step 10: Monitor and Maintain

### 10.1 View Logs

```bash
# View Cloud Run logs
gcloud run services logs read $SERVICE_NAME \
  --region=$REGION \
  --limit=50

# Or use Cloud Console
# https://console.cloud.google.com/run
```

### 10.2 Enable Monitoring

```bash
# Cloud Run automatically provides metrics
# View at: https://console.cloud.google.com/monitoring
```

### 10.3 Database Backups

```bash
# Cloud SQL automatic backups are already enabled
# To create manual backup:
gcloud sql backups create \
  --instance=$DB_INSTANCE_NAME
```

## Cost Estimation

**Minimal Usage (Testing/Small Site):**
- Cloud Run: ~$0-5/month (free tier: 2M requests)
- Cloud SQL (db-f1-micro): ~$7-10/month
- Cloud Storage: ~$0.50/month (for 20GB)
- **Total: ~$10-15/month**

**Production Usage (3 sites, 100 reports/day):**
- Cloud Run (db-custom-2-3840): ~$25/month
- Cloud SQL (db-n1-standard-1): ~$50/month
- Cloud Storage: ~$2/month
- **Total: ~$75-80/month**

## Security Best Practices

1. **Use IAM roles** instead of API keys where possible
2. **Enable Cloud Armor** for DDoS protection
3. **Use VPC Service Controls** for sensitive data
4. **Enable audit logging** for compliance
5. **Rotate secrets** regularly
6. **Use signed URLs** for Cloud Storage instead of public access

## Continuous Deployment (Optional)

### Set up Cloud Build for automated deployments:

Create `cloudbuild.yaml` in project root:

```yaml
steps:
  # Build backend
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/landfill-backend', './backend']

  # Push to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/landfill-backend']

  # Deploy to Cloud Run
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'landfill-reports-api'
      - '--image=gcr.io/$PROJECT_ID/landfill-backend'
      - '--region=asia-southeast1'
      - '--platform=managed'

images:
  - 'gcr.io/$PROJECT_ID/landfill-backend'
```

## Troubleshooting

### Connection Issues
```bash
# Test database connectivity
gcloud sql connect $DB_INSTANCE_NAME --user=landfill_user --database=landfill_reports
```

### Service Not Starting
```bash
# Check logs
gcloud run services logs read $SERVICE_NAME --region=$REGION --limit=100
```

### Permission Errors
```bash
# Grant Cloud Run service account access to Cloud SQL
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:SERVICE_ACCOUNT_EMAIL \
  --role=roles/cloudsql.client
```

## Rollback

```bash
# List revisions
gcloud run revisions list --service=$SERVICE_NAME --region=$REGION

# Rollback to previous revision
gcloud run services update-traffic $SERVICE_NAME \
  --to-revisions=REVISION_NAME=100 \
  --region=$REGION
```

## Clean Up (if needed)

```bash
# Delete Cloud Run service
gcloud run services delete $SERVICE_NAME --region=$REGION

# Delete Cloud SQL instance
gcloud sql instances delete $DB_INSTANCE_NAME

# Delete Cloud Storage buckets
gsutil -m rm -r gs://${PROJECT_ID}-landfill-uploads
gsutil -m rm -r gs://${PROJECT_ID}-landfill-frontend
```

---

## Summary

Your application is now deployed on GCP with:
- ✅ Scalable backend API on Cloud Run
- ✅ Managed PostgreSQL database on Cloud SQL
- ✅ Secure file storage on Cloud Storage
- ✅ Automatic HTTPS and SSL certificates
- ✅ Automated backups and monitoring
- ✅ Cost-effective scaling (pay only for what you use)

**Access your application at:** The Cloud Run URL provided in Step 6.2

**Next Steps:**
- Configure custom domain
- Set up CI/CD pipeline
- Enable advanced monitoring
- Configure alerts for errors and downtime
