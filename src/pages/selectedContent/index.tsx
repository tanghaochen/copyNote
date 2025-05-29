import React from "react";
import { useCommandPalette } from "@/hooks/useCommandPalette";
import CommandPalette from "@/components/commandPalette";
import { useWindowControl, useMainApp } from "./hooks";
import { WindowControlBar, TextHighlighter } from "./components";
import "./styles/index.scss";
import "@/components/richNote/styles/index.scss";

const App = () => {
  const windowControl = useWindowControl();
  const mainApp = useMainApp();

  // 使用命令面板hook
  const commandPalette = useCommandPalette({
    enabled: true,
    shortcut: "ctrl+o",
  });

  if (windowControl.isClosed) return null;

  return (
    <div
      className="noteHightLightRoot"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
      onMouseEnter={() => {
        window.ipcRenderer?.send("mouse-enter-window");
      }}
      onMouseLeave={(e) => {
        window.ipcRenderer?.send("mouse-leave-window");
        // 强制发送停止移动消息，确保isMoving重置为false
        window.ipcRenderer?.send("window-drag-end");
      }}
    >
      <WindowControlBar
        isPinned={windowControl.isPinned}
        isMaximized={windowControl.isMaximized}
        onPin={windowControl.handlePin}
        onMinimize={windowControl.handleMinimize}
        onMaximize={windowControl.handleMaximize}
        onClose={windowControl.handleClose}
      />

      {/* 高亮组件 */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <TextHighlighter
          textContent={mainApp.customClipBoardContent}
          items={mainApp.highlightedKeywords}
          isVisibleContent={mainApp.isWindowVisible && mainApp.showContent}
          setVisibleContent={mainApp.setIsWindowVisible}
          showContentPanel={mainApp.showContent}
          showContent={mainApp.showContent}
          onToggleContent={mainApp.handleToggleContent}
        />
      </div>

      {/* 命令面板组件 */}
      <CommandPalette
        open={commandPalette.isOpen}
        onClose={commandPalette.close}
        onSelectResult={mainApp.handleCommandPaletteSelect}
        selectedResult={mainApp.commandPaletteSelectedResult}
        onSelectedResultChange={mainApp.setCommandPaletteSelectedResult}
      />
    </div>
  );
};

export default App;
