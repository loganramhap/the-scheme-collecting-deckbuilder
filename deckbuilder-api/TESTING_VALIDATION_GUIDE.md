# Testing and Validation Guide - Riot Sign-On Integration

This document provides comprehensive testing and validation procedures for the Riot Sign-On (RSO) authentication system.

## Overview

The testing suite includes:
1. **End-to-End Tests** (`auth.e2e.test.js`) - Complete authentication flows
2. **Error Scenario Tests** (`auth.error.test.js`) - Error handling validation
3. **Security Audit Tests** (`auth.security.test.js`) - Security measures verification

## Running Tests

### Run All Tests
```bash
cd deckbuilder-api
npm test
```

### Run Specific Test Suites
```bash
# End-to-end tests
npm test -- auth.e2e.test.js

# Error scenario tests
npm test -- auth.error.test.js

# Security audit tests
npm test -- auth.security.test.js
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

## Test Coverage

### 13.1: End-to-End Testing (Requirements: 1.1-1.5, 2.1-2.5, 3.1-3.4, 6.1-6.9)

#### 13.1.1: New User Complete Flow
- ✅ OAuth initialization with PKCE parameters
- ✅ Authorization URL generation
- ✅ OAuth callback handling
- ✅ Token exchange
- ✅ User profile fetching
- ✅ Gitea account provisioning
- ✅ Session creation
- ✅ Cookie management

#### 13.1.2: Existing User Login Flow
- ✅ User lookup by PUUID
- ✅ Session creation for existing users
- ✅ Last login timestamp update
- ✅ No duplicate Gitea account creation

#### 13.1.3: Session Persistence
- ✅ Session storage and retrieval
- ✅ Session data persistence across requests
- ✅ Session expiration handling
- ✅ Session updates

#### 13.1.4: Logout Flow
- ✅ Token revocation
- ✅ Session deletion
- ✅ Cookie clearing
- ✅ Cleanup verification

#### 13.1.5: Token Refresh Flow
- ✅ Refresh token usage
- ✅ New token generation
- ✅ Cookie updates
- ✅ Error handling for invalid refresh tokens

#### 13.1.6: /api/auth/me Endpoint
- ✅ Authenticated user data retrieval
- ✅ Session validation
- ✅ Unauthorized request handling

#### 13.1.7: PKCE Implementation
- ✅ Code verifier generation (43-128 characters)
- ✅ SHA-256 code challenge generation
- ✅ State parameter generation
- ✅ Cryptographic randomness verification

### 13.2: Error Scenario Testing (Requirements: 7.1-7.4)

#### 13.2.1: OAuth Denial
- ✅ User denies authorization (access_denied)
- ✅ Invalid request errors
- ✅ Server errors from Riot
- ✅ Proper error message display

#### 13.2.2: Network Failures
- ✅ Connection timeout handling
- ✅ Connection refused errors
- ✅ DNS resolution failures
- ✅ Retry logic verification

#### 13.2.3: Token Expiration
- ✅ Expired access token handling
- ✅ Expired refresh token handling
- ✅ Revoked token handling
- ✅ Automatic token refresh

#### 13.2.4: Invalid Sessions
- ✅ Missing session cookie
- ✅ Invalid session ID format
- ✅ Expired session handling
- ✅ Incomplete session data
- ✅ State parameter mismatch

#### 13.2.5: Gitea Provisioning Failures
- ✅ Gitea API unavailable
- ✅ Username conflicts
- ✅ Authentication failures
- ✅ Rate limiting
- ✅ Database write failures

#### 13.2.6: Riot API Error Responses
- ✅ 500 Internal Server Error
- ✅ 503 Service Unavailable
- ✅ Malformed responses
- ✅ Timeout handling

### 13.3: Security Audit (Requirements: 4.1-4.5, 11.1, 11.2)

#### 13.3.1: PKCE Implementation Verification
- ✅ Cryptographically secure code_verifier
- ✅ Valid SHA-256 code_challenge
- ✅ S256 challenge method (not plain)
- ✅ Server-side verifier storage
- ✅ Verifier validation during token exchange

#### 13.3.2: Token Storage Security
- ✅ HttpOnly cookie flag
- ✅ Secure flag in production
- ✅ SameSite attribute
- ✅ No tokens in response body
- ✅ No tokens in URL parameters
- ✅ Encryption of sensitive data

#### 13.3.3: Session Management Security
- ✅ Cryptographically secure session IDs (UUID v4)
- ✅ Session expiration enforcement
- ✅ Session invalidation on logout
- ✅ Protection against session fixation
- ✅ Session ID regeneration after authentication

#### 13.3.4: CSRF Protection
- ✅ State parameter generation
- ✅ State parameter validation
- ✅ Rejection of missing state
- ✅ SameSite cookie attribute

#### 13.3.5: Rate Limiting
- ✅ Rate limit enforcement (10 req/min per IP)
- ✅ 429 status code on limit exceeded
- ✅ Rate limit headers
- ✅ Per-endpoint rate limiting

#### 13.3.6: Additional Security Checks
- ✅ No sensitive information in error messages
- ✅ Redirect URI validation
- ✅ HTTPS enforcement in production
- ✅ Input sanitization
- ✅ Proper CORS configuration

## Manual Testing Checklist

### Prerequisites
- [ ] DynamoDB tables created (`npm run db:migrate`)
- [ ] Environment variables configured (`.env` file)
- [ ] Riot OAuth application registered
- [ ] Gitea instance running and accessible
- [ ] Backend server running (`npm start`)
- [ ] Frontend application running

### Test Scenarios

#### 1. New User Registration
1. [ ] Navigate to login page
2. [ ] Click "Sign in with Riot Games"
3. [ ] Verify redirect to Riot authorization page
4. [ ] Authorize the application
5. [ ] Verify redirect back to application
6. [ ] Verify user is logged in
7. [ ] Verify Gitea account was created
8. [ ] Verify user data is displayed correctly

#### 2. Existing User Login
1. [ ] Logout if logged in
2. [ ] Click "Sign in with Riot Games"
3. [ ] Authorize (should be faster if already authorized)
4. [ ] Verify login successful
5. [ ] Verify same Gitea account is used
6. [ ] Verify last login timestamp updated

#### 3. Session Persistence
1. [ ] Login successfully
2. [ ] Refresh the page
3. [ ] Verify still logged in
4. [ ] Close and reopen browser
5. [ ] Verify still logged in (if within session timeout)
6. [ ] Wait for session timeout (24 hours)
7. [ ] Verify redirected to login

#### 4. Token Refresh
1. [ ] Login successfully
2. [ ] Wait for access token to expire (typically 1 hour)
3. [ ] Make an API request
4. [ ] Verify token is automatically refreshed
5. [ ] Verify request succeeds

#### 5. Logout
1. [ ] Login successfully
2. [ ] Click logout button
3. [ ] Verify redirected to login page
4. [ ] Verify cannot access protected pages
5. [ ] Verify session is deleted from database

#### 6. OAuth Denial
1. [ ] Click "Sign in with Riot Games"
2. [ ] On Riot authorization page, click "Deny"
3. [ ] Verify error message is displayed
4. [ ] Verify can retry login

#### 7. Network Errors
1. [ ] Disconnect network
2. [ ] Attempt to login
3. [ ] Verify appropriate error message
4. [ ] Reconnect network
5. [ ] Verify can retry successfully

#### 8. Invalid Session
1. [ ] Login successfully
2. [ ] Manually delete session from database
3. [ ] Attempt to access protected page
4. [ ] Verify redirected to login

#### 9. CSRF Protection
1. [ ] Attempt to forge OAuth callback request
2. [ ] Use incorrect state parameter
3. [ ] Verify request is rejected

#### 10. Rate Limiting
1. [ ] Make 15+ rapid requests to `/api/auth/riot/init`
2. [ ] Verify some requests return 429 status
3. [ ] Wait 1 minute
4. [ ] Verify requests succeed again

## Database Verification

### Check User Records
```bash
# Using AWS CLI
aws dynamodb scan --table-name deckbuilder-users --region us-east-1

