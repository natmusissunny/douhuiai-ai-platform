# 豆绘AI平台 - 开发任务清单

## 项目概览

**项目时间**: 7-11周
**团队规模**: 2-4人
**技术栈**: React + TypeScript + FastAPI + PostgreSQL

---

## 阶段一: 基础设施搭建（1-2周）

### 1.1 项目初始化

- [ ] **创建项目结构**
  - [ ] 初始化Git仓库
  - [ ] 创建后端目录结构 (`backend/`)
  - [ ] 创建前端用户端 (`frontend/`)
  - [ ] 创建管理后台 (`admin/`)
  - [ ] 创建文档目录 (`docs/`)
  - [ ] 编写 `.gitignore`
  - [ ] 编写 `README.md`

- [ ] **开发环境配置**
  - [ ] 安装 Docker 和 Docker Compose
  - [ ] 配置 `docker-compose.yml`
  - [ ] 配置 PostgreSQL 容器
  - [ ] 配置 Redis 容器
  - [ ] 配置开发用 Nginx (可选)
  - [ ] 验证环境可用性

### 1.2 后端基础框架

- [ ] **FastAPI项目搭建**
  - [ ] 创建虚拟环境 (`python -m venv venv`)
  - [ ] 安装依赖包
    ```bash
    pip install fastapi uvicorn sqlalchemy alembic pydantic-settings
    pip install psycopg2-binary redis celery
    pip install python-jose passlib bcrypt
    pip install httpx loguru
    ```
  - [ ] 创建 `app/main.py` (FastAPI应用入口)
  - [ ] 配置 CORS
  - [ ] 配置静态文件服务
  - [ ] 创建健康检查接口 (`/health`)

- [ ] **配置管理**
  - [ ] 创建 `app/config.py`
  - [ ] 配置环境变量 (`.env` 文件)
  - [ ] 配置数据库连接
  - [ ] 配置Redis连接
  - [ ] 配置外部API凭证
  - [ ] 配置JWT密钥

- [ ] **日志系统**
  - [ ] 配置 loguru
  - [ ] 设置日志格式
  - [ ] 设置日志文件轮转
  - [ ] 添加请求日志中间件

### 1.3 数据库设计与迁移

- [ ] **数据库设计**
  - [ ] 设计 ER 图
  - [ ] 定义表结构
    - [ ] users (用户表)
    - [ ] roles (角色表)
    - [ ] projects (项目表)
    - [ ] orders (订单表)
    - [ ] quota_transactions (配额记录表)
    - [ ] audit_logs (审计日志表)
  - [ ] 定义索引和约束
  - [ ] 设计数据库视图 (如统计视图)

- [ ] **SQLAlchemy模型**
  - [ ] 创建 `app/models/user.py`
  - [ ] 创建 `app/models/role.py`
  - [ ] 创建 `app/models/project.py`
  - [ ] 创建 `app/models/order.py`
  - [ ] 创建 `app/models/quota_transaction.py`
  - [ ] 创建 `app/models/audit_log.py`
  - [ ] 创建 `app/database.py` (数据库连接)

- [ ] **Alembic迁移**
  - [ ] 初始化 Alembic (`alembic init`)
  - [ ] 配置 `alembic.ini`
  - [ ] 创建初始迁移
  - [ ] 执行迁移
  - [ ] 创建初始数据脚本
    - [ ] 插入默认角色
    - [ ] 插入超级管理员账号
    - [ ] 插入测试数据

### 1.4 认证系统

- [ ] **JWT实现**
  - [ ] 创建 `app/auth/jwt.py`
  - [ ] 实现密码哈希 (bcrypt)
  - [ ] 实现访问令牌生成
  - [ ] 实现刷新令牌生成
  - [ ] 实现令牌验证
  - [ ] 实现令牌刷新

