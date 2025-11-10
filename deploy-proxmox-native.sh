#!/bin/bash

# DeckBuilder Native Proxmox Deployment (No Docker)
# Run this inside your Proxmox LXC container as root

set -e

echo "========================================="
echo "DeckBuilder Native Deployment (No Docker)"
echo "========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root"
    exit 1
fi

# Get configuration
read -p "Enter your domain name (e.g., deckbuilder.example.com): " DOMAIN
read -p "Enter your email for SSL certificate: " EMAIL
read -sp "Enter a secure database password: " DB_PASSWORD
echo ""

# Generate secure keys
SECRET_KEY=$(openssl rand -base64 32)
INTERNAL_TOKEN=$(openssl rand -base64 32)

echo ""
echo "Step 1: Installing dependencies..."
apt update
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

echo ""
echo "Step 2: Setting up PostgreSQL..."
sudo -u postgres psql << EOF
CREATE USER gitea WITH PASSWORD '${DB_PASSWORD}';
CREATE DATABASE gitea OWNER gitea;
GRANT ALL PRIVILEGES ON DATABASE gitea TO gitea;
EOF

# Optimize PostgreSQL
cat >> /etc/postgresql/14/main/postgresql.conf << EOF

# DeckBuilder optimizations
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
EOF

systemctl restart postgresql

echo ""
echo "Step 3: Installing Gitea..."

# Create gitea user
adduser --system --group --disabled-password --shell /bin/bash --home /home/gitea gitea

# Download Gitea
GITEA_VERSION="1.21.0"
wget -O /usr/local/bin/gitea https://dl.gitea.com/gitea/${GITEA_VERSION}/gitea-${GITEA_VERSION}-linux-amd64
chmod +x /usr/local/bin/gitea

# Create directories
mkdir -p /var/lib/gitea/{custom,data,log}
chown -R gitea:gitea /var/lib/gitea/
chmod -R 750 /var/lib/gitea/

mkdir /etc/gitea
chown root:gitea /etc/gitea
chmod 770 /etc/gitea

# Create Gitea config
cat > /etc/gitea/app.ini << EOF
APP_NAME = DeckBuilder
RUN_MODE = prod
RUN_USER = gitea

[server]
PROTOCOL = http
DOMAIN = ${DOMAIN}
ROOT_URL = https://${DOMAIN}/
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
PASSWD = ${DB_PASSWORD}
SSL_MODE = disable
CHARSET = utf8

[repository]
ROOT = /var/lib/gitea/data/gitea-repositories
DEFAULT_BRANCH = main

[security]
INSTALL_LOCK = false
SECRET_KEY = ${SECRET_KEY}
INTERNAL_TOKEN = ${INTERNAL_TOKEN}

[service]
DISABLE_REGISTRATION = false
REQUIRE_SIGNIN_VIEW = false
REGISTER_EMAIL_CONFIRM = false
ENABLE_NOTIFY_MAIL = false
DEFAULT_KEEP_EMAIL_PRIVATE = false
DEFAULT_ALLOW_CREATE_ORGANIZATION = true
NO_REPLY_ADDRESS = noreply.${DOMAIN}

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
EOF

# Create systemd service
cat > /etc/systemd/system/gitea.service << EOF
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
EOF

# Start Gitea
systemctl daemon-reload
systemctl enable gitea
systemctl start gitea

echo ""
echo "Step 4: Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo ""
echo "Step 5: Setting up web application directory..."
mkdir -p /var/www/deckbuilder

echo ""
echo "Step 6: Configuring Nginx..."

# Create Nginx config
cat > /etc/nginx/sites-available/deckbuilder << 'NGINXEOF'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER;

    location / {
        root /var/www/deckbuilder/deckbuilder-webapp/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api/v1/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50M;
    }

    location /login/oauth/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /user/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /gitea/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50M;
    }
}
NGINXEOF

# Replace domain placeholder
sed -i "s/DOMAIN_PLACEHOLDER/${DOMAIN}/g" /etc/nginx/sites-available/deckbuilder

