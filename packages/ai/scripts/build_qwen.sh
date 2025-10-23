#!/bin/bash

# Qwen Analyzer 构建脚本
# 用于将Python脚本打包成二进制文件

set -e

echo "🚀 Starting Qwen Analyzer build process..."

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found. Please install Python 3.8+ first."
    exit 1
fi

# 检查pip
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 not found. Please install pip first."
    exit 1
fi

# 进入脚本目录
cd "$(dirname "$0")"

echo "📦 Installing Python dependencies..."
pip3 install -r ../requirements.txt

echo "🔨 Building Qwen analyzer binary..."
python3 build_qwen_analyzer.py

# 检查构建结果
PLATFORM=$(uname -s)
if [ "$PLATFORM" = "Darwin" ]; then
    BINARY_NAME="qwen_analyzer"
elif [ "$PLATFORM" = "Linux" ]; then
    BINARY_NAME="qwen_analyzer"
elif [ "$PLATFORM" = "MINGW"* ] || [ "$PLATFORM" = "CYGWIN"* ]; then
    BINARY_NAME="qwen_analyzer.exe"
else
    echo "❌ Unsupported platform: $PLATFORM"
    exit 1
fi

BINARY_PATH="../dist/$BINARY_NAME"

if [ -f "$BINARY_PATH" ]; then
    echo "✅ Build successful!"
    echo "📦 Binary: $BINARY_PATH"
    echo "📏 Size: $(du -h "$BINARY_PATH" | cut -f1)"

    # 设置执行权限
    chmod +x "$BINARY_PATH"

    echo ""
    echo "🎉 Qwen Analyzer binary is ready!"
    echo "💡 You can now copy this binary to your Electron app's resources/bin/ directory"

    # 创建部署目录
    mkdir -p ../resources/bin
    cp "$BINARY_PATH" ../resources/bin/
    echo "📁 Binary copied to ../resources/bin/"

else
    echo "❌ Build failed - binary not found"
    exit 1
fi
