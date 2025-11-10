# Proxmox Deployment Guide

Complete guide for deploying DeckBuilder in a Proxmox LXC container.

## Overview

We'll deploy everything in a single LXC container running:
- Gitea (with PostgreSQL)
- Web App (served by Nginx)
- Optional Backend API

## Option 1: LXC Container (Recommended)

### Step 1: Create LXC Container

In Proxmox web UI:

1. Click "Create CT"
2. Configure:
   - **Hostname**: `deckbuilder`
   - **Template**: Ubuntu 22.04 or Debian 12
   - **Disk**: 20GB minimum (50GB recommended for growth)
   - **CPU**: 2 cores minimum
   - **Memory**: 2GB minimum (4GB recommended)
   - **Network**: Bridge to your network, assign static IP
   - **Features**: Enable "Nesting" (for Docker)

3. Start the container

### Step 2: Initial Container Setup

SSH into the container:
```bash
ssh root@<container-ip>
```

Update system:
```bash
apt update && apt upgrade -y
```

Install required packages:
```bash
apt install -y \
  docker.io \
  docker-compose \
  nginx \
  certbot \
  python3-certbot-nginx \
  git \
  curl
```

Enable Docker:
```bash
systemctl enable docker
systemctl start docker
```

### Step 3: Clone Project

```bash
cd /opt
git clone <your-repo-url> deckbuilder
cd deckbuilder
```

Or upload files via SCP:
```bash
# From your local machine
scp -r . root@<container-ip>:/opt/deckbuilder
```

### Step 4: Configure Environment

Create production docker-compose:
```bash
nano docker-compose.prod.yml
```

Paste this configuration (see below for file content).

### Step 5: Start Gitea

```bash
docker-compose -f docker-compose.prod.yml up -d
```

Wait for Gitea to start:
```bash
docker-compose logs -f gitea
```

### Step 6: Configure Gitea

1. Open `http://<container-ip>:3000`
2. Complete initial setup:
   - Database: PostgreSQL (already configured)
   - Site URL: `https://yourdomain.com` (or your actual domain)
   - Admin account: Create one
3. Create OAuth application:
   - Settings → Applications → Create OAuth2 Application
   - Name: `DeckBuilder`
   - Redirect URI: `https://yourdomain.com/auth/callback`
   - Save Client ID and Secret

### Step 7: Build Web App

Install Node.js:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

Build the web app:
```bash
cd /opt/deckbuilder/deckbuilder-webapp

# Create production .env
cat > .env << EOF
VITE_GITEA_URL=https://yourdomain.com
VITE_GITEA_CLIENT_ID=your_client_id
VITE_GITEA_CLIENT_SECRET=your_client_secret
VITE_REDIRECT_URI=https://yourdomain.com/auth/callback
VITE_SCRYFALL_API=https://api.scryfall.com
EOF

# Install and build
npm install
npm run build
```

The built files will be in `dist/` folder.

### Step 8: Configure Nginx

Create Nginx config:
```bash
nano /etc/nginx/sites-available/deckbuilder
```

Paste the configuration (see below).

Enable site:
```bash
ln -s /etc/nginx/sites-available/deckbuilder /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

### Step 9: Setup SSL (Let's Encrypt)

```bash
certbot --nginx -d yourdomain.com
```

Follow prompts to get SSL certificate.

### Step 10: Configure Firewall (Optional)

```bash
apt install -y ufw
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

---

## Configuration Files

### docker-compose.prod.yml

```yaml
version: "3.9"

services:
  gitea:
    image: gitea/gitea:latest
    container_name: deckbuilder-gitea
    environment:
      - USER_UID=1000
      - USER_GID=1000
      - GITEA__database__DB_TYPE=postgres
      - GITEA__database__HOST=db:5432
      - GITEA__database__NAME=gitea
      - GITEA__database__USER=gitea
      - GITEA__database__PASSWD=gitea_secure_password_change_this
      - GITEA__server__ROOT_URL=https://yourdomain.com
      - GITEA__server__DOMAIN=yourdomain.com
      - GITEA__server__HTTP_PORT=3000
      - GITEA__security__INSTALL_LOCK=true
      - GITEA__service__DISABLE_REGISTRATION=false
    restart: always
    volumes:
      - gitea-data:/data
      - /etc/timezone:/etc/timezone:ro
      - /etc/localtime:/etc/localtime:ro
    ports:
      - "127.0.0.1:3000:3000"
      - "2222:22"
    depends_on:
      - db

  db:
    image: postgres:14
    container_name: deckbuilder-db
    restart: always
    environment:
      - POSTGRES_USER=gitea
      - POSTGRES_PASSWORD=gitea_secure_password_change_this
      - POSTGRES_DB=gitea
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  gitea-data:
  postgres-data:
```

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/deckbuilder

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL certificates (managed by certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Serve web app (static files)
    location / {
        root /opt/deckbuilder/deckbuilder-webapp/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Proxy Gitea API
    location /api/v1/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50M;
    }

    # Proxy Gitea OAuth
    location /login/oauth/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Proxy Gitea user endpoints
    location /user/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Optional: Gitea web UI (if you want users to access it)
    location /gitea/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50M;
    }
}
```

---

## Option 2: Docker-Only Deployment

If you prefer everything in Docker containers:

### Enhanced docker-compose.yml

```yaml
version: "3.9"

