import React, { useState } from "react";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { IconButton, Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CodeIcon from "@mui/icons-material/Code";
import CodeJumpDialog from "./CodeJumpDialog";

export const CodeJumpView: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleClick = async () => {
    const { editorType, filePath, lineNumber } = node.attrs;
    let command = "";

    switch (editorType) {
      case "vscode":
        command = `code -g "${filePath}:${lineNumber}"`;
        break;
      case "idea":
        command = `idea --line ${lineNumber} "${filePath}"`;
        break;
      case "cursor":
        command = `cursor --goto "${filePath}:${lineNumber}"`;
        break;
    }

    try {
      // 使用 invoke 方式调用主进程
      await window.electron.ipcRenderer.invoke("execute-command", command);
    } catch (error) {
      console.error("执行命令失败:", error);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  const handleDialogSubmit = (values: any) => {
    updateAttributes(values);
    setIsDialogOpen(false);
  };

  return (
    <NodeViewWrapper>
      <span
        className="code-jump-node"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "2px 6px",
          borderRadius: "4px",
          backgroundColor: "#f5f5f5",
          cursor: "pointer",
          position: "relative",
        }}
      >
        <CodeIcon sx={{ fontSize: 16, marginRight: 1 }} />
        <span>{node.attrs.displayName || node.attrs.filePath}</span>
        <span style={{ marginLeft: 4, color: "#666" }}>
          :{node.attrs.lineNumber}
        </span>

        {isHovered && (
          <Tooltip title="编辑">
            <IconButton
              size="small"
              onClick={handleEdit}
              sx={{
                position: "absolute",
                right: -30,
                top: "50%",
                transform: "translateY(-50%)",
                padding: "2px",
              }}
            >
              <EditIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}

        <CodeJumpDialog
          open={isDialogOpen}
          onClose={handleDialogClose}
          onSubmit={handleDialogSubmit}
          initialValues={node.attrs}
        />
      </span>
    </NodeViewWrapper>
  );
};
