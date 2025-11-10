#!/bin/bash

# Update Nginx configuration for DeckBuilder
# Run this inside your LXC container

echo "Updating Nginx configuration..."

# Backup current config
cp /etc/nginx/sites-available/deckbuilder /etc/nginx/sites-available/deckbuilder.backup.$(date +%Y%m%d_%H%M%S)

# Copy new config
cp nginx-deckbuilder.conf /etc/nginx/sites-available/deckbuilder

# Test configuration
nginx -t

if [ $? -eq 0 ]; then
    echo "✓ Configuration is valid"
    echo "Reloading Nginx..."
    systemctl reload nginx
    echo "✓ Nginx reloaded successfully"
    echo ""
    echo "OAuth should now work properly!"
else
    echo "✗ Configuration has errors"
    echo "Restoring backup..."
    cp /etc/nginx/sites-available/deckbuilder.backup.$(date +%Y%m%d_%H%M%S) /etc/nginx/sites-available/deckbuilder
    exit 1
fi
