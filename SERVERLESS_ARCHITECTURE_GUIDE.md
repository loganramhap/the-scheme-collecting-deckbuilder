# Serverless Architecture Guide for Zaunite Workshop

## 🎯 How Serverless Works with Your Frontend

### The Big Picture

Your React app becomes a **static website** hosted on S3, served through CloudFront CDN. It talks to a serverless backend via API Gateway + Lambda.

```
User Browser
    ↓
CloudFront (CDN) - Caches your React app globally
    ↓
S3 Bucket - Stores your built React files (HTML, JS, CSS)
    ↓
API Gateway - REST API endpoint
    ↓
Lambda Functions - Your backend logic
    ↓
DynamoDB - Your database
```

---

## 📦 What Happens to Your React App

### Current Setup (Proxmox/Lightsail):
```
Nginx Server
├── Serves React app (index.html, bundle.js, etc.)
├── Proxies API calls to backend
└── Handles routing
```

### Serverless Setup:
```
S3 + CloudFront
├── Serves React app (same files!)
├── React makes API calls directly to API Gateway
└── CloudFront handles routing
```

**Key Point:** Your React code stays the same! You just change where API calls go.

---

## 🔄 Step-by-Step: How It Works

### 1. Build Your React App (No Changes!)

```bash
cd deckbuilder-webapp
npm run build
```

This creates a `dist/` folder with:
```
dist/
├── index.html
├── assets/
│   ├── index-abc123.js
│   ├── index-def456.css
│   └── logo.png
└── riot.txt
```

### 2. Upload to S3

```bash
# Upload your build to S3
aws s3 sync dist/ s3://zauniteworkshop.com/

# Your files are now at:
# https://zauniteworkshop.com.s3.amazonaws.com/index.html
```

### 3. CloudFront Serves It Globally

CloudFront caches your files at edge locations worldwide:
- User in US → Gets files from US edge
- User in EU → Gets files from EU edge
- User in Asia → Gets files from Asia edge

**Result:** Super fast loading everywhere!

### 4. React App Makes API Calls

Your React code calls your API:

```typescript
// Before (Gitea):
const response = await fetch('http://localhost:3000/api/decks');

// After (Serverless):
const response = await fetch('https://api.zauniteworkshop.com/decks');
```

### 5. API Gateway Routes to Lambda

```
GET /decks → Lambda: listDecks()
POST /decks → Lambda: createDeck()
PUT /decks/:id → Lambda: updateDeck()
DELETE /decks/:id → Lambda: deleteDeck()
```

### 6. Lambda Talks to DynamoDB

```typescript
// Lambda function
export async function listDecks(event) {
  const userId = event.requestContext.authorizer.claims.sub;
  
  const result = await dynamoDB.query({
    TableName: 'Decks',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    }
  });
  
  return {
    statusCode: 200,
    body: JSON.stringify(result.Items)
  };
}
```

---

## 🏗️ Architecture Comparison

### Current (Gitea-based):

```
┌─────────────────────────────────────────┐
│ User Browser                            │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ Nginx (Your Server)                     │
│ ├── Serves React app                    │
│ └── Proxies to Gitea API                │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ Gitea                                   │
│ ├── Stores decks as JSON files          │
│ ├── Git version control                 │
│ └── User authentication                 │
└─────────────────────────────────────────┘
```

### Serverless:

```
┌─────────────────────────────────────────┐
│ User Browser                            │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ CloudFront (Global CDN)                 │
│ └── Caches React app                    │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ S3 Bucket                               │
│ └── Stores React build files            │
└─────────────────────────────────────────┘

              ↓ (API calls)

┌─────────────────────────────────────────┐
│ API Gateway                             │
│ └── REST API endpoints                  │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ Lambda Functions                        │
│ ├── listDecks()                         │
│ ├── createDeck()                        │
│ ├── updateDeck()                        │
│ └── deleteDeck()                        │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ DynamoDB                                │
│ └── Stores deck data                    │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ Cognito                                 │
│ └── User authentication                 │
└─────────────────────────────────────────┘
```

---

## 💻 Code Changes Needed

### Minimal Changes to Your React App!

#### 1. Update API Base URL

```typescript
// src/config/api.ts

// Before:
export const API_BASE_URL = 'http://localhost:3000';

// After:
export const API_BASE_URL = 
  import.meta.env.VITE_API_URL || 
  'https://api.zauniteworkshop.com';
```

