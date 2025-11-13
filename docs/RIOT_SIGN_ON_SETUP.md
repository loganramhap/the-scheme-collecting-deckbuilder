# Riot Sign-On Configuration Guide

This guide explains how to configure Riot Sign-On (RSO) authentication for the Zaunite Workshop deck builder.

## Overview

Riot Sign-On replaces the previous Gitea-based authentication system. Users now sign in with their Riot Games accounts, and Gitea accounts are automatically provisioned for deck storage.

## Prerequisites

- Riot Developer account
- AWS account with DynamoDB access
- Running Gitea instance
- Node.js 18+ installed

## Step 1: Register Your Application with Riot

1. Visit the [Riot Developer Portal](https://developer.riotgames.com/)
2. Sign in with your Riot Games account
3. Navigate to "Applications" or "My Applications"
4. Click "Create New Application" or "Register Application"
5. Fill in the application details:
   - **Application Name**: Zaunite Workshop (or your app name)
   - **Description**: Deck builder for Riftbound
   - **Redirect URI**: `http://localhost:5173/auth/callback` (for development)
     - For production: `https://yourdomain.com/auth/callback`
6. Submit the application
7. Copy the **Client ID** and **Client Secret** - you'll need these for configuration

## Step 2: Set Up AWS DynamoDB

### Create DynamoDB Tables

You need two DynamoDB tables for user and session storage.

#### Users Table

```bash
aws dynamodb create-table \
  --table-name deckbuilder-users \
  --attribute-definitions \
    AttributeName=puuid,AttributeType=S \
    AttributeName=giteaUsername,AttributeType=S \
  --key-schema \
    AttributeName=puuid,KeyType=HASH \
  --global-secondary-indexes \
    IndexName=GiteaUsernameIndex,KeySchema=[{AttributeName=giteaUsername,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
  --provisioned-throughput \
    ReadCapacityUnits=5,WriteCapacityUnits=5
```

#### Sessions Table

```bash
aws dynamodb create-table \
  --table-name deckbuilder-sessions \
  --attribute-definitions \
    AttributeName=sessionId,AttributeType=S \
  --key-schema \
    AttributeName=sessionId,KeyType=HASH \
  --provisioned-throughput \
    ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --time-to-live-specification \
    Enabled=true,AttributeName=expiresAt
```

### Get AWS Credentials

1. Go to AWS IAM Console
2. Create a new IAM user or use existing one
3. Attach policy with DynamoDB permissions:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "dynamodb:PutItem",
           "dynamodb:GetItem",
           "dynamodb:UpdateItem",
           "dynamodb:DeleteItem",
           "dynamodb:Query",
           "dynamodb:Scan"
         ],
         "Resource": [
           "arn:aws:dynamodb:*:*:table/deckbuilder-users",
           "arn:aws:dynamodb:*:*:table/deckbuilder-users/index/*",
           "arn:aws:dynamodb:*:*:table/deckbuilder-sessions"
         ]
       }
     ]
   }
   ```
4. Generate access keys and save them securely

## Step 3: Configure Backend API

1. Navigate to the backend directory:
   ```bash
   cd deckbuilder-api
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and configure all required variables:

### Riot OAuth Configuration

```bash
RIOT_CLIENT_ID=your_riot_client_id_from_step_1
RIOT_CLIENT_SECRET=your_riot_client_secret_from_step_1
RIOT_REDIRECT_URI=http://localhost:5173/auth/callback
RIOT_AUTHORIZATION_URL=https://auth.riotgames.com/authorize
RIOT_TOKEN_URL=https://auth.riotgames.com/token
RIOT_USERINFO_URL=https://auth.riotgames.com/userinfo
RIOT_REVOKE_URL=https://auth.riotgames.com/revoke
```

### Session & Security

Generate secure random strings for these values:

```bash
# Generate SESSION_SECRET (Linux/Mac)
openssl rand -base64 32

# Generate SESSION_SECRET (Windows PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

```bash
SESSION_SECRET=your_generated_secret_here
SESSION_EXPIRY=86400
ENCRYPTION_KEY=your_generated_encryption_key_here
```

**Important**: 
- `SESSION_SECRET` should be at least 32 characters
- `ENCRYPTION_KEY` should be at least 32 characters for AES-256 encryption
- Never commit these secrets to version control

### AWS Configuration

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_from_step_2
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_from_step_2
DYNAMODB_USERS_TABLE=deckbuilder-users
DYNAMODB_SESSIONS_TABLE=deckbuilder-sessions
```

### Gitea Configuration

