@echo off
title DQAMP 2026 (local)
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Install version 22.13 or newer from https://nodejs.org and run this again.
  pause
  exit /b 1
)

if not exist node_modules (
  echo First run: installing components. This takes a few minutes...
  call npm install || (pause & exit /b 1)
)
if not exist dist (
  echo Building the app...
  call npm run build || (pause & exit /b 1)
)

echo.
echo Opening DQAMP at http://localhost:3000
echo Keep this window open while you use DQAMP. Close it to stop the app.
start "" http://localhost:3000
node server/index.js
pause
