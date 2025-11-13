# Riot Sign-On Rollback Plan

This document outlines the procedures for rolling back Riot Sign-On (RSO) authentication in case of critical issues.

## Table of Contents

- [When to Rollback](#when-to-rollback)
- [Rollback Procedures](#rollback-procedures)
- [Emergency Contacts](#emergency-contacts)
- [Post-Rollback Actions](#post-rollback-actions)
- [Testing Rollback](#testing-rollback)

## When to Rollback

Consider rolling back RSO if:

### Critical Issues
- **Authentication completely broken**: Users cannot sign in at all
- **Data loss**: User data or decks are being corrupted or lost
- **Security breach**: Authentication vulnerability discovered
- **Gitea provisioning failures**: New users cannot get Gitea accounts
- **Riot API outage**: Extended Riot API downtime (>4 hours)

### Performance Issues
- **High error rate**: >50% authentication failure rate for >30 minutes
- **Slow response times**: Authentication taking >10 seconds consistently
- **Database issues**: DynamoDB unavailable or experiencing errors

### Business Impact
- **User complaints**: Significant number of users unable to access service
- **Revenue impact**: If service is paid, significant loss of access
- **Reputation damage**: Negative publicity or social media backlash

## Rollback Procedures

### Phase 1: Immediate Response (0-15 minutes)

#### Step 1: Assess the Situation

1. **Check monitoring dashboard**:
   ```bash
   curl http://localhost:3001/api/auth/metrics/health
   ```

2. **Review recent errors**:
   ```bash
   curl http://localhost:3001/api/auth/metrics/errors?limit=50
   ```

3. **Check backend logs**:
   ```bash
   # View last 100 lines of logs
   tail -n 100 /path/to/backend/logs
   ```

4. **Verify Riot API status**:
   - Visit [Riot Developer Portal](https://developer.riotgames.com/)
   - Check for service announcements

#### Step 2: Enable Maintenance Mode

1. **Display maintenance message on frontend**:
   
   Create `deckbuilder-webapp/public/maintenance.html`:
   ```html
   <!DOCTYPE html>
   <html>
   <head>
     <title>Maintenance - Zaunite Workshop</title>
     <style>
       body {
         font-family: Arial, sans-serif;
         text-align: center;
         padding: 50px;
         background: #1a1a2e;
         color: #eee;
       }
       h1 { color: #ff6b6b; }
       .message {
         max-width: 600px;
         margin: 20px auto;
         padding: 20px;
         background: #16213e;
         border-radius: 8px;
       }
     </style>
   </head>
   <body>
     <h1>🔧 Maintenance in Progress</h1>
     <div class="message">
       <p>We're currently performing maintenance on our authentication system.</p>
       <p>Your decks are safe. We'll be back shortly.</p>
       <p>Estimated time: 30 minutes</p>
     </div>
   </body>
   </html>
   ```

2. **Redirect all traffic to maintenance page**:
   
   Update `deckbuilder-webapp/src/App.tsx`:
   ```typescript
   // At the top of App component
   if (import.meta.env.VITE_MAINTENANCE_MODE === 'true') {
     return <MaintenancePage />;
   }
   ```

3. **Set environment variable**:
   ```bash
   # In deckbuilder-webapp/.env
   VITE_MAINTENANCE_MODE=true
   ```

4. **Rebuild and deploy frontend**:
   ```bash
   cd deckbuilder-webapp
   npm run build
   # Deploy to your hosting service
   ```

#### Step 3: Notify Stakeholders

1. **Post status update**:
   - Twitter/X
   - Discord server
   - Status page
   - Email to users (if available)

2. **Example message**:
   ```
   🔧 We're experiencing issues with sign-in and are working on a fix.
   Your decks are safe. We'll update you within 30 minutes.
   ```

### Phase 2: Rollback Execution (15-45 minutes)

#### Option A: Temporary Rollback (Keep RSO, Add Gitea Auth)

This option keeps RSO but adds Gitea authentication as a fallback.

**Step 1: Re-enable Gitea Authentication in Backend**

1. **Create Gitea auth endpoint** (`deckbuilder-api/src/routes/gitea-auth.js`):
   ```javascript
   import express from 'express';
   import axios from 'axios';
   
   const router = express.Router();
   
   // Gitea OAuth token exchange
   router.post('/gitea/token', async (req, res) => {
     const { code } = req.body;
     
     try {
       const response = await axios.post(
         `${process.env.GITEA_URL}/login/oauth/access_token`,
         {
           client_id: process.env.GITEA_CLIENT_ID,
           client_secret: process.env.GITEA_CLIENT_SECRET,
           code,
           grant_type: 'authorization_code',
           redirect_uri: process.env.GITEA_REDIRECT_URI
         }
       );
       
       res.json(response.data);
     } catch (error) {
       res.status(500).json({ error: 'Token exchange failed' });
     }
   });
   
   export default router;
   ```

2. **Register route in main app**:
   ```javascript
   // deckbuilder-api/src/index.js
   import giteaAuthRouter from './routes/gitea-auth.js';
   app.use('/api/auth', giteaAuthRouter);
   ```

3. **Restart backend**:
   ```bash
   cd deckbuilder-api
   npm run dev
   ```

**Step 2: Re-enable Gitea Login in Frontend**

1. **Update Login component** (`deckbuilder-webapp/src/pages/Login.tsx`):
   ```typescript
   // Add Gitea login button below RSO button
   <button onClick={handleGiteaLogin}>
     Sign in with Gitea (Temporary)
   </button>
   ```

2. **Implement Gitea login handler**:
   ```typescript
   const handleGiteaLogin = () => {
     const giteaAuthUrl = `${import.meta.env.VITE_GITEA_URL}/login/oauth/authorize?client_id=${import.meta.env.VITE_GITEA_CLIENT_ID}&redirect_uri=${import.meta.env.VITE_GITEA_REDIRECT_URI}&response_type=code`;
     window.location.href = giteaAuthUrl;
   };
   ```

3. **Rebuild and deploy**:
   ```bash
   cd deckbuilder-webapp
   npm run build
   # Deploy
   ```

**Step 3: Update Maintenance Message**

```html
<p>Authentication is now available via Gitea.</p>
<p>Riot Sign-On will be restored shortly.</p>
```

#### Option B: Full Rollback (Remove RSO, Gitea Only)

This option completely removes RSO and reverts to Gitea-only authentication.

**Step 1: Disable RSO Endpoints**

1. **Comment out RSO routes** (`deckbuilder-api/src/index.js`):
   ```javascript
   // import authRouter from './routes/auth.js';
   // app.use('/api/auth', authRouter);
   ```

2. **Restart backend**:
   ```bash
   cd deckbuilder-api
   npm run dev
   ```

**Step 2: Revert Frontend to Gitea Auth**

1. **Restore old Login component**:
   ```bash
   cd deckbuilder-webapp
   git checkout <commit-before-rso> -- src/pages/Login.tsx
   git checkout <commit-before-rso> -- src/store/auth.ts
   ```

2. **Update environment variables**:
   ```bash
   # Remove RSO variables
   # VITE_API_URL=http://localhost:3001/api
   
   # Add Gitea variables
   VITE_GITEA_URL=http://localhost:3000
   VITE_GITEA_CLIENT_ID=your_gitea_client_id
   VITE_GITEA_CLIENT_SECRET=your_gitea_client_secret
   VITE_GITEA_REDIRECT_URI=http://localhost:5173/auth/callback
   ```

3. **Rebuild and deploy**:
   ```bash
   npm run build
   # Deploy
   ```

**Step 3: Preserve User Data**

Users who signed in with RSO will need to:

1. **Link their Gitea account manually**:
   - Admin provides Gitea credentials
   - User signs in with Gitea
   - Data remains accessible

2. **Export DynamoDB user mappings**:
   ```bash
   aws dynamodb scan --table-name deckbuilder-users > user-mappings-backup.json
   ```

### Phase 3: Verification (45-60 minutes)

#### Step 1: Test Authentication

1. **Test Gitea login**:
   - Open application in incognito mode
   - Click "Sign in with Gitea"
   - Verify successful login
   - Check deck access

2. **Test existing user**:
   - Sign in with existing Gitea account
   - Verify decks are accessible
   - Test deck editing

3. **Test new user**:
   - Create new Gitea account
   - Sign in
   - Create test deck

#### Step 2: Monitor Metrics

1. **Check authentication success rate**:
   ```bash
   curl http://localhost:3001/api/auth/metrics
   ```

2. **Monitor error logs**:
   ```bash
   tail -f /path/to/backend/logs | grep ERROR
   ```

3. **Check user feedback**:
   - Monitor support channels
   - Check social media mentions
   - Review error reports

#### Step 3: Disable Maintenance Mode

1. **Remove maintenance mode**:
   ```bash
   # In deckbuilder-webapp/.env
   VITE_MAINTENANCE_MODE=false
   ```

2. **Rebuild and deploy**:
   ```bash
   cd deckbuilder-webapp
   npm run build
   # Deploy
   ```

3. **Announce restoration**:
   ```
   ✅ Authentication has been restored. You can now sign in with Gitea.
   We're working on bringing back Riot Sign-On. Thank you for your patience.
   ```

## Emergency Contacts

### Technical Team
- **Backend Lead**: [Name] - [Email] - [Phone]
- **Frontend Lead**: [Name] - [Email] - [Phone]
- **DevOps**: [Name] - [Email] - [Phone]
- **On-Call Engineer**: [Phone] - [Pager]

### External Services
- **Riot Developer Support**: https://developer.riotgames.com/support
- **AWS Support**: [Account Number] - [Support Plan]
- **Hosting Provider**: [Support Contact]

### Communication Channels
- **Internal Slack**: #incidents
- **Status Page**: https://status.yourdomain.com
- **Twitter**: @YourHandle
- **Discord**: #announcements

## Post-Rollback Actions

### Immediate (Within 24 hours)

1. **Root Cause Analysis**:
   - Review logs and metrics
   - Identify what went wrong
   - Document timeline of events
   - Create incident report

2. **User Communication**:
   - Post detailed explanation
   - Apologize for inconvenience
   - Explain what happened (high-level)
   - Share timeline for RSO restoration

3. **Data Verification**:
   - Verify no data loss
   - Check all user accounts accessible
   - Audit deck repositories
   - Confirm Gitea integrity

### Short-term (Within 1 week)

1. **Fix Root Cause**:
   - Implement fix for identified issue
   - Add additional monitoring
   - Improve error handling
   - Update documentation

2. **Testing**:
   - Test fix in staging environment
   - Perform load testing
   - Conduct security audit
   - User acceptance testing

3. **Prepare for Re-deployment**:
   - Create detailed deployment plan
   - Schedule maintenance window
   - Prepare rollback procedure (again)
   - Notify users in advance

### Long-term (Within 1 month)

1. **Improve Resilience**:
   - Add circuit breakers
   - Implement graceful degradation
   - Add fallback authentication
   - Improve monitoring and alerting

2. **Documentation**:
   - Update rollback procedures
   - Document lessons learned
   - Create runbooks for common issues
   - Train team on procedures

3. **Process Improvements**:
   - Review deployment process
   - Improve testing procedures
   - Enhance monitoring
   - Update incident response plan

## Testing Rollback

### Staging Environment Test

Regularly test rollback procedures in staging:

1. **Schedule quarterly rollback drills**:
   - Simulate RSO failure
   - Execute rollback procedure
   - Time each step
   - Document issues

2. **Verify rollback works**:
   - Test Gitea authentication
   - Verify data integrity
   - Check all features work
   - Measure downtime

3. **Update procedures**:
   - Fix any issues found
   - Update documentation
   - Train team on changes
   - Review with stakeholders

### Rollback Checklist

Use this checklist during actual rollback:

- [ ] Assess situation and confirm rollback needed
- [ ] Notify team and stakeholders
- [ ] Enable maintenance mode
- [ ] Post status update
- [ ] Backup current state (code, database, configs)
- [ ] Disable RSO endpoints
- [ ] Re-enable Gitea authentication
- [ ] Deploy frontend changes
- [ ] Test authentication works
- [ ] Verify data integrity
- [ ] Monitor error rates
- [ ] Disable maintenance mode
- [ ] Post restoration announcement
- [ ] Begin root cause analysis
- [ ] Schedule post-mortem meeting

## Rollback Decision Matrix

| Issue | Severity | Rollback? | Timeline |
|-------|----------|-----------|----------|
| 100% auth failure | Critical | Yes | Immediate |
| >50% auth failure | High | Yes | Within 30 min |
| 25-50% auth failure | Medium | Maybe | Within 1 hour |
| <25% auth failure | Low | No | Monitor and fix |
| Slow auth (>10s) | Medium | Maybe | Within 1 hour |
| Gitea provisioning fails | High | Yes | Within 30 min |
| Riot API down | High | Yes | If >4 hours |
| DynamoDB issues | Critical | Yes | Immediate |
| Security vulnerability | Critical | Yes | Immediate |
| Minor bugs | Low | No | Fix forward |

## Success Criteria

Rollback is successful when:

1. **Authentication works**: Users can sign in with Gitea
2. **No data loss**: All decks and repositories accessible
3. **Error rate normal**: <5% authentication failure rate
4. **Performance acceptable**: Auth completes in <3 seconds
5. **User satisfaction**: Minimal complaints, positive feedback

## Rollback Metrics

Track these metrics during and after rollback:

- **Time to detect issue**: From first error to awareness
- **Time to decision**: From awareness to rollback decision
- **Time to rollback**: From decision to completion
- **Total downtime**: From issue start to restoration
- **Users affected**: Number of users unable to access
- **Data integrity**: Any data loss or corruption
- **Recovery time**: Time to restore RSO (if applicable)

## Prevention

To minimize need for rollback:

1. **Thorough testing**: Test RSO extensively before deployment
2. **Gradual rollout**: Deploy to small percentage of users first
3. **Feature flags**: Use flags to enable/disable RSO
4. **Monitoring**: Comprehensive monitoring and alerting
5. **Fallback**: Always have Gitea auth as fallback
6. **Documentation**: Keep procedures up to date
7. **Training**: Ensure team knows rollback procedures
8. **Drills**: Practice rollback regularly

## Conclusion

This rollback plan ensures we can quickly restore service if RSO encounters critical issues. Regular testing and updates to this plan are essential for maintaining readiness.

**Last Updated**: [Date]  
**Next Review**: [Date + 3 months]  
**Owner**: [Team/Person]
