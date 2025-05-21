import React, { useState } from "react";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { IconButton, Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CodeJumpDialog from "./CodeJumpDialog";

export const CodeJumpView: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  getPos,
  editor,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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

    window.electronAPI.send("execute-command", command);
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
    <NodeViewWrapper as="span" className="code-jump-view">
      <span
        className="code-jump-node"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          position: "relative",
          margin: "0 2px",
          userSelect: "none",
        }}
      >
        <span
          onClick={handleClick}
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "1px 4px",
            borderRadius: "3px",
            backgroundColor: isHovered ? "#e8e8e8" : "#f5f5f5",
            cursor: "pointer",
            fontSize: "0.9em",
            lineHeight: "1.4",
            border: "1px solid #e0e0e0",
            transition: "all 0.2s ease",
            position: "relative",
          }}
        >
          <img
            src={`/statics/${node.attrs.editorType}.png`}
            alt={node.attrs.editorType}
            style={{ width: 14, height: 14, marginRight: 4 }}
          />
          <span>{node.attrs.displayName || node.attrs.filePath}</span>
          <span style={{ marginLeft: 2, color: "#666" }}>
            :{node.attrs.lineNumber}
          </span>
          {isHovered && (
            <Tooltip title="编辑">
              <IconButton
                size="small"
                onClick={handleEdit}
                sx={{
                  position: "absolute",
                  right: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  padding: "2px",
                  backgroundColor: "#fff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  "&:hover": {
                    backgroundColor: "#f0f0f0",
                  },
                  width: 20,
                  height: 20,
                }}
              >
                <EditIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          )}
        </span>

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
