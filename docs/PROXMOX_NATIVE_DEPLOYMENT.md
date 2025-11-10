# Proxmox Native Deployment (No Docker)

Deploy DeckBuilder directly in an LXC container without Docker-in-Docker overhead.

## Architecture

```
LXC Container
├── PostgreSQL (native)
├── Gitea (binary)
├── Nginx (native)
├── Node.js (for web app build)
└── Systemd services
```

## Benefits

- ✅ No Docker overhead
- ✅ Better performance
- ✅ Easier resource management
- ✅ Native systemd integration
- ✅ Simpler backups
- ✅ Lower memory usage

---

## Step 1: Create LXC Container

In Proxmox web UI:

1. **Create CT**
2. **Configuration**:
   - Hostname: `deckbuilder`
   - Template: Ubuntu 22.04 or Debian 12
   - Disk: 30GB
   - CPU: 2 cores
   - Memory: 2GB
   - Network: Bridge, static IP
   - **DO NOT enable nesting** (not needed!)

3. Start container

---

## Step 2: Initial Setup

SSH into container:
```bash
ssh root@<container-ip>
```

Update system:
```bash
apt update && apt upgrade -y
```

Install base packages:
```bash
apt install -y \
  postgresql \
  postgresql-contrib \
  nginx \
  certbot \
  python3-certbot-nginx \
  git \
  curl \
  wget \
  sudo \
  ufw
```

---

## Step 3: Setup PostgreSQL

Create database and user:
```bash
sudo -u postgres psql << EOF
CREATE USER gitea WITH PASSWORD 'your_secure_password_here';
CREATE DATABASE gitea OWNER gitea;
GRANT ALL PRIVILEGES ON DATABASE gitea TO gitea;
\q
EOF
```

Configure PostgreSQL for better performance:
```bash
nano /etc/postgresql/14/main/postgresql.conf
```

Update these settings:
```
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
```

Restart PostgreSQL:
```bash
systemctl restart postgresql
```

---

## Step 4: Install Gitea

Create gitea user:
```bash
adduser --system --group --disabled-password --shell /bin/bash --home /home/gitea gitea
```

Download Gitea binary:
```bash
# Check latest version at https://github.com/go-gitea/gitea/releases
GITEA_VERSION="1.21.0"
wget -O /usr/local/bin/gitea https://dl.gitea.com/gitea/${GITEA_VERSION}/gitea-${GITEA_VERSION}-linux-amd64
chmod +x /usr/local/bin/gitea
```

Create directory structure:
```bash
mkdir -p /var/lib/gitea/{custom,data,log}
chown -R gitea:gitea /var/lib/gitea/
chmod -R 750 /var/lib/gitea/

mkdir /etc/gitea
chown root:gitea /etc/gitea
chmod 770 /etc/gitea
```

Create Gitea configuration:
```bash
nano /etc/gitea/app.ini
```

Paste this configuration:
```ini
APP_NAME = DeckBuilder
RUN_MODE = prod
RUN_USER = gitea

[server]
PROTOCOL = http
DOMAIN = yourdomain.com
ROOT_URL = https://yourdomain.com/
HTTP_ADDR = 127.0.0.1
HTTP_PORT = 3000
DISABLE_SSH = false
SSH_PORT = 2222
START_SSH_SERVER = true
LFS_START_SERVER = true
OFFLINE_MODE = false

[database]
DB_TYPE = postgres
HOST = 127.0.0.1:5432
NAME = gitea
USER = gitea
PASSWD = your_secure_password_here
SSL_MODE = disable
CHARSET = utf8

[repository]
ROOT = /var/lib/gitea/data/gitea-repositories
DEFAULT_BRANCH = main

[security]
INSTALL_LOCK = false
SECRET_KEY = 
INTERNAL_TOKEN = 

[service]
DISABLE_REGISTRATION = false
REQUIRE_SIGNIN_VIEW = false
REGISTER_EMAIL_CONFIRM = false
ENABLE_NOTIFY_MAIL = false
DEFAULT_KEEP_EMAIL_PRIVATE = false
DEFAULT_ALLOW_CREATE_ORGANIZATION = true
NO_REPLY_ADDRESS = noreply.yourdomain.com

[mailer]
ENABLED = false

[session]
PROVIDER = file

[log]
MODE = file
LEVEL = info
ROOT_PATH = /var/lib/gitea/log

[oauth2]
ENABLE = true
```