# Or use the backup script
npm run db:export
```

### Check Session Records
```bash
aws dynamodb scan --table-name deckbuilder-sessions --region us-east-1
```

### Verify Data Integrity
- [ ] User PUUID is unique
- [ ] Gitea username is unique
- [ ] Gitea password is encrypted
- [ ] Session expiry is set correctly
- [ ] Last login timestamp is updated

## Security Verification

### PKCE Implementation
```bash
# Test code_verifier generation
node -e "const auth = require('./src/services/authService.js'); console.log(auth.generateCodeVerifier());"

# Test code_challenge generation
node -e "const auth = require('./src/services/authService.js'); const v = auth.generateCodeVerifier(); console.log(auth.generateCodeChallenge(v));"
```

### Cookie Security
1. [ ] Open browser DevTools → Application → Cookies
2. [ ] Verify `session_id` cookie has:
   - HttpOnly flag
   - Secure flag (in production)
   - SameSite=Strict or Lax
3. [ ] Verify no tokens visible in cookies

### Token Storage
1. [ ] Check browser localStorage
2. [ ] Verify no tokens stored
3. [ ] Check sessionStorage
4. [ ] Verify no tokens stored

### HTTPS Enforcement
1. [ ] In production, verify all URLs use HTTPS
2. [ ] Verify redirect URI uses HTTPS
3. [ ] Verify Riot authorization URL uses HTTPS

## Performance Testing

### Response Times
- [ ] `/api/auth/riot/init` < 200ms
- [ ] `/api/auth/riot/callback` < 2000ms (includes external API calls)
- [ ] `/api/auth/me` < 100ms
- [ ] `/api/auth/refresh` < 1000ms
- [ ] `/api/auth/logout` < 200ms

### Load Testing
```bash
# Install Apache Bench
# Test login endpoint
ab -n 100 -c 10 http://localhost:3001/api/auth/riot/init
```

## Troubleshooting

### Tests Failing Due to AWS Credentials
If tests fail with `CredentialsProviderError`:
1. Configure AWS credentials: `aws configure`
2. Or set environment variables:
   ```bash
   export AWS_ACCESS_KEY_ID=your_key
   export AWS_SECRET_ACCESS_KEY=your_secret
   export AWS_REGION=us-east-1
   ```
3. Or use DynamoDB Local for testing

### Tests Failing Due to Missing Environment Variables
1. Copy `.env.example` to `.env`
2. Fill in all required values
3. Ensure `RIOT_CLIENT_ID` and `RIOT_CLIENT_SECRET` are set

### Gitea Provisioning Failures
1. Verify Gitea is running: `curl http://localhost:3000`
2. Verify admin token is valid
3. Check Gitea logs for errors

## Continuous Integration

### GitHub Actions Example
```yaml
name: Test RSO Authentication

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd deckbuilder-api
          npm install
      
      - name: Run tests
        run: |
          cd deckbuilder-api
          npm test
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          RIOT_CLIENT_ID: ${{ secrets.RIOT_CLIENT_ID }}
          RIOT_CLIENT_SECRET: ${{ secrets.RIOT_CLIENT_SECRET }}
```

## Test Maintenance

### Adding New Tests
1. Follow existing test structure
2. Use descriptive test names
3. Include requirement references
4. Document expected behavior
5. Clean up test data

### Updating Tests
1. Update tests when requirements change
2. Maintain backward compatibility where possible
3. Document breaking changes
4. Update this guide

## Conclusion

This testing suite provides comprehensive coverage of the Riot Sign-On authentication system. Regular execution of these tests ensures the system remains secure, reliable, and functional.

For questions or issues, refer to:
- Design Document: `.kiro/specs/riot-sign-on/design.md`
- Requirements Document: `.kiro/specs/riot-sign-on/requirements.md`
- API Documentation: `docs/API.md`
