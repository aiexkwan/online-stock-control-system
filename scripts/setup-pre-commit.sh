#!/bin/bash

# Pre-commit hooks 安装和配置脚本
# 自动设置开发环境的技术债务预防机制

set -e

echo "🔧 Setting up pre-commit hooks for tech debt prevention..."

# 检查是否安装了 Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    echo "Please install Python 3 and try again."
    exit 1
fi

# 检查是否安装了 pip
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is required but not installed."
    echo "Please install pip3 and try again."
    exit 1
fi

# 安装 pre-commit
echo "📦 Installing pre-commit..."
pip3 install pre-commit

# 验证安装
if ! command -v pre-commit &> /dev/null; then
    echo "❌ pre-commit installation failed."
    exit 1
fi

echo "✅ pre-commit installed successfully"

# 安装 pre-commit hooks
echo "🪝 Installing pre-commit hooks..."
pre-commit install

# 安装 commit-msg hook（用于提交消息检查）
pre-commit install --hook-type commit-msg

# 创建 secrets baseline（如果不存在）
if [ ! -f .secrets.baseline ]; then
    echo "🔒 Creating secrets baseline..."
    pre-commit run detect-secrets --all-files || true

    # 如果还是没有创建，手动创建空的 baseline
    if [ ! -f .secrets.baseline ]; then
        echo "{}" > .secrets.baseline
    fi
fi

# 运行所有 hooks 来验证设置
echo "🧪 Testing pre-commit setup..."
echo "This may take a few minutes on first run..."

# 首次运行可能会安装额外的依赖
pre-commit run --all-files || {
    echo "⚠️  Some hooks failed on first run. This is normal."
    echo "Pre-commit is downloading and installing hook environments."
    echo "Try running 'pre-commit run --all-files' again after setup."
}

# 创建 commit message template（如果不存在）
if [ ! -f .gitmessage ]; then
    echo "📝 Creating commit message template..."
    cat > .gitmessage << 'EOF'
# <type>(<scope>): <subject>
#
# <body>
#
# <footer>
#
# Type can be:
#   feat     (new feature)
#   fix      (bug fix)
#   docs     (documentation)
#   style    (formatting, missing semi colons, etc)
#   refactor (refactoring production code)
#   test     (adding tests, refactoring test)
#   chore    (updating build tasks, package manager configs, etc)
#   perf     (performance improvements)
#   ci       (CI/CD changes)
#   build    (build system changes)
#   revert   (reverting changes)
#
# Scope is optional and can be:
#   api, ui, core, admin, monitoring, etc.
#
# Subject should:
#   - be 50 characters or less
#   - start with lowercase
#   - not end with period
#
# Body should:
#   - wrap at 72 characters
#   - explain what and why vs. how
#   - be separated from subject by blank line
#
# Footer should:
#   - reference issues and breaking changes
#   - format: "Fixes #123" or "BREAKING CHANGE: ..."
EOF

    # 配置 git 使用这个模板
    git config commit.template .gitmessage
    echo "✅ Commit message template configured"
fi

# 创建开发者指南
echo "📚 Creating developer guide..."
cat > PRE_COMMIT_GUIDE.md << 'EOF'
# Pre-commit Hooks 开发者指南

## 概述
本项目使用 pre-commit hooks 来自动检查代码质量，防止技术债务累积。

## 安装的 Hooks

### 代码品质检查
- **TypeScript Check**: 检查类型错误
- **ESLint Check**: 检查和自动修复代码风格问题
- **Prettier Format**: 自动格式化代码

### 技术债务监控
- **Tech Debt Check**: 收集技术债务指标
- **No TODOs**: 防止提交 TODO/FIXME 注解

### 安全检查
- **Detect Secrets**: 检查是否意外提交了密钥或敏感信息
- **Check Large Files**: 防止提交过大的文件

## 使用方式

### 正常提交
```bash
git add .
git commit -m "feat: add new feature"
```
hooks 会自动运行并检查代码。

### 跳过特定检查
```bash
# 跳过技术债务检查
SKIP=tech-debt-check git commit -m "docs: update README"

# 跳过所有检查（不推荐）
git commit --no-verify -m "emergency fix"
```

### 手动运行检查
```bash
# 运行所有检查
npm run pre-commit:run

# 运行特定检查
pre-commit run typescript-check --all-files
pre-commit run eslint-check --all-files
```

## 故障排除

### Hook 执行失败
1. 检查错误消息，通常会指出具体问题
2. 修复问题后重新提交
3. 如果是技术债务检查失败，检查 `tech-debt-report.json`

### 更新 Hooks
```bash
pre-commit autoupdate
pre-commit install
```

### 清理 Hook 环境
```bash
pre-commit clean
pre-commit install
```

## 技术债务阈值

当前设定的阈值：
- TypeScript 错误: ≤ 500
- ESLint 错误: ≤ 100
- 测试失败: = 0

如需调整阈值，请修改 `.pre-commit-config.yaml` 文件。

## 最佳实践

1. **小步提交**: 将大的更改分解为小的提交
2. **修复再提交**: 先修复检查发现的问题再提交
3. **定期更新**: 保持 hooks 和依赖项的最新版本
4. **团队协作**: 确保所有团队成员都安装了相同的 hooks

## 支援

如有问题，请：
1. 查看 `tech-debt-report.json` 获取详细错误信息
2. 运行 `pre-commit run --all-files --verbose` 获取详细输出
3. 联系开发团队寻求协助
EOF

echo ""
echo "🎉 Pre-commit hooks setup completed!"
echo ""
echo "📋 What was installed:"
echo "   ✅ Pre-commit hooks"
echo "   ✅ TypeScript checking"
echo "   ✅ ESLint with auto-fix"
echo "   ✅ Prettier formatting"
echo "   ✅ Tech debt monitoring"
echo "   ✅ Security checks"
echo "   ✅ Commit message template"
echo ""
echo "📚 Next steps:"
echo "   1. Read PRE_COMMIT_GUIDE.md for usage instructions"
echo "   2. Try making a commit to test the hooks"
echo "   3. Run 'npm run pre-commit:run' to test all hooks"
echo ""
echo "🚨 Important:"
echo "   All team members should run this script to ensure consistent"
echo "   code quality checks across the development team."
echo ""