- [ ] **认证API**
  - [ ] POST `/api/v1/auth/register` (注册)
    - [ ] 验证邮箱格式
    - [ ] 验证用户名唯一性
    - [ ] 哈希密码
    - [ ] 创建用户
    - [ ] 返回令牌
  - [ ] POST `/api/v1/auth/login` (登录)
    - [ ] 验证用户名/邮箱
    - [ ] 验证密码
    - [ ] 返回访问令牌和刷新令牌
  - [ ] POST `/api/v1/auth/refresh` (刷新令牌)
  - [ ] POST `/api/v1/auth/logout` (登出)
  - [ ] POST `/api/v1/auth/reset-password` (重置密码)

- [ ] **权限依赖**
  - [ ] 创建 `app/dependencies.py`
  - [ ] 实现 `get_current_user` 依赖
  - [ ] 实现 `require_permission` 装饰器
  - [ ] 实现 `require_role` 装饰器

### 1.5 前端项目初始化

- [ ] **用户端前端 (frontend/)**
  - [ ] 使用 Vite 创建 React 项目
    ```bash
    npm create vite@latest frontend -- --template react-ts
    ```
  - [ ] 安装依赖
    ```bash
    npm install react-router-dom zustand axios
    npm install antd @ant-design/icons
    npm install tailwindcss postcss autoprefixer
    npm install framer-motion react-dropzone
    ```
  - [ ] 配置 Tailwind CSS
  - [ ] 配置路由 (`src/router/index.tsx`)
  - [ ] 创建布局组件
    - [ ] `MainLayout.tsx`
    - [ ] `Header.tsx`
    - [ ] `Footer.tsx`
    - [ ] `Sidebar.tsx`
  - [ ] 配置 Axios 实例
  - [ ] 配置状态管理 (Zustand stores)
    - [ ] `useAuthStore` (认证状态)
    - [ ] `useUserStore` (用户信息)
    - [ ] `useProjectStore` (项目列表)

- [ ] **管理后台 (admin/)**
  - [ ] 使用 Vite 创建 React 项目
  - [ ] 安装 Ant Design Pro (或 Ant Design)
  - [ ] 配置路由
  - [ ] 创建后台布局
  - [ ] 配置 API 客户端
  - [ ] 配置状态管理

---

## 阶段二: 核心功能开发（3-4周）

### 2.1 外部API集成

- [ ] **豆绘AI客户端封装**
  - [ ] 创建 `app/services/douhuiai_client.py`
  - [ ] 实现认证逻辑
    - [ ] 测试不同的认证方式 (Header/Body)
    - [ ] 确定正确的认证方式
  - [ ] 实现基础请求方法
    - [ ] `_request(method, path, **kwargs)`
    - [ ] 错误处理
    - [ ] 重试机制
  - [ ] 实现具体接口方法
    - [ ] `text_to_image()` - 文生图
    - [ ] `image_to_image()` - 图生图
    - [ ] `edit_image()` - 图像编辑
    - [ ] `render_3d()` - 3D渲染
    - [ ] `poll_task()` - 任务轮询
    - [ ] `get_models()` - 获取模型列表
    - [ ] `get_styles()` - 获取画风列表
    - [ ] `get_loras()` - 获取Lora列表

- [ ] **API接口测试**
  - [ ] 测试文生图接口
  - [ ] 测试图生图接口
  - [ ] 测试所有图像编辑功能
    - [ ] 高清放大
    - [ ] AI抠图
    - [ ] 换背景
    - [ ] 万物消除
    - [ ] 智能改图
    - [ ] 去水印
    - [ ] 等等...
  - [ ] 测试任务轮询
  - [ ] 测试配置查询
  - [ ] 编写单元测试

### 2.2 AI功能实现

- [ ] **Pydantic Schemas**
  - [ ] 创建 `app/schemas/ai_schemas.py`
  - [ ] `Text2ImgRequest` - 文生图请求
  - [ ] `Img2ImgRequest` - 图生图请求
  - [ ] `EditImageRequest` - 编辑图像请求
  - [ ] `TaskResponse` - 任务响应
  - [ ] `TaskStatusResponse` - 任务状态响应

- [ ] **AI服务层**
  - [ ] 创建 `app/services/ai_service.py`
  - [ ] `create_text2img_project()` - 创建文生图任务
  - [ ] `create_img2img_project()` - 创建图生图任务
  - [ ] `create_edit_project()` - 创建编辑任务
  - [ ] `get_project_status()` - 获取任务状态
  - [ ] `handle_task_callback()` - 处理任务回调

