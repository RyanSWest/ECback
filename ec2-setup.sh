#!/bin/bash

# EC2 Environment Variables Setup Script
# Run this on your EC2 instance to set up environment variables

echo "Setting up environment variables for Node.js application..."

# Set environment variables
export NODE_ENV=production
export PORT=3001

# PayPal Configuration
export PAYPAL_CLIENT_ID="AVyOCn4BnD-ozN3jSqnqLmpS5pra_kO94Kmo1dyd9Wn6sKJzuFcLorsJibkK8LZmzeyU572tZFNoKWgt"
export PAYPAL_CLIENT_SECRET="EBpqVBlsA9u71wau904nY_DPNv7jUP3n1nxCW6_cTLePzCUYJiP_jq-4oNdBp1jZ13F--IYDf1d1BQ1_"

# Solana Configuration
export SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
export SOLANA_PRIVATE_KEY="[18,167,186,70,52,140,204,35,218,211,248,42,202,68,7,18,239,104,219,111,190,201,22,183,170,72,118,140,182,154,50,123,68,45,229,38,65,198,117,50,8,214,191,253,28,71,54,163,22,25,195,182,251,65,167,76,109,139,94,41,120,17,4,92]"
export SOLANA_MINT_ADDRESS="E5fqgV1UpossDXRND77XyzeJdg2Q8dkopT3poa1pHrS6"
export SENDER_WALLET="42a5LPEXRGrLQrbkHqdHDtBtgWpGAmstMXVYP5FCM7AT"

# Frontend URL (update this to your actual frontend URL)
export FRONTEND_URL="http://localhost:5174"

# Make variables persistent across sessions (optional)
echo "To make these variables persistent, add them to your ~/.bashrc or create a .env file"
echo "Example .env file content:"
echo "NODE_ENV=production"
echo "PORT=3001"
echo "PAYPAL_CLIENT_ID=AVyOCn4BnD-ozN3jSqnqLmpS5pra_kO94Kmo1dyd9Wn6sKJzuFcLorsJibkK8LZmzeyU572tZFNoKWgt"
echo "PAYPAL_CLIENT_SECRET=EBpqVBlsA9u71wau904nY_DPNv7jUP3n1nxCW6_cTLePzCUYJiP_jq-4oNdBp1jZ13F--IYDf1d1BQ1_"
echo "SOLANA_RPC_URL=https://api.mainnet-beta.solana.com"
echo "SOLANA_PRIVATE_KEY=[18,167,186,70,52,140,204,35,218,211,248,42,202,68,7,18,239,104,219,111,190,201,22,183,170,72,118,140,182,154,50,123,68,45,229,38,65,198,117,50,8,214,191,253,28,71,54,163,22,25,195,182,251,65,167,76,109,139,94,41,120,17,4,92]"
echo "SOLANA_MINT_ADDRESS=E5fqgV1UpossDXRND77XyzeJdg2Q8dkopT3poa1pHrS6"
echo "SENDER_WALLET=42a5LPEXRGrLQrbkHqdHDtBtgWpGAmstMXVYP5FCM7AT"
echo "FRONTEND_URL=http://localhost:5174"

echo "Environment variables set successfully!"
echo "You can now run: node server.js"