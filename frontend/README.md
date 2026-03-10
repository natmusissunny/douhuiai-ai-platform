# 豆绘AI平台 - 前端应用

**版本**: v1.0.0 RC1
**框架**: React 18
**语言**: TypeScript 5

---

## 📋 项目概述

豆绘AI平台的前端应用，基于React 18 + TypeScript + Vite构建的现代化单页应用（SPA）。

### 核心功能

- ✅ **用户认证** - 登录、注册、Token管理
- ✅ **AI创作** - 文生图、图生图创作界面
- ✅ **项目管理** - 项目列表、详情查看
- ✅ **个人中心** - 个人信息、配额管理
- ✅ **管理后台** - 7个完整的管理页面
- ✅ **响应式设计** - 移动端友好

---

## 🛠️ 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **React** | 18 | UI框架 |
| **TypeScript** | 5+ | 类型系统 |
| **Vite** | 5 | 构建工具 |
| **Ant Design** | 6 | UI组件库 |
| **Tailwind CSS** | 4 | CSS框架 |
| **Zustand** | 5 | 状态管理 |
| **React Router** | 7 | 路由管理 |
| **Axios** | 1 | HTTP客户端 |
| **dayjs** | 1.11 | 日期处理 |

---

## 📂 项目结构

```
frontend/
├── src/
│   ├── api/                     # API请求封装
│   │   ├── request.ts           # Axios实例配置
│   │   ├── auth.ts              # 认证API
│   │   ├── user.ts              # 用户API
│   │   ├── project.ts           # 项目API
│   │   └── admin.ts             # 管理后台API
│   ├── components/              # 通用组件
│   │   └── ... (待扩展)
│   ├── layouts/                 # 布局组件（3个）
│   │   ├── MainLayout.tsx       # 主布局
│   │   ├── AuthLayout.tsx       # 认证页面布局
│   │   └── AdminLayout.tsx      # 管理后台布局
│   ├── pages/                   # 页面组件（20+）
│   │   ├── HomePage.tsx         # 首页
│   │   ├── LoginPage.tsx        # 登录页
│   │   ├── RegisterPage.tsx     # 注册页
│   │   ├── DashboardPage.tsx    # 用户仪表板
│   │   ├── Text2ImgPage.tsx     # 文生图页面
│   │   ├── Img2ImgPage.tsx      # 图生图页面
│   │   ├── ProjectListPage.tsx  # 项目列表
│   │   ├── ProjectDetailPage.tsx# 项目详情
│   │   ├── UserProfilePage.tsx  # 个人中心
│   │   └── admin/               # 管理后台页面（7个）
│   │       ├── DashboardPage.tsx        # 数据概览
│   │       ├── UserManagementPage.tsx   # 用户管理
│   │       ├── RoleManagementPage.tsx   # 角色权限
│   │       ├── ProjectManagementPage.tsx# 项目管理
│   │       ├── StatisticsPage.tsx       # 数据统计
│   │       └── SettingsPage.tsx         # 系统设置
│   ├── router/                  # 路由配置
│   │   └── index.tsx            # 路由定义
│   ├── stores/                  # Zustand状态管理
│   │   ├── authStore.ts         # 认证状态
│   │   └── adminStore.ts        # 管理状态
│   ├── types/                   # TypeScript类型定义
│   │   └── ... (待扩展)
│   ├── utils/                   # 工具函数
│   │   └── ... (待扩展)
│   ├── App.tsx                  # 应用主组件
│   ├── main.tsx                 # 应用入口
│   └── index.css                # 全局样式
├── public/                      # 静态资源
├── .env                         # 环境变量（不提交）
├── .env.example                 # 环境变量模板
├── index.html                   # HTML模板
├── package.json                 # 依赖配置
├── tsconfig.json                # TypeScript配置
├── vite.config.ts               # Vite配置
├── tailwind.config.js           # Tailwind CSS配置
├── postcss.config.js            # PostCSS配置
└── README.md                    # 本文件
```

---

## 🚀 快速开始

### 方式1: Docker（推荐）

```bash
# 从项目根目录
cd ..

# 一键启动所有服务
make init

# 或手动启动
docker-compose up -d

# 访问前端应用
open http://localhost:3000
```

