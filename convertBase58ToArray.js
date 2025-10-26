require('dotenv').config();
const bs58 = require('bs58');

try {
  // Get the base58 private key from env
  const base58PrivateKey = process.env.SOL_SECRET_KEY1;
  if (!base58PrivateKey) {
    console.log('SOL_SECRET_KEY1 not found in .env');
    console.log('Please add SOL_SECRET_KEY1=your_base58_private_key to .env');
    return;
  }

  console.log('Converting base58 private key to array format...');
  console.log('Base58 key:', base58PrivateKey);

  // Decode from base58 to bytes
  const secretKeyBytes = bs58.decode(base58PrivateKey);

  // Convert to array format
  const secretKeyArray = Array.from(secretKeyBytes);

  console.log('Array format:', JSON.stringify(secretKeyArray));

  // Verify by deriving the public key
  const { Keypair } = require('@solana/web3.js');
  const keypair = Keypair.fromSecretKey(secretKeyBytes);
  console.log('Derived public key:', keypair.publicKey.toString());

  console.log('\nTo use this key, update your .env file:');
  console.log('SOLANA_PRIVATE_KEY=' + JSON.stringify(secretKeyArray));

} catch (error) {
  console.error('Error:', error.message);
  console.log('Make sure bs58 is installed: npm install bs58');
}