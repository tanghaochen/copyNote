import { Color } from "@tiptap/extension-color";
import ListItem from "@tiptap/extension-list-item";
import TextStyle from "@tiptap/extension-text-style";
import { EditorProvider, useCurrentEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React from "react";
import Button from "@mui/material/Button";
import "material-symbols";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import ListItemText from "@mui/material/ListItemText";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Image from "@tiptap/extension-image";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Highlight from "@tiptap/extension-highlight";
import {
  paragraphTList,
  extTypeList,
  colors,
  listTypeList,
  textAlignTypeList,
} from "./constants";
import { Divide } from "lucide-react";
import Divider from "@mui/material/Divider";
import Blockquote from "@tiptap/extension-blockquote";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import css from "highlight.js/lib/languages/css";
import js from "highlight.js/lib/languages/javascript";
import ts from "highlight.js/lib/languages/typescript";
import html from "highlight.js/lib/languages/xml";
import { all, createLowlight } from "lowlight";
import HightlightComp from "@/components/richNote/subComponents/highlight";
import Text from "@tiptap/extension-text";
import Typography from "@tiptap/extension-typography";
import TextAlign from "@tiptap/extension-text-align";
import HeadingAndParaBody from "@/components/richNote/subComponents/headingAndParaBody";
import Italic from "@tiptap/extension-italic";
import TpTable from "@/components/richNote/subComponents/tpTable";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import ImageResize from "@/components/richNote/tpExtenstions/imgResize";
import "./styles/tpMenuBar.scss";

const lowlight = createLowlight(all);
lowlight.register("html", html);
lowlight.register("css", css);
lowlight.register("js", js);
lowlight.register("ts", ts);

const MenuBar = ({ editor }: { editor: Editor }) => {
  // const { editor } = useCurrentEditor();

  // if (!editor) {
  //   return null;
  // }

  const CommonBtn = (props) => {
    const {
      extType = "bold",
      toggleFunName,
      iconName,
      disabled: externalDisabled = false,
    } = props;
    const toggleFun =
      toggleFunName || `toggle${extType[0].toUpperCase()}${extType.slice(1)}`;

    return (
      <Button
        color="#000000"
        size="small"
        style={{
          backgroundColor: editor?.isActive(extType) ? "#E7E9E8" : "",
          height: "100%",
        }}
        onClick={() => editor?.chain().focus()[toggleFun]?.().run()}
      >
        <span className="material-symbols-outlined">
          {iconName || `format_${extType}`}
        </span>
      </Button>
    );
  };

  return (
    <div className="control-group">
      <div className="button-group inline-flex justify-start align-middle overflow-auto">
        {/*ChromePicker,CompactPicker,GithubPicker, HuePicker, HuePicker,PhotoshopPicker,SketchPicker*/}
        <HeadingAndParaBody editor={editor} />

        <Divider orientation="vertical" variant="middle" flexItem />

        {extTypeList.map((item, index) => {
          return <CommonBtn key={index} {...item} />;
        })}

        <Divider orientation="vertical" variant="middle" flexItem />

        <HightlightComp editor={editor} />

        <Divider orientation="vertical" variant="middle" flexItem />

        {listTypeList.map((item, index) => {
          return <CommonBtn key={index} {...item} />;
        })}
        <Divider orientation="vertical" variant="middle" flexItem />
        {textAlignTypeList.map((item, index) => {
          return <CommonBtn key={index} {...item} />;
        })}

        <Divider orientation="vertical" variant="middle" flexItem />

        <TpTable editor={editor} />
        {/* <button onClick={() => editor.chain().focus().setHardBreak().run()}>
          Hard break
        </button> */}
        {/*<button*/}
        {/*    onClick={() => editor.chain().focus().undo().run()}*/}
        {/*    disabled={!editor.can().chain().focus().undo().run()}*/}
        {/*>*/}
        {/*    Undo*/}
        {/*</button>*/}
        {/*<button*/}
        {/*    onClick={() => editor.chain().focus().redo().run()}*/}
        {/*    disabled={!editor.can().chain().focus().redo().run()}*/}
        {/*>*/}
        {/*    Redo*/}
        {/*</button>*/}
      </div>
    </div>
  );
};
//
const extensions = [
  StarterKit.configure({}),
  Color.configure({ types: [TextStyle.name, ListItem.name] }),
  TextStyle.configure({ types: [ListItem.name] }),
  Highlight.configure({ multicolor: true }),
  ImageResize,
  Image.configure({ allowBase64: true }),
  Italic,
  Blockquote.configure({
    HTMLAttributes: {
      class: "my-custom-class",
    },
  }),
  Typography,
  ListItem.configure({
    HTMLAttributes: {
      class: "my-custom-class",
    },
  }),
  CodeBlockLowlight.configure({
    lowlight,
  }),
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
  TaskList,
  Text,
  TaskItem.configure({}),
  Table.configure({
    resizable: true,
  }),
  TableRow,
  TableHeader,
  TableCell,
];

const defContent = `
<h2>
  Hi there,
</h2>
`;
export default ({
  content,
  onUpdate,
  value,
  editorRef,
}: {
  content: string;
  onUpdate: (editor: Editor) => void;
  value: string;
  editorRef: React.RefObject<any>;
}) => {
  if (!content) content = defContent;
  return (
    <EditorProvider
      // slotBefore={<MenuBar />}
      key={value} // 强制重新初始化
      extensions={extensions}
      content={content}
      onUpdate={onUpdate}
    ></EditorProvider>
  );
};
