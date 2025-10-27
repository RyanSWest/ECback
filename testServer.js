const axios = require('axios');

// Base URL for the server - change this to your EC2 instance URL when deployed
// const BASE_URL = 'http://localhost:3001'; // For local testing
const BASE_URL = 'http://3.14.126.44:3001'; // For EC2 testing

async function testEndpoint(method, url, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    console.log(`✅ ${method} ${url} - Status: ${response.status}`);
    console.log('Response:', response.data);
    return response.data;
  } catch (error) {
    console.log(`❌ ${method} ${url} - Error: ${error.response?.status || 'Network Error'}`);
    if (error.response?.data) {
      console.log('Error Response:', error.response.data);
    }
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting Amazon EC2 Endpoints Test Suite\n');

  let authToken = null;

  // Test basic server health
  console.log('1. Testing server health...');
  await testEndpoint('GET', '/');

  // Test user registration
  console.log('\n2. Testing user registration...');
  const registerData = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'testpassword123'
  };
  const registerResult = await testEndpoint('POST', '/api/register', registerData);
  if (registerResult?.token) {
    authToken = registerResult.token;
  }

  // Test user login
  console.log('\n3. Testing user login...');
  const loginData = {
    email: 'test@example.com',
    password: 'testpassword123'
  };
  const loginResult = await testEndpoint('POST', '/api/login', loginData);
  if (loginResult?.token) {
    authToken = loginResult.token;
  }

  // Test auth verification
  if (authToken) {
    console.log('\n4. Testing auth verification...');
    await testEndpoint('GET', '/api/auth/verify', null, {
      'Authorization': `Bearer ${authToken}`
    });

    // Test logout
    console.log('\n5. Testing logout...');
    await testEndpoint('POST', '/api/auth/logout', null, {
      'Authorization': `Bearer ${authToken}`
    });
  }

  // Test get all users
  console.log('\n6. Testing get users...');
  await testEndpoint('GET', '/api/users');

  // Test gallery endpoints
  console.log('\n7. Testing gallery endpoints...');
  await testEndpoint('GET', '/api/gallery/all');

  // Test USDC config
  console.log('\n8. Testing USDC config...');
  await testEndpoint('GET', '/api/usdc/config');

  // Test USDC verify and transfer (requires valid signature)
  console.log('\n9. Testing USDC verify and transfer...');
  const usdcData = {
    signature: 'test_signature', // Replace with real signature for actual testing
    buyerWallet: '42a5LPEXRGrLQrbkHqdHDtBtgWpGAmstMXVYP5FCM7AT',
    usdAmount: '10.00'
  };
  await testEndpoint('POST', '/api/usdc/verify-and-transfer', usdcData);

  // Test PayPal routes (basic check - actual PayPal testing requires proper setup)
  console.log('\n10. Testing PayPal routes availability...');
  try {
    // Test PayPal create-order endpoint
    const paypalTestData = {
      amount: 10.00,
      buyerWallet: '42a5LPEXRGrLQrbkHqdHDtBtgWpGAmstMXVYP5FCM7AT'
    };
    await testEndpoint('POST', '/api/paypal/create-order', paypalTestData);
  } catch (error) {
    console.log('❌ PayPal routes test failed or not available');
  }

  console.log('\n🎉 Test suite completed!');
  console.log('\n📝 Notes:');
  console.log('- For USDC testing, provide real Solana transaction signatures');
  console.log('- For EC2 deployment, update BASE_URL to your instance IP');
  console.log('- Ensure security groups allow inbound traffic on port 3001');
}

// Run the tests
runTests().catch(console.error);