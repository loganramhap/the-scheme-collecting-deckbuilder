# Pre-Deployment Checklist - Zaunite Workshop

## ✅ Before You Deploy to Lightsail

### 1. Code Preparation

- [x] riot.txt file created (placeholder added)
- [ ] All code committed to Git
- [ ] .env.example file created (don't commit actual .env)
- [ ] Docker Compose file ready
- [ ] Frontend builds successfully (`npm run build`)

### 2. AWS Account Setup

- [ ] AWS account created
- [ ] Payment method added
- [ ] Can access Lightsail console

### 3. Domain Ready

- [ ] Domain `zauniteworkshop.com` registered
- [ ] Have access to domain registrar
- [ ] Ready to update nameservers

### 4. Information Gathered

- [ ] Know your AWS region preference
- [ ] Have SSH client ready (or will use browser SSH)
- [ ] Have Git repository URL (if using Git deployment)

---

## 🚀 Quick Start Commands

### Test Your Build Locally First

```bash
# 1. Build frontend
cd deckbuilder-webapp
npm install
npm run build

# 2. Check build output
ls -la dist/

# Should see:
# - index.html
# - assets/
# - riot.txt

# 3. Test locally (optional)
npm run preview
# Visit http://localhost:4173
```

### Commit Everything

```bash
# Make sure everything is committed
git add .
git commit -m "Prepare for Lightsail deployment"
git push origin main
```

---

## 📋 Deployment Day Checklist

### Phase 1: Create Instance (5 min)
- [ ] Log into AWS Lightsail
- [ ] Create instance (Ubuntu 22.04, $10/month)
- [ ] Create static IP
- [ ] Open ports 80, 443
- [ ] Save static IP address: `___.___.___.___ `

### Phase 2: Install Software (10 min)
- [ ] SSH into instance
- [ ] Update system (`sudo apt update && sudo apt upgrade -y`)
- [ ] Install Docker
- [ ] Install Docker Compose
- [ ] Install Nginx
- [ ] Install Certbot

### Phase 3: Deploy Code (10 min)
- [ ] Clone repository OR upload code
- [ ] Create .env file with settings
- [ ] Start Docker services
- [ ] Build frontend
- [ ] Configure Nginx
- [ ] Test: `curl http://localhost`

### Phase 4: DNS Setup (5 min)
- [ ] Create Route 53 hosted zone
- [ ] Create A record for @ (root)
- [ ] Create A record for www
- [ ] Note nameservers: 
  - `ns-___`
  - `ns-___`
  - `ns-___`
  - `ns-___`
- [ ] Update nameservers at domain registrar
- [ ] Wait for DNS propagation (test with `nslookup zauniteworkshop.com`)

### Phase 5: Enable HTTPS (2 min)
- [ ] Run Certbot: `sudo certbot --nginx -d zauniteworkshop.com -d www.zauniteworkshop.com`
- [ ] Choose redirect HTTP to HTTPS
- [ ] Test auto-renewal: `sudo certbot renew --dry-run`

### Phase 6: Verify (5 min)
- [ ] Visit https://zauniteworkshop.com
- [ ] Check HTTPS works (lock icon)
- [ ] Check riot.txt: https://zauniteworkshop.com/riot.txt
- [ ] Create test account
- [ ] Create test deck
- [ ] Save deck
- [ ] Reload page - deck still there

---

## 🔧 Configuration Files You'll Need

### .env File (Create on server)

```env
# Gitea Configuration
GITEA_URL=http://localhost:3000
GITEA_CLIENT_ID=your_oauth_client_id
GITEA_CLIENT_SECRET=your_oauth_client_secret

# Frontend Configuration
VITE_GITEA_URL=http://localhost:3000
VITE_REDIRECT_URI=https://zauniteworkshop.com/auth/callback

# Riot API (will add later)
VITE_RIOT_API_KEY=
VITE_USE_RIOT_API=false

# Domain
DOMAIN=zauniteworkshop.com
```

### Nginx Configuration

Already provided in LIGHTSAIL_DEPLOYMENT_GUIDE.md - just copy/paste!

---

## 🎯 Post-Deployment Tasks

### Immediate (Same Day)
- [ ] Test all features work
- [ ] Create your first real deck
- [ ] Share with a friend to test
- [ ] Set up automatic backups in Lightsail

### Within 1 Week
- [ ] Get Riot development API key
- [ ] Update riot.txt with dev key
- [ ] Test Riot API integration
- [ ] Apply for Riot production API key

### Within 1 Month
- [ ] Receive production API key
- [ ] Update riot.txt with production key
- [ ] Switch from CSV to Riot API
- [ ] Implement Riot Sign-On (RSO)
- [ ] Remove MTG code
- [ ] Add analytics (optional)

---

## 💰 Expected Costs

### First Month
```
Lightsail Instance         $10.00
Route 53 Hosted Zone       $ 0.50
Domain (if new)            $12.00 (one-time)
SSL Certificate            $ 0.00 (free)
───────────────────────────────
Total First Month          $22.50
```

### Ongoing Monthly
```
Lightsail Instance         $10.00
Route 53 Hosted Zone       $ 0.50
───────────────────────────────
Total Monthly              $10.50
```

---

## 🆘 Emergency Contacts

### If Something Goes Wrong

**AWS Support:**
- Console: https://console.aws.amazon.com/support/
- Free tier includes basic support

**Community Help:**
- AWS Forums: https://forums.aws.amazon.com/
- Stack Overflow: Tag with `aws-lightsail`

**Documentation:**
- Lightsail: https://lightsail.aws.amazon.com/ls/docs
- Route 53: https://docs.aws.amazon.com/route53/
- Certbot: https://certbot.eff.org/

---

## 📸 Backup Plan

### Before Making Changes

```bash
# Create snapshot in Lightsail console
# Takes 5 minutes, costs $0.05/GB/month

# Or backup manually
cd ~
tar -czf backup-$(date +%Y%m%d).tar.gz your-repo/
```

### If You Need to Rollback

```bash
# Restore from snapshot in Lightsail console
# Or restore from backup
tar -xzf backup-20240101.tar.gz
```

---

## ✨ Success Criteria

You'll know deployment is successful when:

- ✅ https://zauniteworkshop.com loads
- ✅ HTTPS works (green lock)
- ✅ No certificate warnings
- ✅ Can create account
- ✅ Can create deck
- ✅ Can save deck
- ✅ Deck persists after reload
- ✅ riot.txt is accessible
- ✅ All features work

---

## 🎉 Ready to Deploy?

1. **Review this checklist**
2. **Open LIGHTSAIL_DEPLOYMENT_GUIDE.md**
3. **Follow step-by-step**
4. **Check off items as you go**
5. **Celebrate when live!** 🚀

**Estimated Time:** 30-45 minutes
**Difficulty:** Medium
**Cost:** $10.50/month

You've got this! Let me know when you're ready to start or if you have questions.
