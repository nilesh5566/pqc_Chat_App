# 🪟 Windows Setup Guide

Complete setup guide for running PQC Messaging App on Windows.

---

## 🎯 Quick Fix for Your Error

You're getting the error because **liboqs is not installed**. On Windows, we'll use a JavaScript-based key generator instead!

### ✅ Solution: Use JavaScript Key Generator

```powershell
# Navigate to pqc-keygen folder
cd C:\pqc-messaging-app\pqc-keygen

# Run the JavaScript version (Option 1)
node keygen.js

# OR use the batch file (Option 2)
keygen.bat

# OR use PowerShell script (Option 3)
.\keygen.ps1
```

---

## 📋 Prerequisites for Windows

### 1. Node.js (Required)

**Check if installed:**
```powershell
node --version
npm --version
```

**If not installed:**
1. Download from: https://nodejs.org/
2. Install LTS version (18.x or higher)
3. Restart PowerShell/CMD

### 2. MongoDB (Required)

**Option A: MongoDB Community Server (Recommended)**
1. Download from: https://www.mongodb.com/try/download/community
2. Install with default settings
3. MongoDB will run as a Windows Service

**Option B: MongoDB Docker**
```powershell
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 3. Git (Optional)
Download from: https://git-scm.com/download/win

---

## 🚀 Complete Installation Steps

### Step 1: Open PowerShell as Administrator

```
Press Windows Key
Type "PowerShell"
Right-click "Windows PowerShell"
Select "Run as administrator"
```

### Step 2: Navigate to Project Directory

```powershell
cd C:\pqc-messaging-app
```

### Step 3: Install Backend Dependencies

```powershell
cd backend
npm install
cd ..
```

**Expected output:**
```
added 150 packages in 15s
```

### Step 4: Install Frontend Dependencies

```powershell
cd frontend
npm install
cd ..
```

**Expected output:**
```
added 200 packages in 20s
```

### Step 5: Create Environment Files

#### Backend .env

```powershell
cd backend
notepad .env
```

**Paste this content:**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/pqc-messaging
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Save and close.**

#### Frontend .env.local

```powershell
cd ..\frontend
notepad .env.local
```

**Paste this content:**
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000
```

**Save and close.**

---

## 🔑 Key Generation (JavaScript Version)

### Option 1: Direct Node.js (Recommended)

```powershell
cd C:\pqc-messaging-app\pqc-keygen
node keygen.js
```

### Option 2: Batch File

```powershell
cd C:\pqc-messaging-app\pqc-keygen
.\keygen.bat
```

### Option 3: PowerShell Script

```powershell
cd C:\pqc-messaging-app\pqc-keygen
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\keygen.ps1
```

**Output:**
```
╔════════════════════════════════════════════════════════════╗
║     Post-Quantum Cryptography Key Generation Tool          ║
║     Algorithm: Kyber1024 (Simulated for Development)      ║
╚════════════════════════════════════════════════════════════╝

⚠️  DEVELOPMENT MODE
   This generates mock keys for testing purposes.

✅ KEM Configuration: Kyber1024
   Public key size:  1568 bytes
   Private key size: 3168 bytes

🔑 Generating key pair...
✅ Key pair generated successfully!

📁 Keys saved to files:
   Public key:  public_key.txt
   Private key: private_key.txt
```

---

## 🏃 Running the Application

### Open 3 PowerShell Windows

#### Window 1: Backend

```powershell
cd C:\pqc-messaging-app\backend
npm run dev
```

**Wait for:**
```
✅ MongoDB Connected
🚀 Server running on port 5000
```

#### Window 2: Frontend

```powershell
cd C:\pqc-messaging-app\frontend
npm run dev
```

**Wait for:**
```
▲ Next.js 14.0.0
- Local: http://localhost:3000
✓ Ready in 2.5s
```

#### Window 3: Commands

```powershell
cd C:\pqc-messaging-app\pqc-keygen
node keygen.js
```

---

## 🌐 Access the Application

Open your browser:
```
http://localhost:3000
```

---

## 🛑 Stopping the Application

Press `Ctrl + C` in each PowerShell window.

To stop MongoDB:
```powershell
# If running as service
net stop MongoDB

# OR in Services
services.msc
→ Find MongoDB
→ Right-click → Stop
```

---

## 🐛 Troubleshooting

### Error: "Port 5000 already in use"

```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

### Error: "Port 3000 already in use"

```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <PID> /F
```

### Error: "MongoDB connection refused"

```powershell
# Start MongoDB service
net start MongoDB

# OR
# Open Services (services.msc)
# Find MongoDB → Right-click → Start
```

### Error: "Module not found"

```powershell
# Reinstall dependencies
cd backend
Remove-Item node_modules -Recurse -Force
npm install

