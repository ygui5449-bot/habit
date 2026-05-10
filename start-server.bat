@echo off
chcp 65001 >nul
cd /d "D:\Desktop\habit-tracker"

echo.
echo  ╔══════════════════════════════════════╗
echo  ║       习惯追踪 - 本地服务器         ║
echo  ╚══════════════════════════════════════╝
echo.

REM Get local IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set ip=%%a
    set ip=!ip: =!
    if not "!ip!"=="127.0.0.1" (
        echo  📱 手机浏览器打开:
        echo     http://!ip!:8080
        echo.
    )
)

echo  💻 电脑浏览器打开:
echo     http://localhost:8080
echo.
echo  按 Ctrl+C 停止服务器
echo  ═══════════════════════════════════════
echo.

python -m http.server 8080
pause
