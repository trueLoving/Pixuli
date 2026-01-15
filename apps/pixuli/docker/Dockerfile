# 优化后的 Dockerfile for Pixuli Web
# 注意：此 Dockerfile 假设应用已在本地构建完成，dist 目录已存在
# 构建流程：先在本地执行 pnpm build:web，然后再构建 Docker 镜像
# 环境变量：需要在构建时通过 .env 文件配置，环境变量会被注入到构建产物中
#
# 构建命令（从项目根目录执行）：
# docker build -f apps/pixuli/docker/Dockerfile -t pixuli-web .

# 使用 nginx 提供静态文件服务
FROM nginx:alpine

# 复制构建产物到 nginx 目录
COPY apps/pixuli/dist /usr/share/nginx/html

# 复制 nginx 配置文件
COPY apps/pixuli/docker/nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
