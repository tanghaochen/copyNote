import { useState, useEffect, useCallback } from "react";
import { useExpendedDebugInfo, useIsExpended } from "./useIsExpended";

export const useWindowControl = () => {
  const [isPinned, setIsPinned] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isWindowVisible, setIsWindowVisible] = useState(false);

  const handlePin = useCallback(() => {
    setIsPinned(!isPinned);
    console.log("设置窗口固定状态:", !isPinned);
    window.ipcRenderer?.send("pin-window", !isPinned);
  }, [isPinned]);

  const handleClose = useCallback(() => {
    console.log("关闭窗口按钮被点击");
    window.ipcRenderer?.send("close-window");
    setIsClosed(true);
  }, []);

  const handleMinimize = useCallback(() => {
    window.ipcRenderer?.send("minimize-window");
  }, []);

  const handleMaximize = useCallback(() => {
    window.ipcRenderer?.send("maximize-window");
    setIsMaximized(!isMaximized);
  }, [isMaximized]);

  const resizeWindow = useCallback((width: number, height: number) => {
    console.log("调整窗口大小:", { width, height });
    window.ipcRenderer?.send("resize-window", { width, height });
  }, []);

  const isExpended = useIsExpended();
  const debugInfo = useExpendedDebugInfo();

  // 统一的窗口移动到鼠标位置管理函数
  const moveWindowToCursor = useCallback(
    (reason?: string) => {
      console.log("请求移动窗口到鼠标位置", reason ? `原因: ${reason}` : "");
      console.log("目录按钮完全显示状态:", debugInfo.isFullyVisible);

      // 只有当目录按钮没有完全显示时才允许移动窗口
      if (!debugInfo.isFullyVisible) {
        console.log("目录按钮未完全显示，执行窗口移动");
        window.ipcRenderer?.send("move-window-to-cursor");
      } else {
        console.log("目录按钮已完全显示，跳过窗口移动");
      }
    },
    [debugInfo.isFullyVisible],
  );

  // 监听窗口最大化/还原状态变化
  useEffect(() => {
    const handleMaximizeChange = (_: any, maximized: boolean) => {
      setIsMaximized(maximized);
    };

    window.ipcRenderer?.on("maximize-change", handleMaximizeChange);

    return () => {
      window.ipcRenderer?.off?.("maximize-change", handleMaximizeChange);
    };
  }, []);

  return {
    isPinned,
    isClosed,
    isMaximized,
    isWindowVisible,
    setIsWindowVisible,
    handlePin,
    handleClose,
    handleMinimize,
    handleMaximize,
    resizeWindow,
    moveWindowToCursor,
  };
};
