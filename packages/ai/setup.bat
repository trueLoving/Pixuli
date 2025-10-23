@echo off
setlocal enabledelayedexpansion

REM Pixuli AI Package Setup Script for Windows
REM 自动化安装和配置 pixuli-ai 包的环境

title Pixuli AI Package Setup

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    Pixuli AI Package Setup                   ║
echo ║                                                              ║
echo ║              自动化安装和配置 AI 分析包环境                    ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM 设置变量
set "PYTHON_CMD=python"
set "PIP_CMD=pip"
set "NODE_CMD=node"
set "NPM_CMD=npm"
set "PNPM_CMD=pnpm"
set "PACKAGE_MANAGER="
set "CLEAN_ONLY=false"
set "BUILD_ONLY=false"
set "TEST_ONLY=false"
set "NO_BUILD=false"
set "NO_TEST=false"
set "USE_VENV=false"
set "FORCE_INSTALL=false"

REM 解析命令行参数
:parse_args
if "%~1"=="" goto :start_setup
if "%~1"=="--help" goto :show_help
if "%~1"=="-h" goto :show_help
if "%~1"=="--clean" set "CLEAN_ONLY=true" & shift & goto :parse_args
if "%~1"=="--build-only" set "BUILD_ONLY=true" & shift & goto :parse_args
if "%~1"=="--test-only" set "TEST_ONLY=true" & shift & goto :parse_args
if "%~1"=="--no-build" set "NO_BUILD=true" & shift & goto :parse_args
if "%~1"=="--no-test" set "NO_TEST=true" & shift & goto :parse_args
if "%~1"=="--venv" set "USE_VENV=true" & shift & goto :parse_args
if "%~1"=="--force" set "FORCE_INSTALL=true" & shift & goto :parse_args
echo ❌ 未知选项: %~1
goto :show_help

:show_help
echo Pixuli AI Package Setup Script
echo.
echo 用法: %~nx0 [选项]
echo.
echo 选项:
echo   --help, -h              显示此帮助信息
echo   --clean                 清理构建文件
echo   --build-only            仅构建二进制文件
echo   --test-only             仅运行测试
echo   --no-build              跳过构建步骤
echo   --no-test               跳过测试步骤
echo   --venv                  使用 Python 虚拟环境
echo   --force                 强制重新安装依赖
echo.
echo 示例:
echo   %~nx0                    # 完整安装和构建
echo   %~nx0 --clean            # 清理构建文件
echo   %~nx0 --build-only       # 仅构建二进制文件
echo   %~nx0 --venv             # 使用虚拟环境安装
echo.
pause
exit /b 0

:start_setup
echo ℹ️  系统信息:
echo   操作系统: %OS% %PROCESSOR_ARCHITECTURE%
echo   工作目录: %CD%
echo.

REM 仅清理模式
if "%CLEAN_ONLY%"=="true" goto :clean_build

REM 仅测试模式
if "%TEST_ONLY%"=="true" goto :run_tests

REM 仅构建模式
if "%BUILD_ONLY%"=="true" goto :build_binary

REM 环境检查
call :check_python
if errorlevel 1 exit /b 1

call :check_pip
if errorlevel 1 exit /b 1

call :check_nodejs
if errorlevel 1 exit /b 1

call :check_package_manager
if errorlevel 1 exit /b 1

REM 安装依赖
if "%FORCE_INSTALL%"=="true" (
    echo ℹ️  强制重新安装依赖...
    call :clean_build
)

call :install_python_deps
if errorlevel 1 exit /b 1

call :install_nodejs_deps
if errorlevel 1 exit /b 1

REM 构建二进制文件
if "%NO_BUILD%"=="false" (
    call :build_binary
    if errorlevel 1 exit /b 1
) else (
    echo ⚠️  跳过构建步骤
)

REM 运行测试
if "%NO_TEST%"=="false" (
    call :run_tests
    if errorlevel 1 exit /b 1
) else (
    echo ⚠️  跳过测试步骤
)

REM 完成提示
echo.
echo ✅ 🎉 Pixuli AI 包安装完成！
echo.
echo ℹ️  下一步操作：
echo   1. 将构建的二进制文件复制到 Electron 应用的 resources/bin/ 目录
echo   2. 在 Electron 应用中配置模型路径
echo   3. 开始使用 AI 图像分析功能
echo.
echo ℹ️  有用的命令：
echo   npm run build:all    # 重新构建所有内容
echo   npm run test         # 运行测试
echo   npm run clean        # 清理构建文件
echo.

if "%USE_VENV%"=="true" (
    echo ℹ️  注意：虚拟环境已激活，退出时请运行 'deactivate'
)

