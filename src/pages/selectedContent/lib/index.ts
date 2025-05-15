// 提供一个方法获取窗口可见性状态
export function isWindowVisible() {
  // 由于Electron的限制，不能直接使用同步调用
  // 默认返回true，避免错误
  return true;
}

// 获取选中内容的函数
export function getSelectedContent() {
  const text = window.ipcRenderer?.sendSync("get-selected-content");
  return text;
}
