import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import FlexSearch from "flexsearch";
import { clipboard, IpcRendererEvent } from "electron";
import "./styles/index.scss";
import { worksListDB } from "@/database/worksLists";
import { noteContentDB } from "@/database/noteContentDB";
import PushPinIcon from "@mui/icons-material/PushPin";
import CloseIcon from "@mui/icons-material/Close";
import SettingsIcon from "@mui/icons-material/Settings";
import RemoveIcon from "@mui/icons-material/Remove";
import CropSquareIcon from "@mui/icons-material/CropSquare";
import FilterNoneIcon from "@mui/icons-material/FilterNone";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ListIcon from "@mui/icons-material/List";
import TocOutlinedIcon from "@mui/icons-material/TocOutlined";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import Button from "@mui/material/Button";
import { styled } from "@mui/system";
import DOMPurify from "dompurify";
import {
  ImperativePanelGroupHandle,
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import { Breadcrumbs, Typography, Chip, IconButton, Box } from "@mui/material";
// 富文本组件
import RichTextEditor from "@/components/richNote";
import "@/components/richNote/styles/index.scss";
import { tagsdb } from "@/database/tagsdb";
import { useVisibleControl } from "./lib";
import DocumentOutline from "@/components/documentOutline";
import { Editor } from "@tiptap/react"; // 添加Editor类型导入

interface HighlightProps {
  textContent: string;
  items?: Array<{ id: number; title: string }>;
  isVisibleContent?: boolean;
  setVisibleContent?: (visible: boolean) => void;
  showContentPanel?: boolean;
  showContent?: boolean;
  onToggleContent?: () => void;
}

// 自定义样式组件
const ControlBar = styled("div")(
  ({ theme, isPinned }: { theme?: any; isPinned: boolean }) => ({
    // width: "100%",
    backgroundColor: "#1f2937", // 深灰色背景
    padding: "0.25rem 1rem",
    borderRadius: "0.375rem 0.375rem 0 0", // 只有顶部圆角
    marginBottom: "0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    transition: "all 0.3s ease",
    position: "sticky",
    top: "0",
    zIndex: 100,
    height: "1.5rem",
    color: "#fff",
    WebkitAppRegion: "drag", // 添加可拖拽属性
  }),
);

const KeywordsContainer = styled("div")({
  padding: "0.5rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
  backgroundColor: "#f9fafb",
  borderBottom: "1px solid #e5e7eb",
  height: "100%",
  overflowY: "auto",
  width: "15rem",
  flexShrink: 0,
  // maxHeight: "250px", // 限制高度以适应初始窗口大小
});

const KeywordItem = styled("div")(({ isActive }: { isActive: boolean }) => ({
  padding: "0.25rem 0.5rem",
  cursor: "pointer",
  backgroundColor: isActive ? "#EAEAEA" : "transparent",
  borderRadius: "4px",
  fontWeight: isActive ? "bold" : "normal",
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: "#EAEAEA",
  },
}));

