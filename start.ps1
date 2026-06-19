Write-Host "Starting PERIS AI..." -ForegroundColor Green
Write-Host ""

Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install
Write-Host ""

Write-Host "Starting backend server..." -ForegroundColor Blue
Start-Process -WindowStyle Normal powershell -ArgumentList "-NoExit", "-Command", "node server.js"

Write-Host "Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "Starting frontend server..." -ForegroundColor Blue
Start-Process -WindowStyle Normal powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host ""
Write-Host "PERIS AI is starting up!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:8787" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
