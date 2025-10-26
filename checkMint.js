require('dotenv').config();
const { Connection, PublicKey } = require('@solana/web3.js');
const { getMint } = require('@solana/spl-token');

async function checkMint() {
  try {
    const connection = new Connection(process.env.SOLANA_RPC_URL);
    const mintAddress = new PublicKey(process.env.SOLANA_MINT_ADDRESS.trim());

    console.log('Checking mint:', mintAddress.toString());

    const mintInfo = await getMint(connection, mintAddress);
    console.log('Mint info:', {
      address: mintAddress.toString(),
      decimals: mintInfo.decimals,
      supply: mintInfo.supply.toString(),
      freezeAuthority: mintInfo.freezeAuthority?.toString(),
      mintAuthority: mintInfo.mintAuthority?.toString(),
    });
  } catch (error) {
    console.error('Error checking mint:', error.message);
  }
}

checkMint();