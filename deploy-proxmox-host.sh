#!/bin/bash

# DeckBuilder Proxmox Host Deployment Script
# Run this on your Proxmox HOST (not inside a container)
# This will create the LXC container and deploy everything automatically

set -e

echo "============================================"
echo "DeckBuilder Proxmox Complete Deployment"
echo "============================================"
echo ""
echo "This script will:"
echo "  1. Create a new LXC container"
echo "  2. Install all dependencies"
echo "  3. Deploy DeckBuilder"
echo ""

# Check if running on Proxmox host
if [ ! -f /etc/pve/.version ]; then
    echo "ERROR: This script must be run on a Proxmox host"
    echo "If you're already in an LXC container, use deploy-proxmox-native.sh instead"
    exit 1
fi

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root"
    exit 1
fi

# Get configuration
echo "=== Container Configuration ==="
read -p "Container ID (e.g., 100): " CTID
read -p "Container hostname (e.g., deckbuilder): " HOSTNAME
read -p "Container password: " -s CT_PASSWORD
echo ""
read -p "Storage for container (e.g., local-lvm): " STORAGE
read -p "Container disk size in GB (default: 30): " DISK_SIZE
DISK_SIZE=${DISK_SIZE:-30}
read -p "Container RAM in MB (default: 2048): " MEMORY
MEMORY=${MEMORY:-2048}
read -p "Container CPU cores (default: 2): " CORES
CORES=${CORES:-2}

echo ""
echo "=== Network Configuration ==="
read -p "Network bridge (default: vmbr0): " BRIDGE
BRIDGE=${BRIDGE:-vmbr0}
read -p "IP address (e.g., 192.168.1.100/24): " IP_ADDRESS
read -p "Gateway (e.g., 192.168.1.1): " GATEWAY
read -p "DNS server (default: 8.8.8.8): " NAMESERVER
NAMESERVER=${NAMESERVER:-8.8.8.8}

echo ""
echo "=== Application Configuration ==="
read -p "Domain name (e.g., deckbuilder.example.com): " DOMAIN
read -p "Email for SSL certificate: " EMAIL
read -sp "Database password: " DB_PASSWORD
echo ""

# Check if container ID already exists
if pct status $CTID &>/dev/null; then
    echo "ERROR: Container $CTID already exists"
    exit 1
fi

echo ""
echo "=== Summary ==="
echo "Container ID: $CTID"
echo "Hostname: $HOSTNAME"
echo "Storage: $STORAGE"
echo "Disk: ${DISK_SIZE}GB"
echo "RAM: ${MEMORY}MB"
echo "CPU: ${CORES} cores"
echo "IP: $IP_ADDRESS"
echo "Gateway: $GATEWAY"
echo "Domain: $DOMAIN"
echo ""
read -p "Continue with installation? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Installation cancelled"
    exit 0
fi

echo ""
echo "Step 1: Downloading Ubuntu template..."
# Check if template exists, download if not
TEMPLATE="ubuntu-22.04-standard_22.04-1_amd64.tar.zst"
if [ ! -f "/var/lib/vz/template/cache/$TEMPLATE" ]; then
    pveam update
    pveam download local $TEMPLATE
fi

echo ""
echo "Step 2: Creating LXC container..."
pct create $CTID \
    /var/lib/vz/template/cache/$TEMPLATE \
    --hostname $HOSTNAME \
    --password "$CT_PASSWORD" \
    --storage $STORAGE \
    --rootfs $STORAGE:${DISK_SIZE} \
    --memory $MEMORY \
    --cores $CORES \
    --net0 name=eth0,bridge=$BRIDGE,ip=$IP_ADDRESS,gw=$GATEWAY \
    --nameserver $NAMESERVER \
    --features nesting=0 \
    --unprivileged 1 \
    --onboot 1 \
    --start 1

echo "Waiting for container to start..."
sleep 10

# Wait for container to be fully ready
echo "Waiting for container network..."
for i in {1..30}; do
    if pct exec $CTID -- ping -c 1 8.8.8.8 &>/dev/null; then
        break
    fi
    sleep 2
done

echo ""
echo "Step 3: Updating container..."
pct exec $CTID -- bash -c "apt update && apt upgrade -y"

echo ""
echo "Step 4: Installing dependencies..."
pct exec $CTID -- bash -c "apt install -y \
    postgresql \
    postgresql-contrib \
    nginx \
    certbot \
    python3-certbot-nginx \
    git \
    curl \
    wget \
    sudo \
    ufw \
    gnupg"