pause
exit /b 0

REM 检查 Python 环境
:check_python
echo 🚀 检查 Python 环境...

where python >nul 2>&1
if errorlevel 1 (
    echo ❌ Python 未安装，请先安装 Python 3.8+
    echo 安装指南：
    echo   访问: https://www.python.org/downloads/
    echo   或使用: winget install Python.Python.3.11
    exit /b 1
)

REM 检查 Python 版本
for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo ✅ Python %PYTHON_VERSION% 已安装
exit /b 0

REM 检查 pip
:check_pip
echo 🚀 检查 pip...

where pip >nul 2>&1
if errorlevel 1 (
    echo ❌ pip 未安装，请先安装 pip
    echo 安装指南：
    echo   python -m ensurepip --upgrade
    echo   或重新安装 Python
    exit /b 1
)

echo ✅ pip 已安装
exit /b 0

REM 检查 Node.js 环境
:check_nodejs
echo 🚀 检查 Node.js 环境...

where node >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js 未安装，请先安装 Node.js 16+
    echo 安装指南：
    echo   访问: https://nodejs.org/
    echo   或使用: winget install OpenJS.NodeJS
    exit /b 1
)

REM 检查 Node.js 版本
for /f "tokens=1" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% 已安装
exit /b 0

REM 检查包管理器
:check_package_manager
echo 🚀 检查包管理器...

where pnpm >nul 2>&1
if not errorlevel 1 (
    set "PACKAGE_MANAGER=pnpm"
    echo ✅ pnpm 已安装
    exit /b 0
)

where npm >nul 2>&1
if not errorlevel 1 (
    set "PACKAGE_MANAGER=npm"
    echo ✅ npm 已安装
    exit /b 0
)

echo ❌ 未找到包管理器 (npm 或 pnpm)
exit /b 1

REM 安装 Python 依赖
:install_python_deps
echo 🚀 安装 Python 依赖...

if not exist "requirements.txt" (
    echo ❌ requirements.txt 文件不存在
    exit /b 1
)

REM 创建虚拟环境（可选）
if "%USE_VENV%"=="true" (
    echo ℹ️  创建 Python 虚拟环境...
    python -m venv venv
    call venv\Scripts\activate.bat
    echo ✅ 虚拟环境已创建并激活
)

REM 升级 pip
echo ℹ️  升级 pip...
python -m pip install --upgrade pip

REM 安装依赖
echo ℹ️  安装 Python 依赖包...
python -m pip install -r requirements.txt

echo ✅ Python 依赖安装完成
exit /b 0

REM 安装 Node.js 依赖
:install_nodejs_deps
echo 🚀 安装 Node.js 依赖...

if not exist "package.json" (
    echo ❌ package.json 文件不存在
    exit /b 1
)

echo ℹ️  使用 %PACKAGE_MANAGER% 安装依赖...
%PACKAGE_MANAGER% install

echo ✅ Node.js 依赖安装完成
exit /b 0

REM 构建二进制文件
:build_binary
echo 🚀 构建 AI 分析器二进制文件...

if not exist "scripts\build_qwen.bat" (
    echo ❌ Windows 构建脚本不存在，尝试使用 Python 脚本...
    if not exist "scripts\build_qwen_analyzer.py" (
        echo ❌ 构建脚本不存在
        exit /b 1
    )
)

REM 确保脚本存在
if exist "scripts\build_qwen.bat" (
    echo ℹ️  开始构建...
    call scripts\build_qwen.bat
) else (
    echo ℹ️  使用 Python 构建脚本...
    python scripts\build_qwen_analyzer.py
)

echo ✅ 二进制文件构建完成
exit /b 0

REM 运行测试
:run_tests
echo 🚀 运行测试...

if exist "scripts\test_qwen.py" (
    echo ℹ️  运行 Python 测试...
    python scripts\test_qwen.py
    echo ✅ 测试完成
) else (
    echo ⚠️  测试文件不存在，跳过测试
)

exit /b 0

REM 清理构建文件
:clean_build
echo 🚀 清理构建文件...

if exist "dist" (
    rmdir /s /q dist
    echo ✅ dist 目录已清理
)

if exist "resources\bin" (
    rmdir /s /q resources\bin
    echo ✅ resources\bin 目录已清理
)

REM 清理 Python 缓存
for /d /r . %%d in (__pycache__) do @if exist "%%d" rmdir /s /q "%%d"
for /r . %%f in (*.pyc) do @if exist "%%f" del "%%f"

echo ✅ 构建文件清理完成
exit /b 0
