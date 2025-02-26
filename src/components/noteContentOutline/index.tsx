import * as React from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import MenuBar from "../richNote/subComponents/tpMenu";
import { extensions } from "./extensions";
import {
  EditorProvider,
  useCurrentEditor,
  useEditor,
  EditorContent,
} from "@tiptap/react";
import { Editor } from "@tiptap/react";
import "@/components/richNote/styles/index.scss";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

export default function BasicTabs() {
  // 定义标签页数据
  const [tabs, setTabs] = React.useState([
    { id: 0, label: "Item One", content: "<h2>Initial Content 1</h2>" },
    {
      id: 1,
      label: "Item Two",
      content:
        "<h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2> <h2>Hi there,</h2>",
    },
    { id: 2, label: "Item Three", content: "<h2>Initial Content 3</h2>" },
  ]);

  const [value, setValue] = React.useState(0);
  const tpEditorRef = React.useRef<Editor | null>(null);

  // 处理标签切换
  const handleChange = async (
    event: React.SyntheticEvent,
    newValue: number,
  ) => {
    // 保存当前内容
    if (tpEditorRef.current) {
      const currentContent = tpEditorRef.current.getHTML();
      setTabs((prev) =>
        prev.map((tab, index) =>
          index === value ? { ...tab, content: currentContent } : tab,
        ),
      );
    }
    setValue(newValue);
  };

  const [editorRef, setEditorRef] = React.useState<Editor | null>(null);

  let editor = useEditor({
    editable: true,
    extensions,
    content: "<h2>Initial Content 1</h2>",
  });
  //

  setTimeout(() => {
    setEditorRef(editor);
  }, 0);

  // 初始化编辑器内容
  React.useEffect(() => {
    if (editorRef) {
      editorRef.commands.setContent(tabs[value].content);
    }
  }, [value, tabs]);

  const handleRichContent = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="sticky top-0 left-0">
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={value} onChange={handleChange}>
            {tabs.map((tab, index) => (
              <Tab key={tab.id} label={tab.label} {...a11yProps(index)} />
            ))}
          </Tabs>
        </Box>

        <MenuBar editor={editorRef} />
      </div>

      <Box sx={{ flex: 1, position: "relative" }} ref={tpEditorRef}>
        <div
          className="richNoteContent absolute top-0 left-0 right-0 bottom-0"
          onClick={handleRichContent}
        >
          {tabs.map((tab, index) => (
            <EditorContent
              className="h-full"
              key={index}
              value={value}
              editor={editorRef}
            />
          ))}
        </div>
      </Box>
    </Box>
  );
}
