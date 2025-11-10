# Account Creation Setup - Quick Reference

## ✅ What Was Fixed

Account creation now works! Users can sign up directly through the web interface.

## 🚀 Quick Setup (3 Steps)

### 1. Get Gitea Admin Token

1. Open Gitea: http://localhost:3000
2. Log in as admin
3. Settings → Applications → Generate New Token
4. Name: "DeckBuilder API"
5. Select all permissions
6. **Copy the token**

### 2. Configure Backend API

```bash
cd deckbuilder-api
npm install
cp .env.example .env
```

Edit `.env`:
```env
GITEA_ADMIN_TOKEN=paste_your_token_here
GITEA_URL=http://localhost:3000
PORT=3001
```

Start it:
```bash
npm run dev
```

### 3. Configure Web App

```bash
cd deckbuilder-webapp
```

Edit `.env` and add:
```env
VITE_API_URL=http://localhost:3001/api
```

Restart web app:
```bash
npm run dev
```

## ✨ Test It

1. Open http://localhost:5173
2. Click "Don't have an account? Sign up"
3. Fill in username, email, password
4. Click "Create Account"
5. ✅ You're logged in!

## 🔧 Troubleshooting

### "Sign up failed"
- Backend API not running → Start it: `cd deckbuilder-api && npm run dev`
- Check it's working: `curl http://localhost:3001/health`

### "Admin token not configured"
- Add `GITEA_ADMIN_TOKEN` to `deckbuilder-api/.env`
- Restart backend API

### "Username already exists"
- Choose a different username

### Network errors
- Verify `VITE_API_URL=http://localhost:3001/api` in web app `.env`
- Restart web app after changing `.env`

## 📚 Full Documentation

- **Setup Guide**: `docs/SETUP.md`
- **Troubleshooting**: `docs/ACCOUNT_CREATION_TROUBLESHOOTING.md`
- **Technical Details**: `ACCOUNT_CREATION_FIX.md`

## 🎯 What You Need Running

For full functionality, run all 3:

1. **Gitea** (Docker): `docker-compose up -d`
2. **Backend API**: `cd deckbuilder-api && npm run dev`
3. **Web App**: `cd deckbuilder-webapp && npm run dev`

## 🔒 Production Notes

- Keep `GITEA_ADMIN_TOKEN` secret
- Use HTTPS in production
- Update `VITE_API_URL` to your production API URL
- Consider rate limiting for sign-ups

