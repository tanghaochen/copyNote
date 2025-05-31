import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  Chip,
  IconButton,
  Divider,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import FolderIcon from "@mui/icons-material/Folder";
import BookIcon from "@mui/icons-material/Book";
import LabelIcon from "@mui/icons-material/Label";
import ArticleIcon from "@mui/icons-material/Article";
import { styled } from "@mui/system";
import Fuse from "fuse.js";
import { worksListDB } from "@/database/worksLists";
import { tagsdb } from "@/database/tagsdb";
import { noteContentDB } from "@/database/noteContentDB";
import "./styles.scss";

// 搜索结果类型定义
export interface SearchResult {
  id: number;
  title: string;
  content?: string;
  type: "vocabulary" | "tag" | "article";
  category?: string;
  tags_id?: number; // 添加标签ID用于打开对应标签
}

// 添加选中结果的扩展类型
export interface SelectedResult extends SearchResult {
  timestamp: number; // 添加时间戳确保状态变化被监听
}

// 样式组件
const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
    maxWidth: "600px",
    width: "90%",
    maxHeight: "80vh",
    margin: "20px",
    position: "absolute",
    top: 0,
  },
}));

const SearchContainer = styled(Box)({
  padding: "20px 20px 10px 20px",
  borderBottom: "1px solid #e5e7eb",
});

const ResultsContainer = styled(Box)({
  maxHeight: "400px",
  overflowY: "auto",
  padding: "10px 0",
});

const CategoryHeader = styled(Box)({
  padding: "8px 20px",
  backgroundColor: "#f8fafc",
  borderBottom: "1px solid #e5e7eb",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontWeight: 600,
  fontSize: "14px",
  color: "#374151",
});

const ResultItem = styled(ListItem)(({ theme }) => ({
  padding: "12px 20px",
  cursor: "pointer",
  transition: "background-color 0.2s ease",
  "&:hover": {
    backgroundColor: "#f1f5f9",
  },
  "&.selected": {
    backgroundColor: "#e0f2fe",
    borderLeft: "3px solid #0ea5e9",
  },
}));

