const axios = require('axios');

// Test PayPal functions
async function testPaypal() {
  const baseURL = 'http://localhost:3001'; // Local server

  try {
    console.log('Testing PayPal order creation...');

    // Test 1: Create PayPal order
    const createOrderResponse = await axios.post(`${baseURL}/api/paypal/create-order`, {
      amount: 10.00, // $10.00
      buyerWallet: '42a5LPEXRGrLQrbkHqdHDtBtgWpGAmstMXVYP5FCM7AT' // Receiver wallet address
    });

    console.log('Create Order Response:', createOrderResponse.data);

    const orderId = createOrderResponse.data.orderId;
    const approvalUrl = createOrderResponse.data.approvalUrl;

    console.log('Order ID:', orderId);
    console.log('Approval URL:', approvalUrl);

    // Note: In a real test, you would need to simulate the PayPal approval process
    // For now, we'll just test the creation endpoint

    console.log('PayPal order creation test completed successfully!');

    // Test 2: Attempt to capture an order (this will fail without proper approval, but tests the endpoint)
    console.log('\nTesting PayPal order capture (expected to fail without approval)...');

    try {
      const captureResponse = await axios.post(`${baseURL}/api/paypal/capture-order`, {
        orderId: orderId
      });

      console.log('Capture Response:', captureResponse.data);
    } catch (captureError) {
      console.log('Capture failed as expected:', captureError.response?.data || captureError.message);
    }

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

// Run the test
if (require.main === module) {
  testPaypal();
}

module.exports = { testPaypal };