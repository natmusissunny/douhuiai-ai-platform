# 贡献指南

感谢您对豆绘AI平台项目的关注！我们欢迎各种形式的贡献。

---

## 📋 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发流程](#开发流程)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [测试要求](#测试要求)
- [文档编写](#文档编写)

---

## 🤝 行为准则

### 我们的承诺

为了营造一个开放和友好的环境，我们承诺：

- 使用包容性语言
- 尊重不同的观点和经验
- 优雅地接受建设性批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

### 不可接受的行为

- 使用性化的语言或图像
- 人身攻击或侮辱/贬损评论
- 公开或私下骚扰
- 未经明确许可，发布他人的私人信息
- 其他不道德或不专业的行为

---

## 💡 如何贡献

### 报告Bug

在创建Bug报告之前：

1. **检查现有Issues** - 可能已经有人报告了相同的问题
2. **使用最新版本** - 确保使用项目的最新版本
3. **提供详细信息** - 包括重现步骤、预期行为、实际行为

**Bug报告应包含**:

```markdown
## Bug描述
清晰简洁的描述

## 重现步骤
1. 进入 '...'
2. 点击 '...'
3. 滚动到 '...'
4. 看到错误

## 预期行为
应该发生什么

## 实际行为
实际发生了什么

## 环境信息
- OS: [例如 macOS 13.0]
- 浏览器: [例如 Chrome 110]
- 项目版本: [例如 v1.0.0]

## 截图
如果适用，添加截图

## 额外信息
其他相关信息
```

### 建议新功能

**功能建议应包含**:

```markdown
## 功能描述
清晰简洁的功能描述

## 问题/需求
这个功能解决什么问题？

## 建议方案
你希望如何实现？

## 替代方案
是否考虑过其他方案？

## 额外信息
其他相关信息、截图、原型等
```

### 提交代码

1. **Fork项目**
2. **创建功能分支** (`git checkout -b feature/AmazingFeature`)
3. **提交更改** (`git commit -m 'Add some AmazingFeature'`)
4. **推送到分支** (`git push origin feature/AmazingFeature`)
5. **创建Pull Request**

---

## 🔧 开发流程

### 1. 环境准备

```bash
# 克隆项目
git clone <your-fork-url>
cd douhuiai-ai-platform

# 初始化项目
make init

# 或手动启动
docker-compose up -d
```

### 2. 创建开发分支

```bash
# 从main创建新分支
git checkout -b feature/your-feature-name

# 分支命名规范:
# feature/xxx  - 新功能
# fix/xxx      - Bug修复
# docs/xxx     - 文档更新
# refactor/xxx - 代码重构
# test/xxx     - 测试相关
```

### 3. 开发代码

**后端开发**:

```bash
# 进入后端容器
make dev-backend
# 或
docker-compose exec backend bash

# 代码会自动热重载
```

**前端开发**:

```bash
# 进入前端容器
make dev-frontend
# 或
docker-compose exec frontend sh

# Vite会自动热更新
```

### 4. 运行测试

```bash
# 运行所有测试
make test

# 运行特定测试
docker-compose exec backend pytest tests/test_auth.py

# 查看覆盖率
docker-compose exec backend pytest --cov=app --cov-report=html
```

### 5. 代码质量检查

```bash
# 运行所有质量检查
make lint

# 或使用质量检查脚本
bash scripts/check_quality.sh
```

### 6. 提交更改

```bash
# 添加更改
git add .

# 提交（遵循提交规范）
git commit -m "feat: add user profile page"

# 推送到远程
git push origin feature/your-feature-name
```

### 7. 创建Pull Request

1. 前往GitHub项目页面
2. 点击 "New Pull Request"
3. 选择你的分支
4. 填写PR描述（见下方模板）
5. 等待审核

---

## 📝 代码规范

### Python代码规范

我们使用以下工具确保代码质量：

- **Black** - 代码格式化
- **isort** - import排序
- **Flake8** - 代码风格检查
- **mypy** - 类型检查

**规范要点**:

```python
# ✅ 好的例子
def calculate_quota(
    project_type: str,
    width: int,
    height: int,
    quantity: int = 1
) -> float:
    """
    计算项目所需配额

    Args:
        project_type: 项目类型
        width: 图像宽度
        height: 图像高度
        quantity: 生成数量

    Returns:
        所需配额金额
    """
    base_cost = PROJECT_COSTS.get(project_type, 5.0)
    size_factor = (width * height) / (512 * 512)
    return base_cost * size_factor * quantity


# ❌ 不好的例子
def calc(t,w,h,q=1):
    return PROJECT_COSTS.get(t,5.0)*(w*h)/(512*512)*q
```

### TypeScript/React代码规范

**规范要点**:

```typescript
// ✅ 好的例子
interface UserProfile {
  id: number;
  username: string;
  email: string;
  quotaBalance: number;
}

export const UserProfilePage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await getUserProfile();
      setProfile(response.data);
    } catch (error) {
      message.error('获取用户信息失败');
    } finally {
      setLoading(false);
    }
  };

  return <div>...</div>;
};


// ❌ 不好的例子
export const UserProfilePage = () => {
  const [l, setL] = useState(false);
  const [p, setP] = useState(null);
  // 缺少类型定义、错误处理
  return <div>...</div>;
};
```

---

## 📋 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/) 规范。

### 提交格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type类型

- `feat`: 新功能
- `fix`: Bug修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

### 示例

```bash
# 新功能
git commit -m "feat(admin): add user management page"

# Bug修复
git commit -m "fix(auth): resolve token refresh issue"

# 文档
git commit -m "docs: update deployment guide"

# 重构
git commit -m "refactor(api): simplify quota calculation logic"
```

---

## 🧪 测试要求

### 单元测试

所有新功能必须包含单元测试：

```python
# backend/tests/test_quota.py
def test_calculate_quota():
    """测试配额计算"""
    result = calculate_quota(
        project_type="text2img",
        width=512,
        height=512,
        quantity=1
    )
    assert result == 5.0
```

### 测试覆盖率

- **最低要求**: 70%
- **推荐目标**: 80%+
- **核心功能**: 100%

```bash
# 查看覆盖率
make test
open backend/htmlcov/index.html
```

---

## 📚 文档编写

### 代码注释

```python
# Python Docstring
def create_user(
    username: str,
    email: str,
    password: str
) -> User:
    """
    创建新用户

    Args:
        username: 用户名（3-20字符）
        email: 邮箱地址
        password: 密码（至少6位）

    Returns:
        创建的用户对象

    Raises:
        ValueError: 如果参数无效
        DuplicateError: 如果用户名或邮箱已存在
    """
    pass
```

```typescript
// TypeScript JSDoc
/**
 * 获取用户配额余额
 * @param userId - 用户ID
 * @returns 配额余额
 * @throws {Error} 如果用户不存在
 */
async function getQuotaBalance(userId: number): Promise<number> {
  // ...
}
```

### README更新

如果添加新功能，请更新相关文档：

- README.md - 项目总览
- QUICK_START.md - 快速启动
- DEPLOYMENT.md - 部署指南
- DEVELOPMENT.md - 开发指南

---

## 🎯 Pull Request模板

```markdown
## 变更描述
清晰描述这个PR做了什么

## 相关Issue
Fixes #(issue编号)

## 变更类型
- [ ] Bug修复
- [ ] 新功能
- [ ] 重大变更
- [ ] 文档更新

## 测试
- [ ] 添加了测试用例
- [ ] 所有测试通过
- [ ] 覆盖率满足要求

## 检查清单
- [ ] 代码遵循项目规范
- [ ] 自我审查了代码
- [ ] 添加了注释（特别是复杂逻辑）
- [ ] 更新了相关文档
- [ ] 没有引入新的警告
- [ ] 添加了测试证明修复有效/功能正常

## 截图（如适用）
添加截图

## 额外信息
其他需要说明的内容
```

---

## ❓ 获取帮助

- 📖 查看[文档](./README.md)
- 💬 创建[Discussion](https://github.com/your-repo/discussions)
- 🐛 报告[Issue](https://github.com/your-repo/issues)

---

## 🙏 致谢

感谢所有为项目做出贡献的开发者！

---

<div align="center">

**让我们一起构建更好的豆绘AI平台！** 🎉

</div>
