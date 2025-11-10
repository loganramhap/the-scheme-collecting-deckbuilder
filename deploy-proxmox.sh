#!/bin/bash

# DeckBuilder Proxmox Deployment Script
# Run this inside your Proxmox LXC container

set -e

echo "=================================="
echo "DeckBuilder Proxmox Deployment"
echo "=================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root"
    exit 1
fi

# Get domain name
read -p "Enter your domain name (e.g., deckbuilder.example.com): " DOMAIN
read -p "Enter your email for SSL certificate: " EMAIL

echo ""
echo "Installing dependencies..."
apt update
apt install -y docker.io docker-compose nginx certbot python3-certbot-nginx git curl

# Enable Docker
systemctl enable docker
systemctl start docker

# Install Node.js
echo ""
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Create directory structure
echo ""
echo "Setting up directories..."
mkdir -p /opt/deckbuilder
cd /opt/deckbuilder

# Generate secure password
DB_PASSWORD=$(openssl rand -base64 32)

# Create docker-compose.yml
echo ""
echo "Creating Docker Compose configuration..."
cat > docker-compose.yml << EOF
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
      - GITEA__database__PASSWD=${DB_PASSWORD}
      - GITEA__server__ROOT_URL=https://${DOMAIN}
      - GITEA__server__DOMAIN=${DOMAIN}
      - GITEA__server__HTTP_PORT=3000
      - GITEA__security__INSTALL_LOCK=false
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
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=gitea
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  gitea-data:
  postgres-data:
EOF

# Start Gitea
echo ""
echo "Starting Gitea..."
docker-compose up -d

# Wait for Gitea to be ready
echo "Waiting for Gitea to start (30 seconds)..."
sleep 30

# Create Nginx configuration
echo ""
echo "Configuring Nginx..."
cat > /etc/nginx/sites-available/deckbuilder << EOF
server {
    listen 80;
    server_name ${DOMAIN};

    location / {
        root /opt/deckbuilder/deckbuilder-webapp/dist;
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
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/deckbuilder /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx config
nginx -t

# Restart Nginx
systemctl restart nginx

# Setup SSL
echo ""
echo "Setting up SSL certificate..."
certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos --email ${EMAIL}

# Create backup script
echo ""
echo "Creating backup script..."
cat > /opt/deckbuilder/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/deckbuilder"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

docker exec deckbuilder-gitea /bin/sh -c "cd /data && tar czf - ." > $BACKUP_DIR/gitea_$DATE.tar.gz
docker exec deckbuilder-db pg_dump -U gitea gitea | gzip > $BACKUP_DIR/db_$DATE.sql.gz

find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /opt/deckbuilder/backup.sh

# Schedule daily backups
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/deckbuilder/backup.sh") | crontab -

echo ""
echo "=================================="
echo "Deployment Complete!"
echo "=================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Open https://${DOMAIN} in your browser"
echo "2. Complete Gitea initial setup"
echo "3. Create an admin account"
echo "4. Go to Settings → Applications → Create OAuth2 Application"
echo "   - Name: DeckBuilder"
echo "   - Redirect URI: https://${DOMAIN}/auth/callback"
echo "5. Copy the Client ID and Secret"
echo ""
echo "6. Then run these commands to build the web app:"
echo ""
echo "   cd /opt/deckbuilder/deckbuilder-webapp"
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
echo "   systemctl restart nginx"
echo ""
echo "Database password saved to: /opt/deckbuilder/.db_password"
echo ""
echo "Backups scheduled daily at 2 AM"
echo "Backup location: /opt/backups/deckbuilder"
echo ""

# Save database password
echo "${DB_PASSWORD}" > /opt/deckbuilder/.db_password
chmod 600 /opt/deckbuilder/.db_password

echo "Deployment script completed successfully!"
