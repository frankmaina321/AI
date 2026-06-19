import { useState, useEffect } from 'react';

export default function AuthSystem() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    twoFactorCode: ''
  });
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [devices, setDevices] = useState([]);

  // Check for existing session
  useEffect(() => {
    const savedUser = localStorage.getItem('peris_user');
    const savedToken = localStorage.getItem('peris_token');
    const savedDevices = localStorage.getItem('peris_devices');
    
    if (savedUser && savedToken) {
      try {
        // Validate token (in real app, this would be server validation)
        const tokenData = JSON.parse(atob(savedToken));
        if (tokenData.exp > Date.now()) {
          logout();
          return;
        }
        
        setUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
        if (savedDevices) {
          setDevices(JSON.parse(savedDevices));
        }
      } catch (error) {
        console.error('Token validation failed:', error);
        logout();
      }
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      // Simulate authentication (in real app, this would be API call)
      const response = await mockAuth(loginForm.email, loginForm.password);
      
      if (response.success) {
        const userData = {
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          role: response.user.role,
          permissions: response.user.permissions
        };
        
        // Create session token
        const tokenData = {
          ...userData,
          exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        };
        
        const token = btoa(JSON.stringify(tokenData));
        
        // Save to localStorage
        localStorage.setItem('peris_user', JSON.stringify(userData));
        localStorage.setItem('peris_token', token);
        
        setUser(userData);
        setIsAuthenticated(true);
        
        // Load user's devices
        if (response.user.devices) {
          setDevices(response.user.devices);
          localStorage.setItem('peris_devices', JSON.stringify(response.user.devices));
        }
      } else {
        if (response.requiresTwoFactor) {
          setShowTwoFactor(true);
        } else {
          alert('Login failed: ' + response.error);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    }
  };

  const handleTwoFactor = async (e) => {
    e.preventDefault();
    
    try {
      const response = await mockTwoFactor(loginForm.twoFactorCode);
      
      if (response.success) {
        setShowTwoFactor(false);
        setLoginForm(prev => ({ ...prev, twoFactorCode: '' }));
        
        // Complete login with 2FA token
        const userData = {
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          role: response.user.role,
          permissions: response.user.permissions
        };
        
        const tokenData = {
          ...userData,
          exp: Date.now() + (24 * 60 * 60 * 1000)
        };
        
        const token = btoa(JSON.stringify(tokenData));
        
        localStorage.setItem('peris_user', JSON.stringify(userData));
        localStorage.setItem('peris_token', token);
        
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        alert('Two-factor authentication failed');
      }
    } catch (error) {
      console.error('2FA error:', error);
      alert('Two-factor authentication failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('peris_user');
    localStorage.removeItem('peris_token');
    localStorage.removeItem('peris_devices');
    setUser(null);
    setIsAuthenticated(false);
    setDevices([]);
  };

  const addDevice = (deviceName) => {
    const newDevice = {
      id: Date.now(),
      name: deviceName,
      type: 'user-added',
      status: 'online',
      lastSeen: new Date(),
      capabilities: ['voice_control', 'remote_access']
    };
    
    const updatedDevices = [...devices, newDevice];
    setDevices(updatedDevices);
    localStorage.setItem('peris_devices', JSON.stringify(updatedDevices));
  };

  const removeDevice = (deviceId) => {
    const updatedDevices = devices.filter(d => d.id !== deviceId);
    setDevices(updatedDevices);
    localStorage.setItem('peris_devices', JSON.stringify(updatedDevices));
  };

  // Mock authentication functions (in real app, these would be API calls)
  const mockAuth = async (email, password) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (email === 'demo@peris.ai' && password === 'demo123') {
      return {
        success: true,
        user: {
          id: 1,
          name: 'Demo User',
          email: 'demo@peris.ai',
          role: 'admin',
          permissions: ['device_control', 'voice_commands', 'phone_integration', 'system_admin'],
          devices: [
            { id: 1, name: 'Living Room Lights', type: 'smart_light', status: 'online' },
            { id: 2, name: 'Smart Thermostat', type: 'thermostat', status: 'online' },
            { id: 3, name: 'Security System', type: 'security', status: 'online' }
          ]
        }
      };
    } else if (email === 'user@peris.ai' && password === 'user123') {
      return {
        success: true,
        user: {
          id: 2,
          name: 'Regular User',
          email: 'user@peris.ai',
          role: 'user',
          permissions: ['device_control', 'voice_commands', 'phone_integration'],
          devices: [
            { id: 4, name: 'Bedroom Lights', type: 'smart_light', status: 'online' },
            { id: 5, name: 'Phone System', type: 'phone', status: 'online' }
          ]
        }
      };
    } else {
      return {
        success: false,
        error: 'Invalid credentials',
        requiresTwoFactor: email.includes('admin')
      };
    }
  };

  const mockTwoFactor = async (code) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (code === '123456') {
      return {
        success: true,
        user: {
          id: 1,
          name: 'Demo User',
          email: 'demo@peris.ai',
          role: 'admin',
          permissions: ['device_control', 'voice_commands', 'phone_integration', 'system_admin']
        }
      };
    } else {
      return {
        success: false,
        error: 'Invalid 2FA code'
      };
    }
  };

  const styles = {
    container: {
      padding: 20,
      background: 'rgba(0,17,27,0.9)',
      borderRadius: 12,
      border: '1px solid rgba(0,229,255,0.3)',
      color: '#e0f7fa',
      fontFamily: 'Arial, sans-serif',
      minHeight: '100vh'
    },
    header: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
      color: '#00e5ff',
      textAlign: 'center'
    },
    form: {
      background: 'rgba(0,119,255,0.1)',
      padding: 20,
      borderRadius: 8,
      border: '1px solid rgba(0,119,255,0.3)',
      marginBottom: 20
    },
    input: {
      background: 'rgba(255,255,255,0.1)',
      border: '1px solid rgba(0,229,255,0.2)',
      borderRadius: 6,
      padding: '12px',
      color: '#e0f7fa',
      fontSize: 14,
      width: '100%',
      marginBottom: 10
    },
    button: {
      background: '#0077ff',
      color: 'white',
      border: 'none',
      padding: '12px 24px',
      borderRadius: 6,
      cursor: 'pointer',
      fontSize: 14,
      width: '100%'
    },
    buttonDanger: {
      background: '#ff6b6b',
      color: 'white',
      border: 'none',
      padding: '12px 24px',
      borderRadius: 6,
      cursor: 'pointer',
      fontSize: 14,
      width: '100%',
      marginTop: 10
    },
    userInfo: {
      background: 'rgba(0,229,255,0.1)',
      padding: 15,
      borderRadius: 8,
      marginBottom: 20
    },
    deviceList: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: 10
    },
    deviceCard: {
      background: 'rgba(0,119,255,0.1)',
      padding: 12,
      borderRadius: 8,
      border: '1px solid rgba(0,119,255,0.2)'
    }
  };

  if (isAuthenticated) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          🔐 Welcome, {user?.name}!
        </div>
        
        <div style={styles.userInfo}>
          <div><strong>Email:</strong> {user?.email}</div>
          <div><strong>Role:</strong> {user?.role}</div>
          <div><strong>Permissions:</strong> {user?.permissions?.join(', ')}</div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <h3>📱 Your Devices</h3>
        </div>

        <div style={styles.deviceList}>
          {devices.map(device => (
            <div key={device.id} style={styles.deviceCard}>
              <div><strong>{device.name}</strong></div>
              <div>Type: {device.type}</div>
              <div>Status: {device.status}</div>
              <div>Last seen: {device.lastSeen.toLocaleString()}</div>
              <button 
                onClick={() => removeDevice(device.id)}
                style={{ 
                  background: '#ff6b6b', 
                  color: 'white', 
                  border: 'none', 
                  padding: '6px 12px', 
                  borderRadius: 4, 
                  cursor: 'pointer',
                  marginTop: 10,
                  fontSize: 12
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div>
          <button onClick={logout} style={styles.buttonDanger}>
            🔓 Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        🔐 PERIS AI Authentication
      </div>

      {!showTwoFactor ? (
        <form onSubmit={handleLogin} style={styles.form}>
          <h3>Login to Your PERIS AI</h3>
          
          <div>
            <label>Email:</label>
            <input
              type="email"
              value={loginForm.email}
              onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter your email"
              style={styles.input}
              required
            />
          </div>

          <div>
            <label>Password:</label>
            <input
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Enter your password"
              style={styles.input}
              required
            />
          </div>

          <button type="submit" style={styles.button}>
            🔓 Login
          </button>

          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 15 }}>
            Demo accounts:<br/>
            Admin: demo@peris.ai / demo123<br/>
            User: user@peris.ai / user123
          </div>
        </form>
      ) : (
        <form onSubmit={handleTwoFactor} style={styles.form}>
          <h3>Two-Factor Authentication</h3>
          <p>Enter the 6-digit code sent to your email</p>
          
          <div>
            <label>2FA Code:</label>
            <input
              type="text"
              value={loginForm.twoFactorCode}
              onChange={(e) => setLoginForm(prev => ({ ...prev, twoFactorCode: e.target.value }))}
              placeholder="Enter 6-digit code"
              style={styles.input}
              maxLength={6}
              required
            />
          </div>

          <button type="submit" style={styles.button}>
            ✅ Verify
          </button>

          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 15 }}>
            Demo 2FA code: 123456
          </div>
        </form>
      )}
    </div>
  );
}
