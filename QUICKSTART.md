# Quick Start Guide

## Option 1: Test Web App UI Only (No Backend)

This lets you see the UI immediately without setting up Gitea.

### Step 1: Install Dependencies
```bash
cd deckbuilder-webapp
npm install
```

### Step 2: Create Mock Environment
```bash
# Copy the example env file
copy .env.example .env
```

### Step 3: Start Development Server
```bash
npm run dev
```

### Step 4: View in Browser
Open: http://localhost:5173

You'll see the login page. The UI is fully functional, but OAuth won't work without Gitea.

---

## Option 2: Full Setup with Gitea (Complete Experience)

### Prerequisites
- Docker Desktop installed and running
- Node.js 18+ installed

### Step 1: Start Gitea
```bash
# In project root
docker-compose up -d
```

Wait 30 seconds for Gitea to start, then open: http://localhost:3000

### Step 2: Configure Gitea (First Time Only)

1. Open http://localhost:3000
2. Click "Register" or complete initial setup
3. Create an admin account
4. Go to Settings → Applications
5. Click "Manage OAuth2 Applications"
6. Click "Create a new OAuth2 Application"
7. Fill in:
   - Application Name: `DeckBuilder`
   - Redirect URI: `http://localhost:5173/auth/callback`
8. Click "Create Application"
9. **Copy the Client ID and Client Secret**

### Step 3: Configure Web App

```bash
cd deckbuilder-webapp

# Copy environment template
copy .env.example .env

# Edit .env and paste your OAuth credentials
notepad .env
```

Update these lines in `.env`:
```
VITE_GITEA_CLIENT_ID=your_client_id_here
VITE_GITEA_CLIENT_SECRET=your_client_secret_here
```

### Step 4: Install and Run Web App

```bash
# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

### Step 5: Test the Application

1. Open http://localhost:5173
2. Click "Sign in with Gitea"
3. Authorize the application
4. You should see the dashboard!

---

## Option 3: Quick Demo Mode (Mock Data)

If you just want to see how it looks without any setup, I can create a demo mode with mock data.

---

## Troubleshooting

### Docker Issues
- Make sure Docker Desktop is running
- Check: `docker ps` should show containers
- Restart: `docker-compose restart`

### Port Already in Use
- Gitea (3000): Stop other apps using port 3000
- Web App (5173): Stop other Vite apps
- Change ports in docker-compose.yml or vite.config.ts

### OAuth Errors
- Verify redirect URI is exactly: `http://localhost:5173/auth/callback`
- Check client ID and secret are correct
- Clear browser cache and try again

### npm install fails
- Make sure you're in `deckbuilder-webapp` folder
- Try: `npm cache clean --force`
- Delete `node_modules` and try again

---

## What You'll See

### Login Page
- Clean, dark-themed interface
- "Sign in with Gitea" button

### Dashboard
- List of your repositories
- Create new deck repo button
- Navigation to decks and PRs

### Deck Editor
- Card search (connects to Scryfall)
- Visual deck list
- Add/remove cards
- Validation
- Commit changes

### Pull Requests
- Create PRs between branches
- View open/closed PRs
- Merge PRs

---

## Next Steps After Testing

1. Create your first deck repository
2. Add some example decks
3. Try creating branches
4. Test the PR workflow
5. Explore deck validation

---

## Quick Commands Reference

```bash
# Start Gitea
docker-compose up -d

# Stop Gitea
docker-compose down

# View Gitea logs
docker-compose logs -f gitea

# Start web app
cd deckbuilder-webapp
npm run dev

# Build for production
npm run build

# Check for errors
npm run lint
```
