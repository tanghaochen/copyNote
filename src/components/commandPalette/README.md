# 命令面板组件 (CommandPalette)

一个功能强大的搜索命令面板组件，支持搜索词库、标签和文章内容。

## 功能特性

- 🔍 **全局搜索**: 支持搜索词库标题、标签名称和文章内容
- ⌨️ **快捷键支持**: 默认使用 `Ctrl+O` 打开命令面板
- 📂 **分类显示**: 搜索结果按类型分组显示（词库、标签、文章）
- 🎯 **关键词高亮**: 搜索关键词在结果中高亮显示
- ⏰ **防抖搜索**: 300ms 防抖延迟，提高搜索性能
- 🎹 **键盘导航**: 支持上下箭头导航和回车选择

## 使用方法

### 基本用法

```tsx
import CommandPalette from "@/components/commandPalette";
import { useCommandPalette } from "@/hooks/useCommandPalette";

function App() {
  // 使用命令面板hook
  const commandPalette = useCommandPalette({
    enabled: true,
    shortcut: "ctrl+o",
  });

  // 处理选择结果
  const handleSelect = (result) => {
    console.log("选择了:", result);
    // 根据结果类型进行相应操作
    switch (result.type) {
      case "vocabulary":
        // 处理词库选择
        break;
      case "tag":
        // 处理标签选择
        break;
      case "article":
        // 处理文章选择
        break;
    }
  };

  return (
    <div>
      <CommandPalette
        open={commandPalette.isOpen}
        onClose={commandPalette.close}
        onSelectResult={handleSelect}
      />
    </div>
  );
}
```

### Props

| 属性             | 类型                             | 必需 | 默认值 | 描述                   |
| ---------------- | -------------------------------- | ---- | ------ | ---------------------- |
| `open`           | `boolean`                        | ✅   | -      | 控制命令面板是否显示   |
| `onClose`        | `() => void`                     | ✅   | -      | 关闭命令面板的回调函数 |
| `onSelectResult` | `(result: SearchResult) => void` | ❌   | -      | 选择搜索结果的回调函数 |

### SearchResult 类型

```typescript
interface SearchResult {
  id: number;
  title: string;
  content?: string;
  type: "vocabulary" | "tag" | "article";
  category?: string;
}
```

## 快捷键

- `Ctrl+O`: 打开/关闭命令面板
- `ArrowUp/ArrowDown`: 在搜索结果中导航
- `Enter`: 选择当前高亮的结果
- `Escape`: 关闭命令面板

## 搜索功能

命令面板支持以下类型的搜索：

### 1. 词库搜索

- 搜索 `category_id = 1` 的所有标签下的词库标题
- 支持分号分隔的标题（会拆分为多个词条）
- 显示所属分类信息

### 2. 标签搜索

- 搜索所有标签的名称
- 显示标签描述信息

### 3. 文章内容搜索

- 在笔记内容中进行全文搜索
- 支持内容预览（限制 100 字符）
- 最多显示 50 条结果

## 自定义样式

命令面板使用了 SCSS 样式文件，你可以通过覆盖以下类名来自定义样式：

```scss
.command-palette {
  // 主容器样式

  .search-input {
    // 搜索输入框样式
  }

  .category-header {
    // 分类标题样式
  }

  .result-item {
    // 搜索结果项样式

    &.selected {
      // 选中状态样式
    }
  }

  .highlight {
    // 关键词高亮样式
  }
}
```

## 注意事项

1. 确保数据库方法 `searchNoteContent` 和 `getAllTags` 已正确实现
2. 组件依赖 Material-UI 组件库
3. 搜索功能需要有效的数据库连接
4. 建议在全局级别使用，确保快捷键在任何页面都能正常工作
