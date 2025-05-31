import React, { useState } from "react";
import { Button, Box, Typography, Paper } from "@mui/material";
import CommandPalette, { SearchResult, SelectedResult } from "./index";

/**
 * CommandPalette 模糊搜索功能示例
 */
const CommandPaletteExample: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SelectedResult | null>(
    null,
  );
  const [searchHistory, setSearchHistory] = useState<SelectedResult[]>([]);

  const handleSelectResult = (result: SearchResult) => {
    console.log("选中结果:", result);

    // 这里可以根据结果类型执行不同的操作
    switch (result.type) {
      case "vocabulary":
        console.log("打开词库项:", result.title);
        break;
      case "tag":
        console.log("打开标签页面:", result.title);
        break;
      case "article":
        console.log("打开文章:", result.title);
        break;
    }
  };

  const handleSelectedResultChange = (result: SelectedResult | null) => {
    setSelectedResult(result);

    if (result) {
      // 添加到搜索历史
      setSearchHistory((prev) => {
        const newHistory = [
          result,
          ...prev.filter((item) => item.id !== result.id),
        ];
        return newHistory.slice(0, 10); // 只保留最近10条
      });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        CommandPalette 模糊搜索示例
      </Typography>

      <Typography variant="body1" sx={{ mb: 3 }}>
        点击下方按钮打开命令面板，体验全新的模糊搜索功能！
      </Typography>

      {/* 功能说明 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          功能特性
        </Typography>
        <ul>
          <li>
            <strong>智能匹配</strong>：支持拼写错误和近似匹配
          </li>
          <li>
            <strong>模式切换</strong>：可在精确搜索和模糊搜索间切换
          </li>
          <li>
            <strong>实时预览</strong>：搜索结果实时更新
          </li>
          <li>
            <strong>键盘导航</strong>：支持上下键和回车选择
          </li>
          <li>
            <strong>分类显示</strong>：结果按词库、标签、文章分组
          </li>
        </ul>
      </Paper>

      {/* 搜索示例 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          搜索示例
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          尝试搜索以下内容来体验模糊搜索：
        </Typography>
        <ul>
          <li>
            拼写错误：<code>writen</code> → <code>written</code>
          </li>
          <li>
            部分匹配：<code>prog</code> → <code>programming</code>
          </li>
          <li>
            近似词汇：<code>js</code> → <code>JavaScript</code>
          </li>
          <li>
            中文搜索：<code>编程</code> → 相关编程内容
          </li>
        </ul>
      </Paper>

      {/* 操作按钮 */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          onClick={() => setOpen(true)}
          sx={{ mr: 2 }}
        >
          打开命令面板
        </Button>

        <Button variant="outlined" onClick={() => setSearchHistory([])}>
          清空历史
        </Button>
      </Box>

      {/* 当前选中结果 */}
      {selectedResult && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: "primary.50" }}>
          <Typography variant="h6" gutterBottom>
            当前选中结果
          </Typography>
          <Typography>
            <strong>标题：</strong> {selectedResult.title}
          </Typography>
          <Typography>
            <strong>类型：</strong> {selectedResult.type}
          </Typography>
          {selectedResult.category && (
            <Typography>
              <strong>分类：</strong> {selectedResult.category}
            </Typography>
          )}
          {selectedResult.content && (
            <Typography>
              <strong>内容：</strong> {selectedResult.content.substring(0, 100)}
              ...
            </Typography>
          )}
          <Typography>
            <strong>时间戳：</strong>{" "}
            {new Date(selectedResult.timestamp).toLocaleString()}
          </Typography>
        </Paper>
      )}

      {/* 搜索历史 */}
      {searchHistory.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            搜索历史
          </Typography>
          {searchHistory.map((item, index) => (
            <Box
              key={`${item.id}-${item.timestamp}`}
              sx={{
                p: 1,
                mb: 1,
                bgcolor: "grey.100",
                borderRadius: 1,
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Typography variant="body2" sx={{ flex: 1 }}>
                <strong>{item.title}</strong> ({item.type})
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(item.timestamp).toLocaleTimeString()}
              </Typography>
            </Box>
          ))}
        </Paper>
      )}

      {/* CommandPalette 组件 */}
      <CommandPalette
        open={open}
        onClose={() => setOpen(false)}
        onSelectResult={handleSelectResult}
        selectedResult={selectedResult}
        onSelectedResultChange={handleSelectedResultChange}
      />
    </Box>
  );
};

export default CommandPaletteExample;
