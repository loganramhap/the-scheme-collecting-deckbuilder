# OAuth Redirect URI Configuration

This document explains how to configure OAuth redirect URIs for Riot Sign-On in different environments.

## What is a Redirect URI?

The redirect URI is where Riot's OAuth service sends users after they authorize your application. It must match **exactly** between:
1. Your Riot Developer Portal application settings
2. Your backend `.env` configuration (`RIOT_REDIRECT_URI`)

## Environment-Specific URIs

### Development (Local)

**Redirect URI:**
```
http://localhost:5173/auth/callback
```

**Configuration:**
```env
# deckbuilder-api/.env
RIOT_REDIRECT_URI=http://localhost:5173/auth/callback
FRONTEND_URL=http://localhost:5173
```

**Riot Developer Portal:**
- Add `http://localhost:5173/auth/callback` to allowed redirect URIs
- Note: Some OAuth providers don't allow `localhost` - use `127.0.0.1` if needed

### Staging/Testing

**Redirect URI:**
```
https://staging.zauniteworkshop.com/auth/callback
```

**Configuration:**
```env
# deckbuilder-api/.env.staging
RIOT_REDIRECT_URI=https://staging.zauniteworkshop.com/auth/callback
FRONTEND_URL=https://staging.zauniteworkshop.com
```

**Riot Developer Portal:**
- Add `https://staging.zauniteworkshop.com/auth/callback` to allowed redirect URIs

### Production

**Redirect URI:**
```
https://zauniteworkshop.com/auth/callback
```

**Configuration:**
```env
# deckbuilder-api/.env.production
RIOT_REDIRECT_URI=https://zauniteworkshop.com/auth/callback
FRONTEND_URL=https://zauniteworkshop.com
```

**Riot Developer Portal:**
- Add `https://zauniteworkshop.com/auth/callback` to allowed redirect URIs
- Optionally add `https://www.zauniteworkshop.com/auth/callback` if using www subdomain

## Configuring in Riot Developer Portal

### Step 1: Access Your Application

1. Go to https://developer.riotgames.com/
2. Sign in with your Riot account
3. Navigate to "My Applications" or "Applications"
4. Select your application

### Step 2: Add Redirect URIs

1. Find the "Redirect URIs" or "OAuth Redirect URIs" section
2. Click "Add Redirect URI" or similar button
3. Enter your redirect URI **exactly** as shown above
4. Save changes

### Step 3: Verify Configuration

The redirect URI must:
- ✅ Include the protocol (`http://` or `https://`)
- ✅ Match the domain exactly (including subdomain)
- ✅ Match the path exactly (`/auth/callback`)
- ✅ Not have trailing slashes
- ✅ Use the correct port for development

## Common Issues

### "Invalid redirect_uri" Error

**Cause:** Redirect URI mismatch between Riot portal and your configuration

**Solutions:**
1. Check for typos in both locations
2. Verify protocol matches (http vs https)
3. Check for trailing slashes
4. Ensure port numbers match (for development)
5. Wait a few minutes after updating Riot portal (changes may take time to propagate)

### "redirect_uri_mismatch" Error

**Cause:** The URI in the OAuth request doesn't match any registered URIs

**Solutions:**
1. Check `RIOT_REDIRECT_URI` in your `.env` file
2. Verify it matches exactly what's in Riot Developer Portal
3. Check that `FRONTEND_URL` is set correctly
4. Clear browser cache and cookies

### OAuth Works Locally But Not in Production

**Cause:** Production redirect URI not registered or misconfigured

**Solutions:**
1. Add production URI to Riot Developer Portal
2. Verify `RIOT_REDIRECT_URI` in production `.env`
3. Check that HTTPS is working correctly
4. Verify DNS is pointing to correct server

## Multiple Environments

You can register multiple redirect URIs in the Riot Developer Portal:

```
http://localhost:5173/auth/callback          (Development)
http://127.0.0.1:5173/auth/callback          (Alternative local)
https://staging.zauniteworkshop.com/auth/callback  (Staging)
https://zauniteworkshop.com/auth/callback    (Production)
https://www.zauniteworkshop.com/auth/callback (Production www)
```

This allows you to use the same Riot application for all environments.

## Testing Redirect URIs

### Manual Test

1. Start your application
2. Click "Sign in with Riot Games"
3. Check the URL you're redirected to - it should include:
   ```
   https://auth.riotgames.com/authorize?
     client_id=YOUR_CLIENT_ID&
     redirect_uri=YOUR_REDIRECT_URI&
     ...
   ```
4. The `redirect_uri` parameter should match your configuration

### Automated Test

```bash
# Check backend configuration
curl http://localhost:3001/api/auth/riot/init | jq .authorizationUrl

# Should contain your redirect URI
```

## Security Considerations

### Use HTTPS in Production

Always use HTTPS for production redirect URIs:
- ✅ `https://zauniteworkshop.com/auth/callback`
- ❌ `http://zauniteworkshop.com/auth/callback`

### Don't Use Wildcards

Riot OAuth doesn't support wildcard redirect URIs:
- ❌ `https://*.zauniteworkshop.com/auth/callback`
- ✅ Register each subdomain explicitly

### Validate State Parameter

The application automatically validates the `state` parameter to prevent CSRF attacks. Don't disable this validation.

## Updating Redirect URIs

### When Changing Domains

1. Add new redirect URI to Riot Developer Portal
2. Update `RIOT_REDIRECT_URI` in your `.env`
3. Deploy changes
4. Test OAuth flow
5. Optionally remove old redirect URI from Riot portal

### When Adding Subdomains

1. Add subdomain redirect URI to Riot Developer Portal
2. Create environment-specific `.env` file
3. Deploy to subdomain
4. Test OAuth flow

## Troubleshooting Checklist

When OAuth isn't working:

- [ ] Redirect URI registered in Riot Developer Portal
- [ ] `RIOT_REDIRECT_URI` set in backend `.env`
- [ ] Protocol matches (http/https)
- [ ] Domain matches exactly
- [ ] Path is `/auth/callback`
- [ ] No trailing slashes
- [ ] Port number correct (for development)
- [ ] Changes saved in Riot Developer Portal
- [ ] Backend restarted after `.env` changes
- [ ] Browser cache cleared
- [ ] HTTPS certificate valid (for production)

## Examples

### Development Setup

**Riot Developer Portal:**
```
Redirect URIs:
  - http://localhost:5173/auth/callback
```

**Backend .env:**
```env
RIOT_REDIRECT_URI=http://localhost:5173/auth/callback
FRONTEND_URL=http://localhost:5173
```

### Production Setup

**Riot Developer Portal:**
```
Redirect URIs:
  - https://zauniteworkshop.com/auth/callback
  - https://www.zauniteworkshop.com/auth/callback
```

**Backend .env.production:**
```env
RIOT_REDIRECT_URI=https://zauniteworkshop.com/auth/callback
FRONTEND_URL=https://zauniteworkshop.com
```

## Additional Resources

- [OAuth 2.0 RFC](https://tools.ietf.org/html/rfc6749)
- [Riot Developer Portal](https://developer.riotgames.com/)
- [OAuth 2.0 Security Best Practices](https://tools.ietf.org/html/draft-ietf-oauth-security-topics)

## Support

If you continue to have issues with redirect URIs:

1. Check backend logs: `docker-compose logs api`
2. Check browser console for errors
3. Verify environment variables: `docker-compose exec api env | grep RIOT`
4. Test with curl: `curl http://localhost:3001/api/auth/riot/init`
5. Review Riot Developer Portal settings
