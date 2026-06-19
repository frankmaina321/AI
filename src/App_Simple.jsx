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

Behavior:
- Prefer recent, verifiable information
- Execute device commands when requested
- Provide status updates for all connected devices
- If uncertain, state uncertainty and how to verify
- Always prioritize user safety and security
`;

export default function App_Simple() {
  const [messages, setMessages] = useState([
    {
      role: "model",
      content: "PERIS online. Enhanced system ready. How can I help you with smart home control, phone integration, or voice commands today?",
      resources: [],
    }
  ]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("SYSTEM NOMINAL");
  const [loading, setLoading] = useState(false);
  const [serverReady, setServerReady] = useState(false);
  const [voiceReplyEnabled, setVoiceReplyEnabled] = useState(true);

  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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

  // Voice synthesis
  useEffect(() => {
    if (!voiceReplyEnabled || loading || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.role !== "model") return;
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Samantha') || 
      voice.name.includes('Karen') || 
      voice.name.includes('Daniel') ||
      voice.name.includes('Google') ||
      voice.lang.includes('en')
    ) || voices[0];

    const utterance = new SpeechSynthesisUtterance(last.content);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.9;
    utterance.lang = 'en-US';
    utterance.voice = preferredVoice;
    
    utterance.onstart = () => setStatus("SPEAKING...");
    utterance.onend = () => setStatus("SYSTEM NOMINAL");
    utterance.onerror = () => setStatus("VOICE ERROR");

    window.speechSynthesis.speak(utterance);
  }, [messages, loading, voiceReplyEnabled]);

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
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setStatus("PROCESSING...");

    try {
      const contents = nextMessages.map((message) => ({
        role: message.role === "model" ? "model" : "user",
        parts: [{ text: message.content }],
      }));

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
    voiceControl: {
      display: "flex",
      gap: 10,
      padding: "10px",
      background: "rgba(0,119,255,0.1)",
      borderRadius: 8,
      margin: "10px"
    },
    voiceButton: {
      background: voiceReplyEnabled ? "#00ff88" : "#ff6b6b",
      color: "#06111b",
      border: "none",
      padding: "8px 16px",
      borderRadius: 6,
      cursor: "pointer",
      fontSize: 12,
      fontWeight: "bold"
    }
  };

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>PERIS AI</div>
          <div style={styles.subtitle}>Smart Home & Voice Control System</div>
        </div>
        <div style={styles.status}>
          {status}
          <br />
          {serverReady ? "✅ Backend Ready" : "❌ Backend Offline"}
        </div>
      </div>

      <div style={styles.voiceControl}>
        <button 
          style={styles.voiceButton}
          onClick={() => setVoiceReplyEnabled(!voiceReplyEnabled)}
        >
          {voiceReplyEnabled ? "🔊 Voice ON" : "🔇 Voice OFF"}
        </button>
        <span style={{ fontSize: 12, opacity: 0.7 }}>
          Voice synthesis {voiceReplyEnabled ? "enabled" : "disabled"}
        </span>
      </div>

      <div style={styles.chat}>
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} style={message.role === "user" ? styles.userRow : styles.modelRow}>
            <div style={message.role === "user" ? styles.userBubble : styles.modelBubble}>
              {message.content}
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
            placeholder="Ask PERIS AI anything about smart home control, voice commands, or phone integration..."
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
