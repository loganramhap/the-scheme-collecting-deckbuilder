#!/bin/bash
# Setup Backend API for Account Creation
# Run this inside your Proxmox container

set -e

echo "=== DeckBuilder Backend API Setup ==="
echo ""

# Check if we're in the right directory
if [ ! -d "deckbuilder-api" ]; then
    echo "Error: deckbuilder-api directory not found"
    echo "Please run this script from the project root (/var/www/deckbuilder)"
    exit 1
fi

# Step 1: Install dependencies
echo "Step 1: Installing backend API dependencies..."
cd deckbuilder-api
npm install

# Step 2: Check for .env file
if [ ! -f ".env" ]; then
    echo ""
    echo "Step 2: Creating .env file..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: You need to add your Gitea admin token!"
    echo ""
    echo "To get the admin token:"
    echo "1. Open Gitea in browser (http://YOUR_IP:3000)"
    echo "2. Login as admin"
    echo "3. Go to Settings → Applications"
    echo "4. Click 'Generate New Token'"
    echo "5. Name it 'DeckBuilder API'"
    echo "6. Select all permissions"
    echo "7. Copy the token"
    echo ""
    echo "Then edit the .env file:"
    echo "  nano /var/www/deckbuilder/deckbuilder-api/.env"
    echo ""
    echo "And set:"
    echo "  GITEA_ADMIN_TOKEN=your_token_here"
    echo ""
    read -p "Press Enter after you've added the token..."
else
    echo "Step 2: .env file already exists"
fi

# Step 3: Install PM2 for process management
echo ""
echo "Step 3: Installing PM2 for process management..."
npm install -g pm2

# Step 4: Start the API with PM2
echo ""
echo "Step 4: Starting backend API with PM2..."
pm2 delete deckbuilder-api 2>/dev/null || true
pm2 start npm --name "deckbuilder-api" -- run dev

# Step 5: Configure PM2 to start on boot
echo ""
echo "Step 5: Configuring PM2 to start on boot..."
pm2 startup systemd -u root --hp /root
pm2 save

# Step 6: Test the API
echo ""
echo "Step 6: Testing API..."
sleep 2
if curl -s http://localhost:3001/health | grep -q "ok"; then
    echo "✅ Backend API is running!"
else
    echo "❌ Backend API test failed"
    echo "Check logs with: pm2 logs deckbuilder-api"
    exit 1
fi

# Step 7: Update nginx configuration
echo ""
echo "Step 7: Updating nginx configuration..."
cd /var/www/deckbuilder

# Backup existing config
cp /etc/nginx/sites-available/deckbuilder /etc/nginx/sites-available/deckbuilder.backup

# Copy new config
cp nginx-deckbuilder.conf /etc/nginx/sites-available/deckbuilder

# Test nginx config
if nginx -t; then
    echo "✅ Nginx configuration is valid"
    systemctl reload nginx
    echo "✅ Nginx reloaded"
else
    echo "❌ Nginx configuration error"
    echo "Restoring backup..."
    cp /etc/nginx/sites-available/deckbuilder.backup /etc/nginx/sites-available/deckbuilder
    exit 1
fi

# Step 8: Get container IP
CONTAINER_IP=$(hostname -I | awk '{print $1}')

# Step 9: Update web app configuration
echo ""
echo "Step 8: Updating web app configuration..."
cd /var/www/deckbuilder/deckbuilder-webapp

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env from example..."
    cp .env.example .env
fi

# Update API URL in .env
if grep -q "VITE_API_URL" .env; then
    sed -i "s|VITE_API_URL=.*|VITE_API_URL=http://${CONTAINER_IP}/api|" .env
else
    echo "VITE_API_URL=http://${CONTAINER_IP}/api" >> .env
fi

# Update Gitea URL if it's still localhost
sed -i "s|VITE_GITEA_URL=http://localhost:3000|VITE_GITEA_URL=http://${CONTAINER_IP}:3000|" .env

echo "✅ Updated .env with container IP: ${CONTAINER_IP}"

# Step 10: Rebuild web app
echo ""
echo "Step 9: Rebuilding web app..."
npm run build

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "Backend API Status:"
pm2 status deckbuilder-api
echo ""
echo "Next steps:"
echo "1. Make sure you've added GITEA_ADMIN_TOKEN to deckbuilder-api/.env"
echo "2. Update OAuth redirect URI in Gitea to: http://${CONTAINER_IP}/auth/callback"
echo "3. Test account creation at: http://${CONTAINER_IP}"
echo ""
echo "Useful commands:"
echo "  pm2 logs deckbuilder-api    # View API logs"
echo "  pm2 restart deckbuilder-api # Restart API"
echo "  pm2 stop deckbuilder-api    # Stop API"
echo "  pm2 status                  # Check status"
echo ""

