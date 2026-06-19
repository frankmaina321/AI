# PERIS Personal Research Assistant

PERIS is a React + Vite research assistant with:
- grounded Gemini responses with source links
- per-topic memory
- export to Markdown and PDF
- voice input + voice replies
- image upload for multimodal prompts
- backend proxy so Gemini key stays on the server

## Setup

1. Install packages:
   - `npm install`
2. Create `.env` from `.env.example`:
   - `GEMINI_API_KEY=your_key_here`
3. Start backend server:
   - `npm run dev:server`
4. Start frontend (new terminal):
   - `npm run dev`

The frontend calls `/api/chat` through Vite proxy (`localhost:5173` -> `localhost:8787`).
