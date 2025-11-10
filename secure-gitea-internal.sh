#!/bin/bash

# Secure Gitea - Make it only accessible internally
# Run this inside your LXC container

echo "Securing Gitea to internal access only..."

# 1. Configure Gitea to only listen on localhost
echo "Step 1: Configuring Gitea to listen on localhost only..."
sed -i 's|HTTP_ADDR = .*|HTTP_ADDR = 127.0.0.1|g' /etc/gitea/app.ini

# 2. Disable SSH server (optional, but recommended if not needed)
read -p "Disable Gitea SSH server? (yes/no, default: no): " DISABLE_SSH
DISABLE_SSH=${DISABLE_SSH:-no}

if [ "$DISABLE_SSH" = "yes" ]; then
    sed -i 's|DISABLE_SSH = false|DISABLE_SSH = true|g' /etc/gitea/app.ini
    sed -i 's|START_SSH_SERVER = true|START_SSH_SERVER = false|g' /etc/gitea/app.ini
    echo "✓ SSH server disabled"
fi

# 3. Update firewall to block external access to port 3000
echo "Step 2: Updating firewall rules..."
ufw delete allow 3000/tcp 2>/dev/null || true
echo "✓ Port 3000 blocked from external access"

# 4. Ensure port 2222 (Gitea SSH) is also blocked if SSH disabled
if [ "$DISABLE_SSH" = "yes" ]; then
    ufw delete allow 2222/tcp 2>/dev/null || true
    echo "✓ Port 2222 (Gitea SSH) blocked"
fi

# 5. Restart Gitea
echo "Step 3: Restarting Gitea..."
systemctl restart gitea
sleep 3

# 6. Verify Gitea is only listening on localhost
echo ""
echo "Verification:"
echo "============="

if netstat -tlnp | grep :3000 | grep -q 127.0.0.1; then
    echo "✓ Gitea is listening on localhost only (127.0.0.1:3000)"
else
    echo "⚠ Warning: Gitea might not be configured correctly"
    netstat -tlnp | grep :3000
fi

# 7. Test internal access
if curl -s http://127.0.0.1:3000 > /dev/null; then
    echo "✓ Gitea is accessible internally"
else
    echo "✗ Gitea is not responding on localhost"
fi

echo ""
echo "Security Configuration Complete!"
echo "================================"
echo ""
echo "Gitea is now:"
echo "  ✓ Only accessible from localhost (127.0.0.1)"
echo "  ✓ Not accessible from external network"
echo "  ✓ Only accessible through Nginx proxy"
echo ""
echo "Next steps:"
echo "  1. Set up Cloudflare Tunnel"
echo "  2. Point tunnel to http://localhost:80 (Nginx)"
echo "  3. Configure your domain in Cloudflare"
echo ""
echo "Nginx will proxy requests to Gitea internally."
