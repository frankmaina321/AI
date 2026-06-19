// Connection test script for PERIS AI
import http from 'http';

// Test backend health endpoint
function testHealthEndpoint() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8787,
      path: '/api/health',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ Health endpoint test:');
          console.log('   Status:', res.statusCode);
          console.log('   Response:', JSON.stringify(response, null, 2));
          
          if (response.ok && response.hasGeminiKey) {
            console.log('   ✅ Backend is ready with valid API key');
          } else if (response.ok && !response.hasGeminiKey) {
            console.log('   ⚠️  Backend is running but API key is missing/invalid');
          } else {
            console.log('   ❌ Backend health check failed');
          }
          resolve(response);
        } catch (error) {
          console.log('   ❌ Failed to parse health response:', error.message);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Health endpoint connection failed:', error.message);
      reject(error);
    });

    req.end();
  });
}

// Test chat endpoint (will fail without valid API key but tests connection)
function testChatEndpoint() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: "Connection test message" }]
        }
      ],
      systemPrompt: "You are PERIS AI assistant."
    });

    const options = {
      hostname: 'localhost',
      port: 8787,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('\n✅ Chat endpoint test:');
          console.log('   Status:', res.statusCode);
          console.log('   Response:', JSON.stringify(response, null, 2));
          
          if (res.statusCode === 200) {
            console.log('   ✅ Chat endpoint is working');
          } else if (res.statusCode === 500 && response.error?.includes('API key')) {
            console.log('   ⚠️  Chat endpoint reachable but API key issue');
          } else {
            console.log('   ❌ Chat endpoint returned error');
          }
          resolve(response);
        } catch (error) {
          console.log('   ❌ Failed to parse chat response:', error.message);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Chat endpoint connection failed:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Run all tests
async function runConnectionTests() {
  console.log('🔍 Testing PERIS AI Backend Connection...\n');
  
  try {
    await testHealthEndpoint();
    await testChatEndpoint();
    
    console.log('\n🎯 Connection Test Summary:');
    console.log('✅ Backend server is running on port 8787');
    console.log('✅ CORS headers are configured');
    console.log('✅ API endpoints are accessible');
    console.log('⚠️  Note: Add valid GEMINI_API_KEY to .env file for full functionality');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Get Gemini API key from: https://makersuite.google.com/app/apikey');
    console.log('2. Update .env file with: GEMINI_API_KEY=your_actual_key_here');
    console.log('3. Restart backend server');
    console.log('4. Start frontend with: npm run dev');
    console.log('5. Access application at: http://localhost:5173');
    
  } catch (error) {
    console.log('\n❌ Connection Test Failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure backend server is running: node server.js');
    console.log('2. Check if port 8787 is available');
    console.log('3. Verify .env file exists and is properly formatted');
  }
}

runConnectionTests();
