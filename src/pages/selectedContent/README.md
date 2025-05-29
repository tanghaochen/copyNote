# Selected Content 模块

这个模块负责处理选中内容的高亮显示和管理功能。

## 文件结构

```
src/pages/selectedContent/
├── components/           # UI组件
│   ├── WindowControlBar.tsx    # 窗口控制栏组件
│   ├── TextHighlighter.tsx     # 主要的文本高亮组件
│   ├── KeywordsList.tsx        # 关键词列表组件
│   ├── StyledComponents.tsx    # 样式组件
│   └── index.ts                # 组件导出索引
├── hooks/               # 自定义Hook
│   ├── useWindowControl.ts     # 窗口控制Hook
│   ├── useMainApp.ts           # 主应用逻辑Hook
│   ├── useTextHighlight.ts     # 文本高亮处理Hook
│   └── index.ts                # Hook导出索引
├── services/            # 数据服务
│   ├── noteService.ts          # 笔记相关数据服务
│   └── index.ts                # 服务导出索引
├── utils/               # 工具函数
│   ├── textUtils.ts            # 文本处理工具函数
│   └── index.ts                # 工具函数导出索引
├── types/               # 类型定义
│   └── index.ts                # 类型定义文件
├── styles/              # 样式文件
│   └── index.scss              # 主样式文件
├── lib/                 # 库文件
├── index.tsx            # 主入口文件
└── README.md            # 说明文档
```

## 组件说明

### 1. WindowControlBar

窗口控制栏组件，包含：

- 固定按钮
- 设置按钮
- 最小化、最大化、关闭按钮
- 窗口拖拽功能

### 2. TextHighlighter

主要的文本高亮组件，负责：

- 文本内容的高亮显示
- 关键词点击处理
- 笔记内容编辑
- 面板切换控制

### 3. KeywordsList

关键词列表组件，用于：

- 显示找到的关键词
- 处理关键词点击事件
- 高亮当前选中的关键词

## Hook 说明

### 1. useWindowControl

窗口控制相关的 Hook，管理：

- 窗口状态（固定、最大化、关闭等）
- 窗口操作（最小化、最大化、关闭等）
- 窗口可见性控制

### 2. useMainApp

主应用逻辑 Hook，处理：

- 剪贴板内容管理
- 命令面板交互
- 词库数据加载
- 内容显示状态

### 3. useTextHighlight

文本高亮处理 Hook，负责：

- 文本高亮算法
- 关键词匹配和标记
- 高亮结果管理

## 服务说明

### noteService

笔记相关的数据服务，包含：

- 获取词库列表
- 根据 ID 获取笔记内容
- 数据库交互封装

## 工具函数

### textUtils

文本处理相关的工具函数：

- HTML 转义
- 正则表达式转义
- 剪贴板内容清理
- HTML 内容安全处理

## 重构收益

1. **代码可维护性**：将原来 959 行的大文件拆分为多个小文件，每个文件职责明确
2. **代码复用性**：将通用逻辑提取为 Hook 和工具函数，便于复用
3. **类型安全**：统一的类型定义，避免类型不一致问题
4. **开发效率**：模块化结构便于团队协作和功能扩展
5. **测试友好**：小模块更容易进行单元测试

## 使用方式

```tsx
import App from "./index";

// 直接使用主组件
<App />;
```

各个子模块也可以单独导入使用：

```tsx
import { useWindowControl, useTextHighlight } from "./hooks";
import { WindowControlBar, TextHighlighter } from "./components";
import { getNoteContentById } from "./services";
import { escapeHtml, sanitizeHtml } from "./utils";
```
