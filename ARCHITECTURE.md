# 豆绘AI平台 - 完整架构方案

## 一、项目概述

### 1.1 项目信息
- **项目名称**: 豆绘AI平台克隆版
- **参考网站**: https://www.douhuiai.com/
- **API服务**: https://mpjcmkbgup.apifox.cn/
- **项目类型**: AI创意生成平台（全栈Web应用 + 管理后台）

### 1.2 核心目标
1. 完整复刻豆绘AI的前端界面和用户体验
2. 接入现有的API服务（已发现128个接口）
3. 实现用户管理和权限控制的管理后台
4. 支持配额管理和充值系统

---

## 二、API接口分析

### 2.1 已发现的API接口（128个）

经过探测,发现的主要API分类：

#### **AI创作类**
1. **文生图** - POST（创建图像）
2. **AI智能出图** - POST
3. **标准重绘** - POST
4. **AI概念图** - POST
5. **3D渲染** - POST

#### **图像编辑类** (使用 `/api/aiart/doEdit`)
1. 高清放大
2. 高清重绘
3. AI扩图
4. AI抠图
5. 换背景
6. 万物消除
7. 局部修改
8. 局部修复
9. 换风格
10. 变清晰
11. 万物替换
12. 一键美化
13. 图片转线稿
14. 精准提取线稿
15. 图片去色
16. 对话改图
17. 智能改图
18. Kontext改图
19. 去水印
20. 智能替换
21. AI洗图
22. 一键生成

#### **配置查询类**
1. **获取模型列表** - GET
2. **获取画风列表** - GET
3. **获取主题模板(Lora)** - GET
4. **获取controlNet列表** - GET
5. **作画轮询接口** - GET（查询任务状态）

### 2.2 API认证方式

根据测试，API使用以下认证信息：
- **AppID**: `dh2602mi6lcobtnsmn`
- **AppSecret**: `7cbe794c53bd82fdda875814cddd21e3`
- **认证方式**: Header传递或参数传递（待进一步确认）

### 2.3 主要API端点

```
基础URL: https://mpjcmkbgup.apifox.cn

核心接口:
- POST /api/aiart/doEdit        # 图像编辑（通用接口，通过参数区分功能）
- POST /api/aiart/doGenerate    # 图像生成（推测）
- POST /api/aiart/doOneKeyGen   # 一键生成
- GET  /api/aiart/pollTask      # 任务轮询（推测）
- GET  /api/config/models       # 获取模型列表（推测）
- GET  /api/config/styles       # 获取画风列表（推测）
```

---

## 三、技术架构设计

### 3.1 整体架构图

```
┌─────────────────────────────────────────────────────────┐
│                      用户层                              │
├──────────────────┬──────────────────┬──────────────────┤
│   用户前端Web     │   管理后台Web     │   移动端H5(可选)  │
│   (React + TS)   │   (React + AntD)  │                  │
└────────┬─────────┴─────────┬─────────┴──────────────────┘
         │                    │
         │  RESTful API       │  Admin API
         │                    │
┌────────┴────────────────────┴─────────────────────────────┐
│                   API网关层 (可选)                          │
│              Nginx / Kong / Traefik                        │
└────────────────────────┬───────────────────────────────────┘
                         │
┌────────────────────────┴───────────────────────────────────┐
│                   应用服务层                                │
│               FastAPI (Python 3.10+)                       │
├──────────────────────────┬─────────────────────────────────┤
│  用户服务  │  AI服务  │  配额服务  │  订单服务  │  权限服务  │
└──────────────────────────┴─────────────────────────────────┘
         │                                          │
         │                                          │
┌────────┴──────────────────────┐   ┌──────────────┴──────────┐
│      外部API服务               │   │      数据存储层          │
│  豆绘AI API (Apifox)           │   │  PostgreSQL + Redis     │
│  https://mpjcmkbgup.apifox.cn │   │  + OSS (文件存储)        │
└───────────────────────────────┘   └─────────────────────────┘
         │
┌────────┴──────────────────────┐
│      异步任务队列              │
│    Celery + Redis             │
└───────────────────────────────┘
```

### 3.2 技术栈选型

#### 前端技术栈

**用户端 Web**
```yaml
框架: React 18 + TypeScript
状态管理: Zustand (轻量) 或 Redux Toolkit
路由: React Router v6
UI组件:
  - Ant Design 5.x (基础组件)
  - 自定义组件 (复刻豆绘UI风格)
样式方案:
  - Tailwind CSS (快速开发)
  - CSS Modules (组件隔离)
  - styled-components (动态样式)
HTTP客户端: Axios + React Query (缓存 + 请求管理)
图片处理:
  - react-image-crop (裁剪)
  - react-dropzone (上传)
  - react-image-gallery (画廊)
动画: Framer Motion
工具链: Vite (构建) + ESLint + Prettier
```

