# PERIS AI - Feature Test Checklist

## 🎯 Quick Start Test
1. [ ] Start backend: `node server.js`
2. [ ] Start frontend: `npm run dev`
3. [ ] Access: http://localhost:5173
4. [ ] Check status shows "SYSTEM NOMINAL" and "SERVER READY"

## 🎤 Voice Features Test

### Voice Input Test
1. [ ] Click "Voice Input" button
2. [ ] Status should change to "LISTENING..."
3. [ ] Speak: "Hello PERIS, how are you today?"
4. [ ] Status should show "HEARING: [your words]"
5. [ ] Text should appear in input field
6. [ ] Click "Stop Mic" or wait for auto-stop
7. [ ] Status returns to "SYSTEM NOMINAL"

### Voice Reply Test
1. [ ] Ensure "Voice Reply: On" is enabled
2. [ ] Send a text message: "Tell me a joke"
3. [ ] Status should change to "PROCESSING..."
4. [ ] Then change to "SPEAKING..."
5. [ ] AI should speak the response naturally
6. [ ] Status returns to "SYSTEM NOMINAL"

## 📸 Camera Features Test

### Camera Capture Test
1. [ ] Click "Open Camera" button
2. [ ] Camera preview should appear
3. [ ] Grant camera permissions if prompted
4. [ ] Click "📸 Capture Photo"
5. [ ] Camera should close
6. [ ] Image preview should show in input area
7. [ ] Send message with photo: "What do you see in this image?"

### Image Upload Test
1. [ ] Click "Upload Image" button
2. [ ] Select an image file from your computer
3. [ ] Image preview should appear
4. [ ] Send with message: "Analyze this image for me"

## 🗣️ Natural Conversation Test

### Context Memory Test
1. [ ] Set topic: "project planning"
2. [ ] Send: "I'm building a website"
3. [ ] Send: "What technologies should I use?"
4. [ ] Send: "What about the database?"
5. [ ] AI should remember the website context

### Voice + Camera Test
1. [ ] Enable voice input and reply
2. [ ] Take a photo with camera
3. [ ] Speak: "Describe what you see in this photo"
4. [ ] AI should respond verbally analyzing the image

## 🔧 Technical Features Test

### Health Check Test
1. [ ] Visit: http://localhost:8787/api/health
2. [ ] Should return JSON with:
   ```json
   {
     "ok": true,
     "hasGeminiKey": true,
     "features": {
       "voiceInput": true,
       "voiceReply": true,
       "cameraUpload": true,
       "fileUpload": true,
       "webSearch": true
     }
   }
   ```

### Export Features Test
1. [ ] Have a conversation with several messages
2. [ ] Click "Export Markdown"
3. [ ] File should download with .md extension
4. [ ] Click "Export PDF"
5. [ ] Print dialog should open

### Research Templates Test
1. [ ] Click any "Use Template" button
2. [ ] Template text should appear in input
3. [ ] Modify and send the template query
4. [ ] AI should respond with structured research

## 🚨 Error Handling Test

### Missing API Key Test
1. [ ] Rename .env to .env.backup
2. [ ] Restart server
3. [ ] Status should show "SERVER KEY MISSING"
4. [ ] Restore .env file

### Permission Denied Test
1. [ ] Deny camera access when prompted
2. [ ] Should show error message
3. [ ] Deny microphone access
4. [ ] Should show error message

### Server Offline Test
1. [ ] Stop the backend server
2. [ ] Try to send a message
3. [ ] Should show "SERVER OFFLINE" status

## 📊 Performance Test

### Large Message Test
1. [ ] Paste a long text (1000+ words)
2. [ ] Send and verify response
3. [ ] Check for performance issues

### Multiple Images Test
1. [ ] Send multiple image messages in sequence
2. [ ] Verify each is processed correctly
3. [ ] Check memory usage

## ✅ Success Criteria
- All voice features work with natural interaction
- Camera captures and processes images correctly
- AI responds contextually and naturally
- Status indicators provide clear feedback
- Export functions work properly
- Error handling is user-friendly
- Performance remains smooth

## 🐛 Troubleshooting
- **Voice not working**: Check browser permissions (Chrome/Edge recommended)
- **Camera not working**: Ensure HTTPS in production or localhost in dev
- **Server errors**: Verify .env file has correct GEMINI_API_KEY
- **Status issues**: Refresh page and check browser console for errors
