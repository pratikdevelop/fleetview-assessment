@echo off
REM Quick-start script for FleetView with Ably

echo.
echo ========================================
echo  FleetView + Ably Quick Start
echo ========================================
echo.

echo [1/4] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
  echo ERROR: Node.js not found. Please install from https://nodejs.org
  exit /b 1
)
echo OK - Node.js found

echo.
echo [2/4] Installing dependencies...
call npm install
if errorlevel 1 (
  echo ERROR: npm install failed
  exit /b 1
)
echo OK - Dependencies installed

echo.
echo [3/4] Checking .env.local...
if not exist .env.local (
  echo WARNING: .env.local not found
  echo Please ensure ABLY_API_KEY is set in .env.local
) else (
  echo OK - .env.local exists
)

echo.
echo [4/4] Ready to start!
echo.
echo ========================================
echo  Next Steps:
echo ========================================
echo.
echo 1. Start dev server:
echo    npm run dev
echo.
echo 2. In another terminal, run the publisher:
echo    node .\scripts\publish-ably.js
echo.
echo 3. Open browser and navigate to:
echo    http://localhost:9002
echo.
echo 4. Watch real-time events stream into the dashboard!
echo.
echo ========================================
echo.
pause