**管理后台**
```yaml
框架: React 18 + TypeScript
UI框架: Ant Design Pro 或 Ant Design
图表: Apache ECharts 或 Recharts
表格: Ant Design Table (支持虚拟滚动)
```

#### 后端技术栈

```yaml
Web框架: FastAPI (Python 3.10+)
ASGI服务器: Uvicorn + Gunicorn (生产环境)
数据库ORM: SQLAlchemy 2.0
数据库迁移: Alembic
数据验证: Pydantic v2
认证:
  - JWT (访问令牌)
  - bcrypt (密码哈希)
  - python-jose (JWT编码/解码)
任务队列: Celery 5.x
消息队列: Redis 7.x
缓存: Redis
文件存储:
  - 阿里云OSS (推荐)
  - AWS S3 (备选)
  - MinIO (本地测试)
HTTP客户端: httpx (异步支持)
日志: loguru
配置管理: pydantic-settings
API文档: FastAPI自动生成 (Swagger/ReDoc)
```

#### 数据库技术栈

```yaml
主数据库: PostgreSQL 14+
  - 优势: 支持JSON类型、全文搜索、事务可靠

缓存数据库: Redis 7.x
  - 用途:
    - Session存储
    - API响应缓存
    - 任务队列
    - 限流计数

搜索引擎(可选): Elasticsearch
  - 用途: 全文搜索、日志分析
```

#### 部署架构

```yaml
容器化: Docker + Docker Compose
编排: Kubernetes (可选，规模化时使用)
CI/CD: GitHub Actions 或 GitLab CI
监控:
  - Prometheus + Grafana (指标监控)
  - ELK Stack (日志聚合)
  - Sentry (错误追踪)
Web服务器: Nginx (反向代理 + 静态文件)
CDN: 阿里云CDN / Cloudflare
```

---

## 四、数据库设计

### 4.1 核心表结构

#### 用户表 (users)
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(100),
    avatar_url VARCHAR(500),

    -- 配额相关
    quota_balance DECIMAL(10, 2) DEFAULT 0.00,  -- 豆点余额

    -- 角色权限
    role_id INTEGER REFERENCES roles(id),

    -- 状态
    status VARCHAR(20) DEFAULT 'active',  -- active/disabled/banned
    is_verified BOOLEAN DEFAULT FALSE,

    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,

    -- 软删除
    deleted_at TIMESTAMP,

    -- 索引
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_status (status)
);
```

#### 角色表 (roles)
```sql
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,  -- super_admin/admin/vip/user
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB,  -- 权限列表 JSON格式
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 预置角色数据
INSERT INTO roles (name, display_name, permissions) VALUES
('super_admin', '超级管理员', '["*"]'),
('admin', '管理员', '["user.view", "user.update", "project.view_all", "project.delete"]'),
('vip', 'VIP用户', '["project.unlimited"]'),
('user', '普通用户', '["project.create", "project.view_own"]');
```

#### 项目/任务表 (projects)
```sql
CREATE TABLE projects (
    id BIGSERIAL PRIMARY KEY,
    uuid VARCHAR(100) UNIQUE NOT NULL,  -- 外部任务ID
    user_id BIGINT REFERENCES users(id),

    -- 类型
    type VARCHAR(50) NOT NULL,  -- text2img/img2img/edit/3d_render
    subtype VARCHAR(50),  -- upscale/remove_bg/style_transfer等

    -- 输入参数
    input_params JSONB NOT NULL,  -- 存储所有输入参数

    -- 状态
    status VARCHAR(20) DEFAULT 'pending',  -- pending/processing/completed/failed
    progress INTEGER DEFAULT 0,  -- 0-100

    -- 结果
    result_url TEXT,  -- 结果图片URL
    result_urls JSONB,  -- 多张图片时使用数组
    thumbnail_url TEXT,
    error_message TEXT,

    -- 配额
    quota_cost DECIMAL(10, 2) DEFAULT 0.00,

    -- 时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,

    -- 软删除
    deleted_at TIMESTAMP,

    -- 索引
    INDEX idx_user_id (user_id),
    INDEX idx_uuid (uuid),
    INDEX idx_status (status),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at DESC)
);
```

#### 订单表 (orders)
```sql
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    order_no VARCHAR(64) UNIQUE NOT NULL,
    user_id BIGINT REFERENCES users(id),

    -- 订单信息
    amount DECIMAL(10, 2) NOT NULL,  -- 支付金额（元）
    quota_amount DECIMAL(10, 2) NOT NULL,  -- 充值豆点数

    -- 支付信息
    payment_method VARCHAR(50),  -- alipay/wechat/stripe
    payment_status VARCHAR(20) DEFAULT 'pending',  -- pending/paid/failed/refunded
    paid_at TIMESTAMP,

    -- 第三方支付信息
    transaction_id VARCHAR(200),  -- 第三方支付订单号

    -- 时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- 索引
    INDEX idx_user_id (user_id),
    INDEX idx_order_no (order_no),
    INDEX idx_payment_status (payment_status)
);
```

#### 配额变动记录表 (quota_transactions)
```sql
CREATE TABLE quota_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),

    -- 变动信息
    type VARCHAR(20) NOT NULL,  -- charge/consume/refund/gift
    amount DECIMAL(10, 2) NOT NULL,  -- 正数=增加，负数=减少
    balance_after DECIMAL(10, 2) NOT NULL,  -- 变动后余额

    -- 关联
    related_type VARCHAR(50),  -- order/project/admin_operation
    related_id BIGINT,

    -- 描述
    description TEXT,

    -- 时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- 索引
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at DESC)
);
```

#### 操作日志表 (audit_logs)
```sql
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),

    -- 操作信息
    action VARCHAR(100) NOT NULL,  -- login/create_project/delete_user等
    resource_type VARCHAR(50),
    resource_id BIGINT,

    -- 详情
    details JSONB,

    -- 请求信息
    ip_address VARCHAR(50),
    user_agent TEXT,

    -- 时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- 索引
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at DESC)
);
```

### 4.2 数据库关系图

```
users (1) ─────< (*) projects
  │
  │ (1)
  │
  └─────< (*) orders
  │
  │ (1)
  │
  └─────< (*) quota_transactions
  │
  │ (*)
  │
  └─────> (1) roles
