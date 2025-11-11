# AWS Hosting Guide for Zaunite Workshop

## 🎯 AWS Architecture Options

### Option 1: AWS Amplify (Simplest) ⭐
**Best for: Quick deployment, minimal DevOps**

```
Architecture:
┌─────────────────────────────────────────┐
│ Route 53 (DNS)                          │
│ zauniteworkshop.com                     │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ CloudFront (CDN + SSL)                  │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ AWS Amplify                             │
│ - React Frontend                        │
│ - Auto build/deploy from Git           │
│ - Environment variables                 │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ EC2 (t3.micro)                          │
│ - Gitea                                 │
│ - PostgreSQL                            │
└─────────────────────────────────────────┘
```

**Services Used:**
- **Amplify** - Frontend hosting ($0.01/GB served + $0.01/build min)
- **EC2 t3.micro** - Gitea backend (~$8/month)
- **Route 53** - DNS ($0.50/month per hosted zone)
- **CloudFront** - CDN (included with Amplify)

**Monthly Cost: ~$10-15**

**Pros:**
- ✅ Simple setup - Like Vercel but on AWS
- ✅ Git-based deployments
- ✅ Automatic SSL
- ✅ Built-in CI/CD
- ✅ Easy custom domain
- ✅ Free tier eligible (first year)

**Cons:**
- ⚠️ Still need EC2 for Gitea
- ⚠️ More expensive than Vercel for frontend

---

### Option 2: Full Serverless (Most Scalable) ⭐⭐
**Best for: Production-ready, auto-scaling**

```
Architecture:
┌─────────────────────────────────────────┐
│ Route 53 (DNS)                          │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ CloudFront (CDN)                        │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ S3 (Static Website)                     │
│ - React build files                     │
│ - riot.txt                              │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ API Gateway + Lambda                    │
│ - Deck CRUD operations                  │
│ - User authentication                   │
│ - Riot API proxy (optional)             │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ DynamoDB or RDS                         │
│ - User data                             │
│ - Deck storage                          │
│ - Replace Gitea with database           │
└─────────────────────────────────────────┘
```

**Services Used:**
- **S3** - Static hosting ($0.023/GB storage + $0.09/GB transfer)
- **CloudFront** - CDN ($0.085/GB)
- **Lambda** - API functions (1M free requests/month)
- **API Gateway** - REST API ($3.50/million requests)
- **DynamoDB** - Database (25GB free tier)
- **Cognito** - User auth (50k MAU free)
- **Route 53** - DNS ($0.50/month)

**Monthly Cost: $5-20** (depends on traffic)

**Pros:**
- ✅ **Cheapest at scale** - Pay per use
- ✅ **Auto-scaling** - Handles traffic spikes
- ✅ **No server management**
- ✅ **High availability** - Built-in redundancy
- ✅ **Free tier** - Very generous
- ✅ **Cognito** - Can integrate with Riot SSO

**Cons:**
- ⚠️ **Architectural change** - No more Gitea
- ⚠️ **More complex** - More services to learn
- ⚠️ **Cold starts** - Lambda can be slow initially

---

### Option 3: Container-Based (ECS/Fargate)
**Best for: Docker expertise, full control**

```
Architecture:
┌─────────────────────────────────────────┐
│ Route 53 (DNS)                          │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ Application Load Balancer               │
│ - SSL termination                       │
│ - Health checks                         │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ ECS Fargate                             │
│ ├── Frontend Container (React)          │
│ ├── Backend Container (Node API)        │
│ └── Gitea Container                     │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ RDS PostgreSQL                          │
│ - Gitea database                        │
│ - User data                             │
└─────────────────────────────────────────┘
```

**Services Used:**
- **ECS Fargate** - Container hosting (~$30/month for 0.5 vCPU, 1GB RAM)
- **RDS** - Managed PostgreSQL (~$15/month for db.t3.micro)
- **ALB** - Load balancer (~$16/month)
- **ECR** - Container registry ($0.10/GB/month)
- **Route 53** - DNS ($0.50/month)

**Monthly Cost: $60-80**

**Pros:**
- ✅ Use existing Docker setup
- ✅ Full control
- ✅ Easy to migrate from Proxmox
- ✅ Managed database

**Cons:**
- ⚠️ **Most expensive** option
- ⚠️ More complex than Amplify
- ⚠️ Requires container knowledge

---

