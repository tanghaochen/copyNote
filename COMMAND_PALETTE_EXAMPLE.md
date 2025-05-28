# 命令面板状态暴露功能使用示例

## 功能说明

命令面板组件现在支持向父组件暴露选中的结果状态，父组件可以监听这个状态变化来自动执行相应的操作，比如打开对应的笔记、标签或文章。

## 实现效果

- ✅ 用户按 `Ctrl+O` 打开命令面板
- ✅ 用户搜索并选择一个结果（词库/标签/文章）
- ✅ 命令面板通过状态回调通知父组件
- ✅ 父组件根据选中结果的类型自动执行相应操作：
  - 词库：设置 `worksItem` 状态，打开对应词库笔记
  - 标签：设置 `selectedTag` 状态，切换到对应标签页面
  - 文章：设置 `worksItem` 状态，打开对应文章

## 核心代码实现

### 1. CommandPalette 组件中的状态暴露

```tsx
// 在选择结果时创建带时间戳的状态
const handleSelectResult = (result: SearchResult) => {
  const selectedResultWithTimestamp: SelectedResult = {
    ...result,
    timestamp: Date.now(), // 确保状态变化被监听
  };

  // 通知父组件状态变化
  onSelectedResultChange?.(selectedResultWithTimestamp);

  // 保持向后兼容
  onSelectResult?.(result);
  onClose();
};
```

### 2. App.tsx 中的状态监听

```tsx
// 命令面板选中结果状态
const [commandPaletteSelectedResult, setCommandPaletteSelectedResult] =
  useState<SelectedResult | null>(null);

// 监听状态变化并执行相应操作
useEffect(() => {
  if (commandPaletteSelectedResult) {
    switch (commandPaletteSelectedResult.type) {
      case "vocabulary":
        // 打开词库笔记
        const vocabularyItem: WorksListItem = {
          id: commandPaletteSelectedResult.id,
          title: commandPaletteSelectedResult.title,
          sort_order: 0,
          tags_id: commandPaletteSelectedResult.tags_id || 0,
        };
        setWorksItem(vocabularyItem);
        break;

      case "tag":
        // 打开标签页面
        if (commandPaletteSelectedResult.tags_id) {
          const tagItem: TreeItemData = {
            index: commandPaletteSelectedResult.tags_id.toString(),
            isFolder: true,
            children: [],
            label: commandPaletteSelectedResult.title,
            parent_id: commandPaletteSelectedResult.tags_id,
            data: {
              id: commandPaletteSelectedResult.tags_id,
              name: commandPaletteSelectedResult.title,
            },
          };
          setSelectedTag(tagItem);
        }
        break;

      case "article":
        // 打开文章
        const articleItem: WorksListItem = {
          id: commandPaletteSelectedResult.id,
          title: commandPaletteSelectedResult.title,
          sort_order: 0,
          tags_id: 0,
        };
        setWorksItem(articleItem);
        break;
    }
  }
}, [commandPaletteSelectedResult]);

// 组件使用
<CommandPalette
  open={commandPalette.isOpen}
  onClose={commandPalette.close}
  selectedResult={commandPaletteSelectedResult}
  onSelectedResultChange={setCommandPaletteSelectedResult}
/>;
```

## 类型定义

### SearchResult - 基础搜索结果类型

```tsx
interface SearchResult {
  id: number;
  title: string;
  content?: string;
  type: "vocabulary" | "tag" | "article";
  category?: string;
  tags_id?: number; // 标签ID，用于打开对应标签
}
```

### SelectedResult - 带时间戳的选中结果类型

```tsx
interface SelectedResult extends SearchResult {
  timestamp: number; // 确保状态变化被React正确监听
}
```

## 使用流程

1. **用户操作**：

   - 按 `Ctrl+O` 打开命令面板
   - 输入搜索关键词
   - 使用方向键导航或鼠标点击选择结果
   - 按回车确认选择

2. **组件响应**：

   - 命令面板创建 `SelectedResult` 对象（包含时间戳）
   - 通过 `onSelectedResultChange` 回调通知父组件
   - 关闭命令面板

3. **父组件处理**：
   - `useEffect` 监听到状态变化
   - 根据 `result.type` 判断结果类型
   - 执行相应的状态更新操作
   - 界面自动切换到对应内容

## 优势特点

- **类型安全**：完整的 TypeScript 类型定义
- **状态可靠**：时间戳确保相同内容的重复选择也能被监听
- **向后兼容**：保留原有的 `onSelectResult` 回调
- **灵活扩展**：父组件可以根据需要自定义处理逻辑
- **用户友好**：无缝的搜索和导航体验

## 扩展建议

可以进一步扩展功能：

1. **添加搜索历史**：记录用户最近的搜索和选择
2. **快速操作**：为不同类型的结果添加快捷操作按钮
3. **预览功能**：在选择前显示内容预览
4. **多选支持**：支持批量操作多个搜索结果
5. **搜索过滤**：添加按类型过滤搜索结果的功能
