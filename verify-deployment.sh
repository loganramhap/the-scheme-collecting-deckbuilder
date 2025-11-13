#!/bin/bash

# Deployment Verification Script
# Verifies that the application is deployed correctly and functioning

set -e

echo "=================================="
echo "Deployment Verification"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
read -p "Enter your domain (e.g., zauniteworkshop.com): " DOMAIN
DOMAIN=${DOMAIN:-localhost}

if [ "$DOMAIN" = "localhost" ]; then
    API_URL="http://localhost:3001/api"
    FRONTEND_URL="http://localhost:5173"
else
    API_URL="https://$DOMAIN/api"
    FRONTEND_URL="https://$DOMAIN"
fi

PASSED=0
FAILED=0

# Test function
test_endpoint() {
    local name=$1
    local url=$2
    local expected_code=$3
    
    echo -n "Testing $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_code" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_code, got $response)"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Test function with content check
test_content() {
    local name=$1
    local url=$2
    local expected_content=$3
    
    echo -n "Testing $name... "
    
    response=$(curl -s "$url" 2>/dev/null || echo "")
    
    if echo "$response" | grep -q "$expected_content"; then
        echo -e "${GREEN}✓ PASS${NC}"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Content not found)"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo "Testing Backend API..."
echo "-----------------------------------"

# Test API health endpoint
test_endpoint "API Health" "$API_URL/health" "200"

# Test API auth endpoints exist
test_endpoint "Auth Init Endpoint" "$API_URL/auth/riot/init" "200"

# Test CORS headers
echo -n "Testing CORS headers... "
cors_header=$(curl -s -I -H "Origin: $FRONTEND_URL" "$API_URL/health" | grep -i "access-control-allow-origin" || echo "")
if [ ! -z "$cors_header" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC} (CORS headers not found)"
    FAILED=$((FAILED + 1))
fi

echo ""
echo "Testing Frontend..."
echo "-----------------------------------"

# Test frontend loads
test_endpoint "Frontend Homepage" "$FRONTEND_URL" "200"

# Test frontend serves index.html for routes
test_endpoint "Frontend Routing" "$FRONTEND_URL/login" "200"

# Test static assets
test_endpoint "Frontend Assets" "$FRONTEND_URL/assets" "200"

echo ""
echo "Testing SSL/HTTPS (if applicable)..."
echo "-----------------------------------"

if [ "$DOMAIN" != "localhost" ]; then
    # Test HTTPS redirect
    echo -n "Testing HTTP to HTTPS redirect... "
    redirect=$(curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN" 2>/dev/null || echo "000")
    if [ "$redirect" = "301" ] || [ "$redirect" = "302" ] || [ "$redirect" = "200" ]; then
        echo -e "${GREEN}✓ PASS${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${YELLOW}⚠ WARNING${NC} (No redirect configured)"
    fi
    
    # Test SSL certificate
    echo -n "Testing SSL certificate... "
    ssl_check=$(echo | openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" 2>/dev/null | grep -c "Verify return code: 0" || echo "0")
    if [ "$ssl_check" -gt 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC} (Invalid SSL certificate)"
        FAILED=$((FAILED + 1))
    fi
else
    echo "Skipping SSL tests for localhost"
fi

echo ""
echo "Testing Docker Services (if applicable)..."
echo "-----------------------------------"

if command -v docker &> /dev/null; then
    # Check if containers are running
    echo -n "Testing API container... "
    if docker ps | grep -q "deckbuilder-api"; then
        echo -e "${GREEN}✓ RUNNING${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${YELLOW}⚠ NOT RUNNING${NC}"
    fi
    
    echo -n "Testing Gitea container... "
    if docker ps | grep -q "deckbuilder-gitea"; then
        echo -e "${GREEN}✓ RUNNING${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${YELLOW}⚠ NOT RUNNING${NC}"
    fi
    
    echo -n "Testing Database container... "
    if docker ps | grep -q "deckbuilder-db"; then
        echo -e "${GREEN}✓ RUNNING${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${YELLOW}⚠ NOT RUNNING${NC}"
    fi
else
    echo "Docker not available, skipping container checks"
fi

echo ""
echo "Testing AWS Resources (if applicable)..."
echo "-----------------------------------"

if command -v aws &> /dev/null; then
    # Check DynamoDB tables
    echo -n "Testing DynamoDB users table... "
    if aws dynamodb describe-table --table-name deckbuilder-users-prod --region us-east-1 &>/dev/null; then
        echo -e "${GREEN}✓ EXISTS${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${YELLOW}⚠ NOT FOUND${NC}"
    fi
    
    echo -n "Testing DynamoDB sessions table... "
    if aws dynamodb describe-table --table-name deckbuilder-sessions-prod --region us-east-1 &>/dev/null; then
        echo -e "${GREEN}✓ EXISTS${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${YELLOW}⚠ NOT FOUND${NC}"
    fi
else
    echo "AWS CLI not available, skipping AWS checks"
fi

echo ""
echo "=================================="
echo "Verification Summary"
echo "=================================="
echo ""
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All critical tests passed!${NC}"
    echo ""
    echo "Your application appears to be deployed correctly."
    echo ""
    echo "Manual verification steps:"
    echo "1. Visit $FRONTEND_URL"
    echo "2. Click 'Sign in with Riot Games'"
    echo "3. Complete OAuth flow"
    echo "4. Create and save a deck"
    echo "5. Verify deck persists after reload"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    echo ""
    echo "Please review the failed tests above and:"
    echo "1. Check application logs"
    echo "2. Verify environment variables"
    echo "3. Check network connectivity"
    echo "4. Review deployment configuration"
    exit 1
fi
