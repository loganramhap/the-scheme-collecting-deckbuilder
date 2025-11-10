#!/bin/bash

# Fix Gitea assets loading issue
# Run this inside your LXC container

echo "Fixing Gitea assets configuration..."

# Backup current config
cp /etc/nginx/sites-available/deckbuilder /etc/nginx/sites-available/deckbuilder.backup

# Create corrected Nginx config
cat > /etc/nginx/sites-available/deckbuilder << 'EOF'
server {
    listen 80;
    server_name _;

    # Serve Gitea directly (not through subdirectory)
    location / {
        # Check if this is a Gitea request (has /assets, /api, /user, /login, etc.)
        # If so, proxy to Gitea, otherwise serve web app
        
        # Gitea static assets
        location ~ ^/(assets|avatars|css|js|vendor|fonts|img)/ {
            proxy_pass http://127.0.0.1:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Gitea API
        location /api/ {
            proxy_pass http://127.0.0.1:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            client_max_body_size 50M;
        }
        
        # Gitea OAuth
        location /login/ {
            proxy_pass http://127.0.0.1:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Gitea user endpoints
        location /user/ {
            proxy_pass http://127.0.0.1:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Gitea admin
        location /admin/ {
            proxy_pass http://127.0.0.1:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Gitea repo/org pages
        location ~ ^/[^/]+/[^/]+\.git {
            proxy_pass http://127.0.0.1:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Gitea explore, notifications, etc.
        location ~ ^/(explore|notifications|issues|pulls|repo|org)/ {
            proxy_pass http://127.0.0.1:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Web app (default - must be last)
        try_files $uri $uri/ @webapp;
    }
    
    location @webapp {
        root /var/www/deckbuilder/deckbuilder-webapp/dist;
        try_files $uri $uri/ /index.html;
    }
}
EOF

# Test configuration
nginx -t

if [ $? -eq 0 ]; then
    echo "Configuration is valid. Restarting Nginx..."
    systemctl restart nginx
    echo "Done! Try accessing Gitea again."
else
    echo "Configuration has errors. Restoring backup..."
    mv /etc/nginx/sites-available/deckbuilder.backup /etc/nginx/sites-available/deckbuilder
    echo "Backup restored. Please check the configuration manually."
    exit 1
fi
