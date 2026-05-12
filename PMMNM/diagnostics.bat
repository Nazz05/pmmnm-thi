@echo off
REM Diagnostic script to check backend connectivity from other machines

setlocal enabledelayedexpansion

echo.
echo ============================================
echo   LTWNC Backend Diagnostics
echo ============================================
echo.

echo [1] Checking port 8080...
netstat -ano | findstr ":8080" >nul
if errorlevel 1 (
    echo ❌ Port 8080 is NOT listening
) else (
    echo ✅ Port 8080 is LISTENING
    netstat -ano | findstr ":8080"
)
echo.

echo [2] Testing local API...
powershell -NoProfile -Command "try { $r = Invoke-WebRequest 'http://localhost:8080/' -TimeoutSec 5 -SkipHttpErrorCheck; Write-Host \"✅ Status: $($r.StatusCode)\" } catch { Write-Host \"❌ Error: $_\" }"
echo.

echo [3] Testing local API endpoint...
powershell -NoProfile -Command "try { $r = Invoke-WebRequest 'http://localhost:8080/api/auth/login' -Method POST -ContentType 'application/json' -Body '{\"email\":\"test\"}' -TimeoutSec 5 -SkipHttpErrorCheck; Write-Host \"✅ Status: $($r.StatusCode)\"; Write-Host \"Response: $($r.Content)\"; } catch { Write-Host \"❌ Error: $_\" }"
echo.

echo [4] Local IP Addresses:
ipconfig | findstr "IPv4"
echo.

echo [5] Frontend Auto-Detection Logic:
echo When accessing from:
echo   - localhost/127.0.0.1 ^> uses http://localhost:8080/api
echo   - Other domain/IP    ^> uses https://hnamofficial.id.vn/api
echo.

echo [6] Solution for testing from other machine:
echo   Option 1: Set VITE_API_URL=http://^<your-machine-ip^>:8080/api
echo   Option 2: Configure DNS to point hnamofficial.id.vn to your machine
echo   Option 3: Use VITE_API_URL_PROD environment variable
echo.

echo ============================================
pause
