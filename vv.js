

const array=[18,167,186,70,52,140,204,35,218,211,248,42,202,68,7,18,239,104,219,111,190,201,22,183,170,72,118,140,182,154,50,123,68,45,229,38,65,198,117,50,8,214,191,253,28,71,54,163,22,25,195,182,251,65,167,76,109,139,94,41,120,17,4,92]
 const buffer = Buffer.from(array);
//  console.log("YORollin in my 64??",array.length)
const base64 = buffer.toString('base64');
console.log(base64);
// console.log( "LEN",base64.length)
const otherKey ='5cz3qoeKmZca5zQfMRm3Y9ctxsYbirC3XC9BEFDWuSR64oqp6AJmVgXkkPNj9ECgUuU8deT3UHptxQWmU1v47avf'
const base642 = "Eqe6RjSMzCPa0/gqykQHEu9o22++yRa3qkh2jLaaMntELeUmQcZ1MgjWv/0cRzajFhnDtvtBp0xti14peBEEXA==";
const buffer2 = Buffer.from(base64, 'base64');
const fuckoff = Buffer.from(otherKey, 'base64')
const { Keypair } = require('@solana/web3.js');
const keypair = Keypair.fromSecretKey(buffer);
console.log(keypair.publicKey.toString());

console.log("FUCKOFF",fuckoff.length, fuckoff)
const Bitch =checkTokenAccountExists('42a5LPEXRGrLQrbkHqdHDtBtgWpGAmstMXVYP5FCM7AT', mintie)
console.log(Bitch)