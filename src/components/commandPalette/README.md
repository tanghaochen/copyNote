# CommandPalette 组件

一个功能强大的命令面板组件，支持精确搜索和模糊搜索功能。

## 功能特性

### 基础功能

- 支持搜索词库、标签、文章内容
- 实时搜索结果显示
- 键盘导航支持（上下箭头键、回车选择、ESC 关闭）
- 搜索结果分类显示
- 高亮匹配文本

### 新增模糊搜索功能 🎉

- **模糊搜索开关**：用户可以通过勾选框启用/禁用模糊搜索
- **智能匹配**：支持拼写错误和近似匹配
- **多重评分**：基于标题、内容、分类的加权评分
- **高级配置**：可调节匹配阈值和距离参数

## 使用方法

### 基本使用

```tsx
import CommandPalette from "@/components/commandPalette";

function App() {
  const [open, setOpen] = useState(false);

  return (
    <CommandPalette
      open={open}
      onClose={() => setOpen(false)}
      onSelectResult={(result) => {
        console.log("选中结果:", result);
      }}
    />
  );
}
```

### 模糊搜索配置

模糊搜索基于 Fuse.js 库实现，支持以下配置：

```typescript
const fuseOptions = {
  keys: [
    { name: "title", weight: 0.7 }, // 标题权重最高
    { name: "content", weight: 0.3 }, // 内容权重中等
    { name: "category", weight: 0.2 }, // 分类权重最低
  ],
  threshold: 0.4, // 匹配阈值，越小越严格
  distance: 100, // 距离参数
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 1,
};
```

## 搜索模式对比

### 精确搜索（默认）

- 使用字符串包含匹配
- 性能更快
- 适合准确搜索

### 模糊搜索

- 支持拼写错误容错
- 支持近似匹配
- 智能评分排序
- 更友好的用户体验

## 技术实现

### 依赖库

- **Fuse.js**：模糊搜索引擎
- **React**：UI 框架
- **Material-UI**：组件库
- **TypeScript**：类型支持

### 核心功能

1. **数据获取**：从数据库获取词库、标签、文章数据
2. **搜索引擎**：根据模式选择精确搜索或模糊搜索
3. **结果处理**：对搜索结果进行排序和分组
4. **高亮显示**：不同搜索模式使用不同的高亮策略

### 性能优化

- 防抖搜索（300ms 延迟）
- 异步数据加载
- 结果数量限制
- 智能缓存机制

## 键盘快捷键

| 快捷键  | 功能     |
| ------- | -------- |
| `↑`     | 向上选择 |
| `↓`     | 向下选择 |
| `Enter` | 确认选择 |
| `Esc`   | 关闭面板 |

## 自定义样式

组件支持通过 CSS 变量和 className 进行样式自定义：

```scss
.command-palette {
  .fuzzy-highlight {
    background-color: #dbeafe;
    color: #1e40af;
    padding: 1px 3px;
    border-radius: 3px;
    font-weight: 600;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
}
```

## 类型定义

```typescript
interface SearchResult {
  id: number;
  title: string;
  content?: string;
  type: "vocabulary" | "tag" | "article";
  category?: string;
  tags_id?: number;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onSelectResult?: (result: SearchResult) => void;
  selectedResult?: SelectedResult | null;
  onSelectedResultChange?: (result: SelectedResult | null) => void;
}
```

## 更新日志

### v2.0.0 - 2024-12-27

- ✨ 新增模糊搜索功能
- ✨ 新增搜索模式切换开关
- ✨ 新增智能高亮显示
- ♻️ 重构搜索引擎架构
- 🎨 优化 UI 交互体验
- 📝 完善文档说明

### v1.0.0

- 🎉 初始版本发布
- ✨ 基础搜索功能
- ✨ 键盘导航支持
- ✨ 分类结果显示
