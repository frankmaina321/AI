# PERIS AI - Setup and Running Guide

## Overview
PERIS (Personal Enhanced Responsive Intelligence System) is a research-focused AI assistant with memory, voice, and image support.

## Project Structure
```
peris/
├── src/                    # React frontend
│   ├── App.jsx             # Main application component
│   └── ...
├── server.js               # Backend server (Express.js)
├── package.json            # Frontend dependencies
├── .env                    # Environment variables
└── vite.config.js         # Vite configuration
```

## Setup Instructions

### 1. Install Dependencies
```bash
# Install frontend dependencies
npm install

# The server.js uses built-in Node.js modules and installed packages
```

### 2. Configure Environment Variables
Edit the `.env` file in the root directory:
```
GEMINI_API_KEY=your_actual_gemini_api_key_here
PORT=8787
```

**Important**: You need to get a Gemini API key from Google AI Studio:
1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key
3. Replace `your_actual_gemini_api_key_here` with your key

### 3. Start the Application

#### Option A: Start Backend and Frontend Separately
```bash
# Terminal 1: Start the backend server
node server.js

# Terminal 2: Start the frontend development server
npm run dev
```

#### Option B: Use Concurrent (Recommended)
Install concurrently if not already installed:
```bash
npm install -g concurrently
```

Then run both servers together:
```bash
concurrently "node server.js" "npm run dev"
```

### 4. Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:8787
- Health Check: http://localhost:8787/api/health

## Features
- **Chat Interface**: AI-powered research assistance with natural conversation
- **Topic Memory**: Persistent conversation history by topic
- **Enhanced Voice Input**: Improved speech-to-text with real-time feedback
- **Natural Voice Reply**: High-quality text-to-speech with natural voice selection
- **Camera Integration**: Take photos directly in the app for instant analysis
- **Image Upload**: Upload and analyze images from your device
- **Real-time Status**: Live feedback for listening, speaking, and processing states
- **Export Options**: Export conversations as Markdown or PDF
- **Research Templates**: Pre-built research prompts for quick insights
- **Web Grounding**: AI can search the web for current information

## API Endpoints
- `GET /api/health` - Check server status and API key
- `POST /api/chat` - Send chat messages to AI

## Troubleshooting

### Common Issues
1. **"SERVER KEY MISSING"**: Check your `.env` file for the GEMINI_API_KEY
2. **"SERVER OFFLINE"**: Ensure the backend server is running on port 8177
3. **CORS Errors**: The backend has CORS configured, but check if ports match
4. **Voice Features**: Voice input requires HTTPS in production or localhost in development

### Port Conflicts
If port 8787 is occupied, you can change it in the `.env` file:
```
PORT=3000
```

## Usage Guide

### Voice Interaction
1. **Voice Input**: Click "Voice Input" button to start speaking
   - Real-time feedback shows what you're saying
   - Automatic transcription to text
   - Click "Stop Mic" when done speaking

2. **Voice Reply**: Toggle "Voice Reply" button to enable/disable AI responses
   - AI speaks responses naturally
   - Automatic voice selection for best quality
   - Status shows "SPEAKING..." during responses

### Camera Features
1. **Take Photos**: Click "Open Camera" to activate camera
   - Live camera preview appears
   - Click "📸 Capture Photo" to take picture
   - Photo automatically attached to next message

2. **Upload Images**: Use "Upload Image" button for files
   - Supports JPG, PNG, GIF formats
   - Images displayed in chat preview

### Status Indicators
- **SYSTEM NOMINAL**: Ready for interaction
- **LISTENING...**: Voice input active
- **HEARING: [text]**: Real-time speech recognition
- **SPEAKING...**: AI voice response active
- **PROCESSING...**: Generating AI response
- **MIC ERROR**: Microphone access issues

## Development Notes
- Frontend uses React with Vite
- Backend uses Express.js with Google Gemini API
- State management uses React hooks and localStorage
- Styling uses inline styles with a cyberpunk theme
- Camera uses WebRTC getUserMedia API
- Voice uses Web Speech API (recognition and synthesis)
- The application supports both text and image inputs to the AI

## Security Notes
- Never commit your `.env` file with real API keys
- The API key is server-side only and not exposed to the frontend
- Image uploads are processed as base64 and sent directly to Gemini API
