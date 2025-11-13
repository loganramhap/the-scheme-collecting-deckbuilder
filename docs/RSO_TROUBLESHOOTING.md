# Riot Sign-On Troubleshooting Guide

This guide helps you diagnose and resolve common issues with Riot Sign-On (RSO) authentication.

## Table of Contents

- [Authentication Issues](#authentication-issues)
- [Token and Session Issues](#token-and-session-issues)
- [Gitea Provisioning Issues](#gitea-provisioning-issues)
- [Database Issues](#database-issues)
- [Network and API Issues](#network-and-api-issues)
- [Configuration Issues](#configuration-issues)
- [Browser and Cookie Issues](#browser-and-cookie-issues)
- [Debugging Tools](#debugging-tools)

## Authentication Issues

### "Missing required environment variables" Error

**Symptoms**: Backend fails to start with validation error

**Causes**:
- Missing or incomplete `.env` file
- Placeholder values not replaced
- Environment variables not loaded

**Solutions**:
1. Verify all required variables are set in `deckbuilder-api/.env`:
   ```bash
   # Check for missing variables
   cat .env | grep "your_"
   ```

2. Compare with `.env.example` to ensure all variables are present

3. Ensure no placeholder values remain:
   - `RIOT_CLIENT_ID` should not be `your_client_id`
   - `RIOT_CLIENT_SECRET` should not be `your_client_secret`
   - `AWS_ACCESS_KEY_ID` should not be `your_aws_access_key`

4. Restart the backend after updating `.env`:
   ```bash
   npm run dev
   ```

### "Invalid redirect_uri" Error

**Symptoms**: OAuth flow fails with redirect URI mismatch

**Causes**:
- Redirect URI in code doesn't match Riot Developer Portal
- Protocol mismatch (http vs https)
- Trailing slash mismatch
- Port number mismatch

**Solutions**:
1. Check backend `.env`:
   ```bash
   RIOT_REDIRECT_URI=http://localhost:5173/auth/callback
   ```

2. Verify in Riot Developer Portal:
   - Go to your application settings
   - Check "Redirect URIs" section
   - Ensure exact match including protocol and port

3. Common mismatches:
   - ❌ `http://localhost:5173/auth/callback/` (trailing slash)
   - ✅ `http://localhost:5173/auth/callback`
   - ❌ `https://localhost:5173/auth/callback` (wrong protocol)
   - ✅ `http://localhost:5173/auth/callback`

4. For production, ensure HTTPS:
   ```bash
   RIOT_REDIRECT_URI=https://yourdomain.com/auth/callback
   ```

### "Authorization denied" or "access_denied" Error

**Symptoms**: User is redirected back with error after denying authorization

**Causes**:
- User clicked "Deny" on Riot authorization page
- Application doesn't have required permissions

**Solutions**:
1. This is expected behavior - user must authorize the application

2. Display user-friendly message:
   - "You need to authorize the application to continue"
   - Provide "Try Again" button

3. Check application permissions in Riot Developer Portal:
   - Ensure `openid` scope is requested
   - Verify application is approved and active

### "Token exchange failed" Error

**Symptoms**: OAuth callback fails when exchanging code for tokens

**Causes**:
- Invalid client secret
- Expired authorization code
- Code already used
- System clock out of sync

**Solutions**:
1. Verify `RIOT_CLIENT_SECRET` in `.env`:
   ```bash
   # Should be a long alphanumeric string
   echo $RIOT_CLIENT_SECRET
   ```

2. Check backend logs for detailed error:
   ```bash
   # Look for Riot API response
   npm run dev
   ```

3. Ensure authorization code is used immediately:
   - Codes expire after 10 minutes
   - Codes can only be used once

4. Synchronize system clock:
   ```bash
   # Linux/Mac
   sudo ntpdate -s time.nist.gov
   
   # Windows (PowerShell as Admin)
   w32tm /resync
   ```

5. Verify Riot application status:
   - Check if application is approved
   - Ensure it's not suspended or disabled

## Token and Session Issues

### "Session expired" or "Invalid session" Error

**Symptoms**: User is logged out unexpectedly or can't access protected routes

**Causes**:
- Session expired (default 24 hours)
- Session cleared from database
- Cookie expired or deleted
- Server restarted and sessions lost

**Solutions**:
1. Check session expiry setting in `.env`:
   ```bash
   SESSION_EXPIRY=86400  # 24 hours in seconds
   ```

2. Verify session exists in DynamoDB:
   ```bash
   aws dynamodb scan --table-name deckbuilder-sessions
   ```

3. Check browser cookies:
   - Open DevTools → Application → Cookies
   - Look for `sessionId` cookie
   - Verify it's not expired

4. Clear cookies and re-authenticate:
   - Clear browser cookies for localhost
   - Sign in again

5. Check backend logs for session validation errors

### "Token refresh failed" Error

**Symptoms**: Access token expires and refresh fails

**Causes**:
- Refresh token expired or revoked
- Invalid refresh token
- Riot API error

**Solutions**:
1. Check if refresh token is stored:
   ```bash
   # Check DynamoDB sessions table
   aws dynamodb get-item \
     --table-name deckbuilder-sessions \
     --key '{"sessionId": {"S": "your-session-id"}}'
   ```

2. Verify refresh token hasn't expired:
   - Riot refresh tokens are long-lived but can expire
   - User must re-authenticate if refresh fails

3. Check backend logs for Riot API errors:
   ```bash
   # Look for token refresh attempts
   npm run dev
   ```

4. Clear session and re-authenticate:
   - User will be redirected to login
   - New tokens will be issued

### Cookies Not Being Set

**Symptoms**: Authentication succeeds but user isn't logged in

**Causes**:
- CORS configuration blocking cookies
- SameSite policy blocking cookies
- Secure flag on non-HTTPS connection
- Browser blocking third-party cookies

**Solutions**:
1. Check CORS configuration in backend:
   ```javascript
   // src/index.js
   app.use(cors({
     origin: process.env.FRONTEND_URL,
     credentials: true
   }));
   ```

2. Verify `FRONTEND_URL` matches actual frontend:
   ```bash
   FRONTEND_URL=http://localhost:5173
   ```

3. For development, ensure both frontend and backend use same domain:
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:3001`

4. Check browser console for cookie warnings:
   - Open DevTools → Console
   - Look for SameSite or Secure warnings

5. For production, use HTTPS:
   - Cookies with Secure flag require HTTPS
   - Configure SSL/TLS certificates

## Gitea Provisioning Issues

### "Gitea account creation failed" Error

**Symptoms**: User authenticates with Riot but Gitea account isn't created

**Causes**:
- Invalid Gitea admin token
- Gitea API unreachable
- Username already exists
- Gitea permissions insufficient

**Solutions**:
1. Verify Gitea admin token:
   ```bash
   # Test token with curl
   curl -H "Authorization: token YOUR_TOKEN" \
     http://localhost:3000/api/v1/user
   ```

2. Check `GITEA_ADMIN_TOKEN` in `.env`:
   - Should be a valid admin token
   - Token should have `admin:user` permission

3. Verify Gitea is running:
   ```bash
   curl http://localhost:3000/api/v1/version
   ```

4. Check backend logs for Gitea API errors:
   ```bash
   # Look for provisioning attempts
   npm run dev
   ```

5. Manually create Gitea account:
   - Log in to Gitea as admin
   - Create user manually
   - Link to Riot account in database

### "Username already exists" Error

**Symptoms**: Gitea provisioning fails due to duplicate username

**Causes**:
- Username collision (rare but possible)
- Previous failed provisioning attempt
- Manual account creation

**Solutions**:
1. Check if user exists in Gitea:
   ```bash
   curl -H "Authorization: token YOUR_ADMIN_TOKEN" \
     http://localhost:3000/api/v1/admin/users
   ```

2. Backend automatically handles collisions by appending numbers:
   - `playername-na1` → `playername-na1-2`

3. If issue persists, check backend logs for username generation

4. Manually link existing Gitea account:
   - Update `users` table in DynamoDB
   - Set `giteaUsername` to existing account

### Gitea Password Encryption Issues

**Symptoms**: Can't decrypt Gitea password or authentication fails

**Causes**:
- `ENCRYPTION_KEY` changed
- Encryption key too short
- Database corruption

**Solutions**:
1. Verify `ENCRYPTION_KEY` in `.env`:
   ```bash
   # Should be at least 32 characters
   echo $ENCRYPTION_KEY | wc -c
   ```

2. Never change `ENCRYPTION_KEY` after users are created:
   - Existing passwords can't be decrypted
   - Users must be re-provisioned

3. If key was changed, reset user accounts:
   ```bash
   # Delete user from DynamoDB
   aws dynamodb delete-item \
     --table-name deckbuilder-users \
     --key '{"puuid": {"S": "user-puuid"}}'
   
   # User must sign in again to re-provision
   ```

## Database Issues

### DynamoDB Connection Failed

**Symptoms**: Backend can't connect to DynamoDB

**Causes**:
- Invalid AWS credentials
- Incorrect region
- Network connectivity issues
- IAM permissions insufficient

**Solutions**:
1. Verify AWS credentials:
   ```bash
   aws sts get-caller-identity
   ```

2. Check `.env` configuration:
   ```bash
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   ```

3. Test DynamoDB access:
   ```bash
   aws dynamodb list-tables --region us-east-1
   ```

4. Verify IAM permissions:
   - User needs `dynamodb:PutItem`, `GetItem`, `UpdateItem`, `DeleteItem`
   - Check IAM policy in AWS Console

5. Check network connectivity:
   ```bash
   ping dynamodb.us-east-1.amazonaws.com
   ```

### "Table does not exist" Error

**Symptoms**: Backend fails with table not found error

**Causes**:
- Tables not created
- Wrong table names in `.env`
- Wrong AWS region

**Solutions**:
1. List existing tables:
   ```bash
   aws dynamodb list-tables --region us-east-1
   ```

2. Create missing tables:
   ```bash
   # See docs/RIOT_SIGN_ON_SETUP.md for table creation commands
   ```

3. Verify table names in `.env`:
   ```bash
   DYNAMODB_USERS_TABLE=deckbuilder-users
   DYNAMODB_SESSIONS_TABLE=deckbuilder-sessions
   ```

4. Check AWS region matches:
   ```bash
   AWS_REGION=us-east-1
   ```

### Session Cleanup Not Working

**Symptoms**: Expired sessions not being deleted

**Causes**:
- TTL not enabled on sessions table
- Cleanup job not running
- TTL attribute name mismatch

**Solutions**:
1. Verify TTL is enabled:
   ```bash
   aws dynamodb describe-time-to-live \
     --table-name deckbuilder-sessions
   ```

2. Enable TTL if not enabled:
   ```bash
   aws dynamodb update-time-to-live \
     --table-name deckbuilder-sessions \
     --time-to-live-specification \
       "Enabled=true, AttributeName=expiresAt"
   ```

3. Check cleanup service logs:
   ```bash
   # Backend logs show cleanup runs
   npm run dev
   ```

4. Manually delete expired sessions:
   ```bash
   # Scan for expired sessions
   aws dynamodb scan \
     --table-name deckbuilder-sessions \
     --filter-expression "expiresAt < :now" \
     --expression-attribute-values '{":now": {"N": "'"$(date +%s)"'"}}'
   ```

## Network and API Issues

### "Cannot connect to Riot API" Error

**Symptoms**: OAuth flow fails with network error

**Causes**:
- Riot API down or unreachable
- Firewall blocking requests
- DNS resolution issues
- Rate limiting

**Solutions**:
1. Check Riot API status:
   - Visit [Riot Developer Portal](https://developer.riotgames.com/)
   - Check for service announcements

2. Test connectivity:
   ```bash
   curl https://auth.riotgames.com/.well-known/openid-configuration
   ```

3. Check firewall rules:
   - Ensure outbound HTTPS (443) is allowed
   - Whitelist Riot API domains

4. Verify DNS resolution:
   ```bash
   nslookup auth.riotgames.com
   ```

5. Check for rate limiting:
   - Riot may rate limit OAuth requests
   - Wait and retry

### CORS Errors in Browser

**Symptoms**: Browser console shows CORS policy errors

**Causes**:
- Backend CORS not configured
- Frontend URL mismatch
- Credentials not included in requests

**Solutions**:
1. Check backend CORS configuration:
   ```javascript
   // src/index.js
   app.use(cors({
     origin: process.env.FRONTEND_URL,
     credentials: true
   }));
   ```

2. Verify `FRONTEND_URL` in backend `.env`:
   ```bash
   FRONTEND_URL=http://localhost:5173
   ```

3. Ensure frontend includes credentials:
   ```typescript
   // Frontend API calls
   fetch(url, {
     credentials: 'include'
   });
   ```

4. For production, set correct origin:
   ```bash
   FRONTEND_URL=https://yourdomain.com
   ```

### Rate Limiting Errors

**Symptoms**: "Too many requests" or 429 status code

**Causes**:
- Exceeded rate limit on auth endpoints
- Multiple failed login attempts
- Automated testing without delays

**Solutions**:
1. Check rate limit configuration:
   ```javascript
   // Backend rate limit: 10 requests per minute per IP
   ```

2. Wait before retrying:
   - Rate limit resets after 1 minute
   - Implement exponential backoff

3. For testing, temporarily increase limit:
   ```javascript
   // src/routes/auth.js
   const limiter = rateLimit({
     windowMs: 60 * 1000,
     max: 100 // Increase for testing
   });
   ```

4. Check for IP address issues:
   - Behind proxy? Configure trust proxy
   - Multiple users on same IP?

## Configuration Issues

### Environment Variables Not Loading

**Symptoms**: Backend uses default values or fails validation

**Causes**:
- `.env` file not in correct directory
- `.env` file not loaded
- Syntax errors in `.env`

**Solutions**:
1. Verify `.env` location:
   ```bash
   ls -la deckbuilder-api/.env
   ```

2. Check for syntax errors:
   ```bash
   # No spaces around =
   # ✅ RIOT_CLIENT_ID=abc123
   # ❌ RIOT_CLIENT_ID = abc123
   ```

3. Ensure dotenv is loaded:
   ```javascript
   // src/index.js
   require('dotenv').config();
   ```

4. Print variables for debugging:
   ```javascript
   console.log('RIOT_CLIENT_ID:', process.env.RIOT_CLIENT_ID);
   ```

### PKCE Validation Failing

**Symptoms**: Token exchange fails with PKCE error

**Causes**:
- code_verifier not stored correctly
- Session lost between init and callback
- code_challenge generation incorrect

**Solutions**:
1. Check session storage:
   ```bash
   # Verify sessions table has code_verifier
   aws dynamodb scan --table-name deckbuilder-sessions
   ```

2. Verify PKCE generation:
   ```javascript
   // Should use SHA-256 for code_challenge
   // code_verifier should be 43-128 characters
   ```

3. Check backend logs for PKCE flow:
   ```bash
   # Look for init and callback logs
   npm run dev
   ```

4. Ensure cookies are preserved:
   - Session ID cookie must persist
   - Check browser cookie settings

## Browser and Cookie Issues

### Cookies Not Persisting

**Symptoms**: User logged out on page refresh

**Causes**:
- Browser blocking cookies
- Incognito/private mode
- Cookie expiration too short
- Browser extensions blocking cookies

**Solutions**:
1. Check browser cookie settings:
   - Allow cookies for localhost
   - Disable "Block third-party cookies"

2. Test in different browser:
   - Try Chrome, Firefox, Safari
   - Disable extensions

3. Check cookie attributes:
   ```javascript
   // Backend should set:
   // - httpOnly: true
   // - sameSite: 'lax' or 'strict'
   // - secure: true (HTTPS only)
   ```

4. Verify cookie expiration:
   ```bash
   SESSION_EXPIRY=86400  # 24 hours
   ```

### "SameSite" Cookie Warnings

**Symptoms**: Browser console shows SameSite warnings

**Causes**:
- SameSite policy too strict
- Cross-site request
- Missing SameSite attribute

**Solutions**:
1. For development (same domain):
   ```javascript
   // Use SameSite: 'lax'
   res.cookie('sessionId', value, {
     sameSite: 'lax'
   });
   ```

2. For production (cross-domain):
   ```javascript
   // Use SameSite: 'none' with Secure
   res.cookie('sessionId', value, {
     sameSite: 'none',
     secure: true  // Requires HTTPS
   });
   ```

3. Ensure frontend and backend on same domain:
   - Use subdomain: `api.yourdomain.com`
   - Or same domain with different ports

## Debugging Tools

### Enable Debug Logging

Add to backend `.env`:
```bash
DEBUG=express:*,riot:*
LOG_LEVEL=debug
```

### Check Backend Logs

```bash
# Start with verbose logging
npm run dev

# Look for specific errors
npm run dev | grep ERROR

# Save logs to file
npm run dev > logs.txt 2>&1
```

### Inspect Database

```bash
# List all users
aws dynamodb scan --table-name deckbuilder-users

# Get specific user
aws dynamodb get-item \
  --table-name deckbuilder-users \
  --key '{"puuid": {"S": "user-puuid"}}'

# List all sessions
aws dynamodb scan --table-name deckbuilder-sessions
```

### Test OAuth Flow Manually

```bash
# 1. Get authorization URL
curl http://localhost:3001/api/auth/riot/init

# 2. Visit URL in browser and authorize

# 3. Extract code from callback URL

# 4. Test callback
curl "http://localhost:3001/api/auth/riot/callback?code=CODE&state=STATE"
```

### Browser DevTools

1. **Network Tab**:
   - Monitor API requests
   - Check request/response headers
   - Verify cookies being sent

2. **Application Tab**:
   - Inspect cookies
   - Check localStorage
   - View session storage

3. **Console Tab**:
   - Check for JavaScript errors
   - View console.log output
   - Test API calls manually

### Health Check Endpoint

Test backend health:
```bash
curl http://localhost:3001/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "dynamodb": "connected",
    "gitea": "connected"
  }
}
```

## Getting Help

If you're still experiencing issues:

1. **Check backend logs** for detailed error messages
2. **Review environment variables** for typos or missing values
3. **Test each component** individually (DynamoDB, Gitea, Riot API)
4. **Try in incognito mode** to rule out browser cache issues
5. **Check Riot Developer Portal** for application status
6. **Review AWS CloudWatch** for DynamoDB errors

For additional support:
- Review [RIOT_SIGN_ON_SETUP.md](RIOT_SIGN_ON_SETUP.md) for setup instructions
- Check [API.md](API.md) for API documentation
- See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
