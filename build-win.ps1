<#
.SYNOPSIS
  Complete Windows Build Pipeline for Ollama Hub & Control Center
.DESCRIPTION
  1. Clean build artifacts
  2. Build the project (client + server)
  3. Build standalone .exe with Node.js SEA (Single Executable Application)
  4. (Optional) Compile Inno Setup installer if iscc is available
#>

param(
    [switch]$NoInstaller,
    [switch]$Help
)

$ErrorActionPreference = "Stop"
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BuildStart = Get-Date

function Write-Step($msg) {
    Write-Host ""; Write-Host "=== $msg ===" -ForegroundColor Cyan
}
function Write-OK($msg) { Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "  [WARN] $msg" -ForegroundColor Yellow }
function Write-Fail($msg) { Write-Host "  [FAIL] $msg" -ForegroundColor Red }

if ($Help) {
    Write-Host "Ollama Hub - Windows Build Pipeline"
    Write-Host "Usage: .\build-win.ps1 [-NoInstaller]"
    exit 0
}

Set-Location -LiteralPath $ProjectDir

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Ollama Hub - Windows Build Pipeline" -ForegroundColor Cyan
Write-Host "  Builds standalone .exe using Node.js SEA" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Step 1: Clean
Write-Step "Step 1/4: Cleaning build artifacts"
node scripts/clean.mjs
Write-OK "Cleanup done"

# Step 2: Install deps if needed
Write-Step "Step 2/4: Checking dependencies"
if (-not (Test-Path "node_modules")) {
    npm install --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { Write-Fail "npm install failed"; exit 1 }
    Write-OK "Dependencies installed"
} else {
    Write-OK "node_modules exists"
}

# Step 3: Build + SEA executable
Write-Step "Step 3/4: Building standalone .exe"
npm run sea
if ($LASTEXITCODE -ne 0) { Write-Fail "Build failed"; exit 1 }
Write-OK "Standalone .exe created"

# Step 4: Inno Setup installer (optional)
if (-not $NoInstaller) {
    Write-Step "Step 4/4: Compiling Inno Setup installer (optional)"

    $iscc = Get-Command "iscc" -ErrorAction SilentlyContinue
    if (-not $iscc) {
        $iscc = Get-Command "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" -ErrorAction SilentlyContinue
    }
    if (-not $iscc) {
        $iscc = Get-Command "C:\Program Files\Inno Setup 6\ISCC.exe" -ErrorAction SilentlyContinue
    }

    if ($iscc) {
        & $iscc.Source "setup.iss"
        if ($LASTEXITCODE -eq 0) { Write-OK "Installer created in installer/" }
        else { Write-Warn "Inno Setup compilation failed" }
    } else {
        Write-Warn "Inno Setup not found - install from https://jrsoftware.org/isdl.php"
        Write-Warn "Then run: iscc setup.iss"
    }
} else {
    Write-Step "Step 4/4: Skipping installer"
}

# Summary
$Duration = (Get-Date) - $BuildStart
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Build Complete!" -ForegroundColor Cyan
Write-Host "  Duration: $($Duration.Minutes)m $($Duration.Seconds)s" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
if (Test-Path "release\ollama-hub-win.exe") {
    $exeSize = (Get-Item "release\ollama-hub-win.exe").Length / 1MB
    Write-Host "  [EXE] release\ollama-hub-win.exe ($([math]::Round($exeSize, 1)) MB)" -ForegroundColor Green
    Write-Host "        Standalone executable - NO Node.js needed!" -ForegroundColor Green
}
if (Test-Path "installer") {
    Get-ChildItem "installer\" -Filter "*.exe" | ForEach-Object {
        $s = $_.Length / 1MB
        Write-Host "  [SETUP] $($_.Name) ($([math]::Round($s, 1)) MB)" -ForegroundColor Green
    }
}
Write-Host ""
Write-Host "To create Inno Setup installer:" -ForegroundColor Yellow
Write-Host "  1. Install Inno Setup: https://jrsoftware.org/isdl.php" -ForegroundColor Yellow
Write-Host "  2. Run: iscc setup.iss" -ForegroundColor Yellow
