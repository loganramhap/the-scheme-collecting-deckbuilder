# 🚀 Start Here - Testing Your DeckBuilder Deployment

Quick checklist to get your DeckBuilder up and running.

## ✅ Pre-Flight Checklist

Before you start, make sure you have:
- [ ] Proxmox container deployed (via `deploy-proxmox-host.sh`)
- [ ] Container is running
- [ ] You have the container IP address
- [ ] You have a domain name (for Cloudflare Tunnel)

---

## 📋 Step-by-Step Testing Guide

### Step 1: Verify Container (2 minutes)

```bash
# On Proxmox host
pct status <CTID>
# Should show: running

# Get container IP
pct exec <CTID> -- hostname -I

# View credentials
cat /root/deckbuilder-ct<CTID>-credentials.txt
```

---

### Step 2: Check Services (2 minutes)

```bash
# Enter container
pct enter <CTID>

# Check all services
systemctl status gitea
systemctl status postgresql
systemctl status nginx

# All should show: active (running)
```

---

### Step 3: Fix Gitea Permissions (1 minute)

```bash
# Still inside container
chown gitea:gitea /etc/gitea
chmod 770 /etc/gitea
chown gitea:gitea /etc/gitea/app.ini
chmod 660 /etc/gitea/app.ini
systemctl restart gitea
```

---

### Step 4: Access Gitea (5 minutes)

**Option A: Direct access (for testing)**
```
http://<container-ip>:3000
```

**Option B: Through Nginx**
```
http://<container-ip>/gitea/
```

**Complete Gitea Setup:**
1. Fill in admin account details
2. Click "Install Gitea"
3. Sign in with your admin account

---

### Step 5: Create OAuth Application (2 minutes)

In Gitea:
1. Click your avatar → **Settings**
2. **Applications** tab
3. **Create a new OAuth2 Application**
4. Name: `DeckBuilder`
5. Redirect URI: `http://<container-ip>/auth/callback` (for now)
6. **Copy Client ID and Secret** ← Important!

---

### Step 6: Upload Project Files (5 minutes)

```bash
# Inside container
cd /var/www/deckbuilder

# Clone from GitHub
git clone https://github.com/yourusername/deckbuilder.git .

# Verify files
ls -la
# Should see: deckbuilder-webapp/, docs/, etc.
```

---

### Step 7: Setup Backend API (3 minutes) - NEW!

**Required for account creation feature:**

```bash
# Inside container
cd /var/www/deckbuilder/deckbuilder-api

# Create .env
cat > .env << EOF
PORT=3001
GITEA_URL=http://localhost:3000
GITEA_ADMIN_TOKEN=paste_your_admin_token_here
EOF

# Get admin token from Gitea:
# Settings → Applications → Generate New Token → Select all permissions

# Install and start
npm install
npm run dev &
```

### Step 7.5: Build Web App (5 minutes)

```bash
# Inside container
cd /var/www/deckbuilder/deckbuilder-webapp

# Create .env with your OAuth credentials AND API URL
cat > .env << EOF
VITE_GITEA_URL=http://<container-ip>
VITE_GITEA_CLIENT_ID=paste_your_client_id_here
VITE_GITEA_CLIENT_SECRET=paste_your_client_secret_here
VITE_REDIRECT_URI=http://<container-ip>/auth/callback
VITE_API_URL=http://localhost:3001/api
VITE_SCRYFALL_API=https://api.scryfall.com
EOF

# Install and build
npm install
npm run build

# Should see: dist/ folder created
ls -la dist/
```

---

### Step 8: Test Web App (2 minutes)

Open browser:
```
http://<container-ip>
```

You should see:
- ✅ DeckBuilder login page
- ✅ Dark theme
- ✅ "Sign in with Gitea" button
- ✅ "Don't have an account? Sign up" link

**Test Account Creation (New!):**
1. Click "Don't have an account? Sign up"
2. Fill in username, email, password
3. Click "Create Account"
4. Should automatically log in!
5. Should see Dashboard with your username

**Or Test OAuth Login:**
1. Click "Sign in with Gitea"
2. Should redirect to Gitea
3. Click "Authorize"
4. Should redirect back to Dashboard
5. Should see your username!

**Note**: Account creation requires the backend API to be running (see Step 7.5 below).