- [ ] **AI接口 API**
  - [ ] 创建 `app/api/v1/ai.py`
  - [ ] POST `/api/v1/ai/text2img`
    - [ ] 验证输入参数
    - [ ] 检查用户配额
    - [ ] 创建项目记录
    - [ ] 调用外部API
    - [ ] 扣除配额
    - [ ] 触发异步任务
    - [ ] 返回任务ID
  - [ ] POST `/api/v1/ai/img2img`
  - [ ] POST `/api/v1/ai/edit`
  - [ ] POST `/api/v1/ai/3d-render`
  - [ ] GET `/api/v1/ai/tasks/{uuid}` (任务状态查询)

- [ ] **Celery任务队列**
  - [ ] 配置 Celery
    - [ ] 创建 `app/celery_app.py`
    - [ ] 配置 Redis 作为 broker
    - [ ] 配置任务路由
  - [ ] 创建 `app/tasks/ai_tasks.py`
  - [ ] 实现 `process_ai_task(project_id)` 任务
    - [ ] 调用外部API
    - [ ] 保存任务UUID
    - [ ] 更新项目状态为"处理中"
    - [ ] 触发轮询任务
  - [ ] 实现 `poll_ai_task(project_id)` 任务
    - [ ] 轮询外部API
    - [ ] 更新项目进度
    - [ ] 处理完成/失败状态
    - [ ] 保存结果URL
  - [ ] 实现错误重试机制
  - [ ] 实现任务超时处理

### 2.3 文件上传功能

- [ ] **文件上传服务**
  - [ ] 创建 `app/services/upload_service.py`
  - [ ] 实现本地上传 (开发环境)
  - [ ] 实现OSS上传 (生产环境)
    - [ ] 配置阿里云OSS SDK
    - [ ] 实现文件上传
    - [ ] 实现临时URL生成
  - [ ] 图片压缩和格式转换
  - [ ] 文件类型验证
  - [ ] 文件大小限制

- [ ] **上传API**
  - [ ] POST `/api/v1/upload/image` (图片上传)
  - [ ] 返回图片URL

### 2.4 项目管理功能

- [ ] **项目服务层**
  - [ ] 创建 `app/services/project_service.py`
  - [ ] `get_user_projects()` - 获取用户项目列表
  - [ ] `get_project_detail()` - 获取项目详情
  - [ ] `delete_project()` - 删除项目
  - [ ] `retry_project()` - 重试失败任务
  - [ ] `favorite_project()` - 收藏项目

- [ ] **项目管理API**
  - [ ] 创建 `app/api/v1/projects.py`
  - [ ] GET `/api/v1/projects`
    - [ ] 分页
    - [ ] 筛选 (type, status)
    - [ ] 排序
  - [ ] GET `/api/v1/projects/{id}`
  - [ ] DELETE `/api/v1/projects/{id}`
  - [ ] POST `/api/v1/projects/{id}/retry`
  - [ ] POST `/api/v1/projects/{id}/favorite`

### 2.5 配额系统

- [ ] **配额服务层**
  - [ ] 创建 `app/services/quota_service.py`
  - [ ] `check_quota()` - 检查配额是否足够
  - [ ] `consume_quota()` - 消耗配额
  - [ ] `add_quota()` - 增加配额
  - [ ] `refund_quota()` - 退款配额
  - [ ] `get_quota_history()` - 获取配额记录

- [ ] **配额API**
  - [ ] GET `/api/v1/user/quota` - 获取配额余额
  - [ ] GET `/api/v1/user/quota/history` - 配额变动历史

- [ ] **配额计费规则**
  - [ ] 定义不同功能的配额消耗
    - [ ] 文生图: 5豆点/张
    - [ ] 高清放大: 3豆点/张
    - [ ] AI抠图: 2豆点/张
    - [ ] 等等...
  - [ ] 实现动态定价 (可配置)

### 2.6 配置查询功能

