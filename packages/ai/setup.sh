#!/bin/bash

# Pixuli AI Package Setup Script
# 自动化安装和配置 pixuli-ai 包的环境

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_step() {
    echo -e "${PURPLE}🚀 $1${NC}"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检查 Python 环境
check_python() {
    log_step "检查 Python 环境..."

    if ! command_exists python3; then
        log_error "Python 3 未安装，请先安装 Python 3.8+"
        echo "安装指南："
        echo "  macOS: brew install python3"
        echo "  Ubuntu/Debian: sudo apt install python3 python3-pip"
        echo "  CentOS/RHEL: sudo yum install python3 python3-pip"
        exit 1
    fi

    # 检查 Python 版本
    PYTHON_VERSION=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
    PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
    PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)

    if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 8 ]); then
        log_error "Python 版本过低 ($PYTHON_VERSION)，需要 Python 3.8+"
        exit 1
    fi

    log_success "Python $PYTHON_VERSION 已安装"
}

# 检查 pip
check_pip() {
    log_step "检查 pip..."

    if ! command_exists pip3; then
        log_error "pip3 未安装，请先安装 pip"
        echo "安装指南："
        echo "  macOS: python3 -m ensurepip --upgrade"
        echo "  Ubuntu/Debian: sudo apt install python3-pip"
        echo "  CentOS/RHEL: sudo yum install python3-pip"
        exit 1
    fi

    log_success "pip3 已安装"
}

# 检查 Node.js 环境
check_nodejs() {
    log_step "检查 Node.js 环境..."

    if ! command_exists node; then
        log_error "Node.js 未安装，请先安装 Node.js 16+"
        echo "安装指南："
        echo "  macOS: brew install node"
        echo "  Ubuntu/Debian: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
        echo "  CentOS/RHEL: curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash - && sudo yum install -y nodejs"
        echo "  或访问: https://nodejs.org/"
        exit 1
    fi

    # 检查 Node.js 版本
    NODE_VERSION=$(node --version | sed 's/v//')
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1)

    if [ "$NODE_MAJOR" -lt 16 ]; then
        log_error "Node.js 版本过低 ($NODE_VERSION)，需要 Node.js 16+"
        exit 1
    fi

    log_success "Node.js $NODE_VERSION 已安装"
}

# 检查 npm/pnpm
check_package_manager() {
    log_step "检查包管理器..."

    if command_exists pnpm; then
        PACKAGE_MANAGER="pnpm"
        log_success "pnpm 已安装"
    elif command_exists npm; then
        PACKAGE_MANAGER="npm"
        log_success "npm 已安装"
    else
        log_error "未找到包管理器 (npm 或 pnpm)"
        exit 1
    fi
}

# 安装 Python 依赖
install_python_deps() {
    log_step "安装 Python 依赖..."

    if [ ! -f "requirements.txt" ]; then
        log_error "requirements.txt 文件不存在"
        exit 1
    fi

    # 创建虚拟环境（可选）
    if [ "$1" = "--venv" ]; then
        log_info "创建 Python 虚拟环境..."
        python3 -m venv venv
        source venv/bin/activate
        log_success "虚拟环境已创建并激活"
    fi

    # 升级 pip
    log_info "升级 pip..."
    python3 -m pip install --upgrade pip

    # 安装依赖
    log_info "安装 Python 依赖包..."
    python3 -m pip install -r requirements.txt

    log_success "Python 依赖安装完成"
}

# 安装 Node.js 依赖
install_nodejs_deps() {
    log_step "安装 Node.js 依赖..."

    if [ ! -f "package.json" ]; then
        log_error "package.json 文件不存在"
        exit 1
    fi

    log_info "使用 $PACKAGE_MANAGER 安装依赖..."
    $PACKAGE_MANAGER install

    log_success "Node.js 依赖安装完成"
}

# 构建二进制文件
build_binary() {
    log_step "构建 AI 分析器二进制文件..."

    if [ ! -f "scripts/build_qwen.sh" ]; then
        log_error "构建脚本不存在"
        exit 1
    fi

    # 确保脚本有执行权限
    chmod +x scripts/build_qwen.sh

    # 运行构建脚本
    log_info "开始构建..."
    bash scripts/build_qwen.sh

    log_success "二进制文件构建完成"
}

# 运行测试
run_tests() {
    log_step "运行测试..."

    if [ -f "scripts/test_qwen.py" ]; then
        log_info "运行 Python 测试..."
        python3 scripts/test_qwen.py
        log_success "测试完成"
    else
        log_warning "测试文件不存在，跳过测试"
    fi
}

