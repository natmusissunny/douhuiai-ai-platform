.PHONY: help build up down restart logs ps clean test lint format backup restore admin init

# 默认目标
.DEFAULT_GOAL := help

# Compose v2 插件（与 deploy.sh / README 一致）
COMPOSE ?= docker compose

# 从 .env 读取宿主机端口（缺省与 .env.example 一致）
BACKEND_PORT ?= $(shell awk -F= '/^BACKEND_PORT=/{print $$2; exit}' .env 2>/dev/null)
FRONTEND_PORT ?= $(shell awk -F= '/^FRONTEND_PORT=/{print $$2; exit}' .env 2>/dev/null)
BACKEND_PORT := $(if $(BACKEND_PORT),$(BACKEND_PORT),8000)
FRONTEND_PORT := $(if $(FRONTEND_PORT),$(FRONTEND_PORT),3000)
REDIS_PASSWORD ?= $(shell awk -F= '/^REDIS_PASSWORD=/{print $$2; exit}' .env 2>/dev/null)
REDIS_PASSWORD := $(if $(REDIS_PASSWORD),$(REDIS_PASSWORD),redis123)

# 颜色定义
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color

##@ 帮助

help: ## 显示帮助信息
	@echo "$(BLUE)EmniEditor - Makefile 命令$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "使用方法:\n  make $(YELLOW)<target>$(NC)\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(BLUE)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Docker操作

build: ## 构建所有Docker镜像
	@echo "$(BLUE)🔨 构建Docker镜像...$(NC)"
	$(COMPOSE) build

up: ## 启动所有服务
	@echo "$(GREEN)🚀 启动所有服务...$(NC)"
	$(COMPOSE) up -d
	@echo "$(GREEN)✅ 服务已启动$(NC)"
	@make ps

down: ## 停止所有服务
	@echo "$(YELLOW)⏹️  停止所有服务...$(NC)"
	$(COMPOSE) down
	@echo "$(GREEN)✅ 服务已停止$(NC)"

restart: ## 重启所有服务
	@echo "$(BLUE)🔄 重启所有服务...$(NC)"
	@make down
	@make up

logs: ## 查看所有服务日志
	$(COMPOSE) logs -f

logs-backend: ## 查看后端日志
	$(COMPOSE) logs -f backend

logs-frontend: ## 查看前端日志
	$(COMPOSE) logs -f frontend

logs-celery: ## 查看Celery日志
	$(COMPOSE) logs -f celery-worker

ps: ## 查看服务状态
	@echo "$(BLUE)📊 服务状态:$(NC)"
	@$(COMPOSE) ps

clean: ## 清理所有容器、卷和镜像
	@echo "$(RED)⚠️  警告: 这将删除所有容器、卷和镜像!$(NC)"
	@read -p "确定要继续吗? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	@echo "$(YELLOW)🧹 清理中...$(NC)"
	$(COMPOSE) down -v --rmi all
	@echo "$(GREEN)✅ 清理完成$(NC)"

##@ 数据库操作

db-migrate: ## 运行数据库迁移
	@echo "$(BLUE)🗄️  运行数据库迁移...$(NC)"
	$(COMPOSE) exec backend alembic upgrade head
	@echo "$(GREEN)✅ 迁移完成$(NC)"

db-rollback: ## 回滚数据库迁移
	@echo "$(YELLOW)⏪ 回滚数据库迁移...$(NC)"
	$(COMPOSE) exec backend alembic downgrade -1

db-shell: ## 进入PostgreSQL shell
	$(COMPOSE) exec postgres psql -U emnieditor emnieditor_db

backup: ## 备份数据库
	@echo "$(BLUE)💾 备份数据库...$(NC)"
	./scripts/backup.sh

restore: ## 恢复数据库 (需要指定文件: make restore FILE=backup.sql.gz)
	@if [ -z "$(FILE)" ]; then \
		echo "$(RED)❌ 请指定备份文件: make restore FILE=backup.sql.gz$(NC)"; \
		exit 1; \
	fi
	./scripts/restore.sh $(FILE)

admin: ## 创建管理员账号
	@echo "$(BLUE)👤 创建管理员账号...$(NC)"
	$(COMPOSE) exec backend python scripts/create_admin.py

##@ 开发操作

init: ## 初始化项目 (首次运行)
	@echo "$(BLUE)🎉 初始化项目...$(NC)"
	@echo "1️⃣  复制环境变量文件..."
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "$(GREEN)✅ .env 文件已创建，请编辑配置（必填 EMNIEDITOR_APP_ID/SECRET）$(NC)"; \
	else \
		echo "$(YELLOW)⚠️  .env 文件已存在$(NC)"; \
	fi
	@echo "2️⃣  构建Docker镜像..."
	@make build
	@echo "3️⃣  启动服务..."
	@make up
	@echo "4️⃣  等待数据库启动..."
	@sleep 10
	@echo "5️⃣  运行数据库迁移..."
	@make db-migrate
	@echo "6️⃣  创建管理员账号..."
	@make admin
	@echo "$(GREEN)✅ 初始化完成!$(NC)"
	@echo ""
	@make urls

