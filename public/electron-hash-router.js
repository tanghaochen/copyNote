/**
 * 用于修复 Electron 应用中的哈希路由路径问题
 * 在主窗口加载时自动注入到渲染进程
 */

(function () {
  // 检测是否在 Electron 环境中运行
  if (window && window.process && window.process.type === "renderer") {
    console.log("在 Electron 环境中运行，修复哈希路由路径");

    // 监听DOMContentLoaded事件，确保在文档加载后执行
    document.addEventListener("DOMContentLoaded", function () {
      // 如果当前URL包含完整文件路径但不包含#，则重定向到正确的路径
      const currentUrl = window.location.href;
      const urlObj = new URL(currentUrl);

      // 检查是否是file协议且不包含哈希（#）
      if (
        urlObj.protocol === "file:" &&
        !urlObj.hash &&
        urlObj.pathname.endsWith(".html")
      ) {
        console.log("检测到没有哈希的文件路径URL，重定向到根路径");
        // 重定向到根路径
        window.location.href = urlObj.href + "#/";
      }
    });

    console.log("哈希路由路径修复完成");
  }
})();