echo ""
echo "Step 5: Setting up PostgreSQL..."
pct exec $CTID -- bash -c "sudo -u postgres psql << 'SQLEOF'
CREATE USER gitea WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE gitea OWNER gitea;
GRANT ALL PRIVILEGES ON DATABASE gitea TO gitea;
SQLEOF"

# Optimize PostgreSQL
pct exec $CTID -- bash -c "cat >> /etc/postgresql/14/main/postgresql.conf << 'PGEOF'

# DeckBuilder optimizations
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
PGEOF"

pct exec $CTID -- systemctl restart postgresql

echo ""
echo "Step 6: Installing Gitea..."

# Create gitea user
pct exec $CTID -- adduser --system --group --disabled-password --shell /bin/bash --home /home/gitea gitea

# Download Gitea
GITEA_VERSION="1.21.0"
pct exec $CTID -- bash -c "wget -O /usr/local/bin/gitea https://dl.gitea.com/gitea/${GITEA_VERSION}/gitea-${GITEA_VERSION}-linux-amd64"
pct exec $CTID -- chmod +x /usr/local/bin/gitea

# Create directories
pct exec $CTID -- bash -c "mkdir -p /var/lib/gitea/{custom,data,log}"
pct exec $CTID -- bash -c "chown -R gitea:gitea /var/lib/gitea/"
pct exec $CTID -- bash -c "chmod -R 750 /var/lib/gitea/"
pct exec $CTID -- bash -c "mkdir /etc/gitea"
pct exec $CTID -- bash -c "chown root:gitea /etc/gitea"
pct exec $CTID -- bash -c "chmod 770 /etc/gitea"

# Generate secure keys
SECRET_KEY=$(openssl rand -base64 32)
INTERNAL_TOKEN=$(openssl rand -base64 32)

# Create Gitea config
pct exec $CTID -- bash -c "cat > /etc/gitea/app.ini << 'GITEAEOF'
APP_NAME = DeckBuilder
RUN_MODE = prod
RUN_USER = gitea

[server]
PROTOCOL = http
DOMAIN = $DOMAIN
ROOT_URL = https://$DOMAIN/
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
PASSWD = $DB_PASSWORD
SSL_MODE = disable
CHARSET = utf8

[repository]
ROOT = /var/lib/gitea/data/gitea-repositories
DEFAULT_BRANCH = main

[security]
INSTALL_LOCK = false
SECRET_KEY = $SECRET_KEY
INTERNAL_TOKEN = $INTERNAL_TOKEN

[service]
DISABLE_REGISTRATION = false
REQUIRE_SIGNIN_VIEW = false
REGISTER_EMAIL_CONFIRM = false
ENABLE_NOTIFY_MAIL = false
DEFAULT_KEEP_EMAIL_PRIVATE = false
DEFAULT_ALLOW_CREATE_ORGANIZATION = true
NO_REPLY_ADDRESS = noreply.$DOMAIN

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
GITEAEOF"

# Create systemd service
pct exec $CTID -- bash -c "cat > /etc/systemd/system/gitea.service << 'SERVICEEOF'
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
SERVICEEOF"

# Start Gitea
pct exec $CTID -- systemctl daemon-reload
pct exec $CTID -- systemctl enable gitea
pct exec $CTID -- systemctl start gitea

echo ""
echo "Step 7: Installing Node.js..."
pct exec $CTID -- bash -c "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -"
pct exec $CTID -- apt install -y nodejs

echo ""
echo "Step 8: Setting up web application directory..."
pct exec $CTID -- mkdir -p /var/www/deckbuilder

echo ""
echo "Step 9: Configuring Nginx..."
pct exec $CTID -- bash -c "cat > /etc/nginx/sites-available/deckbuilder << 'NGINXEOF'
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        root /var/www/deckbuilder/deckbuilder-webapp/dist;
        try_files \$uri \$uri/ /index.html;
    }

    location /api/v1/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        client_max_body_size 50M;
    }

    location /login/oauth/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /user/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /gitea/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        client_max_body_size 50M;
    }
}
NGINXEOF"

pct exec $CTID -- ln -sf /etc/nginx/sites-available/deckbuilder /etc/nginx/sites-enabled/
pct exec $CTID -- rm -f /etc/nginx/sites-enabled/default
pct exec $CTID -- nginx -t
pct exec $CTID -- systemctl restart nginx

echo ""
echo "Step 10: Setting up SSL..."
pct exec $CTID -- certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $EMAIL

echo ""
echo "Step 11: Configuring firewall..."
pct exec $CTID -- ufw allow 22/tcp
pct exec $CTID -- ufw allow 80/tcp
pct exec $CTID -- ufw allow 443/tcp
pct exec $CTID -- ufw allow 2222/tcp
pct exec $CTID -- bash -c "echo 'y' | ufw enable"