```

---

## 五、API设计

### 5.1 用户端API

#### 认证模块
```
POST   /api/v1/auth/register         # 注册
POST   /api/v1/auth/login            # 登录
POST   /api/v1/auth/logout           # 登出
POST   /api/v1/auth/refresh          # 刷新token
POST   /api/v1/auth/reset-password   # 重置密码
```

#### 用户模块
```
GET    /api/v1/user/profile          # 获取用户信息
PUT    /api/v1/user/profile          # 更新用户信息
GET    /api/v1/user/quota            # 获取配额信息
GET    /api/v1/user/quota/history    # 配额变动历史
```

#### AI创作模块
```
# 文生图
POST   /api/v1/ai/text2img
Body: { prompt, model_id, style_id, width, height, num_images }

# 图生图
POST   /api/v1/ai/img2img
Body: { image_url, prompt, strength, ... }

# 图像编辑（统一接口）
POST   /api/v1/ai/edit
Body: {
  type: 'upscale' | 'remove_bg' | 'replace_bg' | ...,
  image_url,
  params: {...}
}

# 3D渲染
POST   /api/v1/ai/3d-render

# 轮询任务状态
GET    /api/v1/ai/tasks/{uuid}
Response: { status, progress, result_url, ... }
```

#### 项目管理模块
```
GET    /api/v1/projects              # 项目列表（分页、筛选）
GET    /api/v1/projects/{id}         # 项目详情
DELETE /api/v1/projects/{id}         # 删除项目
POST   /api/v1/projects/{id}/retry   # 重试失败任务
POST   /api/v1/projects/{id}/favorite # 收藏
```

#### 配置查询模块
```
GET    /api/v1/config/models         # 模型列表
GET    /api/v1/config/styles         # 画风列表
GET    /api/v1/config/loras          # Lora列表
GET    /api/v1/config/controlnets    # ControlNet列表
```

#### 充值模块
```
POST   /api/v1/payment/create        # 创建订单
POST   /api/v1/payment/callback      # 支付回调
GET    /api/v1/payment/orders        # 订单列表
```

### 5.2 管理后台API

#### 用户管理
```
GET    /api/v1/admin/users           # 用户列表（搜索、筛选、分页）
GET    /api/v1/admin/users/{id}      # 用户详情
PUT    /api/v1/admin/users/{id}      # 更新用户
POST   /api/v1/admin/users/{id}/disable  # 禁用用户
POST   /api/v1/admin/users/{id}/enable   # 启用用户
POST   /api/v1/admin/users/{id}/adjust-quota  # 调整配额
GET    /api/v1/admin/users/{id}/logs      # 用户操作日志
```

#### 角色权限管理
```
GET    /api/v1/admin/roles           # 角色列表
POST   /api/v1/admin/roles           # 创建角色
PUT    /api/v1/admin/roles/{id}      # 更新角色
DELETE /api/v1/admin/roles/{id}      # 删除角色
GET    /api/v1/admin/permissions     # 权限列表
```

#### 项目监控
```
GET    /api/v1/admin/projects        # 所有项目列表
DELETE /api/v1/admin/projects/{id}   # 删除项目
POST   /api/v1/admin/projects/{id}/review  # 内容审核
```

#### 财务管理
```
GET    /api/v1/admin/orders          # 订单列表
GET    /api/v1/admin/orders/{id}     # 订单详情
POST   /api/v1/admin/orders/{id}/refund  # 退款
GET    /api/v1/admin/statistics/revenue  # 收入统计
```

#### 系统管理
```
GET    /api/v1/admin/system/config   # 系统配置
PUT    /api/v1/admin/system/config   # 更新配置
GET    /api/v1/admin/system/logs     # 系统日志
GET    /api/v1/admin/statistics/dashboard  # 数据大盘
```

---

## 六、权限设计（RBAC）

### 6.1 权限模型

```python
# 权限定义
PERMISSIONS = {
    # ========== 用户管理权限 ==========
    "user.view": "查看用户列表",
    "user.view_detail": "查看用户详情",
    "user.create": "创建用户",
    "user.update": "更新用户信息",
    "user.delete": "删除用户",
    "user.disable": "禁用用户",
    "user.quota_adjust": "调整用户配额",

    # ========== 项目管理权限 ==========
    "project.view_own": "查看自己的项目",
    "project.view_all": "查看所有项目",
    "project.create": "创建项目",
    "project.delete_own": "删除自己的项目",
    "project.delete_all": "删除任何项目",
    "project.retry": "重试失败任务",

    # ========== AI服务权限 ==========
    "ai.text2img": "文生图",
    "ai.img2img": "图生图",
    "ai.edit": "图像编辑",
    "ai.3d_render": "3D渲染",
    "ai.unlimited": "无限制使用",

    # ========== 角色管理权限 ==========
    "role.view": "查看角色",
    "role.create": "创建角色",
    "role.update": "更新角色",
    "role.delete": "删除角色",

    # ========== 财务管理权限 ==========
    "finance.view_orders": "查看订单",
    "finance.refund": "处理退款",
    "finance.statistics": "查看财务统计",

    # ========== 系统管理权限 ==========
    "system.config": "系统配置",
    "system.logs": "查看系统日志",
    "system.statistics": "查看数据统计",

    # ========== 内容审核权限 ==========
    "content.audit": "内容审核",
    "content.delete": "删除违规内容",
}

