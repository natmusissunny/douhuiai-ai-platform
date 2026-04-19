# 豆绘AI平台 (Douhuiai AI Platform)

<div align="center">

**一个完整的 AI 创意生成平台**

[![Status](https://img.shields.io/badge/Status-Production_Ready-brightgreen)](https://github.com/natmusissunny/douhuiai-ai-platform)
[![Version](https://img.shields.io/badge/Version-v1.0.0-blue)](https://github.com/natmusissunny/douhuiai-ai-platform)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://python.org)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://react.dev)

</div>

---

## 项目概述

豆绘AI平台是一个全栈 AI 图片编辑平台，集成豆绘AI API，提供图片编辑核心功能，并附带完整的管理后台。

- **图片编辑**：高清放大、高清重绘、AI扩图
- **多场景入口**：图片编辑器、图片精修、PS场景融合、长图拼图
- **项目管理**：历史记录、任务状态轮询、失败重试
- **配额系统**：余额管理、消费记录、三级预警提醒
- **管理后台**：用户管理、角色权限（RBAC）、数据统计、余额监控

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite + Ant Design 6 + Tailwind CSS |
| 状态管理 | Zustand |
| 后端 | FastAPI (Python 3.10+) + SQLAlchemy + Alembic |
| 数据库 | PostgreSQL 14 + Redis 6.2（阿里云优化版） |
| 任务队列 | Celery + Redis |
| 认证 | JWT（access token + refresh token） |
| 部署 | Docker + Docker Compose |

---

## 项目结构

```
douhuiai-ai-platform/
├── deploy.sh                    # 一键部署脚本
├── docker-compose.yml           # Docker 编排配置
├── .env.example                 # 环境变量模板
├── Makefile                     # 常用命令
│
├── backend/                     # 后端（FastAPI）
│   ├── app/
│   │   ├── api/v1/              # API 路由（34 个端点）
│   │   │   ├── auth.py          # 认证（注册/登录/刷新/登出）
│   │   │   ├── users.py         # 用户（个人信息/配额查询）
│   │   │   ├── projects.py      # 项目（文生图/图生图/编辑/3D/列表/详情/删除/重试）
│   │   │   └── admin.py         # 管理（用户CRUD/角色CRUD/统计/余额/流水）
│   │   ├── models/              # 数据模型（6 张表）
│   │   ├── schemas/             # Pydantic 请求/响应模型
│   │   ├── services/
│   │   │   ├── douhuiai.py      # 豆绘AI API 客户端
│   │   │   └── project.py       # 项目业务逻辑
│   │   ├── tasks/               # Celery 异步任务
│   │   └── utils/               # JWT / 密码工具
│   ├── alembic/                 # 数据库迁移
│   ├── tests/                   # 单元测试
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                    # 前端（React）
│   └── src/
│       ├── api/                 # HTTP 客户端
│       ├── components/          # 通用组件（ProtectedRoute / QuotaAlert）
│       ├── layouts/             # 布局（Main / Auth / Admin）
│       ├── pages/
│       │   ├── 用户端（首页/编辑页/项目列表/详情/个人中心）
│       │   └── admin/           # 管理后台（8 个页面）
│       ├── stores/              # Zustand 状态管理
│       └── router/              # 路由配置
│
├── nginx/                       # Nginx 配置
├── scripts/                     # 备份/恢复脚本
└── docs/                        # 文档目录
```

---

## 快速启动

### 前置要求

- Docker 20.x+
- Docker Compose 2.x（插件版）

### 一键部署

```bash
git clone https://github.com/natmusissunny/douhuiai-ai-platform.git
cd douhuiai-ai-platform

# 本地开发模式
bash deploy.sh

# 生产模式（自动生成随机密钥）
bash deploy.sh --prod
```

脚本会自动：
1. 检测 Docker 环境
2. 创建 `.env`（从 `.env.example` 复制）
3. 提示填写豆绘AI API 密钥
4. 构建镜像、启动所有服务
5. 等待后端就绪后执行数据库迁移

### 手动配置

```bash
# 复制并编辑环境变量
cp .env.example .env
# 必须填写：DOUHUIAI_APP_ID 和 DOUHUIAI_APP_SECRET

# 启动服务
docker compose up -d

# 执行数据库迁移
docker compose exec backend alembic upgrade head
```

### 访问地址

| 服务 | 地址 |
|------|------|
| 前端页面 | http://localhost:3000 |
| 管理后台 | http://localhost:3000/admin |
| API 文档 | http://localhost:8000/docs |

### 初始账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 超级管理员 | admin | admin123 |
| 普通用户 | testuser | test123 |

> **生产环境请立即修改默认密码！**

---

## 功能说明

### 用户端

| 页面 | 路由 | 功能 |
|------|------|------|
| 首页 | `/` | 平台介绍、4 个功能入口（图片编辑器/图片精修/PS场景融合/长图拼图） |
| 图片编辑 | `/create/edit` | 高清放大（5 种模式）、高清重绘、AI扩图 |
| 项目列表 | `/projects` | 历史任务、状态、重试 |
| 项目详情 | `/projects/:id` | 任务状态轮询、结果图片 |
| 个人中心 | `/profile` | 个人信息、配额明细 |

### 管理后台（需 admin 权限）

| 页面 | 路由 | 功能 |
|------|------|------|
| 数据概览 | `/admin/dashboard` | 用户数、项目数、今日统计 |
| 用户管理 | `/admin/users` | 增删改查、封禁/解封、配额调整 |
| 角色权限 | `/admin/roles` | 角色 CRUD、权限配置 |
| 项目管理 | `/admin/projects` | 查看所有用户任务状态 |
| 数据统计 | `/admin/statistics` | 项目类型分布、配额消耗趋势 |
| 余额监控 | `/admin/quota-monitor` | 豆绘API余额 + 用户配额排行 |
| 配额流水 | `/admin/transactions` | 全部充值/消费记录，支持筛选 |
| 系统设置 | `/admin/settings` | 全局配置 |

### 豆绘AI API 集成

| 功能 | 接口 |
|------|------|
| 图片编辑（高清放大/重绘/扩图） | `POST /api/aiart/doEdit` |
| 任务状态轮询 | `GET /api/aiart/queryStatus` |
| 图片上传 | `POST /api/index/apiupload` |

> 任务状态码：`200`=完成，`-200`=进行中，`500`=失败，`404`=过期

---

## 环境变量

关键变量说明，完整模板见 `.env.example`：

```bash
# 必填：豆绘AI API 密钥
DOUHUIAI_APP_ID=<你的 AppID>
DOUHUIAI_APP_SECRET=<你的 AppSecret>

# 生产环境必须修改
SECRET_KEY=<随机 64 位字符串>
POSTGRES_PASSWORD=<强密码>
REDIS_PASSWORD=<强密码>
```

---

## 数据库模型

| 表名 | 说明 |
|------|------|
| `users` | 用户账号，含配额余额和角色 |
| `roles` | RBAC 角色，JSON 权限列表 |
| `projects` | AI 生成任务，含状态和结果 |
| `quota_transactions` | 配额充值/消费流水 |
| `orders` | 支付订单 |
| `audit_logs` | 操作审计日志 |

---

## 常用命令

```bash
# 查看服务状态
docker compose ps

# 查看后端日志
docker compose logs -f backend

# 进入后端容器
docker compose exec backend bash

# 数据库备份
docker compose exec postgres pg_dump -U douhuiai douhuiai_db > backup.sql

# 重建前端镜像
docker compose build frontend && docker compose up -d frontend
```

详细操作文档见 [DEPLOYMENT.md](./DEPLOYMENT.md)。

---

## 已知问题

1. **豆绘API余额不足**：账户余额为 0 时，所有 AI 生成功能返回"余额不足"，充值后可正常使用
2. **Celery Worker 健康检查显示 unhealthy**：健康检查配置较严格，Worker 实际正常运行，可忽略
3. **bcrypt 版本告警**：passlib 与 bcrypt 版本兼容性警告，不影响功能

---

## 许可证

[MIT License](LICENSE)
