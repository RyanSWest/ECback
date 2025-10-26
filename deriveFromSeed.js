require('dotenv').config();
const { Keypair } = require('@solana/web3.js');
const bip39 = require('bip39');
const { derivePath } = require('ed25519-hd-key');

async function deriveWalletFromSeed() {
  try {
    // You'll need to provide your 12-word or 24-word recovery phrase
    const mnemonic = process.env.MNEMONIC || 'your recovery phrase here';

    if (mnemonic === 'your recovery phrase here') {
      console.log('Please set MNEMONIC in your .env file with your 12 or 24 word recovery phrase');
      return;
    }

    console.log('Deriving wallet from recovery phrase...');

    // Convert mnemonic to seed
    const seed = await bip39.mnemonicToSeed(mnemonic);

    // Check if this matches the wallet with tokens
    const walletWithTokens = '42a5LPEXRGrLQrbkHqdHDtBtgWpGAmstMXVYP5FCM7AT';

    // Try different derivation paths - Phantom uses m/44'/501'/account'/0'/0'
    const paths = [
      "m/44'/501'/0'/0'/0'",  // Account 1 (index 0)
      "m/44'/501'/1'/0'/0'",  // Account 2 (index 1)
      "m/44'/501'/2'/0'/0'",  // Account 3 (index 2)
      "m/44'/501'/3'/0'/0'",  // Account 4 (index 3)
      "m/44'/501'/0'/0'",     // Alternative format
      "m/44'/501'/1'/0'",     // Alternative format
      "m/44'/501'/2'/0'",     // Alternative format
    ];

    for (const path of paths) {
      console.log(`Trying path: ${path}`);
      const derivedSeed = derivePath(path, seed.toString('hex')).key;
      const keypair = Keypair.fromSeed(derivedSeed);

      console.log(`  Public key: ${keypair.publicKey.toString()}`);

      if (keypair.publicKey.toString() === walletWithTokens) {
        console.log('✅ Found matching wallet!');
        const secretKeyArray = Array.from(keypair.secretKey);
        console.log('Secret key array:', JSON.stringify(secretKeyArray));
        console.log('Update your .env with: SOLANA_PRIVATE_KEY=' + JSON.stringify(secretKeyArray));
        return;
      }
    }

    console.log('❌ None of the derived wallets match the one with tokens.');
    console.log('Expected wallet:', walletWithTokens);
    console.log('You may need to try different derivation paths or check your recovery phrase.');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

deriveWalletFromSeed();