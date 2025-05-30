import { useState, useEffect, useCallback } from "react";
import { IpcRendererEvent } from "electron";
import DOMPurify from "dompurify";
import { HighlightItem, SelectedResult, SearchResult } from "../types";
import { getWorksList, getNoteContentById } from "../services/noteService";
import { cleanClipboardText } from "../utils/textUtils";

export const useMainApp = () => {
  const [customClipBoardContent, setCustomClipBoardContent] = useState("");
  const [showContent, setShowContent] = useState(false);
  const [highlightedKeywords, setHighlightedKeywords] = useState<
    HighlightItem[]
  >([
    { id: 1, title: "Java" },
    { id: 2, title: "Python" },
    { id: 6, title: "编程" },
    { id: 7, title: "言" },
    { id: 8, title: "语言" },
    { id: 6, title: "编程语言" },
    { id: 3, title: "JavaScript" },
    { id: 4, title: "Spring" },
    { id: 5, title: "log" },
  ]);
  const [commandPaletteSelectedResult, setCommandPaletteSelectedResult] =
    useState<SelectedResult | null>(null);
  const [isWindowVisible, setIsWindowVisible] = useState(false);

  // 切换获取内容显示状态
  const handleToggleContent = useCallback(() => {
    setShowContent(!showContent);
    console.log("切换获取内容显示状态:", !showContent);
  }, [showContent]);

  const handleClipboardUpdate = useCallback(
    (event: IpcRendererEvent, text: string) => {
      console.log("handleClipboardUpdate:", event, text);
      if (!text) {
        console.warn("handleClipboardUpdate: text 是空的");
        return;
      }

      const cleanText = cleanClipboardText(text);
      setCustomClipBoardContent(cleanText);
    },
    [],
  );

  // 获取词库列表
  const loadWorksList = useCallback(async () => {
    try {
      const allMetadata = await getWorksList();
      console.log("获取词库列表", allMetadata);
      setHighlightedKeywords(allMetadata);
      return allMetadata;
    } catch (error) {
      console.error("获取词库列表失败:", error);
      return [];
    }
  }, []);

  // 处理命令面板选择结果变化
  useEffect(() => {
    if (commandPaletteSelectedResult) {
      console.log("命令面板选中结果变化:", commandPaletteSelectedResult);

      switch (commandPaletteSelectedResult.type) {
        case "vocabulary":
          // 处理词库选择
          console.log("打开词库:", commandPaletteSelectedResult);
          const loadVocabularyContent = async () => {
            try {
              const noteItem = await getNoteContentById(
                commandPaletteSelectedResult.id,
              );
              setCustomClipBoardContent(
                `📚 ${
                  commandPaletteSelectedResult.title
                }\n\n${DOMPurify.sanitize(noteItem)}`,
              );
              console.log("命令面板选择词库，调整窗口大小");

              setIsWindowVisible(true);
            } catch (error) {
              console.error("获取词库内容失败:", error);
              setCustomClipBoardContent(
                `❌ 获取词库内容失败: ${commandPaletteSelectedResult.title}`,
              );
            }
          };
          loadVocabularyContent();
          break;

        case "article":
          // 处理文章选择
          console.log("打开文章:", commandPaletteSelectedResult);
          const loadArticleContent = async () => {
            try {
              const noteItem = await getNoteContentById(
                commandPaletteSelectedResult.id,
              );
              setCustomClipBoardContent(
                `📄 ${
                  commandPaletteSelectedResult.title
                }\n\n${DOMPurify.sanitize(noteItem)}`,
              );

              setIsWindowVisible(true);
            } catch (error) {
              console.error("获取文章内容失败:", error);
              setCustomClipBoardContent(
                `❌ 获取文章内容失败: ${commandPaletteSelectedResult.title}`,
              );
            }
          };
          loadArticleContent();
          break;

        default:
          break;
      }
    }
  }, [commandPaletteSelectedResult]);

  // 处理命令面板选择结果 (保持向后兼容)
  const handleCommandPaletteSelect = useCallback((result: SearchResult) => {
    console.log("命令面板选择结果 (旧方式):", result);
  }, []);

  useEffect(() => {
    loadWorksList();

    // 监听剪贴板更新
    window.ipcRenderer?.on("clipboard-update", async (event: any) => {
      console.log("收到剪贴板更新事件:", event);

      const { text, isVisible } = event;

      console.log("窗口可见性(从事件中):", isVisible);
      setIsWindowVisible(!!isVisible);

      loadWorksList();

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
  }, [handleClipboardUpdate, isWindowVisible, loadWorksList]);

  return {
    customClipBoardContent,
    showContent,
    highlightedKeywords,
    commandPaletteSelectedResult,
    setCommandPaletteSelectedResult,
    isWindowVisible,
    setIsWindowVisible,
    handleToggleContent,
    handleCommandPaletteSelect,
  };
};