# 角色配置
ROLES = {
    "super_admin": {
        "name": "超级管理员",
        "permissions": ["*"],  # 所有权限
        "description": "拥有系统所有权限"
    },

    "admin": {
        "name": "管理员",
        "permissions": [
            "user.view", "user.view_detail", "user.update",
            "user.disable", "user.quota_adjust",
            "project.view_all", "project.delete_all",
            "finance.view_orders", "finance.statistics",
            "system.logs", "system.statistics",
        ],
        "description": "运营管理员，负责用户和内容管理"
    },

    "auditor": {
        "name": "内容审核员",
        "permissions": [
            "project.view_all",
            "content.audit",
            "content.delete",
        ],
        "description": "负责内容审核和违规处理"
    },

    "vip": {
        "name": "VIP用户",
        "permissions": [
            "project.view_own", "project.create",
            "project.delete_own", "project.retry",
            "ai.text2img", "ai.img2img", "ai.edit",
            "ai.3d_render", "ai.unlimited",
        ],
        "description": "付费用户，享有更多权限"
    },

    "user": {
        "name": "普通用户",
        "permissions": [
            "project.view_own", "project.create",
            "project.delete_own",
            "ai.text2img", "ai.img2img", "ai.edit",
        ],
        "description": "普通注册用户"
    },
}
```

### 6.2 权限检查实现

```python
# services/permission_service.py
from typing import List
from app.models.user import User

class PermissionService:
    @staticmethod
    def has_permission(user: User, permission: str) -> bool:
        """检查用户是否有某个权限"""
        if not user or not user.role:
            return False

        role_permissions = user.role.permissions or []

        # 超级管理员拥有所有权限
        if "*" in role_permissions:
            return True

        # 检查具体权限
        return permission in role_permissions

    @staticmethod
    def has_any_permission(user: User, permissions: List[str]) -> bool:
        """检查用户是否有任意一个权限"""
        return any(
            PermissionService.has_permission(user, perm)
            for perm in permissions
        )

    @staticmethod
    def has_all_permissions(user: User, permissions: List[str]) -> bool:
        """检查用户是否有所有权限"""
        return all(
            PermissionService.has_permission(user, perm)
            for perm in permissions
        )

# 权限装饰器
from functools import wraps
from fastapi import HTTPException, status, Depends

def require_permission(permission: str):
    """权限检查装饰器"""
    async def permission_checker(
        current_user: User = Depends(get_current_user)
    ):
        if not PermissionService.has_permission(current_user, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {permission}"
            )
        return current_user

    return permission_checker

# 使用示例
from fastapi import APIRouter, Depends

router = APIRouter()

@router.delete("/admin/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(require_permission("user.delete"))
):
    """删除用户（需要user.delete权限）"""
    # 业务逻辑
    pass

@router.get("/admin/statistics")
async def get_statistics(
    current_user: User = Depends(require_permission("system.statistics"))
):
    """查看统计（需要system.statistics权限）"""
    # 业务逻辑
    pass
