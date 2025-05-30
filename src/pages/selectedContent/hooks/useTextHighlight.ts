import { useState, useMemo, useCallback, useEffect } from "react";
import { HighlightItem } from "../types";
import { escapeHtml, escapeRegExp, sanitizeHtml } from "../utils/textUtils";

export const useTextHighlight = (
  textContent: string,
  items: HighlightItem[],
) => {
  const [highlightedText, setHighlightedText] = useState(textContent);
  const [foundKeywords, setFoundKeywords] = useState<string[]>([]);

  const sortedItems = useMemo(() => {
    console.log("sortedItems", items);
    return [...items].sort((a, b) => b.title.length - a.title.length);
  }, [items]);

  const titleToIdMap = useMemo(() => {
    const map = new Map<string, number>();
    sortedItems.forEach((item) => map.set(item.title, item.id));
    return map;
  }, [sortedItems]);

  // 创建从title到originalTitle的映射
  const titleToOriginalTitleMap = useMemo(() => {
    const map = new Map<string, string>();
    sortedItems.forEach((item) => {
      map.set(item.title, item.originalTitle);
    });
    return map;
  }, [sortedItems]);

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

        // 获取原始标题用于显示
        const originalTitle = titleToOriginalTitleMap.get(title) || title;

        // 添加到找到的关键词列表（使用原始标题，避免重复添加）
        if (!foundWords.includes(originalTitle)) {
          foundWords.push(originalTitle);
        }

        return id !== undefined
          ? `<mark class="highlight" data-id="${id}">${match}</mark>`
          : match;
      });

      // 更新找到的关键词
      setFoundKeywords(foundWords);

      // 使用DOMPurify清理最终HTML，防止XSS攻击
      setHighlightedText(sanitizeHtml(newText));
    } catch (error) {
      console.error("高亮出错:", error);
      // 出错时至少显示原始文本（经过HTML转义）
      setHighlightedText(escapeHtml(textContent));
      setFoundKeywords([]);
    }
  }, [sortedItems, textContent, titleToIdMap, titleToOriginalTitleMap]);

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

  return {
    highlightedText,
    foundKeywords,
    titleToIdMap,
  };
};
