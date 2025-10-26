const express = require('express');
const paypal = require('@paypal/checkout-server-sdk');
const { transferTokens } = require('./transferTokens');

const router = express.Router();

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

// Create PayPal order
router.post('/create-order', async (req, res) => {
  try {
    const { amount, buyerWallet } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!buyerWallet) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    console.log('Creating PayPal order for:', { amount, buyerWallet });

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: amount.toFixed(2)
        }
      }],
      application_context: {
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:5174'}/success`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5174'}/cancel`
      }
    });

    const order = await paypalClient().execute(request);

    // Store buyerWallet in metadata (using custom_id)
    order.result.purchase_units[0].custom_id = buyerWallet;

    console.log('PayPal order created:', order.result.id);

    res.json({
      orderId: order.result.id,
      approvalUrl: order.result.links.find(link => link.rel === 'approve').href
    });
  } catch (error) {
    console.error('Create PayPal order error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Capture PayPal order
router.post('/capture-order', async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID required' });
    }

    console.log('Capturing PayPal order:', orderId);

    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    const capture = await paypalClient().execute(request);

    console.log('PayPal order captured. Status:', capture.result.status);

    if (capture.result.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Get wallet from custom_id
    const buyerWallet = capture.result.purchase_units[0].custom_id;

    if (!buyerWallet) {
      console.error('No buyerWallet in custom_id');
      return res.status(400).json({ error: 'Wallet address not found in order' });
    }

    // Calculate tokens (same logic as Stripe: $0.015 per token)
    const usdAmount = parseFloat(capture.result.purchase_units[0].amount.value);
    const tokensToSend = Math.floor(usdAmount / 0.015);

    console.log('Transferring tokens:', { buyerWallet, tokensToSend, usdAmount });

    // Transfer tokens
    try {
      await transferTokens(buyerWallet, tokensToSend);
      console.log('Tokens transferred successfully');
    } catch (transferError) {
      console.error('Token transfer failed:', transferError.message);
      throw new Error('Token transfer failed: ' + transferError.message);
    }

    res.json({
      status: 'COMPLETED',
      amount: usdAmount,
      tokens: tokensToSend,
      wallet: buyerWallet
    });

  } catch (error) {
    console.error('Capture PayPal order error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;