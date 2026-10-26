@echo off
setlocal
cd /d "%~dp0"
set PORT=3002
set URL=http://127.0.0.1:%PORT%
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 24 LTS, then run this launcher again.
  pause
  exit /b 1
)
node -e "if(Number(process.versions.node.split('.')[0])<24)process.exit(1)"
if errorlevel 1 (
  echo Node.js 24 or newer is required. Please upgrade Node.js.
  pause
  exit /b 1
)
netstat -ano | findstr /r /c:":%PORT% .*LISTENING" >nul
if not errorlevel 1 (
  echo DQAMP is already running at %URL%
  echo Run stop-dqamp.cmd first if you want to restart it.
  start "" "%URL%"
  exit /b 0
)
if not exist "node_modules\.package-lock.json" (
  call npm.cmd ci
  if errorlevel 1 goto failed
)
call npm.cmd run build
if errorlevel 1 goto failed
if /i not "%~1"=="--no-open" start "" /b cmd /c "ping -n 3 127.0.0.1 >nul & start %URL%"
echo.
echo Open %URL% in your browser.
echo Keep this window open. Press Ctrl+C here, or run stop-dqamp.cmd, to stop the server.
echo.
node server/index.js
exit /b 0
:failed
echo.
echo Startup failed. See the error above.
pause
exit /b 1
