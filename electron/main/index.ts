import { app, ipcMain, BrowserWindow } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import { exec } from "child_process";
import {
  installExtension,
  REDUX_DEVTOOLS,
  REACT_DEVELOPER_TOOLS,
} from "electron-devtools-installer";

import { ImageManager } from "./services/ImageManager";
import { DatabaseManager } from "./services/DatabaseManager";
import { WindowManager } from "./services/WindowManager";
import { ShortcutManager } from "./services/ShortcutManager";
import { TrayManager } from "./services/TrayManager";
import { update } from "./update";
import { ResourceManager } from "./services/ResourceManager";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 环境配置
process.env.APP_ROOT = path.join(__dirname, "../..");

export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith("6.1")) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

// 预加载脚本和HTML文件路径
const preload = path.join(__dirname, "../preload/index.mjs");
const indexHtml = path.join(RENDERER_DIST, "index.html");

// 添加一个辅助函数来获取正确的HTML路径
function getHtmlPath() {
  // 如果是开发环境，使用开发服务器URL
  if (VITE_DEV_SERVER_URL) {
    return VITE_DEV_SERVER_URL;
  }

  // 生产环境使用file协议路径，确保路径是正确的，适用于HashRouter
  const url = `file://${indexHtml}`;
  console.log("生产环境加载路径:", url);
  return url;
}

// 为 app 扩展类型，添加 isQuitting 属性
declare global {
  namespace Electron {
    interface App {
      isQuitting?: boolean;
      isDestroyed?: () => boolean;
    }
  }
}

// 初始化app.isQuitting属性
// app.isQuitting = false; // 移除这行

// 应用程序初始化
async function initApp() {
  // 安全地设置app.isQuitting属性
  app.isQuitting = false;

  // 创建服务实例
  const resourceManager = new ResourceManager();
  const dbManager = new DatabaseManager();
  const windowManager = new WindowManager(
    preload,
    getHtmlPath(),
    VITE_DEV_SERVER_URL,
  );
  const shortcutManager = new ShortcutManager(windowManager);
  const trayManager = new TrayManager();

  // 设置IPC处理程序
  setupIpcHandlers(resourceManager, dbManager, windowManager);

  // 创建主窗口
  await windowManager.createMainWindow();
  const mainWindow = windowManager.getMainWindow();

  // 设置全局快捷键
  shortcutManager.setupGlobalShortcuts();

  // 创建系统托盘
  const iconPath = path.join(process.env.VITE_PUBLIC, "favicon.ico");
  if (mainWindow) {
    trayManager.createTray(iconPath, mainWindow);

    // 修改窗口关闭行为，点击关闭时隐藏窗口而不是退出应用
    mainWindow.on("close", (event) => {
      if (!app.isQuitting) {
        event.preventDefault();
        mainWindow.hide();
        return false;
      }
      return true;
    });
  } else {
    trayManager.createTray(iconPath);
  }

  // 设置应用程序事件
  setupAppEvents(windowManager, shortcutManager, trayManager);

  // 安装开发工具扩展
  if (VITE_DEV_SERVER_URL) {
    installDevExtensions();
  }
}