Create systemd service:
```bash
nano /etc/systemd/system/gitea.service
```

Paste:
```ini
[Unit]
Description=Gitea (Git with a cup of tea)
After=syslog.target
After=network.target
After=postgresql.service

[Service]
RestartSec=2s
Type=simple
User=gitea
Group=gitea
WorkingDirectory=/var/lib/gitea/
ExecStart=/usr/local/bin/gitea web --config /etc/gitea/app.ini
Restart=always
Environment=USER=gitea HOME=/home/gitea GITEA_WORK_DIR=/var/lib/gitea

[Install]
WantedBy=multi-user.target
```

Enable and start Gitea:
```bash
systemctl daemon-reload
systemctl enable gitea
systemctl start gitea
systemctl status gitea
```

---

## Step 5: Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

Verify installation:
```bash
node --version
npm --version
```

---

## Step 6: Deploy Web Application

Create directory:
```bash
mkdir -p /var/www/deckbuilder
cd /var/www/deckbuilder
```

Upload your project files (via SCP or git):
```bash
# Option 1: Clone from git
git clone <your-repo-url> .

# Option 2: Upload via SCP from your local machine
# scp -r deckbuilder-webapp root@<container-ip>:/var/www/deckbuilder/
```

Configure environment:
```bash
cd /var/www/deckbuilder/deckbuilder-webapp

cat > .env << EOF
VITE_GITEA_URL=https://yourdomain.com
VITE_GITEA_CLIENT_ID=your_client_id_here
VITE_GITEA_CLIENT_SECRET=your_client_secret_here
VITE_REDIRECT_URI=https://yourdomain.com/auth/callback
VITE_SCRYFALL_API=https://api.scryfall.com
EOF
```

Build the application:
```bash
npm install
npm run build
```

Set permissions:
```bash
chown -R www-data:www-data /var/www/deckbuilder
```

---

## Step 7: Configure Nginx

Create Nginx configuration:
```bash
nano /etc/nginx/sites-available/deckbuilder
```

Paste:
```nginx
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

    # SSL certificates (will be added by certbot)
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

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # Serve web app (static files)
    location / {
        root /var/www/deckbuilder/deckbuilder-webapp/dist;
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

    # Optional: Gitea web UI access
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

Enable site:
```bash
ln -s /etc/nginx/sites-available/deckbuilder /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

---

## Step 8: Setup SSL Certificate

```bash
certbot --nginx -d yourdomain.com --non-interactive --agree-tos --email your@email.com
```

Test auto-renewal:
```bash
certbot renew --dry-run
```

---

## Step 9: Configure Firewall

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 2222/tcp  # Gitea SSH
ufw enable
```

---

## Step 10: Initial Gitea Setup

1. Open `https://yourdomain.com/gitea/` in browser
2. Complete initial setup (database already configured)
3. Create admin account
4. Go to Settings → Applications
5. Create OAuth2 Application:
   - Name: `DeckBuilder`
   - Redirect URI: `https://yourdomain.com/auth/callback`
6. Copy Client ID and Secret

Update web app environment:
```bash
nano /var/www/deckbuilder/deckbuilder-webapp/.env
```

Update the OAuth credentials, then rebuild:
```bash
cd /var/www/deckbuilder/deckbuilder-webapp
npm run build
systemctl restart nginx
```

---

## Backup Script

Create backup script:
```bash
nano /usr/local/bin/deckbuilder-backup.sh
```

