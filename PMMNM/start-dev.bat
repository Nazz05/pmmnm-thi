@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

REM Lấy đường dẫn thư mục hiện tại
set "PROJECT_DIR=%~dp0"

goto :main

:: main entry
:main

echo.
echo ============================================
echo   Khởi động dự án PMMNM
echo ============================================
echo.

REM Kiểm tra Node.js đã cài đặt chưa
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Lỗi: Node.js chưa được cài đặt!
    echo Vui lòng cài đặt Node.js từ https://nodejs.org/
    pause
    exit /b 1
)

echo ✓ Node.js: 
node --version

echo.
echo 🚀 Khởi động Laravel Backend...
echo.

REM Kiểm tra PHP đã cài đặt chưa
php --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Lỗi: PHP chưa được cài đặt!
    echo Vui lòng cài đặt PHP 8.3+ để chạy Laravel.
    pause
    exit /b 1
)

echo ✓ PHP: 
php --version

REM Giải phóng port backend nếu cần, rồi mở cửa sổ mới cho Backend
call :killPort 8080
start "LTWNC Laravel" cmd /k "cd /d ""%PROJECT_DIR%backend-laravel"" && php artisan serve --host=127.0.0.1 --port=8080"

timeout /t 3 /nobreak

echo.
echo 🚀 Khởi động Frontend...
echo.

REM Giải phóng port frontend (5173/5174) nếu cần, rồi mở cửa sổ mới cho Frontend
call :killPort 5173
call :killPort 5174
start "LTWNC Frontend" cmd /k "cd /d "%PROJECT_DIR%frontend" && npm run dev"

echo.
echo ============================================
echo ✅ Khởi động thành công!
echo.
echo 📍 Laravel Backend: http://localhost:8080
echo 📍 Frontend: http://localhost:5173 (hoặc 5174 nếu 5173 đang sử dụng)
echo.
echo ✋ Đóng cửa sổ này để dừng quá trình khởi động
echo ============================================
echo.

pause


REM -- Hàm: Kill process đang lắng nghe trên port được truyền vào
:killPort
setlocal
set "PORT=%~1"
if "%PORT%"=="" (
        endlocal
        goto :eof
)
echo.
echo Kiểm tra port %PORT%...
for /f "tokens=5" %%P in ('netstat -ano 2^>nul ^| findstr ":!PORT! .*LISTENING"') do (
    set "PID=%%P"
    echo Port %PORT% đang bị chiếm bởi PID %%P. Đang cố gắng kill...
    taskkill /PID %%P /F >nul 2>&1
    if errorlevel 1 (
        echo ⚠️ Không thể kill PID %%P
    ) else (
        echo ✓ Đã kill PID %%P - Port %PORT% giải phóng
        timeout /t 1 /nobreak >nul
    )
)
endlocal
goto :eof
