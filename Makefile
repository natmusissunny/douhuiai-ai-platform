.PHONY: help build up down restart logs ps clean test lint format backup restore admin init

# 默认目标
.DEFAULT_GOAL := help

# 颜色定义
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color

##@ 帮助

help: ## 显示帮助信息
	@echo "$(BLUE)豆绘AI平台 - Makefile 命令$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "使用方法:\n  make $(YELLOW)<target>$(NC)\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(BLUE)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Docker操作

build: ## 构建所有Docker镜像
	@echo "$(BLUE)🔨 构建Docker镜像...$(NC)"
	docker-compose build

up: ## 启动所有服务
	@echo "$(GREEN)🚀 启动所有服务...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)✅ 服务已启动$(NC)"
	@make ps

down: ## 停止所有服务
	@echo "$(YELLOW)⏹️  停止所有服务...$(NC)"
	docker-compose down
	@echo "$(GREEN)✅ 服务已停止$(NC)"

restart: ## 重启所有服务
	@echo "$(BLUE)🔄 重启所有服务...$(NC)"
	@make down
	@make up

logs: ## 查看所有服务日志
	docker-compose logs -f

logs-backend: ## 查看后端日志
	docker-compose logs -f backend

logs-frontend: ## 查看前端日志
	docker-compose logs -f frontend

logs-celery: ## 查看Celery日志
	docker-compose logs -f celery-worker

ps: ## 查看服务状态
	@echo "$(BLUE)📊 服务状态:$(NC)"
	@docker-compose ps

clean: ## 清理所有容器、卷和镜像
	@echo "$(RED)⚠️  警告: 这将删除所有容器、卷和镜像!$(NC)"
	@read -p "确定要继续吗? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	@echo "$(YELLOW)🧹 清理中...$(NC)"
	docker-compose down -v --rmi all
	@echo "$(GREEN)✅ 清理完成$(NC)"

##@ 数据库操作

db-migrate: ## 运行数据库迁移
	@echo "$(BLUE)🗄️  运行数据库迁移...$(NC)"
	docker-compose exec backend alembic upgrade head
	@echo "$(GREEN)✅ 迁移完成$(NC)"

db-rollback: ## 回滚数据库迁移
	@echo "$(YELLOW)⏪ 回滚数据库迁移...$(NC)"
	docker-compose exec backend alembic downgrade -1

db-shell: ## 进入PostgreSQL shell
	docker-compose exec postgres psql -U douhuiai douhuiai_db

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
	docker-compose exec backend python scripts/create_admin.py

##@ 开发操作

init: ## 初始化项目 (首次运行)
	@echo "$(BLUE)🎉 初始化项目...$(NC)"
	@echo "1️⃣  复制环境变量文件..."
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "$(GREEN)✅ .env 文件已创建，请编辑配置$(NC)"; \
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
	@echo "$(BLUE)访问地址:$(NC)"
	@echo "  前端: http://localhost:3000"
	@echo "  后端: http://localhost:8000"
	@echo "  API文档: http://localhost:8000/docs"

dev-backend: ## 进入后端容器
	docker-compose exec backend bash

dev-frontend: ## 进入前端容器
	docker-compose exec frontend sh

shell: dev-backend ## 进入后端shell (别名)

##@ 代码质量

test: ## 运行测试
	@echo "$(BLUE)🧪 运行测试...$(NC)"
	docker-compose exec backend pytest tests/ -v --cov=app --cov-report=term

test-watch: ## 持续运行测试
	docker-compose exec backend pytest tests/ -v --cov=app -f

lint: ## 代码检查
	@echo "$(BLUE)🔍 代码检查...$(NC)"
	@echo "检查 Python 代码..."
	docker-compose exec backend flake8 app/
	@echo "检查 Python 类型..."
	docker-compose exec backend mypy app/
	@echo "$(GREEN)✅ 代码检查通过$(NC)"

format: ## 格式化代码
	@echo "$(BLUE)✨ 格式化代码...$(NC)"
	@echo "格式化 Python 代码..."
	docker-compose exec backend black app/ tests/
	docker-compose exec backend isort app/ tests/
	@echo "$(GREEN)✅ 代码格式化完成$(NC)"

##@ 健康检查

health: ## 检查服务健康状态
	@echo "$(BLUE)🏥 健康检查:$(NC)"
	@echo -n "后端API: "
	@curl -s http://localhost:8000/health > /dev/null && echo "$(GREEN)✅ 正常$(NC)" || echo "$(RED)❌ 异常$(NC)"
	@echo -n "PostgreSQL: "
	@docker-compose exec postgres pg_isready -U douhuiai > /dev/null 2>&1 && echo "$(GREEN)✅ 正常$(NC)" || echo "$(RED)❌ 异常$(NC)"
	@echo -n "Redis: "
	@docker-compose exec redis redis-cli ping > /dev/null 2>&1 && echo "$(GREEN)✅ 正常$(NC)" || echo "$(RED)❌ 异常$(NC)"

urls: ## 显示访问地址
	@echo "$(BLUE)🔗 访问地址:$(NC)"
	@echo "  前端:      http://localhost:3000"
	@echo "  后端API:   http://localhost:8000"
	@echo "  API文档:   http://localhost:8000/docs"
	@echo "  健康检查:  http://localhost:8000/health"

##@ 性能与监控

stats: ## 显示资源使用统计
	@echo "$(BLUE)📊 资源使用统计:$(NC)"
	docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

disk: ## 显示磁盘使用情况
	@echo "$(BLUE)💾 磁盘使用情况:$(NC)"
	@echo "Docker 镜像:"
	@docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | grep douhuiai
	@echo ""
	@echo "Docker 卷:"
	@docker volume ls --filter name=douhuiai --format "table {{.Name}}\t{{.Driver}}"
	@df -h | grep -E '(Filesystem|douhuiai)' || true

##@ 生产环境

prod-build: ## 构建生产镜像
	@echo "$(BLUE)🏭 构建生产镜像...$(NC)"
	docker-compose -f docker-compose.yml build

prod-up: ## 启动生产环境
	@echo "$(GREEN)🚀 启动生产环境...$(NC)"
	docker-compose --profile production up -d
	@make ps

prod-down: ## 停止生产环境
	docker-compose --profile production down

##@ 实用工具

version: ## 显示版本信息
	@echo "$(BLUE)豆绘AI平台 v0.9.0$(NC)"
	@echo "Python: $$(docker-compose exec backend python --version 2>&1)"
	@echo "Node.js: $$(docker-compose exec frontend node --version 2>&1)"
	@echo "Docker: $$(docker --version)"
	@echo "Docker Compose: $$(docker-compose --version)"

update: ## 更新依赖
	@echo "$(BLUE)📦 更新依赖...$(NC)"
	@echo "更新后端依赖..."
	docker-compose exec backend pip install -r requirements.txt --upgrade
	@echo "更新前端依赖..."
	docker-compose exec frontend npm update
	@echo "$(GREEN)✅ 依赖更新完成$(NC)"