- [ ] **配置API**
  - [ ] 创建 `app/api/v1/config.py`
  - [ ] GET `/api/v1/config/models` - 模型列表
  - [ ] GET `/api/v1/config/styles` - 画风列表
  - [ ] GET `/api/v1/config/loras` - Lora列表
  - [ ] GET `/api/v1/config/controlnets` - ControlNet列表
  - [ ] 实现缓存 (Redis, 1小时)

### 2.7 用户端前端页面

- [ ] **认证页面**
  - [ ] 登录页 (`/auth/login`)
    - [ ] 登录表单
    - [ ] 表单验证
    - [ ] 错误提示
    - [ ] 记住我功能
  - [ ] 注册页 (`/auth/register`)
  - [ ] 忘记密码页 (`/auth/forgot-password`)

- [ ] **首页**
  - [ ] Hero Banner
  - [ ] 功能展示区
  - [ ] 案例展示
  - [ ] CTA按钮

- [ ] **文生图创作页** (`/create/text2img`)
  - [ ] 提示词输入区
    - [ ] 多行文本框
    - [ ] 字数统计
    - [ ] 示例提示词
  - [ ] 参数配置面板
    - [ ] 模型选择 (下拉框)
    - [ ] 画风选择 (卡片选择)
    - [ ] 尺寸选择 (预设尺寸)
    - [ ] 图片数量 (1-4)
    - [ ] 高级参数折叠面板
  - [ ] 生成按钮
    - [ ] 显示消耗豆点
    - [ ] 加载状态
  - [ ] 结果展示区
    - [ ] 图片网格
    - [ ] 图片预览
    - [ ] 下载按钮
    - [ ] 收藏按钮
    - [ ] 重新生成按钮
  - [ ] 实时进度显示
    - [ ] 进度条
    - [ ] 预计剩余时间

- [ ] **图生图创作页** (`/create/img2img`)
  - [ ] 图片上传区
    - [ ] 拖拽上传
    - [ ] 点击上传
    - [ ] 图片预览
  - [ ] 提示词输入
  - [ ] 参数配置
  - [ ] 结果展示

- [ ] **图像编辑页** (`/edit`)
  - [ ] 工具选择侧边栏
    - [ ] 高清放大
    - [ ] AI抠图
    - [ ] 换背景
    - [ ] 万物消除
    - [ ] 智能改图
    - [ ] 去水印
    - [ ] 等等...
  - [ ] 图片上传区
  - [ ] 编辑参数配置
  - [ ] 实时预览
  - [ ] 结果对比 (原图 vs 处理后)

- [ ] **项目列表页** (`/projects`)
  - [ ] 项目卡片
    - [ ] 缩略图
    - [ ] 标题
    - [ ] 创建时间
    - [ ] 状态标签
  - [ ] 筛选器
    - [ ] 按类型筛选
    - [ ] 按状态筛选
  - [ ] 排序
  - [ ] 分页
  - [ ] 批量操作
    - [ ] 批量删除
    - [ ] 批量下载

- [ ] **项目详情页** (`/projects/:id`)
  - [ ] 图片展示
    - [ ] 大图预览
    - [ ] 图片缩放
  - [ ] 项目信息
    - [ ] 类型
    - [ ] 创建时间
    - [ ] 状态
    - [ ] 输入参数
  - [ ] 操作按钮
    - [ ] 下载
    - [ ] 删除
    - [ ] 重新生成
    - [ ] 收藏

- [ ] **用户中心**
  - [ ] 个人信息页 (`/user/profile`)
    - [ ] 头像上传
    - [ ] 基本信息编辑
    - [ ] 修改密码
  - [ ] 配额管理页 (`/user/quota`)
    - [ ] 当前余额
    - [ ] 配额变动记录
    - [ ] 充值按钮
  - [ ] 充值中心 (`/user/recharge`)
    - [ ] 充值套餐选择
    - [ ] 支付方式选择
    - [ ] 支付流程
  - [ ] 订单记录 (`/user/orders`)
    - [ ] 订单列表
    - [ ] 订单详情

---

## 阶段三: 管理后台开发（2-3周）

### 3.1 管理后台API

