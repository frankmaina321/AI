import { useEffect, useState, useRef } from "react";

const TOPIC_PREFIX = "peris_topic_";
const LAST_TOPIC_KEY = "peris_last_topic";

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

Behavior:
- Prefer recent, verifiable information
- Execute device commands when requested
- Provide status updates for all connected devices
- If uncertain, state uncertainty and how to verify
- Always prioritize user safety and security
`;

function defaultGreeting(topic) {
  return [
    {
      role: "model",
      content: `PERIS online. Enhanced system ready for "${topic}". Voice commands, device control, and phone integration activated.`,
      resources: [],
    },
  ];
}

function topicStorageKey(topic) {
  return `${TOPIC_PREFIX}${topic.toLowerCase()}`;
}

function loadTopicMessages(topic) {
  try {
    const raw = localStorage.getItem(topicStorageKey(topic));
    if (!raw) return defaultGreeting(topic);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return defaultGreeting(topic);
    return parsed;
  } catch {
    return defaultGreeting(topic);
  }
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export default function App_Working() {
  const initialTopic = localStorage.getItem(LAST_TOPIC_KEY) || "general";
  const [topic, setTopic] = useState(initialTopic);
  const [topicDraft, setTopicDraft] = useState(initialTopic);
  const [messages, setMessages] = useState(() => loadTopicMessages(initialTopic));
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("SYSTEM NOMINAL");
  const [loading, setLoading] = useState(false);
  const [serverReady, setServerReady] = useState(false);
  const [voiceReplyEnabled, setVoiceReplyEnabled] = useState(true);
  const [listening, setListening] = useState(false);
  const [imageAttachment, setImageAttachment] = useState(null);
  const [activeView, setActiveView] = useState('chat'); // chat, devices, phone, voice, notifications, deployment, auth, platform

  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    localStorage.setItem(LAST_TOPIC_KEY, topic);
    setMessages(loadTopicMessages(topic));
  }, [topic]);

  useEffect(() => {
    const safeMessages = messages.map((message) => ({
      role: message.role,
      content: message.content,
      resources: message.resources || [],
    }));
    localStorage.setItem(topicStorageKey(topic), JSON.stringify(safeMessages));
  }, [messages, topic]);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        if (data?.ok && data?.hasGeminiKey) {
          setServerReady(true);
        } else {
          setStatus("SERVER KEY MISSING");
        }
      })
      .catch(() => {
        setStatus("SERVER OFFLINE");
      });
  }, []);

  // Enhanced voice synthesis with multiple voice options
  useEffect(() => {
    if (!voiceReplyEnabled || loading || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.role !== "model") return;
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    
    // Get available voices and select best one
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Samantha') || 
      voice.name.includes('Karen') || 
      voice.name.includes('Daniel') ||
      voice.name.includes('Google') ||
      voice.name.includes('Microsoft') ||
      voice.lang.includes('en')
    ) || voices[0];

    const utterance = new SpeechSynthesisUtterance(last.content);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.9;
    utterance.lang = 'en-US';
    utterance.voice = preferredVoice;
    
    utterance.onstart = () => {
      setStatus("SPEAKING...");
    };
    
    utterance.onend = () => {
      setStatus("SYSTEM NOMINAL");
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setStatus("VOICE ERROR");
    };

    window.speechSynthesis.speak(utterance);
  }, [messages, loading, voiceReplyEnabled]);

  const lastSpokenIndexRef = useRef(-1);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    if (!serverReady) {
      alert("Backend server is not ready. Start it and ensure GEMINI_API_KEY is configured.");
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

  function applyTopic() {
    const next = topicDraft.trim().toLowerCase();
    if (!next) return;
    setTopic(next);
  }

  function resetTopicMemory() {
    localStorage.removeItem(topicStorageKey(topic));
    setMessages(defaultGreeting(topic));
  }

  function onSelectImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Only image files are allowed.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const parts = result.split(",");
      if (parts.length < 2) return;
      setImageAttachment({
        name: file.name,
        mimeType: file.type,
        base64: parts[1],
        previewUrl: result,
      });
    };
    reader.readAsDataURL(file);
  }

  const statusColor = useMemo(() => {
    if (status === "SYSTEM NOMINAL") return "#00ff88";
    if (status === "PROCESSING...") return "#ffaa00";
    return "#ff6666";
  }, [status]);

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
    navigation: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      padding: "12px 16px",
      borderBottom: "1px solid rgba(0,229,255,0.14)",
    },
    navButton: {
      background: activeView === 'chat' ? "rgba(0,119,255,0.3)" : "rgba(255,255,255,0.1)",
      border: "1px solid rgba(0,119,255,0.4)",
      borderRadius: 8,
      color: "#e0f7fa",
      padding: "8px 12px",
      cursor: "pointer",
      fontSize: 12,
      fontWeight: activeView === 'chat' ? 'bold' : 'normal'
    },
    mainContent: {
      flex: 1,
      overflow: "hidden"
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
    resources: { marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(0,229,255,0.25)" },
    resourceLink: {
      display: "block",
      color: "#9cdfff",
      marginTop: 3,
      textDecoration: "none",
      fontSize: 12,
      overflowWrap: "anywhere",
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
    placeholder: {
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      height: "100%",
      opacity: 0.7,
      fontSize: 18,
      color: "#00e5ff"
    }
  };

  const renderView = () => {
    switch (activeView) {
      case 'devices':
        return (
          <div style={styles.placeholder}>
            🏠 Device Control Panel
            <div style={{ fontSize: 14, marginTop: 10 }}>
              Smart home device management coming soon
            </div>
          </div>
        );
      case 'phone':
        return (
          <div style={styles.placeholder}>
            📱 Phone Integration
            <div style={{ fontSize: 14, marginTop: 10 }}>
              Voice-activated calling system coming soon
            </div>
          </div>
        );
      case 'voice':
        return (
          <div style={styles.placeholder}>
            🎤 Voice Commands
            <div style={{ fontSize: 14, marginTop: 10 }}>
              Advanced voice control system coming soon
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div style={styles.placeholder}>
            🔔 Notifications
            <div style={{ fontSize: 14, marginTop: 10 }}>
              Real-time alert system coming soon
            </div>
          </div>
        );
      case 'deployment':
        return (
          <div style={styles.placeholder}>
            🚀 Deployment
            <div style={{ fontSize: 14, marginTop: 10 }}>
              Cloud deployment configuration coming soon
            </div>
          </div>
        );
      case 'auth':
        return (
          <div style={styles.placeholder}>
            🔐 Authentication
            <div style={{ fontSize: 14, marginTop: 10 }}>
            User management system coming soon
          </div>
          </div>
        );
      case 'platform':
        return (
          <div style={styles.placeholder}>
            🌐 Platform Info
            <div style={{ fontSize: 14, marginTop: 10 }}>
              Cross-platform compatibility info coming soon
            </div>
          </div>
        );
      default:
        return (
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
                    <div style={styles.resources}>
                      <div>Resources:</div>
                      {message.resources.map((resource) => (
                        <a
                          key={resource.uri}
                          href={resource.uri}
                          target="_blank"
                          rel="noreferrer"
                          style={styles.resourceLink}
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
        );
    }
  };

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>PERIS AI Enhanced</div>
          <div style={styles.subtitle}>Smart home, phone, and device control with voice commands</div>
        </div>
        <div style={styles.status}>
          {status}
          <br />
          {serverReady ? "SYSTEM READY" : "SERVER CHECKING"}
        </div>
      </div>

      <div style={styles.navigation}>
        <button style={styles.navButton} onClick={() => setActiveView('chat')}>
          💬 Chat
        </button>
        <button style={styles.navButton} onClick={() => setActiveView('devices')}>
          🏠 Devices
        </button>
        <button style={styles.navButton} onClick={() => setActiveView('phone')}>
          📱 Phone
        </button>
        <button style={styles.navButton} onClick={() => setActiveView('voice')}>
          🎤 Voice Commands
        </button>
        <button style={styles.navButton} onClick={() => setActiveView('notifications')}>
          🔔 Notifications
        </button>
        <button style={styles.navButton} onClick={() => setActiveView('deployment')}>
          🚀 Deploy
        </button>
        <button style={styles.navButton} onClick={() => setActiveView('auth')}>
          🔐 Auth
        </button>
        <button style={styles.navButton} onClick={() => setActiveView('platform')}>
          🌐 Platform
        </button>
      </div>

      <div style={styles.mainContent}>
        {renderView()}
      </div>

      <div style={styles.inputWrap}>
        <div style={styles.textAreaWrap}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleInputKey}
            placeholder="Ask anything. For images, include what to analyze in your prompt."
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
