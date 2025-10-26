require('dotenv').config();
const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');

try {
  // Check the base58 private key
  const base58PrivateKey = process.env.SOL_SECRET_KEY1;
  if (!base58PrivateKey) {
    console.log('SOL_SECRET_KEY1 not found in .env');
    return;
  }

  console.log('Checking SOL_SECRET_KEY1 (base58):', base58PrivateKey);

  const secretKeyBytes = bs58.decode(base58PrivateKey);
  const keypair = Keypair.fromSecretKey(secretKeyBytes);
  const publicKey = keypair.publicKey;

  console.log('Wallet address from SOL_SECRET_KEY1:', publicKey.toString());

  // Check if this matches the wallet with tokens
  const walletWithTokens = '42a5LPEXRGrLQrbkHqdHDtBtgWpGAmstMXVYP5FCM7AT';
  if (publicKey.toString() === walletWithTokens) {
    console.log('✅ This base58 key corresponds to the wallet with tokens!');
    console.log('You should use this key instead of the array format.');
  } else {
    console.log('❌ This base58 key does NOT match the wallet with tokens.');
    console.log('Expected wallet:', walletWithTokens);
    console.log('This wallet:', publicKey.toString());
  }
} catch (error) {
  console.error('Error:', error.message);
}