- [ ] **用户管理API**
  - [ ] 创建 `app/api/v1/admin/users.py`
  - [ ] GET `/api/v1/admin/users` - 用户列表
    - [ ] 搜索 (username, email)
    - [ ] 筛选 (role, status)
    - [ ] 排序
    - [ ] 分页
  - [ ] GET `/api/v1/admin/users/{id}` - 用户详情
  - [ ] PUT `/api/v1/admin/users/{id}` - 更新用户
  - [ ] POST `/api/v1/admin/users/{id}/disable` - 禁用用户
  - [ ] POST `/api/v1/admin/users/{id}/enable` - 启用用户
  - [ ] POST `/api/v1/admin/users/{id}/adjust-quota` - 调整配额
  - [ ] GET `/api/v1/admin/users/{id}/logs` - 用户日志
  - [ ] 权限检查 (require_permission)

- [ ] **角色权限API**
  - [ ] 创建 `app/api/v1/admin/roles.py`
  - [ ] GET `/api/v1/admin/roles` - 角色列表
  - [ ] POST `/api/v1/admin/roles` - 创建角色
  - [ ] PUT `/api/v1/admin/roles/{id}` - 更新角色
  - [ ] DELETE `/api/v1/admin/roles/{id}` - 删除角色
  - [ ] GET `/api/v1/admin/permissions` - 权限列表

- [ ] **项目监控API**
  - [ ] 创建 `app/api/v1/admin/projects.py`
  - [ ] GET `/api/v1/admin/projects` - 所有项目列表
  - [ ] DELETE `/api/v1/admin/projects/{id}` - 删除项目
  - [ ] POST `/api/v1/admin/projects/{id}/review` - 内容审核

- [ ] **订单管理API**
  - [ ] 创建 `app/api/v1/admin/orders.py`
  - [ ] GET `/api/v1/admin/orders` - 订单列表
  - [ ] GET `/api/v1/admin/orders/{id}` - 订单详情
  - [ ] POST `/api/v1/admin/orders/{id}/refund` - 退款

- [ ] **统计数据API**
  - [ ] 创建 `app/api/v1/admin/statistics.py`
  - [ ] GET `/api/v1/admin/statistics/dashboard` - 仪表盘数据
    - [ ] 用户总数
    - [ ] 今日新增用户
    - [ ] 项目总数
    - [ ] 今日项目数
    - [ ] 订单总数
    - [ ] 总收入
    - [ ] 今日收入
  - [ ] GET `/api/v1/admin/statistics/revenue` - 收入统计
  - [ ] GET `/api/v1/admin/statistics/users` - 用户统计
  - [ ] GET `/api/v1/admin/statistics/projects` - 项目统计

- [ ] **系统管理API**
  - [ ] 创建 `app/api/v1/admin/system.py`
  - [ ] GET `/api/v1/admin/system/config` - 系统配置
  - [ ] PUT `/api/v1/admin/system/config` - 更新配置
  - [ ] GET `/api/v1/admin/system/logs` - 系统日志

### 3.2 管理后台前端

- [ ] **布局组件**
  - [ ] 侧边栏菜单
  - [ ] 顶部导航栏
  - [ ] 面包屑导航
  - [ ] 用户下拉菜单

- [ ] **仪表盘页** (`/admin/dashboard`)
  - [ ] 关键指标卡片
    - [ ] 用户数
    - [ ] 项目数
    - [ ] 订单数
    - [ ] 收入
  - [ ] 趋势图表
    - [ ] 用户增长曲线
    - [ ] 收入趋势
    - [ ] 项目数量趋势
  - [ ] 实时数据
    - [ ] 最新用户
    - [ ] 最新订单
    - [ ] 最新项目

- [ ] **用户管理页** (`/admin/users`)
  - [ ] 用户列表表格
    - [ ] 列: ID, 用户名, 邮箱, 角色, 状态, 配额, 创建时间
    - [ ] 搜索框
    - [ ] 筛选器 (角色, 状态)
    - [ ] 排序
    - [ ] 分页
  - [ ] 快速操作
    - [ ] 查看详情
    - [ ] 编辑
    - [ ] 禁用/启用
    - [ ] 调整配额
  - [ ] 批量操作
    - [ ] 批量禁用
    - [ ] 批量启用