# 清理构建文件
clean_build() {
    log_step "清理构建文件..."

    if [ -d "dist" ]; then
        rm -rf dist/*
        log_success "dist 目录已清理"
    fi

    if [ -d "resources/bin" ]; then
        rm -rf resources/bin/*
        log_success "resources/bin 目录已清理"
    fi

    # 清理 Python 缓存
    find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
    find . -name "*.pyc" -delete 2>/dev/null || true

    log_success "构建文件清理完成"
}

# 显示帮助信息
show_help() {
    echo "Pixuli AI Package Setup Script"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --help, -h              显示此帮助信息"
    echo "  --clean                 清理构建文件"
    echo "  --build-only            仅构建二进制文件"
    echo "  --test-only             仅运行测试"
    echo "  --no-build              跳过构建步骤"
    echo "  --no-test               跳过测试步骤"
    echo "  --venv                  使用 Python 虚拟环境"
    echo "  --force                 强制重新安装依赖"
    echo ""
    echo "示例:"
    echo "  $0                      # 完整安装和构建"
    echo "  $0 --clean              # 清理构建文件"
    echo "  $0 --build-only         # 仅构建二进制文件"
    echo "  $0 --venv               # 使用虚拟环境安装"
    echo ""
}

# 显示系统信息
show_system_info() {
    log_info "系统信息:"
    echo "  操作系统: $(uname -s) $(uname -m)"
    echo "  Python: $(python3 --version)"
    echo "  Node.js: $(node --version)"
    echo "  包管理器: $PACKAGE_MANAGER"
    echo "  工作目录: $(pwd)"
    echo ""
}

# 主函数
main() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    Pixuli AI Package Setup                   ║"
    echo "║                                                              ║"
    echo "║              自动化安装和配置 AI 分析包环境                    ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    # 解析命令行参数
    CLEAN_ONLY=false
    BUILD_ONLY=false
    TEST_ONLY=false
    NO_BUILD=false
    NO_TEST=false
    USE_VENV=false
    FORCE_INSTALL=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            --help|-h)
                show_help
                exit 0
                ;;
            --clean)
                CLEAN_ONLY=true
                shift
                ;;
            --build-only)
                BUILD_ONLY=true
                shift
                ;;
            --test-only)
                TEST_ONLY=true
                shift
                ;;
            --no-build)
                NO_BUILD=true
                shift
                ;;
            --no-test)
                NO_TEST=true
                shift
                ;;
            --venv)
                USE_VENV=true
                shift
                ;;
            --force)
                FORCE_INSTALL=true
                shift
                ;;
            *)
                log_error "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # 显示系统信息
    show_system_info

    # 仅清理模式
    if [ "$CLEAN_ONLY" = true ]; then
        clean_build
        exit 0
    fi

    # 仅测试模式
    if [ "$TEST_ONLY" = true ]; then
        run_tests
        exit 0
    fi

    # 仅构建模式
    if [ "$BUILD_ONLY" = true ]; then
        build_binary
        exit 0
    fi

    # 环境检查
    check_python
    check_pip
    check_nodejs
    check_package_manager

    # 安装依赖
    if [ "$FORCE_INSTALL" = true ]; then
        log_info "强制重新安装依赖..."
        clean_build
    fi

    install_python_deps $([ "$USE_VENV" = true ] && echo "--venv")
    install_nodejs_deps

    # 构建二进制文件
    if [ "$NO_BUILD" = false ]; then
        build_binary
    else
        log_warning "跳过构建步骤"
    fi

    # 运行测试
    if [ "$NO_TEST" = false ]; then
        run_tests
    else
        log_warning "跳过测试步骤"
    fi

    # 完成提示
    echo ""
    log_success "🎉 Pixuli AI 包安装完成！"
    echo ""
    log_info "下一步操作："
    echo "  1. 将构建的二进制文件复制到 Electron 应用的 resources/bin/ 目录"
    echo "  2. 在 Electron 应用中配置模型路径"
    echo "  3. 开始使用 AI 图像分析功能"
    echo ""
    log_info "有用的命令："
    echo "  npm run build:all    # 重新构建所有内容"
    echo "  npm run test         # 运行测试"
    echo "  npm run clean        # 清理构建文件"
    echo ""

    if [ "$USE_VENV" = true ]; then
        log_info "注意：虚拟环境已激活，退出时请运行 'deactivate'"
    fi
}

# 捕获中断信号
trap 'log_error "安装被中断"; exit 1' INT TERM

# 运行主函数
main "$@"
