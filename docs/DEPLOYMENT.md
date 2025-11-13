# Deployment Guide - Zaunite Workshop

This guide covers deploying the Zaunite Workshop deck builder with Riot Sign-On authentication to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Database Setup](#database-setup)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Rollback Procedure](#rollback-procedure)
8. [Monitoring](#monitoring)

## Prerequisites

### Required Accounts & Services

- [ ] AWS Account with:
  - DynamoDB access
  - IAM user with appropriate permissions
- [ ] Riot Developer Account with registered OAuth application
- [ ] Domain name (e.g., zauniteworkshop.com)
- [ ] SSL certificate (Let's Encrypt or AWS Certificate Manager)
- [ ] Server or hosting platform:
  - AWS Lightsail (recommended for simplicity)
  - AWS EC2 + ECS (for scalability)
  - Any VPS with Docker support

### Required Software

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+ (for local builds)
- Git

## Pre-Deployment Checklist

### 1. Riot OAuth Application

- [ ] Application registered at https://developer.riotgames.com/
- [ ] Production redirect URI configured: `https://yourdomain.com/auth/callback`
- [ ] Client ID and Client Secret obtained
- [ ] Production API key requested (optional, for card data)

### 2. AWS Resources

- [ ] DynamoDB tables created (or ready to create)
- [ ] IAM user created with DynamoDB permissions
- [ ] Access keys generated and saved securely
- [ ] Region selected (e.g., us-east-1)

### 3. Gitea Setup

- [ ] Gitea instance running
- [ ] Admin account created
- [ ] Admin API token generated
- [ ] Accessible from backend API

### 4. Security

- [ ] SESSION_SECRET generated (32+ characters)
- [ ] ENCRYPTION_KEY generated (32+ characters)
- [ ] All secrets stored securely (not in version control)
- [ ] SSL/TLS certificate obtained for domain

### 5. DNS

- [ ] Domain DNS configured to point to server
- [ ] A record for root domain
- [ ] A record for www subdomain (optional)
- [ ] DNS propagation verified

## Backend Deployment

### Step 1: Prepare Environment Configuration

1. Copy the production environment template:

```bash
cp deckbuilder-api/.env.production.example deckbuilder-api/.env.production
```

2. Edit `.env.production` with your production values:

```bash
# Generate secure secrets
openssl rand -base64 32  # For SESSION_SECRET
openssl rand -base64 32  # For ENCRYPTION_KEY
```

3. Fill in all required variables:

```env
# Server
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://zauniteworkshop.com

# Riot OAuth
RIOT_CLIENT_ID=your_production_client_id
RIOT_CLIENT_SECRET=your_production_client_secret
RIOT_REDIRECT_URI=https://zauniteworkshop.com/auth/callback

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
DYNAMODB_USERS_TABLE=deckbuilder-users-prod
DYNAMODB_SESSIONS_TABLE=deckbuilder-sessions-prod

# Security
SESSION_SECRET=your_generated_secret
ENCRYPTION_KEY=your_generated_key

# Gitea
GITEA_URL=http://gitea:3000
GITEA_ADMIN_TOKEN=your_gitea_admin_token
```

### Step 2: Set Up DynamoDB Tables

Run the setup script to create DynamoDB tables:

```bash
cd deckbuilder-api
npm install
npm run setup:dynamodb
cd ..
```

This will create:
- `deckbuilder-users-prod` table with PUUID primary key
- `deckbuilder-sessions-prod` table with sessionId primary key
- Appropriate indexes and TTL configuration

### Step 3: Deploy Backend

#### Option A: Using Deployment Script (Recommended)

```bash
chmod +x deploy-backend.sh
./deploy-backend.sh
```

The script will:
1. Validate environment variables
2. Set up DynamoDB tables
3. Build Docker image
4. Stop existing containers
5. Start new containers
6. Verify API health

#### Option B: Manual Deployment

```bash
# Build Docker image
docker build -t deckbuilder-api:latest ./deckbuilder-api

# Start services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Check logs
docker-compose logs -f api
```

### Step 4: Verify Backend

```bash
# Check API health
curl http://localhost:3001/api/health

# Expected response:
# {"status":"ok","timestamp":"2024-..."}

# Check environment validation
docker-compose logs api | grep "Environment validation"

# Should see: "✅ Environment validation passed"
```

## Frontend Deployment

### Step 1: Configure Frontend Environment

1. Copy environment template:

```bash
cp deckbuilder-webapp/.env.example deckbuilder-webapp/.env.production
```

2. Edit `.env.production`:

```env
VITE_API_URL=https://zauniteworkshop.com/api
VITE_GITEA_URL=https://zauniteworkshop.com/gitea
VITE_RIOT_API_KEY=RGAPI-your-production-key
VITE_USE_RIOT_API=true
```

### Step 2: Build Frontend

```bash
cd deckbuilder-webapp
npm install
npm run build
cd ..
```

This creates an optimized production build in `deckbuilder-webapp/dist/`.

### Step 3: Deploy Frontend

#### Option A: Static Hosting (S3 + CloudFront)

```bash
# Install AWS CLI
aws configure

# Sync to S3
aws s3 sync deckbuilder-webapp/dist/ s3://your-bucket-name/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

#### Option B: Nginx on Same Server

1. Copy build to web root:

```bash
sudo cp -r deckbuilder-webapp/dist/* /var/www/zauniteworkshop/
```

2. Configure Nginx:

```nginx
server {
    listen 443 ssl http2;
    server_name zauniteworkshop.com www.zauniteworkshop.com;

    ssl_certificate /etc/letsencrypt/live/zauniteworkshop.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/zauniteworkshop.com/privkey.pem;

    # Frontend
    root /var/www/zauniteworkshop;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers (if needed)
        add_header Access-Control-Allow-Credentials true;
    }

    # Gitea (optional, if exposing Gitea UI)
    location /gitea/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name zauniteworkshop.com www.zauniteworkshop.com;
    return 301 https://$server_name$request_uri;
}
```

3. Test and reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Step 4: Verify Frontend

1. Visit your domain: `https://zauniteworkshop.com`
2. Check browser console for errors
3. Verify API connectivity
4. Test login flow

## Database Setup

### DynamoDB Tables

The tables are created automatically by the deployment script, but you can verify them:

```bash
# List tables
aws dynamodb list-tables --region us-east-1

# Describe users table
aws dynamodb describe-table --table-name deckbuilder-users-prod --region us-east-1

# Describe sessions table
aws dynamodb describe-table --table-name deckbuilder-sessions-prod --region us-east-1
```

### Table Structure

#### Users Table

```
Primary Key: puuid (String)
Attributes:
  - puuid: String (HASH)
  - giteaUsername: String
  - giteaPasswordEncrypted: String
  - gameName: String
  - tagLine: String
  - summonerIcon: Number (optional)
  - createdAt: String (ISO timestamp)
  - lastLogin: String (ISO timestamp)

Global Secondary Index:
  - GiteaUsernameIndex on giteaUsername
```

#### Sessions Table

```
Primary Key: sessionId (String)
Attributes:
  - sessionId: String (HASH)
  - data: Map (session data)
  - expiresAt: Number (Unix timestamp)
  - createdAt: String (ISO timestamp)

TTL: Enabled on expiresAt
```

### Backup Configuration

Enable point-in-time recovery for production tables:

```bash
# Enable PITR for users table
aws dynamodb update-continuous-backups \
  --table-name deckbuilder-users-prod \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true

# Enable PITR for sessions table
aws dynamodb update-continuous-backups \
  --table-name deckbuilder-sessions-prod \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
```

## Post-Deployment Verification

### 1. Health Checks

```bash
# API health
curl https://zauniteworkshop.com/api/health

# Expected: {"status":"ok","timestamp":"..."}
```

### 2. Authentication Flow

1. Visit `https://zauniteworkshop.com`
2. Click "Sign in with Riot Games"
3. Authorize on Riot's page
4. Verify redirect back to app
5. Check that user is logged in
6. Verify Gitea account was created

### 3. Deck Operations

1. Create a new deck
2. Save the deck
3. Reload the page
4. Verify deck persists
5. Edit and save again
6. Delete the deck

### 4. Session Management

1. Log in
2. Close browser
3. Reopen and visit site
4. Verify still logged in (session persists)
5. Log out
6. Verify redirected to login

### 5. Error Handling

1. Test with invalid OAuth state
2. Test with expired session
3. Verify error messages display correctly
4. Check that errors are logged

## Rollback Procedure

If issues occur after deployment:

### 1. Immediate Rollback

```bash
# Stop new containers
docker-compose down api

# Start previous version
docker-compose up -d api-backup

# Or restore from backup image
docker run -d --name deckbuilder-api deckbuilder-api:backup
```

### 2. Database Rollback

```bash
# Restore from point-in-time backup
aws dynamodb restore-table-to-point-in-time \
  --source-table-name deckbuilder-users-prod \
  --target-table-name deckbuilder-users-prod-restored \
  --restore-date-time 2024-01-01T00:00:00Z
```

### 3. Frontend Rollback

```bash
# Restore previous build
aws s3 sync s3://your-backup-bucket/ s3://your-bucket-name/ --delete

# Or restore from local backup
sudo cp -r /var/www/zauniteworkshop.backup/* /var/www/zauniteworkshop/
```

## Monitoring

### Application Logs

```bash
# View API logs
docker-compose logs -f api

# View last 100 lines
docker-compose logs --tail=100 api

# View Gitea logs
docker-compose logs -f gitea
```

### CloudWatch Metrics (if using AWS)

Set up CloudWatch alarms for:
- DynamoDB read/write capacity
- API Gateway 4xx/5xx errors
- Lambda errors and duration
- CloudFront cache hit rate

### Health Monitoring

Set up external monitoring (e.g., UptimeRobot, Pingdom):
- Monitor: `https://zauniteworkshop.com/api/health`
- Frequency: Every 5 minutes
- Alert on: Status code != 200

### Log Aggregation

Consider using:
- CloudWatch Logs (AWS)
- Datadog
- Loggly
- Papertrail

## Troubleshooting

### API Not Starting

```bash
# Check logs
docker-compose logs api

# Common issues:
# - Missing environment variables
# - DynamoDB connection issues
# - Port already in use
```

### Authentication Failing

```bash
# Check Riot OAuth configuration
# Verify redirect URI matches exactly
# Check client ID and secret
# Verify session secret is set
```

### Database Connection Issues

```bash
# Test AWS credentials
aws dynamodb list-tables --region us-east-1

# Check IAM permissions
# Verify table names match configuration
```

### Session Issues

```bash
# Check session table
aws dynamodb scan --table-name deckbuilder-sessions-prod --limit 5

# Verify SESSION_SECRET is set
# Check cookie settings in browser
```

## Security Checklist

- [ ] All secrets stored securely (not in git)
- [ ] HTTPS enabled with valid certificate
- [ ] CORS configured correctly
- [ ] Rate limiting enabled on auth endpoints
- [ ] Session expiry configured appropriately
- [ ] Database backups enabled
- [ ] Monitoring and alerting set up
- [ ] Security headers configured in Nginx
- [ ] DynamoDB tables have appropriate IAM policies
- [ ] Gitea admin token has minimal required permissions

## Maintenance

### Regular Tasks

**Daily:**
- Check application logs for errors
- Monitor API health endpoint

**Weekly:**
- Review CloudWatch metrics
- Check disk space on server
- Review security logs

**Monthly:**
- Update dependencies
- Review and rotate secrets if needed
- Test backup restoration
- Review and optimize DynamoDB capacity

### Updates

To deploy updates:

```bash
# Pull latest code
git pull origin main

# Rebuild and deploy backend
./deploy-backend.sh

# Rebuild and deploy frontend
cd deckbuilder-webapp
npm run build
# Deploy dist/ to hosting
```

## Support

For deployment issues:
1. Check logs: `docker-compose logs api`
2. Verify environment variables
3. Test database connectivity
4. Review this guide
5. Check GitHub issues

## Additional Resources

- [Riot Sign-On Setup Guide](./RIOT_SIGN_ON_SETUP.md)
- [AWS Lightsail Deployment](../LIGHTSAIL_DEPLOYMENT_GUIDE.md)
- [Serverless Deployment](../SERVERLESS_DEPLOYMENT_GUIDE.md)
- [Docker Documentation](https://docs.docker.com/)
- [AWS DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
