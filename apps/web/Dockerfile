# 多阶段构建 Dockerfile for Pixuli Web

# 第一阶段：构建应用
FROM node:22-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm@10

# 复制根目录的 package.json 和 pnpm-lock.yaml（如果存在）
COPY package.json pnpm-lock.yaml* ./

# 复制所有 packages 目录
COPY packages ./packages

# 复制 web 应用的 package.json
COPY apps/web/package.json ./apps/web/

# 安装依赖（从根目录安装，支持 workspace）
RUN pnpm install --frozen-lockfile

# 复制 web 应用源代码
COPY apps/web ./apps/web

# 构建应用
WORKDIR /app/apps/web
RUN pnpm run build

# 第二阶段：使用 nginx 提供静态文件
FROM nginx:alpine

# 复制构建产物到 nginx 目录
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# 复制 nginx 配置文件
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
