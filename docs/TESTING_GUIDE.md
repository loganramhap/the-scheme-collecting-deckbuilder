# DeckBuilder Testing Guide

Complete guide to test your deployment and verify everything works.

## Step 1: Verify Container is Running

On your Proxmox host:

```bash
# Check container status
pct status <CTID>
# Should show: status: running

# Check container IP
pct exec <CTID> -- hostname -I
# Note this IP address

# View credentials file
cat /root/deckbuilder-ct<CTID>-credentials.txt
```

## Step 2: Check Services Inside Container

Enter the container:
```bash
pct enter <CTID>
```

Check all services are running:
```bash
# Check Gitea
systemctl status gitea
# Should show: active (running)

# Check PostgreSQL
systemctl status postgresql
# Should show: active (running)

# Check Nginx
systemctl status nginx
# Should show: active (running)

# Check if Gitea is responding
curl http://localhost:3000
# Should return HTML

# Exit container
exit
```

## Step 3: Upload Project Files

You need to get your project files into the container. Choose one method:

### Method A: Clone from GitHub (Recommended)

```bash
# Enter container
pct enter <CTID>

# Navigate to web directory
cd /var/www/deckbuilder

# Clone your repository
git clone https://github.com/yourusername/deckbuilder.git .

# Verify files are there
ls -la
# Should see: deckbuilder-webapp/, docs/, etc.
```

### Method B: Upload from Local Machine

```bash
# From your local machine (not in container)
# Get the container IP first
CONTAINER_IP=$(ssh root@proxmox-host "pct exec <CTID> -- hostname -I | awk '{print \$1}'")

# Upload the webapp directory
scp -r deckbuilder-webapp root@$CONTAINER_IP:/var/www/deckbuilder/

# Or use pct push from Proxmox host
pct push <CTID> /path/to/deckbuilder-webapp /var/www/deckbuilder/deckbuilder-webapp
```

## Step 4: Test Gitea Access

Open your browser and go to:
```
https://yourdomain.com/gitea/
```

Or if testing locally without domain:
```
http://<container-ip>:3000
```

You should see:
- ✅ Gitea installation page
- ✅ Database settings pre-filled
- ✅ No errors

### Complete Gitea Setup:

1. **Initial Configuration**:
   - Database Type: PostgreSQL (already set)
   - Host: 127.0.0.1:5432 (already set)
   - Username: gitea (already set)
   - Password: (already set)
   - Database Name: gitea (already set)

2. **General Settings**:
   - Site Title: DeckBuilder
   - Repository Root Path: /var/lib/gitea/data/gitea-repositories
   - Git LFS Root Path: /var/lib/gitea/data/lfs
   - Run As Username: gitea

3. **Server and Third-Party Service Settings**:
   - SSH Server Domain: yourdomain.com
   - SSH Port: 2222
   - Gitea HTTP Listen Port: 3000
   - Gitea Base URL: https://yourdomain.com/

4. **Administrator Account Settings**:
   - Create your admin account
   - Username: (your choice)
   - Password: (strong password)
   - Email: your@email.com

5. Click **Install Gitea**

## Step 5: Create OAuth Application

After Gitea is installed:

1. Sign in with your admin account
2. Click your avatar (top right) → **Settings**
3. Click **Applications** tab
4. Scroll to **Manage OAuth2 Applications**
5. Click **Create a new OAuth2 Application**
6. Fill in:
   - **Application Name**: `DeckBuilder`
   - **Redirect URI**: `https://yourdomain.com/auth/callback`
7. Click **Create Application**
8. **IMPORTANT**: Copy the **Client ID** and **Client Secret**

## Step 6: Configure and Build Web App

Back in the container:

```bash
# Enter container if not already in
pct enter <CTID>

# Navigate to web app
cd /var/www/deckbuilder/deckbuilder-webapp

# Create .env file with your OAuth credentials
cat > .env << 'EOF'
VITE_GITEA_URL=https://yourdomain.com
VITE_GITEA_CLIENT_ID=paste_your_client_id_here
VITE_GITEA_CLIENT_SECRET=paste_your_client_secret_here
VITE_REDIRECT_URI=https://yourdomain.com/auth/callback
VITE_SCRYFALL_API=https://api.scryfall.com
EOF

# Install dependencies
npm install

# Build the application
npm run build

# Verify build succeeded
ls -la dist/
# Should see: index.html, assets/, etc.

# Restart Nginx to ensure it picks up the files
systemctl restart nginx
```

## Step 7: Test Web Application

Open your browser:
```
https://yourdomain.com
```

You should see:
- ✅ DeckBuilder login page
- ✅ Dark theme interface
- ✅ "Sign in with Gitea" button
- ✅ No console errors (press F12 to check)

### Test Login Flow:

1. Click **"Sign in with Gitea"**
2. You should be redirected to Gitea
3. Click **Authorize** to allow DeckBuilder access
4. You should be redirected back to DeckBuilder
5. You should see the **Dashboard** with your username

## Step 8: Test Core Functionality

### Create a Deck Repository

1. On the Dashboard, click **"Create Deck Repo"**
2. A repository named "decks" should be created
3. You should see it in the repository list

### Create a Test Deck

1. In Gitea, go to your "decks" repository
2. Create a new file: `decks/test.deck.json`
3. Paste this content:

