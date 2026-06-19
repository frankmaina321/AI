import { useState, useEffect } from 'react';

export default function DeviceControl() {
  const [devices, setDevices] = useState([]);
  const [voiceCommand, setVoiceCommand] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState({
    lights: [],
    thermostat: null,
    security: null,
    phone: null,
    speakers: [],
    tv: null
  });

  // Voice command patterns
  const commandPatterns = {
    lights: {
      on: [/turn on (the )?lights?/i, /lights on/i],
      off: [/turn off (the )?lights?/i, /lights off/i],
      dim: [/dim (the )?lights?/i, /lights dim/i],
      color: [/set (the )?lights? to (\w+)/i, /lights (\w+)/i]
    },
    temperature: {
      set: [/set (the )?temperature to (\d+)/i, /temperature (\d+)/i],
      up: [/increase (the )?temperature/i, /temperature up/i],
      down: [/decrease (the )?temperature/i, /temperature down/i]
    },
    phone: {
      call: [/call (\w+)/i, /phone call (\w+)/i, /dial (\w+)/i],
      answer: [/answer (the )?phone/i, /pick up/i],
      hangup: [/hang up/i, /end call/i]
    },
    security: {
      arm: [/arm (the )?security/i, /lock (the )?doors?/i],
      disarm: [/disarm (the )?security/i, /unlock (the )?doors?/i],
      camera: [/show (the )?cameras?/i, /security cameras/i]
    }
  };

  // Parse voice commands
  const parseCommand = (command) => {
    const lowerCommand = command.toLowerCase();
    
    for (const [category, patterns] of Object.entries(commandPatterns)) {
      for (const [action, regexList] of Object.entries(patterns)) {
        for (const regex of regexList) {
          const match = lowerCommand.match(regex);
          if (match) {
            return { category, action, value: match[1] };
          }
        }
      }
    }
    return null;
  };

  // Execute device commands
  const executeCommand = async (command) => {
    const parsed = parseCommand(command);
    if (!parsed) {
      console.log('Command not recognized:', command);
      return;
    }

    const { category, action, value } = parsed;
    
    try {
      switch (category) {
        case 'lights':
          await handleLightsCommand(action, value);
          break;
        case 'temperature':
          await handleTemperatureCommand(action, value);
          break;
        case 'phone':
          await handlePhoneCommand(action, value);
          break;
        case 'security':
          await handleSecurityCommand(action);
          break;
      }
    } catch (error) {
      console.error('Command execution error:', error);
    }
  };

  // Light control functions
  const handleLightsCommand = async (action, value) => {
    switch (action) {
      case 'on':
        setConnectedDevices(prev => ({
          ...prev,
          lights: prev.lights.map(light => ({ ...light, status: 'on' }))
        }));
        console.log('Lights turned ON');
        break;
      case 'off':
        setConnectedDevices(prev => ({
          ...prev,
          lights: prev.lights.map(light => ({ ...light, status: 'off' }))
        }));
        console.log('Lights turned OFF');
        break;
      case 'color':
        setConnectedDevices(prev => ({
          ...prev,
          lights: prev.lights.map(light => ({ ...light, color: value }))
        }));
        console.log(`Lights color set to ${value}`);
        break;
    }
  };

  // Temperature control functions
  const handleTemperatureCommand = async (action, value) => {
    switch (action) {
      case 'set':
        setConnectedDevices(prev => ({
          ...prev,
          thermostat: { ...prev.thermostat, temperature: parseInt(value) }
        }));
        console.log(`Temperature set to ${value}°F`);
        break;
      case 'up':
        setConnectedDevices(prev => ({
          ...prev,
          thermostat: { ...prev.thermostat, temperature: (prev.thermostat?.temperature || 70) + 2 }
        }));
        console.log('Temperature increased by 2°F');
        break;
      case 'down':
        setConnectedDevices(prev => ({
          ...prev,
          thermostat: { ...prev.thermostat, temperature: (prev.thermostat?.temperature || 70) - 2 }
        }));
        console.log('Temperature decreased by 2°F');
        break;
    }
  };

  // Phone control functions
  const handlePhoneCommand = async (action, value) => {
    switch (action) {
      case 'call':
        console.log(`Calling ${value}...`);
        setConnectedDevices(prev => ({
          ...prev,
          phone: { status: 'calling', contact: value }
        }));
        // Integrate with actual phone API here
        break;
      case 'answer':
        console.log('Answering phone...');
        setConnectedDevices(prev => ({
          ...prev,
          phone: { ...prev.phone, status: 'answered' }
        }));
        break;
      case 'hangup':
        console.log('Ending call...');
        setConnectedDevices(prev => ({
          ...prev,
          phone: { status: 'idle', contact: null }
        }));
        break;
    }
  };

  // Security control functions
  const handleSecurityCommand = async (action) => {
    switch (action) {
      case 'arm':
        console.log('Arming security system...');
        setConnectedDevices(prev => ({
          ...prev,
          security: { status: 'armed' }
        }));
        break;
      case 'disarm':
        console.log('Disarming security system...');
        setConnectedDevices(prev => ({
          ...prev,
          security: { status: 'disarmed' }
        }));
        break;
      case 'camera':
        console.log('Showing security cameras...');
        // Open camera view modal
        break;
    }
  };

  // Voice recognition setup
  const startVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      console.log('Voice control activated...');
    };

    recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const command = event.results[last][0].transcript;
      setVoiceCommand(command);
      executeCommand(command);
    };

    recognition.onerror = (event) => {
      console.error('Voice recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
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
    voiceSection: {
      background: 'rgba(0,119,255,0.1)',
      padding: 15,
      borderRadius: 8,
      marginBottom: 20,
      border: '1px solid rgba(0,119,255,0.3)'
    },
    button: {
      background: isListening ? '#ff6b6b' : '#0077ff',
      color: 'white',
      border: 'none',
      padding: '12px 24px',
      borderRadius: 6,
      cursor: 'pointer',
      fontSize: 16,
      width: '100%',
      marginBottom: 10
    },
    commandDisplay: {
      background: 'rgba(0,0,0,0.3)',
      padding: 10,
      borderRadius: 6,
      marginBottom: 20,
      minHeight: 40,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontStyle: 'italic'
    },
    devicesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: 15
    },
    deviceCard: {
      background: 'rgba(0,229,255,0.1)',
      padding: 15,
      borderRadius: 8,
      border: '1px solid rgba(0,229,255,0.2)'
    },
    deviceTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 10,
      color: '#00e5ff'
    },
    deviceStatus: {
      fontSize: 14,
      color: '#9cdfff'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        🏠 Smart Device Control
      </div>
      
      <div style={styles.voiceSection}>
        <button 
          style={styles.button}
          onClick={startVoiceRecognition}
        >
          {isListening ? '🎤 Listening...' : '🎤 Start Voice Control'}
        </button>
        
        {voiceCommand && (
          <div style={styles.commandDisplay}>
            Last command: "{voiceCommand}"
          </div>
        )}
      </div>

      <div style={styles.devicesGrid}>
        <div style={styles.deviceCard}>
          <div style={styles.deviceTitle}>💡 Lights</div>
          <div style={styles.deviceStatus}>
            {connectedDevices.lights.map((light, i) => (
              <div key={i}>Light {i + 1}: {light.status || 'off'} {light.color && `(${light.color})`}</div>
            ))}
          </div>
        </div>

        <div style={styles.deviceCard}>
          <div style={styles.deviceTitle}>🌡️ Thermostat</div>
          <div style={styles.deviceStatus}>
            {connectedDevices.thermostat ? 
              `${connectedDevices.thermostat.temperature || 70}°F` : 
              'Not connected'
            }
          </div>
        </div>

        <div style={styles.deviceCard}>
          <div style={styles.deviceTitle}>📱 Phone</div>
          <div style={styles.deviceStatus}>
            {connectedDevices.phone ? 
              `${connectedDevices.phone.status} ${connectedDevices.phone.contact ? `with ${connectedDevices.phone.contact}` : ''}` : 
              'Idle'
            }
          </div>
        </div>

        <div style={styles.deviceCard}>
          <div style={styles.deviceTitle}>🔒 Security</div>
          <div style={styles.deviceStatus}>
            {connectedDevices.security ? 
              `System ${connectedDevices.security.status}` : 
              'Not connected'
            }
          </div>
        </div>
      </div>
    </div>
  );
}
