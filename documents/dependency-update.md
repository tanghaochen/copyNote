# 依赖关系更新与构建修复文档

本文档记录了关于 copyNote 应用依赖关系的更新和构建流程的修复，特别是针对自动更新功能的优化。

## 依赖项更新

### 1. `@nut-tree/nut-js` 替换为 `@nut-tree-fork/nut-js`

原包 `@nut-tree/nut-js` 已不再维护或在 npm 上不可用，已经替换为社区维护的分支版本 `@nut-tree-fork/nut-js`。两个包的 API 兼容，保持版本号一致 (^4.2.0)。

### 2. `loadash` 替换为标准的 `lodash`

移除了废弃的 `loadash` 包（这是一个拼写错误的包），使用标准的 `lodash` 代替。

## 构建流程优化

### 1. 依赖项验证

添加了依赖项验证步骤，确保关键依赖被正确安装：

- 在 GitHub Actions 工作流中增加了验证步骤
- 创建了`scripts/check-dependencies.js`脚本用于本地验证
- 添加了`pnpm check-deps`命令，方便开发者检查依赖项

### 2. 工作流错误处理增强

- 添加了更多的日志记录，以便于排查问题
- 改进了构建失败时的错误消息

## 自动更新修复

自动更新功能的主要问题来自于以下几个方面：

### 1. 依赖项问题

由于`@nut-tree/nut-js`包无法正常安装，导致构建过程中断，从而无法生成完整的应用和更新文件。

### 2. latest.yml 文件处理

在 Windows 构建中，添加了额外的逻辑确保`latest.yml`文件被正确复制到发布目录：

```yaml
# 复制latest.yml文件
$ymlFiles = Get-ChildItem -Path "./release/$version" -Filter "*.yml" -Recurse
foreach ($ymlFile in $ymlFiles) {
Copy-Item -Path $ymlFile.FullName -Destination "./release-files/"
if ($ymlFile.Name -ne "latest.yml") {
Copy-Item -Path $ymlFile.FullName -Destination "./release-files/latest.yml"
}
}
```

### 3. 构建产物上传

使用了明确的版本`actions/upload-artifact@v3.1.2`来避免 GitHub Actions 中可能的上传问题。

## 使用新版本

1. **获取最新代码**：确保从 main 或 develop 分支获取最新代码
2. **安装依赖**：运行 `pnpm install` 安装最新的依赖项
3. **验证依赖**：运行 `pnpm check-deps` 确认关键依赖安装正确
4. **测试构建**：运行 `pnpm test-build` 验证构建是否正常
5. **测试更新**：运行 `pnpm test-update` 验证自动更新功能

## 常见问题排查

### 依赖安装失败

如果依赖安装失败，尝试以下步骤：

1. 删除 `node_modules` 目录和 `pnpm-lock.yaml` 文件
2. 运行 `pnpm install --force` 强制重新安装所有依赖
3. 如果仍然失败，检查是否有包版本冲突，考虑更新或降级特定包

### 自动更新问题

如果自动更新仍然出现问题：

1. 检查应用日志（位于 `%APPDATA%\copyNote\logs\main.log`）
2. 确认 GitHub Releases 中存在正确的`latest.yml`文件
3. 验证 GitHub Token 权限是否正确

## 未来优化计划

1. 考虑添加自动依赖检查工具，如 Dependabot，及时更新过时或有安全问题的依赖
2. 在 CI/CD 中添加更多测试用例，尤其是针对自动更新功能的端到端测试
3. 改进错误报告功能，方便用户提交问题报告
