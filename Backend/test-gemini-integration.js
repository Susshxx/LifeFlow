/**
 * Test script for Gemini API integration
 * Run with: node test-gemini-integration.js
 */

const API_URL = 'http://localhost:5000';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

// Test 1: Chatbot Assistant
async function testChatbot() {
  log(colors.blue, '\n━━━ TEST 1: LifeFlow Assistant Chatbot ━━━');
  
  const testMessages = [
    'How do I donate blood?',
    'Am I eligible to donate?',
    'Find nearest blood bank',
    'Emergency blood request',
    'What is blood donation?',
  ];

  for (const message of testMessages) {
    try {
      log(colors.yellow, `\n📤 User: ${message}`);
      
      const response = await fetch(`${API_URL}/api/gemini/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      log(colors.green, `✅ Bot: ${data.response}`);
    } catch (error) {
      log(colors.red, `❌ Error: ${error.message}`);
    }
  }
}

// Test 2: Hate Speech Detection
async function testHateSpeech() {
  log(colors.blue, '\n━━━ TEST 2: Hate Speech Detection ━━━');
  
  const testCases = [
    { text: 'Hello, how are you?', expected: false },
    { text: 'I want to donate blood', expected: false },
    { text: 'You are an idiot', expected: true },
    { text: 'Shut up you stupid fool', expected: true },
    { text: 'Thank you for your help!', expected: false },
    { text: 'I hate you, go die', expected: true },
  ];

  for (const testCase of testCases) {
    try {
      log(colors.yellow, `\n📝 Testing: "${testCase.text}"`);
      
      const response = await fetch(`${API_URL}/api/gemini/detect-hate-speech`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: testCase.text }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const passed = data.isHateSpeech === testCase.expected;
      
      if (passed) {
        log(colors.green, `✅ Correct: isHateSpeech=${data.isHateSpeech}, severity=${data.severity}`);
        if (data.reason) log(colors.green, `   Reason: ${data.reason}`);
      } else {
        log(colors.red, `❌ Failed: Expected ${testCase.expected}, got ${data.isHateSpeech}`);
      }
    } catch (error) {
      log(colors.red, `❌ Error: ${error.message}`);
    }
  }
}

// Test 3: Error Handling
async function testErrorHandling() {
  log(colors.blue, '\n━━━ TEST 3: Error Handling ━━━');
  
  // Test empty message
  try {
    log(colors.yellow, '\n📤 Testing empty message...');
    const response = await fetch(`${API_URL}/api/gemini/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '' }),
    });
    
    if (response.status === 400) {
      log(colors.green, '✅ Correctly rejected empty message');
    } else {
      log(colors.red, `❌ Expected status 400, got ${response.status}`);
    }
  } catch (error) {
    log(colors.red, `❌ Error: ${error.message}`);
  }

  // Test missing message field
  try {
    log(colors.yellow, '\n📤 Testing missing message field...');
    const response = await fetch(`${API_URL}/api/gemini/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    
    if (response.status === 400) {
      log(colors.green, '✅ Correctly rejected missing message field');
    } else {
      log(colors.red, `❌ Expected status 400, got ${response.status}`);
    }
  } catch (error) {
    log(colors.red, `❌ Error: ${error.message}`);
  }
}

// Run all tests
async function runTests() {
  log(colors.blue, '\n╔════════════════════════════════════════╗');
  log(colors.blue, '║   GEMINI API INTEGRATION TEST SUITE   ║');
  log(colors.blue, '╚════════════════════════════════════════╝');
  
  try {
    await testChatbot();
    await testHateSpeech();
    await testErrorHandling();
    
    log(colors.green, '\n✅ All tests completed!');
    log(colors.blue, '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    log(colors.red, `\n❌ Test suite failed: ${error.message}\n`);
  }
}

// Check if server is running before running tests
async function checkServer() {
  try {
    const response = await fetch(`${API_URL}/api/health`);
    if (response.ok) {
      log(colors.green, '✅ Backend server is running\n');
      return true;
    }
  } catch (error) {
    log(colors.red, '❌ Backend server is not running!');
    log(colors.yellow, '   Please start the server with: node server.js\n');
    return false;
  }
}

// Main execution
(async () => {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await runTests();
  }
})();
