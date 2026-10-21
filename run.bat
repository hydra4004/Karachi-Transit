@echo off
REM Starts the Phase 2 prototype on a local server and opens the launcher page.
REM The union portal and the commuter app sync through localStorage, which
REM needs both pages to be on the same origin, so use a server rather than
REM opening the HTML files directly.

setlocal
set PORT=8080
set DIR=%~dp0prototype

where python >nul 2>nul
if errorlevel 1 (
  echo.
  echo Python was not found on this machine.
  echo Install Python 3 from https://www.python.org/downloads/ and run this file again,
  echo or serve the folder with any other static server, e.g.
  echo    npx serve "%DIR%"
  echo.
  pause
  exit /b 1
)

echo Starting the prototype server on http://localhost:%PORT%/
start "" "http://localhost:%PORT%/"

cd /d "%DIR%"
python -m http.server %PORT%

endlocal
