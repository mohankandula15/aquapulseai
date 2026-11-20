Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "  AquaPulse AI: ML-Based Water Quality Monitoring and Early Warning System" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Starting FastAPI Backend server on http://127.0.0.1:8000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$baseDir\backend'; .\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

Start-Sleep -Seconds 4

Write-Host "Starting Vite React Frontend on http://localhost:3000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$baseDir\frontend'; npm run dev"

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host "  AquaPulse AI is launching in separate background windows!" -ForegroundColor Green
Write-Host "  Frontend Dashboard: http://localhost:3000" -ForegroundColor Green
Write-Host "  Backend Swagger API Docs: http://127.0.0.1:8000/docs" -ForegroundColor Green
Write-Host "===============================================================================" -ForegroundColor Green
