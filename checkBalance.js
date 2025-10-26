require('dotenv').config();
const { Connection, PublicKey, Keypair } = require('@solana/web3.js');

async function checkSolBalance() {
  try {
    let keypair;
    const privateKey = process.env.SOLANA_PRIVATE_KEY;

    if (privateKey.startsWith('[')) {
      // Array format
      const secretKeyArray = JSON.parse(privateKey);
      keypair = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));
    } else {
      // Base58 format
      const bs58 = require('bs58').default;
      const secretKey = bs58.decode(privateKey);
      keypair = Keypair.fromSecretKey(secretKey);
    }

    const publicKey = keypair.publicKey;

    console.log('Sender Wallet Public Key:', publicKey.toString());

    const connection = new Connection(process.env.SOLANA_RPC_URL);
    const balance = await connection.getBalance(publicKey);
    const balanceInSOL = balance / 1e9; // Convert lamports to SOL

    console.log('SOL Balance:', balanceInSOL, 'SOL');
    console.log('Lamports:', balance);

    if (balance < 2000000) { // Minimum for token account creation
      console.log('⚠️  Insufficient SOL for token account creation. Need at least ~0.002 SOL.');
    } else {
      console.log('✅ Sufficient SOL for token account operations.');
    }
  } catch (error) {
    console.error('Error checking balance:', error.message);
  }
}

checkSolBalance();