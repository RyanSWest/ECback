require('dotenv').config();
const { Keypair } = require('@solana/web3.js');

try {
  let keypair;
  const privateKey = process.env.SOLANA_PRIVATE_KEY;

  if (privateKey.startsWith('[')) {
    // Array format
    const secretKeyArray = JSON.parse(privateKey);
    keypair = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));
  } else {
    // Base58 format - use the bs58.default
    const bs58 = require('bs58').default;
    const secretKey = bs58.decode(privateKey);
    keypair = Keypair.fromSecretKey(secretKey);
  }

  const publicKey = keypair.publicKey;
  console.log('Sender Wallet Public Key:', publicKey.toString());
} catch (error) {
  console.error('Error deriving public key:', error.message);
}