@echo off
rem PromptStudio launcher (Windows) - double-click to serve the page on localhost and open it.
rem A localhost origin is required for the Local Expand (ollama) bridge.
cd /d "%~dp0"
powershell -NoProfile -Command "try { Invoke-WebRequest -UseBasicParsing -TimeoutSec 1 http://localhost:8765/prompt-studio.html | Out-Null; exit 0 } catch { exit 1 }" >nul 2>nul
if not errorlevel 1 goto open
where python >nul 2>nul
if not errorlevel 1 (
    start "PromptStudio server" /min python -m http.server 8765 --bind 127.0.0.1
) else (
    start "PromptStudio server" /min py -m http.server 8765 --bind 127.0.0.1
)
timeout /t 2 /nobreak >nul
:open
start "" http://localhost:8765/prompt-studio.html