### Option 4: Lightsail (Simplest VPS) ⭐
**Best for: Simple migration, predictable pricing**

```
Architecture:
┌─────────────────────────────────────────┐
│ Route 53 (DNS)                          │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ Lightsail Instance ($10/month)          │
│ - 2GB RAM, 1 vCPU, 60GB SSD            │
│ - React Frontend (Nginx)                │
│ - Gitea                                 │
│ - PostgreSQL                            │
│ - All in one server                     │
└─────────────────────────────────────────┘
```

**Services Used:**
- **Lightsail** - VPS ($10/month for 2GB RAM)
- **Route 53** - DNS ($0.50/month)
- **Lightsail Static IP** - Free with instance

**Monthly Cost: $10-12**

**Pros:**
- ✅ **Simplest** - Just like your Proxmox setup
- ✅ **Predictable pricing** - Fixed monthly cost
- ✅ **Easy migration** - Copy your setup
- ✅ **Includes bandwidth** - 3TB transfer/month
- ✅ **Managed backups** - Automatic snapshots

**Cons:**
- ⚠️ Single point of failure
- ⚠️ Manual scaling
- ⚠️ You manage everything

---

## 💰 Cost Comparison

| Option | Monthly Cost | Complexity | Scalability | Best For |
|--------|-------------|------------|-------------|----------|
| **Lightsail** | **$10-12** | ⭐ Easy | ⭐ Manual | Small projects |
| **Amplify + EC2** | **$10-15** | ⭐⭐ Medium | ⭐⭐ Good | Quick start |
| **Serverless** | **$5-20** | ⭐⭐⭐ Complex | ⭐⭐⭐ Auto | Production |
| **ECS Fargate** | **$60-80** | ⭐⭐⭐ Complex | ⭐⭐⭐ Auto | Enterprise |
| **Railway** | **$10-20** | ⭐ Easy | ⭐⭐ Good | Comparison |
| **Vercel** | **$0** | ⭐ Easy | ⭐⭐⭐ Auto | Frontend only |

---

## 🏆 My Recommendation for You

### Best Option: **Lightsail** ($10/month) ⭐

**Why:**
1. **Easiest migration** - Just copy your Proxmox setup
2. **Predictable cost** - $10/month, no surprises
3. **All-in-one** - Frontend, Gitea, database on one server
4. **Simple management** - One server to maintain
5. **Good performance** - 2GB RAM is plenty for your app

### Setup Steps:

1. **Create Lightsail Instance**
   ```bash
   # Choose:
   - OS: Ubuntu 22.04 LTS
   - Plan: $10/month (2GB RAM, 1 vCPU, 60GB SSD)
   - Region: Closest to your users
   ```

2. **Install Your Stack**
   ```bash
   # SSH into instance
   ssh ubuntu@your-instance-ip
   
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # Copy your docker-compose.yml
   # Start services
   docker-compose up -d
   ```

3. **Configure Domain**
   ```bash
   # In Route 53:
   - Create hosted zone for zauniteworkshop.com
   - Point A record to Lightsail static IP
   ```

4. **Set up SSL**
   ```bash
   # Install Certbot
   sudo apt install certbot python3-certbot-nginx
   
   # Get certificate
   sudo certbot --nginx -d zauniteworkshop.com
   ```

5. **Deploy riot.txt**
   ```bash
   # Copy to nginx public folder
   sudo cp riot.txt /var/www/html/
   ```

---

## 🚀 Alternative: Serverless (If You Want to Modernize)

### Why Consider Serverless:

**Pros:**
- **Cheaper at low traffic** - Pay only for what you use
- **Auto-scales** - Handles viral growth
- **No maintenance** - AWS manages everything
- **Modern architecture** - Industry best practice

**Cons:**
- **Requires rewrite** - Replace Gitea with DynamoDB/RDS
- **More complex** - More services to learn
- **Vendor lock-in** - Harder to move off AWS

### Architectural Changes Needed:

```typescript
// Current: Gitea stores decks as JSON files in Git
// New: Store decks in DynamoDB

// Before (Gitea):
await giteaService.saveDeck(username, deckName, deckData);

// After (DynamoDB):
await dynamoDB.put({
  TableName: 'Decks',
  Item: {
    userId: userId,
    deckId: deckId,
    deckData: deckData,
    version: version,
    timestamp: Date.now()
  }
});
```

### Services Breakdown:

**Frontend:**
- S3 + CloudFront = $2-5/month
- Hosts your React app

