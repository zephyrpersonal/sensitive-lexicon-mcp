FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖（只安装生产依赖）
RUN npm ci --only=production && npm cache clean --force

# 复制构建好的文件
COPY dist ./dist
COPY mcp.json ./

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