const HighlightText = styled("span")({
  backgroundColor: "#fef3c7",
  color: "#92400e",
  padding: "2px 4px",
  borderRadius: "3px",
  fontWeight: 600,
  boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
});

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onSelectResult?: (result: SearchResult) => void;
  selectedResult?: SelectedResult | null; // 暴露给父组件的选中结果状态
  onSelectedResultChange?: (result: SelectedResult | null) => void; // 状态改变回调
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onClose,
  onSelectResult,
  selectedResult,
  onSelectedResultChange,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [useFuse, setUseFuse] = useState(true);
  const [useFuzzy, setUseFuzzy] = useState(false); // 默认关闭模糊搜索

  // Fuse.js 配置
  const fuseOptions = {
    keys: [
      { name: "title", weight: 0.7 },
      { name: "content", weight: 0.3 },
      { name: "category", weight: 0.2 },
    ],
    threshold: 0.4, // 匹配阈值，越小越严格
    distance: 100, // 距离参数
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 1,
  };

  // 高亮搜索关键词
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim() || !text) return text;

    // 转义特殊字符并创建不区分大小写的正则表达式
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedQuery})`, "gi");

    // 分割文本并高亮匹配部分
    const parts = text.split(regex);

    return parts.map((part, index) => {
      // 检查是否是匹配的部分（不区分大小写）
      if (part.toLowerCase() === query.toLowerCase()) {
        return <HighlightText key={index}>{part}</HighlightText>;
      }
      return part;
    });
  };

  // 搜索词库
  const searchVocabulary = async (query: string): Promise<SearchResult[]> => {
    try {
      const tags = await tagsdb.getTagsByCategory(1);
      let results: SearchResult[] = [];

      for (const tag of tags) {
        const metadata = await worksListDB.getMetadataByTagId(tag.id);
        if (metadata && metadata.length > 0) {
          const filteredMetadata = metadata.filter((item: any) =>
            item.title?.toLowerCase().includes(query.toLowerCase()),
          );

          const processedResults = filteredMetadata.flatMap((item: any) => {
            if (
              item.title &&
              (item.title.includes("；") || item.title.includes(";"))
            ) {
              const titles = item.title.split(/[；;]/);
              return titles
                .map((title: string) => ({
                  id: item.id,
                  title: title.trim(),
                  type: "vocabulary" as const,
                  category: tag.name,
                }))
                .filter(
                  (item: any) =>
                    item.title &&
                    item.title.toLowerCase().includes(query.toLowerCase()),
                );
            }
            return {
              id: item.id,
              title: item.title,
              type: "vocabulary" as const,
              category: tag.name,
            };
          });

          results = results.concat(processedResults);
        }
      }

      return results;
    } catch (error) {
      console.error("搜索词库失败:", error);
      return [];
    }
  };

  // 搜索标签
  const searchTags = async (query: string): Promise<SearchResult[]> => {
    try {
      const allTags = await tagsdb.getAllTags();
      return allTags
        .filter((tag: any) =>
          tag.name?.toLowerCase().includes(query.toLowerCase()),
        )
        .map((tag: any) => ({
          id: tag.id,
          title: tag.name,
          type: "tag" as const,
          content: tag.description || "",
          tags_id: tag.id, // 添加标签ID
        }));
    } catch (error) {
      console.error("搜索标签失败:", error);
      return [];
    }
  };

  // 搜索文章内容
  const searchArticles = async (query: string): Promise<SearchResult[]> => {
    try {
      // 使用优化后的搜索方法，优先搜索纯文本内容
      const allNotes = await noteContentDB.searchNoteContent(query);
      return allNotes.map((note: any) => {
        // 生成内容预览，包含匹配词汇前后的文本
        const previewContent = generateContentPreview(note.content, query);

        return {
          id: note.id,
          title: note.title || `笔记 ${note.id}`,
          content: previewContent,
          type: "article" as const,
        };
      });
    } catch (error) {
      console.error("搜索文章失败:", error);
      return [];
    }
  };

  // 生成内容预览，截取匹配关键词前后的文本
  const generateContentPreview = (content: string, query: string): string => {
    if (!content || !query.trim()) return content;

    const normalizedContent = content.replace(/\s+/g, " ").trim();
    const normalizedQuery = query.toLowerCase();
    const contentLower = normalizedContent.toLowerCase();

    // 查找第一个匹配位置
    const matchIndex = contentLower.indexOf(normalizedQuery);
    if (matchIndex === -1) return normalizedContent.substring(0, 150) + "...";

    // 设置预览参数
    const previewLength = 150; // 总预览长度
    const beforeLength = 60; // 关键词前的字符数
    const afterLength = 60; // 关键词后的字符数

    // 计算截取范围
    const start = Math.max(0, matchIndex - beforeLength);
    const end = Math.min(
      normalizedContent.length,
      matchIndex + query.length + afterLength,
    );

    let preview = normalizedContent.substring(start, end);

    // 添加省略号
    if (start > 0) preview = "..." + preview;
    if (end < normalizedContent.length) preview = preview + "...";

    // 确保预览长度不超过限制
    if (preview.length > previewLength) {
      preview = preview.substring(0, previewLength) + "...";
    }

    return preview;
  };

  // 模糊搜索词库
  const fuzzySearchVocabulary = async (
    query: string,
  ): Promise<SearchResult[]> => {
    try {
      const tags = await tagsdb.getTagsByCategory(1);
      let allItems: SearchResult[] = [];

      for (const tag of tags) {
        const metadata = await worksListDB.getMetadataByTagId(tag.id);
        if (metadata && metadata.length > 0) {
          const processedResults = metadata.flatMap((item: any) => {
            if (
              item.title &&
              (item.title.includes("；") || item.title.includes(";"))
            ) {
              const titles = item.title.split(/[；;]/);
              return titles.map((title: string) => ({
                id: item.id,
                title: title.trim(),
                type: "vocabulary" as const,
                category: tag.name,
              }));
            }
            return {
              id: item.id,
              title: item.title,
              type: "vocabulary" as const,
              category: tag.name,
            };
          });

          allItems = allItems.concat(processedResults);
        }
      }

      // 使用 Fuse.js 进行模糊搜索
      const fuse = new Fuse(allItems, fuseOptions);
      const fuseResults = fuse.search(query);

      return fuseResults.map((result) => result.item);
    } catch (error) {
      console.error("模糊搜索词库失败:", error);
      return [];
    }
  };

  // 模糊搜索标签
  const fuzzySearchTags = async (query: string): Promise<SearchResult[]> => {
    try {
      const allTags = await tagsdb.getAllTags();
      const tagResults: SearchResult[] = allTags.map((tag: any) => ({
        id: tag.id,
        title: tag.name,
        type: "tag" as const,
        content: tag.description || "",
        tags_id: tag.id,
      }));

      // 使用 Fuse.js 进行模糊搜索
      const fuse = new Fuse(tagResults, fuseOptions);
      const fuseResults = fuse.search(query);

      return fuseResults.map((result) => result.item as SearchResult);
    } catch (error) {
      console.error("模糊搜索标签失败:", error);
      return [];
    }
  };

  // 模糊搜索文章内容
  const fuzzySearchArticles = async (
    query: string,
  ): Promise<SearchResult[]> => {
    try {
      const allNotes = await noteContentDB.getAllContents(); // 返回 { note_id: number, content: string }[]
      const noteResults: SearchResult[] = allNotes.map((note: any) => ({
        id: note.note_id, // 使用 note_id 字段
        title: `笔记 ${note.note_id}`, // 由于只有 note_id 和 content，临时生成标题
        content: note.content,
        type: "article" as const,
      }));

      // 使用 Fuse.js 进行模糊搜索
      const fuse = new Fuse(noteResults, {
        ...fuseOptions,
        threshold: 0.6, // 文章内容搜索使用更宽松的阈值
      });
      const fuseResults = fuse.search(query);

      return fuseResults.map((result) => ({
        ...(result.item as SearchResult),
        content: generateContentPreview(
          (result.item as SearchResult).content || "",
          query,
        ),
      }));
    } catch (error) {
      console.error("模糊搜索文章失败:", error);
      return [];
    }
  };

  // 高亮模糊搜索结果
  const highlightFuzzyMatch = (text: string, query: string) => {
    if (!query.trim() || !text) return text;

    // 使用 Fuse.js 进行匹配高亮
    const fuse = new Fuse([{ text }], {
      keys: ["text"],
      includeMatches: true,
      threshold: 0.6,
    });

    const results = fuse.search(query);
    if (results.length === 0 || !results[0].matches) {
      return text;
    }

    const matches = results[0].matches[0];
    if (!matches.indices) return text;

    // 根据匹配索引进行高亮
    let highlightedText = text;
    let offset = 0;

    matches.indices.forEach(([start, end]) => {
      const before = highlightedText.slice(0, start + offset);
      const match = highlightedText.slice(start + offset, end + 1 + offset);
      const after = highlightedText.slice(end + 1 + offset);

      const highlightElement = `<span class="fuzzy-highlight">${match}</span>`;
      highlightedText = before + highlightElement + after;
      offset += highlightElement.length - match.length;
    });

    return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
  };

  // 执行搜索
  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        let vocabularyResults: SearchResult[];
        let tagResults: SearchResult[];
        let articleResults: SearchResult[];

        if (useFuzzy) {
          // 使用模糊搜索
          [vocabularyResults, tagResults, articleResults] = await Promise.all([
            fuzzySearchVocabulary(query),
            fuzzySearchTags(query),
            fuzzySearchArticles(query),
          ]);
        } else {
          // 使用精确搜索
          [vocabularyResults, tagResults, articleResults] = await Promise.all([
            searchVocabulary(query),
            searchTags(query),
            searchArticles(query),
          ]);
        }

        const allResults = [
          ...vocabularyResults,
          ...tagResults,
          ...articleResults,
        ];

        setSearchResults(allResults);
        setSelectedIndex(0);
      } catch (error) {
        console.error("搜索失败:", error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    },
    [useFuzzy],
  );

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch, useFuzzy]);

  // 键盘导航
  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setSelectedIndex((prev) =>
          prev < searchResults.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        event.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        event.preventDefault();
        if (searchResults[selectedIndex]) {
          handleSelectResult(searchResults[selectedIndex]);
        }
        break;
      case "Escape":
        event.preventDefault();
        onClose();
        break;
    }
  };

  // 选择结果
  const handleSelectResult = (result: SearchResult) => {
    console.log("选择了结果:", result);

    // 创建带时间戳的选中结果
    const selectedResultWithTimestamp: SelectedResult = {
      ...result,
      timestamp: Date.now(),
    };

    // 通知父组件状态变化
    onSelectedResultChange?.(selectedResultWithTimestamp);

    // 保持原有的回调
    onSelectResult?.(result);
    onClose();
  };

  // 按类型分组结果
  const groupedResults = searchResults.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  // 获取类型图标
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "vocabulary":
        return <BookIcon fontSize="small" />;
      case "tag":
        return <LabelIcon fontSize="small" />;
      case "article":
        return <ArticleIcon fontSize="small" />;
      default:
        return <FolderIcon fontSize="small" />;
    }
  };

  // 获取类型名称
  const getTypeName = (type: string) => {
    switch (type) {
      case "vocabulary":
        return "词库";
      case "tag":
        return "标签";
      case "article":
        return "文章";
      default:
        return "其他";
    }
  };

  // 重置状态
  useEffect(() => {
    if (open) {
      setSearchQuery("");
      setSearchResults([]);
      setSelectedIndex(0);
      // 聚焦搜索框
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      disableRestoreFocus
      PaperProps={{
        onKeyDown: handleKeyDown,
      }}
    >
      <DialogContent
        sx={{
          padding: 0,

          // zIndex: 9999999,
        }}
      >
        <SearchContainer>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SearchIcon sx={{ color: "#6b7280" }} />
            <TextField
              ref={searchInputRef}
              fullWidth
              autoFocus
              variant="standard"
              placeholder="搜索词库、标签、文章内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                disableUnderline: true,
                sx: {
                  fontSize: "16px",
                  "& input": {
                    padding: "8px 0",
                  },
                },
              }}
            />
            {loading && <CircularProgress size={20} />}
            <IconButton size="small" onClick={onClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* 模糊搜索开关 */}
          <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={useFuzzy}
                  onChange={(e) => setUseFuzzy(e.target.checked)}
                  size="small"
                  sx={{
                    py: 0,
                    color: "#6b7280",
                    "&.Mui-checked": {
                      color: "#0ea5e9",
                    },
                  }}
                />
              }
              label={
                <Typography
                  variant="body2"
                  sx={{
                    color: "#6b7280",
                    fontSize: "13px",
                    userSelect: "none",
                  }}
                >
                  模糊搜索 (支持拼写错误和近似匹配)
                </Typography>
              }
            />
          </Box>
        </SearchContainer>

        <ResultsContainer>
          {searchQuery && searchResults.length === 0 && !loading && (
            <Box
              sx={{
                padding: "40px 20px",
                textAlign: "center",
                color: "#6b7280",
              }}
            >
              <Typography>未找到相关结果</Typography>
            </Box>
          )}

          {!searchQuery && (
            <Box
              sx={{
                padding: "40px 20px",
                textAlign: "center",
                color: "#6b7280",
              }}
            >
              <Typography>开始输入以搜索内容...</Typography>
            </Box>
          )}

          {Object.entries(groupedResults).map(([type, results], groupIndex) => (
            <Box key={type}>
              <CategoryHeader>
                {getTypeIcon(type)}
                <span>{getTypeName(type)}</span>
                <Chip size="small" label={results.length} />
              </CategoryHeader>
              <List disablePadding>
                {results.map((result, index) => {
                  const globalIndex =
                    Object.entries(groupedResults)
                      .slice(0, groupIndex)
                      .reduce((acc, [, items]) => acc + items.length, 0) +
                    index;

                  return (
                    <ResultItem
                      key={`${result.type}-${result.id}-${index}`}
                      className={
                        selectedIndex === globalIndex ? "selected" : ""
                      }
                      onClick={() => handleSelectResult(result)}
                    >
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            {getTypeIcon(result.type)}
                            <span>
                              {useFuzzy
                                ? highlightFuzzyMatch(result.title, searchQuery)
                                : highlightMatch(result.title, searchQuery)}
                            </span>
                            {result.category && (
                              <Chip
                                size="small"
                                label={result.category}
                                variant="outlined"
                                sx={{ fontSize: "11px", height: "20px" }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          result.content && (
                            <Typography
                              variant="body2"
                              sx={{
                                color: "#6b7280",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "-webkit-box",
                                WebkitLineClamp:
                                  result.type === "article" ? 3 : 2,
                                WebkitBoxOrient: "vertical",
                                marginTop: "4px",
                                lineHeight: 1.4,
                                ...(result.type === "article" && {
                                  backgroundColor: "#f8fafc",
                                  padding: "6px 8px",
                                  borderRadius: "4px",
                                  marginTop: "6px",
                                  fontSize: "13px",
                                }),
                              }}
                            >
                              {useFuzzy
                                ? highlightFuzzyMatch(
                                    result.content,
                                    searchQuery,
                                  )
                                : highlightMatch(result.content, searchQuery)}
                            </Typography>
                          )
                        }
                      />
                    </ResultItem>
                  );
                })}
              </List>
              {groupIndex < Object.keys(groupedResults).length - 1 && (
                <Divider />
              )}
            </Box>
          ))}
        </ResultsContainer>
      </DialogContent>
    </StyledDialog>
  );
};

export default CommandPalette;
