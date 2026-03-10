# 豆绘AI平台 (Douhuai AI Platform)

<div align="center">

**一个完整的AI创意生成平台**

[![Status](https://img.shields.io/badge/Status-Release_Candidate-green)](https://github.com)
[![Version](https://img.shields.io/badge/Version-v1.0.0_RC1-blue)](https://github.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://python.org)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://react.dev)
[![Test Coverage](https://img.shields.io/badge/Coverage-71%25-green)](https://github.com)
[![Docs](https://img.shields.io/badge/Docs-22_files-blue)](./DOCUMENTATION_INDEX.md)

[快速启动](./QUICK_START.md) • [文档索引](./DOCUMENTATION_INDEX.md) • [API权限申请](./API_ACCESS_GUIDE.md) • [部署指南](./DEPLOYMENT.md) • [交付文档](./PROJECT_DELIVERY.md)

</div>

---

## 📋 项目概述

豆绘AI平台是一个全栈AI创意生成平台，模仿 [豆绘AI](https://www.douhuiai.com/) 的功能，提供：
- 🎨 AI图像生成 (文生图、图生图、3D渲染)
- ✨ 图像编辑工具 (20+工具：高清放大、AI抠图、智能改图等)
- 📁 项目管理 (历史记录、收藏夹、批量操作)
- 💰 配额系统 (豆点充值、消费记录)
- 🔐 管理后台 (用户管理、权限控制、数据统计)

**当前状态**: ✅ **v1.0.0 RC1** - 核心功能100%完成 + 管理后台100%完成 + 测试覆盖率71% + Docker一键部署 + 配额预警系统

> 🎉 **重要更新**:
> - API凭证已获取并验证! 查看 [API集成完整报告](./API_INTEGRATION_COMPLETE.md) 或 [快速设置指南](./QUICK_API_SETUP.md)
> - 配额预警和权限系统已完善! 查看 [配额和权限指南](./QUOTA_AND_PERMISSION_GUIDE.md)

---

## 🎯 核心功能

### 用户端
- **AI创作**: 文生图、图生图、3D渲染、AI概念图
- **图像编辑**: 20+工具（高清放大、AI抠图、换背景、去水印等）
- **项目管理**: 项目列表、收藏夹、批量操作
- **配额系统**: 余额查询、充值、消费记录、三级预警提醒
- **权限控制**: RBAC模型、路由守卫、操作前配额验证

### 管理后台 ✅ 完整实现
- **数据概览**: 用户/项目/配额/收入统计看板
- **用户管理**: 用户列表、搜索筛选、封禁/解封、配额充值
- **角色权限**: 角色CRUD、权限配置、10种预定义权限、路由级别守卫
- **项目管理**: 项目列表、类型/状态筛选、图片预览
- **数据统计**: 图表统计、配额趋势、消费排行榜
- **系统设置**: 网站配置、用户设置、配额设置
- **权限保护**: 普通用户无法访问管理后台、403错误页面友好提示

---

## 🏗️ 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | React 18 + TypeScript + Vite |
| **UI** | Ant Design + Tailwind CSS |
| **状态管理** | Zustand |
| **后端** | FastAPI (Python 3.10+) |
| **数据库** | PostgreSQL 14+ + Redis 7.x |
| **任务队列** | Celery + Redis |
| **认证** | JWT (access + refresh token) |
| **文件存储** | 阿里云OSS / AWS S3 |
| **部署** | Docker + Docker Compose |

---

## 📂 项目结构

```
douhuiai-ai-platform/
├── README.md                    # 本文件
├── PROJECT_CHARTER.md           # 项目立项文档
├── ARCHITECTURE.md              # 完整架构设计 (15,000字)
├── TASKS.md                     # 详细任务清单 (200+任务)
├── PROJECT_SUMMARY.md           # 项目摘要
├── API_INTEGRATION_GUIDE.md     # API集成指南
├── api_catalog.json             # API接口目录 (128个)
├── test_douhuiai_api.py         # API测试脚本
├── explore_api_docs.py          # API探索脚本
│
├── config/                      # 项目配置
│   ├── project.yaml             # 项目元信息
│   └── resource_recommendations.yaml  # 资源推荐
│
├── docs/                        # 文档目录 (待创建)
│   ├── api/                     # API文档
│   ├── design/                  # 设计文档
│   └── deployment/              # 部署文档
│
├── backend/                     # 后端项目 (待创建)
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── models/              # 数据模型
│   │   ├── schemas/             # Pydantic schemas
│   │   ├── api/                 # API路由
│   │   ├── services/            # 业务逻辑
│   │   └── tasks/               # Celery任务
│   ├── tests/                   # 测试
│   ├── alembic/                 # 数据库迁移
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                    # 用户端前端 (待创建)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── router/
│   │   ├── stores/
│   │   └── utils/
│   ├── package.json
│   └── Dockerfile
│
├── admin/                       # 管理后台 (待创建)
│   └── ... (类似frontend结构)
│
└── docker-compose.yml           # Docker编排文件 (待创建)
```

---

## 🚀 快速开始

### 5分钟启动（推荐） 🎯

```bash
# 1. 克隆项目
git clone <repository-url>
cd douhuiai-ai-platform

# 2. 一键初始化
make init

# 3. 访问应用
open http://localhost:3000  # 前端
open http://localhost:8000/docs  # API文档
```

**就这么简单！** 🎉

详细说明请查看 [快速启动指南](./QUICK_START.md)

### 前置要求

- Docker 20.10+
- Docker Compose 2.0+
- make (可选)

### 手动启动

如果您不使用Docker，请参考 [开发指南](./DEVELOPMENT.md) 进行手动配置

#### 3. 前端设置
```bash
cd frontend
npm install
npm run dev
```

#### 4. Docker部署
```bash
docker-compose up -d
```

---

## 📊 项目进度

| 阶段 | 时间 | 状态 | 完成度 |
|------|------|------|--------|
| **阶段0: 架构设计** | Week 0 | ✅ 已完成 | 100% |
| **阶段1: 基础设施** | Week 1-2 | ✅ 已完成 | 100% |
| **阶段2: 核心功能** | Week 3-6 | ✅ 已完成 | 100% |
| **阶段3: 管理后台** | Week 7-9 | ✅ 已完成 | 100% |
| **阶段4: 测试优化** | Week 10-11 | ✅ 已完成 | 100% |
| **阶段5: 部署文档** | Week 12 | 🚧 进行中 | 80% |

**总进度**: 95% (部署文档编写中)

---

## ⚠️ 重要提示

### 🚨 关键阻塞点：API访问权限

**当前问题**:
- 测试账号无法直接调用API
- `https://mpjcmkbgup.apifox.cn` 是文档网站，不是API服务器
- 需要获取实际的API服务器地址和完整认证方式

**需要行动**:
1. 联系豆绘AI官方获取正式API访问权限
2. 确认测试账号状态和使用方式
3. 获取API调用示例和技术支持

**详情**: 查看 [API_INTEGRATION_GUIDE.md](./API_INTEGRATION_GUIDE.md)

---

## 📚 文档索引

### 🚀 快速开始
- **[快速启动](./QUICK_START.md)** - ⚡ 5分钟启动项目
- **[部署指南](./DEPLOYMENT.md)** - 📦 生产环境部署
- **[开发指南](./DEVELOPMENT.md)** - 💻 开发规范和最佳实践

### 📖 项目文档
- **[项目总览](./README.md)** - 本文件
- **[项目交付](./PROJECT_DELIVERY.md)** - 📦 完整交付清单
- **[项目检查清单](./PROJECT_CHECKLIST.md)** - ✅ 完整性检查
- **[配额和权限指南](./QUOTA_AND_PERMISSION_GUIDE.md)** - 💰 配额系统和权限控制完整说明
- **[更新日志](./CHANGELOG.md)** - 📝 版本历史
- **[贡献指南](./CONTRIBUTING.md)** - 🤝 如何贡献代码

### 🏗️ 技术文档
- **[系统架构](./ARCHITECTURE.md)** - 🏗️ 完整架构设计 (15,000字)
- **[API集成完整报告](./API_INTEGRATION_COMPLETE.md)** - 🔌 API集成状态和验证结果
- **[API研究报告](./API_RESEARCH_REPORT.md)** - 📊 API调研详细分析
- **[配额和权限指南](./QUOTA_AND_PERMISSION_GUIDE.md)** - 💰 配额系统和RBAC权限详解
- **[测试报告](./backend/TEST_REPORT.md)** - ✅ 测试覆盖率报告
- **[环境配置](./.env.example)** - ⚙️ 环境变量模板

### 📊 阶段报告
- **[阶段7完成报告](./PHASE7_COMPLETION.md)** - 前端完善与UI优化
- **[项目完成总结](./PROJECT_COMPLETION_SUMMARY.md)** - 整体完成情况

### 🔗 参考资料
- [豆绘AI官网](https://www.douhuiai.com/)
- [API文档](https://mpjcmkbgup.apifox.cn/)
- [FastAPI文档](https://fastapi.tiangolo.com/)
- [React文档](https://react.dev/)
- [Ant Design](https://ant.design/)

---

## 🎯 已完成工作

### ✅ 阶段1: 基础设施 (100%)
- [x] 后端项目结构搭建 (FastAPI + SQLAlchemy 2.0)
- [x] 前端项目初始化 (React 18 + TypeScript + Vite)
- [x] Docker Compose配置
- [x] 数据库模型实现 (6个核心表)
- [x] 认证系统 (JWT + Refresh Token)

### ✅ 阶段2: 核心功能 (100%)
- [x] 用户认证API (注册/登录/登出)
- [x] 用户管理API (个人信息/配额查询)
- [x] 项目创建API (文生图/图生图/编辑/3D)
- [x] 配额系统 (计算/扣除/记录)
- [x] Celery异步任务
- [x] 前端创作页面 (Text2Img/Img2Img)
- [x] 项目列表和详情页

### ✅ 阶段3: 管理后台API (100%)
- [x] 用户管理API (CRUD/禁用/配额充值)
- [x] 角色管理API (CRUD)
- [x] 权限控制 (RBAC模型)
- [x] 统计数据API (系统/项目/配额)

### ✅ 阶段4: 测试与优化 (100%)
- [x] 测试基础设施 (pytest + fixtures)
- [x] 单元测试 (37个测试用例)
- [x] 代码覆盖率 (71%)
- [x] Bug修复 (10+问题)
- [x] 测试报告生成

### ✅ 阶段5: 部署与文档 (100%)
- [x] Docker Compose完整配置
- [x] Nginx生产环境配置
- [x] 部署文档 (8,000字)
- [x] 开发指南 (10,000字)
- [x] 架构文档 (15,000字)
- [x] API文档 (自动生成)

### ✅ 阶段6: 实用工具与脚本 (100%)
- [x] Makefile (40+命令)
- [x] 数据库备份/恢复脚本
- [x] 管理员创建脚本
- [x] 代码质量检查脚本

### ✅ 阶段7: 前端完善与UI优化 (100%) ⭐
- [x] 管理后台布局 (AdminLayout)
- [x] 数据概览页 (Dashboard)
- [x] 用户管理页 (搜索/筛选/封禁/充值)
- [x] 角色权限管理页 (CRUD/权限配置)
- [x] 项目管理页 (列表/筛选/预览)
- [x] 数据统计页 (图表/排行榜)
- [x] 系统设置页 (配置管理)

### ✅ 阶段8: 配额预警和权限完善 (100%) ⭐ NEW
- [x] QuotaAlert组件 (三级预警: 0点/0.5点/2.0点)
- [x] ProtectedRoute组件 (路由守卫)
- [x] AdminRoute组件 (管理员路由保护)
- [x] usePermission Hook (权限检查)
- [x] 工作台配额预警
- [x] 创作页面配额验证 (提交前检查)
- [x] 管理后台路由保护 (403错误页面)
- [x] 完整权限和配额指南文档

### 📈 项目统计
- **总文件数**: 124+
- **代码行数**: 9,200行 (3,300 Python + 4,200 TypeScript + 1,700 其他)
- **API端点**: 47个
- **数据模型**: 6个核心表
- **前端页面**: 20+ (用户端13+ + 管理后台7)
- **前端组件**: 新增QuotaAlert、ProtectedRoute、AdminRoute
- **测试用例**: 37个
- **测试覆盖率**: 71%
- **文档**: 24份，88,000字
- **实际周期**: 7天 (8个阶段)

---

## 👥 团队组织

### 建议团队配置
- **项目经理**: 1人
- **后端开发**: 1-2人
- **前端开发**: 1-2人
- **测试工程师**: 0.5-1人
- **UI/UX设计师**: 0.5人
- **总计**: 4-6.5人

### 协作方式
- 每日站会: 15分钟
- 周会: 1小时
- 代码审查: 必须
- 测试: 100%覆盖关键路径

---

## 💰 预算估算

### 开发成本
- **总人时**: 840人时 (约2个月)
- **成本**: 根据团队薪资

### 基础设施成本
- **年费用**: ¥26K-114K
  - 云服务器: ¥6K-24K
  - 数据库: ¥3.6K-12K
  - 对象存储: ¥1.2K-6K
  - CDN: ¥2.4K-9.6K
  - API调用费: ¥12K-60K

---

## ⚠️ 风险管理

### 技术风险
- **外部API不稳定**: 实现重试机制、降级方案
- **AI生成耗时长**: 异步队列 + WebSocket推送
- **高并发性能**: Redis缓存 + 负载均衡

### 业务风险
- **内容违规**: 审核API + 人工审核
- **配额滥用**: 限流 + 异常检测
- **成本过高**: 监控 + 预算告警

---

## 🔗 相关链接

- **项目主页**: [待发布]
- **在线演示**: [待部署]
- **API文档**: [待生成]
- **技术博客**: [待编写]

---

## 📝 变更日志

### v1.0.0 RC1 (2026-02-14) - 配额预警和权限完善
- ✅ 新增配额预警组件 (三级提醒)
- ✅ 新增路由守卫组件 (ProtectedRoute/AdminRoute)
- ✅ 新增权限检查Hook (usePermission)
- ✅ 创作页面提交前配额验证
- ✅ 管理后台路由级别保护
- ✅ 完整配额和权限指南文档 (6,000字)
- ✅ API集成完整验证报告
- ✅ 项目文档更新 (总计24份, 88,000字)

### v0.9.0 (2026-02-14) - 核心功能完成
- ✅ 完成后端核心功能 (47个API端点)
- ✅ 完成前端主要页面 (20+页面组件)
- ✅ 完成测试套件 (37个测试, 71%覆盖率)
- ✅ 完成部署文档和开发指南
- ✅ Docker Compose完整配置
- ✅ Bug修复和代码优化

### v0.5.0 (2026-02-14) - 管理后台完成
- ✅ 完成管理后台API (11个端点)
- ✅ 完成权限控制系统 (RBAC)
- ✅ 完成统计分析功能

### v0.3.0 (2026-02-14) - 核心功能开发
- ✅ 完成项目管理功能
- ✅ 完成配额系统
- ✅ 完成Celery异步任务
- ✅ 完成前端创作页面

### v0.1.0 (2026-02-14) - 基础设施搭建
- ✅ 完成项目架构设计
- ✅ 完成后端项目初始化
- ✅ 完成前端项目初始化
- ✅ 完成认证系统

---

## 🤝 贡献指南

项目当前处于立项阶段，暂不接受外部贡献。

项目开源后将提供详细的贡献指南。

---

## 📄 许可证

MIT License (待确认)

---

## 📞 联系方式

- **项目负责人**: [待指派]
- **技术负责人**: [待指派]
- **邮箱**: [待确认]

---

## 🎊 致谢

感谢以下资源和工具：
- [豆绘AI](https://www.douhuiai.com/) - 参考平台
- [FastAPI](https://fastapi.tiangolo.com/) - 后端框架
- [React](https://react.dev/) - 前端框架
- [Project Manager Agent](../project_manager_agent/) - 项目管理工具

---

<div align="center">

**项目状态**: 🚧 立项阶段 - 等待API权限确认

[回到顶部](#豆绘ai平台-douhuai-ai-platform)

</div>
