# Riot Sign-On Migration Guide

This guide helps existing users migrate from Gitea authentication to Riot Sign-On (RSO).

## Overview

The Zaunite Workshop deck builder has transitioned from Gitea-based authentication to Riot Sign-On. This change provides:

- **Seamless authentication** with your Riot Games account
- **No separate password** to remember
- **Automatic account linking** to preserve your existing decks
- **Enhanced security** with OAuth 2.0 and PKCE

## Migration Process

### For Existing Users

If you already have a Gitea account with decks, follow these steps to migrate:

#### Step 1: Understand What Happens

When you sign in with Riot for the first time:

1. You'll be redirected to Riot's authorization page
2. After authorizing, the system checks if you have an existing Gitea account
3. If found, your Riot account is automatically linked to your Gitea account
4. Your decks and repositories remain unchanged
5. Future logins use Riot Sign-On

**Important**: Your existing decks, repositories, and data are preserved. Nothing is deleted or modified.

#### Step 2: Sign In with Riot

1. Visit the deck builder at your usual URL
2. You'll see a new "Sign in with Riot Games" button
3. Click the button to start the migration process
4. Sign in with your Riot Games account
5. Authorize the application when prompted

#### Step 3: Account Linking

The system will automatically:

- Detect your existing Gitea account
- Link it to your Riot PUUID (Player Universally Unique Identifier)
- Store the connection in the database
- Log you in with your existing account

You'll see a confirmation message: "Welcome back! Your Riot account has been linked to your existing decks."

#### Step 4: Verify Your Decks

After signing in:

1. Navigate to your dashboard
2. Verify all your decks are visible
3. Open a deck to confirm it loads correctly
4. Make a test edit to ensure everything works

