import { useState, useEffect } from 'react';

export default function CrossPlatformApp() {
  const [platform, setPlatform] = useState('unknown');
  const [appMode, setAppMode] = useState('web'); // web, mobile, desktop
  const [capabilities, setCapabilities] = useState({});

  // Detect platform and capabilities
  useEffect(() => {
    const detectPlatform = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const platform = navigator.platform.toLowerCase();
      
      if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
        return 'mobile';
      } else if (/tablet|ipad/i.test(userAgent)) {
        return 'tablet';
      } else if (/win|mac|linux|x11/i.test(platform)) {
        return 'desktop';
      } else {
        return 'web';
      }
    };

    const detectCapabilities = () => {
      const caps = {
        voiceInput: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
        voiceOutput: 'speechSynthesis' in window,
        camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
        geolocation: 'geolocation' in navigator,
        notifications: 'Notification' in window,
        bluetooth: 'bluetooth' in navigator,
        nfc: 'nfc' in navigator,
        vibration: 'vibrate' in navigator,
        fullscreen: 'fullscreenEnabled' in document,
        battery: 'getBattery' in navigator,
        network: 'connection' in navigator,
        storage: 'localStorage' in window,
        share: 'share' in navigator,
        install: 'BeforeInstallPromptEvent' in window
      };

      // Platform-specific capabilities
      if (detectPlatform() === 'mobile') {
        caps.touch = 'ontouchstart' in window;
        caps.orientation = 'orientation' in window;
        caps.accelerometer = 'DeviceMotionEvent' in window;
        caps.gyroscope = 'DeviceOrientationEvent' in window;
        caps.cameraRear = true; // Most mobiles have rear camera
        caps.cameraFront = 'mediaDevices' in navigator && navigator.mediaDevices.getSupportedConstraints?.facingMode?.includes('user');
      } else if (detectPlatform() === 'desktop') {
        caps.webgl = 'WebGLRenderingContext' in window;
        caps.webworkers = 'Worker' in window;
        caps.webrtc = 'RTCPeerConnection' in window;
        caps.fileSystem = 'showDirectoryPicker' in window;
      }

      return caps;
    };

    const detectedPlatform = detectPlatform();
    const detectedCapabilities = detectCapabilities();
    
    setPlatform(detectedPlatform);
    setAppMode(detectedPlatform === 'mobile' ? 'mobile' : 'web');
    setCapabilities(detectedCapabilities);
  }, []);

  // Platform-specific optimizations
  const getPlatformOptimizations = () => {
    switch (platform) {
      case 'mobile':
        return {
          viewport: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no',
          touchAction: 'manipulation',
          themeColor: '#000000',
          statusBar: 'black-translucent',
          safeArea: true,
          gestures: true,
          vibration: true,
          orientation: 'portrait'
        };
      case 'tablet':
        return {
          viewport: 'width=device-width, initial-scale=1.0',
          touchAction: 'manipulation',
          themeColor: '#000000',
          statusBar: 'default',
          safeArea: true,
          gestures: true,
          vibration: false,
          orientation: 'landscape'
        };
      case 'desktop':
        return {
          viewport: 'width=device-width, initial-scale=1.0',
          themeColor: '#06111b',
          statusBar: 'default',
          safeArea: false,
          gestures: false,
          vibration: false,
          orientation: 'landscape'
        };
      default:
        return {
          viewport: 'width=device-width, initial-scale=1.0',
          themeColor: '#06111b',
          statusBar: 'default',
          safeArea: false,
          gestures: false,
          vibration: false,
          orientation: 'any'
        };
    }
  };

  const optimizations = getPlatformOptimizations();

  // Apply platform-specific meta tags and styles
  useEffect(() => {
    // Update viewport meta tag
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      viewportMeta.content = optimizations.viewport;
    }

    // Update theme color
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.content = optimizations.themeColor;
    }

    // Add platform-specific CSS classes
    document.body.className = `${platform}-platform ${appMode}-app`;
  }, [platform, appMode, optimizations]);

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
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 20,
      color: '#00e5ff',
      textAlign: 'center'
    },
    platformInfo: {
      background: 'rgba(0,119,255,0.1)',
      padding: 15,
      borderRadius: 8,
      marginBottom: 20,
      border: '1px solid rgba(0,119,255,0.3)'
    },
    capabilitiesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: 15
    },
    capabilityCard: {
      background: 'rgba(0,229,255,0.1)',
      padding: 12,
      borderRadius: 8,
      border: '1px solid rgba(0,229,255,0.2)',
      textAlign: 'center'
    },
    available: { color: '#00ff88' },
    notAvailable: { color: '#ff6b6b' },
    optimizationSection: {
      background: 'rgba(0,119,255,0.1)',
      padding: 15,
      borderRadius: 8,
      marginBottom: 20,
      border: '1px solid rgba(0,119,255,0.3)'
    },
    optimizationItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
      padding: 8,
      background: 'rgba(0,0,0,0.2)',
      borderRadius: 4
    }
  };

  const renderCapability = (name, available) => (
    <div style={styles.capabilityCard}>
      <div style={{ fontSize: 16, marginBottom: 5 }}>
        {name}
      </div>
      <div style={{ 
        fontSize: 14, 
        fontWeight: 'bold',
        ...styles[available ? 'available' : 'notAvailable']
      }}>
        {available ? '✅ Available' : '❌ Not Available'}
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        🌐 Cross-Platform PERIS AI
      </div>

      <div style={styles.platformInfo}>
        <div><strong>Platform:</strong> {platform}</div>
        <div><strong>App Mode:</strong> {appMode}</div>
        <div><strong>Viewport:</strong> {optimizations.viewport}</div>
        <div><strong>Theme:</strong> {optimizations.themeColor}</div>
      </div>

      <div style={styles.capabilitiesGrid}>
        {renderCapability('Voice Input', capabilities.voiceInput)}
        {renderCapability('Voice Output', capabilities.voiceOutput)}
        {renderCapability('Camera Access', capabilities.camera)}
        {renderCapability('Geolocation', capabilities.geolocation)}
        {renderCapability('Notifications', capabilities.notifications)}
        {renderCapability('Bluetooth', capabilities.bluetooth)}
        {renderCapability('NFC', capabilities.nfc)}
        {renderCapability('Vibration', capabilities.vibration)}
        {renderCapability('Fullscreen', capabilities.fullscreen)}
        {renderCapability('Battery API', capabilities.battery)}
        {renderCapability('Network Info', capabilities.network)}
        {renderCapability('Local Storage', capabilities.storage)}
        {renderCapability('Share API', capabilities.share)}
        {renderCapability('App Install', capabilities.install)}
      </div>

      <div style={styles.optimizationSection}>
        <h4>🔧 Platform Optimizations</h4>
        
        <div style={styles.optimizationItem}>
          <span>Viewport Meta</span>
          <span style={{ fontSize: 12, opacity: 0.7 }}>
            {optimizations.viewport}
          </span>
        </div>

        <div style={styles.optimizationItem}>
          <span>Touch Actions</span>
          <span style={{ fontSize: 12, opacity: 0.7 }}>
            {optimizations.touchAction || 'Not set'}
          </span>
        </div>

        <div style={styles.optimizationItem}>
          <span>Safe Area</span>
          <span style={{ fontSize: 12, opacity: 0.7 }}>
            {optimizations.safeArea ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        <div style={styles.optimizationItem}>
          <span>Gestures</span>
          <span style={{ fontSize: 12, opacity: 0.7 }}>
            {optimizations.gestures ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        <div style={styles.optimizationItem}>
          <span>Vibration</span>
          <span style={{ fontSize: 12, opacity: 0.7 }}>
            {optimizations.vibration ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        <div style={styles.optimizationItem}>
          <span>Orientation Lock</span>
          <span style={{ fontSize: 12, opacity: 0.7 }}>
            {optimizations.orientation || 'Any'}
          </span>
        </div>
      </div>
    </div>
  );
}