- [ ] **用户详情页** (`/admin/users/:id`)
  - [ ] 基本信息卡片
  - [ ] 配额记录表格
  - [ ] 项目列表表格
  - [ ] 订单记录表格
  - [ ] 操作日志表格

- [ ] **角色权限页** (`/admin/roles`)
  - [ ] 角色列表表格
  - [ ] 创建角色弹窗
  - [ ] 编辑角色弹窗
  - [ ] 权限配置
    - [ ] 权限树形结构
    - [ ] 全选/取消全选
    - [ ] 权限搜索

- [ ] **项目监控页** (`/admin/projects`)
  - [ ] 项目列表表格
    - [ ] 列: 缩略图, 用户, 类型, 状态, 创建时间
    - [ ] 筛选器 (类型, 状态)
    - [ ] 搜索 (用户名)
  - [ ] 批量操作
    - [ ] 批量删除
    - [ ] 批量审核

- [ ] **财务管理页**
  - [ ] 订单列表页 (`/admin/finance/orders`)
    - [ ] 订单表格
    - [ ] 筛选器 (支付状态)
    - [ ] 搜索 (订单号, 用户名)
  - [ ] 收入统计页 (`/admin/finance/revenue`)
    - [ ] 收入趋势图
    - [ ] 统计报表
  - [ ] 退款管理页 (`/admin/finance/refunds`)

- [ ] **系统管理页**
  - [ ] 系统配置页 (`/admin/system/config`)
    - [ ] 配置表单
    - [ ] API配置
    - [ ] 支付配置
    - [ ] 邮件配置
  - [ ] 操作日志页 (`/admin/system/logs`)
    - [ ] 日志表格
    - [ ] 筛选器 (操作类型, 时间范围)
    - [ ] 搜索 (用户名, 操作)

### 3.3 权限控制实现

- [ ] **后端权限中间件**
  - [ ] 创建 `app/middleware/permission.py`
  - [ ] 实现权限检查逻辑
  - [ ] 为所有管理接口添加权限检查

- [ ] **前端路由守卫**
  - [ ] 创建路由守卫 (`router/guards.ts`)
  - [ ] 检查用户角色
  - [ ] 检查页面权限
  - [ ] 重定向到403页面

- [ ] **前端权限指令**
  - [ ] 创建 `v-permission` 指令
  - [ ] 根据权限显示/隐藏按钮
  - [ ] 根据权限启用/禁用功能

---

## 阶段四: 测试与优化（1-2周）

### 4.1 功能测试

- [ ] **单元测试 (后端)**
  - [ ] 安装 pytest
    ```bash
    pip install pytest pytest-asyncio pytest-cov
    ```
  - [ ] 创建 `tests/` 目录
  - [ ] 测试认证模块
    - [ ] 密码哈希
    - [ ] JWT生成/验证
    - [ ] 登录逻辑
  - [ ] 测试权限模块
    - [ ] 权限检查
    - [ ] 角色权限
  - [ ] 测试配额模块
    - [ ] 配额扣除
    - [ ] 配额退款
  - [ ] 测试AI服务模块
    - [ ] API调用 (使用mock)
    - [ ] 任务轮询
  - [ ] 运行测试
    ```bash
    pytest --cov=app tests/
    ```

- [ ] **集成测试**
  - [ ] 测试完整的API流程
    - [ ] 注册 -> 登录 -> 创建项目 -> 查询项目
  - [ ] 测试权限控制
  - [ ] 测试异常处理

- [ ] **API测试**
  - [ ] 使用 Postman 或 Insomnia
  - [ ] 创建测试集合
  - [ ] 测试所有API端点
  - [ ] 测试边界情况
  - [ ] 测试错误处理

- [ ] **前端测试**
  - [ ] 安装 Jest + Testing Library
    ```bash
    npm install --save-dev @testing-library/react @testing-library/jest-dom
    ```
  - [ ] 测试关键组件
  - [ ] 测试表单验证
  - [ ] 测试状态管理

