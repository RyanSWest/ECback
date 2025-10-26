require('dotenv').config();
const { Keypair } = require('@solana/web3.js');

try {
  const secretKeyArray = JSON.parse(process.env.SOLANA_PRIVATE_KEY);
  const keypair = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));
  const publicKey = keypair.publicKey;

  console.log('Current SOLANA_PRIVATE_KEY corresponds to wallet:', publicKey.toString());

  // Check if this matches the wallet with tokens
  const walletWithTokens = '42a5LPEXRGrLQrbkHqdHDtBtgWpGAmstMXVYP5FCM7AT';
  if (publicKey.toString() === walletWithTokens) {
    console.log('✅ This is the correct wallet that has the tokens!');
  } else {
    console.log('❌ This is NOT the wallet with tokens.');
    console.log('Expected wallet:', walletWithTokens);
    console.log('Current wallet:', publicKey.toString());
    console.log('You need to update SOLANA_PRIVATE_KEY in .env with the private key for wallet', walletWithTokens);
  }
} catch (error) {
  console.error('Error:', error.message);
}