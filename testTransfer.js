require('dotenv').config();
const { transferTokens } = require('./transferTokens');

async function testTransfer() {
  try {
    // Get recipient wallet and amount from command line arguments
    const recipientWallet = process.argv[2];
    const amount = parseFloat(process.argv[3]);

    if (!recipientWallet || !amount || amount <= 0) {
      console.log('Usage: node testTransfer.js <recipient_wallet> <amount>');
      console.log('Example: node testTransfer.js 11111111111111111111111111111112 1');
      return;
    }

    console.log('Testing token transfer...');
    console.log('Recipient:', recipientWallet);
    console.log('Amount:', amount);

    const result = await transferTokens(recipientWallet, amount);
    console.log('Transfer successful:', result);
  } catch (error) {
    console.error('Transfer failed:', error.message);
  }
}

testTransfer();