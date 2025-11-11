# AWS Lightsail Deployment Guide - Zaunite Workshop

## 🎯 Overview

Deploy your entire Riftbound deck builder to AWS Lightsail in ~30 minutes for $10/month.

**What you'll get:**
- ✅ Frontend + Backend + Database on one server
- ✅ Custom domain: zauniteworkshop.com
- ✅ HTTPS/SSL certificate (free)
- ✅ 3TB bandwidth/month
- ✅ Automatic backups
- ✅ Static IP address

---

## 📋 Prerequisites

- [ ] AWS Account (create at https://aws.amazon.com)
- [ ] Domain: zauniteworkshop.com (registered)
- [ ] Your code ready to deploy
- [ ] Riot API key

---

## 🚀 Step 1: Create Lightsail Instance (5 minutes)

### 1.1 Go to Lightsail Console
```
https://lightsail.aws.amazon.com/
```

### 1.2 Click "Create Instance"

### 1.3 Choose Instance Location
- **Region:** Choose closest to your users
  - US East (N. Virginia) - Good for US/EU
  - US West (Oregon) - Good for US/Asia
  - EU (Frankfurt) - Good for Europe

### 1.4 Select Platform
- **Platform:** Linux/Unix
- **Blueprint:** OS Only → Ubuntu 22.04 LTS

### 1.5 Choose Instance Plan
- **Plan:** $10/month
  - 2 GB RAM
  - 1 vCPU
  - 60 GB SSD
  - 3 TB transfer

### 1.6 Name Your Instance
- **Name:** `zaunite-workshop`

### 1.7 Click "Create Instance"

⏱️ Wait 2-3 minutes for instance to start

---

## 🔌 Step 2: Set Up Networking (3 minutes)

### 2.1 Create Static IP

1. In Lightsail console, go to **Networking** tab
2. Click **Create static IP**
3. Select your instance: `zaunite-workshop`
4. Name it: `zaunite-workshop-ip`
5. Click **Create**

**Save this IP address!** You'll need it for DNS.

### 2.2 Open Firewall Ports

1. Go to your instance
2. Click **Networking** tab
3. Under **IPv4 Firewall**, add rules:

```
SSH     TCP  22    ✓ (already open)
HTTP    TCP  80    + Add rule
HTTPS   TCP  443   + Add rule
```

---

## 💻 Step 3: Connect and Install Software (10 minutes)

### 3.1 Connect via SSH

**Option A: Browser SSH (Easiest)**
1. Click your instance
2. Click **Connect using SSH**
3. Browser terminal opens

**Option B: Your Terminal**
```bash
# Download SSH key from Lightsail
# Then connect:
ssh -i LightsailDefaultKey.pem ubuntu@YOUR_STATIC_IP
```

### 3.2 Update System

```bash
sudo apt update
sudo apt upgrade -y
```

### 3.3 Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker ubuntu

# Log out and back in for group to take effect
exit
# Then reconnect via SSH
```

### 3.4 Install Docker Compose

```bash
sudo apt install docker-compose -y
```

### 3.5 Install Nginx

```bash
sudo apt install nginx -y
```

### 3.6 Install Certbot (for SSL)

```bash
sudo apt install certbot python3-certbot-nginx -y
```

---

## 📦 Step 4: Deploy Your Application (10 minutes)

### 4.1 Transfer Your Code

**Option A: Git (Recommended)**
```bash
# Install git
sudo apt install git -y

# Clone your repository
git clone https://github.com/yourusername/your-repo.git
cd your-repo
```

**Option B: SCP from your computer**
```bash
# On your local machine:
scp -i LightsailDefaultKey.pem -r /path/to/your/project ubuntu@YOUR_STATIC_IP:~/
```

### 4.2 Set Up Environment Variables

```bash
# Create .env file
nano .env
```

Add your configuration:
```env
# Gitea
GITEA_URL=http://localhost:3000

# Riot API
VITE_RIOT_API_KEY=your-riot-api-key-here
VITE_USE_RIOT_API=true

# Domain
DOMAIN=zauniteworkshop.com
```

Save: `Ctrl+X`, then `Y`, then `Enter`

### 4.3 Start Services with Docker Compose

```bash
# Start all services
docker-compose up -d

# Check if running
docker-compose ps

# View logs
docker-compose logs -f
```

### 4.4 Build Frontend

```bash
cd deckbuilder-webapp
npm install
npm run build
```

### 4.5 Configure Nginx

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/zauniteworkshop
```

Paste this configuration:
```nginx
server {
    listen 80;
    server_name zauniteworkshop.com www.zauniteworkshop.com;

    # Frontend
    location / {
        root /home/ubuntu/your-repo/deckbuilder-webapp/dist;
        try_files $uri $uri/ /index.html;
    }

    # Riot verification file
    location /riot.txt {
        alias /home/ubuntu/your-repo/deckbuilder-webapp/public/riot.txt;
    }

    # Gitea API
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Save and enable:
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/zauniteworkshop /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## 🌐 Step 5: Configure Domain (5 minutes)

### 5.1 Set Up Route 53 (AWS DNS)

1. Go to **Route 53** in AWS Console
2. Click **Create hosted zone**
3. Enter domain: `zauniteworkshop.com`
4. Click **Create hosted zone**

### 5.2 Create DNS Records

Click **Create record** and add:

**A Record (Root domain):**
```
Record name: (leave empty)
Record type: A
Value: YOUR_LIGHTSAIL_STATIC_IP
TTL: 300
```

**A Record (www subdomain):**
```
Record name: www
Record type: A
Value: YOUR_LIGHTSAIL_STATIC_IP
TTL: 300
```

### 5.3 Update Domain Nameservers

Route 53 will show you 4 nameservers like:
```
ns-123.awsdns-12.com
ns-456.awsdns-45.net
ns-789.awsdns-78.org
ns-012.awsdns-01.co.uk
```

**Go to your domain registrar** (where you bought zauniteworkshop.com) and update nameservers to these 4 values.

⏱️ Wait 5-60 minutes for DNS to propagate

---

## 🔒 Step 6: Enable HTTPS/SSL (2 minutes)

### 6.1 Get SSL Certificate

```bash
# Get certificate from Let's Encrypt
sudo certbot --nginx -d zauniteworkshop.com -d www.zauniteworkshop.com
```

Follow prompts:
- Enter email address
- Agree to terms
- Choose: Redirect HTTP to HTTPS (option 2)

### 6.2 Test Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run
```

✅ Certificate will auto-renew every 90 days!

---

## ✅ Step 7: Verify Everything Works

### 7.1 Test Website

Visit: `https://zauniteworkshop.com`

Should see:
- ✅ Your React app loads
- ✅ HTTPS (lock icon in browser)
- ✅ No certificate warnings

### 7.2 Test Riot Verification

Visit: `https://zauniteworkshop.com/riot.txt`

Should see:
- ✅ Your Riot API key displayed

### 7.3 Test Gitea

Visit: `https://zauniteworkshop.com/api`

Should see:
- ✅ Gitea interface or API response

### 7.4 Test Deck Builder

1. Create account
2. Create a deck
3. Save deck
4. Reload page
5. Deck should still be there

---

## 🔧 Maintenance Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f gitea

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart gitea

# Restart Nginx
sudo systemctl restart nginx
```

### Update Application
```bash
# Pull latest code
git pull

# Rebuild frontend
cd deckbuilder-webapp
npm run build

# Restart services
docker-compose restart

# Reload Nginx
sudo systemctl reload nginx
```

### Backup
```bash
# Create snapshot in Lightsail console
# Networking → Snapshots → Create snapshot

# Or backup data manually
docker-compose exec gitea /bin/sh -c "gitea dump"
```

---

## 💰 Cost Breakdown

```
Lightsail Instance (2GB)    $10.00/month
Route 53 Hosted Zone        $ 0.50/month
SSL Certificate             $ 0.00 (Let's Encrypt)
Static IP                   $ 0.00 (included)
Bandwidth (3TB)             $ 0.00 (included)
────────────────────────────────────────
TOTAL                       $10.50/month
```

---

## 🎯 Next Steps

### 1. Apply for Riot Production API Key

Now that `zauniteworkshop.com/riot.txt` is live:

1. Go to https://developer.riotgames.com/
2. Navigate to your application
3. Request production API key
4. Provide domain: `zauniteworkshop.com`
5. Wait for approval (usually 1-2 weeks)

### 2. Set Up Monitoring

```bash
# Install monitoring tools
sudo apt install htop -y

# Check resource usage
htop

# Check disk space
df -h

# Check memory
free -h
```

### 3. Set Up Automatic Backups

In Lightsail console:
1. Go to your instance
2. Click **Snapshots** tab
3. Enable **Automatic snapshots**
4. Choose time: Daily at 2 AM

### 4. Set Up Alerts

In Lightsail console:
1. Go to your instance
2. Click **Metrics** tab
3. Set up alerts for:
   - CPU > 80%
   - Network out > 2TB
   - Disk usage > 80%

---

## 🐛 Troubleshooting

### Website Not Loading

```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx config
sudo nginx -t

# Check if port 80/443 are open
sudo netstat -tlnp | grep nginx
```

### Docker Services Not Running

```bash
# Check status
docker-compose ps

# View logs
docker-compose logs

# Restart
docker-compose restart
```

### SSL Certificate Issues

```bash
# Check certificate
sudo certbot certificates

# Renew manually
sudo certbot renew

# Check Nginx SSL config
sudo nano /etc/nginx/sites-available/zauniteworkshop
```

### DNS Not Resolving

```bash
# Check DNS propagation
nslookup zauniteworkshop.com

# Check Route 53 records
# Go to Route 53 console and verify records
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean Docker
docker system prune -a

# Clean old logs
sudo journalctl --vacuum-time=7d
```

---

## 📞 Support Resources

- **Lightsail Docs:** https://lightsail.aws.amazon.com/ls/docs
- **Route 53 Docs:** https://docs.aws.amazon.com/route53/
- **Let's Encrypt:** https://letsencrypt.org/docs/
- **Docker Docs:** https://docs.docker.com/
- **Nginx Docs:** https://nginx.org/en/docs/

---

## ✨ You're Live!

Congratulations! Your Riftbound deck builder is now live at:

🌐 **https://zauniteworkshop.com**

**What you've accomplished:**
- ✅ Deployed to AWS Lightsail
- ✅ Custom domain with HTTPS
- ✅ Riot API verification file live
- ✅ Ready for production API key
- ✅ Automatic backups enabled
- ✅ All for $10.50/month

**Next:**
- Get Riot production API key
- Add Riot Sign-On (RSO)
- Remove MTG code
- Add new features!

Need help with anything? Let me know! 🚀
