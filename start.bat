@echo off
chcp 65001 >nul
:: ==============================================================================
:: The Story Video Studio - Khởi Động Trên Windows
:: ==============================================================================

cd /d "%~dp0"

echo ==================================================================
echo 🎬 DANG KHOI DONG REELS STORY STUDIO (PORTABLE)...
echo ==================================================================

:: Kiem tra Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [LOI] May cua ban chua cai dat Node.js!
    echo Vui long truy cap https://nodejs.org de tai va cai dat Node.js (ban LTS).
    echo Nhan phim bat ky de thoat...
    pause >nul
    exit /b 1
)

:: Tu dong cai dat thu vien neu chua co node_modules
if not exist "node_modules\" (
    echo [THONG BAO] Dang tu dong cai dat thu vien (npm install)...
    call npm install
    if %errorlevel% neq 0 (
        echo [LOI] Cai dat that bai! Vui long kiem tra ket noi mang.
        pause
        exit /b 1
    )
)

set PORT=8090

:: Mo trinh duyet sau 2 giay
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:%PORT%"

:: Chay server
node server.js

pause
