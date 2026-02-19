@echo off
setlocal
cd /d "%~dp0"

rem Use pnpm to ensure tsx is found, and forward all args.
pnpm tsx resvg.ts --force %*

rem If tsx/pnpm failed before the script could run, keep window open.
if errorlevel 1 (
    echo Press any key to exit
    pause >nul
)