// 设置IPC处理程序
function setupIpcHandlers(
  resourceManager: ResourceManager,
  dbManager: DatabaseManager,
  windowManager: WindowManager,
) {
  // 设置数据库IPC处理程序
  dbManager.setupIpcHandlers(ipcMain);

  // 添加执行命令的IPC处理程序
  ipcMain.on("execute-command", (event, command) => {
    console.log("执行命令:", command);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`执行命令出错: ${error}`);
        return;
      }
      if (stderr) {
        console.error(`命令错误输出: ${stderr}`);
        return;
      }
      console.log(`命令输出: ${stdout}`);
    });
  });

  // 设置图片保存IPC处理程序
  ipcMain.handle(
    "save-network-image",
    async (_, url, referer?: string, originalUrl?: string) => {
      try {
        return await resourceManager.saveNetworkImage(
          url,
          referer,
          originalUrl,
        );
      } catch (error) {
        console.error("保存网络图片失败:", error);
        throw error;
      }
    },
  );

  // 添加save-base64-image处理程序
  ipcMain.handle("save-base64-image", async (_, base64Data) => {
    try {
      return await resourceManager.saveBase64Image(base64Data);
    } catch (error) {
      console.error("保存Base64图片失败:", error);
      throw error;
    }
  });

  // 处理新窗口
  ipcMain.handle("open-win", (_, arg) => {
    return windowManager.createChildWindow(arg);
  });

  // 添加处理固定窗口的IPC处理程序
  ipcMain.on("pin-window", (_, isPinned) => {
    const secondaryWindow = windowManager.getSecondaryWindow();
    if (secondaryWindow && !secondaryWindow.isDestroyed()) {
      // 将消息转发到窗口的webContents
      secondaryWindow.webContents.send("pin-window", isPinned);
    }
  });

  // 添加处理最小化窗口的IPC处理程序
  ipcMain.on("minimize-window", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      win.minimize();
    }
  });

  // 添加处理最大化/还原窗口的IPC处理程序
  ipcMain.on("maximize-window", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      if (win.isMaximized()) {
        win.unmaximize();
        // 通知渲染进程窗口已还原
        win.webContents.send("maximize-change", false);
      } else {
        win.maximize();
        // 通知渲染进程窗口已最大化
        win.webContents.send("maximize-change", true);
      }
    }
  });

  // 添加处理窗口可见性查询的IPC处理程序
  ipcMain.handle("is-window-visible", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      return win.isVisible();
    }
    return false;
  });

  // 添加处理获取窗口大小的IPC处理程序
  ipcMain.handle("get-window-size", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      // 从窗口中获取用户调整过的大小信息
      const size = win.getSize();

      // 使用安全的方式获取自定义属性
      const customData = (win as any).customData || {};
      const userHasResized = customData.userHasResized || false;
      const customSize = customData.customSize || {
        width: size[0],
        height: size[1],
      };

      return {
        size,
        userHasResized,
        customSize,
      };
    }
    return {
      size: [0, 0],
      userHasResized: false,
      customSize: { width: 940, height: 550 },
    };
  });

  // 添加处理关闭窗口的IPC处理程序
  ipcMain.on("close-window", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      win.close();
    }
  });

  // 添加处理将窗口移动到鼠标位置的IPC处理程序
  ipcMain.on("move-window-to-cursor", () => {
    console.log("收到移动窗口到鼠标位置的请求");
    try {
      windowManager.moveSecondaryWindowToCursor();
    } catch (error) {
      console.error("移动窗口到鼠标位置失败:", error);
    }
  });

  // 添加处理鼠标进入窗口的IPC处理程序
  ipcMain.on("mouse-enter-window", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      // 消息将由WindowManager中的ipc-message事件处理
      // 这里可以添加额外的处理逻辑
      console.log("主进程收到鼠标进入窗口事件");
    }
  });

  // 添加处理鼠标离开窗口的IPC处理程序
  ipcMain.on("mouse-leave-window", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      // 消息将由WindowManager中的ipc-message事件处理
      // 这里可以添加额外的处理逻辑
      console.log("主进程收到鼠标离开窗口事件");
    }
  });

  // 添加处理显示窗口的IPC处理程序
  ipcMain.on("show-window", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      console.log("主进程收到显示窗口事件");
      // 显示窗口但不聚焦
      win.showInactive();
    }
  });
}

// 设置应用程序事件
function setupAppEvents(
  windowManager: WindowManager,
  shortcutManager: ShortcutManager,
  trayManager: TrayManager,
) {
  app.on("window-all-closed", () => {
    // 如果不是Mac平台，不做任何事情
    // 现在由托盘控制退出
    if (process.platform !== "darwin") {
      // 不调用app.quit()，让托盘管理应用退出
    }
  });

  app.on("second-instance", () => {
    const mainWindow = windowManager.getMainWindow();
    if (mainWindow) {
      // Focus on the main window if the user tried to open another
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.on("activate", () => {
    const mainWindow = windowManager.getMainWindow();
    if (mainWindow === null) windowManager.createMainWindow();
  });

  // 在关闭应用程序时释放资源
  app.on("before-quit", (event) => {
    console.log("应用正在退出，清理资源...");

    try {
      // 标记应用正在退出，允许窗口关闭
      app.isQuitting = true;

      // 强制关闭所有窗口
      const allWindows = BrowserWindow.getAllWindows();
      allWindows.forEach((window) => {
        if (window && !window.isDestroyed()) {
          window.destroy();
        }
      });

      // 清理资源
      shortcutManager.unregisterAll();
      trayManager.destroyTray();

      console.log("资源清理完成");
    } catch (error) {
      console.error("清理资源时发生错误:", error);
    }
  });

  // 为所有创建的窗口添加最大化和还原事件监听
  app.on("browser-window-created", (_, window) => {
    window.on("maximize", () => {
      window.webContents.send("maximize-change", true);
    });

    window.on("unmaximize", () => {
      window.webContents.send("maximize-change", false);
    });
  });
}

// 安装开发工具扩展
function installDevExtensions() {
  installExtension(REACT_DEVELOPER_TOOLS)
    .then((ext) => console.log(`已添加扩展: ${ext.name}`))
    .catch((err) => console.log("发生错误: ", err));

  installExtension(REDUX_DEVTOOLS)
    .then((name) => console.log(`已添加扩展: ${name}`))
    .catch((err) => console.log("发生错误: ", err));
}

// 启动应用
app
  .whenReady()
  .then(initApp)
  .then(() => {
    // 获取主窗口并启用更新功能
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      update(mainWindow);
    }
  });

// 在创建窗口的代码中添加测试环境的处理
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.mjs"),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // 根据环境加载不同的URL
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    console.log("Loading from dev server:", process.env.VITE_DEV_SERVER_URL);
  } else if (process.env.NODE_ENV === "test") {
    // 测试环境特殊处理
    const testUrl = `file://${path.join(__dirname, "../../dist/index.html")}`;
    console.log("Loading test URL:", testUrl);
    win.loadURL(testUrl);
  } else {
    // 生产环境
    const distPath = path.join(__dirname, "../../dist/index.html");
    win.loadFile(distPath);
  }

  return win;
}
