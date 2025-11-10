# Account Creation Fix - Summary

## Problem
Users were unable to create accounts through the web interface. The sign-up form showed an error: "Account creation is not available. Please contact an administrator or sign in with an existing account."

## Root Cause
The frontend had account creation disabled with a hardcoded error message, even though the backend API endpoint for user provisioning was fully implemented and ready to use.

## Solution
Connected the frontend sign-up form to the existing backend API endpoint.

### Changes Made

**File: `deckbuilder-webapp/src/pages/Login.tsx`**
- Removed hardcoded error blocking sign-ups
- Added API call to `/api/provision/user` endpoint
- Implemented automatic login after successful account creation
- Improved error handling for different failure scenarios

### How It Works Now

1. User fills out sign-up form (username, email, password)
2. Frontend sends POST request to `${API_URL}/provision/user`
3. Backend API uses Gitea admin token to create user via Gitea Admin API
4. Frontend automatically logs in the new user using their credentials
5. User is redirected to dashboard

## Requirements

### Backend API Must Be Running
The backend API (`deckbuilder-api`) **must** be running for account creation to work.

**Setup Steps**:

1. Get admin token from Gitea:
   - Log in to Gitea as admin
   - Settings → Applications → Generate New Token
   - Select `admin:user` permission
   - Copy token

2. Configure backend API:
   ```bash
   cd deckbuilder-api
   cp .env.example .env
   ```

3. Edit `.env`:
   ```
   GITEA_ADMIN_TOKEN=your_admin_token_here
   GITEA_URL=http://localhost:3000
   PORT=3001
   ```

4. Start backend:
   ```bash
   npm install
   npm run dev
   ```

5. Configure web app to use API:
   ```bash
   cd ../deckbuilder-webapp
   ```

   Add to `.env`:
   ```
   VITE_API_URL=http://localhost:3001/api
   ```

6. Restart web app:
   ```bash
   npm run dev
   ```

## Testing

### Quick Test
1. Open `http://localhost:5173`
2. Click "Don't have an account? Sign up"
3. Fill in username, email, password
4. Click "Create Account"
5. Should automatically log in and redirect to dashboard

### API Test
```bash
curl -X POST http://localhost:3001/api/provision/user \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

## Documentation Updates

Created/updated:
- `docs/SETUP.md` - Added clear instructions for backend API setup
- `docs/ACCOUNT_CREATION_TROUBLESHOOTING.md` - Comprehensive troubleshooting guide
- `README.md` - Updated quick start to include backend API setup

## Error Messages

The system now provides specific error messages:

- **"Invalid username or password"** - Login credentials incorrect (401)
- **"Username already exists"** - Username taken (409)
- **"Invalid email or username format"** - Format validation failed (422)
- **"Sign up failed. Please try again."** - Generic error (network, API down, etc.)

## Production Considerations

1. **Security**: Keep `GITEA_ADMIN_TOKEN` secret
2. **HTTPS**: Use HTTPS in production
3. **Rate Limiting**: Consider adding rate limiting to prevent abuse
4. **Email Verification**: Backend doesn't send verification emails by default
5. **Disable Sign-ups**: To disable public registration, remove the sign-up toggle button or add authentication to the API endpoint

## Troubleshooting

If sign-up still doesn't work:

1. **Check backend is running**: `curl http://localhost:3001/health`
2. **Verify admin token**: Check Gitea Settings → Applications
3. **Check browser console**: Look for network errors
4. **Check backend logs**: Look for API errors
5. **Verify environment variables**: Both `.env` files configured correctly

See `docs/ACCOUNT_CREATION_TROUBLESHOOTING.md` for detailed troubleshooting steps.

