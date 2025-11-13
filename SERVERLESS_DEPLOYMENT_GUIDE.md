# Serverless Deployment Guide - Zaunite Workshop

## 🎯 Full Serverless Architecture (No Gitea!)

Replace Gitea with AWS services for a fully serverless, scalable solution.

### What Changes:
- ❌ **Remove:** Gitea (Git-based storage)
- ✅ **Add:** DynamoDB (NoSQL database)
- ✅ **Add:** Cognito (User authentication + Riot SSO)
- ✅ **Add:** Lambda (Backend API)
- ✅ **Keep:** S3 + CloudFront (Frontend)

---

## 📊 Architecture

```
User Browser
    ↓
CloudFront (CDN) → S3 (React App)
    ↓
API Gateway (REST API)
    ↓
Lambda Functions (Backend Logic)
    ↓
DynamoDB (Deck Storage)
    ↓
Cognito (Authentication + Riot SSO)
```

---

## 💰 Cost Estimate

### Low Traffic (100 users/month):
```
S3 Storage (5GB)              $ 0.12
CloudFront (10GB transfer)    $ 0.85
Lambda (100k requests)        $ 0.00 (free tier)
API Gateway (100k requests)   $ 0.35
DynamoDB (1GB)                $ 0.00 (free tier)
Cognito (100 MAU)             $ 0.00 (free tier)
Route 53                      $ 0.50
──────────────────────────────────
TOTAL                         $ 1.82/month
```

### Medium Traffic (1,000 users/month):
```
S3 Storage (10GB)             $ 0.23
CloudFront (100GB transfer)   $ 8.50
Lambda (1M requests)          $ 0.20
API Gateway (1M requests)     $ 3.50
DynamoDB (5GB)                $ 1.25
Cognito (1,000 MAU)           $ 0.00 (free tier)
Route 53                      $ 0.50
──────────────────────────────────
TOTAL                         $14.18/month
```

**Much cheaper than Lightsail at low traffic!**

---

## 🚀 Deployment Method: AWS Amplify CLI

The easiest way to deploy serverless is using **AWS Amplify CLI** - it sets up everything automatically.

### Step 1: Install Amplify CLI (2 minutes)

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Configure with your AWS account
amplify configure
```

Follow prompts:
1. Sign in to AWS Console
2. Create IAM user
3. Save access keys
4. Configure CLI with keys

### Step 2: Initialize Amplify (3 minutes)

```bash
cd deckbuilder-webapp

