# 豆绘AI平台 - 开发指南

## 📋 目录

- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [开发环境搭建](#开发环境搭建)
- [代码规范](#代码规范)
- [API开发](#api开发)
- [数据库开发](#数据库开发)
- [前端开发](#前端开发)
- [测试开发](#测试开发)
- [调试技巧](#调试技巧)

---

## 技术栈

### 后端
- **框架**: FastAPI 0.109+
- **数据库**: PostgreSQL 14 + SQLAlchemy 2.0
- **缓存**: Redis 7
- **任务队列**: Celery 5.3
- **认证**: JWT (python-jose)
- **数据验证**: Pydantic v2
- **数据库迁移**: Alembic

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **状态管理**: Zustand
- **UI组件**: Ant Design 5
- **样式**: Tailwind CSS
- **HTTP客户端**: Axios

### 开发工具
- **代码格式化**: Black, isort (Python) / Prettier (TypeScript)
- **代码检查**: Flake8, mypy (Python) / ESLint (TypeScript)
- **测试**: pytest, pytest-cov
- **容器化**: Docker, Docker Compose

---

## 项目结构

```
douhuiai-ai-platform/
├── backend/                 # 后端代码
│   ├── app/
│   │   ├── api/            # API路由
│   │   │   └── v1/         # API v1版本
│   │   │       ├── auth.py       # 认证相关
│   │   │       ├── users.py      # 用户管理
│   │   │       ├── projects.py   # 项目管理
│   │   │       └── admin.py      # 管理后台
│   │   ├── models/         # 数据库模型
│   │   │   ├── user.py
│   │   │   ├── project.py
│   │   │   ├── role.py
│   │   │   └── ...
│   │   ├── schemas/        # Pydantic模型
│   │   │   ├── auth.py
│   │   │   ├── user.py
│   │   │   └── project.py
│   │   ├── services/       # 业务逻辑层
│   │   │   ├── project.py
│   │   │   └── douhuiai.py
│   │   ├── tasks/          # Celery任务
│   │   │   ├── celery_app.py
│   │   │   └── project_tasks.py
│   │   ├── utils/          # 工具函数
│   │   │   └── security.py
│   │   ├── config.py       # 配置文件
│   │   ├── database.py     # 数据库连接
│   │   ├── dependencies.py # FastAPI依赖
│   │   └── main.py         # 应用入口
│   ├── alembic/            # 数据库迁移
│   ├── tests/              # 测试代码
│   ├── requirements.txt    # Python依赖
│   └── Dockerfile
├── frontend/               # 前端代码
│   ├── src/
│   │   ├── api/           # API客户端
│   │   ├── components/    # React组件
│   │   ├── pages/         # 页面组件
│   │   ├── stores/        # Zustand状态
│   │   ├── types/         # TypeScript类型
│   │   ├── utils/         # 工具函数
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── Dockerfile
├── docs/                   # 文档
├── scripts/                # 脚本工具
├── docker-compose.yml      # Docker编排
├── .env.example            # 环境变量示例
└── README.md
```

---

## 开发环境搭建

### 1. 克隆项目

```bash
git clone https://github.com/your-org/douhuiai-ai-platform.git
cd douhuiai-ai-platform
```

### 2. 后端环境

```bash
cd backend

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp ../.env.example ../.env
# 编辑.env文件填写配置

# 启动数据库和Redis
cd ..
docker-compose up -d postgres redis

# 运行数据库迁移
cd backend
alembic upgrade head

# 启动开发服务器
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. 前端环境

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 4. Celery任务队列

```bash
cd backend

# 启动Worker
celery -A app.tasks.celery_app worker --loglevel=info

# 启动Beat (定时任务)
celery -A app.tasks.celery_app beat --loglevel=info
```

---

## 代码规范

### Python代码规范

遵循 **PEP 8** 规范,使用以下工具:

#### 1. Black - 代码格式化

```bash
# 格式化单个文件
black app/main.py

# 格式化整个项目
black .

# 检查而不修改
black --check .
```

配置 (`pyproject.toml`):
```toml
[tool.black]
line-length = 100
target-version = ['py312']
include = '\.pyi?$'
extend-exclude = '''
/(
  # directories
  \.eggs
  | \.git
  | \.venv
  | venv
  | build
  | dist
)/
'''
```

#### 2. isort - 导入排序

```bash
# 排序导入
isort .

# 检查而不修改
isort --check-only .
```

配置 (`.isort.cfg`):
```ini
[settings]
profile = black
line_length = 100
```

#### 3. Flake8 - 代码检查

```bash
# 检查代码
flake8 app/

# 生成报告
flake8 --format=html --htmldir=flake-report app/
```

配置 (`.flake8`):
```ini
[flake8]
max-line-length = 100
exclude = .git,__pycache__,venv,alembic
ignore = E203,W503
```

#### 4. mypy - 类型检查

```bash
# 类型检查
mypy app/

# 生成类型存根
stubgen -p app.models
```

配置 (`mypy.ini`):
```ini
[mypy]
python_version = 3.12
warn_return_any = True
warn_unused_configs = True
disallow_untyped_defs = True
```

### TypeScript代码规范

#### 1. ESLint - 代码检查

```bash
# 检查代码
npm run lint

# 自动修复
npm run lint:fix
```

#### 2. Prettier - 代码格式化

```bash
# 格式化代码
npm run format

# 检查格式
npm run format:check
```

### Git提交规范

使用 **Conventional Commits** 规范:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type类型**:
- `feat`: 新功能
- `fix`: Bug修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具变动

**示例**:
```bash
git commit -m "feat(auth): 添加JWT刷新令牌功能"
git commit -m "fix(projects): 修复配额计算错误"
git commit -m "docs(api): 更新API文档"
```

---

## API开发

### 创建新的API端点

#### 1. 定义Schema (schemas/)

```python
# app/schemas/example.py
from pydantic import BaseModel, Field

class ExampleCreate(BaseModel):
    """创建示例请求"""
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None

class ExampleResponse(BaseModel):
    """示例响应"""
    id: int
    name: str
    description: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

#### 2. 创建数据库模型 (models/)

```python
# app/models/example.py
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database import Base

class Example(Base):
    __tablename__ = "examples"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

#### 3. 创建API路由 (api/v1/)

```python
# app/api/v1/examples.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.example import ExampleCreate, ExampleResponse
from app.models.example import Example
from app.dependencies import get_current_user

router = APIRouter(prefix="/examples", tags=["examples"])

@router.post("/", response_model=ExampleResponse, status_code=201)
async def create_example(
    data: ExampleCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """创建示例"""
    example = Example(**data.model_dump())
    db.add(example)
    db.commit()
    db.refresh(example)
    return example

@router.get("/{example_id}", response_model=ExampleResponse)
async def get_example(
    example_id: int,
    db: Session = Depends(get_db)
):
    """获取示例详情"""
    example = db.query(Example).filter(Example.id == example_id).first()
    if not example:
        raise HTTPException(status_code=404, detail="Example not found")
    return example
```

#### 4. 注册路由 (api/v1/__init__.py)

```python
from fastapi import APIRouter
from app.api.v1 import auth, users, projects, admin, examples

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(projects.router)
api_router.include_router(admin.router)
api_router.include_router(examples.router)  # 新增
```

---

## 数据库开发

### 创建数据库迁移

```bash
# 自动生成迁移 (推荐)
alembic revision --autogenerate -m "添加Example表"

# 手动创建迁移
alembic revision -m "添加Example表"
```

### 编写迁移脚本

```python
# alembic/versions/xxxx_add_example_table.py
from alembic import op
import sqlalchemy as sa

def upgrade():
    op.create_table(
        'examples',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_examples_id', 'examples', ['id'])

def downgrade():
    op.drop_index('ix_examples_id', 'examples')
    op.drop_table('examples')
```

### 应用迁移

```bash
# 升级到最新版本
alembic upgrade head

# 回滚一个版本
alembic downgrade -1

# 查看迁移历史
alembic history

# 查看当前版本
alembic current
```

---

## 前端开发

### 创建API客户端

```typescript
// src/api/example.ts
import axios from './axios';
import type { Example, ExampleCreate } from '../types/example';

export const exampleAPI = {
  // 创建示例
  create: (data: ExampleCreate) =>
    axios.post<Example>('/api/v1/examples/', data),

  // 获取示例
  get: (id: number) =>
    axios.get<Example>(`/api/v1/examples/${id}`),

  // 列表
  list: () =>
    axios.get<Example[]>('/api/v1/examples/'),
};
```

### 创建Zustand Store

```typescript
// src/stores/exampleStore.ts
import { create } from 'zustand';
import { exampleAPI } from '../api/example';
import type { Example } from '../types/example';

interface ExampleStore {
  examples: Example[];
  loading: boolean;
  fetchExamples: () => Promise<void>;
  createExample: (data: ExampleCreate) => Promise<void>;
}

export const useExampleStore = create<ExampleStore>((set) => ({
  examples: [],
  loading: false,

  fetchExamples: async () => {
    set({ loading: true });
    try {
      const response = await exampleAPI.list();
      set({ examples: response.data, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  createExample: async (data) => {
    const response = await exampleAPI.create(data);
    set((state) => ({
      examples: [...state.examples, response.data]
    }));
  },
}));
```

### 创建React组件

```tsx
// src/pages/ExamplePage.tsx
import React, { useEffect } from 'react';
import { Button, Table, Form, Input } from 'antd';
import { useExampleStore } from '../stores/exampleStore';

export const ExamplePage: React.FC = () => {
  const { examples, loading, fetchExamples, createExample } = useExampleStore();
  const [form] = Form.useForm();

  useEffect(() => {
    fetchExamples();
  }, [fetchExamples]);

  const handleSubmit = async (values: any) => {
    await createExample(values);
    form.resetFields();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">示例管理</h1>

      <Form form={form} onFinish={handleSubmit} layout="inline" className="mb-4">
        <Form.Item name="name" rules={[{ required: true }]}>
          <Input placeholder="名称" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">创建</Button>
        </Form.Item>
      </Form>

      <Table
        dataSource={examples}
        loading={loading}
        rowKey="id"
        columns={[
          { title: 'ID', dataIndex: 'id', key: 'id' },
          { title: '名称', dataIndex: 'name', key: 'name' },
        ]}
      />
    </div>
  );
};
```

---

## 测试开发

### 编写单元测试

```python
# tests/test_example.py
import pytest

def test_create_example(client, user_token):
    """测试创建示例"""
    response = client.post(
        "/api/v1/examples/",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"name": "Test Example", "description": "Test"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Example"

def test_get_example(client, test_example):
    """测试获取示例"""
    response = client.get(f"/api/v1/examples/{test_example.id}")
    assert response.status_code == 200
    assert response.json()["id"] == test_example.id
```

### 运行测试

```bash
# 运行所有测试
pytest

# 运行特定文件
pytest tests/test_example.py

# 运行特定测试
pytest tests/test_example.py::test_create_example

# 显示覆盖率
pytest --cov=app --cov-report=html

# 详细输出
pytest -v -s
```

---

## 调试技巧

### 后端调试

#### 1. 使用日志

```python
from loguru import logger

logger.debug("调试信息")
logger.info("普通信息")
logger.warning("警告信息")
logger.error("错误信息")
```

#### 2. IPython调试

```python
# 在代码中插入断点
import IPython; IPython.embed()
```

#### 3. VS Code调试配置

`.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "FastAPI",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": ["app.main:app", "--reload"],
      "jinja": true
    }
  ]
}
```

### 前端调试

#### 1. React DevTools

```bash
# 安装浏览器扩展
# Chrome: https://chrome.google.com/webstore/detail/react-developer-tools
```

#### 2. Console日志

```typescript
console.log('调试信息:', data);
console.error('错误:', error);
console.table(arrayData);  // 表格形式显示数组
```

#### 3. VS Code调试

`.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/frontend/src"
    }
  ]
}
```

---

## 最佳实践

### 1. API设计原则

- 使用RESTful风格
- 使用复数名词 (`/users`, `/projects`)
- 使用HTTP方法表达操作 (GET/POST/PUT/DELETE)
- 返回合适的HTTP状态码
- 使用版本控制 (`/api/v1/`)

### 2. 错误处理

```python
# 使用HTTPException
from fastapi import HTTPException

raise HTTPException(status_code=404, detail="Resource not found")

# 自定义异常
class BusinessException(Exception):
    def __init__(self, message: str, code: int = 400):
        self.message = message
        self.code = code

# 全局异常处理
@app.exception_handler(BusinessException)
async def business_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.code,
        content={"detail": exc.message}
    )
```

### 3. 数据库查询优化

```python
# 使用索引
class User(Base):
    email = Column(String, unique=True, index=True)

# 预加载关联数据
from sqlalchemy.orm import joinedload

users = db.query(User).options(joinedload(User.role)).all()

# 分页查询
def paginate(query, page: int, per_page: int):
    return query.offset((page - 1) * per_page).limit(per_page)
```

---

**更新日期**: 2026-02-14
**维护者**: Douhuiai Team
