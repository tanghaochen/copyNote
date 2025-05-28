// 词库列表项类型
export interface WorksListItem {
  id: number;
  title: string;
  sort_order: number;
  tags_id: number;
}

// 树形组件数据类型
export interface TreeItemData {
  index: string;
  isFolder: boolean;
  children: string[];
  label: string;
  parent_id?: number;
  sort_order?: number;
  data?: any;
}

// 搜索结果类型
export interface SearchResult {
  id: number;
  title: string;
  content?: string;
  type: "vocabulary" | "tag" | "article";
  category?: string;
  tags_id?: number;
}

// 选中结果类型（带时间戳）
export interface SelectedResult extends SearchResult {
  timestamp: number;
}
