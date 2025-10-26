require('dotenv').config();

// Use the existing SOL_SECRET_KEY1 from .env
const base58PrivateKey = process.env.SOL_SECRET_KEY1;

if (base58PrivateKey === 'paste_your_base58_private_key_here') {
  console.log('Please set PRIVATE_KEY_BASE58 in your .env file with your base58 private key');
  console.log('Example: PRIVATE_KEY_BASE58=your_base58_key_here');
  process.exit(1);
}

try {
  // Simple base58 to array conversion (without external libraries)
  const base58Chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

  function base58ToArray(base58) {
    let num = 0n;
    for (let i = 0; i < base58.length; i++) {
      const char = base58[i];
      const index = base58Chars.indexOf(char);
      if (index === -1) throw new Error('Invalid base58 character');
      num = num * 58n + BigInt(index);
    }

    // Convert to byte array
    const bytes = [];
    while (num > 0n) {
      bytes.unshift(Number(num % 256n));
      num = num / 256n;
    }

    // Pad to 64 bytes for Solana private key
    while (bytes.length < 64) {
      bytes.unshift(0);
    }

    return bytes.slice(-64); // Take last 64 bytes
  }

  const privateKeyArray = base58ToArray(base58PrivateKey);
  console.log('Private key array format:');
  console.log(JSON.stringify(privateKeyArray));

  // Verify by deriving public key
  const { Keypair } = require('@solana/web3.js');
  const keypair = Keypair.fromSecretKey(Uint8Array.from(privateKeyArray));
  console.log('Derived public key:', keypair.publicKey.toString());

  console.log('\nTo use this key, update your .env file:');
  console.log('SOLANA_PRIVATE_KEY=' + JSON.stringify(privateKeyArray));

} catch (error) {
  console.error('Error converting key:', error.message);
  console.log('Make sure your base58 private key is correct');
}