```

---

## 七、前端页面设计

### 7.1 用户端页面结构

```
用户端 (/)
│
├── 首页 (/)
│   ├── Hero Banner
│   ├── 功能展示区
│   ├── 案例展示
│   └── 定价方案
│
├── AI创作
│   ├── 文生图 (/create/text2img)
│   │   ├── 提示词输入区
│   │   ├── 参数配置面板（模型、画风、尺寸等）
│   │   └── 生成结果展示
│   │
│   ├── 图生图 (/create/img2img)
│   │   ├── 图片上传区
│   │   ├── 提示词输入
│   │   └── 参数配置
│   │
│   ├── 图像编辑 (/edit)
│   │   ├── 高清放大
│   │   ├── 智能抠图
│   │   ├── 背景替换
│   │   ├── 万物消除
│   │   └── 更多工具...
│   │
│   └── 3D渲染 (/create/3d-render)
│
├── 我的项目 (/projects)
│   ├── 全部项目
│   ├── 进行中
│   ├── 已完成
│   └── 收藏夹
│
├── 用户中心 (/user)
│   ├── 个人信息 (/user/profile)
│   ├── 配额管理 (/user/quota)
│   ├── 充值中心 (/user/recharge)
│   └── 订单记录 (/user/orders)
│
└── 登录/注册 (/auth)
    ├── 登录 (/auth/login)
    └── 注册 (/auth/register)
```

### 7.2 管理后台页面结构

```
管理后台 (/admin)
│
├── 仪表盘 (/admin/dashboard)
│   ├── 关键指标卡片（用户数、订单数、收入等）
│   ├── 趋势图表
│   └── 实时数据
│
├── 用户管理 (/admin/users)
│   ├── 用户列表
│   │   ├── 搜索/筛选
│   │   ├── 批量操作
│   │   └── 快速操作（禁用、配额调整）
│   │
│   └── 用户详情 (/admin/users/:id)
│       ├── 基本信息
│       ├── 配额记录
│       ├── 项目列表
│       ├── 订单记录
│       └── 操作日志
│
├── 角色权限 (/admin/roles)
│   ├── 角色列表
│   ├── 创建角色
│   └── 权限配置
│
├── 项目监控 (/admin/projects)
│   ├── 所有项目列表
│   ├── 状态筛选（待处理/进行中/已完成/失败）
│   ├── 内容审核
│   └── 批量操作
│
├── 财务管理 (/admin/finance)
│   ├── 订单列表 (/admin/finance/orders)
│   ├── 收入统计 (/admin/finance/revenue)
│   ├── 退款管理 (/admin/finance/refunds)
│   └── 数据报表
│
├── 系统管理 (/admin/system)
│   ├── 系统配置 (/admin/system/config)
│   │   ├── API配置
│   │   ├── 支付配置
│   │   └── 其他参数
│   │
│   ├── 操作日志 (/admin/system/logs)
│   └── 系统监控 (/admin/system/monitor)
│
└── 个人设置 (/admin/profile)
```

### 7.3 核心页面原型

#### 文生图创作页面
```
┌─────────────────────────────────────────────────────────┐
│  [Logo]  AI创作  编辑工具  我的项目  [用户] [配额:100]   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────┐  ┌──────────────────────────────┐│
│  │  参数配置面板     │  │   提示词输入区                ││
│  │                  │  │                              ││
│  │ 模型: [Dropdown] │  │  ┌────────────────────────┐ ││
│  │ 画风: [Dropdown] │  │  │ 描述你想生成的图像...   │ ││
│  │ 尺寸: [Selector] │  │  │                        │ ││
│  │ 数量: [1-4]      │  │  └────────────────────────┘ ││
│  │                  │  │                              ││
│  │ [高级参数 ▼]     │  │  [参考图片上传 📷]           ││
│  │                  │  │                              ││
│  │                  │  │  [生成图像 🎨] (消耗5豆点)   ││
│  └──────────────────┘  └──────────────────────────────┘│
│                                                          │
│  ┌────────────────────────────────────────────────────┐│
│  │  生成结果展示区                                     ││
│  │                                                     ││
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    ││
│  │  │ [IMG1] │ │ [IMG2] │ │ [IMG3] │ │ [IMG4] │    ││
│  │  │ ⬇️ ❤️ 🔄 │ │ ⬇️ ❤️ 🔄 │ │ ⬇️ ❤️ 🔄 │ │ ⬇️ ❤️ 🔄 │    ││
│  │  └────────┘ └────────┘ └────────┘ └────────┘    ││
│  │                                                     ││
│  └────────────────────────────────────────────────────┘│
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 八、外部API集成方案

### 8.1 API客户端封装