- [ ] **E2E测试 (可选)**
  - [ ] 安装 Cypress 或 Playwright
  - [ ] 编写端到端测试用例
    - [ ] 用户注册流程
    - [ ] 用户登录流程
    - [ ] 创建项目流程
    - [ ] 管理后台流程

### 4.2 性能优化

- [ ] **后端优化**
  - [ ] 数据库查询优化
    - [ ] 添加必要的索引
    - [ ] 优化N+1查询问题
    - [ ] 使用 `select_related` / `joinedload`
  - [ ] API响应优化
    - [ ] 实现分页
    - [ ] 字段裁剪 (只返回需要的字段)
    - [ ] 压缩响应 (gzip)
  - [ ] 缓存策略
    - [ ] 使用Redis缓存热数据
    - [ ] 缓存配置数据 (模型, 画风等)
    - [ ] 缓存用户会话
  - [ ] 异步处理
    - [ ] 使用Celery处理耗时任务
    - [ ] 实现任务队列优先级

- [ ] **前端优化**
  - [ ] 代码分割
    - [ ] 路由懒加载
    - [ ] 组件懒加载
  - [ ] 图片优化
    - [ ] 图片懒加载
    - [ ] 响应式图片
    - [ ] WebP格式
  - [ ] 打包优化
    - [ ] Tree shaking
    - [ ] 代码压缩
    - [ ] 资源预加载
  - [ ] 缓存策略
    - [ ] Service Worker (PWA)
    - [ ] 浏览器缓存

- [ ] **数据库优化**
  - [ ] 分析慢查询
  - [ ] 优化索引
  - [ ] 考虑读写分离 (规模化时)
  - [ ] 考虑分库分表 (规模化时)

### 4.3 安全加固

- [ ] **输入验证**
  - [ ] 所有API使用Pydantic验证
  - [ ] 前端表单验证
  - [ ] 文件类型验证
  - [ ] 文件大小限制

- [ ] **SQL注入防护**
  - [ ] 使用ORM (SQLAlchemy)
  - [ ] 避免原始SQL查询
  - [ ] 参数化查询

- [ ] **XSS防护**
  - [ ] 前端转义用户输入
  - [ ] 使用 Content-Security-Policy
  - [ ] 验证和清理HTML内容

- [ ] **CSRF防护**
  - [ ] 使用CSRF令牌
  - [ ] 验证请求来源
  - [ ] SameSite Cookie

- [ ] **敏感信息保护**
  - [ ] 日志脱敏
  - [ ] 密码不明文存储
  - [ ] API密钥加密存储
  - [ ] 使用HTTPS

- [ ] **限流保护**
  - [ ] 实现API限流
    - [ ] 使用 slowapi
    - [ ] 基于IP限流
    - [ ] 基于用户限流
  - [ ] 登录失败限制
  - [ ] 验证码 (防止暴力破解)

- [ ] **内容审核**
  - [ ] 集成内容审核API
    - [ ] 腾讯云内容安全
    - [ ] 阿里云内容安全
  - [ ] 敏感词过滤
  - [ ] 人工审核流程

### 4.4 部署准备

- [ ] **Docker化**
  - [ ] 编写后端 Dockerfile
    ```dockerfile
    FROM python:3.10-slim
    WORKDIR /app
    COPY requirements.txt .
    RUN pip install -r requirements.txt
    COPY . .
    CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
    ```
  - [ ] 编写前端 Dockerfile
  - [ ] 编写 docker-compose.yml
  - [ ] 测试容器化部署

- [ ] **环境配置**
  - [ ] 开发环境配置
  - [ ] 测试环境配置
  - [ ] 生产环境配置
  - [ ] 环境变量文档

- [ ] **CI/CD**
  - [ ] 配置 GitHub Actions 或 GitLab CI
  - [ ] 自动化测试
  - [ ] 自动化构建
  - [ ] 自动化部署

- [ ] **监控配置**
  - [ ] 配置 Prometheus
  - [ ] 配置 Grafana
  - [ ] 配置告警规则
  - [ ] 配置日志聚合 (ELK)
  - [ ] 配置错误追踪 (Sentry)

