<#
.SYNOPSIS
  Installer for Ollama Hub & Control Center (Windows)
.DESCRIPTION
  Checks prerequisites, installs npm dependencies, builds the project,
  and creates a desktop shortcut.
#>

$ErrorActionPreference = "Stop"
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$StartMenuDir = [Environment]::GetFolderPath("StartMenu")
$ShortcutPath = Join-Path $StartMenuDir "Programs\Ollama Hub & Control Center.lnk"
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$DesktopShortcut = Join-Path $DesktopPath "Ollama Hub & Control Center.lnk"

Write-Host "=== Ollama Hub & Control Center - Windows Installer ===" -ForegroundColor Cyan
Write-Host ""

# ---- Step 1: Check Node.js ----
Write-Host "[1/5] Checking prerequisites..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "  [OK] Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  [FAIL] Node.js is not installed!" -ForegroundColor Red
    Write-Host "  Download from https://nodejs.org (v18+ required)"
    exit 1
}

try {
    $npmVersion = npm --version
    Write-Host "  [OK] npm $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "  [FAIL] npm is not installed!" -ForegroundColor Red
    exit 1
}

try {
    $ollamaVersion = ollama --version
    Write-Host "  [OK] Ollama $ollamaVersion" -ForegroundColor Green
} catch {
    Write-Host "  [WARN] Ollama not found in PATH" -ForegroundColor Yellow
    Write-Host "  Install from https://ollama.com (optional if using Sandbox mode)"
}

Set-Location -LiteralPath $ProjectDir

# ---- Step 2: Install npm dependencies ----
Write-Host ""
Write-Host "[2/5] Installing npm dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [FAIL] npm install failed" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Dependencies installed" -ForegroundColor Green

# ---- Step 3: Setup environment ----
Write-Host ""
Write-Host "[3/5] Setting up environment..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    $ollamaUrl = Read-Host "Ollama URL (default: http://localhost:11434)"
    if (-not $ollamaUrl) { $ollamaUrl = "http://localhost:11434" }
    $geminiKey = Read-Host "GEMINI_API_KEY (optional - press Enter to skip)"
    @"
OLLAMA_URL=$ollamaUrl
$($geminiKey ? "GEMINI_API_KEY=$geminiKey" : "# GEMINI_API_KEY=your-key-here")
"@ | Out-File -FilePath ".env" -Encoding utf8
    Write-Host "  [OK] .env file created" -ForegroundColor Green
} else {
    Write-Host "  [OK] .env file already exists" -ForegroundColor Green
}

# ---- Step 4: Build the project ----
Write-Host ""
Write-Host "[4/5] Building the project..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [FAIL] Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Build completed" -ForegroundColor Green

# ---- Step 5: Create shortcuts ----
Write-Host ""
Write-Host "[5/5] Creating shortcuts..." -ForegroundColor Yellow
$WScriptShell = New-Object -ComObject WScript.Shell
$RunScript = Join-Path $ProjectDir "start.ps1"

# Start Menu shortcut
$Shortcut = $WScriptShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$RunScript`""
$Shortcut.WorkingDirectory = $ProjectDir
$Shortcut.Description = "Ollama Hub & Control Center"
$Shortcut.IconLocation = "$env:SystemRoot\System32\shell32.dll,21"
$Shortcut.Save()
Write-Host "  [OK] Start Menu shortcut created" -ForegroundColor Green

# Desktop shortcut
$Shortcut2 = $WScriptShell.CreateShortcut($DesktopShortcut)
$Shortcut2.TargetPath = "powershell.exe"
$Shortcut2.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$RunScript`""
$Shortcut2.WorkingDirectory = $ProjectDir
$Shortcut2.Description = "Ollama Hub & Control Center"
$Shortcut2.IconLocation = "$env:SystemRoot\System32\shell32.dll,21"
$Shortcut2.Save()
Write-Host "  [OK] Desktop shortcut created" -ForegroundColor Green

Write-Host ""
Write-Host "=== Installation Complete! ===" -ForegroundColor Cyan
Write-Host ""

# Open browser automatically
$url = "http://localhost:3000"
try {
    Start-Process $url
    Write-Host "Opening $url in your browser..." -ForegroundColor Green
} catch {
    Write-Host "Open $url in your browser" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Run the app via:" -ForegroundColor White
Write-Host "  1. Desktop shortcut: Ollama Hub & Control Center" -ForegroundColor White
Write-Host "  2. Start Menu: Ollama Hub & Control Center" -ForegroundColor White
Write-Host "  3. PowerShell: .\start.ps1" -ForegroundColor White