# Enable site
ln -sf /etc/nginx/sites-available/deckbuilder /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl restart nginx

echo ""
echo "Step 7: Setting up SSL..."
certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos --email ${EMAIL}

echo ""
echo "Step 8: Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 2222/tcp
ufw --force enable

echo ""
echo "Step 9: Creating backup script..."
cat > /usr/local/bin/deckbuilder-backup.sh << 'BACKUPEOF'
#!/bin/bash
BACKUP_DIR="/var/backups/deckbuilder"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

tar czf $BACKUP_DIR/gitea_data_$DATE.tar.gz -C /var/lib/gitea .
sudo -u postgres pg_dump gitea | gzip > $BACKUP_DIR/gitea_db_$DATE.sql.gz
cp /etc/gitea/app.ini $BACKUP_DIR/app.ini_$DATE

find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
find $BACKUP_DIR -name "app.ini_*" -mtime +7 -delete

echo "Backup completed: $DATE"
BACKUPEOF

chmod +x /usr/local/bin/deckbuilder-backup.sh

# Schedule daily backups
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/deckbuilder-backup.sh") | crontab -

echo ""
echo "Step 10: Creating update script..."
cat > /usr/local/bin/deckbuilder-update.sh << 'UPDATEEOF'
#!/bin/bash
echo "Updating DeckBuilder..."
cd /var/www/deckbuilder/deckbuilder-webapp
git pull
npm install
npm run build
systemctl restart nginx
echo "Update completed!"
UPDATEEOF

chmod +x /usr/local/bin/deckbuilder-update.sh

# Save credentials
cat > /root/deckbuilder-credentials.txt << EOF
DeckBuilder Installation Credentials
====================================

Database Password: ${DB_PASSWORD}
Secret Key: ${SECRET_KEY}
Internal Token: ${INTERNAL_TOKEN}

Domain: ${DOMAIN}
Email: ${EMAIL}

Gitea URL: https://${DOMAIN}/gitea/
Web App URL: https://${DOMAIN}/

KEEP THIS FILE SECURE!
EOF

chmod 600 /root/deckbuilder-credentials.txt

echo ""
echo "========================================="
echo "Installation Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Upload your project files to /var/www/deckbuilder/"
echo "   Example: scp -r deckbuilder-webapp root@${DOMAIN}:/var/www/deckbuilder/"
echo ""
echo "2. Open https://${DOMAIN}/gitea/ in your browser"
echo "3. Complete Gitea initial setup (database already configured)"
echo "4. Create an admin account"
echo "5. Go to Settings → Applications → Create OAuth2 Application"
echo "   - Name: DeckBuilder"
echo "   - Redirect URI: https://${DOMAIN}/auth/callback"
echo "6. Copy the Client ID and Secret"
echo ""
echo "7. Build the web app:"
echo "   cd /var/www/deckbuilder/deckbuilder-webapp"
echo "   cat > .env << ENVEOF"
echo "   VITE_GITEA_URL=https://${DOMAIN}"
echo "   VITE_GITEA_CLIENT_ID=your_client_id_here"
echo "   VITE_GITEA_CLIENT_SECRET=your_client_secret_here"
echo "   VITE_REDIRECT_URI=https://${DOMAIN}/auth/callback"
echo "   VITE_SCRYFALL_API=https://api.scryfall.com"
echo "   ENVEOF"
echo ""
echo "   npm install"
echo "   npm run build"
echo ""
echo "Services:"
echo "  - Gitea: systemctl status gitea"
echo "  - PostgreSQL: systemctl status postgresql"
echo "  - Nginx: systemctl status nginx"
echo ""
echo "Backups:"
echo "  - Script: /usr/local/bin/deckbuilder-backup.sh"
echo "  - Location: /var/backups/deckbuilder"
echo "  - Schedule: Daily at 2 AM"
echo ""
echo "Updates:"
echo "  - Script: /usr/local/bin/deckbuilder-update.sh"
echo ""
echo "Credentials saved to: /root/deckbuilder-credentials.txt"
echo ""
echo "Installation completed successfully!"
