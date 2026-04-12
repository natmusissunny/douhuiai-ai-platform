# 豆绘AI平台 - 部署与操作文档

> 最后更新：2026-03-10
> 适用环境：macOS / Linux + Docker Compose

---

## 目录

1. [项目概述](#项目概述)
2. [环境要求](#环境要求)
3. [快速启动（本地开发）](#快速启动)
4. [环境变量配置](#环境变量配置)
5. [服务架构](#服务架构)
6. [常用操作命令](#常用操作命令)
7. [管理后台使用](#管理后台使用)
8. [数据库管理](#数据库管理)
9. [已知问题与注意事项](#已知问题)
10. [生产环境部署](#生产环境部署)

---

## 项目概述

豆绘AI平台是一个全栈 AI 图片编辑平台，集成豆绘AI API，提供高清放大、高清重绘、AI扩图等核心编辑功能，并附带完整的管理后台。

**技术栈：**
- 前端：React 18 + TypeScript + Ant Design 6 + Vite
- 后端：FastAPI (Python 3.10) + SQLAlchemy + Celery
- 数据库：PostgreSQL 14 + Redis 6.2（阿里云优化版）
- 部署：Docker + Docker Compose

**Docker 镜像源说明：**
- Redis、Node.js 基础镜像使用阿里云镜像仓库，后端 apt/pip 源使用 `mirrors.aliyun.com`，确保国内环境构建速度。

---

## 环境要求

| 工具 | 最低版本 | 说明 |
|------|----------|------|
| Docker | 20.x+ | 必须 |
| Docker Compose | 2.x (plugin) | 必须 |
| 宿主机内存 | 4GB+ | 推荐 8GB |
| 磁盘空间 | 10GB+ | 包含镜像和数据 |

---

## 快速启动

### 1. 克隆并配置

```bash
cd douhuiai-ai-platform

# 复制并编辑环境变量（必须填写豆绘API密钥）
cp .env.example .env
vim .env
```

### 2. 启动所有服务

```bash
docker-compose up -d
```

### 3. 等待服务就绪（约30-60秒）

```bash
# 查看各服务状态
docker-compose ps

# 检查后端健康
curl http://localhost:8000/health
# 预期返回: {"status":"healthy","version":"0.1.0"}
```

### 4. 访问

| 服务 | 地址 |
|------|------|
| 前端页面 | http://localhost:3000 |
| 后端 API 文档 | http://localhost:8000/docs |
| 管理后台 | http://localhost:3000/admin |

### 5. 初始账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 超级管理员 | admin | admin123 |
| 测试普通用户 | testuser | test123 |

> ⚠️ **生产环境必须修改默认密码！**

---

## 环境变量配置

关键变量说明（文件：`.env`）：

```bash
# ===== 必填 =====
DOUHUIAI_APP_ID=dh2602mi6lcobtnsmn         # 豆绘AI AppID
DOUHUIAI_APP_SECRET=<你的AppSecret>          # 豆绘AI AppSecret（不能为空）

# ===== 安全相关（生产必须修改）=====
SECRET_KEY=<随机64位字符串>                   # JWT签名密钥
POSTGRES_PASSWORD=<强密码>                   # 数据库密码
REDIS_PASSWORD=<强密码>                      # Redis密码

# ===== 应用配置 =====
ENVIRONMENT=production                       # development / production
DEBUG=False                                  # 生产环境关闭
CORS_ORIGINS=https://your-domain.com         # 生产环境改为实际域名
```

完整配置参见 `.env.example`。

---

## 服务架构

```
         ┌─────────────┐
用户浏览器  │   前端 :3000  │ Nginx 提供静态文件
         └──────┬──────┘
                │ HTTP API 请求
         ┌──────▼──────┐
         │  后端 :8000  │ FastAPI + uvicorn
         └──┬─────┬────┘
            │     │
     ┌──────▼──┐ ┌▼──────────┐
     │ PostgreSQL│ │   Redis   │
     │  :5433   │ │  :6380    │
     └──────────┘ └─────┬─────┘
                         │ 任务队列
                  ┌──────▼──────┐
                  │ Celery Worker│ 处理AI生成任务
                  └─────────────┘
```

**端口映射（宿主机）：**

| 服务 | 宿主机端口 | 容器端口 |
|------|-----------|---------|
| 前端 | 3000 | 80 |
| 后端 | 8000 | 8000 |
| PostgreSQL | 5433 | 5432 |
| Redis | 6380 | 6379 |

---

## 常用操作命令

### 启动/停止

```bash
# 启动所有服务（后台）
docker-compose up -d

# 停止所有服务（保留数据）
docker-compose stop

# 停止并删除容器（保留数据卷）
docker-compose down

# 停止并删除所有数据（危险！）
docker-compose down -v
```

### 查看日志

```bash
# 查看所有服务日志（实时）
docker-compose logs -f

# 只看后端日志
docker-compose logs -f backend

# 只看 Celery 任务日志
docker-compose logs -f celery-worker

# 查看最近100行
docker-compose logs --tail=100 backend
```

### 重启服务

```bash
# 重启后端（代码热重载会自动生效，无需手动重启）
docker-compose restart backend

# 重启前端（更新前端代码后需重新构建）
docker-compose build frontend && docker-compose up -d frontend
```

### 进入容器

```bash
# 进入后端容器
docker-compose exec backend bash

# 进入数据库
docker-compose exec postgres psql -U douhuiai -d douhuiai_db
```

### 重新构建

```bash
# 重建所有镜像（代码有重大变更时）
docker-compose build

# 重建单个服务
docker-compose build backend
docker-compose build frontend
```

---

## 管理后台使用

访问地址：http://localhost:3000/admin
需要具有管理员权限的账号登录（角色：admin 或 super_admin）。

### 功能说明

| 菜单 | 功能 |
|------|------|
| 数据概览 | 用户总数、项目数、今日数据统计 |
| 用户管理 | 用户增删改查、封禁/解封、配额调整 |
| 角色权限 | 管理角色和权限配置（RBAC） |
| 项目管理 | 查看所有 AI 生成任务状态 |
| 数据统计 | 项目类型分布、配额消耗统计 |
| **余额监控** | 豆绘API余额监控 + 用户配额余额排行 |
| **配额流水** | 所有充值/消费/调整记录，支持按用户/类型/日期筛选 |
| 系统设置 | 全局配置项 |

### 用户配额调整

1. 进入「用户管理」
2. 点击目标用户的「配额」按钮
3. 选择操作类型：
   - **直接设置**：将余额直接设置为指定金额
   - **增加**：在当前余额基础上增加
   - **扣除**：在当前余额基础上扣除
4. 填写操作金额和**必填备注**（记录操作原因）
5. 弹窗顶部显示当前豆绘API账户余额（低于100元时显示告警）

### 新建用户

1. 点击「用户管理」→「新建用户」
2. 必填：用户名、邮箱、密码、角色
3. 可选：手机号、昵称、初始配额余额、配额上限、月度配额上限

### 角色权限说明

| 角色 | 权限 | 说明 |
|------|------|------|
| super_admin | `*` | 所有权限，包括管理其他管理员 |
| admin | user.manage + project.manage + quota.manage | 普通管理员 |
| auditor | project.view + project.review | 内容审核 |
| vip | 无限制 AI 功能 | 高级用户 |
| user | 基础 AI 功能 | 普通用户 |

---

## 数据库管理

### 查看数据库

```bash
# 连接数据库
docker-compose exec postgres psql -U douhuiai -d douhuiai_db

# 常用查询
\dt                          # 列出所有表
SELECT * FROM users;         # 查看用户
SELECT * FROM quota_transactions ORDER BY created_at DESC LIMIT 10;
SELECT * FROM projects ORDER BY created_at DESC LIMIT 10;
```

### 备份与恢复

```bash
# 备份
docker-compose exec postgres pg_dump -U douhuiai douhuiai_db > backup_$(date +%Y%m%d).sql

# 恢复
cat backup_20260310.sql | docker-compose exec -T postgres psql -U douhuiai -d douhuiai_db
```

### 数据库迁移（Alembic）

```bash
# 执行迁移（首次部署或有新迁移文件时）
docker-compose exec backend alembic upgrade head

# 查看迁移历史
docker-compose exec backend alembic history

# 生成新迁移文件（修改 models 后）
docker-compose exec backend alembic revision --autogenerate -m "描述变更"
```

---

## 已知问题

### 1. 豆绘AI API账户余额不足
- **现象**：所有 AI 生成功能返回"总账户余额不足"
- **原因**：API 账号余额耗尽（当前余额 0.00 元）
- **解决**：登录豆绘AI官网充值，或联系豆绘AI商务
- **监控**：在管理后台「余额监控」页面查看实时余额，低于100元会显示告警

### 2. Celery Worker 健康检查显示 unhealthy
- **现象**：`docker-compose ps` 显示 celery-worker/celery-beat `unhealthy`
- **原因**：Docker 健康检查配置较严格，但 Worker 实际正常运行
- **验证**：`docker-compose logs celery-worker | tail -20` 确认任务处理正常

### 3. bcrypt 版本告警
- **现象**：日志中出现 `(trapped) error reading bcrypt version`
- **原因**：passlib 与 bcrypt 版本不兼容（不影响功能）
- **解决**：可在 `backend/requirements.txt` 中固定 `bcrypt==4.0.1`

### 4. 后端 unhealthy 状态
- **原因**：健康检查间隔设置，刚启动时会短暂显示 unhealthy
- **解决**：等待30秒后再查看状态

---

## API 接口说明

### 豆绘AI API集成

项目集成了豆绘AI的以下接口：

| 功能 | 接口 | 说明 |
|------|------|------|
| 文生图 | POST /api/aiart/doGenKontext | dhMode=text |
| 图生图 | POST /api/aiart/doGenKontext | dhMode=img |
| 3D渲染 | POST /api/aiart/doGenKontext | 指定3D模型类型 |
| 图片编辑 | POST /api/aiart/doEdit | 支持18种编辑操作 |
| 任务查询 | GET /api/aiart/queryStatus | 轮询任务状态 |
| 图片上传 | POST /api/index/apiupload | 上传图片获取CDN URL |

任务状态码：`200`=完成, `-200`=进行中, `500`=失败, `404`=任务不存在

---

## 生产环境部署

### 必要的安全修改

1. **修改 `.env`**：
   ```bash
   ENVIRONMENT=production
   DEBUG=False
   SECRET_KEY=$(openssl rand -hex 32)
   POSTGRES_PASSWORD=$(openssl rand -hex 16)
   REDIS_PASSWORD=$(openssl rand -hex 16)
   CORS_ORIGINS=https://your-domain.com
   ```

2. **修改默认管理员密码**，或删除默认账号创建新账号

3. **配置 HTTPS**（推荐使用 Nginx + Let's Encrypt）

4. **限制数据库端口**：生产环境不应将 5433/6380 对外暴露

### 部署步骤

```bash
# 1. 修改环境变量
vim .env

# 2. 构建生产镜像
docker-compose build

# 3. 启动服务
docker-compose up -d

# 4. 执行数据库迁移（首次部署）
docker-compose exec backend alembic upgrade head

# 5. 验证
curl http://localhost:8000/health
```

### 系统监控

```bash
# 查看资源占用
docker stats

# 查看磁盘使用
docker system df

# 清理无用镜像
docker system prune
```
