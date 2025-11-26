#!/bin/bash

# Pixuli Web Docker 本地构建脚本
# 使用方法: ./build-docker.sh [版本标签]
#
# 构建流程：
# 1. 先在本地构建应用（生成 dist 目录）
# 2. 然后构建 Docker 镜像（仅包含 nginx 和静态文件）
#
# CI 模式：
# 设置环境变量 CI=true 可启用非交互模式，自动执行所有步骤

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取版本标签，默认为 latest
VERSION=${1:-latest}
IMAGE_NAME="pixuli-web"
FULL_IMAGE_NAME="${IMAGE_NAME}:${VERSION}"

# 获取项目根目录（脚本所在目录的父目录的父目录）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
DIST_DIR="${SCRIPT_DIR}/dist"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Pixuli Web Docker 镜像本地构建${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误: 未检测到 Docker，请先安装 Docker${NC}"
    exit 1
fi

# 检查 Node.js 和 pnpm
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未检测到 Node.js，请先安装 Node.js${NC}"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}错误: 未检测到 pnpm，请先安装 pnpm${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 构建信息:${NC}"
echo "  镜像名称: ${FULL_IMAGE_NAME}"
echo "  构建上下文: ${PROJECT_ROOT}"
echo "  Dockerfile: ${SCRIPT_DIR}/Dockerfile"
echo "  构建产物目录: ${DIST_DIR}"
echo ""

# 检查 .env 文件
ENV_FILE="${SCRIPT_DIR}/.env"
ENV_EXAMPLE="${SCRIPT_DIR}/env.example"

if [ -f "${ENV_FILE}" ]; then
    echo -e "${GREEN}✓ 检测到 .env 文件: ${ENV_FILE}${NC}"
    echo "  环境变量将在构建时注入到应用中"
    echo ""
elif [ -f "${ENV_EXAMPLE}" ]; then
    echo -e "${YELLOW}⚠️  未检测到 .env 文件${NC}"
    echo "  提示: 可以复制 ${ENV_EXAMPLE} 为 .env 并配置环境变量"
    echo ""
fi

# 检查是否为 CI 环境
CI_MODE=${CI:-false}
if [ "$CI_MODE" = "true" ] || [ "$CI" = "1" ]; then
    CI_MODE=true
    echo -e "${BLUE}🔧 CI 模式已启用（非交互式）${NC}"
    echo ""
else
    CI_MODE=false
fi

# 检查 dist 目录是否存在
if [ ! -d "${DIST_DIR}" ] || [ -z "$(ls -A ${DIST_DIR} 2>/dev/null)" ]; then
    echo -e "${YELLOW}⚠️  未检测到构建产物，将先执行本地构建...${NC}"
    echo ""

    # CI 模式下自动构建，非 CI 模式下询问用户
    if [ "$CI_MODE" = "true" ]; then
        BUILD_APP=true
        echo -e "${BLUE}  CI 模式：自动执行应用构建${NC}"
        echo ""
    else
        # 确认是否执行构建
        read -p "是否现在构建应用? (Y/n): " -n 1 -r
        echo
        BUILD_APP=true
        if [[ $REPLY =~ ^[Nn]$ ]]; then
            BUILD_APP=false
        fi
    fi

    if [ "$BUILD_APP" = "true" ]; then
        echo ""
        echo -e "${BLUE}📦 步骤 1/2: 构建应用...${NC}"
        echo ""

        cd "${PROJECT_ROOT}"

        # 如果存在 .env 文件，Vite 会自动读取（从 apps/web 目录）
        if [ -f "${ENV_FILE}" ]; then
            echo -e "${BLUE}  使用 .env 文件中的环境变量进行构建...${NC}"
        fi

        # Vite 会自动从 apps/web 目录读取 .env 文件
        pnpm build:web

        if [ $? -ne 0 ]; then
            echo ""
            echo -e "${RED}❌ 应用构建失败！${NC}"
            exit 1
        fi

        echo ""
        echo -e "${GREEN}✅ 应用构建完成！${NC}"
        echo ""
    else
        echo -e "${YELLOW}构建已跳过，请确保 dist 目录存在后再运行此脚本${NC}"
        exit 0
    fi
else
    echo -e "${GREEN}✓ 检测到构建产物，将直接构建 Docker 镜像${NC}"
    echo ""
fi

# CI 模式下自动构建，非 CI 模式下询问用户
if [ "$CI_MODE" = "true" ]; then
    BUILD_DOCKER=true
    echo -e "${BLUE}  CI 模式：自动执行 Docker 镜像构建${NC}"
    echo ""
else
    # 确认构建 Docker 镜像
    read -p "是否开始构建 Docker 镜像? (y/N): " -n 1 -r
    echo
    BUILD_DOCKER=true
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        BUILD_DOCKER=false
    fi
fi

if [ "$BUILD_DOCKER" = "false" ]; then
    echo -e "${YELLOW}构建已取消${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}📦 步骤 2/2: 构建 Docker 镜像...${NC}"
echo ""

# 构建镜像
cd "${PROJECT_ROOT}"
docker build \
    -f "${SCRIPT_DIR}/Dockerfile" \
    -t "${FULL_IMAGE_NAME}" \
    -t "${IMAGE_NAME}:latest" \
    .

# 检查构建结果
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Docker 镜像构建成功！${NC}"
    echo ""
    echo -e "${YELLOW}📋 镜像信息:${NC}"
    docker images | grep "${IMAGE_NAME}" | head -2
    echo ""
    echo -e "${YELLOW}💡 使用说明:${NC}"
    echo ""
    echo "运行容器:"
    echo -e "  ${GREEN}docker run -d -p 8080:80 --name pixuli-web ${FULL_IMAGE_NAME}${NC}"
    echo ""
    echo -e "${BLUE}💡 提示:${NC}"
    echo "  环境变量需要在构建时通过 .env 文件配置"
    echo "  修改环境变量后需要重新构建应用和镜像"
    echo ""
    echo "查看容器日志:"
    echo -e "  ${GREEN}docker logs -f pixuli-web${NC}"
    echo ""
    echo "停止容器:"
    echo -e "  ${GREEN}docker stop pixuli-web${NC}"
    echo ""
    echo "启动已停止的容器:"
    echo -e "  ${GREEN}docker start pixuli-web${NC}"
    echo ""
    echo "删除容器:"
    echo -e "  ${GREEN}docker rm pixuli-web${NC}"
    echo ""
    echo "访问应用:"
    echo -e "  ${GREEN}http://localhost:8080${NC}"
    echo ""
    echo -e "${BLUE}💾 镜像大小优化:${NC}"
    echo "  此镜像仅包含 nginx 和静态文件，不包含 Node.js 构建环境"
    echo "  镜像大小相比之前减少了约 200-300MB"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Docker 镜像构建失败！${NC}"
    exit 1
fi
