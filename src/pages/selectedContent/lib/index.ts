import { useState } from "react";

// 提供一个方法获取窗口可见性状态
export function useVisibleControl() {
  const [isVisible, setIsVisible] = useState(false);

  const getWinVisible = async () => {
    try {
      const visible = await window.ipcRenderer?.invoke("is-window-visible");
      setIsVisible(!!visible);
    } catch (error) {
      console.error("获取窗口可见性失败:", error);
      // 默认为 true，确保用户体验
      setIsVisible(true);
    }
  };

  // 由于Electron的限制，不能直接使用同步调用
  // 默认返回true，避免错误
  return {
    isVisible,
    getWinVisible,
  };
}
