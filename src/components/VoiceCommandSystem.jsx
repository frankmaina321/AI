import { useState, useEffect, useCallback } from 'react';

export default function VoiceCommandSystem() {
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [activeMode, setActiveMode] = useState('general'); // general, phone, devices, security

  // Comprehensive voice command patterns
  const commandPatterns = {
    // General AI Commands
    ai: {
      chat: [/hey peris/i, /hi peris/i, /hello peris/i],
      help: [/help/i, /what can you do/i],
      stop: [/stop listening/i, /deactivate/i],
      weather: [/what'?s the weather/i, /weather forecast/i],
      time: [/what time is it/i, /current time/i],
      reminder: [/remind me to (\w+)/i, /set reminder for (\w+)/i]
    },
    
    // Phone Commands
    phone: {
      call: [/call (\w+)/i, /phone (\w+)/i, /dial (\w+)/i],
      answer: [/answer (the )?phone/i, /pick up/i],
      hangup: [/hang up/i, /end call/i, /disconnect/i],
      redial: [/redial/i, /call back/i],
      speaker: [/speaker (on|off)/i, /put on (the )?speaker/i, /put off (the )?speaker/i],
      mute: [/mute/i, /unmute/i],
      volume: [/volume (up|down|\d+)/i, /set volume to (\d+)/i],
      emergency: [/call (911|emergency|police|ambulance)/i]
    },
    
    // Smart Home Commands
    devices: {
      lights: {
        on: [/turn on (the )?lights?/i, /lights on/i],
        off: [/turn off (the )?lights?/i, /lights off/i],
        dim: [/dim (the )?lights?/i, /lights dim/i],
        bright: [/brighten (the )?lights?/i, /lights bright/i],
        color: [/set (the )?lights? to (\w+)/i, /lights (\w+)/i],
        room: [/(\w+) lights (on|off)/i]
      },
      temperature: {
        set: [/set (the )?temperature to (\d+)/i, /temperature (\d+)/i],
        up: [/increase (the )?temperature/i, /temperature up/i, /warmer/i],
        down: [/decrease (the )?temperature/i, /temperature down/i, /colder/i],
        mode: [/(\w+) mode/i, /set to (\w+) mode/i]
      },
      security: {
        arm: [/arm (the )?security/i, /lock (the )?doors?/i, /secure (the )?house/i],
        disarm: [/disarm (the )?security/i, /unlock (the )?doors?/i],
        camera: [/show (the )?cameras?/i, /security cameras/i, /check (the )?cameras?/i],
        alarm: [/sound (the )?alarm/i, /trigger alarm/i]
      },
      media: {
        play: [/play (\w+)/i, /start playing (\w+)/i],
        pause: [/pause (the )?music/i, /stop (the )?music/i],
        next: [/next song/i, /skip song/i],
        volume: [/music volume (up|down|\d+)/i]
      },
      appliances: {
        tv: [/turn on (the )?tv/i, /tv on/i, /turn off (the )?tv/i, /tv off/i, /change (the )?channel to (\d+)/i],
        coffee: [/start (the )?coffee maker/i, /make coffee/i],
        oven: [/preheat (the )?oven to (\d+)/i, /oven (\d+)/i],
        washing: [/start (the )?washing machine/i, /wash clothes/i]
      }
    },
    
    // Navigation & Location Commands
    navigation: {
      directions: [/navigate to (\w+)/i, /directions to (\w+)/i, /how to get to (\w+)/i],
      nearby: [/find (nearby )?(\w+)/i, /where is the nearest (\w+)/i],
      home: [/take me home/i, /navigate home/i],
      work: [/take me to work/i, /navigate to work/i]
    },
    
    // System Commands
    system: {
      mode: [/switch to (\w+) mode/i, /(\w+) mode/i],
      status: [/system status/i, /check status/i, /how are you/i],
      restart: [/restart system/i, /reboot/i],
      update: [/check for updates/i, /update software/i]
    }
  };

  // Parse voice commands
  const parseCommand = useCallback((command) => {
    const lowerCommand = command.toLowerCase();
    
    for (const [category, commands] of Object.entries(commandPatterns)) {
      if (typeof commands === 'object') {
        for (const [subcategory, patterns] of Object.entries(commands)) {
          for (const [action, regexList] of Object.entries(patterns)) {
            for (const regex of regexList) {
              const match = lowerCommand.match(regex);
              if (match) {
                return { 
                  category, 
                  subcategory, 
                  action, 
                  value: match[1] || match[2],
                  fullCommand: command 
                };
              }
            }
          }
        }
      } else {
        for (const [action, regexList] of Object.entries(commands)) {
          for (const regex of regexList) {
            const match = lowerCommand.match(regex);
            if (match) {
              return { 
                category, 
                action, 
                value: match[1] || match[2],
                fullCommand: command 
              };
            }
          }
        }
      }
    }
    return null;
  }, []);

  // Execute parsed commands
  const executeCommand = useCallback(async (parsedCommand) => {
    if (!parsedCommand) return;

    const { category, subcategory, action, value } = parsedCommand;
    
    // Add to command history
    setCommandHistory(prev => [{
      command: parsedCommand.fullCommand,
      category,
      action,
      timestamp: new Date(),
      status: 'executing'
    }, ...prev.slice(-9)]);

    try {
      switch (category) {
        case 'ai':
          await handleAICommand(action, value);
          break;
        case 'phone':
          await handlePhoneCommand(action, value);
          break;
        case 'devices':
          await handleDeviceCommand(subcategory, action, value);
          break;
        case 'navigation':
          await handleNavigationCommand(action, value);
          break;
        case 'system':
          await handleSystemCommand(action, value);
          break;
      }
      
      // Update command status to completed
      setCommandHistory(prev => prev.map(cmd => 
        cmd.command === parsedCommand.fullCommand ? 
          { ...cmd, status: 'completed', executedAt: new Date() } : 
          cmd
      ));
      
    } catch (error) {
      console.error('Command execution error:', error);
      setCommandHistory(prev => prev.map(cmd => 
        cmd.command === parsedCommand.fullCommand ? 
          { ...cmd, status: 'error', error: error.message } : 
          cmd
      ));
    }
  }, []);

  // Command handlers
  const handleAICommand = async (action, value) => {
    switch (action) {
      case 'chat':
        setActiveMode('general');
        console.log('Switched to AI chat mode');
        break;
      case 'help':
        console.log('Available commands: phone, lights, temperature, security, navigation, and more...');
        break;
      case 'weather':
        console.log('Getting weather information...');
        // Integrate with weather API
        break;
      case 'time':
        console.log(`Current time: ${new Date().toLocaleString()}`);
        break;
      case 'reminder':
        console.log(`Reminder set for: ${value}`);
        break;
    }
  };

  const handlePhoneCommand = async (action, value) => {
    setActiveMode('phone');
    switch (action) {
      case 'call':
        console.log(`📞 Calling ${value}...`);
        // Integrate with actual phone system
        break;
      case 'answer':
        console.log('📞 Answering call...');
        break;
      case 'hangup':
        console.log('📞 Ending call...');
        break;
      case 'emergency':
        console.log('🚨 EMERGENCY CALL INITIATED');
        break;
    }
  };

  const handleDeviceCommand = async (subcategory, action, value) => {
    setActiveMode('devices');
    switch (subcategory) {
      case 'lights':
        console.log(`💡 Lights command: ${action} ${value || ''}`);
        break;
      case 'temperature':
        console.log(`🌡️ Temperature command: ${action} ${value || ''}`);
        break;
      case 'security':
        console.log(`🔒 Security command: ${action}`);
        break;
      case 'media':
        console.log(`🎵 Media command: ${action} ${value || ''}`);
        break;
      case 'appliances':
        console.log(`🏠 Appliance command: ${subcategory} ${action} ${value || ''}`);
        break;
    }
  };

  const handleNavigationCommand = async (action, value) => {
    setActiveMode('navigation');
    console.log(`🗺️ Navigation: ${action} to ${value}`);
    // Integrate with maps API
  };

  const handleSystemCommand = async (action, value) => {
    switch (action) {
      case 'mode':
        setActiveMode(value);
        console.log(`🔄 Switched to ${value} mode`);
        break;
      case 'status':
        console.log('📊 System Status: All systems operational');
        break;
      case 'restart':
        console.log('🔄 Restarting system...');
        break;
    }
  };

  // Voice recognition setup
  const startVoiceRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      console.log('🎤 Voice command system activated...');
    };

    recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const command = event.results[last][0].transcript;
      setLastCommand(command);
      
      const parsed = parseCommand(command);
      if (parsed) {
        executeCommand(parsed);
      }
    };

    recognition.onerror = (event) => {
      console.error('Voice recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [parseCommand, executeCommand]);

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
    modeIndicator: {
      background: 'rgba(0,119,255,0.1)',
      padding: 10,
      borderRadius: 8,
      marginBottom: 20,
      textAlign: 'center',
      border: '1px solid rgba(0,119,255,0.3)'
    },
    voiceSection: {
      background: 'rgba(0,229,255,0.1)',
      padding: 20,
      borderRadius: 8,
      marginBottom: 20,
      border: '1px solid rgba(0,229,255,0.2)'
    },
    button: {
      background: isListening ? '#ff6b6b' : '#0077ff',
      color: 'white',
      border: 'none',
      padding: '15px 30px',
      borderRadius: 8,
      cursor: 'pointer',
      fontSize: 18,
      width: '100%',
      marginBottom: 15,
      transition: 'all 0.3s ease'
    },
    commandDisplay: {
      background: 'rgba(0,0,0,0.3)',
      padding: 15,
      borderRadius: 8,
      marginBottom: 20,
      minHeight: 60,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontStyle: 'italic',
      fontSize: 16
    },
    historySection: {
      background: 'rgba(0,0,0,0.2)',
      borderRadius: 8,
      padding: 15,
      maxHeight: 400,
      overflowY: 'auto'
    },
    historyItem: {
      padding: 10,
      borderBottom: '1px solid rgba(0,229,255,0.2)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    success: { color: '#00ff88' },
    error: { color: '#ff6b6b' },
    executing: { color: '#ffaa00' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        🎤 Voice Command System
      </div>
      
      <div style={styles.modeIndicator}>
        Active Mode: <strong>{activeMode.toUpperCase()}</strong>
      </div>

      <div style={styles.voiceSection}>
        <button 
          style={styles.button}
          onClick={startVoiceRecognition}
        >
          {isListening ? '🎤 LISTENING...' : '🎤 START VOICE CONTROL'}
        </button>
        
        {lastCommand && (
          <div style={styles.commandDisplay}>
            Last command: "{lastCommand}"
          </div>
        )}
      </div>

      <div style={styles.historySection}>
        <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>
          📋 Command History
        </div>
        {commandHistory.slice(-10).reverse().map((cmd, index) => (
          <div key={cmd.timestamp.getTime()} style={styles.historyItem}>
            <div>
              <div style={{ fontSize: 14, opacity: 0.7 }}>
                {cmd.timestamp.toLocaleTimeString()}
              </div>
              <div style={{ fontWeight: 'bold' }}>
                {cmd.command}
              </div>
              <div style={{ fontSize: 12 }}>
                {cmd.category} → {cmd.subcategory || cmd.action}
              </div>
            </div>
            <div style={{ 
              ...styles[cmd.status], 
              fontSize: 12,
              fontWeight: 'bold'
            }}>
              {cmd.status.toUpperCase()}
              {cmd.error && `: ${cmd.error}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
