#!/bin/bash

# ========================================
# TEST SETUP SCRIPT
# ========================================

echo "🧪 ClinicAll E2E Test Setup"
echo "============================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
else
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js ${NODE_VERSION} installed${NC}"
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
else
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓ npm ${NPM_VERSION} installed${NC}"
fi

echo ""
echo "📦 Installing dependencies..."
npm install --save-dev @playwright/test

echo ""
echo "🌐 Installing Playwright browsers..."
npx playwright install

echo ""
echo "📝 Checking environment files..."

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo "Creating .env from .env.example..."
        cp .env.example .env
        echo -e "${GREEN}✓ .env created${NC}"
    else
        echo -e "${YELLOW}⚠ .env.example not found, creating .env manually${NC}"
        cat > .env << EOF
BASE_URL=http://localhost:3000
API_URL=http://localhost:4000/api/v1
NODE_ENV=test
TEST_USER_EMAIL=testuser@example.com
TEST_USER_PASSWORD=TestPassword123!
CI=false
EOF
    fi
else
    echo -e "${GREEN}✓ .env already exists${NC}"
fi

echo ""
echo "📋 Creating test directories..."
mkdir -p test-results/{html,screenshots}
echo -e "${GREEN}✓ Test directories created${NC}"

echo ""
echo "✅ Setup Complete!"
echo ""
echo "📖 Next Steps:"
echo "1. Ensure frontend is running: npm start (in frontend directory)"
echo "2. Ensure backend is running: npm start (in server directory)"
echo "3. Create a test user if needed"
echo "4. Run tests: npm run test:e2e"
echo ""
echo "📚 For more information, see: tests/README.md"
