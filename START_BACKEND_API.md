# Starting Backend API in Container

## Quick Fix for "ERR_CONNECTION_REFUSED" Error

The error happens because the backend API isn't running. Here's how to fix it:

### Step 1: SSH/Enter Your Container

```bash
# From Proxmox host
pct enter <CTID>

# Or SSH if configured
ssh root@192.168.86.164
```

### Step 2: Check if Backend API is Running

```bash
curl http://localhost:3001/health
```

If you get "Connection refused", the API isn't running.

### Step 3: Start Backend API

```bash
cd /var/www/deckbuilder/deckbuilder-api

# Check if .env exists
cat .env

# If .env doesn't exist, create it
cat > .env << 'EOF'
PORT=3001
GITEA_URL=http://localhost:3000
GITEA_ADMIN_TOKEN=your_admin_token_here
EOF

# Get admin token from Gitea if you haven't:
# 1. Open http://192.168.86.164:3000
# 2. Login as admin
# 3. Settings → Applications → Generate New Token
# 4. Copy token and update .env

# Install dependencies (if not done)
npm install

# Start the API
npm run dev
```

### Step 4: Keep API Running in Background

The API needs to stay running. Use one of these methods:

**Option A: Use PM2 (Recommended for production)**
```bash
# Install PM2 globally
npm install -g pm2

# Start API with PM2
cd /var/www/deckbuilder/deckbuilder-api
pm2 start npm --name "deckbuilder-api" -- run dev

# Make it start on boot
pm2 startup
pm2 save
```

**Option B: Use systemd service**
```bash
# Create service file
cat > /etc/systemd/system/deckbuilder-api.service << 'EOF'
[Unit]
Description=DeckBuilder API
After=network.target gitea.service

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/deckbuilder/deckbuilder-api
ExecStart=/usr/bin/npm run dev
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
systemctl daemon-reload
systemctl enable deckbuilder-api
systemctl start deckbuilder-api

# Check status
systemctl status deckbuilder-api
```

**Option C: Use screen/tmux (Quick test)**
```bash
# Install screen
apt-get install screen

# Start in screen session
screen -S deckbuilder-api
cd /var/www/deckbuilder/deckbuilder-api
npm run dev

# Detach: Press Ctrl+A then D
# Reattach later: screen -r deckbuilder-api
```

### Step 5: Update Web App Configuration

```bash
cd /var/www/deckbuilder/deckbuilder-webapp

# Update .env to use container IP instead of localhost
cat > .env << 'EOF'
VITE_GITEA_URL=http://192.168.86.164:3000
VITE_GITEA_CLIENT_ID=your_client_id_here
VITE_GITEA_CLIENT_SECRET=your_client_secret_here
VITE_REDIRECT_URI=http://192.168.86.164/auth/callback
VITE_API_URL=http://192.168.86.164:3001/api
VITE_SCRYFALL_API=https://api.scryfall.com
EOF

# Rebuild web app
npm run build

# Restart nginx
systemctl restart nginx
```

### Step 6: Update Nginx to Proxy API Requests

Add API proxy to your nginx config:

```bash
# Edit nginx config
nano /etc/nginx/sites-available/deckbuilder

# Add this location block inside the server block:
```

```nginx
# Proxy API requests
location /api/ {
    proxy_pass http://localhost:3001/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Then update web app .env:
```bash
cd /var/www/deckbuilder/deckbuilder-webapp

# Update to use relative path (proxied through nginx)
cat > .env << 'EOF'
VITE_GITEA_URL=http://192.168.86.164:3000
VITE_GITEA_CLIENT_ID=your_client_id_here
VITE_GITEA_CLIENT_SECRET=your_client_secret_here
VITE_REDIRECT_URI=http://192.168.86.164/auth/callback
VITE_API_URL=http://192.168.86.164/api
VITE_SCRYFALL_API=https://api.scryfall.com
EOF

# Rebuild
npm run build
systemctl restart nginx
```

### Step 7: Test

```bash
# Test API directly
curl http://localhost:3001/health
# Should return: {"status":"ok"}

# Test through nginx
curl http://192.168.86.164/api/health
# Should also return: {"status":"ok"}
```

Now try signing up again in the web app!

## Troubleshooting

### API won't start
```bash
# Check logs
journalctl -u deckbuilder-api -f

# Or if using PM2
pm2 logs deckbuilder-api
```

### Port 3001 already in use
```bash
# Find what's using it
lsof -i :3001

# Kill it
kill -9 <PID>
```

### Still getting connection refused
```bash
# Check firewall
ufw status

# Allow port 3001 if needed
ufw allow 3001

# Check API is listening
netstat -tlnp | grep 3001
```