Paste:
```bash
#!/bin/bash

BACKUP_DIR="/var/backups/deckbuilder"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup Gitea data
tar czf $BACKUP_DIR/gitea_data_$DATE.tar.gz -C /var/lib/gitea .

# Backup PostgreSQL
sudo -u postgres pg_dump gitea | gzip > $BACKUP_DIR/gitea_db_$DATE.sql.gz

# Backup Gitea config
cp /etc/gitea/app.ini $BACKUP_DIR/app.ini_$DATE

# Keep only last 7 days
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
find $BACKUP_DIR -name "app.ini_*" -mtime +7 -delete

echo "Backup completed: $DATE"
```

Make executable and schedule:
```bash
chmod +x /usr/local/bin/deckbuilder-backup.sh

# Schedule daily at 2 AM
crontab -e
# Add: 0 2 * * * /usr/local/bin/deckbuilder-backup.sh
```

---

## Update Script

Create update script:
```bash
nano /usr/local/bin/deckbuilder-update.sh
```

Paste:
```bash
#!/bin/bash

echo "Updating DeckBuilder..."

# Update web app
cd /var/www/deckbuilder/deckbuilder-webapp
git pull
npm install
npm run build

# Restart services
systemctl restart nginx

echo "Update completed!"
```

Make executable:
```bash
chmod +x /usr/local/bin/deckbuilder-update.sh
```

---

## Monitoring

### Check service status
```bash
systemctl status gitea
systemctl status postgresql
systemctl status nginx
```

### View logs
```bash
# Gitea logs
journalctl -u gitea -f

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# PostgreSQL logs
tail -f /var/log/postgresql/postgresql-14-main.log
```

### Resource usage
```bash
# Memory
free -h

# Disk
df -h

# Processes
htop
```

---

## Performance Tuning

### PostgreSQL
```bash
nano /etc/postgresql/14/main/postgresql.conf
```

For 2GB RAM container:
```
shared_buffers = 512MB
effective_cache_size = 1536MB
maintenance_work_mem = 128MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 2621kB
min_wal_size = 1GB
max_wal_size = 4GB
```

### Nginx
```bash
nano /etc/nginx/nginx.conf
```

Update worker settings:
```nginx
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
```

---

## Resource Requirements

### Minimum (10-20 users)
- 2 CPU cores
- 2GB RAM
- 20GB disk

### Recommended (50-100 users)
- 4 CPU cores
- 4GB RAM
- 50GB disk

### Heavy usage (100+ users)
- 8 CPU cores
- 8GB RAM
- 100GB disk

---

## Advantages Over Docker

1. **Performance**: ~20% better performance (no container overhead)
2. **Memory**: Uses ~500MB less RAM
3. **Simplicity**: Standard systemd services
4. **Backups**: Simple file-based backups
5. **Debugging**: Easier to troubleshoot
6. **Updates**: Standard package management

---

## Troubleshooting

### Gitea won't start
```bash
journalctl -u gitea -n 50
# Check database connection
sudo -u postgres psql -d gitea -c "SELECT 1;"
```

### Database connection errors
```bash
# Check PostgreSQL is running
systemctl status postgresql

# Test connection
sudo -u gitea psql -h 127.0.0.1 -U gitea -d gitea
```

### Nginx errors
```bash
nginx -t
tail -f /var/log/nginx/error.log
```

### Permission issues
```bash
# Fix Gitea permissions
chown -R gitea:gitea /var/lib/gitea
chmod -R 750 /var/lib/gitea

# Fix web app permissions
chown -R www-data:www-data /var/www/deckbuilder
```

---

## Security Hardening

### Fail2ban for SSH
```bash
apt install -y fail2ban

cat > /etc/fail2ban/jail.local << EOF
[sshd]
enabled = true
port = 22
maxretry = 3
bantime = 3600
EOF

systemctl restart fail2ban
```

### Automatic security updates
```bash
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

### Restrict PostgreSQL
```bash
nano /etc/postgresql/14/main/pg_hba.conf
```

Ensure only local connections:
```
local   all             all                                     peer
host    all             all             127.0.0.1/32            md5
```

---

## Complete Installation Script

See `deploy-proxmox-native.sh` for automated installation.
