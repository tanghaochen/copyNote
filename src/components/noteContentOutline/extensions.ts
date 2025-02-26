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

const lowlight = createLowlight(all);
lowlight.register("html", html);
lowlight.register("css", css);
lowlight.register("js", js);
lowlight.register("ts", ts);

export const extensions = [
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