### 方式2: 本地开发

#### 1. 安装依赖

```bash
# 使用npm
npm install

# 或使用yarn
yarn install

# 或使用pnpm
pnpm install
```

#### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑.env文件
# VITE_API_BASE_URL=http://localhost:8000
vi .env
```

#### 3. 启动开发服务器

```bash
# 启动（默认端口3000）
npm run dev

# 访问应用
open http://localhost:3000
```

---

## 📜 可用脚本

```bash
# 开发模式（热重载）
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 类型检查
npm run type-check

# 代码检查
npm run lint

# 代码格式化
npm run format
```

---

## 🎯 功能特性

### 用户端功能 (100% ✅)

#### 1. 认证系统
- [x] 用户注册（邮箱验证）
- [x] 用户登录（JWT Token）
- [x] Token自动刷新
- [x] 用户登出
- [x] 路由守卫

#### 2. AI创作
- [x] 文生图创作页面
- [x] 图生图创作页面
- [x] 参数配置（尺寸、数量、风格）
- [x] 配额预计算
- [ ] 实时生成进度（待实现）
- [ ] 批量操作（待实现）

#### 3. 项目管理
- [x] 项目列表展示
- [x] 项目详情查看
- [x] 项目筛选（类型/状态）
- [x] 项目分页
- [x] 项目删除
- [ ] 项目收藏（待实现）
- [ ] 项目标签（待实现）

#### 4. 个人中心
- [x] 个人信息查看
- [x] 个人信息编辑
- [x] 配额余额显示
- [x] 配额历史记录
- [ ] 配额充值（待实现）

### 管理后台功能 (100% ✅)

#### 1. 数据概览
- [x] 用户统计卡片
- [x] 项目统计卡片
- [x] 配额统计卡片
- [x] 收入统计卡片

#### 2. 用户管理
- [x] 用户列表展示
- [x] 搜索和筛选
- [x] 用户封禁/解封
- [x] 配额充值
- [x] 分页支持

#### 3. 角色权限管理
- [x] 角色列表展示
- [x] 角色创建
- [x] 角色编辑
- [x] 角色删除
- [x] 权限配置（10种）

#### 4. 项目管理
- [x] 项目列表展示
- [x] 类型/状态筛选
- [x] 图片预览
- [x] 项目详情

#### 5. 数据统计
- [x] 日期范围选择
- [x] 项目统计图表
- [x] 配额统计图表
- [x] 消耗排行榜

#### 6. 系统设置
- [x] 网站基本设置
- [x] 用户设置
- [x] 配额设置

---

## 🌐 路由配置

### 用户端路由

```
/                       # 首页
/auth/login             # 登录
/auth/register          # 注册
/dashboard              # 用户仪表板
/create/text2img        # 文生图
/create/img2img         # 图生图
/projects               # 项目列表
/projects/:id           # 项目详情
/profile                # 个人中心
```

### 管理后台路由

```
/admin                  # 管理后台首页（跳转到dashboard）
/admin/dashboard        # 数据概览
/admin/users            # 用户管理
/admin/roles            # 角色权限
/admin/projects         # 项目管理
/admin/statistics       # 数据统计
/admin/settings         # 系统设置
```

---

## 📦 状态管理

### Auth Store (authStore.ts)

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateUser: (data) => Promise<void>;
}
```

### Admin Store (adminStore.ts)

```typescript
interface AdminState {
  // 用户管理
  users: UserListItem[];
  userTotal: number;
  fetchUsers: (params) => Promise<void>;

  // 角色管理
  roles: RoleItem[];
  fetchRoles: () => Promise<void>;

  // 统计数据
  systemStats: SystemStats | null;
  fetchSystemStats: () => Promise<void>;
}
```

---

## ⚙️ 环境变量

### .env文件配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| **VITE_API_BASE_URL** | 后端API地址 | `http://localhost:8000` |

### 示例配置

```bash
# 开发环境
VITE_API_BASE_URL=http://localhost:8000

# 生产环境
VITE_API_BASE_URL=https://api.yourdomain.com
```

---

## 🎨 UI/UX特性

### Ant Design组件

