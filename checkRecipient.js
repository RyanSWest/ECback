require('dotenv').config();
const { checkTokenAccountExists } = require('./transferTokens');

async function checkRecipient() {
  try {
    const recipientWallet = 'D6ys3Ds7e5tYyaQy8mHNBN6oX8XD1fBoBzvc592SryA3';
    console.log('Recipient wallet:', recipientWallet);
    console.log('Mint address:', process.env.SOLANA_MINT_ADDRESS);

    const result = await checkTokenAccountExists(recipientWallet, process.env.SOLANA_MINT_ADDRESS, 'recipient');
    console.log('Recipient token account info:', result);

    if (result.exists) {
      console.log('Recipient has balance:', result.balance);
    } else {
      console.log('Recipient token account does not exist - will be created during transfer');
    }
  } catch (error) {
    console.error('Error checking recipient:', error.message);
  }
}

checkRecipient();