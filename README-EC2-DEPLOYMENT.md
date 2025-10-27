# EC2 Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Upload Files to EC2
```bash
# From your local machine, upload the App directory to EC2
scp -r App/* ec2-user@3.14.126.44:/home/ec2-user/app/
```

### 2. SSH to EC2 and Run Deployment
```bash
# Connect to your EC2 instance
ssh ec2-user@3.14.126.44

# Navigate to app directory
cd /home/ec2-user/app

# Make scripts executable and run deployment
chmod +x deploy-to-ec2.sh ec2-setup.sh
./deploy-to-ec2.sh
```

### 3. Verify Deployment
```bash
# Check if app is running
pm2 status

# View app logs
pm2 logs backend-app

# Test endpoints
curl http://localhost:3001/
```

## 📁 Files Created for EC2 Deployment

### `.env.ec2`
- Environment variables file specifically for EC2 production deployment
- Contains all necessary PayPal, Solana, and app configuration

### `ec2-setup.sh`
- Sets up environment variables on EC2 instance
- Can be run manually or automatically by deployment script

### `deploy-to-ec2.sh`
- Complete deployment automation script
- Installs Node.js, PM2, dependencies
- Configures environment and starts the application

### `testServer.js`
- Comprehensive endpoint testing suite
- Tests all API endpoints including PayPal and USDC
- Run locally to test EC2 endpoints: `node testServer.js`

## 🔧 Manual Environment Setup (Alternative)

If you prefer manual setup instead of using the scripts:

```bash
# On EC2 instance
export NODE_ENV=production
export PORT=3001
export PAYPAL_CLIENT_ID="AVyOCn4BnD-ozN3jSqnqLmpS5pra_kO94Kmo1dyd9Wn6sKJzuFcLorsJibkK8LZmzeyU572tZFNoKWgt"
export PAYPAL_CLIENT_SECRET="EBpqVBlsA9u71wau904nY_DPNv7jUP3n1nxCW6_cTLePzCUYJiP_jq-4oNdBp1jZ13F--IYDf1d1BQ1_"
export SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
export SOLANA_PRIVATE_KEY="[18,167,186,70,52,140,204,35,218,211,248,42,202,68,7,18,239,104,219,111,190,201,22,183,170,72,118,140,182,154,50,123,68,45,229,38,65,198,117,50,8,214,191,253,28,71,54,163,22,25,195,182,251,65,167,76,109,139,94,41,120,17,4,92]"
export SOLANA_MINT_ADDRESS="E5fqgV1UpossDXRND77XyzeJdg2Q8dkopT3poa1pHrS6"
export SENDER_WALLET="42a5LPEXRGrLQrbkHqdHDtBtgWpGAmstMXVYP5FCM7AT"
export FRONTEND_URL="http://localhost:5174"
```

## 🧪 Testing Your EC2 Deployment

### Run the Test Suite
```bash
# From your local machine (not EC2)
cd App
node testServer.js
```

### Expected Results After Proper Setup:
- ✅ Server health check
- ✅ User management endpoints
- ✅ Gallery system
- ✅ USDC configuration
- ✅ PayPal order creation (after env vars)
- ✅ USDC verification (with real signatures)

## 📊 PM2 Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs backend-app

# Restart app
pm2 restart backend-app

# Stop app
pm2 stop backend-app

# Monitor resources
pm2 monit
```

## 🔒 Security Notes

- Ensure your EC2 security group allows inbound traffic on port 3001
- Consider using HTTPS in production (add SSL certificate)
- Regularly update Node.js and dependencies
- Monitor logs for any security issues

## 🆘 Troubleshooting

### PayPal Still Failing?
- Check that environment variables are set: `echo $PAYPAL_CLIENT_ID`
- Verify NODE_ENV is set to "production" for live PayPal
- Check PM2 logs: `pm2 logs backend-app`

### Port 3001 Not Accessible?
- Check security group rules in AWS EC2 console
- Verify app is running: `pm2 status`
- Check if another process is using port 3001: `netstat -tlnp | grep 3001`

### Database Issues?
- Ensure users.db file exists and has proper permissions
- Check SQLite logs in PM2 output