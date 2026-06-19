import "dotenv/config";
import express from "express";
import https from "https";

const app = express();
const port = Number(process.env.PORT || 8787);
const geminiKey = process.env.GEMINI_API_KEY;

// CORS configuration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Authorization');
  res.header('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json({ limit: "12mb" }));

app.get("/api/health", (_req, res) => {
  const isValidKey = geminiKey && 
    geminiKey !== "your_gemini_api_key_here" && 
    geminiKey !== "your_AIza_key_here" &&
    geminiKey.startsWith("AIza");
  
  res.json({
    ok: true,
    hasGeminiKey: isValidKey,
    features: {
      voiceInput: true,
      voiceReply: true,
      cameraUpload: true,
      fileUpload: true,
      webSearch: true
    }
  });
});

app.post("/api/chat", async (req, res) => {
  if (!geminiKey) {
    res.status(500).json({
      error:
        "GEMINI_API_KEY is missing on the server. Add it in your .env file.",
    });
    return;
  }

  const { contents, systemPrompt } = req.body ?? {};
  if (!Array.isArray(contents) || contents.length === 0) {
    res.status(400).json({ error: "contents is required." });
    return;
  }

  try {
    console.log("Making request to Gemini API...");
    console.log("API Key prefix:", geminiKey.substring(0, 10) + "...");
    
    const requestBody = JSON.stringify({
      system_instruction: {
        parts: [{ text: String(systemPrompt || "") }],
      },
      contents,
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 900,
      },
    });

    const url = new URL(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`);
    
    const response = await new Promise((resolve, reject) => {
      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestBody)
        },
        rejectUnauthorized: false
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: JSON.parse(data)
            });
          } catch (e) {
            reject(new Error(`Failed to parse response: ${e.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(requestBody);
      req.end();
    });

    console.log("Response status:", response.status);
    console.log("Gemini response:", JSON.stringify(response.data, null, 2));
    
    if (response.status !== 200 || response.data?.error) {
      throw new Error(response.data?.error?.message || `Gemini request failed with status ${response.status}`);
    }

    const candidate = response.data?.candidates?.[0];
    const parts = candidate?.content?.parts ?? [];
    const reply = parts
      .map((part) => part?.text)
      .filter(Boolean)
      .join("\n")
      .trim();

    const chunks = candidate?.groundingMetadata?.groundingChunks ?? [];
    const seen = new Set();
    const resources = [];
    for (const chunk of chunks) {
      const uri = chunk?.web?.uri;
      if (!uri || seen.has(uri)) continue;
      seen.add(uri);
      resources.push({
        title: chunk?.web?.title || uri,
        uri,
      });
    }

    res.json({
      reply: reply || "I could not generate a response. Please try again.",
      resources,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown server error",
    });
  }
});

app.listen(port, () => {
  console.log(`PERIS server running on http://localhost:${port}`);
});
