@echo off
chcp 65001 >nul
cd /d %~dp0
title 乐动课堂 - 打包成单文件

echo ============================================
echo       正在把程序打包成可双击的单个文件
echo ============================================
echo.

if not exist "node_modules" (
    echo [提示] 首次打包，正在安装依赖，请稍候...
    call npm install
    if errorlevel 1 (
        echo [错误] 依赖安装失败，请确认已安装 Node.js
        pause
        exit /b 1
    )
)

echo [提示] 正在构建...
call npm run build
if errorlevel 1 (
    echo [错误] 构建失败
    pause
    exit /b 1
)

copy /y "dist\index.html" "乐动课堂.html" >nul

echo.
echo ============================================
echo   完成！已生成「乐动课堂.html」
echo   双击它即可直接打开程序（无需联网、无需服务器）
echo ============================================
echo.
pause