cd ..\frontend
Remove-Item node_modules -Recurse -Force
npm install
```

### Error: "Cannot run scripts" (PowerShell)

```powershell
# Allow script execution (in admin PowerShell)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 📦 Windows-Specific Commands

### Check Services Status

```powershell
# Check if ports are in use
netstat -ano | findstr :3000
netstat -ano | findstr :5000
netstat -ano | findstr :27017

# Check Node.js processes
tasklist | findstr node

# Check MongoDB service
sc query MongoDB
```

### Kill All Node Processes

```powershell
taskkill /F /IM node.exe
```

### View MongoDB Logs

```powershell
# Default log location
Get-Content "C:\Program Files\MongoDB\Server\7.0\log\mongod.log" -Tail 50
```

---

## 🎯 Quick Start Script for Windows

Create `start.bat`:

```batch
@echo off
echo Starting PQC Messaging App...
echo.

REM Start Backend
start "Backend" cmd /k "cd backend && npm run dev"

REM Wait 5 seconds
timeout /t 5 /nobreak > nul

REM Start Frontend
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Backend and Frontend started in separate windows.
echo Press any key to exit this window...
pause > nul
```

**Usage:**
```powershell
.\start.bat
```

---

## 🎨 PowerShell Script for Windows

Create `start.ps1`:

```powershell
# Start PQC Messaging App

Write-Host "Starting PQC Messaging App..." -ForegroundColor Cyan
Write-Host ""

# Check MongoDB
$mongoService = Get-Service -Name MongoDB -ErrorAction SilentlyContinue

if ($mongoService.Status -eq "Running") {
    Write-Host "✓ MongoDB is running" -ForegroundColor Green
} else {
    Write-Host "× MongoDB is not running" -ForegroundColor Red
    Write-Host "Starting MongoDB..." -ForegroundColor Yellow
    Start-Service MongoDB
}

Write-Host ""

# Start Backend
Write-Host "Starting Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; npm run dev"

# Wait
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev"

Write-Host ""
Write-Host "✓ Services started!" -ForegroundColor Green
Write-Host "  Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
```

**Usage:**
```powershell
.\start.ps1
```

---

## 📁 File Locations on Windows

```
C:\pqc-messaging-app\
├── backend\
│   ├── node_modules\
│   ├── src\
│   ├── .env
│   └── package.json
├── frontend\
│   ├── node_modules\
│   ├── app\
│   ├── .env.local
│   └── package.json
└── pqc-keygen\
    ├── keygen.js          ← Use this!
    ├── keygen.bat         ← Or this!
    ├── keygen.ps1         ← Or this!
    ├── public_key.txt     ← Generated
    └── private_key.txt    ← Generated
```

---

## 💡 Windows Tips

1. **Use Windows Terminal** (better than CMD)
   - Install from Microsoft Store
   - Supports tabs and colors

2. **Add to PATH** (optional)
   - Right-click "This PC" → Properties
   - Advanced → Environment Variables
   - Add MongoDB bin folder to PATH

3. **Create Desktop Shortcuts**
   - Backend: `C:\pqc-messaging-app\backend\npm run dev`
   - Frontend: `C:\pqc-messaging-app\frontend\npm run dev`

4. **Use Task Manager**
   - Press `Ctrl + Shift + Esc`
   - View running Node.js processes
   - Kill stuck processes

---

## 🔒 Important for Production

The JavaScript key generator creates **mock keys for development**.

For production deployment:

1. **Use WSL2 (Windows Subsystem for Linux)**
   ```powershell
   wsl --install
   # Then follow Linux installation steps
   ```

2. **Use Docker**
   ```powershell
   # Run backend in Docker with liboqs
   docker run -it --rm liboqs/liboqs-dev
   ```

3. **Compile liboqs on Windows**
   - Follow: https://github.com/open-quantum-safe/liboqs
   - Requires Visual Studio Build Tools

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Node.js installed: `node --version`
- [ ] MongoDB running: `mongosh`
- [ ] Backend dependencies: `cd backend && npm list`
- [ ] Frontend dependencies: `cd frontend && npm list`
- [ ] Can generate keys: `node keygen.js`
- [ ] Backend starts: `npm run dev` in backend
- [ ] Frontend starts: `npm run dev` in frontend
- [ ] Can access: http://localhost:3000

---

## 🆘 Getting Help

If you encounter issues:

1. Check this guide first
2. Review error messages carefully
3. Check Task Manager for stuck processes
4. Restart PowerShell as Administrator
5. Reinstall Node.js if needed

---

**Windows setup complete! You can now use the JavaScript key generator!** 🎉