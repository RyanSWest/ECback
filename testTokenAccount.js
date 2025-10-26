require('dotenv').config();

const { checkTokenAccountExists } = require('./transferTokens');

async function testCheckTokenAccount() {
  try {
    // Use the wallet address that has the tokens (the correct sender wallet)
    const walletAddress = process.env.SOLANA_WALLET_WITH_TOKENS || '42a5LPEXRGrLQrbkHqdHDtBtgWpGAmstMXVYP5FCM7AT'; // Check the correct sender wallet

    // Mint address from environment
    const mintAddress = process.env.SOLANA_MINT_ADDRESS;

    if (!mintAddress) {
      throw new Error('SOLANA_MINT_ADDRESS not found in .env');
    }

    console.log('Checking token account for wallet:', walletAddress);
    console.log('Mint Address:', mintAddress);

    const result = await checkTokenAccountExists(walletAddress, mintAddress, 'Sender');

    console.log('Token Account Check Result:');
    console.log('- Exists:', result.exists);
    console.log('- Address:', result.address);
    console.log('- Balance:', result.balance);

    if (!result.exists) {
      console.log('⚠️  Token account does not exist. You need to create it before transferring tokens.');
    } else {
      console.log('✅ Token account exists and has balance:', result.balance);
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testCheckTokenAccount();