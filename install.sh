#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}=== Ollama Hub & Control Center - Linux Installer ===${NC}"
echo ""

# ---- Step 1: Check prerequisites ----
echo -e "${YELLOW}[1/5] Checking prerequisites...${NC}"

if command -v node &>/dev/null; then
    NODE_VER=$(node --version)
    echo -e "  ${GREEN}[OK] Node.js ${NODE_VER}${NC}"
else
    echo -e "  ${RED}[FAIL] Node.js is not installed!${NC}"
    echo "  Install: curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt-get install -y nodejs"
    echo "  Or use nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash && nvm install 18"
    exit 1
fi

NODE_MAJOR=$(node --version | sed 's/v//' | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 18 ]; then
    echo -e "  ${RED}[FAIL] Node.js version too old. Need v18+${NC}"
    exit 1
fi

if command -v npm &>/dev/null; then
    NPM_VER=$(npm --version)
    echo -e "  ${GREEN}[OK] npm ${NPM_VER}${NC}"
else
    echo -e "  ${RED}[FAIL] npm is not installed!${NC}"
    exit 1
fi

if command -v ollama &>/dev/null; then
    OLLAMA_VER=$(ollama --version)
    echo -e "  ${GREEN}[OK] Ollama ${OLLAMA_VER}${NC}"
else
    echo -e "  ${YELLOW}[WARN] Ollama not found (optional if using Sandbox mode)${NC}"
    echo "  Install: curl -fsSL https://ollama.com/install.sh | sh"
fi

cd "$PROJECT_DIR"

# ---- Step 2: Install npm dependencies ----
echo ""
echo -e "${YELLOW}[2/5] Installing npm dependencies...${NC}"
npm install
echo -e "  ${GREEN}[OK] Dependencies installed${NC}"

# ---- Step 3: Setup environment ----
echo ""
echo -e "${YELLOW}[3/5] Setting up environment...${NC}"
if [ ! -f ".env" ]; then
    read -r -p "Ollama URL (default: http://localhost:11434): " OLLAMA_URL
    OLLAMA_URL="${OLLAMA_URL:-http://localhost:11434}"
    read -r -p "GEMINI_API_KEY (optional - press Enter to skip): " GEMINI_KEY
    cat > .env << EOF
OLLAMA_URL=${OLLAMA_URL}
${GEMINI_KEY:+GEMINI_API_KEY=$GEMINI_KEY}
EOF
    echo -e "  ${GREEN}[OK] .env file created${NC}"
else
    echo -e "  ${GREEN}[OK] .env file already exists${NC}"
fi

# ---- Step 4: Build the project ----
echo ""
echo -e "${YELLOW}[4/5] Building the project...${NC}"
npm run build
echo -e "  ${GREEN}[OK] Build completed${NC}"

# ---- Step 5: Create desktop entry ----
echo ""
echo -e "${YELLOW}[5/5] Creating desktop entry...${NC}"
DESKTOP_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
mkdir -p "$DESKTOP_DIR"
cat > "$DESKTOP_DIR/ollama-hub-control-center.desktop" << EOF
[Desktop Entry]
Name=Ollama Hub & Control Center
Comment=Ollama LLM management dashboard
Exec=${PROJECT_DIR}/start.sh
Terminal=true
Type=Application
Categories=Development;Utility;
StartupNotify=true
EOF
chmod +x "$DESKTOP_DIR/ollama-hub-control-center.desktop"

# Also create a launcher script
LAUNCHER="$HOME/.local/bin/ollama-hub"
mkdir -p "$(dirname "$LAUNCHER")"
cat > "$LAUNCHER" << EOF
#!/usr/bin/env bash
cd "${PROJECT_DIR}" && bash start.sh "\$@"
EOF
chmod +x "$LAUNCHER"
mkdir -p "$HOME/Desktop"
cp "$DESKTOP_DIR/ollama-hub-control-center.desktop" "$HOME/Desktop/" 2>/dev/null || true

echo -e "  ${GREEN}[OK] Desktop entry and launcher created${NC}"

echo ""
echo -e "${CYAN}=== Installation Complete! ===${NC}"
echo ""

# Auto-open browser
if command -v xdg-open &>/dev/null; then
    xdg-open "http://localhost:3000" 2>/dev/null &
elif command -v open &>/dev/null; then
    open "http://localhost:3000" 2>/dev/null &
fi
echo -e "${GREEN}Opening http://localhost:3000 in your browser...${NC}"
echo ""
echo -e "Run the app via:"
echo -e "  1. Command: ollama-hub"
echo -e "  2. Desktop: Ollama Hub & Control Center"
echo -e "  3. Script:  ./start.sh"
