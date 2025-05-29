import { Editor } from "@tiptap/react";

export interface HighlightItem {
  id: number;
  title: string;
}

export interface HighlightProps {
  textContent: string;
  items?: HighlightItem[];
  isVisibleContent?: boolean;
  setVisibleContent?: (visible: boolean) => void;
  showContentPanel?: boolean;
  showContent?: boolean;
  onToggleContent?: () => void;
}

// 基础搜索结果类型
export interface SearchResult {
  id: number;
  title: string;
  content?: string;
  type: "vocabulary" | "tag" | "article";
  category?: string;
  tags_id?: number;
}

// 选中结果类型，包含时间戳确保状态变化被监听
export interface SelectedResult extends SearchResult {
  timestamp: number;
}
