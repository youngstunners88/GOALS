#!/bin/bash

# Soccer Souls - Complete Setup Script
# This script sets up the entire Soccer Souls development environment

set -e

echo "⚽ SOCCER SOULS - Setup Script"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
echo "🔍 Checking prerequisites..."
echo ""

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "Node.js found: $NODE_VERSION"
else
    print_error "Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_status "npm found: $NPM_VERSION"
else
    print_error "npm not found. Please install npm"
    exit 1
fi

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    print_status "Python found: $PYTHON_VERSION"
else
    print_error "Python 3 not found. Please install Python 3.11+"
    exit 1
fi

# Check Git
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    print_status "Git found: $GIT_VERSION"
else
    print_error "Git not found. Please install Git"
    exit 1
fi

echo ""
echo "✅ All prerequisites met!"
echo ""

# Setup project directories
echo "📁 Setting up project structure..."
mkdir -p {agents,analytics,blockchain,nft-contracts,docs,skills,tests,config}
mkdir -p agents/{trading,social,marketplace}
mkdir -p analytics/{valuation,market,simulation}
mkdir -p tests/{unit,integration,e2e}
print_status "Project structure created"
echo ""

# Setup 1: GSD (Get-Shit-Done)
echo "🛠️  Setting up GSD (Get-Shit-Done)..."
if [ ! -d ".claude" ]; then
    npx get-shit-done-cc@latest --claude --local
    print_status "GSD installed successfully"
else
    print_warning "GSD already installed"
fi
echo ""

# Setup 2: ACP Integration
echo "🔗 Setting up ACP (Agent Commerce Protocol)..."
if [ ! -d "acp-integration" ]; then
    git clone https://github.com/Virtual-Protocol/openclaw-acp.git acp-integration
    cd acp-integration
    npm install
    cd ..
    print_status "ACP integration setup complete"
else
    print_warning "ACP integration already exists"
fi
echo ""

# Setup 3: QuantAgents Python Environment
echo "🐍 Setting up QuantAgents Python environment..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    # Try different methods to create virtual environment
    if python3 -m venv venv 2>/dev/null; then
        print_status "Virtual environment created with venv"
    else
        print_warning "venv module not available, trying virtualenv..."
        pip3 install --user virtualenv
        python3 -m virtualenv venv
        print_status "Virtual environment created with virtualenv"
    fi
else
    print_warning "Virtual environment already exists"
fi

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install requirements
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
    print_status "Python dependencies installed"
else
    print_warning "requirements.txt not found"
fi

# Try to install TA-Lib
echo ""
echo "📊 Installing TA-Lib (Technical Analysis Library)..."
if pip install TA-Lib 2>/dev/null; then
    print_status "TA-Lib installed successfully"
else
    print_warning "TA-Lib installation failed. You may need to install system dependencies:"
    echo "  Ubuntu/Debian: sudo apt-get install ta-lib"
    echo "  macOS: brew install ta-lib"
    echo "  Or use: conda install -c conda-forge ta-lib"
fi

echo ""

# Setup 4: Environment Variables
echo "⚙️  Setting up environment variables..."
if [ ! -f ".env" ]; then
    cat > .env << EOF
# Soccer Souls Environment Configuration

# Network Configuration
NETWORK=base_sepolia
RPC_URL=https://sepolia.base.org
CHAIN_ID=84532

# API Keys (Fill these in)
VIRTUAL_PROTOCOL_API_KEY=your_api_key_here
BASE_API_KEY=your_base_api_key_here
ALCHEMY_API_KEY=your_alchemy_key_here

# Wallet Configuration
DEPLOYER_PRIVATE_KEY=your_private_key_here
ROYALTY_RECIPIENT=your_wallet_address_here

# Agent Configuration
AGENT_UPDATE_INTERVAL=300
RISK_TOLERANCE=medium
MAX_POSITIONS=10

# Feature Flags
ENABLE_TRADING=true
ENABLE_SOCIAL=false
ENABLE_MARKETPLACE=true

# Database
MONGODB_URI=mongodb://localhost:27017/soccer_souls
REDIS_URL=redis://localhost:6379

# Monitoring
GLITCHTIP_DSN=your_glitchtip_dsn_here
EOF
    print_status ".env file created. Please fill in your API keys!"
else
    print_warning ".env file already exists"
fi
echo ""

# Setup 5: Git Configuration
echo "📦 Setting up Git..."
if [ ! -d ".git" ]; then
    git init
    git add .
    git commit -m "Initial commit: Soccer Souls setup"
    print_status "Git repository initialized"
else
    print_warning "Git repository already exists"
fi
echo ""

# Setup 6: Create sample configs
echo "📝 Creating sample configuration files..."

# Agent config
cat > config/agent_config.json << EOF
{
  "strategies": {
    "conservative": {
      "risk_tolerance": "low",
      "max_position_size": 0.10,
      "stop_loss": 0.05,
      "take_profit": 0.15,
      "capital": 5000
    },
    "balanced": {
      "risk_tolerance": "medium",
      "max_position_size": 0.20,
      "stop_loss": 0.10,
      "take_profit": 0.25,
      "capital": 10000
    },
    "aggressive": {
      "risk_tolerance": "high",
      "max_position_size": 0.35,
      "stop_loss": 0.15,
      "take_profit": 0.50,
      "capital": 20000
    }
  },
  "default_strategy": "balanced",
  "scan_interval_minutes": 5,
  "rebalance_interval_hours": 24
}
EOF
print_status "Agent configuration created"

# NFT config
cat > config/nft_config.json << EOF
{
  "contract": {
    "name": "Soccer Souls",
    "symbol": "SOULS",
    "max_supply": {
      "common": 5000,
      "rare": 2000,
      "epic": 500,
      "legendary": 100
    },
    "prices": {
      "common": "0.01",
      "rare": "0.05",
      "epic": "0.2",
      "legendary": "1.0"
    },
    "royalty_percentage": 500
  },
  "metadata": {
    "base_uri": "https://api.soccersouls.xyz/metadata/",
    "image_base_uri": "https://cdn.soccersouls.xyz/images/"
  }
}
EOF
print_status "NFT configuration created"

echo ""

# Final summary
echo "================================"
echo "⚽ SETUP COMPLETE!"
echo "================================"
echo ""
echo "Next steps:"
echo ""
echo "1. 🔑 Configure environment variables:"
echo "   nano .env"
echo ""
echo "2. 🧪 Test the setup:"
echo "   source venv/bin/activate"
echo "   python analytics/quant_agents.py"
echo ""
echo "3. 🤖 Run autonomous agent demo:"
echo "   python agents/autonomous_trading_agent.py"
echo ""
echo "4. 🛠️  Use GSD for development:"
echo "   /gsd:new-project"
echo ""
echo "5. 🔗 Setup ACP (for NFT holders):"
echo "   cd acp-integration"
echo "   npm run acp -- setup"
echo ""
echo "Documentation:"
echo "  - README.md - Project overview"
echo "  - docs/ - Detailed documentation"
echo "  - SKILL.md - ACP integration guide"
echo ""
echo "Happy building! ⚽🚀"
