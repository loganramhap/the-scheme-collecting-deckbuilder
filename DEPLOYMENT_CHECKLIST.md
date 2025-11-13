# Deployment Checklist - Riot Sign-On

Use this checklist to ensure a smooth deployment of the Riot Sign-On feature.

## Pre-Deployment

### Riot Developer Portal
- [ ] OAuth application registered
- [ ] Production redirect URI added: `https://yourdomain.com/auth/callback`
- [ ] Client ID and Client Secret obtained
- [ ] Production API key requested (optional, for card data)

### AWS Setup
- [ ] AWS account created
- [ ] IAM user created with DynamoDB permissions
- [ ] Access keys generated and saved securely
- [ ] Region selected (e.g., us-east-1)

### Environment Configuration
- [ ] `deckbuilder-api/.env.production` created from template
- [ ] All required variables filled in:
  - [ ] `RIOT_CLIENT_ID`
  - [ ] `RIOT_CLIENT_SECRET`
  - [ ] `RIOT_REDIRECT_URI`
  - [ ] `SESSION_SECRET` (generated with `openssl rand -base64 32`)
  - [ ] `ENCRYPTION_KEY` (generated with `openssl rand -base64 32`)
  - [ ] `AWS_REGION`
  - [ ] `AWS_ACCESS_KEY_ID`
  - [ ] `AWS_SECRET_ACCESS_KEY`
  - [ ] `DYNAMODB_USERS_TABLE`
  - [ ] `DYNAMODB_SESSIONS_TABLE`
  - [ ] `GITEA_ADMIN_TOKEN`
  - [ ] `FRONTEND_URL`
- [ ] `deckbuilder-webapp/.env.production` created from template
- [ ] Frontend environment variables configured

