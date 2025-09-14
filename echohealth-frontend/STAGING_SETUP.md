# Staging Environment Setup

## Overview

This document describes how to set up and deploy the staging environment for the Echo Psychology frontend.

## Environment Configuration

### 1. Copy Environment Template
```bash
cp env.staging.template .env
```

### 2. Update Environment Variables
Edit `.env` and set:
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`: Your Paystack test key
- `NEXT_PUBLIC_API_BASE_URL`: Should be `http://staging.echopsychology.com`

## Deployment

### 1. Install Dependencies
```bash
npm install
```

### 2. Build for Production
```bash
npm run build
```

### 3. Start Application
```bash
npm start -- -p 3001
```

Or using PM2:
```bash
pm2 start npm --name "frontend-staging" -- start -- -p 3001
```

## Nginx Configuration

The staging environment requires nginx configuration to proxy:
- Frontend requests (`/`) to `http://localhost:3001`
- API requests (`/api/`) to `http://localhost:8081`
- Health checks (`/health`) to `http://localhost:8081/health`

## URLs

- **Frontend**: http://staging.echopsychology.com
- **API**: http://staging.echopsychology.com/api/v1/...
- **Health**: http://staging.echopsychology.com/health

## Notes

- Staging uses HTTP (not HTTPS) for simplicity
- Backend should be running on port 8081
- Frontend runs on port 3001 but is proxied through nginx on port 80
