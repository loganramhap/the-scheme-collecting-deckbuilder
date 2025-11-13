#!/bin/bash

# Frontend Deployment Script for Zaunite Workshop
# This script builds and deploys the frontend application

set -e  # Exit on error

echo "=================================="
echo "Frontend Deployment Script"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f "deckbuilder-webapp/.env.production" ]; then
    echo -e "${YELLOW}Warning: .env.production not found!${NC}"
    echo "Using .env.production.example as template..."
    if [ -f "deckbuilder-webapp/.env.production.example" ]; then
        cp deckbuilder-webapp/.env.production.example deckbuilder-webapp/.env.production
        echo -e "${RED}Please edit deckbuilder-webapp/.env.production with your production values${NC}"
        exit 1
    fi
fi

echo -e "${YELLOW}Step 1: Installing dependencies...${NC}"
cd deckbuilder-webapp
npm ci
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

echo -e "${YELLOW}Step 2: Running type check...${NC}"
npm run build -- --mode production 2>&1 | head -20
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Type check failed${NC}"
    echo "Fix TypeScript errors before deploying"
    exit 1
fi
echo -e "${GREEN}✓ Type check passed${NC}"
echo ""

echo -e "${YELLOW}Step 3: Building production bundle...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Production bundle built${NC}"
echo ""

# Check build size
BUILD_SIZE=$(du -sh dist | cut -f1)
echo "Build size: $BUILD_SIZE"
echo ""

cd ..

# Deployment method selection
echo "Select deployment method:"
echo "1) Docker container (local/server)"
echo "2) Static files to directory (Nginx)"
echo "3) AWS S3 + CloudFront"
echo "4) Skip deployment (build only)"
read -p "Enter choice [1-4]: " DEPLOY_METHOD

case $DEPLOY_METHOD in
    1)
        echo ""
        echo -e "${YELLOW}Step 4: Building Docker image...${NC}"
        docker build -t deckbuilder-webapp:latest ./deckbuilder-webapp
        echo -e "${GREEN}✓ Docker image built${NC}"
        echo ""
        
        echo -e "${YELLOW}Step 5: Deploying container...${NC}"
        docker stop deckbuilder-webapp 2>/dev/null || true
        docker rm deckbuilder-webapp 2>/dev/null || true
        docker run -d --name deckbuilder-webapp -p 8080:80 deckbuilder-webapp:latest
        echo -e "${GREEN}✓ Container deployed${NC}"
        echo ""
        echo "Frontend is running at: http://localhost:8080"
        ;;
        
    2)
        read -p "Enter deployment directory [/var/www/zauniteworkshop]: " DEPLOY_DIR
        DEPLOY_DIR=${DEPLOY_DIR:-/var/www/zauniteworkshop}
        
        echo ""
        echo -e "${YELLOW}Step 4: Deploying to $DEPLOY_DIR...${NC}"
        
        # Create backup
        if [ -d "$DEPLOY_DIR" ]; then
            echo "Creating backup..."
            sudo cp -r "$DEPLOY_DIR" "${DEPLOY_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
        fi
        
        # Deploy files
        sudo mkdir -p "$DEPLOY_DIR"
        sudo cp -r deckbuilder-webapp/dist/* "$DEPLOY_DIR/"
        sudo chown -R www-data:www-data "$DEPLOY_DIR"
        
        echo -e "${GREEN}✓ Files deployed to $DEPLOY_DIR${NC}"
        echo ""
        echo "Reload Nginx:"
        echo "  sudo nginx -t"
        echo "  sudo systemctl reload nginx"
        ;;
        
    3)
        read -p "Enter S3 bucket name: " S3_BUCKET
        read -p "Enter CloudFront distribution ID (optional): " CF_DIST_ID
        
        echo ""
        echo -e "${YELLOW}Step 4: Deploying to S3...${NC}"
        aws s3 sync deckbuilder-webapp/dist/ "s3://$S3_BUCKET/" --delete
        echo -e "${GREEN}✓ Files synced to S3${NC}"
        
        if [ ! -z "$CF_DIST_ID" ]; then
            echo ""
            echo -e "${YELLOW}Step 5: Invalidating CloudFront cache...${NC}"
            aws cloudfront create-invalidation --distribution-id "$CF_DIST_ID" --paths "/*"
            echo -e "${GREEN}✓ CloudFront cache invalidated${NC}"
        fi
        
        echo ""
        echo "Frontend deployed to S3"
        ;;
        
    4)
        echo ""
        echo -e "${GREEN}Build complete. Skipping deployment.${NC}"
        echo "Built files are in: deckbuilder-webapp/dist/"
        ;;
        
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo "=================================="
echo -e "${GREEN}✓ Frontend Deployment Complete!${NC}"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Verify OAuth redirect URI in Riot Developer Portal"
echo "2. Test authentication flow"
echo "3. Check browser console for errors"
echo "4. Monitor application logs"
echo ""
