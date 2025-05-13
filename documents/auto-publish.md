# 自动发布到 GitHub Releases 指南

本文档详细介绍如何使用 GitHub Actions 自动构建并发布 Electron 应用到 GitHub Releases。

## 全自动发布流程

本项目已配置全自动发布流程，只需将代码推送到主分支（main）即可触发完整的发布流程：

1. GitHub Actions 自动检测代码变更
2. 自动增加补丁版本号（如 2.2.1 → 2.2.2）
3. 自动创建新版本提交和标签
4. 自动构建 Windows 应用（生成安装程序）
5. 自动发布安装程序到 GitHub Releases

## 具体步骤说明

### 1. 推送代码到主分支

只需将你的代码变更推送到 main 分支：

```bash
git push origin main
```

系统会自动处理以下工作：

- 自动增加 package.json 中的补丁版本号
- 自动创建版本提交和标签
- 自动构建并生成 Windows 安装程序 (.exe 文件)
- 自动将安装程序文件发布到 GitHub Releases

### 2. 查看构建状态

你可以在这里查看构建状态：
https://github.com/tanghaochen/electron-vite-react/actions

### 3. 查看发布版本

构建完成后，你可以在这里下载安装程序：
https://github.com/tanghaochen/electron-vite-react/releases

## 发布内容说明

GitHub Actions 工作流程会发布以下文件：

1. **安装程序文件**：`ElectronViteReact_版本号.exe`

   - 这是用户需要下载并安装的主要文件
   - 发布时会明确指定这个文件而非源代码

2. **自动更新相关文件**：
   - `latest.yml`（包含版本信息）
   - `.blockmap`（差量更新文件）

## 手动控制版本号

如果你需要手动控制版本号，可以使用发布脚本：

```bash
pnpm release
```

这个脚本提供了两个选项：

- 是否在本地构建应用：如果选择"是"，会在本地生成安装程序
- 是否推送到 GitHub：如果选择"是"，会触发 GitHub Actions 自动发布流程

## 故障排除

如果遇到发布问题，请检查：

1. **安装程序未正确生成**

   - 查看 GitHub Actions 日志，确认构建步骤是否成功
   - 检查 `build:win` 命令是否正确执行

2. **发布内容不正确**

   - 我们已配置工作流程明确指定发布文件
   - 禁用了自动生成发布说明，以避免包含不必要的内容

3. **GitHub Actions 权限**

   - 确保 Workflow permissions 设置为 "Read and write permissions"
   - 设置路径：Settings -> Actions -> General -> Workflow permissions

4. **防止循环触发**
   - 工作流配置中已排除 package.json 变更触发
   - 确保在手动修改版本号后不会触发无限循环

## 手动发布备选方案

如果自动发布遇到问题，你仍然可以使用以下命令手动构建：

```bash
# Windows
pnpm run build:win
```

然后手动上传 `release/{版本号}/` 目录中的安装程序文件到 GitHub Releases。
