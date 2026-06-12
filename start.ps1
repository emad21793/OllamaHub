<#
.SYNOPSIS
  Start Ollama Hub & Control Center (Windows)
.DESCRIPTION
  Checks if the build exists, installs deps if needed, sets up env,
  and launches the production server.
#>

$ErrorActionPreference = "Stop"
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ServerPath = Join-Path $ProjectDir "dist\server.cjs"
$DistPath = Join-Path $ProjectDir "dist\index.html"

Set-Location -LiteralPath $ProjectDir

Write-Host "=== Ollama Hub & Control Center ===" -ForegroundColor Cyan
Write-Host ""

# Check if build exists
if (-not (Test-Path $ServerPath) -or -not (Test-Path $DistPath)) {
    Write-Host "Build not found. Running initial setup..." -ForegroundColor Yellow
    
    if (-not (Test-Path "node_modules")) {
        Write-Host "Installing dependencies..." -ForegroundColor Yellow
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[FAIL] npm install failed" -ForegroundColor Red
            exit 1
        }
    }
    
    if (-not (Test-Path ".env")) {
        if (Test-Path ".env.example") {
            Copy-Item ".env.example" ".env"
            Write-Host "Created .env from .env.example - edit it if needed" -ForegroundColor Yellow
        } else {
            @"
OLLAMA_URL=http://localhost:11434
# GEMINI_API_KEY=your-key-here
"@ | Out-File -FilePath ".env" -Encoding utf8
            Write-Host "Created default .env file" -ForegroundColor Yellow
        }
    }
    
    Write-Host "Building project..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[FAIL] Build failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Build complete" -ForegroundColor Green
}

Write-Host "Starting server on http://localhost:3000" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

# Open browser in background after server starts
Start-Job -ScriptBlock { Start-Sleep 2; Start-Process "http://localhost:3000" } | Out-Null

# Start server (foreground - Ctrl+C works to stop)
node "$ServerPath"
