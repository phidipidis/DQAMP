@echo off
setlocal
set PORT=3002
set PID=
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /r /c:":%PORT% .*LISTENING"') do set PID=%%p
if not defined PID (
  echo DQAMP is not running on port %PORT%.
  pause
  exit /b 0
)
taskkill /PID %PID% /F >nul 2>nul
echo DQAMP stopped (process %PID%).
pause
exit /b 0
