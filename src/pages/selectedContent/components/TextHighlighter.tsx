import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { Editor } from "@tiptap/react";
import {
  ImperativePanelGroupHandle,
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import { IconButton } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import TocOutlinedIcon from "@mui/icons-material/TocOutlined";
import ListIcon from "@mui/icons-material/List";

import RichTextEditor from "@/components/richNote";
import DocumentOutline from "@/components/documentOutline";
import { HighlightProps } from "../types";
import { useTextHighlight } from "../hooks/useTextHighlight";
import { getNoteContentById } from "../services/noteService";
import { sanitizeHtml } from "../utils/textUtils";
import { MainContentContainer } from "./StyledComponents";
import KeywordsList from "./KeywordsList";
import { useWindowControl } from "../hooks/useWindowControl";

const TextHighlighter: React.FC<HighlightProps> = ({
  textContent,
  items = [],
  isVisibleContent = true,
  setVisibleContent = () => {},
  showContentPanel = true,
  showContent = false,
  onToggleContent = () => {},
}) => {
  const contentPreviewRef = useRef<HTMLDivElement>(null);
  const [noteContent, setNoteContent] = useState(""); // 笔记内容
  const [activeNoteId, setActiveNoteId] = useState<number | null>(null);
  const [activeKeyword, setActiveKeyword] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState<boolean>(false);
  const keywordsContainerRef = useRef<HTMLDivElement>(null);
  const [activeRichTextEditor, setActiveRichTextEditor] =
    useState<Editor | null>(null);
  const editorInstanceRef = useRef<Editor | null>(null);
  const [showOutline, setShowOutline] = useState(true);

  const { highlightedText, foundKeywords, titleToIdMap } = useTextHighlight(
    textContent,
    items,
  );

  // 使用统一的窗口控制
  const { moveWindowToCursor } = useWindowControl();

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
    if (activeRichTextEditor) {
      editorInstanceRef.current = activeRichTextEditor;
    }
  }, [activeRichTextEditor]);

  // 处理点击关键词的函数
  const handleChipClick = async (keyword: string) => {
    setActiveKeyword(keyword);
    setShowPanel(true);
    setVisibleContent(true);

    console.log("点击关键词，调整窗口大小");
    window.ipcRenderer?.send("resize-window", { width: 940, height: 550 });

    const id = titleToIdMap.get(keyword);
    if (!id) return;

    try {
      const noteItem = await getNoteContentById(Number(id));
      setNoteContent(sanitizeHtml(noteItem));
      setActiveNoteId(id);

      setTimeout(() => {
        focusEditor();

        const editorDOM = document.querySelector(".ProseMirror");
        if (editorDOM) {
          console.log("找到编辑器DOM，模拟点击");
          try {
            editorDOM.dispatchEvent(
              new MouseEvent("click", {
                view: window,
                bubbles: true,
                cancelable: true,
              }),
            );

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
    }, 100);
  }, []);

  // 监听noteContent变化以尝试聚焦编辑器
  useEffect(() => {
    if (noteContent) {
      console.log("内容已更新，稍后尝试聚焦编辑器");
      const timer = setTimeout(() => {
        focusEditor();
        focusEditorWithDOM();

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
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [noteContent, focusEditor, focusEditorWithDOM]);

  useEffect(() => {
    console.log(textContent, items);
    setShowPanel(false);

    const handler = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("highlight")) {
        const id = target.dataset.id;
        if (!id) return;

        const highlightText = target.textContent?.replace(/[{}[\]]/g, "") || "";
        setActiveKeyword(highlightText);
        setShowPanel(true);

        console.log("点击高亮词，调整窗口大小");
        window.ipcRenderer?.send("resize-window", { width: 940, height: 550 });

        try {
          const noteItem = await getNoteContentById(Number(id));
          setNoteContent(sanitizeHtml(noteItem));
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

  useEffect(() => {
    console.log("检测到关键词变化，数量:", foundKeywords.length);

    if (foundKeywords.length > 0) {
      console.log("关键词已计算完成且找到匹配项，通知主进程移动窗口到鼠标位置");
      moveWindowToCursor("检测到关键词变化");
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        console.log("检测到ESC键，关闭窗口");
        window.ipcRenderer?.send("close-window");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [foundKeywords, moveWindowToCursor]);

  const displayKeywords = useMemo(() => {
    return foundKeywords.length > 0 ? foundKeywords : foundKeywords;
  }, [foundKeywords]);

  useEffect(() => {
    if (displayKeywords.length > 0) {
      console.log("关键词已计算完成，通知主进程移动窗口到鼠标位置");

      moveWindowToCursor("关键词计算完成");
    }
  }, [displayKeywords, moveWindowToCursor]);

  const handleToggleOutline = useCallback(() => {
    setShowOutline(!showOutline);
    console.log("切换目录显示状态:", !showOutline);
  }, [showOutline]);

  return (
    <div
      className="highlighter-container"
      style={{ display: "flex", flexDirection: "column", height: "100%" }}
    >
      <MainContentContainer>
        <KeywordsList
          keywords={displayKeywords}
          activeKeyword={activeKeyword}
          onKeywordClick={handleChipClick}
        />

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
                        backgroundColor: showContent
                          ? "#E7E9E8"
                          : "transparent",
                      }}
                      title={showContent ? "隐藏获取内容" : "显示获取内容"}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      id="outline-toggle-button"
                      size="small"
                      onClick={handleToggleOutline}
                      sx={{
                        color: "#666",
                        padding: "2px",
                        backgroundColor: showOutline
                          ? "#E7E9E8"
                          : "transparent",
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
              {foundKeywords.length > 0 ? (
                <RichTextEditor
                  setActiveRichTextEditor={updateEditorRef}
                  tabItem={{ content: noteContent, value: activeNoteId }}
                  isShowHeading={false}
                />
              ) : (
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
      </MainContentContainer>
    </div>
  );
};

export default TextHighlighter;
