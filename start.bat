@echo off
echo Starting PERIS AI...
echo.

echo Installing dependencies...
call npm install
echo.

echo Starting backend server...
start "Backend Server" cmd /k "node server.js"

echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo Starting frontend server...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo PERIS AI is starting up!
echo Frontend: http://localhost:5173
echo Backend: http://localhost:8787
echo.
echo Press any key to exit...
pause > nul
