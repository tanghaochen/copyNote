import React from "react";
import { IconButton, Box } from "@mui/material";
import PushPinIcon from "@mui/icons-material/PushPin";
import CloseIcon from "@mui/icons-material/Close";
import SettingsIcon from "@mui/icons-material/Settings";
import RemoveIcon from "@mui/icons-material/Remove";
import CropSquareIcon from "@mui/icons-material/CropSquare";
import FilterNoneIcon from "@mui/icons-material/FilterNone";
import { ControlBar } from "./StyledComponents";

interface WindowControlBarProps {
  isPinned: boolean;
  isMaximized: boolean;
  onPin: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
}

const WindowControlBar: React.FC<WindowControlBarProps> = ({
  isPinned,
  isMaximized,
  onPin,
  onMinimize,
  onMaximize,
  onClose,
}) => {
  return (
    <ControlBar
      isPinned={isPinned}
      onMouseDown={() => {
        window.ipcRenderer?.send("window-drag-start");
      }}
      onMouseUp={() => {
        window.ipcRenderer?.send("window-drag-end");
      }}
    >
      <Box sx={{ display: "flex", gap: "0.5rem" }}>
        <IconButton
          size="small"
          onClick={onPin}
          sx={{
            color: isPinned ? "#3b82f6" : "#fff",
            padding: "2px",
            WebkitAppRegion: "no-drag", // 按钮不可拖拽
          }}
        >
          <PushPinIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          sx={{
            color: "#fff",
            padding: "2px",
            WebkitAppRegion: "no-drag", // 按钮不可拖拽
          }}
        >
          <SettingsIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ display: "flex", gap: "0.5rem" }}>
        <IconButton
          size="small"
          onClick={onMinimize}
          sx={{
            color: "#fff",
            padding: "2px",
            WebkitAppRegion: "no-drag", // 按钮不可拖拽
          }}
        >
          <RemoveIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={onMaximize}
          sx={{
            color: "#fff",
            padding: "2px",
            WebkitAppRegion: "no-drag", // 按钮不可拖拽
          }}
        >
          {isMaximized ? (
            <FilterNoneIcon fontSize="small" />
          ) : (
            <CropSquareIcon fontSize="small" />
          )}
        </IconButton>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{
            color: "#ef4444",
            padding: "2px",
            WebkitAppRegion: "no-drag", // 按钮不可拖拽
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    </ControlBar>
  );
};

export default WindowControlBar;
