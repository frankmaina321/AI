import { useState, useEffect } from 'react';

export default function PhoneIntegration() {
  const [contacts, setContacts] = useState([]);
  const [callHistory, setCallHistory] = useState([]);
  const [isInCall, setIsInCall] = useState(false);
  const [currentCall, setCurrentCall] = useState(null);
  const [voiceCommand, setVoiceCommand] = useState('');

  // Mock contacts data
  useEffect(() => {
    setContacts([
      { id: 1, name: 'Mom', number: '+1234567890', type: 'family' },
      { id: 2, name: 'Dad', number: '+1234567891', type: 'family' },
      { id: 3, name: 'Work', number: '+1234567892', type: 'work' },
      { id: 4, name: 'Emergency', number: '911', type: 'emergency' }
    ]);
  }, []);

  // Voice command patterns for phone
  const phoneCommands = {
    call: [/call (\w+)/i, /phone (\w+)/i, /dial (\w+)/i],
    answer: [/answer/i, /pick up/i],
    hangup: [/hang up/i, /end call/i, /disconnect/i],
    speaker: [/speaker (on|off)/i, /put on (the )?speaker/i, /put off (the )?speaker/i],
    mute: [/mute/i, /unmute/i],
    volume: [/volume (up|down|\d+)/i]
  };

  // Parse voice commands
  const parsePhoneCommand = (command) => {
    const lowerCommand = command.toLowerCase();
    
    for (const [action, patterns] of Object.entries(phoneCommands)) {
      for (const pattern of patterns) {
        const match = lowerCommand.match(pattern);
        if (match) {
          return { action, value: match[1] };
        }
      }
    }
    return null;
  };

  // Execute phone commands
  const executePhoneCommand = async (command) => {
    const parsed = parsePhoneCommand(command);
    if (!parsed) return;

    const { action, value } = parsed;
    
    switch (action) {
      case 'call':
        await makeCall(value);
        break;
      case 'answer':
        await answerCall();
        break;
      case 'hangup':
        await endCall();
        break;
      case 'speaker':
        await toggleSpeaker(value);
        break;
      case 'mute':
        await toggleMute();
        break;
      case 'volume':
        await adjustVolume(value);
        break;
    }
  };

  // Phone functions
  const makeCall = async (contactName) => {
    const contact = contacts.find(c => 
      c.name.toLowerCase() === contactName.toLowerCase() || 
      c.name.toLowerCase().includes(contactName.toLowerCase())
    );
    
    if (!contact) {
      console.log(`Contact ${contactName} not found`);
      return;
    }

    console.log(`📞 Calling ${contact.name} at ${contact.number}...`);
    setCurrentCall({
      contact,
      startTime: new Date(),
      status: 'connecting'
    });
    setIsInCall(true);

    // Simulate call connection
    setTimeout(() => {
      setCurrentCall(prev => ({ ...prev, status: 'connected' }));
      
      // Add to call history
      setCallHistory(prev => [{
        id: Date.now(),
        contact: contact.name,
        number: contact.number,
        timestamp: new Date(),
        duration: 0,
        type: 'outgoing'
      }, ...prev]);
    }, 2000);
  };

  const answerCall = async () => {
    if (!isInCall) {
      console.log('No incoming call to answer');
      return;
    }

    console.log('📞 Answering call...');
    setCurrentCall(prev => ({ ...prev, status: 'answered' }));
  };

  const endCall = async () => {
    if (!isInCall) return;

    console.log('📞 Ending call...');
    
    // Update call history
    if (currentCall) {
      const duration = Math.floor((new Date() - currentCall.startTime) / 1000);
      setCallHistory(prev => prev.map(call => 
        call.id === currentCall.contact.id ? 
          { ...call, duration, endTime: new Date() } : 
          call
      ));
    }

    setCurrentCall(null);
    setIsInCall(false);
  };

  const toggleSpeaker = async (state) => {
    const isOn = state === 'on' || state === 'the';
    console.log(`🔊 Speaker ${isOn ? 'ON' : 'OFF'}`);
    // Integrate with actual phone system
  };

  const toggleMute = async () => {
    console.log('🔇 Toggling mute...');
    // Integrate with actual phone system
  };

  const adjustVolume = async (adjustment) => {
    console.log(`🔊 Volume ${adjustment}`);
    // Integrate with actual phone system
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
    currentCall: {
      background: 'rgba(0,255,0,0.1)',
      border: '1px solid rgba(0,255,0,0.3)',
      padding: 15,
      borderRadius: 8,
      marginBottom: 20,
      textAlign: 'center'
    },
    contactsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: 10,
      marginBottom: 20
    },
    contactCard: {
      background: 'rgba(0,119,255,0.1)',
      padding: 12,
      borderRadius: 8,
      border: '1px solid rgba(0,119,255,0.2)',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    contactCardHover: {
      background: 'rgba(0,119,255,0.2)',
      transform: 'translateY(-2px)'
    },
    callHistory: {
      maxHeight: 300,
      overflowY: 'auto',
      background: 'rgba(0,0,0,0.2)',
      padding: 15,
      borderRadius: 8
    },
    historyItem: {
      padding: 8,
      borderBottom: '1px solid rgba(0,229,255,0.2)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    voiceCommand: {
      background: 'rgba(0,229,255,0.1)',
      padding: 10,
      borderRadius: 6,
      marginBottom: 20,
      fontStyle: 'italic',
      textAlign: 'center'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        📱 Phone Integration & Voice Control
      </div>

      {isInCall && currentCall && (
        <div style={styles.currentCall}>
          <div style={{ fontSize: 18, marginBottom: 10 }}>
            📞 {currentCall.status === 'connecting' ? 'Connecting...' : 'In Call'}
          </div>
          <div style={{ fontSize: 16 }}>
            {currentCall.contact.name} - {currentCall.contact.number}
          </div>
          <div style={{ fontSize: 14, opacity: 0.7 }}>
            {currentCall.startTime.toLocaleString()}
          </div>
          <button 
            onClick={endCall}
            style={{
              background: '#ff6b6b',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 4,
              cursor: 'pointer',
              marginTop: 10
            }}
          >
            End Call
          </button>
        </div>
      )}

      <div style={styles.contactsGrid}>
        {contacts.map(contact => (
          <div 
            key={contact.id}
            style={styles.contactCard}
            onClick={() => makeCall(contact.name)}
          >
            <div style={{ fontSize: 20, marginBottom: 5 }}>
              {contact.type === 'emergency' ? '🚨' : 
               contact.type === 'family' ? '👨‍👩‍👧‍👦' : '💼'}
            </div>
            <div style={{ fontWeight: 'bold' }}>{contact.name}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{contact.number}</div>
          </div>
        ))}
      </div>

      <div style={styles.callHistory}>
        <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
          📞 Call History
        </div>
        {callHistory.slice(-5).map(call => (
          <div key={call.id} style={styles.historyItem}>
            <div>
              <div>{call.contact}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {call.timestamp.toLocaleString()}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div>{call.type === 'outgoing' ? '📤' : '📥'}</div>
              <div>{call.duration}s</div>
            </div>
          </div>
        ))}
      </div>

      {voiceCommand && (
        <div style={styles.voiceCommand}>
          Last voice command: "{voiceCommand}"
        </div>
      )}
    </div>
  );
}