```python
# services/douhuiai_client.py
import httpx
from typing import Optional, Dict, Any
from app.config import settings

class DouhuiAIClient:
    """豆绘AI API客户端"""

    def __init__(self):
        self.base_url = settings.DOUHUIAI_API_URL
        self.app_id = settings.DOUHUIAI_APP_ID
        self.app_secret = settings.DOUHUIAI_APP_SECRET
        self.client = httpx.AsyncClient(timeout=60.0)

    def _get_headers(self) -> Dict[str, str]:
        """获取请求头"""
        return {
            "Content-Type": "application/json",
            "X-App-Id": self.app_id,
            "X-App-Secret": self.app_secret,
        }

    async def text_to_image(
        self,
        prompt: str,
        model_id: Optional[str] = None,
        style_id: Optional[str] = None,
        width: int = 512,
        height: int = 512,
        num_images: int = 1,
        **kwargs
    ) -> Dict[str, Any]:
        """文生图接口"""
        data = {
            "dhPrompt": prompt,
            "dhImgSize": f"{width}x{height}",
            "dhImgNum": str(num_images),
            **kwargs
        }

        response = await self.client.post(
            f"{self.base_url}/api/aiart/doGenerate",
            headers=self._get_headers(),
            json=data
        )
        response.raise_for_status()
        return response.json()

    async def edit_image(
        self,
        image_url: str,
        edit_type: str,  # upscale/remove_bg/replace_bg...
        params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """图像编辑统一接口"""
        data = {
            "dhInputImg": image_url,
            "dhAiType": "postprocess",
            "dhSubAiType": edit_type,
            **params
        }

        response = await self.client.post(
            f"{self.base_url}/api/aiart/doEdit",
            headers=self._get_headers(),
            json=data
        )
        response.raise_for_status()
        return response.json()

    async def poll_task(self, uuid: str) -> Dict[str, Any]:
        """轮询任务状态"""
        response = await self.client.get(
            f"{self.base_url}/api/aiart/pollTask",
            headers=self._get_headers(),
            params={"uuid": uuid}
        )
        response.raise_for_status()
        return response.json()

    async def get_models(self) -> Dict[str, Any]:
        """获取模型列表"""
        response = await self.client.get(
            f"{self.base_url}/api/config/models",
            headers=self._get_headers()
        )
        response.raise_for_status()
        return response.json()
```

### 8.2 异步任务处理

```python
# tasks/ai_tasks.py
from celery import Celery
from app.services.douhuiai_client import DouhuiAIClient
from app.models.project import Project
from app.database import SessionLocal
import asyncio

celery_app = Celery('tasks', broker='redis://localhost:6379/0')

@celery_app.task
def process_ai_task(project_id: int):
    """处理AI任务（异步）"""
    db = SessionLocal()
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return

        # 更新状态为处理中
        project.status = "processing"
        db.commit()

        # 调用API
        client = DouhuiAIClient()

        # 根据类型调用不同的API
        if project.type == "text2img":
            result = asyncio.run(
                client.text_to_image(
                    prompt=project.input_params["prompt"],
                    **project.input_params
                )
            )
        elif project.type == "edit":
            result = asyncio.run(
                client.edit_image(
                    image_url=project.input_params["image_url"],
                    edit_type=project.subtype,
                    params=project.input_params
                )
            )

        # 保存任务UUID
        project.uuid = result["uuid"]
        db.commit()

        # 开始轮询任务状态
        poll_ai_task.apply_async(args=[project_id], countdown=5)

    except Exception as e:
        project.status = "failed"
        project.error_message = str(e)
        db.commit()
    finally:
        db.close()

@celery_app.task
def poll_ai_task(project_id: int):
    """轮询AI任务状态"""
    db = SessionLocal()
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project or not project.uuid:
            return

        client = DouhuiAIClient()
        result = asyncio.run(client.poll_task(project.uuid))

        status = result.get("status")
        if status == "completed":
            # 任务完成
            project.status = "completed"
            project.result_url = result.get("result_url")
            project.result_urls = result.get("result_urls")
            project.completed_at = datetime.now()
            db.commit()
        elif status == "failed":
            # 任务失败
            project.status = "failed"
            project.error_message = result.get("error_message")
            db.commit()
        else:
            # 继续轮询
            project.progress = result.get("progress", 0)
            db.commit()
            poll_ai_task.apply_async(args=[project_id], countdown=5)
    finally:
        db.close()
```

---

## 九、部署方案

### 9.1 Docker部署

#### docker-compose.yml
```yaml
version: '3.8'

services:
  # 前端
  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    environment:
      - REACT_APP_API_URL=http://backend:8000

  # 管理后台
  admin:
    build: ./admin
    ports:
      - "3001:80"
    depends_on:
      - backend
    environment:
      - REACT_APP_API_URL=http://backend:8000

  # 后端API
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/douhuiai
      - REDIS_URL=redis://redis:6379/0
      - DOUHUIAI_APP_ID=dh2602mi6lcobtnsmn
      - DOUHUIAI_APP_SECRET=7cbe794c53bd82fdda875814cddd21e3
    volumes:
      - ./backend:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  # Celery Worker
  celery-worker:
    build: ./backend
    depends_on:
      - postgres
      - redis
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/douhuiai
      - REDIS_URL=redis://redis:6379/0
    command: celery -A app.tasks.celery_app worker --loglevel=info

  # PostgreSQL
  postgres:
    image: postgres:14
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=douhuiai_db
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 9.2 生产环境部署

```yaml
# 使用Kubernetes部署 (k8s/)

# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: douhuiai-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: douhuiai/backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
---
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: backend-service
spec:
  selector:
    app: backend
  ports:
  - port: 80
    targetPort: 8000
  type: LoadBalancer
```

---

## 十、监控与日志

### 10.1 日志方案

```python
# app/logging_config.py
from loguru import logger
import sys

# 配置日志
logger.remove()  # 移除默认处理器

# 控制台输出
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
    level="INFO"
)

# 文件输出
logger.add(
    "logs/app_{time:YYYY-MM-DD}.log",
    rotation="00:00",  # 每天轮转
    retention="30 days",  # 保留30天
    compression="zip",  # 压缩
    level="INFO"
)

# 错误日志单独记录
logger.add(
    "logs/error_{time:YYYY-MM-DD}.log",
    rotation="00:00",
    retention="90 days",
    level="ERROR"
)
```

### 10.2 监控指标

```python
# app/monitoring.py
from prometheus_client import Counter, Histogram, Gauge
import time

# 定义指标
request_count = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

request_duration = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration',
    ['method', 'endpoint']
)

active_users = Gauge(
    'active_users',
    'Number of active users'
)

ai_task_count = Counter(
    'ai_tasks_total',
    'Total AI tasks',
    ['type', 'status']
)

# 使用示例
@app.middleware("http")
async def monitor_requests(request: Request, call_next):
    start_time = time.time()

    response = await call_next(request)

    duration = time.time() - start_time
    request_count.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()

    request_duration.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)

    return response
```

---

## 十一、安全措施

### 11.1 认证安全

```python
# app/auth.py
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = "your-secret-key-here"  # 应从环境变量读取
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """哈希密码"""
    return pwd_context.hash(password)

def create_access_token(data: dict) -> str:
    """创建访问令牌"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict) -> str:
    """创建刷新令牌"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
```

### 11.2 限流保护

```python
# app/middleware/rate_limit.py
from fastapi import HTTPException, Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)

# 使用示例
@app.post("/api/v1/ai/text2img")
@limiter.limit("10/minute")  # 每分钟10次
async def text_to_image(request: Request, ...):
    pass
```

### 11.3 输入验证

```python
# app/schemas/ai_schemas.py
from pydantic import BaseModel, Field, validator

class Text2ImgRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=1000)
    model_id: Optional[str] = None
    width: int = Field(512, ge=256, le=2048)
    height: int = Field(512, ge=256, le=2048)
    num_images: int = Field(1, ge=1, le=4)

    @validator('prompt')
    def validate_prompt(cls, v):
        # 检查敏感词
        sensitive_words = ['暴力', '色情', ...]  # 实际应从数据库或配置读取
        for word in sensitive_words:
            if word in v:
                raise ValueError(f"Prompt contains sensitive word: {word}")
        return v
```

---

## 十二、开发流程与任务排期

### 12.1 开发阶段

#### **阶段1: 基础设施搭建（1-2周）**

**任务清单:**
- [x] 项目初始化
  - 创建项目目录结构
  - 配置开发环境
  - 初始化Git仓库
- [ ] 后端基础框架
  - FastAPI项目搭建
  - 数据库连接配置
  - 环境变量管理
  - 日志系统配置
- [ ] 数据库设计与迁移
  - 设计表结构
  - 编写Alembic迁移脚本
  - 创建初始数据（角色、权限）
- [ ] 认证系统
  - JWT实现
  - 用户注册/登录API
  - 密码重置功能
- [ ] 前端项目初始化
  - React + Vite搭建
  - 路由配置
  - 状态管理配置
  - API客户端配置

#### **阶段2: 核心功能开发（3-4周）**

**任务清单:**
- [ ] 外部API集成
  - 豆绘AI客户端封装
  - API接口测试
  - 错误处理
- [ ] AI功能实现
  - 文生图接口
  - 图生图接口
  - 图像编辑接口
  - 任务轮询机制
  - Celery任务队列
- [ ] 项目管理功能
  - 项目列表API
  - 项目详情API
  - 项目删除API
  - 收藏功能
- [ ] 配额系统
  - 配额扣除逻辑
  - 配额查询API
  - 配额记录API
- [ ] 用户端前端页面
  - 首页
  - 文生图创作页
  - 图像编辑工具页
  - 项目列表页
  - 用户中心

#### **阶段3: 管理后台开发（2-3周）**

**任务清单:**
- [ ] 管理后台API
  - 用户管理CRUD
  - 角色权限管理
  - 项目监控API
  - 订单管理API
  - 统计数据API
- [ ] 管理后台前端
  - 仪表盘页面
  - 用户管理页面
  - 角色权限页面
  - 项目监控页面
  - 财务管理页面
  - 系统设置页面
- [ ] 权限控制
  - RBAC实现
  - 权限中间件
  - 前端权限路由守卫

#### **阶段4: 测试与优化（1-2周）**

**任务清单:**
- [ ] 功能测试
  - 单元测试
  - 集成测试
  - API测试
  - E2E测试
- [ ] 性能优化
  - 数据库查询优化
  - API响应优化
  - 前端性能优化
  - 缓存策略
- [ ] 安全加固
  - 输入验证
  - SQL注入防护
  - XSS防护
  - CSRF防护
  - 敏感信息脱敏
- [ ] 部署准备
  - Docker镜像构建
  - 部署文档编写
  - 监控配置
  - 备份策略

### 12.2 详细任务分解

**第1周: 基础设施**
```
Day 1-2: 项目初始化
  - 创建代码仓库
  - 后端项目脚手架
  - 前端项目脚手架
  - Docker开发环境