---

### Step 9: Test Basic Features (5 minutes)

**Create Deck Repository:**
1. Click "Create Deck Repo"
2. Should create "decks" repository

**Create Test Deck:**
1. In Gitea, go to your "decks" repo
2. Create file: `decks/test.deck.json`
3. Paste this:
```json
{
  "game": "mtg",
  "format": "commander",
  "name": "Test Deck",
  "cards": [
    {"id": "sol-ring", "count": 1, "name": "Sol Ring"}
  ],
  "sideboard": [],
  "metadata": {
    "author": "testuser",
    "created": "2025-11-10"
  }
}
```
4. Commit the file

**Test Deck Editor:**
1. In DeckBuilder, click "View Decks"
2. Click "Open Deck" on test.deck.json
3. Should see deck editor with Sol Ring

**Test Card Search:**
1. Type "Lightning Bolt" in search
2. Click Search
3. Should see results from Scryfall
4. Click "Add" on a card
5. Should appear in your deck

**Test Validation:**
1. Click "Validate Deck"
2. Should show error (only 1 card, needs 100 for Commander)

**Test Commit:**
1. Enter commit message
2. Click "Commit Changes"
3. Check Gitea - should see new commit!

---

### Step 10: Setup Cloudflare Tunnel (10 minutes)

**Only do this when ready to go public!**

See: `cloudflare-tunnel-setup.md`

Quick steps:
1. Lock down Gitea to localhost only
2. Install cloudflared
3. Create tunnel
4. Update domain in configs
5. Rebuild web app
6. Update OAuth redirect URI

---

## 🎯 Success Criteria

You're ready to use DeckBuilder when:

- [ ] Container is running
- [ ] All services active (Gitea, PostgreSQL, Nginx)
- [ ] Gitea setup completed
- [ ] OAuth application created
- [ ] Web app built successfully
- [ ] Can access web app in browser
- [ ] Can sign in with Gitea
- [ ] Dashboard shows your username
- [ ] Can create deck repository
- [ ] Can view and edit decks
- [ ] Card search works (Scryfall)
- [ ] Can commit changes
- [ ] Changes appear in Gitea

---

## 🐛 Quick Troubleshooting

### Web app shows blank page
```bash
cd /var/www/deckbuilder/deckbuilder-webapp
npm run build
systemctl restart nginx
```

### OAuth login fails
- Check .env file has correct Client ID/Secret
- Verify redirect URI matches in Gitea OAuth app
- Check browser console (F12) for errors

### Card search doesn't work
- Check browser console for errors
- Verify internet connection from container
- Test: `curl https://api.scryfall.com/cards/search?q=lightning`

### Gitea assets not loading
```bash
# Access directly on port 3000 instead
http://<container-ip>:3000
```

---

## 📚 Full Documentation

- **Complete Testing Guide**: `docs/TESTING_GUIDE.md`
- **Cloudflare Tunnel**: `cloudflare-tunnel-setup.md`
- **Usage Guide**: `docs/USAGE.md`
- **Architecture**: `docs/ARCHITECTURE.md`
- **API Reference**: `docs/API.md`

---

## 🎉 Next Steps After Testing

Once everything works:

1. **Set up Cloudflare Tunnel** for public access
2. **Create your first real deck**
3. **Invite other users** (if multi-user)
4. **Set up regular backups**
5. **Configure monitoring** (optional)

---

## 💡 Tips

- **Use port 3000 directly** if Nginx proxy has issues
- **Check logs** when things don't work: `journalctl -u gitea -f`
- **Rebuild web app** after any .env changes
- **Clear browser cache** if OAuth acts weird
- **Test locally first** before setting up Cloudflare Tunnel

---

## 🆘 Need Help?

1. Check `docs/TESTING_GUIDE.md` for detailed troubleshooting
2. Review logs: `journalctl -u gitea -f`
3. Check Nginx logs: `tail -f /var/log/nginx/error.log`
4. Verify all services running: `systemctl status gitea postgresql nginx`

---

## ⏱️ Time Estimate

- Initial setup: ~30 minutes
- Testing basic features: ~15 minutes
- Cloudflare Tunnel setup: ~10 minutes
- **Total**: ~1 hour to fully deployed and tested

Good luck! 🚀