```bash
GITEA_URL=http://localhost:3000
GITEA_ADMIN_TOKEN=your_gitea_admin_token
```

To get Gitea admin token:
1. Log in to Gitea as admin
2. Go to Settings → Applications
3. Generate new token with admin permissions
4. Copy the token to your `.env` file

### Other Settings

```bash
PORT=3001
FRONTEND_URL=http://localhost:5173
```

## Step 4: Configure Frontend

1. Navigate to the frontend directory:
   ```bash
   cd deckbuilder-webapp
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env`:

```bash
VITE_API_URL=http://localhost:3001/api
VITE_GITEA_URL=http://localhost:3000
VITE_RIOT_API_KEY=RGAPI-your-api-key-here
VITE_USE_RIOT_API=false
```

**Note**: The frontend no longer needs OAuth credentials - authentication is handled by the backend.

## Step 5: Start the Application

1. Start the backend API:
   ```bash
   cd deckbuilder-api
   npm run dev
   ```

   You should see:
   ```
   ✅ Environment validation passed
   DeckBuilder API running on port 3001
   Using DynamoDB tables:
     Users: deckbuilder-users
     Sessions: deckbuilder-sessions
   ```

2. In a new terminal, start the frontend:
   ```bash
   cd deckbuilder-webapp
   npm run dev
   ```

3. Access the application at `http://localhost:5173`

## Step 6: Test Authentication

1. Click "Sign in with Riot Games"
2. You'll be redirected to Riot's authorization page
3. Sign in with your Riot account
4. Authorize the application
5. You'll be redirected back to the deck builder
6. A Gitea account will be automatically created for you

## Production Configuration

For production deployment:

### Update Redirect URIs

1. In Riot Developer Portal, add production redirect URI:
   ```
   https://yourdomain.com/auth/callback
   ```

2. Update backend `.env`:
   ```bash
   RIOT_REDIRECT_URI=https://yourdomain.com/auth/callback
   FRONTEND_URL=https://yourdomain.com
   ```

### Security Considerations

1. **Use HTTPS**: Always use HTTPS in production
2. **Secure Cookies**: Cookies will automatically use Secure flag on HTTPS
3. **CORS**: Update `FRONTEND_URL` to match your production domain
4. **Secrets**: Use environment variables or secret management service
5. **Rate Limiting**: The API includes rate limiting on auth endpoints
6. **Session Expiry**: Adjust `SESSION_EXPIRY` based on your security requirements

### Environment Variables in Production

Never hardcode secrets. Use:
- **AWS**: AWS Systems Manager Parameter Store or Secrets Manager
- **Heroku**: Config Vars
- **Vercel/Netlify**: Environment Variables in dashboard
- **Docker**: Docker secrets or environment files (not committed to git)

## Troubleshooting

### "Missing required environment variables" Error

The backend validates all required environment variables on startup. If you see this error:

1. Check that all variables in `.env.example` are set in your `.env`
2. Ensure no variables are set to placeholder values like `your_client_id`
3. Verify the `.env` file is in the correct directory (`deckbuilder-api/`)

### "Invalid redirect_uri" Error

1. Verify `RIOT_REDIRECT_URI` in backend `.env` matches the URI registered in Riot Developer Portal
2. Ensure the URI includes the protocol (`http://` or `https://`)
3. Check for trailing slashes - they must match exactly

### "Token exchange failed" Error

1. Verify `RIOT_CLIENT_SECRET` is correct
2. Check that your Riot application is approved and active
3. Ensure system clock is synchronized (OAuth is time-sensitive)

### DynamoDB Connection Issues

1. Verify AWS credentials are correct
2. Check IAM permissions include DynamoDB access
3. Ensure table names match in `.env` and AWS
4. Verify AWS region is correct

### Session/Cookie Issues

1. Clear browser cookies and try again
2. Check that `SESSION_SECRET` is set and at least 32 characters
3. Verify `FRONTEND_URL` matches the actual frontend URL
4. For HTTPS issues, ensure cookies have Secure flag

## Migration from Gitea Auth

If you have existing users with Gitea accounts:

1. Users can link their Riot account to existing Gitea account
2. The system will detect existing Gitea accounts by username
3. Users will be prompted to confirm account linking on first RSO login

## Support

For issues:
1. Check backend logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test with a fresh browser session (incognito mode)
4. Review Riot Developer Portal for API status

## References

- [Riot Developer Portal](https://developer.riotgames.com/)
- [OAuth 2.0 with PKCE](https://oauth.net/2/pkce/)
- [AWS DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
- [Gitea API Documentation](https://docs.gitea.io/en-us/api-usage/)
