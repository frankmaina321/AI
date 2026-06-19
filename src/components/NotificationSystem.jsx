import { useState, useEffect, useCallback } from 'react';

export default function NotificationSystem() {
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState({
    pushEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    desktopAlerts: true,
    mobileAlerts: true,
    emailAlerts: false,
    smsAlerts: true
  });

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('Notification permission granted');
        } else {
          console.log('Notification permission denied');
        }
      });
    }
  }, []);

  // Add new notification
  const addNotification = useCallback((type, title, message, priority = 'normal') => {
    const notification = {
      id: Date.now(),
      type,
      title,
      message,
      priority, // low, normal, high, critical
      timestamp: new Date(),
      read: false,
      actions: []
    };

    setNotifications(prev => [notification, ...prev.slice(-9)]);

    // Show browser notification if enabled
    if (settings.desktopAlerts && 'Notification' in window) {
      showBrowserNotification(notification);
    }

    // Send push notification if enabled
    if (settings.pushEnabled) {
      sendPushNotification(notification);
    }

    // Send SMS if enabled
    if (settings.smsAlerts) {
      sendSMSNotification(notification);
    }

    // Play sound if enabled
    if (settings.soundEnabled) {
      playNotificationSound();
    }

    // Vibrate if enabled
    if (settings.vibrationEnabled && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  }, [settings]);

  // Show browser notification
  const showBrowserNotification = (notification) => {
    const options = {
      body: notification.message,
      icon: '/icon-192.png',
      badge: '/badge.png',
      tag: `peris-${notification.type}`,
      requireInteraction: notification.priority === 'critical',
      silent: !settings.soundEnabled
    };

    // Add action buttons based on notification type
    if (notification.type === 'phone_call') {
      options.actions = [
        {
          action: 'answer',
          title: 'Answer',
          icon: '/phone-icon.png'
        },
        {
          action: 'decline',
          title: 'Decline',
          icon: '/decline-icon.png'
        }
      ];
    } else if (notification.type === 'device_alert') {
      options.actions = [
        {
          action: 'view',
          title: 'View Details',
          icon: '/view-icon.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/dismiss-icon.png'
        }
      ];
    }

    const browserNotification = new Notification(notification.title, options);
    
    browserNotification.onclick = (event) => {
      if (event.action) {
        handleNotificationAction(notification.id, event.action);
      }
      browserNotification.close();
      markAsRead(notification.id);
    };

    browserNotification.onclose = () => {
      markAsRead(notification.id);
    };
  };

  // Send push notification (mock implementation)
  const sendPushNotification = async (notification) => {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        
        if (registration.pushManager) {
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: 'YOUR_VAPID_PUBLIC_KEY'
          });

          await fetch('/api/notifications/push', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${subscription.endpoint}`
            },
            body: JSON.stringify({
              subscription,
              notification: {
                title: notification.title,
                body: notification.message,
                icon: '/icon-192.png',
                badge: '/badge.png',
                tag: `peris-${notification.type}`,
                data: notification
              }
            })
          });
        }
      }
    } catch (error) {
      console.error('Push notification failed:', error);
    }
  };

  // Send SMS notification (mock implementation)
  const sendSMSNotification = async (notification) => {
    try {
      await fetch('/api/notifications/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: getUserPhoneNumber(), // Get from user profile
          message: `${notification.title}: ${notification.message}`
        })
      });
    } catch (error) {
      console.error('SMS notification failed:', error);
    }
  };

  // Play notification sound
  const playNotificationSound = () => {
    const audio = new Audio('/notification-sound.mp3');
    audio.volume = 0.5;
    audio.play().catch(error => console.error('Sound play failed:', error));
  };

  // Handle notification actions
  const handleNotificationAction = async (notificationId, action) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification) return;

    switch (action) {
      case 'answer':
        console.log('Answering phone call from notification');
        // Trigger phone answering function
        break;
      case 'view':
        console.log('Viewing device alert details');
        // Show device details modal
        break;
      case 'dismiss':
        markAsRead(notificationId);
        break;
    }
  };

  // Mark notification as read
  const markAsRead = (notificationId) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ));
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Test notification system
  const testNotification = (type) => {
    const testMessages = {
      phone_call: 'Incoming call from Mom',
      device_alert: 'Living room motion detected',
      security: 'Security system armed',
      ai_response: 'PERIS AI response ready',
      reminder: 'Meeting with team in 30 minutes',
      system: 'System update available'
    };

    addNotification(type, `Test ${type.replace('_', ' ').toUpperCase()}`, testMessages[type], 'high');
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
    settings: {
      background: 'rgba(0,119,255,0.1)',
      padding: 15,
      borderRadius: 8,
      marginBottom: 20,
      border: '1px solid rgba(0,119,255,0.3)'
    },
    notificationList: {
      maxHeight: 400,
      overflowY: 'auto',
      background: 'rgba(0,0,0,0.2)',
      borderRadius: 8,
      padding: 15
    },
    notificationItem: {
      background: 'rgba(0,229,255,0.1)',
      padding: 12,
      borderRadius: 8,
      marginBottom: 10,
      border: `1px solid ${
        notification.priority === 'critical' ? 'rgba(255,0,0,0.5)' :
        notification.priority === 'high' ? 'rgba(255,165,0,0.3)' :
        'rgba(0,229,255,0.2)'
      }`,
      position: 'relative',
      cursor: notification.read ? 'default' : 'pointer'
    },
    unread: {
      fontWeight: 'bold'
    },
    priority: {
      position: 'absolute',
      top: 5,
      right: 5,
      fontSize: 10,
      fontWeight: 'bold',
      padding: '2px 6px',
      borderRadius: 4,
      color: 'white'
    },
    critical: { background: '#ff4757' },
    high: { background: '#ff6b6b' },
    normal: { background: '#0077ff' },
    low: { background: '#6c757d' },
    button: {
      background: '#0077ff',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: 6,
      cursor: 'pointer',
      fontSize: 14,
      marginRight: 10
    },
    buttonDanger: {
      background: '#ff6b6b',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: 6,
      cursor: 'pointer',
      fontSize: 14
    },
    testSection: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: 10,
      marginTop: 20
    },
    testButton: {
      background: 'rgba(0,119,255,0.1)',
      border: '1px solid rgba(0,119,255,0.3)',
      padding: 10,
      borderRadius: 6,
      cursor: 'pointer',
      fontSize: 12
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        🔔 Notification Center {unreadCount > 0 && `(${unreadCount})`}
      </div>

      <div style={styles.settings}>
        <h4>🔧 Notification Settings</h4>
        
        <div>
          <label>
            <input
              type="checkbox"
              checked={settings.pushEnabled}
              onChange={(e) => setSettings(prev => ({ ...prev, pushEnabled: e.target.checked }))}
            />
            Push Notifications
          </label>
        </div>
        
        <div>
          <label>
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(e) => setSettings(prev => ({ ...prev, soundEnabled: e.target.checked }))}
            />
            Sound Alerts
          </label>
        </div>
        
        <div>
          <label>
            <input
              type="checkbox"
              checked={settings.vibrationEnabled}
              onChange={(e) => setSettings(prev => ({ ...prev, vibrationEnabled: e.target.checked }))}
            />
            Vibration
          </label>
        </div>
        
        <div>
          <label>
            <input
              type="checkbox"
              checked={settings.desktopAlerts}
              onChange={(e) => setSettings(prev => ({ ...prev, desktopAlerts: e.target.checked }))}
            />
            Desktop Alerts
          </label>
        </div>
        
        <div>
          <label>
            <input
              type="checkbox"
              checked={settings.smsAlerts}
              onChange={(e) => setSettings(prev => ({ ...prev, smsAlerts: e.target.checked }))}
            />
            SMS Alerts
          </label>
        </div>

        <div style={{ marginTop: 15 }}>
          <button onClick={clearAllNotifications} style={styles.buttonDanger}>
            Clear All Notifications
          </button>
        </div>
      </div>

      <div style={styles.notificationList}>
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', opacity: 0.7, padding: 40 }}>
            No notifications
          </div>
        ) : (
          notifications.map(notification => (
            <div 
              key={notification.id} 
              style={{ 
                ...styles.notificationItem,
                opacity: notification.read ? 0.6 : 1
              }}
              onClick={() => !notification.read && markAsRead(notification.id)}
            >
              <div style={styles.priority}>
                <span style={styles[notification.priority]}>
                  {notification.priority.toUpperCase()}
                </span>
              </div>
              
              <div style={{ fontWeight: 'bold', marginBottom: 5 }}>
                {notification.title}
              </div>
              
              <div style={{ fontSize: 14, opacity: 0.8 }}>
                {notification.message}
              </div>
              
              <div style={{ fontSize: 12, opacity: 0.6, marginTop: 5 }}>
                {notification.timestamp.toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>

      <div style={styles.testSection}>
        <h4>🧪 Test Notifications</h4>
        
        <button 
          onClick={() => testNotification('phone_call')} 
          style={styles.testButton}
        >
          📞 Test Call Alert
        </button>
        
        <button 
          onClick={() => testNotification('device_alert')} 
          style={styles.testButton}
        >
          🏠 Test Device Alert
        </button>
        
        <button 
          onClick={() => testNotification('security')} 
          style={styles.testButton}
        >
          🔒 Test Security Alert
        </button>
        
        <button 
          onClick={() => testNotification('ai_response')} 
          style={styles.testButton}
        >
          🤖 Test AI Response
        </button>
        
        <button 
          onClick={() => testNotification('reminder')} 
          style={styles.testButton}
        >
          ⏰ Test Reminder
        </button>
        
        <button 
          onClick={() => testNotification('system')} 
          style={styles.testButton}
        >
          ⚙️ Test System Alert
        </button>
      </div>
    </div>
  );
}