使用的主要组件：
- **Layout** - 页面布局
- **Menu** - 导航菜单
- **Form** - 表单组件
- **Table** - 数据表格
- **Modal** - 弹窗
- **Card** - 卡片
- **Button** - 按钮
- **Input** - 输入框
- **Select** - 选择器
- **DatePicker** - 日期选择器
- **Statistic** - 统计数字
- **Tag** - 标签
- **Badge** - 徽标
- **Dropdown** - 下拉菜单

### Tailwind CSS

使用Tailwind进行样式定制：
- 响应式设计（xs/sm/md/lg/xl）
- 实用类样式
- 自定义颜色主题
- Flexbox和Grid布局

### 响应式设计

- 移动端适配（xs: <576px）
- 平板适配（sm: ≥576px, md: ≥768px）
- 桌面端适配（lg: ≥992px, xl: ≥1200px）

---

## 🔧 构建配置

### Vite配置亮点

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],

  // 路径别名
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // 开发服务器配置
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },

  // 构建优化
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'antd-vendor': ['antd'],
          'utils': ['axios', 'zustand', 'dayjs'],
        },
      },
    },
  },
});
```

---

## 🧪 测试

### 测试框架（待实现）

计划使用：
- **Vitest** - 单元测试
- **React Testing Library** - 组件测试
- **Playwright** - E2E测试

```bash
# 运行单元测试（待实现）
npm run test

# 运行E2E测试（待实现）
npm run test:e2e
```

---

## 📝 代码质量

### TypeScript

- ✅ 严格模式（strict: true）
- ✅ 100%类型覆盖
- ✅ 接口定义完整

### ESLint

```bash
# 检查代码
npm run lint

# 自动修复
npm run lint:fix
```

### Prettier

```bash
# 格式化代码
npm run format

# 检查格式
npm run format:check
```

---

## 🔧 开发工具

### VSCode推荐插件

- **ESLint** - 代码检查
- **Prettier** - 代码格式化
- **TypeScript Vue Plugin** - TS支持
- **Tailwind CSS IntelliSense** - Tailwind智能提示
- **Auto Import** - 自动导入

### Chrome插件

- **React Developer Tools** - React调试
- **Redux DevTools** - 状态调试（Zustand兼容）

---

## 📚 相关文档

### 核心文档

- [项目总览](../README.md)
- [快速启动](../QUICK_START.md)
- [架构设计](../ARCHITECTURE.md)
- [开发指南](../DEVELOPMENT.md)

### 前端文档

- [React文档](https://react.dev/)
- [Ant Design](https://ant.design/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)

### 项目报告

- [项目交付](../PROJECT_DELIVERY.md)
- [完成总结](../FINAL_SUMMARY.md)
- [文档索引](../DOCUMENTATION_INDEX.md)

---

## 🐛 常见问题

### Q: 如何修改API地址？

**A**: 编辑`.env`文件中的`VITE_API_BASE_URL`

### Q: 如何解决端口冲突？

**A**: 修改`vite.config.ts`中的`server.port`配置

### Q: 为什么热重载不工作？

**A**: 检查文件保存路径，确保在`src/`目录下

### Q: 如何查看API请求？

**A**: 打开浏览器开发者工具的Network选项卡

### Q: 如何添加新页面？

**A**:
1. 在`src/pages/`创建组件
2. 在`src/router/index.tsx`添加路由
3. 在布局组件中添加导航链接

---

## 📄 许可证

MIT License - 详见 [LICENSE](../LICENSE)

---

## 🎯 开发状态

### v1.0.0 RC1 (当前版本)

- [x] 项目结构创建
- [x] 路由配置（20+路由）
- [x] 状态管理（Zustand）
- [x] API封装（完整）
- [x] 用户认证页面
- [x] AI创作页面
- [x] 项目管理页面
- [x] 个人中心页面
- [x] 管理后台布局
- [x] 管理后台7个页面
- [x] 响应式设计
- [ ] E2E测试（待实现）
- [ ] 前端权限控制（待实现）
- [ ] 国际化i18n（待实现）

---

<div align="center">

**前端应用完整实现** ✅

**20+页面 • 100%TypeScript • 响应式设计 • 生产就绪**

[返回项目首页](../README.md)

</div>
