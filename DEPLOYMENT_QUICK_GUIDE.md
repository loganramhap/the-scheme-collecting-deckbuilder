# Quick Deployment Guide

## One-Command Deployment

After pushing changes to GitHub, deploy to Lightsail with one command:

```bash
# SSH into Lightsail
ssh ubuntu@44.222.23.218

# Navigate to project
cd ~/the-scheme-collecting-deckbuilder

# Run deployment script
./deploy.sh
```

That's it! The script will:
1. ✅ Pull latest changes from GitHub
2. ✅ Install backend dependencies
3. ✅ Install frontend dependencies
4. ✅ Build the frontend
5. ✅ Fix file permissions
6. ✅ Restart services
7. ✅ Reload Nginx

---

## Manual Deployment Steps

If you prefer to run steps manually:

```bash
# 1. Pull changes
git pull

# 2. Backend
cd deckbuilder-api
npm install
cd ..

# 3. Frontend
cd deckbuilder-webapp
npm install
npm run build
cd ..

# 4. Fix permissions
chmod 755 /home/ubuntu
chmod 755 /home/ubuntu/the-scheme-collecting-deckbuilder
chmod 755 /home/ubuntu/the-scheme-collecting-deckbuilder/deckbuilder-webapp
chmod -R 755 /home/ubuntu/the-scheme-collecting-deckbuilder/deckbuilder-webapp/dist

# 5. Restart services
docker-compose restart  # If using Docker
sudo systemctl reload nginx
```

---

## First Time Setup

Make the deployment script executable:

```bash
chmod +x deploy.sh
```

---

## Troubleshooting

### Git Pull Conflicts

If you get merge conflicts:

```bash
# Stash local changes
git stash

# Pull
git pull

# Reapply changes (if needed)
git stash pop
```

### Build Errors

Check for TypeScript errors:

```bash
cd deckbuilder-webapp
npm run build
```

### Permission Errors

If Nginx shows 500 errors:

```bash
chmod -R 755 ~/the-scheme-collecting-deckbuilder/deckbuilder-webapp/dist
sudo systemctl restart nginx
```

### Service Not Starting

Check Docker logs:

```bash
docker-compose logs -f
```

Check Nginx logs:

```bash
sudo tail -50 /var/log/nginx/error.log
```

---

## Quick Commands

```bash
# View site
https://zauniteworkshop.com

# Check Nginx status
sudo systemctl status nginx

# Check Docker services
docker-compose ps

# View Nginx logs
sudo tail -f /var/log/nginx/access.log

# Restart everything
docker-compose restart && sudo systemctl reload nginx
```

---

## Rollback

If deployment breaks something:

```bash
# Go back to previous commit
git log --oneline  # Find commit hash
git checkout <previous-commit-hash>

# Rebuild
./deploy.sh
```

---

## Environment Variables

If you need to update environment variables:

```bash
# Edit .env files
nano deckbuilder-webapp/.env
nano deckbuilder-api/.env

# Then redeploy
./deploy.sh
```
