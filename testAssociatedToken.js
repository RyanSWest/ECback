require('dotenv').config();
const { getAssociatedTokenAddressForWallet, checkTokenAccountExists } = require('./transferTokens');

async function testAssociatedToken() {
  try {
    // Test with the sender's wallet (from the keypair)
    const testWallet = '5b9KB1X3uvuyetN6fh4RDKDRDt2pe67Etp6o83ZezKGw'; // Sender's public key
    const mintAddress = process.env.SOLANA_MINT_ADDRESS;

    console.log('Testing associated token address...');
    console.log('Wallet:', testWallet);
    console.log('Mint:', mintAddress);

    // Get associated token address
    const associatedAddress = await getAssociatedTokenAddressForWallet(testWallet, mintAddress);
    console.log('Associated Token Address:', associatedAddress);

    // Check if token account exists
    const accountInfo = await checkTokenAccountExists(testWallet, mintAddress);
    console.log('Token Account Info:', accountInfo);

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAssociatedToken();