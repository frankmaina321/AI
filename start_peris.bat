@echo off
echo ========================================
echo         PERIS AI Startup Script
echo ========================================
echo.

echo [1/4] Checking backend server...
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if %ERRORLEVEL% neq 0 (
    echo Starting backend server...
    start "PERIS Backend" cmd /k "cd /d %~dp0 && node server.js"
    timeout /t 3 /nobreak > nul
    echo Backend started on port 8787
) else (
    echo Backend server is already running
)

echo.
echo [2/4] Testing backend connection...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8787/api/health' -Method GET; $data = $response.Content | ConvertFrom-Json; if ($data.ok) { Write-Host 'Backend is healthy and responding' -ForegroundColor Green } else { Write-Host 'Backend health check failed' -ForegroundColor Red } } catch { Write-Host 'Backend connection failed' -ForegroundColor Red }"

echo.
echo [3/4] Starting frontend server...
echo Note: If you get PowerShell execution policy errors, run this command once:
echo    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
echo.
start "PERIS Frontend" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo [4/4] Access Information
echo =====================
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8787
echo Health:   http://localhost:8787/api/health
echo.

echo ========================================
echo         IMPORTANT SETUP NOTES
echo ========================================
echo.
echo 1. Get Gemini API Key: https://makersuite.google.com/app/apikey
echo 2. Update .env file: GEMINI_API_KEY=your_actual_key_here
echo 3. Restart backend after updating API key
echo.
echo Features Available:
echo - Voice Input/Output
echo - Camera Capture
echo - Image Upload
echo - Topic Memory
echo - Export Functions
echo.

echo Press any key to exit this setup window...
pause > nul
