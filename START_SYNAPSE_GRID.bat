@echo off
setlocal

cd /d "%~dp0"

echo.
echo ==========================================
echo   SYNAPSE GRID - One Click Launcher
echo ==========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed or not available in PATH.
  echo Install Node.js 18 or newer from https://nodejs.org/
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo Dependency installation failed.
    pause
    exit /b 1
  )
)

echo Starting SYNAPSE GRID server...
echo Dashboard will open at http://localhost:3000
echo.

start "SYNAPSE GRID Server" cmd /k "cd /d "%~dp0" && npm start"

timeout /t 3 /nobreak >nul
start "" "http://localhost:3000"

echo.
echo SYNAPSE GRID is launching.
echo Close the server window when you are done.
echo.
pause
