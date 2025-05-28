import { useEffect, useState, useRef } from "react";
import NoteContent from "./components/noteContent";
import NoteContentOutline from "./components/noteContentOutline";
import NoteOutlineTree from "./components/noteOutlineTagTree";
import WordsBar from "@/components/wordsBar";
import { IconButton, ListSubheader } from "@mui/material";
import Button from "@mui/material/Button";
import "@/assets/globalStyles.scss";
import ComplextTree from "@/components/complexTree";
import DocumentOutline from "@/components/documentOutline";
import UpdateNotification from "./components/UpdateNotification";
import CommandPalette from "./components/commandPalette";
import { useCommandPalette } from "@/hooks/useCommandPalette";
import { noteContentDB } from "@/database/noteContentDB";

// 类型定义
interface WorksListItem {
  id: number;
  title: string;
  sort_order: number;
  tags_id: number;
}

interface TreeItemData {
  index: string;
  isFolder: boolean;
  children: string[];
  label: string;
  parent_id?: number;
  sort_order?: number;
  data?: any;
}

interface SelectedResult {
  id: number;
  title: string;
  content?: string;
  type: "vocabulary" | "tag" | "article";
  category?: string;
  tags_id?: number;
  timestamp: number;
}

function App() {
  // 点击标签树
  const [selectedTag, setSelectedTag] = useState<TreeItemData | null>(null);
  // 被点击词库列表worksBar, 打开词库笔记
  const [worksItem, setWorksItem] = useState<WorksListItem | null>(null);
  // 词库列表数据
  const [worksList, setWorksList] = useState<WorksListItem[]>([]);
  const [currentEditor, setCurrentEditor] = useState(null);
  const [currentTab, setCurrentTab] = useState(null);
  const [activeRichTextEditor, setActiveRichTextEditor] = useState(null);
  const richTextEditorEleRef = useRef(null);

  // 命令面板选中结果状态
  const [commandPaletteSelectedResult, setCommandPaletteSelectedResult] =
    useState<SelectedResult | null>(null);

  // 使用命令面板hook
  const commandPalette = useCommandPalette({
    enabled: true,
    shortcut: "ctrl+o",
  });

  // 应用启动时初始化纯文本内容
  useEffect(() => {
    const initializePlainText = async () => {
      try {
        console.log("开始为现有笔记生成纯文本内容...");
        const updatedCount =
          await noteContentDB.generatePlainTextForExistingNotes();
        if (updatedCount > 0) {
          console.log(`已为 ${updatedCount} 个笔记生成纯文本内容`);
        }
      } catch (error) {
        console.error("生成纯文本内容失败:", error);
      }
    };

    initializePlainText();
  }, []); // 只在组件挂载时执行一次

  // 处理命令面板选择结果变化
  useEffect(() => {
    if (commandPaletteSelectedResult) {
      console.log("命令面板选中结果变化:", commandPaletteSelectedResult);

      switch (commandPaletteSelectedResult.type) {
        case "vocabulary":
          // 处理词库选择 - 打开对应的词库笔记
          console.log("打开词库:", commandPaletteSelectedResult);
          const vocabularyItem: WorksListItem = {
            id: commandPaletteSelectedResult.id,
            title: commandPaletteSelectedResult.title,
            sort_order: 0,
            tags_id: commandPaletteSelectedResult.tags_id || 0,
          };
          setWorksItem(vocabularyItem);
          break;

        case "tag":
          // 处理标签选择 - 打开对应的标签
          console.log("打开标签:", commandPaletteSelectedResult);
          if (commandPaletteSelectedResult.tags_id) {
            const tagItem: TreeItemData = {
              index: commandPaletteSelectedResult.tags_id.toString(),
              isFolder: true,
              children: [],
              label: commandPaletteSelectedResult.title,
              parent_id: commandPaletteSelectedResult.tags_id,
              data: {
                id: commandPaletteSelectedResult.tags_id,
                name: commandPaletteSelectedResult.title,
              },
            };
            setSelectedTag(tagItem);
          }
          break;

        case "article":
          // 处理文章选择 - 打开对应的文章
          console.log("打开文章:", commandPaletteSelectedResult);
          const articleItem: WorksListItem = {
            id: commandPaletteSelectedResult.id,
            title: commandPaletteSelectedResult.title,
            sort_order: 0,
            tags_id: 0,
          };
          setWorksItem(articleItem);
          break;

        default:
          break;
      }
    }
  }, [commandPaletteSelectedResult]);

  // 处理命令面板选择结果 (保持向后兼容)
  const handleCommandPaletteSelect = (result: any) => {
    console.log("命令面板选择结果 (旧方式):", result);
  };

  return (
    <div className="App w-full flex-1 flex h-full absolute top-0 left-0 bottom-0">
      <div className="flex">
        {/*<NoteOutlineTree></NoteOutlineTree>*/}
        <div className="w-80 border-0 border-r-2 border-solid border-r-gray-300">
          <ComplextTree
            onSelectedTagChange={setSelectedTag}
            setWorksItem={setWorksItem}
          />
        </div>
        <div className="w-80 border-0 border-r-2 border-solid border-r-gray-300">
          <WordsBar
            selectedTagItem={selectedTag} // 当前选中的标签, 打开词库列表
            worksItem={worksItem} // 当前选中的词库, 打开词库笔记
            setWorksItem={setWorksItem} // 设置当前选中的词库
            worksList={worksList} // 词库列表
            setWorksList={setWorksList} // 设置词库列表
          />
        </div>
      </div>
      {/* 笔记内容 */}
      <NoteContentOutline
        worksItem={worksItem} // 当前选中的词库, 打开词库笔记
        setWorksItem={setWorksItem} // 设置当前选中的词库
        setWorksList={setWorksList} // 设置词库列表
        setCurrentEditor={setCurrentEditor} // 设置当前编辑器
        setCurrentTab={setCurrentTab} // 设置当前标签
        setActiveRichTextEditor={setActiveRichTextEditor} // 设置当前富文本编辑器
      ></NoteContentOutline>
      <div className="tableOfContents w-96 h-full bg-gray-50 border-0 border-l-2 border-solid border-l-gray-300 overflow-clip">
        {/* 文档大纲 */}
        <DocumentOutline
          editor={activeRichTextEditor}
          activeTabsItem={currentTab}
          richTextEditorEleRef={richTextEditorEleRef}
        />
      </div>
      <CommandPalette
        open={commandPalette.isOpen}
        onClose={commandPalette.close}
        onSelectResult={handleCommandPaletteSelect}
        selectedResult={commandPaletteSelectedResult}
        onSelectedResultChange={setCommandPaletteSelectedResult}
      />
      {/* 更新通知组件 */}
      {/* <UpdateNotification /> */}
    </div>
  );
}

export default App;
