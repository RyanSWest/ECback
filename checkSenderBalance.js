require('dotenv').config();
const { checkTokenAccountExists } = require('./transferTokens');

async function checkSenderBalance() {
  try {
    // Get sender public key from private key
    const { Keypair } = require('@solana/web3.js');
    const bs58 = require('bs58').default;
    const secretKey = bs58.decode(process.env.SOLANA_PRIVATE_KEY);
    const senderKeypair = Keypair.fromSecretKey(secretKey);
    const senderPublicKey = senderKeypair.publicKey.toString();

    console.log('Sender public key:', senderPublicKey);
    console.log('Mint address:', process.env.SOLANA_MINT_ADDRESS);

    const result = await checkTokenAccountExists(senderPublicKey, process.env.SOLANA_MINT_ADDRESS, 'sender');
    console.log('Sender token account info:', result);

    if (result.exists) {
      console.log('Sender has balance:', result.balance);
    } else {
      console.log('Sender token account does not exist');
    }
  } catch (error) {
    console.error('Error checking sender balance:', error.message);
  }
}

checkSenderBalance();