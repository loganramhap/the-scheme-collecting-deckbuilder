# DynamoDB Database Setup

This directory contains the DynamoDB configuration, table setup, and repositories for the DeckBuilder API.

## Why DynamoDB?

DynamoDB is a fully managed, serverless NoSQL database that:
- Scales automatically with your application
- Works seamlessly with AWS Lambda (serverless)
- Has built-in TTL for automatic session cleanup
- Offers consistent performance at any scale
- Requires no server management or maintenance

## Prerequisites

- AWS Account
- AWS CLI configured with credentials
- Node.js 18+ installed

## Quick Start

### 1. Configure AWS Credentials

**Option A: Using AWS CLI**
```bash
aws configure
```

**Option B: Using Environment Variables**
Add to your `.env` file:
```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

**Option C: Using IAM Role (Recommended for EC2/Lambda)**
No configuration needed - the SDK will automatically use the instance/function role.

### 2. Configure Table Names

Update `.env` with your table names:
```
DYNAMODB_USERS_TABLE=deckbuilder-users
DYNAMODB_SESSIONS_TABLE=deckbuilder-sessions
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Create DynamoDB Tables

```bash
npm run setup:dynamodb
```

This will create two tables with the following structure:

## Database Schema

### Users Table

**Primary Key:** `puuid` (String) - Riot Games Player UUID

**Attributes:**
- `puuid` (String) - Riot Games Player UUID (Primary Key)
- `giteaUsername` (String) - Associated Gitea username
- `giteaPasswordEncrypted` (String) - Encrypted Gitea password
- `gameName` (String) - Riot Games display name
- `tagLine` (String) - Riot Games tag line
- `summonerIcon` (Number) - Summoner icon ID (optional)
- `createdAt` (String) - ISO timestamp of account creation
- `lastLogin` (String) - ISO timestamp of last login

**Global Secondary Index:**
- `GiteaUsernameIndex` on `giteaUsername` - For looking up users by Gitea username

### Sessions Table

**Primary Key:** `sessionId` (String) - Unique session identifier

**Attributes:**
- `sessionId` (String) - Unique session identifier (Primary Key)
- `data` (Object) - Session data (tokens, state, etc.)
- `expiresAt` (Number) - Unix timestamp for expiration
- `createdAt` (String) - ISO timestamp of session creation

**Global Secondary Index:**
- `ExpiresAtIndex` on `expiresAt` - For querying sessions by expiration

**TTL (Time To Live):**
- Enabled on `expiresAt` - DynamoDB automatically deletes expired sessions

## Usage

### User Repository

```javascript
import UserRepository from './db/repositories/UserRepository.js';

// Create a new user
const user = await UserRepository.create({
  puuid: 'abc123...',
  giteaUsername: 'player1',
  giteaPasswordEncrypted: 'encrypted_password',
  gameName: 'PlayerOne',
  tagLine: 'NA1',
  summonerIcon: 1234,
});

// Find user by PUUID
const user = await UserRepository.findByPuuid('abc123...');

// Find user by Gitea username
const user = await UserRepository.findByGiteaUsername('player1');

// Update user
await UserRepository.update('abc123...', {
  gameName: 'NewName',
  tagLine: 'EUW',
});

// Update last login
await UserRepository.updateLastLogin('abc123...');

// Update Gitea password
await UserRepository.updateGiteaPassword('abc123...', 'new_encrypted_password');
```

### Session Repository

```javascript
import SessionRepository from './db/repositories/SessionRepository.js';

// Create a new session (expires in 24 hours by default)
const session = await SessionRepository.create('session_id_123', {
  puuid: 'abc123...',
  accessToken: 'token...',
  refreshToken: 'refresh...',
});

// Create session with custom expiry (1 hour)
const session = await SessionRepository.create('session_id_123', data, 3600);

// Find session by ID
const session = await SessionRepository.findById('session_id_123');

// Update session
await SessionRepository.update('session_id_123', newData);

// Extend session expiry
await SessionRepository.extend('session_id_123', 86400);

// Delete session
await SessionRepository.delete('session_id_123');
```

## Billing & Costs

### Provisioned Capacity (Default)
- **Users Table:** 5 RCU / 5 WCU
- **Sessions Table:** 5 RCU / 5 WCU
- **Cost:** ~$2.50/month for light usage

### On-Demand Pricing (Recommended for Production)
To switch to on-demand pricing, modify `src/db/setup.js`:
```javascript
BillingMode: 'PAY_PER_REQUEST',
// Remove ProvisionedThroughput
```

**Cost:** Pay only for what you use
- $1.25 per million write requests
- $0.25 per million read requests

## Serverless Deployment

When deploying to AWS Lambda, DynamoDB works seamlessly:

1. **No connection pooling needed** - DynamoDB is HTTP-based
2. **Automatic scaling** - Handles any load
3. **IAM role authentication** - No credentials in code
4. **Low latency** - Single-digit millisecond response times

### Lambda IAM Policy

Your Lambda function needs these permissions:

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
        "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/deckbuilder-users",
        "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/deckbuilder-users/index/*",
        "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/deckbuilder-sessions",
        "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/deckbuilder-sessions/index/*"
      ]
    }
  ]
}
```

## Local Development

### Using DynamoDB Local

For local development without AWS costs:

```bash
# Install DynamoDB Local
docker run -p 8000:8000 amazon/dynamodb-local

# Update .env
AWS_ENDPOINT=http://localhost:8000
```

Update `src/db/config.js` to use local endpoint:
```javascript
const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  ...(process.env.AWS_ENDPOINT && {
    endpoint: process.env.AWS_ENDPOINT,
  }),
});
```

## Migration from PostgreSQL

If migrating from PostgreSQL:

1. Export existing data
2. Transform to DynamoDB format
3. Use batch write operations to import
4. Update application code to use repositories

## Monitoring

### AWS Console
- View table metrics in DynamoDB console
- Monitor read/write capacity usage
- Check for throttled requests

### CloudWatch Alarms
Set up alarms for:
- High read/write capacity usage
- Throttled requests
- System errors

## Troubleshooting

### Access Denied
- Verify AWS credentials are configured
- Check IAM permissions for DynamoDB
- Ensure table names match environment variables

### Table Already Exists
- Normal if running setup multiple times
- Tables are not recreated if they exist

### Throttling
- Increase provisioned capacity
- Switch to on-demand billing mode
- Implement exponential backoff retry logic

### Session Not Found
- Session may have expired (TTL)
- Check `expiresAt` timestamp
- Verify session ID is correct

## Best Practices

1. **Use TTL for sessions** - Automatic cleanup, no manual deletion needed
2. **Batch operations** - Use batch write/read for multiple items
3. **Consistent naming** - Use clear, consistent attribute names
4. **Error handling** - Always handle DynamoDB exceptions
5. **Indexes** - Create GSIs for common query patterns
6. **Monitoring** - Set up CloudWatch alarms for production

## Security

1. **Encryption at rest** - Enabled by default
2. **Encryption in transit** - All API calls use HTTPS
3. **IAM policies** - Use least privilege access
4. **VPC endpoints** - Use VPC endpoints for private access
5. **Audit logging** - Enable CloudTrail for DynamoDB API calls

## Performance Tips

1. **Use Query instead of Scan** - Much more efficient
2. **Limit result sets** - Use pagination for large queries
3. **Avoid hot partitions** - Distribute writes across partition keys
4. **Use projection expressions** - Only fetch needed attributes
5. **Batch operations** - Reduce API calls with batch operations

## Resources

- [DynamoDB Developer Guide](https://docs.aws.amazon.com/dynamodb/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/sdk-for-javascript/v3/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
