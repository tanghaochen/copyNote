import React from "react";
import { Menu, MenuItem, Divider } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface ContextMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onCloseAll: () => void;
  onCloseOthers: () => void;
  onCloseRight: () => void;
  hasOtherTabs: boolean;
  hasRightTabs: boolean;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  anchorEl,
  open,
  onClose,
  onCloseAll,
  onCloseOthers,
  onCloseRight,
  hasOtherTabs,
  hasRightTabs,
}) => {
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      className="tab-context-menu"
      transformOrigin={{
        vertical: "top",
        horizontal: "left",
      }}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "left",
      }}
      PaperProps={{
        sx: {
          minWidth: 150,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          border: "1px solid #e0e0e0",
        },
      }}
    >
      <MenuItem
        onClick={() => {
          onCloseAll();
          onClose();
        }}
        sx={{
          fontSize: "14px",
          padding: "8px 16px",
          "&:hover": {
            backgroundColor: "#f5f5f5",
          },
        }}
      >
        关闭所有
      </MenuItem>

      <MenuItem
        onClick={() => {
          onCloseOthers();
          onClose();
        }}
        disabled={!hasOtherTabs}
        sx={{
          fontSize: "14px",
          padding: "8px 16px",
          "&:hover": {
            backgroundColor: "#f5f5f5",
          },
        }}
      >
        关闭其他
      </MenuItem>

      <MenuItem
        onClick={() => {
          onCloseRight();
          onClose();
        }}
        disabled={!hasRightTabs}
        sx={{
          fontSize: "14px",
          padding: "8px 16px",
          "&:hover": {
            backgroundColor: "#f5f5f5",
          },
        }}
      >
        关闭右边全部
      </MenuItem>
    </Menu>
  );
};

export default ContextMenu;
