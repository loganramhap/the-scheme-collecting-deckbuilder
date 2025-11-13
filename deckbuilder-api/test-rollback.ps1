# Rollback Test Script (PowerShell)
# This script tests the rollback procedure in a safe way

Write-Host "🔧 RSO Rollback Test Script" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: Must run from deckbuilder-api directory" -ForegroundColor Red
    exit 1
}

Write-Host "This script will test the rollback procedure by:"
Write-Host "1. Checking current authentication status"
Write-Host "2. Verifying backup procedures"
Write-Host "3. Testing monitoring endpoints"
Write-Host "4. Simulating rollback steps (dry run)"
Write-Host ""
$continue = Read-Host "Continue? (y/n)"
if ($continue -ne "y" -and $continue -ne "Y") {
    exit 0
}

# Step 1: Check authentication status
Write-Host ""
Write-Host "Step 1: Checking authentication status..." -ForegroundColor Yellow

try {
    $health = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/metrics/health" -Method Get
    Write-Host "✓ Backend is running" -ForegroundColor Green
    
    Write-Host "Health Status:"
    $health | ConvertTo-Json -Depth 10
} catch {
    Write-Host "✗ Backend is not running or not responding" -ForegroundColor Red
    Write-Host "Start the backend with: npm run dev"
    exit 1
}

# Step 2: Check metrics
Write-Host ""
Write-Host "Step 2: Checking authentication metrics..." -ForegroundColor Yellow

try {
    $metrics = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/metrics" -Method Get
    Write-Host "Current Metrics:"
    $metrics | ConvertTo-Json -Depth 10
    
    # Calculate success rate
    $authAttempts = $metrics.authAttempts
    $authSuccesses = $metrics.authSuccesses
    
    if ($authAttempts -gt 0) {
        $successRate = ($authSuccesses / $authAttempts) * 100
        Write-Host "Success Rate: $($successRate.ToString('F2'))%" -ForegroundColor Green
        
        if ($successRate -lt 50) {
            Write-Host "⚠ Warning: Success rate below 50% - consider rollback" -ForegroundColor Red
        }
    } else {
        Write-Host "No authentication attempts recorded yet"
    }
} catch {
    Write-Host "✗ Failed to get metrics" -ForegroundColor Red
}

# Step 3: Check recent errors
Write-Host ""
Write-Host "Step 3: Checking recent errors..." -ForegroundColor Yellow

try {
    $errors = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/metrics/errors?limit=5" -Method Get
    $errorCount = $errors.count
    
    if ($errorCount -gt 0) {
        Write-Host "Found $errorCount recent errors:" -ForegroundColor Yellow
        $errors.errors | ConvertTo-Json -Depth 10
    } else {
        Write-Host "✓ No recent errors" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Failed to get errors" -ForegroundColor Red
}

# Step 4: Verify backup files exist
Write-Host ""
Write-Host "Step 4: Verifying backup procedures..." -ForegroundColor Yellow

if (Test-Path ".env") {
    Write-Host "✓ .env file exists" -ForegroundColor Green
} else {
    Write-Host "✗ .env file not found" -ForegroundColor Red
}

if (Test-Path ".env.example") {
    Write-Host "✓ .env.example exists" -ForegroundColor Green
} else {
    Write-Host "⚠ .env.example not found" -ForegroundColor Yellow
}

# Step 5: Test DynamoDB connection
Write-Host ""
Write-Host "Step 5: Testing DynamoDB connection..." -ForegroundColor Yellow

# Check if AWS CLI is installed
$awsInstalled = Get-Command aws -ErrorAction SilentlyContinue

if ($awsInstalled) {
    Write-Host "Testing DynamoDB access..."
    
    try {
        $region = $env:AWS_REGION
        if (-not $region) { $region = "us-east-1" }
        
        $tables = aws dynamodb list-tables --region $region --output json | ConvertFrom-Json
        Write-Host "✓ DynamoDB connection successful" -ForegroundColor Green
        
        if ($tables.TableNames -contains "deckbuilder-users") {
            Write-Host "✓ deckbuilder-users table exists" -ForegroundColor Green
        } else {
            Write-Host "✗ deckbuilder-users table not found" -ForegroundColor Red
        }
        
        if ($tables.TableNames -contains "deckbuilder-sessions") {
            Write-Host "✓ deckbuilder-sessions table exists" -ForegroundColor Green
        } else {
            Write-Host "✗ deckbuilder-sessions table not found" -ForegroundColor Red
        }
    } catch {
        Write-Host "✗ Cannot connect to DynamoDB" -ForegroundColor Red
        Write-Host "Check AWS credentials and region"
    }
} else {
    Write-Host "⚠ AWS CLI not installed - skipping DynamoDB test" -ForegroundColor Yellow
}

# Step 6: Simulate rollback steps (dry run)
Write-Host ""
Write-Host "Step 6: Simulating rollback steps (dry run)..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Rollback would perform these steps:"
Write-Host "1. Enable maintenance mode"
Write-Host "2. Disable RSO endpoints"
Write-Host "3. Re-enable Gitea authentication"
Write-Host "4. Deploy frontend changes"
Write-Host "5. Test authentication"
Write-Host "6. Disable maintenance mode"
Write-Host ""
Write-Host "This is a dry run - no changes will be made" -ForegroundColor Green

# Step 7: Check Gitea connection
Write-Host ""
Write-Host "Step 7: Testing Gitea connection..." -ForegroundColor Yellow

$giteaUrl = $env:GITEA_URL
if (-not $giteaUrl) { $giteaUrl = "http://localhost:3000" }

try {
    $version = Invoke-RestMethod -Uri "$giteaUrl/api/v1/version" -Method Get
    Write-Host "✓ Gitea is accessible at $giteaUrl" -ForegroundColor Green
    Write-Host "Gitea Version: $($version.version)"
} catch {
    Write-Host "✗ Cannot connect to Gitea at $giteaUrl" -ForegroundColor Red
    Write-Host "Gitea must be running for rollback to work"
}

# Summary
Write-Host ""
Write-Host "============================" -ForegroundColor Cyan
Write-Host "Rollback Test Complete" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:"

try {
    Invoke-RestMethod -Uri "http://localhost:3001/api/auth/metrics/health" -Method Get | Out-Null
    Write-Host "- Backend Status: Running"
} catch {
    Write-Host "- Backend Status: Not Running"
}

if ($authAttempts -gt 0) {
    Write-Host "- Auth Success Rate: $($successRate.ToString('F2'))%"
} else {
    Write-Host "- Auth Success Rate: N/A"
}

Write-Host "- Recent Errors: $errorCount"

try {
    aws dynamodb list-tables --region $region --output json | Out-Null
    Write-Host "- DynamoDB: Connected"
} catch {
    Write-Host "- DynamoDB: Not Connected"
}

try {
    Invoke-RestMethod -Uri "$giteaUrl/api/v1/version" -Method Get | Out-Null
    Write-Host "- Gitea: Connected"
} catch {
    Write-Host "- Gitea: Not Connected"
}

Write-Host ""

# Recommendations
if ($errorCount -gt 10) {
    Write-Host "⚠ RECOMMENDATION: High error count - investigate before proceeding" -ForegroundColor Red
}

if ($authAttempts -gt 0 -and $successRate -lt 50) {
    Write-Host "⚠ RECOMMENDATION: Low success rate - consider rollback" -ForegroundColor Red
}

Write-Host ""
Write-Host "For actual rollback, follow the procedures in:"
Write-Host "docs/RSO_ROLLBACK_PLAN.md"
Write-Host ""
