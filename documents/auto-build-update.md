# copyNote 自动构建和更新指南

本文档详细说明了 copyNote 应用的自动构建和自动更新流程。

## 一、自动构建流程

copyNote 使用 GitHub Actions 实现自动构建，每当代码推送到`main`分支时，会自动触发构建流程。

### 构建流程说明

1. **更新版本号**：系统会自动增加 package.json 中的补丁版本号
2. **多平台构建**：同时在 Windows、macOS 和 Linux 平台构建应用
3. **发布到 GitHub Releases**：将构建好的安装包自动发布到 GitHub Releases

### 文件说明

- `.github/workflows/auto-build-release.yml`：自动构建和发布的工作流配置文件
- `electron-builder.json`：Electron Builder 的配置文件，定义了构建选项

## 二、自动更新功能

copyNote 使用 electron-updater 实现自动更新功能，应用会定期检查 GitHub Releases 上是否有新版本。

### 更新流程说明

1. 应用启动或用户主动触发检查更新
2. 系统检测到新版本时，会提示用户是否需要更新
3. 用户确认后，应用会在后台下载新版本
4. 下载完成后，提示用户重启应用以完成安装

### 关键文件

- `electron/main/update.ts`：自动更新的核心代码
- `dev-app-update.yml`：开发环境下测试自动更新的配置文件

## 三、开发指南

### 本地测试构建

如果你想在本地测试构建过程，可以运行：

```bash
pnpm run test-build
```

此命令会在本地执行构建过程，并显示构建结果。

### 本地测试自动更新

要在开发环境中测试自动更新功能，请执行以下步骤：

1. 确保 GitHub 上已有比本地版本号更高的发布版本
2. 运行以下命令启动模拟生产环境的应用：

```bash
pnpm run dev:update
```

3. 应用将会检测到更新，并提示你下载安装

### 测试自动更新配置

要检查自动更新配置是否正确，可以运行：

```bash
pnpm run test-update
```

此命令会检查 GitHub Releases 的配置和文件，并验证更新所需的关键文件是否存在。

## 四、常见问题

### 1. 构建失败

如果 GitHub Actions 构建失败，请检查：

- workflow 权限是否正确
- 仓库设置中是否允许 Actions 运行
- 查看 Actions 日志了解具体错误原因

### 2. 自动更新失败

如果自动更新功能无法正常工作，请检查：

- GitHub Releases 中是否包含 latest.yml 文件
- 应用日志中的错误信息(位于%APPDATA%\copyNote\logs\main.log)
- 版本号是否正确递增

### 3. macOS 更新证书问题

macOS 平台的自动更新需要代码签名证书。如果你没有 Apple 开发者证书，自动更新在 macOS 上可能无法正常工作。
