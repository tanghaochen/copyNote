import React, { useState } from "react";
import { Box, Slider, Typography, Paper } from "@mui/material";
import MenuBar from "./index";

// 模拟编辑器和数据
const mockEditor = {
  commands: {
    focus: () => console.log("Focus editor"),
    toggleBold: () => console.log("Toggle bold"),
    toggleItalic: () => console.log("Toggle italic"),
    // ... 其他命令
  },
  isActive: (type: string) => false,
};

const mockTabItem = {
  value: 1,
  label: "示例笔记",
  content: "<p>这是一个示例笔记内容</p>",
};

const ResponsiveMenuExample: React.FC = () => {
  const [containerWidth, setContainerWidth] = useState(800);
  const [enableResponsive, setEnableResponsive] = useState(true);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        富文本菜单响应式布局示例
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography gutterBottom>容器宽度: {containerWidth}px</Typography>
        <Slider
          value={containerWidth}
          onChange={(_, value) => setContainerWidth(value as number)}
          min={300}
          max={1200}
          step={50}
          sx={{ width: 300 }}
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <label>
          <input
            type="checkbox"
            checked={enableResponsive}
            onChange={(e) => setEnableResponsive(e.target.checked)}
          />
          启用响应式布局
        </label>
      </Box>

      <Paper
        elevation={2}
        sx={{
          width: containerWidth,
          p: 2,
          border: "1px solid #ddd",
          transition: "width 0.3s ease",
        }}
      >
        <Typography variant="h6" gutterBottom>
          菜单预览 (宽度: {containerWidth}px)
        </Typography>

        {/* 这里需要一个模拟的编辑器上下文 */}
        <Box sx={{ border: "1px dashed #ccc", p: 1 }}>
          <Typography variant="body2" color="text.secondary">
            注意：这是一个演示示例。实际使用时需要在 TipTap 编辑器上下文中使用。
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            当容器宽度小于按钮总宽度时，多余的按钮会被隐藏，
            鼠标悬停在菜单区域时会显示隐藏的按钮。
          </Typography>
        </Box>
      </Paper>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          使用说明：
        </Typography>
        <Typography variant="body2" component="div">
          <ul>
            <li>拖动滑块调整容器宽度，观察菜单的响应式变化</li>
            <li>当宽度不足时，按钮会自动换行并被隐藏</li>
            <li>鼠标悬停在菜单区域时，会显示隐藏的按钮</li>
            <li>取消勾选"启用响应式布局"可以看到原始的滚动行为</li>
          </ul>
        </Typography>
      </Box>
    </Box>
  );
};

export default ResponsiveMenuExample;