services:
  gitea:
    image: gitea/gitea:latest
    container_name: deckbuilder-gitea
    environment:
      - USER_UID=1000
      - USER_GID=1000
      - GITEA__database__DB_TYPE=postgres
      - GITEA__database__HOST=db:5432
      - GITEA__database__NAME=gitea
      - GITEA__database__USER=gitea
      - GITEA__database__PASSWD=gitea_secure_password
      - GITEA__server__ROOT_URL=https://yourdomain.com
      - GITEA__server__DOMAIN=yourdomain.com
    restart: always
    volumes:
      - gitea-data:/data
    ports:
      - "127.0.0.1:3000:3000"
      - "2222:22"
    depends_on:
      - db

  db:
    image: postgres:14
    container_name: deckbuilder-db
    restart: always
    environment:
      - POSTGRES_USER=gitea
      - POSTGRES_PASSWORD=gitea_secure_password
      - POSTGRES_DB=gitea
    volumes:
      - postgres-data:/var/lib/postgresql/data

  webapp:
    image: nginx:alpine
    container_name: deckbuilder-webapp
    restart: always
    volumes:
      - ./deckbuilder-webapp/dist:/usr/share/nginx/html:ro
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    ports:
      - "80:80"
    depends_on:
      - gitea

volumes:
  gitea-data:
  postgres-data:
```

---

## Maintenance

### Backup

Create backup script:
```bash
nano /opt/deckbuilder/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/deckbuilder"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup Gitea data
docker exec deckbuilder-gitea /bin/sh -c \
  "cd /data && tar czf - ." > $BACKUP_DIR/gitea_$DATE.tar.gz

# Backup database
docker exec deckbuilder-db pg_dump -U gitea gitea | \
  gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

Make executable and schedule:
```bash
chmod +x /opt/deckbuilder/backup.sh
crontab -e
# Add: 0 2 * * * /opt/deckbuilder/backup.sh
```

### Updates

Update web app:
```bash
cd /opt/deckbuilder/deckbuilder-webapp
git pull
npm install
npm run build
systemctl restart nginx
```

Update Gitea:
```bash
cd /opt/deckbuilder
docker-compose pull
docker-compose up -d
```

### Monitoring

Check logs:
```bash
# Gitea logs
docker-compose logs -f gitea

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# System resources
htop
```

---

## Performance Tuning

### For LXC Container

In Proxmox host, edit container config:
```bash
nano /etc/pve/lxc/<CTID>.conf
```

Add:
```
# Better I/O performance
rootfs: local-lvm:vm-<CTID>-disk-0,size=50G,mountoptions=noatime

# CPU priority
cores: 4
cpulimit: 2
cpuunits: 1024
```

### PostgreSQL Tuning

```bash
docker exec -it deckbuilder-db psql -U gitea
```

```sql
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
```

Restart database:
```bash
docker-compose restart db
```

---

## Security Checklist

- [ ] Change default PostgreSQL password
- [ ] Enable UFW firewall
- [ ] Setup SSL with Let's Encrypt
- [ ] Configure fail2ban for SSH
- [ ] Regular backups scheduled
- [ ] Keep system updated
- [ ] Monitor logs for suspicious activity
- [ ] Use strong passwords for Gitea admin
- [ ] Limit Gitea registration (if needed)
- [ ] Setup monitoring (optional: Prometheus + Grafana)

---

## Troubleshooting

### Container won't start
```bash
# Check logs
pct enter <CTID>
journalctl -xe
```

### Docker issues
```bash
# Restart Docker
systemctl restart docker

# Check Docker status
docker ps
docker-compose ps
```

### Nginx errors
```bash
# Test config
nginx -t

# Check logs
tail -f /var/log/nginx/error.log
```

### Database connection issues
```bash
# Check database
docker exec -it deckbuilder-db psql -U gitea -d gitea

# Restart services
docker-compose restart
```

---

## Resource Requirements

### Minimum
- 2 CPU cores
- 2GB RAM
- 20GB disk
- 100 Mbps network

### Recommended
- 4 CPU cores
- 4GB RAM
- 50GB disk
- 1 Gbps network

### For 100+ users
- 8 CPU cores
- 8GB RAM
- 100GB disk
- Consider separate database server

---

## Next Steps

1. Setup monitoring (Netdata, Prometheus)
2. Configure automated backups to external storage
3. Setup CDN for static assets (Cloudflare)
4. Configure email for Gitea notifications
5. Setup reverse proxy for multiple domains (Traefik)
