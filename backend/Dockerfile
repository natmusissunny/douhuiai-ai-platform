# 多阶段构建 Dockerfile

# 阶段1: 基础镜像
FROM python:3.10-slim as base

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# 安装系统依赖
RUN echo "deb http://mirrors.aliyun.com/debian bullseye main contrib non-free" > /etc/apt/sources.list \
 && echo "deb http://mirrors.aliyun.com/debian bullseye-updates main contrib non-free" >> /etc/apt/sources.list \
 && echo "deb http://mirrors.aliyun.com/debian-security bullseye-security main contrib non-free" >> /etc/apt/sources.list \
 && apt-get clean \
 && apt-get update \
 && apt-get install -y build-essential libpq-dev \
 && rm -rf /var/lib/apt/lists/*

# 阶段2: 依赖安装
FROM base as dependencies

# 复制依赖文件
COPY requirements.txt .

# 安装Python依赖
RUN pip install --user --no-cache-dir -i https://mirrors.aliyun.com/pypi/simple -r requirements.txt

# 阶段3: 最终镜像
FROM base

# 从依赖阶段复制已安装的包
COPY --from=dependencies /root/.local /root/.local

# 更新PATH
ENV PATH=/root/.local/bin:$PATH

# 复制应用代码
COPY ./app /app/app
COPY ./alembic /app/alembic
COPY alembic.ini /app/
COPY ./scripts /app/scripts

# 创建必要的目录
RUN mkdir -p /app/logs /app/uploads

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# 启动命令
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
