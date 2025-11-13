# Database Management Guide

This guide covers managing DynamoDB tables for the Zaunite Workshop application.

## Table of Contents

1. [Overview](#overview)
2. [Table Structure](#table-structure)
3. [Setup and Migration](#setup-and-migration)
4. [Backup and Restore](#backup-and-restore)
5. [Monitoring](#monitoring)
6. [Maintenance](#maintenance)
7. [Troubleshooting](#troubleshooting)

## Overview

The application uses two DynamoDB tables:

- **Users Table**: Stores user accounts and Riot/Gitea mappings
- **Sessions Table**: Stores user sessions with automatic expiration (TTL)

### Why DynamoDB?

- **Serverless**: No server management required
- **Scalable**: Automatically scales with traffic
- **Cost-effective**: Pay only for what you use
- **Reliable**: Built-in replication and backups
- **Fast**: Single-digit millisecond latency

## Table Structure

### Users Table

**Table Name**: `deckbuilder-users-prod` (or configured name)

**Primary Key**:
- `puuid` (String, HASH) - Riot Player Universally Unique Identifier

**Attributes**:
```javascript
{
  puuid: "string",                    // Primary key
  giteaUsername: "string",            // Gitea account username
  giteaPasswordEncrypted: "string",   // Encrypted Gitea password
  gameName: "string",                 // Riot game name
  tagLine: "string",                  // Riot tag line
  summonerIcon: number,               // Optional summoner icon ID
  createdAt: "ISO timestamp",         // Account creation time
  lastLogin: "ISO timestamp"          // Last login time
}
```

**Global Secondary Indexes**:
- `GiteaUsernameIndex` on `giteaUsername`
  - Used to look up users by Gitea username
  - Projection: ALL (includes all attributes)

**Capacity**:
- Read: 5 units (can handle ~5 reads/sec)
- Write: 5 units (can handle ~5 writes/sec)
- Auto-scaling: Can be enabled for production

### Sessions Table

**Table Name**: `deckbuilder-sessions-prod` (or configured name)

**Primary Key**:
- `sessionId` (String, HASH) - Unique session identifier

**Attributes**:
```javascript
{
  sessionId: "string",        // Primary key (UUID)
  data: {                     // Session data (Map)
    puuid: "string",
    accessToken: "string",
    refreshToken: "string",
    giteaUsername: "string",
    // ... other session data
  },
  expiresAt: number,          // Unix timestamp (TTL attribute)
  createdAt: "ISO timestamp"  // Session creation time
}
```

**Time To Live (TTL)**:
- Enabled on `expiresAt` attribute
- Automatically deletes expired sessions
- Cleanup happens within 48 hours of expiration

**Capacity**:
- Read: 5 units
- Write: 5 units

## Setup and Migration

### Initial Setup

Create tables for the first time:

```bash
cd deckbuilder-api
npm run setup:dynamodb
```

This will:
1. Create Users table with indexes
2. Create Sessions table with TTL
3. Verify tables are active
4. Display table details

### Migration

Run migrations to update existing tables:

```bash
npm run db:migrate
```

The migration script will:
1. Check if tables exist
2. Create tables if missing
3. Verify indexes and TTL
4. Enable TTL if not enabled
5. Display table status

### Manual Table Creation

If you prefer to create tables manually using AWS CLI:

#### Users Table

```bash
aws dynamodb create-table \
  --table-name deckbuilder-users-prod \
  --attribute-definitions \
    AttributeName=puuid,AttributeType=S \
    AttributeName=giteaUsername,AttributeType=S \
  --key-schema \
    AttributeName=puuid,KeyType=HASH \
  --global-secondary-indexes \
    '[{
      "IndexName": "GiteaUsernameIndex",
      "KeySchema": [{"AttributeName":"giteaUsername","KeyType":"HASH"}],
      "Projection": {"ProjectionType":"ALL"},
      "ProvisionedThroughput": {"ReadCapacityUnits":5,"WriteCapacityUnits":5}
    }]' \
  --provisioned-throughput \
    ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region us-east-1
```

#### Sessions Table

```bash
aws dynamodb create-table \
  --table-name deckbuilder-sessions-prod \
  --attribute-definitions \
    AttributeName=sessionId,AttributeType=S \
  --key-schema \
    AttributeName=sessionId,KeyType=HASH \
  --provisioned-throughput \
    ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region us-east-1

# Enable TTL
aws dynamodb update-time-to-live \
  --table-name deckbuilder-sessions-prod \
  --time-to-live-specification \
    Enabled=true,AttributeName=expiresAt \
  --region us-east-1
```

## Backup and Restore

### On-Demand Backups

Create backups of all tables:

```bash
npm run db:backup
```

This creates AWS-managed backups that:
- Are stored in AWS
- Don't affect table performance
- Can be restored to a new table
- Are retained until manually deleted

### Export to JSON

Export table data to local JSON files:

```bash
# Export to default directory (./backups)
npm run db:export

# Export to custom directory
npm run db:export /path/to/backup/dir
```

Use JSON exports for:
- Local backups
- Data analysis
- Migration to other systems
- Disaster recovery

### List Backups

View all existing backups:

```bash
npm run db:list-backups
```

### Restore from Backup

#### Using AWS Console

1. Go to DynamoDB console
2. Select "Backups" from left menu
3. Find your backup
4. Click "Restore"
5. Enter new table name
6. Click "Restore table"

#### Using AWS CLI

```bash
aws dynamodb restore-table-from-backup \
  --target-table-name deckbuilder-users-restored \
  --backup-arn arn:aws:dynamodb:us-east-1:123456789:table/deckbuilder-users-prod/backup/01234567890123-abcdef12 \
  --region us-east-1
```

### Point-in-Time Recovery (PITR)

Enable continuous backups for production:

```bash
# Enable PITR for Users table
aws dynamodb update-continuous-backups \
  --table-name deckbuilder-users-prod \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
  --region us-east-1

# Enable PITR for Sessions table
aws dynamodb update-continuous-backups \
  --table-name deckbuilder-sessions-prod \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
  --region us-east-1
```

PITR allows you to restore to any point in time within the last 35 days.

### Backup Schedule

Recommended backup schedule:

**Development**:
- Manual backups before major changes
- JSON exports weekly

**Production**:
- Enable PITR (continuous backups)
- On-demand backups before deployments
- JSON exports daily (automated via cron)

Example cron job for daily backups:

```bash
# Add to crontab
0 2 * * * cd /path/to/deckbuilder-api && npm run db:backup >> /var/log/db-backup.log 2>&1
0 3 * * * cd /path/to/deckbuilder-api && npm run db:export /backups/$(date +\%Y-\%m-\%d) >> /var/log/db-export.log 2>&1
```

## Monitoring

### CloudWatch Metrics

DynamoDB automatically sends metrics to CloudWatch:

**Key Metrics to Monitor**:
- `ConsumedReadCapacityUnits` - Read usage
- `ConsumedWriteCapacityUnits` - Write usage
- `UserErrors` - Client-side errors
- `SystemErrors` - Server-side errors
- `ThrottledRequests` - Requests exceeding capacity

### View Metrics in AWS Console

1. Go to DynamoDB console
2. Select your table
3. Click "Metrics" tab
4. View graphs for various metrics

### View Metrics with AWS CLI

```bash
# Get read capacity metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=deckbuilder-users-prod \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Sum \
  --region us-east-1
```

### Set Up Alarms

Create CloudWatch alarms for critical metrics:

```bash
# Alarm for high read capacity usage
aws cloudwatch put-metric-alarm \
  --alarm-name deckbuilder-users-high-reads \
  --alarm-description "Alert when read capacity exceeds 80%" \
  --metric-name ConsumedReadCapacityUnits \
  --namespace AWS/DynamoDB \
  --statistic Sum \
  --period 300 \
  --threshold 240 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=TableName,Value=deckbuilder-users-prod \
  --region us-east-1
```

### Application-Level Monitoring

Monitor database operations in your application:

```javascript
// Log slow queries
const startTime = Date.now();
const result = await getItem(TABLES.USERS, { puuid });
const duration = Date.now() - startTime;

if (duration > 100) {
  console.warn(`Slow query: ${duration}ms`);
}
```

## Maintenance

### Regular Tasks

**Daily**:
- Check CloudWatch metrics
- Review error logs
- Monitor capacity usage

**Weekly**:
- Review and delete old backups
- Check TTL is working (sessions being deleted)
- Review table sizes

**Monthly**:
- Analyze access patterns
- Optimize indexes if needed
- Review and adjust capacity
- Update backup retention policies

### Capacity Management

#### Check Current Capacity

```bash
aws dynamodb describe-table \
  --table-name deckbuilder-users-prod \
  --query 'Table.ProvisionedThroughput' \
  --region us-east-1
```

#### Update Capacity

```bash
# Increase read capacity
aws dynamodb update-table \
  --table-name deckbuilder-users-prod \
  --provisioned-throughput ReadCapacityUnits=10,WriteCapacityUnits=5 \
  --region us-east-1
```

#### Enable Auto-Scaling

For production, enable auto-scaling:

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace dynamodb \
  --resource-id table/deckbuilder-users-prod \
  --scalable-dimension dynamodb:table:ReadCapacityUnits \
  --min-capacity 5 \
  --max-capacity 100 \
  --region us-east-1

# Create scaling policy
aws application-autoscaling put-scaling-policy \
  --service-namespace dynamodb \
  --resource-id table/deckbuilder-users-prod \
  --scalable-dimension dynamodb:table:ReadCapacityUnits \
  --policy-name deckbuilder-users-read-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration \
    '{"TargetValue":70.0,"PredefinedMetricSpecification":{"PredefinedMetricType":"DynamoDBReadCapacityUtilization"}}' \
  --region us-east-1
```

### Session Cleanup

Sessions are automatically deleted by TTL, but you can manually clean up if needed:

```javascript
// Clean up expired sessions manually
import { scanItems, deleteItem, TABLES } from './db/config.js';

const now = Math.floor(Date.now() / 1000);
const sessions = await scanItems(TABLES.SESSIONS);

for (const session of sessions) {
  if (session.expiresAt < now) {
    await deleteItem(TABLES.SESSIONS, { sessionId: session.sessionId });
    console.log(`Deleted expired session: ${session.sessionId}`);
  }
}
```

### Data Cleanup

Remove old or invalid data:

```bash
# Export data first
npm run db:export

# Then manually review and clean up in AWS console
# Or write a cleanup script
```

## Troubleshooting

### Table Not Found

**Error**: `ResourceNotFoundException: Requested resource not found`

**Solutions**:
1. Verify table name in `.env` matches actual table name
2. Check AWS region is correct
3. Run migration: `npm run db:migrate`
4. Verify AWS credentials have access to the table

### Access Denied

**Error**: `AccessDeniedException: User is not authorized`

**Solutions**:
1. Check IAM user has DynamoDB permissions
2. Verify AWS credentials are correct
3. Check IAM policy includes required actions:
   ```json
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
       "arn:aws:dynamodb:*:*:table/deckbuilder-users-prod",
       "arn:aws:dynamodb:*:*:table/deckbuilder-users-prod/index/*",
       "arn:aws:dynamodb:*:*:table/deckbuilder-sessions-prod"
     ]
   }
   ```

### Throttling

**Error**: `ProvisionedThroughputExceededException`

**Solutions**:
1. Increase table capacity
2. Enable auto-scaling
3. Implement exponential backoff in application
4. Review access patterns and optimize queries
5. Consider using batch operations

### High Costs

**Issue**: DynamoDB costs higher than expected

**Solutions**:
1. Review capacity settings (reduce if over-provisioned)
2. Enable auto-scaling to match actual usage
3. Consider on-demand billing for unpredictable workloads
4. Review and optimize queries (avoid scans)
5. Clean up old data
6. Use TTL for automatic cleanup

### TTL Not Working

**Issue**: Expired sessions not being deleted

**Solutions**:
1. Verify TTL is enabled: `npm run db:migrate`
2. Check `expiresAt` is a Unix timestamp (number, not string)
3. Wait up to 48 hours (TTL cleanup is not immediate)
4. Verify `expiresAt` is in the past

### Backup Failed

**Error**: Backup creation failed

**Solutions**:
1. Check IAM permissions include `dynamodb:CreateBackup`
2. Verify table is in ACTIVE state
3. Check AWS service limits (max 50 backups per table)
4. Delete old backups if at limit

## Best Practices

### Security

- ✅ Use IAM roles instead of access keys when possible
- ✅ Follow principle of least privilege for IAM policies
- ✅ Encrypt sensitive data before storing (passwords, tokens)
- ✅ Enable encryption at rest (enabled by default)
- ✅ Use VPC endpoints for private access
- ✅ Regularly rotate AWS access keys

### Performance

- ✅ Use Query instead of Scan when possible
- ✅ Create indexes for common access patterns
- ✅ Use batch operations for multiple items
- ✅ Implement caching for frequently accessed data
- ✅ Use consistent reads only when necessary
- ✅ Monitor and optimize capacity

### Cost Optimization

- ✅ Use on-demand billing for unpredictable workloads
- ✅ Enable auto-scaling for provisioned capacity
- ✅ Use TTL for automatic data cleanup
- ✅ Archive old data to S3
- ✅ Review and delete unused indexes
- ✅ Monitor capacity usage regularly

### Reliability

- ✅ Enable point-in-time recovery for production
- ✅ Create regular backups
- ✅ Test restore procedures
- ✅ Use multiple availability zones (automatic)
- ✅ Implement retry logic with exponential backoff
- ✅ Monitor error rates and set up alarms

## Additional Resources

- [AWS DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [DynamoDB Pricing](https://aws.amazon.com/dynamodb/pricing/)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/)
- [DynamoDB Local](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html) (for testing)