const TextHighlighter = ({
  textContent,
  items = [],
  isVisibleContent = true,
  setVisibleContent = () => {},
  showContentPanel = true,
  showContent = false,
  onToggleContent = () => {},
}: HighlightProps) => {
  const [highlightedText, setHighlightedText] = useState(textContent);
  const contentPreviewRef = useRef<HTMLDivElement>(null);
  const [noteContent, setNoteContent] = useState(""); // 笔记内容
  // 被点击显示的笔记id
  const [activeNoteId, setActiveNoteId] = useState<number | null>(null);
  // 找到的关键词
  const [foundKeywords, setFoundKeywords] = useState<string[]>([]);
  // 当前活跃的关键词
  const [activeKeyword, setActiveKeyword] = useState<string | null>(null);
  // 是否显示面板（点击关键词后才显示）
  const [showPanel, setShowPanel] = useState<boolean>(false);
  // 关键词容器的引用，用于获取尺寸
  const keywordsContainerRef = useRef<HTMLDivElement>(null);
  const [activeRichTextEditor, setActiveRichTextEditor] =
    useState<Editor | null>(null);
  const editorInstanceRef = useRef<Editor | null>(null); // 添加ref存储编辑器实例
  const [showOutline, setShowOutline] = useState(true); // 控制是否显示目录，默认显示

  // 更新editorInstanceRef的函数
  const updateEditorRef = useCallback((editor: any) => {
    console.log("更新编辑器引用", editor);
    editorInstanceRef.current = editor;
    setActiveRichTextEditor(editor);
  }, []);

  // 手动调用聚焦的函数
  const focusEditor = useCallback(() => {
    if (editorInstanceRef.current) {
      console.log("通过引用聚焦编辑器", editorInstanceRef.current);
      try {
        // @ts-ignore - 忽略TypeScript错误
        editorInstanceRef.current.commands.focus();
      } catch (error) {
        console.error("聚焦失败", error);
      }
    } else {
      console.log("编辑器引用不存在，无法聚焦");
    }
  }, []);

  useEffect(() => {
    console.log("activeRichTextEditor>>>", activeRichTextEditor);
    // 更新引用
    if (activeRichTextEditor) {
      editorInstanceRef.current = activeRichTextEditor;
    }
  }, [activeRichTextEditor]);

  const sortedItems = useMemo(() => {
    console.log("sortedItems", items);
    return [...items].sort((a, b) => b.title.length - a.title.length);
  }, [items]);

  const titleToIdMap = useMemo(() => {
    const map = new Map<string, number>();
    // 3244
    sortedItems.forEach((item) => map.set(item.title, item.id));
    return map;
  }, [sortedItems]);

  const escapeRegExp = useCallback((str: string) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }, []);

  // 在工具函数部分添加HTML转义方法
  const escapeHtml = (unsafe: string) => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const highlightAll = useCallback(() => {
    try {
      // 转义原始文本中的HTML标签
      const escapedText = escapeHtml(textContent);
      const foundWords: string[] = [];

      // 创建正则表达式模式，避免空数组导致的无效正则
      if (sortedItems.length === 0) {
        setHighlightedText(escapedText);
        setFoundKeywords([]);
        return;
      }

      const pattern = new RegExp(
        sortedItems
          .map((item) => {
            // 确保item.title存在且为字符串
            if (!item.title || typeof item.title !== "string") return "";
            const escaped = escapeRegExp(escapeHtml(item.title));
            return `(\\{${escaped}\\})|(\\[${escaped}\\])|${escaped}`;
          })
          .filter((pattern) => pattern !== "") // 过滤掉空字符串
          .join("|"),
        "gi",
      );

      // 执行替换并收集找到的关键词
      const newText = escapedText.replace(pattern, (match) => {
        const title = match.replace(/[{}[\]]/g, "");
        const id = titleToIdMap.get(title);

        // 添加到找到的关键词列表
        if (!foundWords.includes(title)) {
          foundWords.push(title);
        }

        return id !== undefined
          ? `<mark class="highlight" data-id="${id}">${match}</mark>`
          : match;
      });

      // 更新找到的关键词
      setFoundKeywords(foundWords);

      // 使用DOMPurify清理最终HTML，防止XSS攻击
      setHighlightedText(DOMPurify.sanitize(newText));
    } catch (error) {
      console.error("高亮出错:", error);
      // 出错时至少显示原始文本（经过HTML转义）
      setHighlightedText(escapeHtml(textContent));
      setFoundKeywords([]);
    }
  }, [sortedItems, textContent, titleToIdMap, escapeRegExp]);

  useEffect(() => {
    highlightAll();
  }, [textContent, items, highlightAll]);

  useEffect(() => {
    console.log(
      "所有需要高亮的词语:",
      sortedItems.map((item) => ({
        id: item.id,
        title: item.title,
      })),
    );
    console.log("找到的关键词:", foundKeywords);
  }, [sortedItems, foundKeywords]);

  // 处理点击关键词的函数
  const handleChipClick = async (keyword: string) => {
    // 设置当前活跃的关键词
    setActiveKeyword(keyword);
    // 显示面板
    setShowPanel(true);

    setVisibleContent(true);

    // 使用直接方式调整窗口大小
    if (!showPanel) {
      window.ipcRenderer?.send("resize-window", { width: 940, height: 550 });
    }

    // 查找对应的ID
    const id = titleToIdMap.get(keyword);
    if (!id) return;

    try {
      const noteItem = await noteContentDB.getContentByNoteId(Number(id));
      // 使用DOMPurify清理笔记内容
      setNoteContent(DOMPurify.sanitize(noteItem));
      setActiveNoteId(id);

      // 内容设置后，使用多种方式尝试聚焦编辑器
      setTimeout(() => {
        focusEditor();

        // 方法1：尝试直接触发点击事件
        const editorDOM = document.querySelector(".ProseMirror");
        if (editorDOM) {
          console.log("找到编辑器DOM，模拟点击");
          try {
            // 模拟鼠标点击
            editorDOM.dispatchEvent(
              new MouseEvent("click", {
                view: window,
                bubbles: true,
                cancelable: true,
              }),
            );

            // 触发焦点
            editorDOM.dispatchEvent(
              new Event("focus", {
                bubbles: true,
              }),
            );
          } catch (error) {
            console.error("模拟点击失败", error);
          }
        } else {
          console.log("未找到编辑器DOM元素");
        }
      }, 800);
    } catch (error) {
      console.error("获取笔记内容失败:", error);
      setNoteContent("<p>获取笔记内容失败</p>");
      setActiveNoteId(null);
    }
  };

  // 添加DOM操作方式聚焦
  const focusEditorWithDOM = useCallback(() => {
    setTimeout(() => {
      // 方法2：通过DOM直接设置焦点
      const editorDOM = document.querySelector(".ProseMirror");
      if (editorDOM) {
        console.log("通过DOM直接聚焦");
        try {
          // @ts-ignore
          editorDOM.focus();
        } catch (error) {
          console.error("DOM聚焦失败", error);
        }
      }
    }, 300);
  }, []);

  // 监听noteContent变化以尝试聚焦编辑器
  useEffect(() => {
    if (noteContent) {
      console.log("内容已更新，稍后尝试聚焦编辑器");
      const timer = setTimeout(() => {
        focusEditor();
        focusEditorWithDOM();

        // 方法3：模拟按键事件
        const editorDOM = document.querySelector(".ProseMirror");
        if (editorDOM) {
          console.log("模拟按键事件");
          try {
            editorDOM.dispatchEvent(
              new KeyboardEvent("keydown", {
                key: "a",
                code: "KeyA",
                bubbles: true,
              }),
            );
          } catch (error) {
            console.error("模拟按键失败", error);
          }
        }
      }, 1000); // 更长的延迟确保编辑器已加载

      return () => clearTimeout(timer);
    }
  }, [noteContent, focusEditor, focusEditorWithDOM]);

  useEffect(() => {
    console.log(textContent, items);
  }, [textContent, items]);

  useEffect(() => {
    console.log(textContent, items);
    setShowPanel(false);

    const handler = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("highlight")) {
        const id = target.dataset.id;
        if (!id) return;

        // 获取高亮文本内容并设置为活跃关键词
        const highlightText = target.textContent?.replace(/[{}[\]]/g, "") || "";
        setActiveKeyword(highlightText);
        // 显示面板
        setShowPanel(true);

        // 使用直接方式调整窗口大小
        window.ipcRenderer?.send("resize-window", { width: 940, height: 550 });

        try {
          const noteItem = await noteContentDB.getContentByNoteId(Number(id));
          // 使用DOMPurify清理笔记内容
          setNoteContent(DOMPurify.sanitize(noteItem));
          setActiveNoteId(Number(id));
        } catch (error) {
          console.error("获取笔记内容失败:", error);
          setNoteContent("<p>获取笔记内容失败</p>");
          setActiveNoteId(null);
        }
      }
    };

    const container = contentPreviewRef.current;
    container?.addEventListener("click", handler);

    return () => container?.removeEventListener("click", handler);
  }, []);

  const ref = useRef<ImperativePanelGroupHandle>(null);

  // 在组件加载和foundKeywords变化时发送窗口尺寸消息
  useEffect(() => {
    console.log("检测到关键词变化，数量:", foundKeywords.length);

    // 当找到关键词时，通知主进程将窗口移动到鼠标位置
    if (foundKeywords.length > 0) {
      console.log("关键词已计算完成且找到匹配项，通知主进程移动窗口到鼠标位置");
      window.ipcRenderer?.send("move-window-to-cursor");
    }

    // 添加键盘事件处理函数
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        console.log("检测到ESC键，关闭窗口");
        // 直接发送关闭窗口消息，不使用节流
        window.ipcRenderer?.send("close-window");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [foundKeywords]);

  // 在展示的关键词里，取前5个，如果有关键词就显示
  const displayKeywords = useMemo(() => {
    return foundKeywords.length > 0 ? foundKeywords : foundKeywords;
  }, [foundKeywords]);

  // 使用 useEffect 在 displayKeywords 更新且长度大于 0 时通知主进程移动窗口
  useEffect(() => {
    if (displayKeywords.length > 0) {
      console.log("关键词已计算完成，通知主进程移动窗口到鼠标位置");
      window.ipcRenderer?.send("move-window-to-cursor");
    }
  }, [displayKeywords]);

  // 切换目录显示状态
  const handleToggleOutline = useCallback(() => {
    setShowOutline(!showOutline);
    console.log("切换目录显示状态:", !showOutline);
  }, [showOutline]);

  return (
    <div className="highlighter-container h-full" style={{ display: "flex" }}>
      <KeywordsContainer ref={keywordsContainerRef}>
        {displayKeywords.map((keyword, index) => (
          <KeywordItem
            key={index}
            isActive={activeKeyword === keyword}
            onClick={() => handleChipClick(keyword)}
          >
            {keyword}
          </KeywordItem>
        ))}
        {displayKeywords.length === 0 && (
          <div style={{ padding: "0.5rem", color: "#666" }}>
            未找到相关关键词
          </div>
        )}
      </KeywordsContainer>

      {/* 点击关键词list显示panel， */}
      <PanelGroup direction="horizontal" ref={ref}>
        {isVisibleContent && (
          <>
            <Panel order={1}>
              <div className="content-preview content-preview-target">
                <div className="font-bold">获取内容</div>
                <div
                  ref={contentPreviewRef}
                  dangerouslySetInnerHTML={{ __html: highlightedText }}
                  style={{ whiteSpace: "pre-wrap" }}
                ></div>
              </div>
            </Panel>
            <PanelResizeHandle className="w-1 bg-stone-200" />
          </>
        )}

        <Panel order={2}>
          <div className="content-preview content-preview-note react-tabs__tab-panel--selected">
            <div className="font-bold ">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <div>笔记内容</div>
                <div className="flex gap-4">
                  <IconButton
                    size="small"
                    onClick={onToggleContent}
                    sx={{
                      color: "#666",
                      padding: "2px",
                      backgroundColor: showContent ? "#E7E9E8" : "transparent",
                    }}
                    title={showContent ? "隐藏获取内容" : "显示获取内容"}
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                  {/* 添加目录控制按钮 */}
                  <IconButton
                    size="small"
                    onClick={handleToggleOutline}
                    sx={{
                      color: "#666",
                      padding: "2px",
                      backgroundColor: showOutline ? "#E7E9E8" : "transparent",
                    }}
                    title={showOutline ? "隐藏目录" : "显示目录"}
                  >
                    {showOutline ? (
                      <TocOutlinedIcon fontSize="small" />
                    ) : (
                      <ListIcon fontSize="small" />
                    )}
                  </IconButton>
                </div>
              </div>
            </div>
            {/* <div dangerouslySetInnerHTML={{ __html: noteContent }}></div> */}
            {/* 如果没有高亮，富文本不显示， 提供没有找到 */}
            {foundKeywords.length > 0 ? (
              <RichTextEditor
                setActiveRichTextEditor={updateEditorRef}
                tabItem={{ content: noteContent, value: activeNoteId }}
                isShowHeading={false}
              />
            ) : (
              // 没有找到
              <div className="w-full h-full flex items-center justify-center">
                <div>没有找到相关内容</div>
              </div>
            )}
          </div>
        </Panel>

        {showOutline && (
          <>
            <PanelResizeHandle className="w-1 bg-stone-200" />
            <Panel defaultSize={40} minSize={15} maxSize={40} order={3}>
              <div className="h-full bg-white overflow-auto border-l border-gray-200">
                <DocumentOutline
                  editor={activeRichTextEditor}
                  activeTabsItem={activeRichTextEditor}
                  richTextEditorEleRef={null}
                />
              </div>
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  );
};

const App = () => {
  const [customClipBoardContent, setCustomClipBoardContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showContent, setShowContent] = useState(false); // 控制是否显示获取内容，默认不显示
  const items = [
    { id: 1, title: "Java" },
    { id: 2, title: "Python" },
    { id: 6, title: "编程" },
    { id: 7, title: "言" },
    { id: 8, title: "语言" },
    { id: 6, title: "编程语言" },
    { id: 3, title: "JavaScript" },
    { id: 4, title: "Spring" },
    { id: 5, title: "log" },
  ];
  const [highlightedKeywords, setHighlightedKeywords] = useState(items);

  const handlePin = () => {
    setIsPinned(!isPinned);
    console.log("设置窗口固定状态:", !isPinned);
    window.ipcRenderer?.send("pin-window", !isPinned);
  };

  const handleClose = () => {
    console.log("关闭窗口按钮被点击");
    window.ipcRenderer?.send("close-window");
    setIsClosed(true);
  };

  const handleMinimize = () => {
    window.ipcRenderer?.send("minimize-window");
  };

  const handleMaximize = () => {
    window.ipcRenderer?.send("maximize-window");
    setIsMaximized(!isMaximized);
  };

  // 切换获取内容显示状态
  const handleToggleContent = () => {
    setShowContent(!showContent);
    console.log("切换获取内容显示状态:", !showContent);
  };

  // 监听窗口最大化/还原状态变化
  useEffect(() => {
    const handleMaximizeChange = (_: any, maximized: boolean) => {
      setIsMaximized(maximized);
    };

    window.ipcRenderer?.on("maximize-change", handleMaximizeChange);

    return () => {
      window.ipcRenderer?.off?.("maximize-change", handleMaximizeChange);
    };
  }, []);

  const handleClipboardUpdate = useCallback(
    (event: IpcRendererEvent, text: string) => {
      console.log("handleClipboardUpdate:", event, text);
      if (!text) {
        console.warn("handleClipboardUpdate: text 是空的");
        return;
      }

      // 使用传入的 text 参数
      const cleanText = text
        .replace(/\n{3,}/g, "\n")
        .replace(/^\n+|\n+$/g, "")
        .replace(/[\u200B-\u200D\uFEFF]/g, "");

      setCustomClipBoardContent(cleanText);
    },
    [],
  );

  // 获取词库列表
  const getWorksList = async () => {
    try {
      // 1. 先获取category_id为1的所有标签
      const tags = await tagsdb.getTagsByCategory(1);

      // 2. 初始化结果数组
      let allMetadata: Array<{ id: number; title: string }> = [];

      // 3. 对每个标签查询对应的metadata
      for (const tag of tags) {
        const metadata = await worksListDB.getMetadataByTagId(tag.id);
        if (metadata && metadata.length > 0) {
          // 处理含有分号的标题，将其分割为多个条目
          const processedMetadata = metadata.flatMap(
            (item: { id: number; title: string }) => {
              // 检查标题中是否包含分号（中文分号或英文分号）
              if (
                item.title &&
                (item.title.includes("；") || item.title.includes(";"))
              ) {
                // 将标题按分号分割
                const titles = item.title.split(/[；;]/);
                // 为每个分割后的标题创建新条目，保持相同的ID
                return titles
                  .map((title: string) => ({
                    id: item.id,
                    title: title.trim(), // 去除可能的空格
                  }))
                  .filter((item: { title: string }) => item.title); // 过滤掉空标题
              }
              return item; // 不含分号的直接返回
            },
          );

          allMetadata = allMetadata.concat(processedMetadata);
        }
      }

      console.log("获取词库列表", allMetadata);
      setHighlightedKeywords(allMetadata);
      return allMetadata;
    } catch (error) {
      console.error("获取词库列表失败:", error);
      return [];
    }
  };

  // 窗口可见性状态
  const [isWindowVisible, setIsWindowVisible] = useState(false);

  useEffect(() => {
    getWorksList();

    // 监听剪贴板更新
    window.ipcRenderer?.on("clipboard-update", async (event: any) => {
      console.log("收到剪贴板更新事件:", event);

      // 从事件数据中获取 text 和 isVisible
      const { text, isVisible } = event;

      // 记录窗口可见性
      console.log("窗口可见性(从事件中):", isVisible);
      setIsWindowVisible(!!isVisible);

      getWorksList();

      // 确保传递正确的参数给 handleClipboardUpdate
      if (text) {
        handleClipboardUpdate(event, text);
      }

      if (!isVisible) {
        window.ipcRenderer?.send("resize-window", { width: 200, height: 200 });
      }
    });

    return () => {
      window.ipcRenderer?.off?.("clipboard-update", handleClipboardUpdate);
    };
  }, [handleClipboardUpdate, isWindowVisible]);

  if (isClosed) return null;

  return (
    <div
      className="noteHightLightRoot"
      onMouseEnter={() => {
        window.ipcRenderer?.send("mouse-enter-window");
      }}
      onMouseLeave={(e) => {
        window.ipcRenderer?.send("mouse-leave-window");

        // 强制发送停止移动消息，确保isMoving重置为false
        window.ipcRenderer?.send("window-drag-end");
      }}
    >
      <ControlBar
        isPinned={isPinned}
        onMouseDown={() => {
          window.ipcRenderer?.send("window-drag-start");
        }}
        onMouseUp={() => {
          window.ipcRenderer?.send("window-drag-end");
        }}
      >
        <Box sx={{ display: "flex", gap: "0.5rem" }}>
          <IconButton
            size="small"
            onClick={handlePin}
            sx={{
              color: isPinned ? "#3b82f6" : "#fff",
              padding: "2px",
              WebkitAppRegion: "no-drag", // 按钮不可拖拽
            }}
          >
            <PushPinIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            sx={{
              color: "#fff",
              padding: "2px",
              WebkitAppRegion: "no-drag", // 按钮不可拖拽
            }}
          >
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Box>
        {/* <Typography variant="caption" sx={{ color: "#fff" }}>
          内容高亮工具
        </Typography> */}
        <Box sx={{ display: "flex", gap: "0.5rem" }}>
          <IconButton
            size="small"
            onClick={handleMinimize}
            sx={{
              color: "#fff",
              padding: "2px",
              WebkitAppRegion: "no-drag", // 按钮不可拖拽
            }}
          >
            <RemoveIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={handleMaximize}
            sx={{
              color: "#fff",
              padding: "2px",
              WebkitAppRegion: "no-drag", // 按钮不可拖拽
            }}
          >
            {isMaximized ? (
              <FilterNoneIcon fontSize="small" />
            ) : (
              <CropSquareIcon fontSize="small" />
            )}
          </IconButton>
          <IconButton
            size="small"
            onClick={handleClose}
            sx={{
              color: "#ef4444",
              padding: "2px",
              WebkitAppRegion: "no-drag", // 按钮不可拖拽
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </ControlBar>

      {/* 高亮组件 */}
      <TextHighlighter
        textContent={customClipBoardContent}
        items={highlightedKeywords}
        isVisibleContent={isWindowVisible && showContent}
        setVisibleContent={setIsWindowVisible}
        showContentPanel={showContent}
        showContent={showContent}
        onToggleContent={handleToggleContent}
      />
      {/* <RichTextEditor /> */}
    </div>
  );
};

export default App;
