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

### Step 3: Setup Backend API (Required for Account Creation)

```bash
cd deckbuilder-api

# Install dependencies
npm install

# Copy environment template
copy .env.example .env
```

Get admin token from Gitea:
1. Log in to Gitea (http://localhost:3000)
2. Go to Settings → Applications
3. Click "Generate New Token"
4. Name: "DeckBuilder API"
5. Select all permissions
6. Copy the token

Edit `.env` and add your admin token:
```
GITEA_ADMIN_TOKEN=your_admin_token_here
```

Start the API:
```bash
npm run dev
```

Keep this terminal running!

### Step 4: Configure Web App

```bash
# Open new terminal
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
VITE_API_URL=http://localhost:3001/api
```

### Step 5: Install and Run Web App

```bash
# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

### Step 6: Test the Application

1. Open http://localhost:5173
2. Click "Don't have an account? Sign up"
3. Create a new account (username, email, password)
4. You'll be automatically logged in!
5. Or click "Sign in with Gitea" to use OAuth

**Note**: The backend API must be running for account creation to work!

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

# Start backend API (required for account creation)
cd deckbuilder-api
npm run dev

# Start web app (in new terminal)
cd deckbuilder-webapp
npm run dev

# Build for production
npm run build

# Check for errors
npm run lint
```

## Running Everything

You need **3 terminals**:

**Terminal 1 - Gitea** (Docker):
```bash
docker-compose up -d
```

**Terminal 2 - Backend API**:
```bash
cd deckbuilder-api
npm run dev
```

**Terminal 3 - Web App**:
```bash
cd deckbuilder-webapp
npm run dev
```
