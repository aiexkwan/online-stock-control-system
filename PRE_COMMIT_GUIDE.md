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