If you encounter any issues, see the [Troubleshooting](#troubleshooting) section below.

### For New Users

If you're new to the deck builder:

1. Click "Sign in with Riot Games"
2. Authorize the application
3. A Gitea account will be automatically created for you
4. Start building decks immediately

No additional setup required!

## What Changes

### Before Migration (Gitea Auth)

- Username/password login
- Manual account creation
- Gitea token stored in browser
- Password management required

### After Migration (Riot Sign-On)

- One-click Riot login
- Automatic account provisioning
- Secure httpOnly cookies
- No password to remember

## What Stays the Same

- **Your decks**: All decks remain in your Gitea repositories
- **Your repositories**: Git history and branches preserved
- **Your username**: Gitea username unchanged
- **Deck format**: `.deck.json` files remain compatible
- **Sharing**: Deck sharing and collaboration still work
- **Version control**: Git features (commits, branches, PRs) unchanged

## Technical Details

### Account Linking Process

When you sign in with Riot for the first time, the backend:

1. Fetches your Riot user info (PUUID, game name, tag line)
2. Checks the `users` table in DynamoDB for existing Gitea account
3. If found by username match, links Riot PUUID to Gitea account
4. If not found, creates new Gitea account
5. Stores the mapping in DynamoDB

### Data Storage

Your data is stored in two places:

1. **DynamoDB** (new):
   - Riot PUUID → Gitea username mapping
   - Session data
   - Authentication tokens (encrypted)

2. **Gitea** (unchanged):
   - All your deck repositories
   - Git history and commits
   - User profile and settings

### Authentication Flow

```
┌──────┐         ┌─────────┐         ┌─────────┐         ┌──────┐
│ User │────────►│ Frontend│────────►│ Backend │────────►│ Riot │
└──────┘         └─────────┘         └─────────┘         └──────┘
   │                  │                    │                  │
   │  Click login     │                    │                  │
   ├─────────────────►│                    │                  │
   │                  │  Init OAuth        │                  │
   │                  ├───────────────────►│                  │
   │                  │  Auth URL          │                  │
   │                  │◄───────────────────┤                  │
   │  Redirect        │                    │                  │
   ├──────────────────┴────────────────────┴─────────────────►│
   │                                                           │
   │  Authorize                                                │
   ├──────────────────────────────────────────────────────────►│
   │                                                           │
   │  Callback with code                                       │
   │◄──────────────────────────────────────────────────────────┤
   │                  │                    │                  │
   │                  │  Send code         │                  │
   │                  ├───────────────────►│                  │
   │                  │                    │  Exchange token  │
   │                  │                    ├─────────────────►│
   │                  │                    │  Tokens          │
   │                  │                    │◄─────────────────┤
   │                  │                    │                  │
   │                  │                    │  Get user info   │
   │                  │                    ├─────────────────►│
   │                  │                    │  User data       │
   │                  │                    │◄─────────────────┤
   │                  │                    │                  │
   │                  │                    │  Link/Create     │
   │                  │                    │  Gitea account   │
   │                  │                    │                  │
   │                  │  Set cookies       │                  │
   │                  │◄───────────────────┤                  │
   │  Logged in       │                    │                  │
   │◄─────────────────┤                    │                  │
```

## Migration Scenarios

### Scenario 1: Single User, Single Gitea Account

**Situation**: You have one Gitea account with decks

**Process**:
1. Sign in with Riot
2. System finds your Gitea account by username
3. Accounts are linked automatically
4. You're logged in with full access to your decks

**Result**: Seamless migration, no action required

### Scenario 2: Multiple Riot Accounts

**Situation**: You have multiple Riot accounts (e.g., different regions)

**Process**:
1. Sign in with your primary Riot account first
2. This links to your Gitea account
3. Other Riot accounts will create separate Gitea accounts

**Recommendation**: Use your primary Riot account for consistency

### Scenario 3: Shared Gitea Account

**Situation**: Multiple people share one Gitea account (not recommended)

**Process**:
1. First person to sign in with Riot links to the Gitea account
2. Other people will get separate Gitea accounts
3. Decks can be shared via Gitea's fork/PR workflow

**Recommendation**: Each person should have their own account

### Scenario 4: Lost Gitea Password

**Situation**: You forgot your Gitea password

**Process**:
1. Sign in with Riot (no password needed)
2. System links to your Gitea account automatically
3. You regain access without password recovery

**Result**: Password no longer needed for authentication

## Rollback Plan

If you need to revert to Gitea authentication:

### Temporary Rollback

If RSO is temporarily unavailable:

1. Administrator can re-enable Gitea authentication
2. Use your existing Gitea username and password
3. Your decks remain accessible
4. RSO can be re-enabled later without data loss

### Permanent Rollback

If you prefer Gitea authentication:

1. Contact administrator to enable Gitea auth
2. Continue using username/password
3. Your Riot account link remains in database
4. You can switch back to RSO anytime

**Note**: Rollback requires administrator action and is not self-service.

## Troubleshooting

### "Account not found" Error

**Problem**: System can't find your existing Gitea account

**Solutions**:
1. Verify you're using the correct Riot account
2. Check if your Gitea username matches expected format
3. Contact administrator to manually link accounts

### "Account already linked" Error

**Problem**: Your Gitea account is already linked to another Riot account

**Solutions**:
1. Sign in with the originally linked Riot account
2. Contact administrator to unlink and re-link
3. Use a different Gitea account

### Decks Not Visible After Migration

**Problem**: You're logged in but can't see your decks

**Solutions**:
1. Check if you're logged into the correct account
2. Verify Gitea repositories still exist
3. Check browser console for errors
4. Try refreshing the page
5. Sign out and sign in again

### "Gitea provisioning failed" Error

**Problem**: System can't create or link Gitea account

**Solutions**:
1. Check backend logs for detailed error
2. Verify Gitea is running and accessible
3. Ensure Gitea admin token is valid
4. Contact administrator for manual provisioning

### Session Expires Immediately

**Problem**: You're logged out right after signing in

**Solutions**:
1. Check browser cookie settings
2. Ensure cookies are enabled for the site
3. Try in incognito mode to rule out extensions
4. Verify backend session configuration

For more troubleshooting help, see [RSO_TROUBLESHOOTING.md](RSO_TROUBLESHOOTING.md).

## FAQ

### Do I need to do anything to migrate?

No, migration is automatic when you sign in with Riot for the first time.

### Will my decks be deleted?

No, all your decks and repositories are preserved. Only the authentication method changes.

### Can I still use my Gitea password?

After migration, you sign in with Riot. Your Gitea password is no longer used for the deck builder, but Gitea itself still has it.

### What if I don't have a Riot account?

You need a Riot Games account to use RSO. Create one at [Riot Games](https://www.riotgames.com/).

### Can I link multiple Riot accounts to one Gitea account?

No, each Gitea account can only be linked to one Riot account. This ensures account security.

### What happens to my Gitea token?

Your old Gitea OAuth token is no longer used. The backend manages Gitea access automatically.

### Can I switch between Riot accounts?

Yes, but each Riot account will have its own Gitea account and decks. Decks are not shared between accounts.

### Is my data secure?

Yes, RSO uses OAuth 2.0 with PKCE for secure authentication. Tokens are stored in httpOnly cookies and encrypted in the database.

### What if Riot's servers are down?

If Riot authentication is unavailable, you won't be able to sign in. Your decks remain safe in Gitea.

### Can I export my decks before migrating?

Yes, you can export decks anytime:
1. Open a deck in the editor
2. Click "Export" or copy the JSON
3. Save to your local machine

### How do I unlink my Riot account?

Contact the administrator to unlink your account. This requires database access.

## Best Practices

### Before Migration

1. **Backup your decks**: Export important decks as JSON files
2. **Note your Gitea username**: You may need it for troubleshooting
3. **Test in incognito mode**: Ensure clean browser state
4. **Clear browser cache**: Avoid conflicts with old auth tokens

### After Migration

1. **Verify all decks**: Check that all decks are accessible
2. **Test deck editing**: Make a small change to confirm write access
3. **Update bookmarks**: Update any saved links to use new auth
4. **Clear old tokens**: Remove any saved Gitea tokens from password managers

### For Organizations

1. **Communicate early**: Notify users about the migration
2. **Provide support**: Have administrators available during migration
3. **Monitor logs**: Watch for migration issues
4. **Test first**: Migrate a test account before rolling out to all users

## Support

If you encounter issues during migration:

1. **Check troubleshooting guide**: [RSO_TROUBLESHOOTING.md](RSO_TROUBLESHOOTING.md)
2. **Review setup documentation**: [RIOT_SIGN_ON_SETUP.md](RIOT_SIGN_ON_SETUP.md)
3. **Check backend logs**: Administrators can review detailed error logs
4. **Contact support**: Reach out to your administrator or support team

## Timeline

### Phase 1: Parallel Authentication (Week 1)
- Both Gitea and RSO authentication available
- Users can try RSO without losing Gitea access
- Monitoring for issues

### Phase 2: Encourage Migration (Week 2)
- Banner encouraging users to migrate
- One-click migration for existing users
- Track migration rate

### Phase 3: RSO as Primary (Week 3)
- RSO becomes default authentication method
- Gitea auth still available but hidden
- Most users migrated

### Phase 4: RSO Only (Week 4+)
- RSO is the only authentication method
- Gitea auth removed from UI
- All users migrated

## Additional Resources

- [Riot Sign-On Setup Guide](RIOT_SIGN_ON_SETUP.md)
- [Troubleshooting Guide](RSO_TROUBLESHOOTING.md)
- [API Documentation](API.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Riot Developer Portal](https://developer.riotgames.com/)
