require('dotenv').config();
const { transferTokens } = require('./transferTokens');

async function testTransferTokens() {
  console.log('🧪 Testing transferTokens function...');

  try {
    // Test 1: Valid transfer with small amount
    console.log('\n📤 Test 1: Valid transfer (0.1 tokens)');
    const recipientWallet = 'D6ys3Ds7e5tYyaQy8mHNBN6oX8XD1fBoBzvc592SryA3';
    const amount = 0.1; // Very small test amount

    console.log(`Transferring ${amount} tokens to ${recipientWallet}`);

    const tx = await transferTokens(recipientWallet, amount);
    console.log('✅ Transfer successful! Transaction:', tx);

  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
  }

  try {
    // Test 2: Invalid recipient address
    console.log('\n📤 Test 2: Invalid recipient address');
    const invalidRecipient = 'invalid-address';
    const amount = 0.01;

    console.log(`Attempting transfer to invalid address: ${invalidRecipient}`);
    await transferTokens(invalidRecipient, amount);

  } catch (error) {
    console.log('✅ Test 2 passed - correctly caught invalid address:', error.message);
  }

  try {
    // Test 3: Zero amount
    console.log('\n📤 Test 3: Zero amount transfer');
    const recipientWallet = 'D6ys3Ds7e5tYyaQy8mHNBN6oX8XD1fBoBzvc592SryA3';
    const amount = 0;

    console.log(`Attempting transfer of ${amount} tokens`);
    await transferTokens(recipientWallet, amount);

  } catch (error) {
    console.log('✅ Test 3 passed - correctly handled zero amount:', error.message);
  }

  console.log('\n🎉 transferTokens testing completed!');
}

testTransferTokens();