```json
{
  "game": "mtg",
  "format": "commander",
  "name": "Test Deck",
  "cards": [
    {
      "id": "sol-ring",
      "count": 1,
      "name": "Sol Ring"
    }
  ],
  "sideboard": [],
  "metadata": {
    "author": "testuser",
    "created": "2025-11-10",
    "description": "Test deck for validation"
  }
}
```

4. Commit the file

### Test Deck Editor

1. In DeckBuilder, click **"View Decks"** for your repository
2. You should see "test.deck.json"
3. Click **"Open Deck"**
4. You should see:
   - ✅ Deck name: "Test Deck"
   - ✅ Card list showing "1x Sol Ring"
   - ✅ Card search box
   - ✅ Validation button

### Test Card Search

1. In the deck editor, type "Lightning Bolt" in search
2. Click **Search**
3. You should see:
   - ✅ Search results from Scryfall
   - ✅ Card names and types
   - ✅ "Add" buttons

### Test Validation

1. Click **"Validate Deck"**
2. You should see validation results
3. For a Commander deck with only 1 card, it should show:
   - ❌ Error: "Commander decks must have exactly 100 cards. Current: 1"

### Test Adding Cards

1. Search for a card
2. Click **"Add"**
3. The card should appear in your decklist
4. The deck should be marked as "dirty" (unsaved changes)
5. Enter a commit message
6. Click **"Commit Changes"**
7. Changes should be saved to Gitea

## Step 9: Test Git Features

### Test Branches

1. Go to Pull Requests page
2. You should see branch management
3. Try creating a new branch (in Gitea)
4. Verify it appears in DeckBuilder

### Test Pull Requests

1. Create a branch in Gitea
2. Make changes to a deck in that branch
3. In DeckBuilder, go to Pull Requests
4. Click **"New Pull Request"**
5. Select branches and create PR
6. Verify PR appears in list

## Step 10: Verify Backups

Check that automatic backups are configured:

```bash
# Check cron job
crontab -l
# Should show: 0 2 * * * /usr/local/bin/deckbuilder-backup.sh

# Test backup script manually
/usr/local/bin/deckbuilder-backup.sh

# Check backup was created
ls -lh /var/backups/deckbuilder/
# Should see .tar.gz and .sql.gz files
```

## Troubleshooting

### Web app shows blank page

```bash
# Check Nginx logs
tail -f /var/log/nginx/error.log

# Check if files exist
ls -la /var/www/deckbuilder/deckbuilder-webapp/dist/

# Rebuild web app
cd /var/www/deckbuilder/deckbuilder-webapp
npm run build
systemctl restart nginx
```

### OAuth login fails

```bash
# Check .env file
cat /var/www/deckbuilder/deckbuilder-webapp/.env

# Verify redirect URI in Gitea matches exactly
# Should be: https://yourdomain.com/auth/callback

# Check browser console (F12) for errors
```

### Card search doesn't work

```bash
# Test Scryfall API from container
curl https://api.scryfall.com/cards/search?q=lightning

# Check browser console for CORS errors
# Check if HTTPS is working properly
```

### Services not running

```bash
# Check all services
systemctl status gitea
systemctl status postgresql
systemctl status nginx

# Restart if needed
systemctl restart gitea
systemctl restart postgresql
systemctl restart nginx

# Check logs
journalctl -u gitea -n 50
journalctl -u postgresql -n 50
```

### Can't access from outside network

```bash
# Check firewall
ufw status
# Should show: 80/tcp, 443/tcp ALLOW

# Check if ports are listening
netstat -tlnp | grep -E ':(80|443|3000)'

# Check DNS
nslookup yourdomain.com
# Should point to your server IP
```

## Performance Testing

### Test Response Times

```bash
# Test Gitea API
time curl -s http://localhost:3000/api/v1/version

# Test web app
time curl -s https://yourdomain.com

# Test database
time psql -U gitea -d gitea -c "SELECT 1;"
```

### Check Resource Usage

```bash
# Memory
free -h

# Disk
df -h

# CPU and processes
htop

# Service memory usage
systemctl status gitea | grep Memory
systemctl status postgresql | grep Memory
```

## Success Checklist

- [ ] Container is running
- [ ] All services (Gitea, PostgreSQL, Nginx) are active
- [ ] Gitea web interface accessible
- [ ] Gitea initial setup completed
- [ ] OAuth application created
- [ ] Web app files uploaded
- [ ] Web app built successfully
- [ ] Web app accessible via browser
- [ ] Login with Gitea works
- [ ] Dashboard shows user info
- [ ] Can create deck repository
- [ ] Can view decks
- [ ] Can open deck editor
- [ ] Card search works (Scryfall)
- [ ] Deck validation works
- [ ] Can add/remove cards
- [ ] Can commit changes
- [ ] Changes appear in Gitea
- [ ] Pull requests work
- [ ] Backups are configured
- [ ] SSL certificate is valid

## Next Steps After Testing

Once everything works:

1. **Create your first real deck**
2. **Invite other users** (if multi-user)
3. **Set up organizations** for shared decks
4. **Configure email notifications** (optional)
5. **Set up monitoring** (optional)
6. **Create regular backups** to external storage
7. **Document your specific setup** for your team

## Getting Help

If you encounter issues:

1. Check the logs (see troubleshooting section)
2. Review the full documentation in `docs/`
3. Verify all steps were completed
4. Check GitHub issues
5. Ensure DNS and firewall are configured correctly

Most issues are related to:
- OAuth redirect URI mismatch
- Missing .env file or wrong credentials
- Web app not built
- Firewall blocking ports
- DNS not pointing to server
