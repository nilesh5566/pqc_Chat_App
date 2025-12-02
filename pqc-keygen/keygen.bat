@echo off
REM Key Generation Script for Windows
REM Runs the JavaScript key generator

echo Starting Key Generator...
echo.

node keygen.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Key generation failed!
    echo Make sure Node.js is installed.
    echo.
    pause
    exit /b 1
)

echo.
echo Press any key to exit...
pause > nul