#### 2. Replace Gitea Service with API Service

```typescript
// src/services/deckService.ts

// Before (Gitea):
class GiteaService {
  async saveDeck(username, deckName, deck) {
    return fetch(`${GITEA_URL}/repos/${username}/${deckName}/contents/deck.json`, {
      method: 'PUT',
      body: JSON.stringify(deck)
    });
  }
}

// After (Serverless):
class DeckService {
  async saveDeck(deckId, deck) {
    return fetch(`${API_BASE_URL}/decks/${deckId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(deck)
    });
  }
}
```

#### 3. Use Cognito for Auth (Instead of Gitea OAuth)

```typescript
// src/services/auth.ts

import { CognitoUserPool, CognitoUser } from 'amazon-cognito-identity-js';

const userPool = new CognitoUserPool({
  UserPoolId: 'us-east-1_abc123',
  ClientId: 'your-client-id'
});

export async function signIn(username, password) {
  // Cognito handles authentication
  // Can integrate with Riot SSO here!
}
```

**That's it!** Your React components stay the same.

---

## 🚀 Deployment Process

### One-Time Setup (30 minutes):

```bash
# 1. Create S3 bucket
aws s3 mb s3://zauniteworkshop.com

# 2. Enable static website hosting
aws s3 website s3://zauniteworkshop.com \
  --index-document index.html \
  --error-document index.html

# 3. Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name zauniteworkshop.com.s3.amazonaws.com

# 4. Point domain to CloudFront
# (Update Route 53 DNS)

# 5. Deploy Lambda functions
cd backend
serverless deploy

# 6. Create DynamoDB tables
aws dynamodb create-table \
  --table-name Decks \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=deckId,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=deckId,KeyType=RANGE
```

### Every Deployment (1 minute):

```bash
# Build React app
npm run build

# Upload to S3
aws s3 sync dist/ s3://zauniteworkshop.com/

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```

**Or use GitHub Actions for automatic deployment!**

---

## 📊 Data Migration: Gitea → DynamoDB

### Current Gitea Structure:
```
repos/
└── username/
    └── my-deck/
        └── deck.json
```

### New DynamoDB Structure:
```javascript
{
  "userId": "user-123",
  "deckId": "deck-456",
  "name": "My Fury Deck",
  "game": "riftbound",
  "legend": { ... },
  "cards": [ ... ],
  "runeDeck": [ ... ],
  "battlefields": [ ... ],
  "createdAt": 1234567890,
  "updatedAt": 1234567890,
  "version": 1
}
```

### Migration Script:

```typescript
// migrate-to-dynamodb.ts

