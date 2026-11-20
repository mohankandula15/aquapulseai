@echo off
title AquaPulse AI - Startup Launcher
echo ===============================================================================
echo   AquaPulse AI: ML-Based Water Quality Monitoring and Early Warning System
echo ===============================================================================
echo.
echo Starting FastAPI Backend server on http://127.0.0.1:8000 ...
start "AquaPulse AI - Backend Server" cmd /k "cd /d %~dp0backend && .\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo.
echo Waiting 4 seconds for backend to start...
timeout /t 4 /nobreak > nul

echo Starting Vite React Frontend on http://localhost:3000 ...
start "AquaPulse AI - Frontend Client" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ===============================================================================
echo   AquaPulse AI is running!
echo   Frontend: http://localhost:3000
echo   Backend API & Swagger Docs: http://127.0.0.1:8000/docs
echo ===============================================================================
echo.
pause
