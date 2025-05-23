import { app, ipcMain, BrowserWindow } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
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

  // 否则使用打包后的HTML文件路径
  return `file://${indexHtml}`;
}

// 为 app 扩展类型，添加 isQuitting 属性
declare global {
  namespace Electron {
    interface App {
      isQuitting?: boolean;
    }
  }
}

// 应用程序初始化
async function initApp() {
  // 创建服务实例
  const imageManager = new ImageManager();
  const dbManager = new DatabaseManager();
  const windowManager = new WindowManager(
    preload,
    getHtmlPath(), // 使用辅助函数获取HTML路径
    VITE_DEV_SERVER_URL,
  );
  const shortcutManager = new ShortcutManager(windowManager);
  const trayManager = new TrayManager();

  // 设置IPC处理程序
  setupIpcHandlers(imageManager, dbManager, windowManager);

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
  imageManager: ImageManager,
  dbManager: DatabaseManager,
  windowManager: WindowManager,
) {
  // 设置数据库IPC处理程序
  dbManager.setupIpcHandlers(ipcMain);

  // 设置图片下载IPC处理程序
  ipcMain.handle(
    "download-image",
    async (
      _,
      url,
      referer?: string,
      originalUrl?: string,
      isByteDance?: boolean,
    ) => {
      try {
        console.log("开始下载图片:", url);

        // 创建下载目录
        const downloadDir = path.join(
          app.getPath("userData"),
          "downloaded_images",
        );
        if (!fs.existsSync(downloadDir)) {
          fs.mkdirSync(downloadDir, { recursive: true });
        }

        // 生成唯一文件名，移除查询参数
        let fileName;
        if (url.startsWith("data:") || url.startsWith("blob:")) {
          fileName = `img_${Date.now()}_${Math.floor(
            Math.random() * 10000,
          )}.png`;
        } else {
          // 从URL中提取文件名，并移除查询参数
          const urlObj = new URL(url);
          const pathName = urlObj.pathname;
          const baseName = path.basename(pathName).split("?")[0];

          // 确保文件名有扩展名
          const ext = path.extname(baseName) || ".jpg";
          fileName = `img_${Date.now()}_${Math.floor(
            Math.random() * 10000,
          )}${ext}`;
        }

        const filePath = path.join(downloadDir, fileName);

        // 如果是data URL或blob URL
        if (url.startsWith("data:") || url.startsWith("blob:")) {
          const response = await fetch(url);
          const buffer = await response.arrayBuffer();
          fs.writeFileSync(filePath, Buffer.from(buffer));
          console.log("图片已保存到:", filePath);
          return filePath;
        }

        // 设置请求选项，包括referer
        const options: { headers: Record<string, string> } = {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
        };

        // 如果提供了referer，添加到请求头
        if (referer) {
          options.headers["Referer"] = referer;
          console.log("设置Referer:", referer);
        }

        // 如果提供了原始页面URL，添加到请求头
        if (originalUrl) {
          options.headers["Origin"] = new URL(originalUrl).origin;
          console.log("设置Origin:", options.headers["Origin"]);
        }

        // 对于字节跳动图片的特殊处理
        if (isByteDance) {
          console.log("检测到字节跳动图片，使用特殊处理");
          options.headers["Referer"] = "https://juejin.cn";
          options.headers["Origin"] = "https://juejin.cn";
          options.headers["Cookie"] = ""; // 可能需要添加特定的Cookie
          options.headers["Accept"] =
            "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8";
          options.headers["Accept-Language"] = "zh-CN,zh;q=0.9,en;q=0.8";
          options.headers["Sec-Fetch-Dest"] = "image";
          options.headers["Sec-Fetch-Mode"] = "no-cors";
          options.headers["Sec-Fetch-Site"] = "cross-site";
        }

        // 对于微信图片，特殊处理
        if (url.includes("mmbiz.qpic.cn") || url.includes("mmbiz.qlogo.cn")) {
          // 移除查询参数
          const cleanUrl = url.split("?")[0];
          url = cleanUrl;
          console.log("处理微信图片URL:", url);
        }

        // 下载图片
        const response = await fetch(url, options);

        if (!response.ok) {
          throw new Error(
            `图片下载失败: ${response.status} ${response.statusText}`,
          );
        }

        const buffer = await response.arrayBuffer();
        fs.writeFileSync(filePath, Buffer.from(buffer));

        console.log("图片已保存到:", filePath);
        return filePath;
      } catch (error) {
        console.error("下载图片失败:", error);
        throw error;
      }
    },
  );

  // 添加save-blob-image处理程序
  ipcMain.handle("save-blob-image", async (_, blob) => {
    try {
      console.log("开始保存Blob图片");

      // 创建下载目录
      const downloadDir = path.join(
        app.getPath("userData"),
        "downloaded_images",
      );
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
      }

      // 生成唯一文件名
      const fileName = `img_${Date.now()}_${Math.floor(
        Math.random() * 10000,
      )}.png`;
      const filePath = path.join(downloadDir, fileName);

      // 将blob数据写入文件
      const buffer = Buffer.from(await blob.arrayBuffer());
      fs.writeFileSync(filePath, buffer);

      console.log("Blob图片已保存到:", filePath);
      return filePath;
    } catch (error) {
      console.error("保存Blob图片失败:", error);
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

  // 添加处理关闭窗口的IPC处理程序
  ipcMain.on("close-window", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      win.close();
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
  app.on("before-quit", () => {
    // 标记应用正在退出，允许窗口关闭
    app.isQuitting = true;
    shortcutManager.unregisterAll();
    trayManager.destroyTray();
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
