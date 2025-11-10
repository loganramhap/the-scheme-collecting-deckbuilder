#!/bin/bash

# Fix Gitea to work properly under /gitea/ subdirectory
# Run this inside your LXC container

echo "Fixing Gitea subdirectory configuration..."

# Update Gitea config to use /gitea/ as ROOT_URL
sed -i 's|ROOT_URL = https://.*|ROOT_URL = http://192.168.86.164/gitea/|g' /etc/gitea/app.ini

# Also update the DOMAIN if needed
sed -i 's|DOMAIN = .*|DOMAIN = 192.168.86.164|g' /etc/gitea/app.ini

# Restart Gitea to apply changes
systemctl restart gitea

echo "Waiting for Gitea to restart..."
sleep 5

# Check if Gitea is running
if systemctl is-active --quiet gitea; then
    echo "✓ Gitea restarted successfully"
    echo ""
    echo "Now try accessing: http://192.168.86.164/gitea/"
    echo ""
    echo "If you still have issues, try accessing directly on port 3000:"
    echo "http://192.168.86.164:3000"
else
    echo "✗ Gitea failed to start. Checking logs..."
    journalctl -u gitea -n 20
fi