- [ ] **备份策略**
  - [ ] 数据库备份脚本
  - [ ] 定时备份任务
  - [ ] 备份恢复测试

- [ ] **文档编写**
  - [ ] API文档 (Swagger/ReDoc)
  - [ ] 部署文档
  - [ ] 运维文档
  - [ ] 用户手册
  - [ ] 开发者指南

---

## 阶段五: 上线与维护

### 5.1 上线前检查

- [ ] **功能检查清单**
  - [ ] 所有API功能正常
  - [ ] 前端页面功能正常
  - [ ] 支付流程正常
  - [ ] 邮件发送正常
  - [ ] 权限控制正常

- [ ] **性能检查**
  - [ ] 压力测试
  - [ ] 并发测试
  - [ ] 数据库性能
  - [ ] API响应时间

- [ ] **安全检查**
  - [ ] 安全扫描
  - [ ] 渗透测试
  - [ ] 依赖漏洞检查
  - [ ] 配置检查

### 5.2 上线部署

- [ ] **域名配置**
  - [ ] 购买域名
  - [ ] 配置DNS
  - [ ] 申请SSL证书

- [ ] **服务器准备**
  - [ ] 购买云服务器
  - [ ] 安装必要软件
  - [ ] 配置防火墙
  - [ ] 配置Nginx

- [ ] **应用部署**
  - [ ] 部署后端
  - [ ] 部署前端
  - [ ] 部署管理后台
  - [ ] 配置负载均衡 (可选)

- [ ] **数据初始化**
  - [ ] 运行数据库迁移
  - [ ] 创建管理员账号
  - [ ] 导入初始数据

### 5.3 上线后维护

- [ ] **监控**
  - [ ] 实时监控服务状态
  - [ ] 监控错误日志
  - [ ] 监控性能指标
  - [ ] 监控用户行为

- [ ] **备份**
  - [ ] 定期数据库备份
  - [ ] 定期文件备份
  - [ ] 验证备份可恢复性

- [ ] **更新维护**
  - [ ] 定期更新依赖
  - [ ] 修复bug
  - [ ] 功能迭代
  - [ ] 性能优化

---

## 附录

### A. 开发环境配置

#### 后端环境
```bash
# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 运行数据库迁移
alembic upgrade head

# 启动开发服务器
uvicorn app.main:app --reload
```

#### 前端环境
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

#### Docker环境
```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### B. 依赖清单

#### 后端依赖 (requirements.txt)
```
fastapi==0.109.0
uvicorn[standard]==0.27.0
sqlalchemy==2.0.25
alembic==1.13.1
psycopg2-binary==2.9.9
pydantic==2.5.3
pydantic-settings==2.1.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
httpx==0.26.0
redis==5.0.1
celery==5.3.6
loguru==0.7.2
prometheus-client==0.19.0
slowapi==0.1.9
```

#### 前端依赖 (package.json)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.1",
    "zustand": "^4.4.7",
    "axios": "^1.6.5",
    "antd": "^5.13.0",
    "@ant-design/icons": "^5.2.6",
    "tailwindcss": "^3.4.1",
    "framer-motion": "^10.18.0",
    "react-dropzone": "^14.2.3"
  },
  "devDependencies": {
    "@types/react": "^18.2.47",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.11",
    "typescript": "^5.3.3"
  }
}
```

### C. 快速命令参考

```bash
# 后端
uvicorn app.main:app --reload                # 启动后端开发服务器
alembic revision --autogenerate -m "message" # 创建迁移
alembic upgrade head                          # 执行迁移
celery -A app.tasks.celery_app worker        # 启动Celery worker
pytest                                        # 运行测试

# 前端
npm run dev                                   # 启动开发服务器
npm run build                                 # 构建生产版本
npm run preview                               # 预览生产版本

# Docker
docker-compose up -d                          # 启动所有服务
docker-compose down                           # 停止所有服务
docker-compose logs -f backend                # 查看后端日志
```

---

**任务清单更新时间**: 2026-02-14
**预计完成时间**: 7-11周
**当前状态**: 架构设计阶段
