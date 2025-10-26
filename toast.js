const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const b58 = require('bs58').default;
const connection = new Connection('https://api.mainnet-beta.solana.com');
const owner = new PublicKey('42a5LPEXRGrLQrbkHqdHDtBtgWpGAmstMXVYP5FCM7AT'); // your wallet address
const mint = new PublicKey('E5fqgV1UpossDXRND77XyzeJdg2Q8dkopT3poa1pHrS6'); // your token mint address

const newkey = b58.decode(process.env.SOLANA_PRIVATE_KEY);
const senderKey = Keypair.fromSecretKey(newkey);

(async () => {
  try {
    const tokenAccounts = await connection.getTokenAccountsByOwner(
      owner,
      {
        mint: mint,
        programId: TOKEN_PROGRAM_ID,
      }
    );
    console.log('tokenAccounts', tokenAccounts);
  } catch (err) {
    console.error('Failed to fetch token accounts', err);
  }
})();

// tokenAccounts.value.length === 0 means no ATA; >0 means ATA exists