#!/bin/bash

# Backend Deployment Script for Zaunite Workshop
# This script deploys the backend API to production

set -e  # Exit on error

echo "=================================="
echo "Backend Deployment Script"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f "deckbuilder-api/.env.production" ]; then
    echo -e "${RED}Error: .env.production not found!${NC}"
    echo "Please create deckbuilder-api/.env.production from .env.production.example"
    exit 1
fi

echo -e "${YELLOW}Step 1: Validating environment variables...${NC}"
# Source the production env file to validate
set -a
source deckbuilder-api/.env.production
set +a

# Check required variables
REQUIRED_VARS=(
    "RIOT_CLIENT_ID"
    "RIOT_CLIENT_SECRET"
    "RIOT_REDIRECT_URI"
    "SESSION_SECRET"
    "ENCRYPTION_KEY"
    "AWS_REGION"
    "AWS_ACCESS_KEY_ID"
    "AWS_SECRET_ACCESS_KEY"
    "DYNAMODB_USERS_TABLE"
    "DYNAMODB_SESSIONS_TABLE"
    "GITEA_ADMIN_TOKEN"
    "FRONTEND_URL"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo -e "${RED}Error: Missing required environment variables:${NC}"
    printf '%s\n' "${MISSING_VARS[@]}"
    exit 1
fi

echo -e "${GREEN}✓ Environment variables validated${NC}"
echo ""

echo -e "${YELLOW}Step 2: Setting up DynamoDB tables...${NC}"
cd deckbuilder-api
npm run setup:dynamodb
cd ..
echo -e "${GREEN}✓ DynamoDB tables ready${NC}"
echo ""

echo -e "${YELLOW}Step 3: Building Docker image...${NC}"
docker build -t deckbuilder-api:latest ./deckbuilder-api
echo -e "${GREEN}✓ Docker image built${NC}"
echo ""

echo -e "${YELLOW}Step 4: Stopping existing containers...${NC}"
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down api
echo -e "${GREEN}✓ Containers stopped${NC}"
echo ""

echo -e "${YELLOW}Step 5: Starting backend services...${NC}"
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d api
echo -e "${GREEN}✓ Backend services started${NC}"
echo ""

echo -e "${YELLOW}Step 6: Waiting for API to be healthy...${NC}"
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ API is healthy${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Waiting for API... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}Error: API failed to start${NC}"
    echo "Check logs with: docker-compose logs api"
    exit 1
fi

echo ""
echo "=================================="
echo -e "${GREEN}✓ Backend Deployment Complete!${NC}"
echo "=================================="
echo ""
echo "API is running at: http://localhost:3001"
echo ""
echo "Useful commands:"
echo "  View logs:    docker-compose logs -f api"
echo "  Restart:      docker-compose restart api"
echo "  Stop:         docker-compose stop api"
echo ""
