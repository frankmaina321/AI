import { useEffect, useMemo, useRef, useState } from "react";

const TOPIC_PREFIX = "peris_topic_";
const LAST_TOPIC_KEY = "peris_last_topic";

const RESEARCH_TEMPLATES = [
  "Create a market scan for [industry/topic] with major players, trends, and opportunities.",
  "Build a competitor brief for [company/product] with strengths, weaknesses, and pricing.",
  "Research [technology] and explain architecture, best practices, and implementation risks.",
  "Give me a learning roadmap for [skill] with free and paid resources by difficulty.",
];

const PERIS_SYSTEM_PROMPT = `
You are PERIS (Personal Enhanced Responsive Intelligence System), a research-focused personal assistant.
Style:
- Professional, concise, practical.
- You may occasionally call the user "Boss".

Behavior:
- Prefer recent, verifiable information.
- If a question needs current facts, use web grounding.
- Always provide: direct answer, action steps, and resources.
- If uncertain, state uncertainty and how to verify.
`;

function defaultGreeting(topic) {
  return [
    {
      role: "model",
      content: `PERIS online. Topic memory loaded for "${topic}". Ask me to research anything and I will cite resources.`,
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

export default function App() {
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
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);

  const inputRef = useRef(null);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);
  const lastSpokenIndexRef = useRef(-1);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

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

  useEffect(() => {
    if (!voiceReplyEnabled || loading || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.role !== "model") return;
    if (lastSpokenIndexRef.current === messages.length - 1) return;
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    
    // Get available voices and select a natural sounding one
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Samantha') || 
      voice.name.includes('Karen') || 
      voice.name.includes('Daniel') ||
      voice.name.includes('Google') ||
      voice.lang.includes('en')
    ) || voices[0];

    const utterance = new SpeechSynthesisUtterance(last.content);
    utterance.rate = 0.95; // Slightly slower for more natural speech
    utterance.pitch = 1.0;
    utterance.volume = 0.9;
    utterance.lang = 'en-US';
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    // Add event listeners for better interaction
    utterance.onstart = () => {
      setStatus("SPEAKING...");
    };
    
    utterance.onend = () => {
      setStatus("SYSTEM NOMINAL");
      lastSpokenIndexRef.current = messages.length - 1;
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setStatus("VOICE ERROR");
      lastSpokenIndexRef.current = messages.length - 1;
    };

    window.speechSynthesis.speak(utterance);
  }, [messages, loading, voiceReplyEnabled]);

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

  function applyTemplate(template) {
    setInput(template);
    inputRef.current?.focus();
  }

  function exportMarkdown() {
    const lines = [`# PERIS Export`, ``, `Topic: ${topic}`, ""];
    for (const message of messages) {
      lines.push(`## ${message.role === "user" ? "You" : "PERIS"}`);
      lines.push(message.content);
      if (message.resources?.length) {
        lines.push("");
        lines.push("Resources:");
        for (const resource of message.resources) {
          lines.push(`- [${resource.title}](${resource.uri})`);
        }
      }
      lines.push("");
    }
    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `peris-${topic}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPdf() {
    const rows = messages
      .map((message) => {
        const who = message.role === "user" ? "You" : "PERIS";
        const body = escapeHtml(message.content).replaceAll("\n", "<br />");
        const resources =
          message.resources?.length > 0
            ? `<div><b>Resources:</b><ul>${message.resources
                .map(
                  (resource) =>
                    `<li><a href="${resource.uri}">${escapeHtml(resource.title)}</a></li>`
                )
                .join("")}</ul></div>`
            : "";
        return `<section style="margin-bottom:20px;"><h3>${who}</h3><p>${body}</p>${resources}</section>`;
      })
      .join("");

    const popup = window.open("", "_blank");
    if (!popup) return;
    popup.document.write(`
      <html><head><title>PERIS Export</title></head>
      <body style="font-family:Arial,sans-serif;padding:24px;">
        <h1>PERIS Export</h1>
        <p><b>Topic:</b> ${escapeHtml(topic)}</p>
        ${rows}
      </body></html>
    `);
    popup.document.close();
    popup.focus();
    popup.print();
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

  function toggleListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Try Chrome or Edge.");
      return;
    }

    if (!recognitionRef.current) {
      const recog = new SpeechRecognition();
      recog.lang = "en-US";
      recog.continuous = false;
      recog.interimResults = true; // Show interim results for better UX
      recog.maxAlternatives = 1;
      
      recog.onstart = () => {
        setListening(true);
        setStatus("LISTENING...");
      };
      
      recog.onend = () => {
        setListening(false);
        setStatus("SYSTEM NOMINAL");
      };
      
      recog.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setListening(false);
        setStatus("MIC ERROR");
        
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please allow microphone access in your browser settings.');
        }
      };
      
      recog.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          setInput((prev) => `${prev}${prev ? " " : ""}${finalTranscript}`);
        }
        
        // You could show interim results in the UI if desired
        if (interimTranscript && listening) {
          setStatus(`HEARING: ${interimTranscript}`);
        }
      };
      
      recognitionRef.current = recog;
    }

    if (listening) {
      recognitionRef.current.stop();
    } else {
      // Clear any previous speech to start fresh
      window.speechSynthesis.cancel();
      recognitionRef.current.start();
    }
  }

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
    controls: {
      padding: 12,
      borderBottom: "1px solid rgba(0,229,255,0.14)",
      display: "grid",
      gap: 10,
    },
    row: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" },
    input: {
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(0,229,255,0.2)",
      borderRadius: 8,
      color: "#e0f7fa",
      padding: "8px 10px",
      minWidth: 180,
    },
    button: {
      background: "rgba(0,119,255,0.25)",
      border: "1px solid rgba(0,119,255,0.4)",
      borderRadius: 8,
      color: "#e0f7fa",
      padding: "8px 10px",
      cursor: "pointer",
      fontSize: 12,
    },
    buttonDanger: {
      background: "rgba(255,90,90,0.15)",
      border: "1px solid rgba(255,90,90,0.35)",
      borderRadius: 8,
      color: "#ffc0c0",
      padding: "8px 10px",
      cursor: "pointer",
      fontSize: 12,
    },
    templateButton: {
      background: "rgba(0,229,255,0.14)",
      border: "1px solid rgba(0,229,255,0.24)",
      borderRadius: 999,
      color: "#d7fbff",
      padding: "6px 10px",
      cursor: "pointer",
      fontSize: 11,
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
    hint: { fontSize: 10, opacity: 0.75, textAlign: "center" },
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
  };

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>PERIS</div>
          <div style={styles.subtitle}>Personal research assistant with memory, voice, and image support</div>
        </div>
        <div style={styles.status}>
          {status}
          <br />
          {serverReady ? "SERVER READY" : "SERVER CHECKING"}
        </div>
      </div>

      <div style={styles.controls}>
        <div style={styles.row}>
          <input
            value={topicDraft}
            onChange={(event) => setTopicDraft(event.target.value)}
            placeholder="topic (e.g. ai-startups)"
            style={styles.input}
          />
          <button onClick={applyTopic} style={styles.button}>
            Load Topic Memory
          </button>
          <button onClick={resetTopicMemory} style={styles.buttonDanger}>
            Reset Topic
          </button>
          <button onClick={exportMarkdown} style={styles.button}>
            Export Markdown
          </button>
          <button onClick={exportPdf} style={styles.button}>
            Export PDF
          </button>
        </div>

        <div style={styles.row}>
          <button onClick={toggleListening} style={styles.button}>
            {listening ? "Stop Mic" : "Voice Input"}
          </button>
          <button
            onClick={() => setVoiceReplyEnabled((prev) => !prev)}
            style={styles.button}
          >
            Voice Reply: {voiceReplyEnabled ? "On" : "Off"}
          </button>
          <button onClick={cameraActive ? stopCamera : startCamera} style={styles.button}>
            {cameraActive ? "Stop Camera" : "Open Camera"}
          </button>
          {cameraActive && (
            <button onClick={capturePhoto} style={styles.button}>
              📸 Capture Photo
            </button>
          )}
          <label style={styles.button}>
            Upload Image
            <input type="file" accept="image/*" onChange={onSelectImage} hidden />
          </label>
          {imageAttachment && (
            <button onClick={() => setImageAttachment(null)} style={styles.buttonDanger}>
              Remove Image ({imageAttachment.name})
            </button>
          )}
        </div>

        <div style={styles.row}>
          {RESEARCH_TEMPLATES.map((template) => (
            <button
              key={template}
              onClick={() => applyTemplate(template)}
              style={styles.templateButton}
            >
              Use Template
            </button>
          ))}
        </div>
      </div>

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
            <div style={styles.modelBubble}>Researching...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={styles.inputWrap}>
        {imageAttachment && (
          <div style={styles.hint}>Image ready: {imageAttachment.name}</div>
        )}
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