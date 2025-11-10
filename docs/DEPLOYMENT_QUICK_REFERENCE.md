# Deployment Quick Reference

## Three Ways to Deploy

### Option 1: Automated from Proxmox Host (Easiest!) ⭐

**Use this if**: You want everything automated from start to finish

**Run on**: Proxmox host (not inside container)

```bash
# On Proxmox host
wget https://raw.githubusercontent.com/yourusername/deckbuilder/main/deploy-proxmox-host.sh
chmod +x deploy-proxmox-host.sh
./deploy-proxmox-host.sh
```

**What it does**:
- ✅ Creates LXC container
- ✅ Configures networking
- ✅ Installs all dependencies
- ✅ Sets up PostgreSQL, Gitea, Nginx
- ✅ Configures SSL
- ✅ Sets up backups
- ✅ Everything automated!

**Time**: ~15 minutes

---

### Option 2: Manual LXC + Native Deployment

**Use this if**: You want to create the LXC manually in Proxmox UI

**Step 1**: Create LXC in Proxmox web UI
- Template: Ubuntu 22.04
- Disk: 30GB
- RAM: 2GB
- CPU: 2 cores
- Network: Bridge with static IP
- **DO NOT enable nesting**

**Step 2**: Run deployment script inside container
```bash
# SSH into container
ssh root@<container-ip>

# Download and run
wget https://raw.githubusercontent.com/yourusername/deckbuilder/main/deploy-proxmox-native.sh
chmod +x deploy-proxmox-native.sh
./deploy-proxmox-native.sh
```

**Time**: ~10 minutes (after LXC creation)

---

### Option 3: Docker Deployment

**Use this if**: You prefer Docker or need portability

**Step 1**: Create LXC with nesting enabled

**Step 2**: Run Docker deployment
```bash
# SSH into container
ssh root@<container-ip>

# Download and run
wget https://raw.githubusercontent.com/yourusername/deckbuilder/main/deploy-proxmox.sh
chmod +x deploy-proxmox.sh
./deploy-proxmox.sh
```

**Time**: ~15 minutes

---

## Comparison

| Feature | Host Script | Native | Docker |
|---------|-------------|--------|--------|
| **Automation** | Full | Partial | Partial |
| **LXC Creation** | ✅ Yes | ❌ Manual | ❌ Manual |
| **Performance** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Complexity** | Easiest | Easy | Easy |
| **Best For** | First time | Manual control | Docker fans |

---

## After Deployment

All three options require these final steps:

### 1. Upload Project Files

**Option A**: Clone from GitHub (recommended)
```bash
pct enter <CTID>  # or ssh into container
cd /var/www/deckbuilder
git clone https://github.com/yourusername/deckbuilder.git .
```

**Option B**: Upload via SCP
```bash
# From your local machine
scp -r deckbuilder-webapp root@<container-ip>:/var/www/deckbuilder/
```

### 2. Configure Gitea OAuth

1. Open `https://yourdomain.com/gitea/`
2. Complete initial setup
3. Create admin account
4. Settings → Applications → Create OAuth2 Application
   - Name: `DeckBuilder`
   - Redirect URI: `https://yourdomain.com/auth/callback`
5. Copy Client ID and Secret

### 3. Build Web App

```bash
# Inside container
cd /var/www/deckbuilder/deckbuilder-webapp

# Create .env file
cat > .env << EOF
VITE_GITEA_URL=https://yourdomain.com
VITE_GITEA_CLIENT_ID=your_client_id_here
VITE_GITEA_CLIENT_SECRET=your_client_secret_here
VITE_REDIRECT_URI=https://yourdomain.com/auth/callback
VITE_SCRYFALL_API=https://api.scryfall.com
EOF

# Build
npm install
npm run build
```

### 4. Test

Open `https://yourdomain.com` and sign in!

---

## Troubleshooting

### Script fails on Proxmox host
```bash
# Check you're on the host
cat /etc/pve/.version

# Check container doesn't exist
pct status <CTID>
```

### Can't download template
```bash
# Update template list
pveam update

# List available templates
pveam available

# Download manually
pveam download local ubuntu-22.04-standard_22.04-1_amd64.tar.zst
```

### Container won't start
```bash
# Check logs
pct status <CTID>
journalctl -xe

# Start manually
pct start <CTID>
```

### SSL certificate fails
```bash
# Make sure DNS is pointing to your server
nslookup yourdomain.com

# Check ports are open
ufw status

# Try manual certbot
certbot --nginx -d yourdomain.com
```

### Web app won't build
```bash
# Check Node.js version
node --version  # Should be 20.x

# Clear cache
npm cache clean --force
rm -rf node_modules
npm install
```

---

## Management Commands

### Container Management (from Proxmox host)
```bash
pct enter <CTID>        # Enter container shell
pct start <CTID>        # Start container
pct stop <CTID>         # Stop container
pct restart <CTID>      # Restart container
pct status <CTID>       # Check status
pct snapshot <CTID>     # Create snapshot
```

### Service Management (inside container)
```bash
systemctl status gitea
systemctl status postgresql
systemctl status nginx

systemctl restart gitea
systemctl restart nginx

journalctl -u gitea -f  # View logs
```

### Backup Commands
```bash
# Manual backup (inside container)
/usr/local/bin/deckbuilder-backup.sh

# Proxmox backup (from host)
vzdump <CTID> --mode snapshot --compress zstd

# List backups
ls -lh /var/lib/vz/dump/
```

### Update Commands
```bash
# Update web app (inside container)
cd /var/www/deckbuilder/deckbuilder-webapp
git pull
npm install
npm run build

# Update Gitea
wget -O /usr/local/bin/gitea https://dl.gitea.com/gitea/latest/gitea-linux-amd64
systemctl restart gitea
```

---

## Resource Monitoring

### Inside Container
```bash
# Memory usage
free -h

# Disk usage
df -h

# Process list
htop

# Service status
systemctl status
```

### From Proxmox Host
```bash
# Container resources
pct status <CTID>

# Detailed stats
pct exec <CTID> -- free -h
pct exec <CTID> -- df -h
```

---

## Quick Links

- **Full Documentation**: `docs/PROXMOX_NATIVE_DEPLOYMENT.md`
- **Docker Guide**: `docs/PROXMOX_DEPLOYMENT.md`
- **Comparison**: `docs/DEPLOYMENT_COMPARISON.md`
- **Architecture**: `docs/ARCHITECTURE.md`
- **Usage Guide**: `docs/USAGE.md`

---

## Support

If you run into issues:

1. Check the logs (see commands above)
2. Review the full documentation
3. Check GitHub issues
4. Verify DNS and firewall settings
5. Ensure all services are running

Most issues are related to:
- DNS not pointing to server
- Firewall blocking ports
- OAuth redirect URI mismatch
- Missing dependencies
