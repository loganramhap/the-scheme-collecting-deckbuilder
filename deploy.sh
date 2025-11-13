#!/bin/bash

# Zaunite Workshop Deployment Script
# Run this on Lightsail after pulling latest changes

set -e  # Exit on any error

echo "🚀 Starting deployment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${BLUE}📦 Step 1: Pulling latest changes...${NC}"
git pull
echo -e "${GREEN}✓ Git pull complete${NC}"
echo ""

echo -e "${BLUE}📦 Step 2: Installing backend dependencies...${NC}"
cd deckbuilder-api
npm install
echo -e "${GREEN}✓ Backend dependencies installed${NC}"
echo ""

echo -e "${BLUE}📦 Step 3: Installing frontend dependencies...${NC}"
cd ../deckbuilder-webapp
npm install
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
echo ""

echo -e "${BLUE}🏗️  Step 4: Building frontend...${NC}"
npm run build
echo -e "${GREEN}✓ Frontend built successfully${NC}"
echo ""

echo -e "${BLUE}🔧 Step 5: Fixing permissions...${NC}"
cd ..
chmod 755 /home/ubuntu
chmod 755 /home/ubuntu/the-scheme-collecting-deckbuilder
chmod 755 /home/ubuntu/the-scheme-collecting-deckbuilder/deckbuilder-webapp
chmod -R 755 /home/ubuntu/the-scheme-collecting-deckbuilder/deckbuilder-webapp/dist
echo -e "${GREEN}✓ Permissions fixed${NC}"
echo ""

echo -e "${BLUE}🔄 Step 6: Restarting services...${NC}"

# Restart PM2 backend API
if command -v pm2 &> /dev/null; then
    cd deckbuilder-api
    pm2 restart deckbuilder-api || pm2 start src/index.js --name deckbuilder-api
    cd ..
    echo -e "${GREEN}✓ PM2 backend restarted${NC}"
fi

# Restart Docker containers if using docker-compose
if [ -f "docker-compose.yml" ]; then
    docker-compose restart
    echo -e "${GREEN}✓ Docker services restarted${NC}"
fi

# Reload Nginx
sudo systemctl reload nginx
echo -e "${GREEN}✓ Nginx reloaded${NC}"
echo ""

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${YELLOW}🌐 Your site is live at: https://zauniteworkshop.com${NC}"
echo ""
echo "📋 Quick checks:"
echo "  - Frontend: https://zauniteworkshop.com"
echo "  - Gitea (via SSH tunnel): http://localhost:3000"
echo ""
