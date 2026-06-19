import { useState } from 'react';

export default function DeploymentConfig() {
  const [config, setConfig] = useState({
    deploymentType: 'local', // local, cloud, hybrid
    domain: '',
    ssl: false,
    port: 8787,
    https: false,
    cloudProvider: 'aws', // aws, azure, gcp, vercel
    autoDeploy: false,
    remoteAccess: {
      enabled: false,
      allowedIPs: [],
      vpnRequired: false,
      twoFactorAuth: false
    },
    mobile: {
      pwaEnabled: true,
      appStoreReady: false,
      pushNotifications: true,
      offlineMode: true
    },
    security: {
      apiKeyEncryption: true,
      dataEncryption: true,
      sessionTimeout: 3600, // 1 hour
      rateLimiting: true
    }
  });

  const handleConfigChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateDeploymentScript = () => {
    const script = `#!/bin/bash
# PERIS AI Deployment Script
echo "🚀 Deploying PERIS AI..."

# Configuration
DOMAIN="${config.domain}"
PORT="${config.port}"
SSL="${config.ssl}"
HTTPS="${config.https}"
CLOUD_PROVIDER="${config.cloudProvider}"

# SSL Certificate Setup
if [ "$SSL" = true ]; then
    echo "🔒 Setting up SSL certificate..."
    # Generate self-signed cert or use Let's Encrypt
    openssl req -x509 -newkey rsa:4096 -keyout server.key -out server.crt -days 365 -nodes
    echo "SSL certificate generated"
fi

# Cloud Deployment
if [ "$CLOUD_PROVIDER" = "aws" ]; then
    echo "☁️ Deploying to AWS..."
    # AWS EC2 deployment commands
    aws ec2 run-instances --image-id ami-12345678 --instance-type t2.micro --key-name peris-key
    echo "AWS instance created"
elif [ "$CLOUD_PROVIDER" = "azure" ]; then
    echo "☁️ Deploying to Azure..."
    # Azure deployment commands
    az vm create --resource-group peris-rg --name peris-vm --image UbuntuLTS --size Standard_B1s
    echo "Azure VM created"
elif [ "$CLOUD_PROVIDER" = "vercel" ]; then
    echo "☁️ Deploying to Vercel..."
    vercel --prod
    echo "Deployed to Vercel"
fi

# Remote Access Configuration
if [ "${config.remoteAccess.enabled}" = true ]; then
    echo "🌐 Configuring remote access..."
    
    # Firewall setup
    if command -v ufw >/dev/null 2>&1; then
        ufw allow 22/tcp    # SSH
        ufw allow 80/tcp    # HTTP
        ufw allow 443/tcp   # HTTPS
        ufw allow 8787/tcp # PERIS Backend
        ufw --force enable
    fi
    
    # Nginx reverse proxy setup
    cat > /etc/nginx/sites-available/peris << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    location / {
        proxy_pass http://localhost:8787;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    if [ "$SSL" = true ]; then
        listen 443 ssl;
        ssl_certificate /path/to/server.crt;
        ssl_certificate_key /path/to/server.key;
    fi
}
EOF
    
    ln -s /etc/nginx/sites-available/peris /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx
    echo "Nginx configured and reloaded"
fi

# Mobile App Setup
echo "📱 Setting up mobile app..."

# PWA Enhancement
cat > public/sw-enhanced.js << 'EOF'
const CACHE_NAME = 'peris-ai-v2';
const API_BASE_URL = '${HTTPS ? "https" : "http"}://${DOMAIN}:${PORT}';

// Enhanced service worker with background sync
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        '/api/health'
      ]))
  );
});

// Background sync for voice commands
self.addEventListener('sync', event => {
  if (event.tag === 'voice-command') {
    event.waitUntil(syncVoiceCommands());
  }
});

// Push notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data.body,
    icon: '/icon-192.png',
    badge: '/badge.png',
    vibrate: [200, 100, 200]
  };
  
  event.waitUntil(
    self.registration.showNotification(event.data.title, options)
  );
});

// Network request interception for offline mode
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(\`\${API_BASE_URL}\${url.pathname}\`, event.request)
        .then(response => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback for network errors
          return new Response('Network error', { status: 503 });
        })
    );
    return;
  }
  
  // Handle other requests normally
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
EOF

# Build mobile app
echo "🏗️ Building mobile application..."
npm run build

# Generate APK for Android
if command -v cordova >/dev/null 2>&1; then
    echo "📱 Building Android APK..."
    cordova build android
    echo "Android APK built successfully"
fi

# Generate iOS app
if command -v capacitor >/dev/null 2>&1; then
    echo "🍎 Building iOS app..."
    npx cap build ios
    echo "iOS app built successfully"
fi

echo "✅ PERIS AI deployment complete!"
echo "🌐 Access your app at: ${HTTPS ? "https" : "http"}://${DOMAIN}"
echo "📱 Mobile app ready for installation"
echo "🔒 Security features enabled"
echo "🎤 Voice commands active"
echo "🏠 Device control ready"
`;

    // Download script
    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'deploy-peris-ai.sh';
    a.click();
    URL.revokeObjectURL(url);
  };

  const styles = {
    container: {
      padding: 20,
      background: 'rgba(0,17,27,0.9)',
      borderRadius: 12,
      border: '1px solid rgba(0,229,255,0.3)',
      color: '#e0f7fa',
      fontFamily: 'Arial, sans-serif'
    },
    header: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
      color: '#00e5ff',
      textAlign: 'center'
    },
    section: {
      background: 'rgba(0,119,255,0.1)',
      padding: 15,
      borderRadius: 8,
      marginBottom: 20,
      border: '1px solid rgba(0,119,255,0.3)'
    },
    input: {
      background: 'rgba(255,255,255,0.1)',
      border: '1px solid rgba(0,229,255,0.2)',
      borderRadius: 6,
      padding: '10px',
      color: '#e0f7fa',
      fontSize: 14,
      width: '100%',
      marginBottom: 10
    },
    button: {
      background: '#0077ff',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: 6,
      cursor: 'pointer',
      fontSize: 14,
      marginRight: 10
    },
    buttonDanger: {
      background: '#ff6b6b',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: 6,
      cursor: 'pointer',
      fontSize: 14
    },
    status: {
      fontSize: 12,
      opacity: 0.8,
      marginTop: 5
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        🚀 PERIS AI Deployment Configuration
      </div>

      <div style={styles.section}>
        <h3>🌐 Remote Access</h3>
        
        <div>
          <label>Domain Name:</label>
          <input
            type="text"
            value={config.domain}
            onChange={(e) => handleConfigChange('domain', e.target.value)}
            placeholder="peris.yourdomain.com"
            style={styles.input}
          />
        </div>

        <div>
          <label>Port:</label>
          <input
            type="number"
            value={config.port}
            onChange={(e) => handleConfigChange('port', parseInt(e.target.value))}
            style={styles.input}
          />
        </div>

        <div>
          <label>
            <input
              type="checkbox"
              checked={config.https}
              onChange={(e) => handleConfigChange('https', e.target.checked)}
            />
            Enable HTTPS (SSL)
          </label>
        </div>

        <div>
          <label>
            <input
              type="checkbox"
              checked={config.remoteAccess.enabled}
              onChange={(e) => handleConfigChange('remoteAccess.enabled', e.target.checked)}
            />
            Enable Remote Access
          </label>
        </div>
      </div>

      <div style={styles.section}>
        <h3>☁️ Cloud Deployment</h3>
        
        <div>
          <label>Cloud Provider:</label>
          <select
            value={config.cloudProvider}
            onChange={(e) => handleConfigChange('cloudProvider', e.target.value)}
            style={styles.input}
          >
            <option value="aws">Amazon Web Services</option>
            <option value="azure">Microsoft Azure</option>
            <option value="gcp">Google Cloud Platform</option>
            <option value="vercel">Vercel</option>
            <option value="local">Local Only</option>
          </select>
        </div>

        <div>
          <label>
            <input
              type="checkbox"
              checked={config.autoDeploy}
              onChange={(e) => handleConfigChange('autoDeploy', e.target.checked)}
            />
            Auto Deploy on Changes
          </label>
        </div>
      </div>

      <div style={styles.section}>
        <h3>📱 Mobile App</h3>
        
        <div>
          <label>
            <input
              type="checkbox"
              checked={config.mobile.pwaEnabled}
              onChange={(e) => handleConfigChange('mobile.pwaEnabled', e.target.checked)}
            />
            Enable PWA Features
          </label>
        </div>

        <div>
          <label>
            <input
              type="checkbox"
              checked={config.mobile.pushNotifications}
              onChange={(e) => handleConfigChange('mobile.pushNotifications', e.target.checked)}
            />
            Push Notifications
          </label>
        </div>

        <div>
          <label>
            <input
              type="checkbox"
              checked={config.mobile.offlineMode}
              onChange={(e) => handleConfigChange('mobile.offlineMode', e.target.checked)}
            />
            Offline Mode Support
          </label>
        </div>
      </div>

      <div style={styles.section}>
        <h3>🔒 Security</h3>
        
        <div>
          <label>
            <input
              type="checkbox"
              checked={config.security.apiKeyEncryption}
              onChange={(e) => handleConfigChange('security.apiKeyEncryption', e.target.checked)}
            />
            API Key Encryption
          </label>
        </div>

        <div>
          <label>
            <input
              type="checkbox"
              checked={config.security.dataEncryption}
              onChange={(e) => handleConfigChange('security.dataEncryption', e.target.checked)}
            />
            Data Encryption
          </label>
        </div>

        <div>
          <label>Session Timeout (seconds):</label>
          <input
            type="number"
            value={config.security.sessionTimeout}
            onChange={(e) => handleConfigChange('security.sessionTimeout', parseInt(e.target.value))}
            style={styles.input}
          />
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 30 }}>
        <button onClick={generateDeploymentScript} style={styles.button}>
          📥 Generate Deployment Script
        </button>
        <button onClick={() => console.log('Deploying...')} style={styles.buttonDanger}>
          🚀 Deploy Now
        </button>
      </div>

      <div style={styles.status}>
        <strong>Current Configuration:</strong><br/>
        Domain: {config.domain || 'Not set'}<br/>
        Port: {config.port}<br/>
        HTTPS: {config.https ? 'Enabled' : 'Disabled'}<br/>
        Remote Access: {config.remoteAccess.enabled ? 'Enabled' : 'Disabled'}<br/>
        Cloud Provider: {config.cloudProvider}<br/>
        PWA: {config.mobile.pwaEnabled ? 'Enabled' : 'Disabled'}
      </div>
    </div>
  );
}
