require('dotenv').config();

const paypal = require('@paypal/checkout-server-sdk');

console.log('Testing PayPal connection...');
console.log('Client ID exists:', !!process.env.PAYPAL_CLIENT_ID);
console.log('Client Secret exists:', !!process.env.PAYPAL_CLIENT_SECRET);

// PayPal client setup
function paypalClient() {
  const environment = process.env.NODE_ENV === 'production'
    ? new paypal.core.LiveEnvironment(
        process.env.PAYPAL_CLIENT_ID,
        process.env.PAYPAL_CLIENT_SECRET
      )
    : new paypal.core.SandboxEnvironment(
        process.env.PAYPAL_CLIENT_ID,
        process.env.PAYPAL_CLIENT_SECRET
      );

  return new paypal.core.PayPalHttpClient(environment);
}

async function test() {
  try {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: '10.00'
        }
      }]
    });

    const order = await paypalClient().execute(request);
    console.log('SUCCESS! PayPal order created:', order.result.id);
  } catch (error) {
    console.error('ERROR:', error.message);
    console.error('Error type:', error.type);
  }
}

test();

