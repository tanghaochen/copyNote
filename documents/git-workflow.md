# Git 分支策略和工作流程

本文档描述了 copyNote 项目的 Git 分支策略和工作流程规范。

## 分支结构

项目采用以下分支结构：

- **main**: 生产环境分支，包含已发布的稳定版本
- **develop**: 开发主分支，包含已完成但未发布的功能
- **feature/xxx**: 特性分支，用于开发单个功能
- **hotfix/xxx**: 修复分支，用于修复生产环境中的紧急问题
- **release/x.x.x**: 发布分支，用于准备发布版本

## 开发流程

### 1. 功能开发

1. 从`develop`分支创建新的特性分支：

```bash
git checkout develop
git pull
git checkout -b feature/new-feature-name
```

2. 在特性分支上进行开发，定期提交代码：

```bash
git add .
git commit -m "feat: 添加了新功能"
```

3. 完成开发后，将`develop`分支合并到特性分支：

```bash
git checkout feature/new-feature-name
git pull origin develop
# 解决冲突（如果有）
```

4. 创建 Pull Request，将特性分支合并到`develop`分支
   - GitHub Actions 会自动运行测试和构建
   - 代码审查通过后合并

### 2. 版本发布

1. 从`develop`分支创建`release`分支：

```bash
git checkout develop
git pull
git checkout -b release/x.x.x
```

2. 在`release`分支上进行最终测试和修复
3. 完成后，创建 Pull Request 将`release`分支合并到`main`分支
4. 合并到`main`分支后，GitHub Actions 会自动：

   - 更新版本号
   - 创建版本标签
   - 构建应用
   - 发布到 GitHub Releases

5. 将`release`分支也合并回`develop`分支：

```bash
git checkout develop
git merge release/x.x.x
git push
```

### 3. 紧急修复

1. 从`main`分支创建`hotfix`分支：

```bash
git checkout main
git pull
git checkout -b hotfix/bug-description
```

2. 修复问题并提交代码
3. 创建 Pull Request 将`hotfix`分支合并到`main`和`develop`分支

## GitHub Actions 工作流

项目配置了两个主要的 GitHub Actions 工作流：

### 1. 开发分支构建测试

- 触发条件：推送到`develop`或`feature/*`分支，或创建针对`develop`或`main`的 Pull Request
- 执行操作：
  - 安装依赖
  - 运行测试
  - 构建应用（不打包安装程序）
  - 在 PR 上添加评论

### 2. 自动构建和发布

- 触发条件：推送到`main`分支，创建版本标签，或手动触发
- 执行操作：
  - 更新版本号
  - 创建 Git 标签
  - 多平台构建
  - 发布到 GitHub Releases

## 版本号规范

项目使用语义化版本控制 (Semantic Versioning):

- **主版本号(Major)**: 不兼容的 API 变更
- **次版本号(Minor)**: 向后兼容的功能新增
- **修订号(Patch)**: 向后兼容的问题修复

## Pull Request 规范

1. **命名**: 简洁明了地描述变更内容
2. **描述**: 详细说明变更的目的、实现方式和测试结果
3. **关联 Issue**: 如果有相关的 Issue，在 PR 中引用
4. **代码审查**: 至少需要一名团队成员的批准
5. **CI 通过**: 所有自动化测试必须通过
