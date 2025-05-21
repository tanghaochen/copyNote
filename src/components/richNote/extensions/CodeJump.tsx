import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { CodeJumpView } from "../subComponents/codeJump/CodeJumpView";

export interface CodeJumpOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    codeJump: {
      setCodeJump: (attributes: {
        editorType: "cursor" | "vscode" | "idea";
        filePath: string;
        displayName: string;
        lineNumber: number;
      }) => ReturnType;
    };
  }
}

export const CodeJump = Node.create<CodeJumpOptions>({
  name: "codeJump",

  group: "inline",

  inline: true,

  atom: false,

  addAttributes() {
    return {
      editorType: {
        default: "vscode",
      },
      filePath: {
        default: "",
      },
      displayName: {
        default: "",
      },
      lineNumber: {
        default: 1,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="code-jump"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "code-jump",
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CodeJumpView);
  },

  addCommands() {
    return {
      setCodeJump:
        (attributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          });
        },
    };
  },
});