dev-backend: ## 进入后端容器
	$(COMPOSE) exec backend bash

dev-frontend: ## 进入前端容器
	$(COMPOSE) exec frontend sh

shell: dev-backend ## 进入后端shell (别名)

##@ 代码质量

test: ## 运行测试
	@echo "$(BLUE)🧪 运行测试...$(NC)"
	$(COMPOSE) exec backend pytest tests/ -v --cov=app --cov-report=term

test-watch: ## 持续运行测试
	$(COMPOSE) exec backend pytest tests/ -v --cov=app -f

lint: ## 代码检查
	@echo "$(BLUE)🔍 代码检查...$(NC)"
	@echo "检查 Python 代码..."
	$(COMPOSE) exec backend flake8 app/
	@echo "检查 Python 类型..."
	$(COMPOSE) exec backend mypy app/
	@echo "$(GREEN)✅ 代码检查通过$(NC)"

format: ## 格式化代码
	@echo "$(BLUE)✨ 格式化代码...$(NC)"
	@echo "格式化 Python 代码..."
	$(COMPOSE) exec backend black app/ tests/
	$(COMPOSE) exec backend isort app/ tests/
	@echo "$(GREEN)✅ 代码格式化完成$(NC)"

##@ 健康检查

health: ## 检查服务健康状态（端口读自 .env）
	@echo "$(BLUE)🏥 健康检查:$(NC)"
	@echo -n "后端API (:$(BACKEND_PORT)): "
	@curl -sf http://localhost:$(BACKEND_PORT)/health > /dev/null && echo "$(GREEN)✅ 正常$(NC)" || echo "$(RED)❌ 异常$(NC)"
	@echo -n "PostgreSQL: "
	@$(COMPOSE) exec -T postgres pg_isready -U emnieditor > /dev/null 2>&1 && echo "$(GREEN)✅ 正常$(NC)" || echo "$(RED)❌ 异常$(NC)"
	@echo -n "Redis: "
	@$(COMPOSE) exec -T redis redis-cli -a "$(REDIS_PASSWORD)" --no-auth-warning ping 2>/dev/null | grep -q PONG && echo "$(GREEN)✅ 正常$(NC)" || echo "$(RED)❌ 异常$(NC)"

urls: ## 显示访问地址（端口读自 .env）
	@echo "$(BLUE)🔗 访问地址:$(NC)"
	@echo "  前端:      http://localhost:$(FRONTEND_PORT)"
	@echo "  管理后台:  http://localhost:$(FRONTEND_PORT)/admin"
	@echo "  后端API:   http://localhost:$(BACKEND_PORT)"
	@echo "  API文档:   http://localhost:$(BACKEND_PORT)/docs"
	@echo "  健康检查:  http://localhost:$(BACKEND_PORT)/health"

##@ 性能与监控

stats: ## 显示资源使用统计
	@echo "$(BLUE)📊 资源使用统计:$(NC)"
	docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

disk: ## 显示磁盘使用情况
	@echo "$(BLUE)💾 磁盘使用情况:$(NC)"
	@echo "Docker 镜像:"
	@docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | grep emnieditor || true
	@echo ""
	@echo "Docker 卷:"
	@docker volume ls --filter name=emnieditor --format "table {{.Name}}\t{{.Driver}}"
	@df -h | grep -E '(Filesystem|emnieditor)' || true

##@ 生产环境

prod-build: ## 构建生产镜像（与 docker-compose.yml 同一文件；请用 deploy.sh --prod）
	@echo "$(BLUE)🏭 构建生产镜像...$(NC)"
	@echo "$(YELLOW)提示: 推荐 bash deploy.sh --prod（会轮换弱密钥）$(NC)"
	$(COMPOSE) -f docker-compose.yml build

prod-up: ## 启动生产环境（无独立 compose profile；等同 up，请先 deploy.sh --prod）
	@echo "$(YELLOW)⚠️  docker-compose.yml 无 production profile；请先 bash deploy.sh --prod 再 make up$(NC)"
	@echo "$(GREEN)🚀 启动服务...$(NC)"
	$(COMPOSE) up -d
	@make ps

prod-down: ## 停止服务
	$(COMPOSE) down

##@ 实用工具

version: ## 显示版本信息
	@echo "$(BLUE)EmniEditor v0.9.0$(NC)"
	@echo "Python: $$($(COMPOSE) exec backend python --version 2>&1)"
	@echo "Node.js: $$($(COMPOSE) exec frontend node --version 2>&1)"
	@echo "Docker: $$(docker --version)"
	@echo "Docker Compose: $$($(COMPOSE) version)"

update: ## 更新依赖
	@echo "$(BLUE)📦 更新依赖...$(NC)"
	@echo "更新后端依赖..."
	$(COMPOSE) exec backend pip install -r requirements.txt --upgrade
	@echo "更新前端依赖..."
	$(COMPOSE) exec frontend npm update
	@echo "$(GREEN)✅ 依赖更新完成$(NC)"