# Initialize Amplify
amplify init
```

Answer prompts:
```
? Enter a name for the project: zauniteworkshop
? Enter a name for the environment: prod
? Choose your default editor: Visual Studio Code
? Choose the type of app: javascript
? What javascript framework: react
? Source Directory Path: src
? Distribution Directory Path: dist
? Build Command: npm run build
? Start Command: npm run dev
? Do you want to use an AWS profile? Yes
? Please choose the profile: default
```

### Step 3: Add Hosting (1 minute)

```bash
# Add S3 + CloudFront hosting
amplify add hosting
```

Choose:
```
? Select the plugin module: Hosting with Amplify Console
? Choose a type: Manual deployment
```

### Step 4: Add Authentication (2 minutes)

```bash
# Add Cognito authentication
amplify add auth
```

Choose:
```
? Do you want to use the default authentication: Default configuration with Social Provider
? How do you want users to sign in? Username
? Do you want to configure advanced settings? No
? What domain name prefix: zauniteworkshop
? Enter your redirect signin URI: https://zauniteworkshop.com/auth/callback
? Do you want to add another redirect signin URI? No
? Enter your redirect signout URI: https://zauniteworkshop.com/
? Do you want to add another redirect signout URI? No
? Select the social providers: (We'll add Riot SSO later)
```

### Step 5: Add API (3 minutes)

```bash
# Add API Gateway + Lambda
amplify add api
```

Choose:
```
? Select from one of the below mentioned services: REST
? Provide a friendly name for your resource: deckapi
? Provide a path: /decks
? Choose a Lambda source: Create a new Lambda function
? Provide a friendly name: deckFunction
? Provide the Lambda function name: deckFunction
? Choose the runtime: NodeJS
? Choose the function template: CRUD function for DynamoDB
? Do you want to access other resources? No
? Do you want to invoke this function on a recurring schedule? No
? Do you want to configure Lambda layers? No
? Do you want to edit the local lambda function now? No
? Restrict API access? Yes
? Who should have access? Authenticated users only
? What kind of access do you want? create, read, update, delete
? Do you want to add another path? No
```

### Step 6: Add Database (2 minutes)

```bash
# Add DynamoDB
amplify add storage
```

Choose:
```
? Select from one of the below mentioned services: NoSQL Database
? Provide a friendly name: decksTable
? Provide table name: Decks
? What would you like to name this column: userId
? Choose the data type: string
? Would you like to add another column? Yes
? What would you like to name this column: deckId
? Choose the data type: string
? Would you like to add another column? No
? Choose partition key: userId
? Choose sort key: deckId
? Do you want to add a Lambda Trigger? No
```

### Step 7: Deploy Everything! (5-10 minutes)

```bash
# Deploy all services
amplify push
```

This will:
- ✅ Create S3 bucket
- ✅ Create CloudFront distribution
- ✅ Create DynamoDB table
- ✅ Create Lambda functions
- ✅ Create API Gateway
- ✅ Create Cognito user pool
- ✅ Deploy your React app

### Step 8: Publish Frontend (2 minutes)

```bash
# Build and deploy frontend
amplify publish
```

Your site is now live at a temporary URL like:
`https://prod.d1234567890.amplifyapp.com`

---

## 🌐 Step 9: Add Custom Domain (5 minutes)

### In Amplify Console:

1. Go to https://console.aws.amazon.com/amplify/
2. Click your app
3. Go to **Domain management**
4. Click **Add domain**
5. Enter: `zauniteworkshop.com`
6. Amplify will:
   - Create SSL certificate
   - Set up CloudFront
   - Give you DNS records

### Update DNS:

1. Go to Route 53
2. Create hosted zone for `zauniteworkshop.com`
3. Add the records Amplify provides
4. Update nameservers at your registrar

⏱️ Wait 5-60 minutes for DNS propagation

---

## 💻 Code Changes Needed

### 1. Install Amplify Libraries

```bash
cd deckbuilder-webapp
npm install aws-amplify @aws-amplify/ui-react
```

### 2. Configure Amplify in Your App

Create `src/aws-exports.js` (auto-generated by Amplify CLI)

Update `src/main.tsx`:

```typescript
import { Amplify } from 'aws-amplify';
import awsconfig from './aws-exports';

Amplify.configure(awsconfig);

// Rest of your app...
```

### 3. Replace Gitea Service with Amplify API

Create `src/services/amplifyDeckService.ts`:

```typescript
import { API } from 'aws-amplify';

export class AmplifyDeckService {
  async listDecks() {
    return await API.get('deckapi', '/decks', {});
  }

  async getDeck(deckId: string) {
    return await API.get('deckapi', `/decks/${deckId}`, {});
  }

  async createDeck(deck: any) {
    return await API.post('deckapi', '/decks', {
      body: deck
    });
  }

  async updateDeck(deckId: string, deck: any) {
    return await API.put('deckapi', `/decks/${deckId}`, {
      body: deck
    });
  }

  async deleteDeck(deckId: string) {
    return await API.del('deckapi', `/decks/${deckId}`, {});
  }
}
```

### 4. Replace Gitea Auth with Cognito

Update `src/services/auth.ts`:

```typescript
import { Auth } from 'aws-amplify';

export async function signUp(username: string, password: string, email: string) {
  return await Auth.signUp({
    username,
    password,
    attributes: { email }
  });
}

export async function signIn(username: string, password: string) {
  return await Auth.signIn(username, password);
}

export async function signOut() {
  return await Auth.signOut();
}

export async function getCurrentUser() {
  return await Auth.currentAuthenticatedUser();
}

// For Riot SSO (add later)
export async function signInWithRiot() {
  return await Auth.federatedSignIn({ provider: 'Riot' as any });
}
```

### 5. Update Components to Use Amplify

Replace all `giteaService` calls with `amplifyDeckService`:

```typescript
// Before:
import { giteaService } from '../services/gitea';
const decks = await giteaService.listDecks(username);

// After:
import { amplifyDeckService } from '../services/amplifyDeckService';
const decks = await amplifyDeckService.listDecks();
```

---

## 🔐 Add Riot Sign-On (Later)

### Step 1: Register with Riot

1. Go to Riot Developer Portal
2. Register OAuth application
3. Get Client ID and Secret
4. Set redirect URI: `https://zauniteworkshop.com/auth/callback`

### Step 2: Configure Cognito

```bash
amplify update auth
```

Add Riot as identity provider:
```
? Do you want to add User Pool Groups? No
? Do you want to add an admin queries API? No
? Do you want to configure advanced settings? Yes
? What attributes are required for signup? Email
? Do you want to enable any of the following capabilities? OAuth 2.0
? What domain name prefix do you want to use? zauniteworkshop
? Enter your redirect signin URI: https://zauniteworkshop.com/auth/callback
? Do you want to add another redirect signin URI? No
? Enter your redirect signout URI: https://zauniteworkshop.com/
? Do you want to add another redirect signout URI? No
? Select the identity providers: Custom Provider
? Enter your provider name: Riot
? Enter your client id: YOUR_RIOT_CLIENT_ID
? Enter your client secret: YOUR_RIOT_CLIENT_SECRET
? Enter your authorize scopes: openid profile email
? Enter your authorize URL: https://auth.riotgames.com/authorize
? Enter your token URL: https://auth.riotgames.com/token
? Enter your attributes request method: GET
? Enter your attributes URL: https://auth.riotgames.com/userinfo
```

### Step 3: Deploy

```bash
amplify push
```

---

## 📝 Lambda Function Example

Amplify creates Lambda functions automatically, but here's what they look like:

`amplify/backend/function/deckFunction/src/app.js`:

```javascript
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const tableName = process.env.STORAGE_DECKS_NAME;

// List user's decks
app.get('/decks', async (req, res) => {
  const userId = req.apiGateway.event.requestContext.identity.cognitoIdentityId;
  
  const params = {
    TableName: tableName,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    }
  };
  
  try {
    const result = await dynamodb.query(params).promise();
    res.json({ decks: result.Items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create deck
app.post('/decks', async (req, res) => {
  const userId = req.apiGateway.event.requestContext.identity.cognitoIdentityId;
  const deckId = Date.now().toString();
  
  const params = {
    TableName: tableName,
    Item: {
      userId,
      deckId,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  };
  
  try {
    await dynamodb.put(params).promise();
    res.json({ success: true, deckId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update deck
app.put('/decks/:deckId', async (req, res) => {
  const userId = req.apiGateway.event.requestContext.identity.cognitoIdentityId;
  const { deckId } = req.params;
  
  const params = {
    TableName: tableName,
    Key: { userId, deckId },
    UpdateExpression: 'set #data = :data, updatedAt = :updatedAt',
    ExpressionAttributeNames: {
      '#data': 'data'
    },
    ExpressionAttributeValues: {
      ':data': req.body,
      ':updatedAt': new Date().toISOString()
    }
  };
  
  try {
    await dynamodb.update(params).promise();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
```

---

## 🎯 Migration Checklist

### Phase 1: Set Up Amplify (30 minutes)
- [ ] Install Amplify CLI
- [ ] Initialize Amplify project
- [ ] Add hosting
- [ ] Add authentication
- [ ] Add API
- [ ] Add storage (DynamoDB)
- [ ] Deploy with `amplify push`

### Phase 2: Update Frontend Code (2-3 hours)
- [ ] Install Amplify libraries
- [ ] Configure Amplify in app
- [ ] Create AmplifyDeckService
- [ ] Replace all giteaService calls
- [ ] Update authentication to use Cognito
- [ ] Test locally

### Phase 3: Deploy (30 minutes)
- [ ] Build frontend
- [ ] Deploy with `amplify publish`
- [ ] Add custom domain
- [ ] Update DNS
- [ ] Test live site

### Phase 4: Add Riot SSO (1-2 hours)
- [ ] Register OAuth app with Riot
- [ ] Configure Cognito identity provider
- [ ] Update auth service
- [ ] Test Riot login

---

## 📊 Comparison: Lightsail vs Serverless

| Aspect | Lightsail | Serverless |
|--------|-----------|------------|
| **Setup Time** | 30 min | 4-6 hours |
| **Cost (low traffic)** | $10/month | $2-5/month |
| **Cost (high traffic)** | $10/month | $50-100/month |
| **Scaling** | Manual | Automatic |
| **Maintenance** | You manage | AWS manages |
| **Code Changes** | Minimal | Moderate |
| **Learning Curve** | Low | Medium |
| **Long-term** | Limited | Unlimited |

---

## 🤔 Should You Go Serverless?

### Choose Serverless If:
- ✅ You want to learn modern cloud architecture
- ✅ You expect variable/growing traffic
- ✅ You want minimal maintenance
- ✅ You're okay spending 4-6 hours on migration
- ✅ You want proper Riot SSO integration
- ✅ You want to scale automatically

### Choose Lightsail If:
- ✅ You want to launch TODAY
- ✅ You want minimal code changes
- ✅ You're okay with manual scaling
- ✅ You want predictable costs
- ✅ You want to keep Gitea

---

## 🚀 Quick Start: Serverless in 10 Commands

```bash
# 1. Install Amplify CLI
npm install -g @aws-amplify/cli

# 2. Configure AWS
amplify configure

# 3. Initialize project
cd deckbuilder-webapp
amplify init

# 4. Add services
amplify add hosting
amplify add auth
amplify add api
amplify add storage

# 5. Deploy backend
amplify push

# 6. Install libraries
npm install aws-amplify @aws-amplify/ui-react

# 7. Update code (see above)

# 8. Deploy frontend
amplify publish

# 9. Add custom domain (in console)

# 10. You're live! 🎉
```

---

## 📞 Need Help?

- **Amplify Docs:** https://docs.amplify.aws/
- **Amplify Discord:** https://discord.gg/amplify
- **AWS Forums:** https://forums.aws.amazon.com/forum.jspa?forumID=314

---

## ✨ Summary

**Serverless gives you:**
- 💰 Cheaper at low traffic
- 📈 Auto-scales to millions
- 🔒 Built-in Riot SSO support
- 🚀 Modern architecture
- ⚡ Global performance
- 🛠️ No server management

**Trade-off:**
- ⏱️ Takes 4-6 hours to set up
- 💻 Requires code changes
- 📚 Steeper learning curve

**But it's worth it for the long haul!**

Ready to go serverless? Let me know and I'll help you through each step!
