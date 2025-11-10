# Account Creation Troubleshooting

This guide helps resolve issues with the account creation (sign-up) feature.

## How Account Creation Works

1. User fills out sign-up form (username, email, password)
2. Frontend sends request to backend API (`/api/provision/user`)
3. Backend uses Gitea admin token to create user via Gitea API
4. Frontend automatically logs in the new user
5. User is redirected to dashboard

## Common Issues

### "Sign up failed. Please try again."

**Cause**: Backend API is not running or not reachable.

**Solution**:
1. Verify backend API is running:
   ```bash
   cd deckbuilder-api
   npm run dev
   ```

2. Check API is accessible:
   ```bash
   curl http://localhost:3001/health
   ```
   Should return: `{"status":"ok"}`

3. Verify web app has correct API URL in `.env`:
   ```
   VITE_API_URL=http://localhost:3001/api
   ```

4. Restart web app after changing `.env`:
   ```bash
   cd deckbuilder-webapp
   npm run dev
   ```

### "Admin token not configured"

**Cause**: Backend API doesn't have `GITEA_ADMIN_TOKEN` set.

**Solution**:
1. Log in to Gitea as admin
2. Go to Settings → Applications
3. Generate new token with `admin:user` permission
4. Add to `deckbuilder-api/.env`:
   ```
   GITEA_ADMIN_TOKEN=your_token_here
   ```
5. Restart backend API

### "Username already exists"

**Cause**: Username is taken.

**Solution**: Choose a different username.

### CORS Errors in Browser Console

**Cause**: Backend API not allowing requests from frontend.

**Solution**: Backend already has CORS enabled. Check:
1. Backend is running on correct port (3001)
2. Frontend `.env` has correct `VITE_API_URL`
3. No firewall blocking localhost connections

### Network Error / Connection Refused

**Cause**: Backend API not running or wrong URL.

**Solution**:
1. Start backend API:
   ```bash
   cd deckbuilder-api
   npm run dev
   ```

2. Verify it's listening on port 3001:
   ```
   DeckBuilder API running on port 3001
   ```

3. Check frontend `.env` matches:
   ```
   VITE_API_URL=http://localhost:3001/api
   ```

## Testing Account Creation

### Manual Test

1. Ensure backend API is running
2. Open web app: `http://localhost:5173`
3. Click "Don't have an account? Sign up"
4. Fill in:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `password123`
5. Click "Create Account"
6. Should automatically log in and redirect to dashboard

### API Test (Direct)

Test the backend endpoint directly:

```bash
curl -X POST http://localhost:3001/api/provision/user \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser2",
    "email": "test2@example.com",
    "password": "password123"
  }'
```

Expected response:
```json
{
  "success": true,
  "user": { ... }
}
```

## Production Deployment Notes

### Environment Variables

Ensure these are set in production:

**Backend API**:
- `GITEA_URL`: Your Gitea instance URL
- `GITEA_ADMIN_TOKEN`: Admin token from Gitea
- `PORT`: API port (default 3001)

**Web App**:
- `VITE_API_URL`: Full URL to backend API (e.g., `https://api.yourdomain.com/api`)
- `VITE_GITEA_URL`: Full URL to Gitea (e.g., `https://git.yourdomain.com`)

### Security Considerations

1. **Admin Token**: Keep `GITEA_ADMIN_TOKEN` secret and secure
2. **HTTPS**: Use HTTPS in production for both API and web app
3. **Rate Limiting**: Consider adding rate limiting to prevent abuse
4. **Email Validation**: Backend doesn't send verification emails by default
5. **Password Policy**: Gitea enforces its own password requirements

### Disabling Account Creation

If you want to disable public sign-ups:

1. Remove the "Sign up" button from frontend:
   - Edit `deckbuilder-webapp/src/pages/Login.tsx`
   - Remove or hide the sign-up toggle button

2. Or restrict at API level:
   - Add authentication to `/api/provision/user` endpoint
   - Require admin approval for new accounts

## Getting Help

If issues persist:

1. Check backend API logs for errors
2. Check browser console for frontend errors
3. Verify Gitea is accessible and admin token is valid
4. Test Gitea API directly:
   ```bash
   curl -H "Authorization: token YOUR_ADMIN_TOKEN" \
     http://localhost:3000/api/v1/admin/users
   ```

