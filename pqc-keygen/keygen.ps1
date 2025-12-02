# Key Generation Script for Windows (PowerShell)

Write-Host "Starting Key Generator..." -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
$nodeVersion = node --version 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Run the key generator
node keygen.js

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Key generation failed!" -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Success! Keys generated." -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to exit"