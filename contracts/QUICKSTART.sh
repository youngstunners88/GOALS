#!/bin/bash

# $GOALS Protocol - Quick Start Script
# Interactive deployment guide for Base Sepolia

clear

echo "⚽ $GOALS Protocol - Quick Start"
echo "================================"
echo ""
echo "This script will guide you through deploying to Base Sepolia testnet"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}[Step $1]${NC} $2"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Step 1: Check Prerequisites
print_step "1" "Checking Prerequisites"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js not found. Please install Node.js 18+"
    exit 1
fi
print_success "Node.js found: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm not found. Please install npm"
    exit 1
fi
print_success "npm found: $(npm --version)"

# Check if in correct directory
if [ ! -f "package.json" ]; then
    print_error "Not in contracts directory. Please run from goals-protocol/contracts"
    exit 1
fi
print_success "In contracts directory"

echo ""

# Step 2: Install Dependencies
print_step "2" "Installing Dependencies"
echo ""

if [ ! -d "node_modules" ]; then
    echo "Installing packages... (this may take a minute)"
    npm install 2>&1 | tail -5
    print_success "Dependencies installed"
else
    print_success "Dependencies already installed"
fi

echo ""

# Step 3: Environment Setup
print_step "3" "Environment Setup"
echo ""

if [ ! -f ".env" ]; then
    print_warning ".env file not found"
    echo ""
    echo "Creating .env template..."
    
    cat > .env << 'EOF'
# $GOALS Protocol - Environment Configuration

# Your private key from MetaMask (Base Sepolia)
# WITHOUT 0x prefix, 64 characters
PRIVATE_KEY=your_private_key_here

# Optional: BaseScan API key for contract verification
# Get from: https://basescan.org/myapikey
BASESCAN_API_KEY=your_basescan_api_key_here

# RPC endpoints
BASE_SEPOLIA_RPC=https://sepolia.base.org
BASE_MAINNET_RPC=https://mainnet.base.org
EOF
    
    print_success "Created .env template"
    echo ""
    echo -e "${YELLOW}IMPORTANT:${NC} You need to edit .env and add your private key"
    echo ""
    echo "To get your private key:"
    echo "  1. Open MetaMask"
    echo "  2. Switch to Base Sepolia network"
    echo "  3. Click your account → Account Details"
    echo "  4. Click Export Private Key"
    echo "  5. Copy the key (64 characters)"
    echo ""
    echo "To get test ETH:"
    echo "  https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet"
    echo ""
    read -p "Press Enter after you've edited .env..."
    
    # Check if they edited it
    if grep -q "your_private_key_here" .env; then
        print_error "You haven't updated PRIVATE_KEY in .env!"
        echo "Please edit .env and add your actual private key."
        exit 1
    fi
else
    print_success ".env file exists"
    
    # Check if it has been edited
    if grep -q "your_private_key_here" .env; then
        print_error ".env still has placeholder private key!"
        echo "Please edit .env and add your actual private key."
        exit 1
    fi
fi

# Load environment
source .env

echo ""

# Step 4: Compile Contracts
print_step "4" "Compiling Smart Contracts"
echo ""

if [ ! -d "artifacts" ]; then
    echo "Compiling... (this takes ~30 seconds)"
    npx hardhat compile 2>&1 | grep -v "WARNING.*Node.js" | tail -5
    if [ $? -eq 0 ]; then
        print_success "Contracts compiled"
    else
        print_error "Compilation failed"
        exit 1
    fi
else
    print_success "Contracts already compiled"
fi

echo ""

# Step 5: Check Balance
print_step "5" "Checking Wallet Balance"
echo ""

cat > /tmp/check-bal.js << 'EOF'
const { ethers } = require("hardhat");
async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Address:", deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
  if (balance < ethers.parseEther("0.01")) {
    console.log("\n⚠️  LOW BALANCE");
    process.exit(1);
  }
}
main();
EOF

npx hardhat run /tmp/check-bal.js --network baseSepolia 2>&1 | grep -v "WARNING.*Node.js"

if [ $? -ne 0 ]; then
    echo ""
    print_error "Insufficient balance or connection error"
    echo ""
    echo "To get test ETH:"
    echo "  1. Visit: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet"
    echo "  2. Connect your MetaMask wallet"
    echo "  3. Request 0.1 ETH (free)"
    echo ""
    exit 1
fi

echo ""

# Step 6: Deploy
print_step "6" "Deploying to Base Sepolia"
echo ""

echo "Ready to deploy $GOALS Protocol!"
echo ""
read -p "Continue with deployment? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo "Deploying... (this takes ~1 minute)"
echo ""

npx hardhat run scripts/deploy.js --network baseSepolia 2>&1 | grep -v "WARNING.*Node.js"

if [ $? -eq 0 ]; then
    echo ""
    print_success "Deployment successful!"
else
    print_error "Deployment failed"
    exit 1
fi

echo ""

# Step 7: Show Results
print_step "7" "Deployment Complete!"
echo ""

if [ -f "deployments/baseSepolia-deployment.json" ]; then
    CONTRACT_ADDRESS=$(cat deployments/baseSepolia-deployment.json | grep '"contractAddress"' | cut -d'"' -f4)
    
    echo -e "${GREEN}🎉 $GOALS Protocol deployed!${NC}"
    echo ""
    echo "Contract Address:"
    echo "  $CONTRACT_ADDRESS"
    echo ""
    echo "View on BaseScan:"
    echo "  https://sepolia.basescan.org/address/$CONTRACT_ADDRESS"
    echo ""
    echo "Next steps:"
    echo "  1. Mint test NFTs: npm run mint:test"
    echo "  2. Update stats: npm run update:stats"
    echo "  3. Start agents: cd .. && python agents/autonomous_trading_agent.py"
    echo ""
    echo "Save this contract address - you'll need it for the frontend!"
    echo ""
fi
