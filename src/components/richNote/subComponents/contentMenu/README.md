# 富文本菜单组件响应式布局功能

## 功能说明

富文本菜单组件现在支持响应式布局功能，当容器宽度不足时，多余的按钮会自动隐藏，并通过鼠标悬停显示在弹出菜单中。

## 使用方法

### 基本用法

```tsx
import RichTextEditor from "@/components/richNote";

// 启用响应式布局
<RichTextEditor
  tabItem={{
    content: noteContent,
    value: noteId,
    label: "笔记标题",
  }}
  isShowHeading={true}
  enableResponsiveLayout={true} // 启用响应式布局
/>;
```

### 功能特性

1. **自动检测换行**: 使用 ResizeObserver API 监听容器尺寸变化
2. **智能隐藏**: 当按钮换行时，自动将第二行及以后的按钮隐藏
3. **悬停显示**: 鼠标进入菜单区域时，显示隐藏的按钮
4. **不影响布局**: 使用 Popper 组件，不会影响下方内容的位置
5. **保持功能**: 隐藏的按钮保持完整的功能

### 实现原理

1. **容器监听**: 使用 `ResizeObserver` 监听菜单容器的尺寸变化
2. **位置检测**: 通过 `getBoundingClientRect().top` 检测按钮是否换行
3. **动态隐藏**: 设置容器 `maxHeight` 和 `overflow: hidden` 隐藏换行按钮
4. **弹出菜单**: 使用 Material-UI 的 `Popper` 组件显示隐藏的按钮

### 配置选项

- `enableResponsiveLayout`: boolean - 是否启用响应式布局，默认为 false
- 当设置为 true 时，菜单会自动适应容器宽度
- 当设置为 false 时，菜单保持原有的滚动行为

### 注意事项

1. 只有在 `enableResponsiveLayout={true}` 时才会启用响应式功能
2. 需要确保菜单容器有足够的空间显示至少一行按钮
3. 弹出菜单的 z-index 设置为 1300，确保在其他元素之上显示
