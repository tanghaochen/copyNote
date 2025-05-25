import { contextBridge, ipcRenderer } from "electron";
import * as path from "path";
import * as fs from "fs";

// 安全地暴露选定的 IPC 功能给渲染进程
contextBridge.exposeInMainWorld("electronAPI", {
  // 发送消息到主进程
  send: (channel: string, data: any) => {
    ipcRenderer.send(channel, data);
  },

  // 调用主进程方法并等待结果
  invoke: (channel: string, ...args: any[]) => {
    return ipcRenderer.invoke(channel, ...args);
  },

  // 监听主进程消息
  receive: (channel: string, func: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (_, ...args) => func(...args));
  },

  // 监听一次性消息
  receiveOnce: (channel: string, func: (...args: any[]) => void) => {
    ipcRenderer.once(channel, (_, ...args) => func(...args));
  },

  // 移除特定频道上的所有监听器
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },
});

// 加载自定义脚本以修复路径问题
window.addEventListener("DOMContentLoaded", () => {
  try {
    // 判断是否在生产环境
    const isProduction = !window.location.href.includes("localhost");

    if (isProduction) {
      // 注入自定义脚本以修复哈希路由
      const scriptTag = document.createElement("script");
      scriptTag.src = "./electron-hash-router.js"; // 使用相对路径
      scriptTag.type = "text/javascript";
      document.head.appendChild(scriptTag);

      // 注入已有的资源路径修复脚本
      const viteScriptTag = document.createElement("script");
      viteScriptTag.src = "./electron-vite.js"; // 使用相对路径
      viteScriptTag.type = "text/javascript";
      document.head.appendChild(viteScriptTag);

      console.log("已注入自定义修复脚本");
    }
  } catch (error) {
    console.error("注入自定义脚本失败:", error);
  }
});

// --------- 以下是加载动画代码 ---------
function domReady(
  condition: DocumentReadyState[] = ["complete", "interactive"],
) {
  return new Promise((resolve) => {
    if (condition.includes(document.readyState)) {
      resolve(true);
    } else {
      document.addEventListener("readystatechange", () => {
        if (condition.includes(document.readyState)) {
          resolve(true);
        }
      });
    }
  });
}

const safeDOM = {
  append(parent: HTMLElement, child: HTMLElement) {
    if (!Array.from(parent.children).find((e) => e === child)) {
      return parent.appendChild(child);
    }
  },
  remove(parent: HTMLElement, child: HTMLElement) {
    if (Array.from(parent.children).find((e) => e === child)) {
      return parent.removeChild(child);
    }
  },
};

/**
 * https://tobiasahlin.com/spinkit
 * https://connoratherton.com/loaders
 * https://projects.lukehaas.me/css-loaders
 * https://matejkustec.github.io/SpinThatShit
 */
function useLoading() {
  const className = `loaders-css__square-spin`;
  const styleContent = `
@keyframes square-spin {
  25% { transform: perspective(100px) rotateX(180deg) rotateY(0); }
  50% { transform: perspective(100px) rotateX(180deg) rotateY(180deg); }
  75% { transform: perspective(100px) rotateX(0) rotateY(180deg); }
  100% { transform: perspective(100px) rotateX(0) rotateY(0); }
}
.${className} > div {
  animation-fill-mode: both;
  width: 50px;
  height: 50px;
  background: #fff;
  animation: square-spin 3s 0s cubic-bezier(0.09, 0.57, 0.49, 0.9) infinite;
}
.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #282c34;
  z-index: 9;
}
    `;
  const oStyle = document.createElement("style");
  const oDiv = document.createElement("div");

  oStyle.id = "app-loading-style";
  oStyle.innerHTML = styleContent;
  oDiv.className = "app-loading-wrap";
  oDiv.innerHTML = `<div class="${className}"><div></div></div>`;

  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle);
      safeDOM.append(document.body, oDiv);
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle);
      safeDOM.remove(document.body, oDiv);
    },
  };
}

// ----------------------------------------------------------------------

const { appendLoading, removeLoading } = useLoading();
domReady().then(appendLoading);

window.onmessage = (ev) => {
  ev.data.payload === "removeLoading" && removeLoading();
};

setTimeout(removeLoading, 4999);
