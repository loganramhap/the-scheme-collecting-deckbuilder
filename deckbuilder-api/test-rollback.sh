#!/bin/bash

# Rollback Test Script
# This script tests the rollback procedure in a safe way

set -e

echo "🔧 RSO Rollback Test Script"
echo "============================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Must run from deckbuilder-api directory${NC}"
    exit 1
fi

echo "This script will test the rollback procedure by:"
echo "1. Checking current authentication status"
echo "2. Verifying backup procedures"
echo "3. Testing monitoring endpoints"
echo "4. Simulating rollback steps (dry run)"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
fi

# Step 1: Check authentication status
echo ""
echo -e "${YELLOW}Step 1: Checking authentication status...${NC}"
if curl -s http://localhost:3001/api/auth/metrics/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running${NC}"
    
    # Get health status
    HEALTH=$(curl -s http://localhost:3001/api/auth/metrics/health)
    echo "Health Status:"
    echo "$HEALTH" | jq '.' 2>/dev/null || echo "$HEALTH"
else
    echo -e "${RED}✗ Backend is not running or not responding${NC}"
    echo "Start the backend with: npm run dev"
    exit 1
fi

# Step 2: Check metrics
echo ""
echo -e "${YELLOW}Step 2: Checking authentication metrics...${NC}"
METRICS=$(curl -s http://localhost:3001/api/auth/metrics)
echo "Current Metrics:"
echo "$METRICS" | jq '.' 2>/dev/null || echo "$METRICS"

# Calculate success rate
AUTH_ATTEMPTS=$(echo "$METRICS" | jq -r '.authAttempts' 2>/dev/null || echo "0")
AUTH_SUCCESSES=$(echo "$METRICS" | jq -r '.authSuccesses' 2>/dev/null || echo "0")

if [ "$AUTH_ATTEMPTS" -gt 0 ]; then
    SUCCESS_RATE=$(echo "scale=2; $AUTH_SUCCESSES * 100 / $AUTH_ATTEMPTS" | bc)
    echo -e "Success Rate: ${GREEN}${SUCCESS_RATE}%${NC}"
    
    if (( $(echo "$SUCCESS_RATE < 50" | bc -l) )); then
        echo -e "${RED}⚠ Warning: Success rate below 50% - consider rollback${NC}"
    fi
else
    echo "No authentication attempts recorded yet"
fi

# Step 3: Check recent errors
echo ""
echo -e "${YELLOW}Step 3: Checking recent errors...${NC}"
ERRORS=$(curl -s "http://localhost:3001/api/auth/metrics/errors?limit=5")
ERROR_COUNT=$(echo "$ERRORS" | jq -r '.count' 2>/dev/null || echo "0")

if [ "$ERROR_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}Found $ERROR_COUNT recent errors:${NC}"
    echo "$ERRORS" | jq '.errors' 2>/dev/null || echo "$ERRORS"
else
    echo -e "${GREEN}✓ No recent errors${NC}"
fi

# Step 4: Verify backup files exist
echo ""
echo -e "${YELLOW}Step 4: Verifying backup procedures...${NC}"

# Check if .env exists
if [ -f ".env" ]; then
    echo -e "${GREEN}✓ .env file exists${NC}"
else
    echo -e "${RED}✗ .env file not found${NC}"
fi

# Check if .env.example exists
if [ -f ".env.example" ]; then
    echo -e "${GREEN}✓ .env.example exists${NC}"
else
    echo -e "${YELLOW}⚠ .env.example not found${NC}"
fi

# Step 5: Test DynamoDB connection
echo ""
echo -e "${YELLOW}Step 5: Testing DynamoDB connection...${NC}"

# Check if AWS CLI is installed
if command -v aws &> /dev/null; then
    echo "Testing DynamoDB access..."
    
    # Try to list tables
    if aws dynamodb list-tables --region ${AWS_REGION:-us-east-1} > /dev/null 2>&1; then
        echo -e "${GREEN}✓ DynamoDB connection successful${NC}"
        
        # Check if our tables exist
        TABLES=$(aws dynamodb list-tables --region ${AWS_REGION:-us-east-1} --output json)
        
        if echo "$TABLES" | grep -q "deckbuilder-users"; then
            echo -e "${GREEN}✓ deckbuilder-users table exists${NC}"
        else
            echo -e "${RED}✗ deckbuilder-users table not found${NC}"
        fi
        
        if echo "$TABLES" | grep -q "deckbuilder-sessions"; then
            echo -e "${GREEN}✓ deckbuilder-sessions table exists${NC}"
        else
            echo -e "${RED}✗ deckbuilder-sessions table not found${NC}"
        fi
    else
        echo -e "${RED}✗ Cannot connect to DynamoDB${NC}"
        echo "Check AWS credentials and region"
    fi
else
    echo -e "${YELLOW}⚠ AWS CLI not installed - skipping DynamoDB test${NC}"
fi

# Step 6: Simulate rollback steps (dry run)
echo ""
echo -e "${YELLOW}Step 6: Simulating rollback steps (dry run)...${NC}"
echo ""
echo "Rollback would perform these steps:"
echo "1. Enable maintenance mode"
echo "2. Disable RSO endpoints"
echo "3. Re-enable Gitea authentication"
echo "4. Deploy frontend changes"
echo "5. Test authentication"
echo "6. Disable maintenance mode"
echo ""
echo -e "${GREEN}This is a dry run - no changes will be made${NC}"

# Step 7: Check Gitea connection
echo ""
echo -e "${YELLOW}Step 7: Testing Gitea connection...${NC}"

GITEA_URL=${GITEA_URL:-http://localhost:3000}

if curl -s "$GITEA_URL/api/v1/version" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Gitea is accessible at $GITEA_URL${NC}"
    
    VERSION=$(curl -s "$GITEA_URL/api/v1/version")
    echo "Gitea Version: $VERSION"
else
    echo -e "${RED}✗ Cannot connect to Gitea at $GITEA_URL${NC}"
    echo "Gitea must be running for rollback to work"
fi

# Summary
echo ""
echo "============================"
echo -e "${GREEN}Rollback Test Complete${NC}"
echo "============================"
echo ""
echo "Summary:"
echo "- Backend Status: $(curl -s http://localhost:3001/api/auth/metrics/health > /dev/null 2>&1 && echo "Running" || echo "Not Running")"
echo "- Auth Success Rate: ${SUCCESS_RATE:-N/A}%"
echo "- Recent Errors: $ERROR_COUNT"
echo "- DynamoDB: $(aws dynamodb list-tables --region ${AWS_REGION:-us-east-1} > /dev/null 2>&1 && echo "Connected" || echo "Not Connected")"
echo "- Gitea: $(curl -s "$GITEA_URL/api/v1/version" > /dev/null 2>&1 && echo "Connected" || echo "Not Connected")"
echo ""

# Recommendations
if [ "$ERROR_COUNT" -gt 10 ]; then
    echo -e "${RED}⚠ RECOMMENDATION: High error count - investigate before proceeding${NC}"
fi

if [ "$AUTH_ATTEMPTS" -gt 0 ] && (( $(echo "$SUCCESS_RATE < 50" | bc -l) )); then
    echo -e "${RED}⚠ RECOMMENDATION: Low success rate - consider rollback${NC}"
fi

echo ""
echo "For actual rollback, follow the procedures in:"
echo "docs/RSO_ROLLBACK_PLAN.md"
echo ""
