require('dotenv').config();
const { transferTokens } = require('./transferTokens');

async function testPayment() {
  try {
    console.log('Testing token transfer...');
    console.log('SOLANA_PRIVATE_KEY from env:', process.env.SOLANA_PRIVATE_KEY ? 'SET' : 'NOT SET');
    console.log('SOLANA_PRIVATE_KEY starts with:', process.env.SOLANA_PRIVATE_KEY?.substring(0, 10));

    // Test with a small amount to the recipient wallet
    const recipientWallet = 'D6ys3Ds7e5tYyaQy8mHNBN6oX8XD1fBoBzvc592SryA3';
    const amount = 1; // Very small test amount (1 token)

    console.log(`Attempting to transfer ${amount} tokens to ${recipientWallet}`);

    await transferTokens(recipientWallet, amount);

    console.log('✅ Transfer successful!');
  } catch (error) {
    console.error('❌ Transfer failed:', error.message);
    console.error('Full error:', error);
  }
}

testPayment();