# Multi-stage build for frontend

# Stage 1: Build
FROM alibaba-cloud-linux-3-registry.cn-hangzhou.cr.aliyuncs.com/alinux3/node:20.16 AS builder

WORKDIR /app

# 以 root 身份安装依赖，避免权限问题
USER root

# Copy package files
COPY package*.json ./

# Install dependencies（使用淘宝镜像加速）
RUN npm config set registry https://registry.npmmirror.com && npm install

# Copy source code
COPY . .

# 接收构建参数，Vite 在构建时读取环境变量
ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Build application
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
