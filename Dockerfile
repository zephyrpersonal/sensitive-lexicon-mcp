FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装所有依赖（包括开发依赖，用于构建）
RUN npm ci && npm cache clean --force

# 复制源代码和配置文件
COPY src ./src
COPY tsconfig.json ./

# 构建项目
RUN npm run build

# 复制配置文件
COPY mcp.json ./

# 安装生产依赖（移除开发依赖以减小镜像大小，但保留已构建的dist目录）
RUN npm ci --only=production && npm cache clean --force

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcp -u 1001

# 切换到非root用户
USER mcp

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "process.exit(0)"

# 暴露端口（如果需要HTTP接口）
EXPOSE 3000

# 启动命令
CMD ["node", "dist/index.js"]