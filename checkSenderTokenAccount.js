require('dotenv').config();
const { checkTokenAccountExists } = require('./transferTokens');

async function checkSenderTokenAccount() {
  try {
    let keypair;
    const privateKey = process.env.SOLANA_PRIVATE_KEY;
    const { Keypair } = require('@solana/web3.js');

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

    const senderWallet = keypair.publicKey.toString();

    const mintAddress = process.env.SOLANA_MINT_ADDRESS;

    console.log('Checking sender token account...');
    console.log('Sender Wallet:', senderWallet);
    console.log('Mint Address:', mintAddress);

    const result = await checkTokenAccountExists(senderWallet, mintAddress, 'Sender');

    console.log('Token Account Check Result:');
    console.log('- Exists:', result.exists);
    console.log('- Address:', result.address);
    console.log('- Balance:', result.balance);

    if (!result.exists) {
      console.log('⚠️  Sender token account does not exist. This is why the transfer is failing.');
      console.log('You need to create the token account for the sender wallet first.');
    } else {
      console.log('✅ Sender token account exists.');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkSenderTokenAccount();