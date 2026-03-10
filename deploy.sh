#!/usr/bin/env bash
# =============================================================================
# 豆绘AI平台 - 一键部署脚本
# 用法: bash deploy.sh [--prod]
#   不带参数：本地开发模式（热重载，DEBUG=True）
#   --prod   ：生产模式（自动生成随机密钥）
# =============================================================================

set -euo pipefail

# ---------- 颜色输出 ----------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ---------- 解析参数 ----------
PROD_MODE=false
for arg in "$@"; do
  case $arg in
    --prod) PROD_MODE=true ;;
    --help|-h)
      echo "用法: bash deploy.sh [--prod]"
      echo "  不带参数  本地开发模式（热重载）"
      echo "  --prod    生产模式（自动生成随机密钥）"
      exit 0 ;;
    *) warn "未知参数: $arg，忽略" ;;
  esac
done

echo ""
echo "================================================"
echo "       豆绘AI平台 一键部署脚本"
if $PROD_MODE; then
  echo "       模式: 生产 (Production)"
else
  echo "       模式: 本地开发 (Development)"
fi
echo "================================================"
echo ""

# ---------- 环境检查 ----------
info "检查依赖环境..."

command -v docker  >/dev/null 2>&1 || error "未找到 docker，请先安装 Docker Desktop"
command -v docker  >/dev/null 2>&1 && docker compose version >/dev/null 2>&1 || error "未找到 docker compose（需要 Docker Compose v2 插件）"

DOCKER_VERSION=$(docker version --format '{{.Server.Version}}' 2>/dev/null || echo "unknown")
success "Docker: $DOCKER_VERSION"
success "Docker Compose: $(docker compose version --short 2>/dev/null || echo 'ok')"

# ---------- 进入项目目录 ----------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
info "项目目录: $SCRIPT_DIR"

# ---------- 配置 .env ----------
if [ ! -f ".env" ]; then
  info "未找到 .env，从 .env.example 复制..."
  cp .env.example .env
  success ".env 已创建"
fi

# 检查豆绘API密钥是否已填写
APP_ID=$(grep -E '^DOUHUIAI_APP_ID=' .env | cut -d'=' -f2 | tr -d '"' | tr -d "'" | xargs)
APP_SECRET=$(grep -E '^DOUHUIAI_APP_SECRET=' .env | cut -d'=' -f2 | tr -d '"' | tr -d "'" | xargs)

if [ -z "$APP_ID" ] || [ -z "$APP_SECRET" ]; then
  echo ""
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  warn "请先填写豆绘AI API 密钥（必须）："
  echo ""
  echo "  编辑 .env 文件，填写以下两项："
  echo "    DOUHUIAI_APP_ID=<你的AppID>"
  echo "    DOUHUIAI_APP_SECRET=<你的AppSecret>"
  echo ""
  echo "  密钥可在豆绘AI开放平台获取：https://open.douhuiai.com"
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  read -r -p "已填写密钥，按回车继续；或按 Ctrl+C 退出... "
  # 重新读取
  APP_ID=$(grep -E '^DOUHUIAI_APP_ID=' .env | cut -d'=' -f2 | tr -d '"' | tr -d "'" | xargs)
  APP_SECRET=$(grep -E '^DOUHUIAI_APP_SECRET=' .env | cut -d'=' -f2 | tr -d '"' | tr -d "'" | xargs)
  [ -z "$APP_ID" ] || [ -z "$APP_SECRET" ] && error "密钥仍为空，请填写后重新运行"
fi
success "豆绘API密钥已配置"

# 生产模式：自动生成安全密钥
if $PROD_MODE; then
  info "生产模式：检查安全密钥..."

  SECRET_KEY=$(grep -E '^SECRET_KEY=' .env | cut -d'=' -f2 | tr -d '"' | tr -d "'" | xargs)
  if [ -z "$SECRET_KEY" ] || [[ "$SECRET_KEY" == *"change"* ]] || [[ "$SECRET_KEY" == *"secret"* ]]; then
    NEW_SECRET=$(openssl rand -hex 32 2>/dev/null || python3 -c "import secrets; print(secrets.token_hex(32))")
    # 替换 .env 中的 SECRET_KEY
    if grep -q '^SECRET_KEY=' .env; then
      sed -i.bak "s|^SECRET_KEY=.*|SECRET_KEY=$NEW_SECRET|" .env && rm -f .env.bak
    else
      echo "SECRET_KEY=$NEW_SECRET" >> .env
    fi
    success "SECRET_KEY 已自动生成"
  fi

  PG_PASS=$(grep -E '^POSTGRES_PASSWORD=' .env | cut -d'=' -f2 | tr -d '"' | tr -d "'" | xargs)
  if [ -z "$PG_PASS" ] || [ "$PG_PASS" = "douhuiai_password" ]; then
    NEW_PG_PASS=$(openssl rand -hex 16 2>/dev/null || python3 -c "import secrets; print(secrets.token_hex(16))")
    if grep -q '^POSTGRES_PASSWORD=' .env; then
      sed -i.bak "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$NEW_PG_PASS|" .env && rm -f .env.bak
    else
      echo "POSTGRES_PASSWORD=$NEW_PG_PASS" >> .env
    fi
    success "POSTGRES_PASSWORD 已自动生成"
  fi

  REDIS_PASS=$(grep -E '^REDIS_PASSWORD=' .env | cut -d'=' -f2 | tr -d '"' | tr -d "'" | xargs)
  if [ -z "$REDIS_PASS" ] || [ "$REDIS_PASS" = "redis123" ]; then
    NEW_REDIS_PASS=$(openssl rand -hex 16 2>/dev/null || python3 -c "import secrets; print(secrets.token_hex(16))")
    if grep -q '^REDIS_PASSWORD=' .env; then
      sed -i.bak "s|^REDIS_PASSWORD=.*|REDIS_PASSWORD=$NEW_REDIS_PASS|" .env && rm -f .env.bak
    else
      echo "REDIS_PASSWORD=$NEW_REDIS_PASS" >> .env
    fi
    success "REDIS_PASSWORD 已自动生成"
  fi

  # 写入生产环境标志
  if grep -q '^ENVIRONMENT=' .env; then
    sed -i.bak "s|^ENVIRONMENT=.*|ENVIRONMENT=production|" .env && rm -f .env.bak
    sed -i.bak "s|^DEBUG=.*|DEBUG=False|" .env && rm -f .env.bak
  fi
  success "生产环境配置完成"
fi

# ---------- 构建镜像 ----------
info "构建 Docker 镜像（首次约需 3-5 分钟）..."
docker compose build --parallel
success "镜像构建完成"

# ---------- 启动服务 ----------
info "启动所有服务..."
docker compose up -d
success "服务已启动"

# ---------- 等待后端就绪 ----------
info "等待后端服务就绪（最多 90 秒）..."
BACKEND_PORT=$(grep -E '^BACKEND_PORT=' .env | cut -d'=' -f2 | xargs)
BACKEND_PORT=${BACKEND_PORT:-8000}

MAX_WAIT=90
WAITED=0
until curl -sf "http://localhost:${BACKEND_PORT}/health" >/dev/null 2>&1; do
  if [ $WAITED -ge $MAX_WAIT ]; then
    warn "后端启动超时，查看日志："
    docker compose logs --tail=30 backend
    error "后端未能在 ${MAX_WAIT}s 内就绪，请检查日志"
  fi
  printf "."
  sleep 3
  WAITED=$((WAITED + 3))
done
echo ""
success "后端已就绪（用时 ${WAITED}s）"

# ---------- 执行数据库迁移 ----------
info "执行数据库迁移..."
docker compose exec -T backend alembic upgrade head
success "数据库迁移完成"

# ---------- 显示访问信息 ----------
FRONTEND_PORT=$(grep -E '^FRONTEND_PORT=' .env | cut -d'=' -f2 | xargs)
FRONTEND_PORT=${FRONTEND_PORT:-3000}

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}       部署完成！${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "  访问地址："
echo -e "    前端页面   ${BLUE}http://localhost:${FRONTEND_PORT}${NC}"
echo -e "    管理后台   ${BLUE}http://localhost:${FRONTEND_PORT}/admin${NC}"
echo -e "    API 文档   ${BLUE}http://localhost:${BACKEND_PORT}/docs${NC}"
echo ""
echo "  初始账号："
echo "    管理员  admin / admin123"
echo "    测试用户 testuser / test123"
echo ""
echo -e "  ${YELLOW}生产环境请立即修改默认密码！${NC}"
echo ""
echo "  常用命令："
echo "    查看状态    docker compose ps"
echo "    查看日志    docker compose logs -f backend"
echo "    停止服务    docker compose stop"
echo "    重启服务    docker compose restart"
echo ""
