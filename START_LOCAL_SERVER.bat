@echo off
title quickslogx HRMS - Local Office Server
color 0A
cls
echo ================================================================
echo           QUICKSLOGX HRMS - LOCAL OFFICE SERVER
echo ================================================================
echo.
echo [1/3] Detecting Local Wi-Fi / LAN IP Address...
for /f "tokens=4" %%a in ('route print ^| findstr 0.0.0.0.*0.0.0.0') do (
    set LOCAL_IP=%%a
    goto :found_ip
)
:found_ip
if "%LOCAL_IP%"=="" set LOCAL_IP=192.168.100.42

echo.
echo ================================================================
echo   1. ISI COMPUTER PAR KHOLNAY K LIYE:
echo      http://localhost:3000
echo.
echo   2. OFFICE K BAQI SAB LAPTOPS / MOBILES K LIYE:
echo      http://%LOCAL_IP%:3000
echo ================================================================
echo.
echo [2/3] Checking Build...
if not exist ".next" (
    echo Production build tayyar ki ja rahi hai...
    call npm run build
)
echo.
echo [3/3] Starting Local Server on Port 3000...
echo (Is black window ko minimize rakhna hai, band nahi karna)
echo.
call npx next start -H 0.0.0.0 -p 3000
pause
