const express = require('express');
const router = express.Router();

const { transferTokens } = require('../transferTokens');
const { Connection, PublicKey } = require('@solana/web3.js');
 
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const YOUR_WALLET = '42a5LPEXRGrLQrbkHqdHDtBtgWpGAmstMXVYP5FCM7AT';
const TOKEN_PRICE_USD = 0.015;

router.post('/verify-and-transfer', async (req, res) => {
  console.log('USDC verify-and-transfer called');
  
  try {
    const { signature, buyerWallet, usdAmount } = req.body;
    
    if (!signature || !buyerWallet || !usdAmount) {
      return res.status(400).json({ 
        error: 'Missing required fields: signature, buyerWallet, usdAmount' 
      });
    }

    console.log('Verifying USDC payment:', { signature, buyerWallet, usdAmount });

    const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
    
    const tx = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0
    });

    if (!tx) {
      return res.status(400).json({ error: 'Transaction not found' });
    }

    if (!tx.meta || tx.meta.err) {
      return res.status(400).json({ error: 'Transaction failed on chain' });
    }

    console.log('Transaction found and successful');

    const preBalances = tx.meta.preTokenBalances || [];
    const postBalances = tx.meta.postTokenBalances || [];
    
    let usdcReceived = 0;
    let validTransfer = false;

    for (let i = 0; i < postBalances.length; i++) {
      const post = postBalances[i];
      const pre = preBalances.find(p => p.accountIndex === post.accountIndex);
      
      if (post.mint === USDC_MINT) {
        const owner = post.owner;
        
        if (owner === YOUR_WALLET) {
          const preAmount = pre ? parseFloat(pre.uiTokenAmount.uiAmount) : 0;
          const postAmount = parseFloat(post.uiTokenAmount.uiAmount);
          const received = postAmount - preAmount;
          
          if (received > 0) {
            usdcReceived = received;
            validTransfer = true;
            console.log(`USDC received: ${received}`);
            break;
          }
        }
      }
    }

    if (!validTransfer) {
      return res.status(400).json({ 
        error: 'No valid USDC transfer to your wallet found in this transaction' 
      });
    }

    const expectedAmount = parseFloat(usdAmount);
    const tolerance = expectedAmount * 0.01;
    
    if (Math.abs(usdcReceived - expectedAmount) > tolerance) {
      return res.status(400).json({ 
        error: `Amount mismatch. Expected ${expectedAmount} USDC, received ${usdcReceived} USDC` 
      });
    }

    console.log('Payment verified! Transferring tokens...');

    const tokensToSend = Math.floor(usdAmount / TOKEN_PRICE_USD);
    
    const transferSignature = await transferTokens(buyerWallet, tokensToSend);
    
    console.log('Tokens transferred successfully:', transferSignature);

    res.json({
      success: true,
      status: 'succeeded',
      tokensTransferred: tokensToSend,
      transferSignature: transferSignature,
      usdcReceived: usdcReceived
    });

  } catch (error) {
    console.error('USDC verification error:', error);
    res.status(500).json({ 
      error: error.message || 'Payment verification failed',
      details: error.toString()
    });
  }
});

router.get('/config', (req, res) => {
  res.json({
    usdcMint: USDC_MINT,
    receiverWallet: YOUR_WALLET,
    tokenPriceUSD: TOKEN_PRICE_USD,
    network: 'mainnet-beta'
  });
});

module.exports = router;