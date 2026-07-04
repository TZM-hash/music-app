@echo off
chcp 65001 >nul
cd /d %~dp0
title 乐动课堂 - 音乐探索启动器

echo ============================================
echo            乐动课堂 音乐探索互动空间
echo ============================================
echo.

REM 首次运行若未安装依赖，自动安装
if not exist "node_modules" (
    echo [提示] 首次运行，正在安装依赖，请稍候...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo [错误] 依赖安装失败，请确认已安装 Node.js
        pause
        exit /b 1
    )
    echo.
)

echo [提示] 正在启动开发服务器...
echo [提示] 稍后浏览器将自动打开 http://localhost:5173
echo [提示] 关闭此窗口即可停止程序
echo.

REM 延迟 3 秒后自动打开浏览器
start "" /min cmd /c "timeout /t 3 >nul & start http://localhost:5173"

REM 启动 dev server（占用当前窗口）
call npm run dev

pause