Day 3-4: 数据库设计
  - 设计ER图
  - 编写建表SQL
  - 配置Alembic
  - 创建初始迁移

Day 5-7: 认证系统
  - JWT实现
  - 注册/登录API
  - 权限中间件
  - 前端登录页面
```

**第2-3周: 外部API集成**
```
Week 2:
  - Day 1-2: API客户端封装
  - Day 3-4: 文生图功能
  - Day 5-7: 图像编辑功能

Week 3:
  - Day 1-2: 任务轮询机制
  - Day 3-4: Celery配置
  - Day 5-7: 前端创作页面
```

**第4-5周: 核心功能**
```
Week 4:
  - 项目管理API
  - 配额系统
  - 文件上传

Week 5:
  - 项目列表页面
  - 项目详情页面
  - 用户中心页面
```

**第6-7周: 管理后台**
```
Week 6:
  - 管理后台API
  - 用户管理页面
  - 角色权限页面

Week 7:
  - 项目监控页面
  - 统计数据页面
  - 系统设置页面
```

**第8周: 测试与上线**
```
Day 1-3: 功能测试
Day 4-5: 性能优化
Day 6-7: 部署上线
```

### 12.3 人员配置建议

```
后端开发: 1-2人
  - 负责API开发、数据库设计、外部API集成

前端开发: 1-2人
  - 负责用户端和管理后台界面开发

全栈开发: 1人 (如果团队较小)
  - 负责整体开发

测试: 0.5-1人
  - 负责测试和质量保证

UI/UX: 0.5人 (兼职)
  - 负责界面设计和用户体验优化
```

---

## 十三、风险与挑战

### 13.1 技术风险

1. **外部API稳定性**
   - 风险: 豆绘AI API可能不稳定或限流
   - 应对: 实现重试机制、错误降级、备用方案

2. **AI生成耗时**
   - 风险: 生成图片可能需要较长时间
   - 应对: 使用异步任务队列、WebSocket实时推送

3. **并发处理**
   - 风险: 高并发时系统性能下降
   - 应对: 使用Redis缓存、数据库连接池、负载均衡

### 13.2 业务风险

1. **内容审核**
   - 风险: 用户生成违规内容
   - 应对: 集成内容审核API、人工审核机制

2. **配额滥用**
   - 风险: 用户恶意刷配额
   - 应对: 限流、异常检测、账号封禁

3. **成本控制**
   - 风险: API调用成本过高
   - 应对: 监控使用量、设置预算告警、优化调用策略

---

## 十四、后续优化方向

1. **功能增强**
   - 批量处理
   - 视频生成
   - 实时预览
   - 社区分享

2. **性能优化**
   - CDN加速
   - 图片压缩
   - 懒加载
   - 服务端渲染(SSR)

3. **用户体验**
   - 移动端适配
   - PWA支持
   - 离线功能
   - 多语言支持

4. **商业化**
   - 会员体系
   - 积分商城
   - 邀请返利
   - 企业版

---

## 十五、总结

### 项目规模估算
- **代码量**: 约20,000-30,000行
- **开发周期**: 7-11周
- **团队规模**: 2-4人
- **总成本**: 根据人力成本计算

### 关键成功因素
1. ✅ 完整的API文档理解
2. ✅ 稳定的外部API服务
3. ✅ 合理的架构设计
4. ✅ 完善的权限控制
5. ✅ 优秀的用户体验

### 下一步行动
1. **确认架构方案** - 由技术负责人审核
2. **启动项目** - 创建代码仓库、配置开发环境
3. **API测试** - 验证所有外部API可用性
4. **开始开发** - 按照任务清单执行

---

**文档版本**: v1.0
**更新时间**: 2026-02-14
**负责人**: [待定]

---

## 附录

### A. API接口完整清单

参见 `api_catalog.json` 文件，包含全部128个接口的详细信息。

### B. 数据库ER图

![ER图](待绘制)

### C. 原型设计稿

待UI设计师补充

### D. 技术调研报告

待补充各技术栈的详细调研结果

---

**参考资料**:
- 豆绘AI官网: https://www.douhuiai.com/
- API文档: https://mpjcmkbgup.apifox.cn/
- FastAPI文档: https://fastapi.tiangolo.com/
- React文档: https://react.dev/
