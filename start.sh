#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

cd "$PROJECT_DIR"

echo -e "${CYAN}=== Ollama Hub & Control Center ===${NC}"
echo ""

SERVER_PATH="dist/server.cjs"
DIST_HTML="dist/index.html"

if [ ! -f "$SERVER_PATH" ] || [ ! -f "$DIST_HTML" ]; then
    echo -e "${YELLOW}Build not found. Running initial setup...${NC}"
    
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing dependencies...${NC}"
        npm install
        echo -e "${GREEN}[OK] Dependencies installed${NC}"
    fi
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            echo -e "${YELLOW}Created .env from .env.example - edit it if needed${NC}"
        else
            cat > .env << 'EOF'
OLLAMA_URL=http://localhost:11434
# GEMINI_API_KEY=your-key-here
EOF
            echo -e "${YELLOW}Created default .env file${NC}"
        fi
    fi
    
    echo -e "${YELLOW}Building project...${NC}"
    npm run build
    echo -e "${GREEN}[OK] Build complete${NC}"
fi

echo -e "${GREEN}Starting server on http://localhost:3000${NC}"
echo -e "Press Ctrl+C to stop the server"
echo ""

# Start server in background
node "$SERVER_PATH" &
SERVER_PID=$!
sleep 2

# Auto-open browser
if command -v xdg-open &>/dev/null; then
    xdg-open "http://localhost:3000" 2>/dev/null &
elif command -v open &>/dev/null; then
    open "http://localhost:3000" 2>/dev/null &
fi
echo -e "${GREEN}Browser opened automatically${NC}"

# Wait for server process
wait $SERVER_PID