echo ""
echo "Step 12: Creating backup script..."
pct exec $CTID -- bash -c "cat > /usr/local/bin/deckbuilder-backup.sh << 'BACKUPEOF'
#!/bin/bash
BACKUP_DIR=\"/var/backups/deckbuilder\"
DATE=\$(date +%Y%m%d_%H%M%S)

mkdir -p \$BACKUP_DIR

tar czf \$BACKUP_DIR/gitea_data_\$DATE.tar.gz -C /var/lib/gitea .
sudo -u postgres pg_dump gitea | gzip > \$BACKUP_DIR/gitea_db_\$DATE.sql.gz
cp /etc/gitea/app.ini \$BACKUP_DIR/app.ini_\$DATE

find \$BACKUP_DIR -name \"*.gz\" -mtime +7 -delete
find \$BACKUP_DIR -name \"app.ini_*\" -mtime +7 -delete

echo \"Backup completed: \$DATE\"
BACKUPEOF"

pct exec $CTID -- chmod +x /usr/local/bin/deckbuilder-backup.sh
pct exec $CTID -- bash -c "(crontab -l 2>/dev/null; echo '0 2 * * * /usr/local/bin/deckbuilder-backup.sh') | crontab -"

# Save credentials on host
CREDS_FILE="/root/deckbuilder-ct${CTID}-credentials.txt"
cat > $CREDS_FILE << EOF
DeckBuilder Container $CTID Credentials
========================================

Container ID: $CTID
Hostname: $HOSTNAME
IP Address: $IP_ADDRESS
Container Password: $CT_PASSWORD

Database Password: $DB_PASSWORD
Secret Key: $SECRET_KEY
Internal Token: $INTERNAL_TOKEN

Domain: $DOMAIN
Email: $EMAIL

Gitea URL: https://$DOMAIN/gitea/
Web App URL: https://$DOMAIN/

SSH into container: pct enter $CTID
                    or: ssh root@$IP_ADDRESS

KEEP THIS FILE SECURE!
EOF

chmod 600 $CREDS_FILE

echo ""
echo "============================================"
echo "Installation Complete!"
echo "============================================"
echo ""
echo "Container $CTID has been created and configured!"
echo ""
echo "Next steps:"
echo ""
echo "1. Upload your project files to the container:"
echo "   pct push $CTID /path/to/deckbuilder-webapp /var/www/deckbuilder/deckbuilder-webapp"
echo ""
echo "   Or SSH into container and clone from git:"
echo "   pct enter $CTID"
echo "   cd /var/www/deckbuilder"
echo "   git clone https://github.com/yourusername/deckbuilder.git ."
echo ""
echo "2. Open https://$DOMAIN/gitea/ in your browser"
echo "3. Complete Gitea initial setup (database already configured)"
echo "4. Create an admin account"
echo "5. Go to Settings → Applications → Create OAuth2 Application"
echo "   - Name: DeckBuilder"
echo "   - Redirect URI: https://$DOMAIN/auth/callback"
echo "6. Copy the Client ID and Secret"
echo ""
echo "7. Build the web app (inside container):"
echo "   pct enter $CTID"
echo "   cd /var/www/deckbuilder/deckbuilder-webapp"
echo "   cat > .env << ENVEOF"
echo "   VITE_GITEA_URL=https://$DOMAIN"
echo "   VITE_GITEA_CLIENT_ID=your_client_id_here"
echo "   VITE_GITEA_CLIENT_SECRET=your_client_secret_here"
echo "   VITE_REDIRECT_URI=https://$DOMAIN/auth/callback"
echo "   VITE_SCRYFALL_API=https://api.scryfall.com"
echo "   ENVEOF"
echo ""
echo "   npm install"
echo "   npm run build"
echo ""
echo "Container Management:"
echo "  - Enter container: pct enter $CTID"
echo "  - Start container: pct start $CTID"
echo "  - Stop container: pct stop $CTID"
echo "  - Container status: pct status $CTID"
echo ""
echo "Services (inside container):"
echo "  - Gitea: systemctl status gitea"
echo "  - PostgreSQL: systemctl status postgresql"
echo "  - Nginx: systemctl status nginx"
echo ""
echo "Backups:"
echo "  - Automatic daily backups at 2 AM"
echo "  - Location: /var/backups/deckbuilder (inside container)"
echo "  - Proxmox snapshots: vzdump $CTID"
echo ""
echo "Credentials saved to: $CREDS_FILE"
echo ""
echo "Installation completed successfully!"
