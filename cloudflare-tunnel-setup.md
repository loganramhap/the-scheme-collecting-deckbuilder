# Cloudflare Tunnel Setup for DeckBuilder

Expose DeckBuilder to the internet via Cloudflare Tunnel while keeping Gitea internal-only.

## Quick Setup Steps

### 1. Secure Gitea (Internal Only)
```bash
# Inside container
sed -i 's|HTTP_ADDR = .*|HTTP_ADDR = 127.0.0.1|g' /etc/gitea/app.ini
ufw delete allow 3000/tcp 2>/dev/null || true
systemctl restart gitea
```

### 2. Install Cloudflared
```bash
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
dpkg -i cloudflared-linux-amd64.deb
cloudflared tunnel login
```

### 3. Create Tunnel
```bash
cloudflared tunnel create deckbuilder
# Note the Tunnel ID shown
```

### 4. Configure Tunnel
```bash
mkdir -p ~/.cloudflared
cat > ~/.cloudflared/config.yml << 'EOF'
tunnel: deckbuilder
credentials-file: /root/.cloudflared/TUNNEL_ID.json

ingress:
  - hostname: deckbuilder.yourdomain.com
    service: http://localhost:80
  - service: http_status:404
EOF
```

### 5. Setup DNS
```bash
cloudflared tunnel route dns deckbuilder deckbuilder.yourdomain.com
```

### 6. Start Tunnel
```bash
cloudflared service install
systemctl enable cloudflared
systemctl start cloudflared
```

### 7. Update Gitea Config
```bash
nano /etc/gitea/app.ini
# Change:
# DOMAIN = deckbuilder.yourdomain.com
# ROOT_URL = https://deckbuilder.yourdomain.com/
systemctl restart gitea
```

### 8. Update Web App
```bash
cd /var/www/deckbuilder/deckbuilder-webapp
# Update .env with your domain
# VITE_GITEA_URL=https://deckbuilder.yourdomain.com
npm run build
```

### 9. Update OAuth
- Go to Gitea → Settings → Applications
- Update Redirect URI: `https://deckbuilder.yourdomain.com/auth/callback`

## Verify Security
```bash
# Gitea should only be on localhost
netstat -tlnp | grep :3000
# Should show: 127.0.0.1:3000

# Test it's not accessible externally
# From outside: http://your-ip:3000 should NOT work
# From inside: curl http://localhost:3000 should work
```

## Benefits
- No port forwarding needed
- Free SSL from Cloudflare
- DDoS protection
- Gitea stays private
- Your IP stays hidden
