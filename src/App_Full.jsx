import { useEffect, useState, useRef } from "react";

const PERIS_SYSTEM_PROMPT = `
You are PERIS (Personal Enhanced Responsive Intelligence System), a comprehensive AI assistant for smart home, phone, and device control.
Style:
- Professional, concise, practical
- You may occasionally call the user "Boss"
- Always provide actionable responses

Capabilities:
- Voice-activated device control (lights, thermostat, security, appliances)
- Phone integration with voice commands
- Smart home automation
- Real-time notifications and alerts
- Cross-platform compatibility (mobile, tablet, desktop)
- Remote access and deployment options
- Authentication and user management
- Image analysis and file processing
- Conversation memory and storage

Behavior:
- Prefer recent, verifiable information
- Execute device commands when requested
- Provide status updates for all connected devices
- If uncertain, state uncertainty and how to verify
- Always prioritize user safety and security
- Analyze images and files when provided
- Remember conversation context and user preferences
`;

export default function App_Full() {
  const [messages, setMessages] = useState([
    {
      role: "model",
      content: "PERIS online. Enhanced system ready with voice selection, camera, file upload, and conversation storage. How can I help you today?",
      resources: [],
    }
  ]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("SYSTEM NOMINAL");
  const [loading, setLoading] = useState(false);
  const [serverReady, setServerReady] = useState(false);
  const [voiceReplyEnabled, setVoiceReplyEnabled] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState("female");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [imageAttachment, setImageAttachment] = useState(null);
  const [showFeatureMenu, setShowFeatureMenu] = useState(false);
  const [savedConversations, setSavedConversations] = useState([]);
  const [currentConversationName, setCurrentConversationName] = useState("Current Chat");

  const inputRef = useRef(null);
  const bottomRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    // Load saved conversations from localStorage
    const saved = localStorage.getItem('peris_conversations');
    if (saved) {
      try {
        setSavedConversations(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load conversations:', error);
      }
    }
  }, []);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        if (data?.ok && data?.hasGeminiKey) {
          setServerReady(true);
          setStatus("SYSTEM READY");
        } else {
          setStatus("SERVER KEY MISSING");
        }
      })
      .catch(() => {
        setStatus("SERVER OFFLINE");
      });
  }, []);

  // Voice synthesis with gender selection
  useEffect(() => {
    if (!voiceReplyEnabled || loading || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.role !== "model") return;
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    
    const voices = window.speechSynthesis.getVoices();
    let preferredVoice;
    
    if (selectedVoice === "female") {
      preferredVoice = voices.find(voice => 
        voice.name.includes('Samantha') ||
        voice.name.includes('Karen') ||
        voice.name.includes('Google UK English Female') ||
        voice.name.includes('Microsoft Zira') ||
        voice.lang.includes('female')
      );
    } else if (selectedVoice === "male") {
      preferredVoice = voices.find(voice => 
        voice.name.includes('Daniel') ||
        voice.name.includes('Google UK English Male') ||
        voice.name.includes('Microsoft David') ||
        voice.name.includes('Microsoft Mark') ||
        voice.lang.includes('male')
      );
    } else if (selectedVoice === "teenage_girl") {
      preferredVoice = voices.find(voice => 
        voice.name.includes('Allison') ||
        voice.name.includes('Google US English Female') ||
        voice.name.includes('Microsoft Hazel') ||
        voice.name.includes('Samantha') ||
        voice.lang.includes('female')
      );
    } else if (selectedVoice === "teenage_boy") {
      preferredVoice = voices.find(voice => 
        voice.name.includes('Alex') ||
        voice.name.includes('Google US English Male') ||
        voice.name.includes('Microsoft Ryan') ||
        voice.name.includes('Daniel') ||
        voice.lang.includes('male')
      );
    } else if (selectedVoice === "child") {
      preferredVoice = voices.find(voice => 
        voice.name.includes('Karen') ||
        voice.name.includes('Microsoft Zira') ||
        voice.name.includes('Samantha') ||
        voice.name.includes('Google UK English Female') ||
        voice.lang.includes('female')
      );
    }
    
    // Fallback to any available voice
    if (!preferredVoice) {
      preferredVoice = voices.find(voice => voice.lang.includes('en')) || voices[0];
    }

    const utterance = new SpeechSynthesisUtterance(last.content);
    utterance.rate = 0.9;
    
    // Set pitch based on voice type
    if (selectedVoice === "female") {
      utterance.pitch = 1.1;
    } else if (selectedVoice === "male") {
      utterance.pitch = 0.9;
    } else if (selectedVoice === "teenage_girl") {
      utterance.pitch = 1.3;
      utterance.rate = 1.0; // Slightly faster for teen
    } else if (selectedVoice === "teenage_boy") {
      utterance.pitch = 0.8;
      utterance.rate = 1.0; // Slightly faster for teen
    } else if (selectedVoice === "child") {
      utterance.pitch = 1.4;
      utterance.rate = 0.8; // Slower for child
    } else {
      utterance.pitch = 1.0;
    }
    
    utterance.volume = 0.9;
    utterance.lang = 'en-US';
    utterance.voice = preferredVoice;
    
    utterance.onstart = () => setStatus("SPEAKING...");
    utterance.onend = () => setStatus("SYSTEM NOMINAL");
    utterance.onerror = () => setStatus("VOICE ERROR");

    window.speechSynthesis.speak(utterance);
  }, [messages, loading, voiceReplyEnabled, selectedVoice]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    if (!serverReady) {
      alert("Backend server is not ready. Please start the backend server.");
      return;
    }

    const userMessage = {
      role: "user",
      content: text,
      resources: [],
      imageName: imageAttachment?.name || null,
      imagePreviewUrl: imageAttachment?.previewUrl || null,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setStatus("PROCESSING...");

    try {
      const contents = nextMessages.map((message) => {
        const parts = [{ text: message.content }];
        if (message.role === "user" && imageAttachment?.base64) {
          parts.push({
            inlineData: {
              mimeType: imageAttachment.mimeType,
              data: imageAttachment.base64,
            },
          });
        }
        return {
          role: message.role === "model" ? "model" : "user",
          parts,
        };
      });

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt: PERIS_SYSTEM_PROMPT.trim(),
          contents,
        }),
      });

      const data = await response.json();
      if (!response.ok || data?.error) {
        throw new Error(data?.error || "Request failed");
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "model",
          content: data.reply,
          resources: data.resources || [],
        },
      ]);
      setImageAttachment(null);
      setStatus("SYSTEM NOMINAL");
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        { role: "model", content: `Error: ${error.message}`, resources: [] },
      ]);
      setStatus("ERROR DETECTED");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleInputKey(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  // Camera functions
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });
      setCameraStream(stream);
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      alert("Camera access denied or not available. Please check permissions.");
      console.error("Camera error:", error);
    }
  }

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
      setCameraActive(false);
    }
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || "");
        const parts = result.split(",");
        if (parts.length >= 2) {
          setImageAttachment({
            name: `camera-photo-${Date.now()}.jpg`,
            mimeType: "image/jpeg",
            base64: parts[1],
            previewUrl: result,
          });
          stopCamera();
        }
      };
      reader.readAsDataURL(blob);
    }, "image/jpeg", 0.9);
  }

  // File upload function
  function handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") && !file.type.startsWith("text/")) {
      alert("Please select an image or text file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const parts = result.split(",");
      if (parts.length >= 2) {
        setImageAttachment({
          name: file.name,
          mimeType: file.type,
          base64: parts[1],
          previewUrl: file.type.startsWith("image/") ? result : null,
        });
      }
    };
    reader.readAsDataURL(file);
  }

  // Conversation storage functions
  function saveConversation() {
    const conversation = {
      id: Date.now(),
      name: currentConversationName,
      messages: messages,
      timestamp: new Date().toISOString(),
    };

    const updated = [conversation, ...savedConversations.filter(c => c.id !== conversation.id)];
    setSavedConversations(updated);
    localStorage.setItem('peris_conversations', JSON.stringify(updated));
    setStatus("CONVERSATION SAVED");
    setTimeout(() => setStatus("SYSTEM NOMINAL"), 2000);
  }

  function loadConversation(conversationId) {
    const conversation = savedConversations.find(c => c.id === conversationId);
    if (conversation) {
      setMessages(conversation.messages);
      setCurrentConversationName(conversation.name);
      setShowFeatureMenu(false);
    }
  }

  function deleteConversation(conversationId) {
    const updated = savedConversations.filter(c => c.id !== conversationId);
    setSavedConversations(updated);
    localStorage.setItem('peris_conversations', JSON.stringify(updated));
  }

  function clearCurrentConversation() {
    setMessages([{
      role: "model",
      content: "PERIS online. Enhanced system ready with voice selection, camera, file upload, and conversation storage. How can I help you today?",
      resources: [],
    }]);
    setCurrentConversationName("Current Chat");
  }

  const statusColor = status === "SYSTEM NOMINAL" ? "#00ff88" : 
                      status === "PROCESSING..." ? "#ffaa00" : 
                      status === "SYSTEM READY" ? "#00ff88" : "#ff6666";

  const styles = {
    app: {
      minHeight: "100vh",
      background: "#06111b",
      color: "#e0f7fa",
      display: "flex",
      flexDirection: "column",
      fontFamily: "Courier New, monospace",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12,
      padding: "14px 16px",
      borderBottom: "1px solid rgba(0,229,255,0.2)",
    },
    title: { fontSize: 21, letterSpacing: 4, color: "#00e5ff" },
    subtitle: { fontSize: 11, opacity: 0.8, marginTop: 4 },
    status: { fontSize: 10, letterSpacing: 2, textAlign: "right", color: statusColor },
    featureMenu: {
      position: "fixed",
      top: 60,
      right: 20,
      background: "rgba(0,17,27,0.95)",
      border: "1px solid rgba(0,229,255,0.3)",
      borderRadius: 8,
      padding: 15,
      minWidth: 250,
      zIndex: 1000,
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
    },
    menuHeader: {
      fontSize: 14,
      fontWeight: "bold",
      marginBottom: 10,
      color: "#00e5ff",
      borderBottom: "1px solid rgba(0,229,255,0.2)",
      paddingBottom: 5
    },
    menuItem: {
      padding: "8px 12px",
      margin: "5px 0",
      background: "rgba(0,119,255,0.1)",
      border: "1px solid rgba(0,119,255,0.2)",
      borderRadius: 6,
      cursor: "pointer",
      fontSize: 12,
      transition: "all 0.3s ease"
    },
    menuItemHover: {
      background: "rgba(0,119,255,0.2)",
      transform: "translateY(-1px)"
    },
    chat: { flex: 1, overflowY: "auto", padding: 12, display: "grid", gap: 10 },
    modelRow: { justifySelf: "start", maxWidth: "86%" },
    userRow: { justifySelf: "end", maxWidth: "86%" },
    modelBubble: {
      background: "rgba(0,229,255,0.12)",
      borderRadius: "10px 10px 10px 2px",
      padding: "10px 12px",
      whiteSpace: "pre-wrap",
      lineHeight: 1.45,
      fontSize: 13,
    },
    userBubble: {
      background: "rgba(0,119,255,0.24)",
      border: "1px solid rgba(0,119,255,0.35)",
      borderRadius: "10px 10px 2px 10px",
      padding: "10px 12px",
      whiteSpace: "pre-wrap",
      lineHeight: 1.45,
      fontSize: 13,
    },
    inputWrap: {
      borderTop: "1px solid rgba(0,229,255,0.2)",
      padding: 12,
      display: "grid",
      gap: 8,
    },
    textAreaWrap: {
      background: "rgba(255,255,255,0.06)",
      borderRadius: 8,
      padding: 8,
      display: "flex",
      gap: 8,
      alignItems: "flex-end",
    },
    textarea: {
      flex: 1,
      minHeight: 54,
      background: "transparent",
      border: "none",
      color: "#e0f7fa",
      outline: "none",
      resize: "vertical",
      fontFamily: "Courier New, monospace",
      fontSize: 13,
    },
    button: {
      background: "#0077ff",
      color: "white",
      border: "none",
      padding: "10px 20px",
      borderRadius: 6,
      cursor: "pointer",
      fontSize: 14,
    },
    hint: { fontSize: 10, opacity: 0.75, textAlign: "center" },
    controls: {
      display: "flex",
      gap: 10,
      padding: "10px",
      background: "rgba(0,119,255,0.1)",
      borderRadius: 8,
      margin: "10px",
      flexWrap: "wrap"
    },
    controlButton: {
      background: "#0077ff",
      color: "white",
      border: "none",
      padding: "8px 16px",
      borderRadius: 6,
      cursor: "pointer",
      fontSize: 12,
    },
    cameraPreview: {
      padding: 12,
      borderTop: "1px solid rgba(0,229,255,0.2)",
      borderBottom: "1px solid rgba(0,229,255,0.2)",
      display: "flex",
      justifyContent: "center",
      backgroundColor: "rgba(0,0,0,0.3)",
    },
    videoPreview: {
      maxWidth: "100%",
      maxHeight: "300px",
      borderRadius: 8,
      border: "2px solid rgba(0,229,255,0.3)",
    },
    imagePreview: {
      maxWidth: 200,
      maxHeight: 200,
      borderRadius: 8,
      border: "1px solid rgba(0,229,255,0.3)",
      marginTop: 10
    },
    select: {
      background: "rgba(255,255,255,0.1)",
      border: "1px solid rgba(0,229,255,0.2)",
      borderRadius: 6,
      padding: "8px",
      color: "#e0f7fa",
      fontSize: 12
    },
    conversationList: {
      maxHeight: 200,
      overflowY: "auto",
      marginTop: 10
    },
    conversationItem: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "8px",
      background: "rgba(0,119,255,0.1)",
      borderRadius: 6,
      marginBottom: 5,
      cursor: "pointer"
    },
    deleteButton: {
      background: "#ff6b6b",
      color: "white",
      border: "none",
      padding: "4px 8px",
      borderRadius: 4,
      cursor: "pointer",
      fontSize: 10
    }
  };

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>PERIS AI</div>
          <div style={styles.subtitle}>Enhanced Smart Home & Voice Control</div>
        </div>
        <div style={styles.status}>
          {status}
          <br />
          {serverReady ? "✅ Backend Ready" : "❌ Backend Offline"}
        </div>
      </div>

      {/* Feature Menu Button */}
      <button
        onClick={() => setShowFeatureMenu(!showFeatureMenu)}
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          background: "#0077ff",
          color: "white",
          border: "none",
          padding: "10px 15px",
          borderRadius: 8,
          cursor: "pointer",
          fontSize: 12,
          zIndex: 999
        }}
      >
        ⚙️ Features
      </button>

      {/* Feature Menu Dropdown */}
      {showFeatureMenu && (
        <div style={styles.featureMenu}>
          <div style={styles.menuHeader}>🎛️ Feature Controls</div>
          
          {/* Voice Selection */}
          <div style={styles.menuItem}>
            <div style={{ marginBottom: 5 }}>🎤 Voice Selection</div>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              style={styles.select}
            >
              <option value="female">👩 Female Voice</option>
              <option value="male">👨 Male Voice</option>
              <option value="teenage_girl">👧 Teenage Girl Voice</option>
              <option value="teenage_boy">👦 Teenage Boy Voice</option>
              <option value="child">🧒 Child Voice</option>
            </select>
          </div>

          {/* Voice Control */}
          <div style={styles.menuItem}>
            <button
              onClick={() => setVoiceReplyEnabled(!voiceReplyEnabled)}
              style={{
                ...styles.controlButton,
                background: voiceReplyEnabled ? "#00ff88" : "#ff6b6b",
                color: voiceReplyEnabled ? "#06111b" : "white",
                width: "100%"
              }}
            >
              {voiceReplyEnabled ? "🔊 Voice ON" : "🔇 Voice OFF"}
            </button>
          </div>

          {/* Camera Controls */}
          <div style={styles.menuItem}>
            <div style={{ marginBottom: 5 }}>📷 Camera</div>
            <button
              onClick={cameraActive ? stopCamera : startCamera}
              style={{ ...styles.controlButton, width: "100%", marginBottom: 5 }}
            >
              {cameraActive ? "📷 Stop Camera" : "📷 Start Camera"}
            </button>
            {cameraActive && (
              <button
                onClick={capturePhoto}
                style={{ ...styles.controlButton, width: "100%" }}
              >
                📸 Capture Photo
              </button>
            )}
          </div>

          {/* File Upload */}
          <div style={styles.menuItem}>
            <div style={{ marginBottom: 5 }}>📁 File Upload</div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,text/*"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{ ...styles.controlButton, width: "100%" }}
            >
              📤 Upload File
            </button>
          </div>

          {/* Conversation Storage */}
          <div style={styles.menuItem}>
            <div style={{ marginBottom: 5 }}>💾 Conversations</div>
            <input
              type="text"
              value={currentConversationName}
              onChange={(e) => setCurrentConversationName(e.target.value)}
              placeholder="Conversation name"
              style={{
                ...styles.select,
                width: "100%",
                marginBottom: 5
              }}
            />
            <button
              onClick={saveConversation}
              style={{ ...styles.controlButton, width: "100%", marginBottom: 5 }}
            >
              💾 Save Current
            </button>
            <button
              onClick={clearCurrentConversation}
              style={{ ...styles.controlButton, width: "100%", background: "#ff6b6b" }}
            >
              🗑️ Clear Current
            </button>
          </div>

          {/* Saved Conversations */}
          {savedConversations.length > 0 && (
            <div style={styles.menuItem}>
              <div style={{ marginBottom: 5 }}>📚 Saved Chats</div>
              <div style={styles.conversationList}>
                {savedConversations.slice(0, 5).map(conv => (
                  <div key={conv.id} style={styles.conversationItem}>
                    <div onClick={() => loadConversation(conv.id)}>
                      <div style={{ fontSize: 12, fontWeight: "bold" }}>{conv.name}</div>
                      <div style={{ fontSize: 10, opacity: 0.7 }}>
                        {new Date(conv.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                      style={styles.deleteButton}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Camera Preview */}
      {cameraActive && (
        <div style={styles.cameraPreview}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={styles.videoPreview}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      )}

      {/* Image Attachment Preview */}
      {imageAttachment && (
        <div style={{ padding: 12, textAlign: "center" }}>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 5 }}>
            📎 Attached: {imageAttachment.name}
          </div>
          {imageAttachment.previewUrl && (
            <img
              src={imageAttachment.previewUrl}
              alt={imageAttachment.name}
              style={styles.imagePreview}
            />
          )}
          <button
            onClick={() => setImageAttachment(null)}
            style={{ ...styles.controlButton, marginTop: 10, background: "#ff6b6b" }}
          >
            Remove Attachment
          </button>
        </div>
      )}

      <div style={styles.chat}>
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} style={message.role === "user" ? styles.userRow : styles.modelRow}>
            <div style={message.role === "user" ? styles.userBubble : styles.modelBubble}>
              {message.content}
              {message.imagePreviewUrl && (
                <div style={{ marginTop: 8 }}>
                  <img
                    src={message.imagePreviewUrl}
                    alt={message.imageName || "uploaded"}
                    style={{ maxWidth: 220, borderRadius: 8 }}
                  />
                </div>
              )}
              {message.role === "model" && message.resources?.length > 0 && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(0,229,255,0.25)" }}>
                  <div>Resources:</div>
                  {message.resources.map((resource) => (
                    <a
                      key={resource.uri}
                      href={resource.uri}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "block",
                        color: "#9cdfff",
                        marginTop: 3,
                        textDecoration: "none",
                        fontSize: 12,
                        overflowWrap: "anywhere",
                      }}
                    >
                      {resource.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={styles.modelRow}>
            <div style={styles.modelBubble}>Processing...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={styles.inputWrap}>
        <div style={styles.textAreaWrap}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleInputKey}
            placeholder="Ask PERIS AI anything about smart home control, voice commands, or upload images for analysis..."
            style={styles.textarea}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{
              ...styles.button,
              opacity: loading || !input.trim() ? 0.5 : 1,
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            }}
          >
            Send
          </button>
        </div>
        <div style={styles.hint}>Enter to send, Shift+Enter for new line</div>
      </div>
    </div>
  );
}