**Backend API:**
- Lambda + API Gateway = $1-3/month
- Handles deck CRUD operations

**Database:**
- DynamoDB = Free tier (25GB)
- Stores decks, users, metadata

**Authentication:**
- Cognito = Free tier (50k users)
- Can integrate with Riot SSO

**Total: $5-10/month** for low traffic

---

## 📊 Detailed Cost Breakdown

### Lightsail ($10/month):
```
Lightsail Instance (2GB)    $10.00
Route 53 Hosted Zone        $ 0.50
SSL Certificate             $ 0.00 (Let's Encrypt)
Bandwidth (3TB included)    $ 0.00
─────────────────────────────────
TOTAL                       $10.50/month
```

### Serverless (Low Traffic):
```
S3 Storage (5GB)            $ 0.12
CloudFront (10GB transfer)  $ 0.85
Lambda (1M requests)        $ 0.00 (free tier)
API Gateway (1M requests)   $ 3.50
DynamoDB (1GB)              $ 0.00 (free tier)
Route 53                    $ 0.50
─────────────────────────────────
TOTAL                       $ 4.97/month
```

### Serverless (Medium Traffic):
```
S3 Storage (10GB)           $ 0.23
CloudFront (100GB transfer) $ 8.50
Lambda (10M requests)       $ 2.00
API Gateway (10M requests)  $35.00
DynamoDB (5GB)              $ 1.25
Route 53                    $ 0.50
─────────────────────────────────
TOTAL                       $47.48/month
```

---

## 🎯 My Final Recommendation

### Start with Lightsail ($10/month)

**Reasons:**
1. ✅ **Easiest** - Minimal changes to your setup
2. ✅ **Cheapest** - Fixed $10/month
3. ✅ **Fast deployment** - Can be live in hours
4. ✅ **Keep Gitea** - No architectural changes
5. ✅ **Learn AWS** - Good entry point

### Migrate to Serverless Later (Optional)

Once you have users and want to scale:
1. Keep frontend on S3 + CloudFront
2. Build API with Lambda
3. Migrate decks from Gitea to DynamoDB
4. Add Cognito for Riot SSO
5. Scale automatically

---

## 🛠️ Quick Start: Lightsail Setup

### 1. Create Instance (5 minutes)
```bash
# AWS Console → Lightsail → Create Instance
- Platform: Linux/Unix
- Blueprint: Ubuntu 22.04 LTS
- Plan: $10/month (2GB RAM)
- Name: zaunite-workshop
```

### 2. Configure Networking (2 minutes)
```bash
# Lightsail → Networking
- Create static IP
- Attach to instance
- Open ports: 22, 80, 443
```

### 3. Install Software (10 minutes)
```bash
# SSH into instance
ssh ubuntu@your-static-ip

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu

# Copy your docker-compose.yml
# Start services
docker-compose up -d
```

### 4. Set Up Domain (5 minutes)
```bash
# Route 53 → Create Hosted Zone
- Domain: zauniteworkshop.com
- Type: Public

# Create A Record
- Name: @
- Type: A
- Value: your-static-ip
```

### 5. Enable SSL (5 minutes)
```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d zauniteworkshop.com
```

### 6. Deploy riot.txt (1 minute)
```bash
# Copy to web root
sudo cp riot.txt /var/www/html/
```

**Total Time: ~30 minutes**
**Total Cost: $10.50/month**

---

## 🆚 Lightsail vs Railway

| Feature | Lightsail | Railway |
|---------|-----------|---------|
| **Price** | $10/month fixed | $10-20/month usage |
| **Setup** | Manual | Automatic |
| **Scaling** | Manual | Automatic |
| **Backups** | Manual snapshots | Automatic |
| **Monitoring** | Basic | Advanced |
| **Learning Curve** | Medium | Easy |
| **AWS Integration** | Native | None |

**Verdict:** 
- **Lightsail** if you want AWS ecosystem
- **Railway** if you want simplicity

---

## 📝 Next Steps

1. **Choose your path:**
   - **Easy:** Lightsail ($10/month)
   - **Cheapest:** Vercel + Self-hosted Gitea ($0)
   - **Modern:** Serverless ($5-20/month)

2. **Set up domain** in Route 53

3. **Deploy riot.txt** for API verification

4. **Apply for production API key**

5. **Launch!** 🚀

Need help with any of these steps? Let me know!
