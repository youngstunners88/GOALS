# $GOALS Protocol - Base Sepolia Deployment Guide

## 🚀 Quick Deploy (5 minutes)

### Step 1: Get Test ETH

**You need Base Sepolia ETH to deploy. Get it for free:**

1. **Option A: Coinbase Faucet** (Recommended)
   - Visit: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
   - Connect your wallet
   - Request 0.1 ETH (enough for multiple deployments)

2. **Option B: Base Sepolia Faucet**
   - Visit: https://docs.base.org/tools/network-faucets/
   - Follow instructions for other faucets

**You'll need:** 0.01 ETH minimum for deployment

---

### Step 2: Get Your Private Key

**From MetaMask:**
1. Open MetaMask browser extension
2. Switch to **Base Sepolia** network
   - If not added: Settings → Networks → Add Network
   - RPC: https://sepolia.base.org
   - Chain ID: 84532
3. Click on your account (the colorful circle)
4. Click "Account Details"
5. Click "Export Private Key"
6. Enter your password
7. Copy the private key (64 characters, no 0x prefix)

**⚠️ SECURITY WARNING:**
- Never share your private key
- This is a TESTNET key - use a dedicated test wallet
- Never use mainnet keys for testing

---

### Step 3: Configure Environment

```bash
cd /home/teacherchris37/goals-protocol/contracts

# Create .env file
cat > .env << 'EOF'
# Your private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Optional: Get from https://basescan.org/myapikey
BASESCAN_API_KEY=your_basescan_api_key_here

# RPC endpoints (these defaults work fine)
BASE_SEPOLIA_RPC=https://sepolia.base.org
BASE_MAINNET_RPC=https://mainnet.base.org
EOF

# Edit the file
nano .env
```

**Replace:**
- `your_private_key_here` → Your actual private key
- `your_basescan_api_key_here` → Your BaseScan API key (optional, for verification)

---

### Step 4: Deploy

**Option A: Automated Script (Recommended)**
```bash
./scripts/setup-and-deploy.sh
```

**Option B: Manual Steps**
```bash
# 1. Check balance
npx hardhat run scripts/check-balance.js --network baseSepolia

# 2. Deploy contract
npx hardhat run scripts/deploy.js --network baseSepolia

# 3. Verify contract (optional)
npx hardhat verify --network baseSepolia CONTRACT_ADDRESS \
  "0xROYALTY" "0xORACLE" "0xREGULATOR" "https://api.goalsprotocol.xyz/metadata/"
```

---

## 📊 Expected Output

```
⚽ $GOALS Protocol - Base Sepolia Deployment
============================================

[INFO] Environment configured ✓

[INFO] Checking wallet balance...

Address: 0xYourAddress...
Balance: 0.05 ETH

Continue with deployment? (y/n) y

[INFO] Starting deployment...

🚀 $GOALS Protocol - Deployment

📋 Deployment Account: 0xYourAddress...
💰 Balance: 0.05 ETH

⚙️  Configuration:
  Royalty: 0xYourAddress...
  Oracle: 0xYourAddress...
  URI: https://api.goalsprotocol.xyz/metadata/

📄 Deploying GoalsProtocolNFT...

✅ Deployed to: 0xYourContractAddress...
📊 Tx Hash: 0x...
⛽ Gas: 4500000

⏳ Waiting for confirmations...
✅ Confirmed

🔍 Verifying...
✅ Verified

💾 Saved to deployments/

🎉 Deployment Complete!

Deployment Info:
  "contractAddress": "0xYourContractAddress..."
  "deployerAddress": "0xYourAddress..."
  "deploymentTime": "2024-03-28T..."

View on BaseScan:
  https://sepolia.basescan.org/address/0xYourContractAddress...

[INFO] Next steps:
  1. Mint test NFTs: npm run mint:test
  2. Update stats: npm run update:stats
  3. View contract: https://sepolia.basescan.org
```

---

## 🎨 Mint Test NFTs

After deployment:

```bash
npm run mint:test
```

**This will:**
1. Mint 4 test NFTs (Messi, Ronaldo, Bellingham, Camavinga)
2. Different rarities (Legendary, Epic, Rare)
3. Show gas costs

---

## 📈 Update Live Stats

Test the dynamic NFT feature:

```bash
npm run update:stats
```

**This will:**
1. Update live stats for all your NFTs
2. Record a test match
3. Show updated scores

---

## 🔍 Verify Contract

If not auto-verified, do it manually:

```bash
# Get your contract address from deployments/baseSepolia-deployment.json
CONTRACT_ADDRESS=$(cat deployments/baseSepolia-deployment.json | grep contractAddress | cut -d'"' -f4)

# Verify
npx hardhat verify --network baseSepolia $CONTRACT_ADDRESS \
  "0x$(cat deployments/baseSepolia-deployment.json | grep deployerAddress | cut -d'"' -f4)" \
  "0x$(cat deployments/baseSepolia-deployment.json | grep deployerAddress | cut -d'"' -f4)" \
  "0x$(cat deployments/baseSepolia-deployment.json | grep deployerAddress | cut -d'"' -f4)" \
  "https://api.goalsprotocol.xyz/metadata/"
```

---

## 💰 Gas Costs (Base Sepolia)

| Operation | Gas | Cost (at 1 gwei) |
|-----------|-----|------------------|
| Deploy Contract | ~4.5M | ~$0.005 |
| Mint Common | ~150k | ~$0.0002 |
| Mint Legendary | ~200k | ~$0.0003 |
| Update Stats | ~50k | ~$0.0001 |

**Total for testing:** ~$0.01 (basically free)

---

## 🛠️ Troubleshooting

### "Private key too short"
```
Fix: Make sure private key is 64 characters (or 66 with 0x)
```

### "Insufficient funds"
```
Fix: Get more test ETH from faucet
```

### "Nonce too high"
```
Fix: Reset account in MetaMask (Settings → Advanced → Reset Account)
```

### "Network timeout"
```
Fix: Try again, or use Alchemy RPC:
  BASE_SEPOLIA_RPC=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY
```

---

## 📞 Support

**Check deployment:**
```bash
cat deployments/baseSepolia-deployment.json
```

**View on explorer:**
- https://sepolia.basescan.org/address/YOUR_CONTRACT_ADDRESS

**Contract ABI:**
```bash
cat deployments/baseSepolia-deployment.json | jq .abi
```

---

## 🎉 Success!

Once deployed, you can:
- ✅ View contract on BaseScan
- ✅ Mint NFTs
- ✅ Test all features
- ✅ Share contract address with team

**Contract Address:** Save this! You'll need it for the frontend and agent integration.

---

**Ready to deploy?** Run: `./scripts/setup-and-deploy.sh` ⚽🚀
