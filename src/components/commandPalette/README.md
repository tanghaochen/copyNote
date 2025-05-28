# 命令面板组件 (CommandPalette)

一个功能强大的全局搜索组件，支持快捷键打开，可以搜索词库、标签和文章内容。

## 功能特性

- 🔍 **全局搜索**: 支持搜索词库标题、标签名称、文章内容
- ⌨️ **快捷键支持**: 默认使用 `Ctrl+O` 打开命令面板
- 📂 **分类显示**: 搜索结果按类型分组显示（词库、标签、文章）
- 🎯 **关键词高亮**: 搜索关键词在结果中高亮显示
- ⏰ **防抖搜索**: 300ms 防抖延迟，提升性能
- 🎹 **键盘导航**: 支持上下箭头键选择，回车确认，ESC 关闭
- 📤 **状态暴露**: 向父组件暴露选中结果，支持自动打开对应内容

## 使用方法

### 基础用法

```tsx
import CommandPalette from "./components/commandPalette";
import { useCommandPalette } from "@/hooks/useCommandPalette";

function App() {
  const commandPalette = useCommandPalette({
    enabled: true,
    shortcut: "ctrl+o",
  });

  return (
    <div>
      {/* 其他组件 */}
      <CommandPalette
        open={commandPalette.isOpen}
        onClose={commandPalette.close}
      />
    </div>
  );
}
```

### 高级用法 - 状态暴露

通过 `selectedResult` 和 `onSelectedResultChange` props，父组件可以监听选中结果的变化：

```tsx
import { useState, useEffect } from "react";
import CommandPalette, { SelectedResult } from "./components/commandPalette";

function App() {
  const [selectedResult, setSelectedResult] = useState<SelectedResult | null>(
    null,
  );

  // 监听选中结果变化
  useEffect(() => {
    if (selectedResult) {
      console.log("用户选择了:", selectedResult);

      // 根据结果类型执行相应操作
      switch (selectedResult.type) {
        case "vocabulary":
          // 打开词库笔记
          openVocabulary(selectedResult);
          break;
        case "tag":
          // 打开标签页面
          openTag(selectedResult);
          break;
        case "article":
          // 打开文章
          openArticle(selectedResult);
          break;
      }
    }
  }, [selectedResult]);

  return (
    <CommandPalette
      open={commandPalette.isOpen}
      onClose={commandPalette.close}
      selectedResult={selectedResult}
      onSelectedResultChange={setSelectedResult}
    />
  );
}
```

## Props

| 属性名                   | 类型                                       | 必需 | 默认值 | 说明                         |
| ------------------------ | ------------------------------------------ | ---- | ------ | ---------------------------- |
| `open`                   | `boolean`                                  | ✅   | -      | 控制面板是否打开             |
| `onClose`                | `() => void`                               | ✅   | -      | 关闭面板的回调函数           |
| `onSelectResult`         | `(result: SearchResult) => void`           | ❌   | -      | 选择结果时的回调（向后兼容） |
| `selectedResult`         | `SelectedResult \| null`                   | ❌   | -      | 当前选中的结果状态           |
| `onSelectedResultChange` | `(result: SelectedResult \| null) => void` | ❌   | -      | 选中结果变化时的回调         |

## 类型定义

### SearchResult

```tsx
interface SearchResult {
  id: number;
  title: string;
  content?: string;
  type: "vocabulary" | "tag" | "article";
  category?: string;
  tags_id?: number;
}
```

### SelectedResult

```tsx
interface SelectedResult extends SearchResult {
  timestamp: number; // 确保状态变化被正确监听
}
```

## 键盘快捷键

- `Ctrl+O`: 打开命令面板
- `↑/↓`: 在搜索结果中导航
- `Enter`: 选择当前高亮的结果
- `Esc`: 关闭命令面板

## 搜索范围

1. **词库 (vocabulary)**

   - 搜索词库标题
   - 支持分号分隔的多标题搜索
   - 按标签分类显示

2. **标签 (tag)**

   - 搜索标签名称
   - 显示标签描述（如果有）

3. **文章 (article)**
   - 搜索笔记内容
   - 显示内容预览（前 100 字符）

## 样式定制

组件使用了 Material-UI 和自定义 SCSS 样式。可以通过修改 `styles.scss` 文件来定制外观。

## 依赖

- React 18+
- Material-UI (@mui/material)
- 数据库模块 (worksListDB, tagsdb, noteContentDB)

## 注意事项

- 搜索功能依赖于数据库模块的正确实现
- 防抖延迟设置为 300ms，如需调整请修改 `useEffect` 中的延迟时间
- `timestamp` 字段用于确保相同内容的重复选择也能被 React 正确监听
