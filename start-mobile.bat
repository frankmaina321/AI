@echo off
echo ========================================
echo     PERIS AI Mobile Setup Launcher
echo ========================================
echo.

echo [1/4] Checking system requirements...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Please install from nodejs.org
    pause
    exit /b 1
)

npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm not found. Please install Node.js from nodejs.org
    pause
    exit /b 1
)
echo ✅ Node.js and npm found

echo.
echo [2/4] Getting your computer's IP address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| find "IPv4"') do set IP=%%a
set IP=%IP: =%
echo Your computer's IP: %IP%

echo.
echo [3/4] Starting backend server...
start "PERIS Backend" cmd /k "cd /d %~dp0 && node server.js"
timeout /t 3 /nobreak > nul
echo Backend started on http://localhost:8787

echo.
echo [4/4] Starting frontend server...
start "PERIS Frontend" cmd /k "cd /d %~dp0 && npm run dev"
timeout /t 3 /nobreak > nul
echo Frontend started on http://localhost:5173

echo.
echo ========================================
echo         MOBILE ACCESS READY
echo ========================================
echo.
echo 📱 Access from your phone:
echo    http://%IP%:5173
echo.
echo 🔧 Computer access:
echo    http://localhost:5173
echo.
echo 📋 Setup Instructions:
echo    1. Open the phone URL above in your phone browser
echo    2. Allow microphone, camera, and notifications
echo    3. Try voice commands: "Hello PERIS"
echo    4. Install as app: "Add to Home Screen"
echo.
echo 🎤 Test voice commands:
echo    - "Turn on lights"
echo    - "Call Mom" 
echo    - "What time is it"
echo    - "Set temperature to 72"
echo.
echo 📖 Full guide: mobile-setup.md
echo.
echo Press any key to open setup guide...
pause > nul
start mobile-setup.md