async function migrateDecks() {
  // 1. Get all decks from Gitea
  const decks = await getAllDecksFromGitea();
  
  // 2. Transform and upload to DynamoDB
  for (const deck of decks) {
    await dynamoDB.put({
      TableName: 'Decks',
      Item: {
        userId: deck.owner,
        deckId: generateId(),
        ...deck.data,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    });
  }
}
```

---

## 🎨 What Stays the Same

### Your React App:
- ✅ All components work the same
- ✅ All UI/UX stays the same
- ✅ All features work the same
- ✅ User experience is identical

### What Changes:
- ⚠️ API calls go to different URL
- ⚠️ Authentication uses Cognito (can integrate Riot SSO)
- ⚠️ Data stored in DynamoDB instead of Git files

---

## 🔐 Authentication Flow

### With Cognito + Riot SSO:

```
1. User clicks "Sign in with Riot"
   ↓
2. Redirect to Riot OAuth
   ↓
3. User authorizes
   ↓
4. Riot redirects back with token
   ↓
5. Exchange token with Cognito
   ↓
6. Cognito issues JWT
   ↓
7. React app stores JWT
   ↓
8. All API calls include JWT in header
   ↓
9. API Gateway validates JWT
   ↓
10. Lambda executes with user context
```

---

## 💰 Cost Breakdown (Real Numbers)

### For 1,000 Users/Month:

```
S3 Storage (10GB)              $ 0.23
CloudFront (100GB transfer)    $ 8.50
Lambda (1M requests)           $ 0.20
API Gateway (1M requests)      $ 3.50
DynamoDB (5GB, 1M reads)       $ 1.25
Cognito (1,000 MAU)            $ 0.00 (free tier)
Route 53                       $ 0.50
────────────────────────────────────
TOTAL                          $14.18/month
```

### For 10,000 Users/Month:

```
S3 Storage (50GB)              $ 1.15
CloudFront (1TB transfer)      $85.00
Lambda (10M requests)          $ 2.00
API Gateway (10M requests)     $35.00
DynamoDB (25GB, 10M reads)     $ 6.25
Cognito (10,000 MAU)           $ 0.00 (free tier)
Route 53                       $ 0.50
────────────────────────────────────
TOTAL                          $129.90/month
```

**Key Point:** You only pay for what you use!

---

## 🎯 Pros & Cons

### Pros:
- ✅ **Scales automatically** - Handles 10 or 10,000 users
- ✅ **Pay per use** - Cheap at low traffic
- ✅ **No server management** - AWS handles everything
- ✅ **Global performance** - CloudFront CDN
- ✅ **High availability** - Built-in redundancy
- ✅ **Modern architecture** - Industry standard

### Cons:
- ⚠️ **Requires rewrite** - Replace Gitea with DynamoDB
- ⚠️ **More complex** - More services to learn
- ⚠️ **Cold starts** - Lambda can be slow (0.5-2s first request)
- ⚠️ **Vendor lock-in** - Harder to move off AWS
- ⚠️ **Lose Git history** - No more version control per deck

---

## 🤔 Should You Go Serverless?

### Choose Serverless If:
- ✅ You want to learn modern cloud architecture
- ✅ You expect variable traffic (viral potential)
- ✅ You want minimal maintenance
- ✅ You're okay rewriting backend
- ✅ You want to integrate Riot SSO properly

### Choose Lightsail If:
- ✅ You want simplest migration
- ✅ You want to keep Gitea
- ✅ You want predictable costs
- ✅ You want to deploy quickly
- ✅ You're comfortable with server management

---

## 🚀 Quick Start: Serverless Deployment

### Using AWS Amplify (Easiest):

```bash
# 1. Install Amplify CLI
npm install -g @aws-amplify/cli

# 2. Initialize Amplify
cd deckbuilder-webapp
amplify init

# 3. Add hosting
amplify add hosting

# 4. Add API
amplify add api

# 5. Add authentication
amplify add auth

# 6. Deploy everything
amplify push

# 7. Your app is live!
# https://main.d1234567890.amplifyapp.com
```

### Using Serverless Framework:

```bash
# 1. Install Serverless
npm install -g serverless

# 2. Create serverless.yml
# (See example below)

# 3. Deploy
serverless deploy

# 4. Upload frontend to S3
aws s3 sync dist/ s3://zauniteworkshop.com/
```

---

## 📝 Example serverless.yml

```yaml
service: zaunite-workshop-api

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    DECKS_TABLE: ${self:service}-decks-${self:provider.stage}

functions:
  listDecks:
    handler: src/handlers/decks.list
    events:
      - http:
          path: /decks
          method: get
          cors: true
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId: !Ref ApiGatewayAuthorizer

  createDeck:
    handler: src/handlers/decks.create
    events:
      - http:
          path: /decks
          method: post
          cors: true
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId: !Ref ApiGatewayAuthorizer

resources:
  Resources:
    DecksTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: ${self:provider.environment.DECKS_TABLE}
        AttributeDefinitions:
          - AttributeName: userId
            AttributeType: S
          - AttributeName: deckId
            AttributeType: S
        KeySchema:
          - AttributeName: userId
            KeyType: HASH
          - AttributeName: deckId
            KeyType: RANGE
        BillingMode: PAY_PER_REQUEST
```

---

## 🎓 Learning Resources

- **AWS Amplify Docs:** https://docs.amplify.aws/
- **Serverless Framework:** https://www.serverless.com/
- **DynamoDB Guide:** https://docs.aws.amazon.com/dynamodb/
- **Cognito + Riot SSO:** https://docs.aws.amazon.com/cognito/

---

## 🏁 Summary

**Serverless with your React app:**
1. React app → Static files on S3
2. CloudFront → Serves files globally
3. API Gateway → REST API endpoints
4. Lambda → Backend logic
5. DynamoDB → Database
6. Cognito → Authentication (+ Riot SSO)

**Your React code barely changes!** Just update API URLs and auth.

**Best for:** Learning modern architecture, variable traffic, minimal maintenance

**Not best for:** Quick migration, keeping Gitea, predictable costs

Need help deciding or implementing? Let me know!