### Server Setup
- [ ] Server provisioned (Lightsail, EC2, or VPS)
- [ ] Docker and Docker Compose installed
- [ ] Nginx installed (if using)
- [ ] SSL certificate obtained (Let's Encrypt or AWS Certificate Manager)
- [ ] Domain DNS configured
- [ ] Firewall ports opened (80, 443, 3001)

## Database Setup

- [ ] DynamoDB tables created:
  ```bash
  cd deckbuilder-api
  npm install
  npm run setup:dynamodb
  ```
- [ ] Tables verified:
  - [ ] `deckbuilder-users-prod` exists
  - [ ] `deckbuilder-sessions-prod` exists
  - [ ] GiteaUsernameIndex created
  - [ ] TTL enabled on sessions table
- [ ] Point-in-time recovery enabled (production):
  ```bash
  aws dynamodb update-continuous-backups \
    --table-name deckbuilder-users-prod \
    --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
  ```

## Backend Deployment

- [ ] Code pulled to server:
  ```bash
  git clone <repository-url>
  cd <repository>
  ```
- [ ] Environment file in place: `deckbuilder-api/.env.production`
- [ ] Backend deployed:
  ```bash
  chmod +x deploy-backend.sh
  ./deploy-backend.sh
  ```
- [ ] API health check passes:
  ```bash
  curl http://localhost:3001/api/health
  # Expected: {"status":"ok","timestamp":"..."}
  ```
- [ ] Environment validation passed (check logs)
- [ ] Docker containers running:
  ```bash
  docker-compose ps
  # Should show: api, gitea, db all "Up"
  ```

## Frontend Deployment

- [ ] Environment file in place: `deckbuilder-webapp/.env.production`
- [ ] Frontend built and deployed:
  ```bash
  chmod +x deploy-frontend.sh
  ./deploy-frontend.sh
  ```
- [ ] Build completed without errors
- [ ] Static files deployed to web server or CDN
- [ ] Nginx configured (if applicable)
- [ ] Nginx configuration tested:
  ```bash
  sudo nginx -t
  ```
- [ ] Nginx reloaded:
  ```bash
  sudo systemctl reload nginx
  ```

## SSL/HTTPS Configuration

- [ ] SSL certificate installed
- [ ] HTTPS enabled
- [ ] HTTP to HTTPS redirect configured
- [ ] Certificate auto-renewal configured (Let's Encrypt)
- [ ] SSL test passed: https://www.ssllabs.com/ssltest/

## OAuth Configuration Verification

- [ ] Redirect URI in Riot portal matches backend config exactly
- [ ] Protocol correct (https:// for production)
- [ ] No trailing slashes
- [ ] Domain matches exactly
- [ ] Multiple environments configured if needed (staging, production)

## Post-Deployment Verification

### Automated Tests
- [ ] Run verification script:
  ```bash
  chmod +x verify-deployment.sh
  ./verify-deployment.sh
  ```
- [ ] All critical tests passed

### Manual Testing
- [ ] Visit production URL: `https://yourdomain.com`
- [ ] Homepage loads correctly
- [ ] No console errors in browser
- [ ] Click "Sign in with Riot Games"
- [ ] Redirected to Riot authorization page
- [ ] Authorize application
- [ ] Redirected back to application
- [ ] User logged in successfully
- [ ] User profile displays correctly (game name, tag)
- [ ] Create a new deck
- [ ] Save deck
- [ ] Reload page
- [ ] Deck persists
- [ ] Edit deck
- [ ] Save changes
- [ ] Changes persist
- [ ] Log out
- [ ] Redirected to login page
- [ ] Log in again
- [ ] Session restored
- [ ] Deck still available

### Error Scenarios
- [ ] Test with invalid OAuth state (should show error)
- [ ] Test with expired session (should redirect to login)
- [ ] Test network error handling
- [ ] Verify error messages are user-friendly

## Monitoring Setup

- [ ] CloudWatch alarms configured:
  - [ ] High read capacity (>80%)
  - [ ] High write capacity (>80%)
  - [ ] API errors (>10/min)
  - [ ] Throttled requests (>0)
- [ ] Application logging configured
- [ ] Log aggregation set up (CloudWatch Logs, Datadog, etc.)
- [ ] Uptime monitoring configured (UptimeRobot, Pingdom, etc.)
  - [ ] Monitor: `https://yourdomain.com/api/health`
  - [ ] Frequency: Every 5 minutes
  - [ ] Alert on: Status code != 200

## Backup Configuration

- [ ] Initial backup created:
  ```bash
  cd deckbuilder-api
  npm run db:backup
  ```
- [ ] Backup verified in AWS console
- [ ] Automated backup schedule configured (cron job or AWS Backup)
- [ ] Backup retention policy set
- [ ] Restore procedure tested

## Documentation

- [ ] Deployment documented
- [ ] Environment variables documented
- [ ] Backup/restore procedures documented
- [ ] Rollback procedure documented
- [ ] Troubleshooting guide updated
- [ ] Team notified of deployment

## Security Review

- [ ] All secrets stored securely (not in git)
- [ ] Environment files have restricted permissions (600)
- [ ] HTTPS enforced
- [ ] CORS configured correctly
- [ ] Rate limiting enabled on auth endpoints
- [ ] Session expiry configured appropriately
- [ ] Cookie security flags set (httpOnly, secure, sameSite)
- [ ] Database access restricted (IAM policies)
- [ ] Server firewall configured
- [ ] Security headers configured in Nginx

## Performance

- [ ] Frontend assets compressed (gzip)
- [ ] Static assets cached
- [ ] CDN configured (if applicable)
- [ ] Database indexes verified
- [ ] API response times acceptable (<200ms)
- [ ] Page load times acceptable (<3s)

## Rollback Plan

- [ ] Previous version tagged in git
- [ ] Database backup created before deployment
- [ ] Rollback procedure documented
- [ ] Rollback tested (if possible)

## Post-Deployment Tasks

### Immediate (within 1 hour)
- [ ] Monitor error logs
- [ ] Check CloudWatch metrics
- [ ] Verify user signups working
- [ ] Test from different devices/browsers
- [ ] Monitor API response times

### First 24 Hours
- [ ] Review all error logs
- [ ] Check database capacity usage
- [ ] Monitor session creation/expiration
- [ ] Verify backup completed successfully
- [ ] Check SSL certificate expiry date

### First Week
- [ ] Review user feedback
- [ ] Analyze usage patterns
- [ ] Optimize capacity if needed
- [ ] Review and address any issues
- [ ] Update documentation based on learnings

## Troubleshooting

If issues occur:

1. **Check logs**:
   ```bash
   docker-compose logs -f api
   docker-compose logs -f gitea
   ```

2. **Verify environment variables**:
   ```bash
   docker-compose exec api env | grep RIOT
   ```

3. **Check database connectivity**:
   ```bash
   aws dynamodb describe-table --table-name deckbuilder-users-prod
   ```

4. **Test API endpoints**:
   ```bash
   curl https://yourdomain.com/api/health
   curl https://yourdomain.com/api/auth/riot/init
   ```

5. **Review Riot Developer Portal**:
   - Verify redirect URI
   - Check application status
   - Review API key status

6. **Check SSL certificate**:
   ```bash
   openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
   ```

## Rollback Procedure

If critical issues occur:

1. **Stop new deployment**:
   ```bash
   docker-compose down
   ```

2. **Restore previous version**:
   ```bash
   git checkout <previous-tag>
   docker-compose up -d
   ```

3. **Restore database** (if needed):
   ```bash
   aws dynamodb restore-table-from-backup \
     --target-table-name deckbuilder-users-prod \
     --backup-arn <backup-arn>
   ```

4. **Verify rollback**:
   ```bash
   ./verify-deployment.sh
   ```

5. **Notify team**

## Success Criteria

Deployment is successful when:

- ✅ All automated tests pass
- ✅ Manual testing completes without errors
- ✅ Users can sign in with Riot accounts
- ✅ Decks can be created and saved
- ✅ Sessions persist correctly
- ✅ No critical errors in logs
- ✅ API response times < 200ms
- ✅ Page load times < 3s
- ✅ SSL certificate valid
- ✅ Monitoring and alerts active
- ✅ Backups configured and working

## Notes

- Keep this checklist updated with each deployment
- Document any issues encountered and solutions
- Share learnings with the team
- Update deployment scripts based on experience

## Support Contacts

- AWS Support: https://console.aws.amazon.com/support/
- Riot Developer Support: https://developer.riotgames.com/
- Team Lead: [contact info]
- DevOps: [contact info]

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Version**: _______________
**Notes**: _______________
