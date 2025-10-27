#!/bin/bash

# Deploy to EC2 Script
# This script helps deploy your Node.js application to EC2

echo "🚀 Starting EC2 deployment process..."

# Check if we're on EC2 or local
if [ -n "$EC2_INSTANCE_ID" ] || curl -s http://169.254.169.254/latest/meta-data/instance-id > /dev/null 2>&1; then
    echo "✅ Running on EC2 instance"
else
    echo "⚠️  This script is designed to run on EC2. For local testing, use the testServer.js instead."
    echo "To deploy to EC2:"
    echo "1. SCP this script to your EC2: scp deploy-to-ec2.sh ec2-user@your-ec2-ip:~/"
    echo "2. SSH to EC2: ssh ec2-user@your-ec2-ip"
    echo "3. Run: chmod +x deploy-to-ec2.sh && ./deploy-to-ec2.sh"
    exit 1
fi

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    sudo yum install -y nodejs
fi

# Install PM2 for process management
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi

# Create app directory
echo "📁 Creating application directory..."
sudo mkdir -p /var/app
sudo chown ec2-user:ec2-user /var/app

# Copy application files (assuming they're already uploaded)
# In real deployment, you'd use scp or git clone here
echo "📋 Application files should be uploaded to /var/app/"
echo "Example: scp -r App/* ec2-user@your-ec2-ip:/var/app/"

# Navigate to app directory
cd /var/app

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file
if [ -f ".env.ec2" ]; then
    echo "🔧 Setting up environment variables..."
    cp .env.ec2 .env
else
    echo "⚠️  .env.ec2 file not found. Please ensure environment variables are set."
fi

# Set proper permissions
chmod +x ec2-setup.sh
./ec2-setup.sh

# Start the application with PM2
echo "🚀 Starting application with PM2..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 start server.js --name "backend-app"
pm2 save
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ec2-user --hp /home/ec2-user

echo "✅ Deployment completed!"
echo ""
echo "📊 Check status: pm2 status"
echo "📜 View logs: pm2 logs backend-app"
echo "🔄 Restart: pm2 restart backend-app"
echo "🛑 Stop: pm2 stop backend-app"
echo ""
echo "🌐 Your app should be running on port 3001"
echo "Test it: curl http://localhost:3001/"