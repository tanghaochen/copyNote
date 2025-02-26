import { Color } from "@tiptap/extension-color";
import ListItem from "@tiptap/extension-list-item";
import TextStyle from "@tiptap/extension-text-style";
import { EditorProvider, useCurrentEditor, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React, { useCallback } from "react";
import Button from "@mui/material/Button";
import "material-symbols";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import ListItemText from "@mui/material/ListItemText";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import HightlightComp from "@/components/richNote/subComponents/highlight";
import Image from "@tiptap/extension-image";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Highlight from "@tiptap/extension-highlight";
import { Divide } from "lucide-react";
import Blockquote from "@tiptap/extension-blockquote";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import css from "highlight.js/lib/languages/css";
import js from "highlight.js/lib/languages/javascript";
import ts from "highlight.js/lib/languages/typescript";
import html from "highlight.js/lib/languages/xml";
import { all, createLowlight } from "lowlight";
import Text from "@tiptap/extension-text";
import Typography from "@tiptap/extension-typography";
import TextAlign from "@tiptap/extension-text-align";
import Italic from "@tiptap/extension-italic";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import ImageResize from "@/components/richNote/tpExtenstions/imgResize";
import {
  paragraphTList,
  extTypeList,
  colors,
  listTypeList,
  textAlignTypeList,
} from "@/components/richNote/constants";
import Divider from "@mui/material/Divider";
import HeadingAndParaBody from "@/components/richNote/subComponents/headingAndParaBody";
import TpTable from "@/components/richNote/subComponents/tpTable";
import { Component } from "@react-buddy/ide-toolbox";

const lowlight = createLowlight(all);
lowlight.register("html", html);
lowlight.register("css", css);
lowlight.register("js", js);
lowlight.register("ts", ts);
export default function TpMenu(props: { editor: HTMLDivElement | null }) {
  const { editor } = props;
  console.log("TpMenu", props);
  //   if (!editor) {
  //     return null;
  //   }

  // 普通的富文本功能按钮
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
    <div className="control-group w-full">
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
}
