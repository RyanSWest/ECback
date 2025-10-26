const { Connection, PublicKey, Keypair, SendTransactionError } = require('@solana/web3.js');
const { transfer, getOrCreateAssociatedTokenAccount, getAssociatedTokenAddress, getAccount, getMint } = require('@solana/spl-token');
// const bs58 = require('bs58');

async function transferTokens(recipientWallet, amount) {
  console.log('transferTokens called with:', { recipientWallet, amount });

  // Create a timeout promise
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Transfer operation timed out after 30 seconds')), 30000);
  });

  // Wrap the main logic in a race with timeout
  return Promise.race([
    (async () => {
      // Try array format first, then fall back to base58 if available
      let arrKey;
      try {
        if (process.env.SOLANA_PRIVATE_KEY) {
          const privateKey = process.env.SOLANA_PRIVATE_KEY;
          if (privateKey.startsWith('[')) {
            // Array format
            const secretKeyArray = JSON.parse(privateKey);
            console.log("Using array format private key");
            arrKey = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));
          } else {
            // Base58 format
            const bs58 = require('bs58').default;
            const secretKey = bs58.decode(privateKey);
            console.log("Using base58 format private key");
            arrKey = Keypair.fromSecretKey(secretKey);
          }
        } else if (process.env.SOL_SECRET_KEY1) {
          console.log("Using base58 format private key from SOL_SECRET_KEY1");
          const bs58 = require('bs58').default;
          const secretKey = bs58.decode(process.env.SOL_SECRET_KEY1);
          arrKey = Keypair.fromSecretKey(secretKey);
        } else {
          throw new Error("No private key found in environment variables");
        }

        console.log("Sender public key:", arrKey.publicKey.toString());
      } catch (error) {
        console.error("Failed to load private key:", error.message);
        throw error;
      }

      console.log(  "THIS KEYPAIR???",arrKey)
      console.log("PUBES", arrKey.publicKey)

      try {
        if (!recipientWallet) {
          throw new Error('recipientWallet is undefined');
        }
        //  const secretKeyBytes = bs58.decode(process.env.SOLANA_PRIVATE_KEY);
        // const senderKeypair = Keypair.fromSecretKey(bs58.decode(process.env.SOL_SECRET_KEY2));

        console.log('Keypair created:', arrKey.publicKey.toString());

        // Debug logs - check environment variables early
        console.log('Mint address from env:', process.env.SOLANA_MINT_ADDRESS);
        console.log('Recipient wallet param:', recipientWallet);
        console.log('RPC URL:', process.env.SOLANA_RPC_URL);
        console.log("SECRET",process.env.SOLANA_PRIVATE_KEY);

        const connection = new Connection(process.env.SOLANA_RPC_URL);
        const mintAddress = new PublicKey(process.env.SOLANA_MINT_ADDRESS.trim());
        const recipient = new PublicKey(recipientWallet.trim());

        console.log('Mint address created:', mintAddress.toString());
        console.log('Recipient created:', recipient.toString());

        // Get or create the sender's token account
        console.log('Getting/creating sender token account...');
        let senderTokenAccount;
        try {
          senderTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            arrKey,
            mintAddress,
            arrKey.publicKey
          );
          console.log('Sender token account:', senderTokenAccount.address.toString());
          console.log('Sender token account balance:', senderTokenAccount.amount.toString());
        } catch (error) {
          console.error('Failed to get/create sender token account:', error.message);
          console.error('Full error details:', error);
          throw new Error('Sender token account creation failed: ' + error.message);
        }

        // Get or create the recipient's token account
        const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
          connection,
          arrKey,
          mintAddress,
          recipient
        );
        console.log('Recipient token account:', recipientTokenAccount.address.toString());

        // Check if sender has sufficient token balance
        const mintInfo = await getMint(connection, mintAddress);
        const decimals = mintInfo.decimals;
        const requiredAmount = amount * Math.pow(10, decimals);
        console.log(`Mint decimals: ${decimals}, Required amount: ${requiredAmount}, Available: ${senderTokenAccount.amount}`);
        if (senderTokenAccount.amount < requiredAmount) {
          throw new Error(`Insufficient token balance. Required: ${requiredAmount}, Available: ${senderTokenAccount.amount}`);
        }

        const tx = await transfer(
          connection,
          arrKey,
          senderTokenAccount.address,
          recipientTokenAccount.address,
          arrKey.publicKey,
          requiredAmount
        );

        console.log('Token transfer successful:', tx);
        return tx;
      } catch (error) {
        if (error instanceof SendTransactionError) {
          console.error('Transaction failed. Logs:', error.getLogs());
        }
        console.error('Token transfer failed:', error.message);
        console.error('Full error:', error);
        console.error('Error stack:', error.stack);
        throw error;
      }
    })(),
    timeoutPromise
  ]);
}

async function getAssociatedTokenAddressForWallet(walletAddress, mintAddress) {
  try {
    const connection = new Connection(process.env.SOLANA_RPC_URL);
    const mint = new PublicKey(mintAddress.trim());
    const wallet = new PublicKey(walletAddress.trim());

    const associatedTokenAddress = await getAssociatedTokenAddress(mint, wallet);
    console.log('Associated Token Address:', associatedTokenAddress.toString());
    return associatedTokenAddress.toString();
  } catch (error) {
    console.error('Error getting associated token address:', error.message);
    throw error;
  }
}

async function checkTokenAccountExists(walletAddress, mintAddress, walletType = 'wallet') {
  try {
    const connection = new Connection(process.env.SOLANA_RPC_URL);
    const mint = new PublicKey(mintAddress.trim());
    const wallet = new PublicKey(walletAddress.trim());

    const associatedTokenAddress = await getAssociatedTokenAddress(mint, wallet);

    try {
      const accountInfo = await getAccount(connection, associatedTokenAddress);
      console.log(`${walletType} token account exists:`, associatedTokenAddress.toString());
      console.log(`${walletType} balance:`, accountInfo.amount.toString());
      return { exists: true, address: associatedTokenAddress.toString(), balance: accountInfo.amount.toString() };
    } catch (error) {
      if (error.name === 'TokenAccountNotFoundError') {
        console.log(`${walletType} token account does not exist:`, associatedTokenAddress.toString());
        return { exists: false, address: associatedTokenAddress.toString(), balance: '0' };
      }
      throw error;
    }
  } catch (error) {
    console.error('Error checking token account:', error.message);
    throw error;
  }
}


module.exports = { transferTokens, getAssociatedTokenAddressForWallet, checkTokenAccountExists };