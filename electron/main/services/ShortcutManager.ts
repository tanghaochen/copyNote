import { globalShortcut, clipboard, Clipboard } from "electron";
import { keyboard, Key } from "@nut-tree-fork/nut-js";

export class ShortcutManager {
  private windowManager: any;
  private lastClipboardContent: string = "";
  private clipboardCheckInterval: NodeJS.Timeout | null = null;

  constructor(windowManager: any) {
    this.windowManager = windowManager;
  }

  setupGlobalShortcuts() {
    const isResgist = globalShortcut.isRegistered("CommandOrControl+Shift+F1");
    const modifier = Key.LeftControl;

    if (!isResgist) {
      // 快捷键打开窗口
      globalShortcut.register("CommandOrControl+Space", async () => {
        const win2 = this.windowManager.getSecondaryWindow();
        if (win2 && !win2.isDestroyed()) {
          const clipboardContent = await this.getSelectedContent(clipboard);
          console.log("clipboardContent", clipboardContent);

          // 窗口可见性状态
          const isVisible = win2.isVisible();

          win2.webContents.send("clipboard-update", {
            event: "clipboard-update",
            text: clipboardContent.text,
            isVisible: isVisible,
            // 不再传递clipboardContent，因为它已经包含在text中了
          });

          if (!win2.isVisible()) {
            this.windowManager.showSecondaryWindowAtCursor();
          }
        } else {
          this.windowManager.showSecondaryWindowAtCursor();
        }
      });

      // 开始监听剪贴板变化
      this.startClipboardWatcher();
    }
  }

  // 开始监听剪贴板变化
  private startClipboardWatcher() {
    // 初始获取剪贴板内容
    this.lastClipboardContent = clipboard.readText() || "";

    // 记录上次剪贴板中的文件路径
    let lastFilePaths: string[] = [];

    // 设置定期检查剪贴板内容的间隔
    this.clipboardCheckInterval = setInterval(() => {
      // 检查文本内容
      const currentContent = clipboard.readText() || "";

      // 检查是否有文件内容
      const hasFilePaths = clipboard.has("FileNameW");
      const filePaths = hasFilePaths
        ? clipboard.readBuffer("FileNameW").toString()
        : "";
      const filePathList = filePaths
        ? this.parseFilePathsFromBuffer(filePaths)
        : [];

      // 判断是否有文件路径变化
      const filePathsChanged =
        JSON.stringify(filePathList) !== JSON.stringify(lastFilePaths) &&
        filePathList.length > 0;

      // 判断是否文本内容变化且非空
      const textChanged =
        currentContent !== this.lastClipboardContent &&
        currentContent.trim() !== "";

      // 如果文本内容变化
      if (textChanged) {
        this.lastClipboardContent = currentContent;
        this.handleClipboardChange(currentContent);
      }

      // 如果文件路径变化
      if (filePathsChanged) {
        lastFilePaths = [...filePathList];
        // 发送文件路径到窗口，不修改剪贴板内容
        this.handleFilePathsChange(filePathList);
      }
    }, 1000); // 每秒检查一次
  }

  // 解析剪贴板中的文件路径
  private parseFilePathsFromBuffer(buffer: string): string[] {
    try {
      // 去除空字符并按照字符串末尾的空字符分割
      const paths = buffer.split("\0").filter(Boolean);
      return paths;
    } catch (error) {
      console.error("解析文件路径失败:", error);
      return [];
    }
  }

  // 处理文件路径变化
  private async handleFilePathsChange(filePaths: string[]) {
    const win2 = this.windowManager.getSecondaryWindow();
    if (win2 && !win2.isDestroyed()) {
      // 窗口可见性状态
      const isVisible = win2.isVisible();

      win2.webContents.send("clipboard-update", {
        event: "clipboard-update",
        text: filePaths.join("\n"), // 将文件路径作为文本发送
        isFilePaths: true, // 标记这是文件路径
        filePaths: filePaths, // 同时发送原始文件路径数组
        isVisible: isVisible,
      });

      // 如果窗口不可见，则显示窗口
      if (!win2.isVisible()) {
        this.windowManager.showSecondaryWindowAtCursor();
      }
    } else {
      this.windowManager.showSecondaryWindowAtCursor();
    }
  }

  // 处理剪贴板内容变化
  private async handleClipboardChange(text: string) {
    const win2 = this.windowManager.getSecondaryWindow();
    if (win2 && !win2.isDestroyed()) {
      // 窗口可见性状态
      const isVisible = win2.isVisible();

      win2.webContents.send("clipboard-update", {
        event: "clipboard-update",
        text: text,
        isVisible: isVisible,
      });

      // 如果窗口不可见，则显示窗口
      if (!win2.isVisible()) {
        this.windowManager.showSecondaryWindowAtCursor();
      }
    } else {
      this.windowManager.showSecondaryWindowAtCursor();
    }
  }

  private async simulateCopy() {
    await keyboard.pressKey(Key.LeftControl, Key.C);
    await keyboard.releaseKey(Key.LeftControl, Key.C);
  }

  private getSelectedContent(clipboard: Clipboard) {
    return new Promise<{ text: string }>(async (resolve) => {
      clipboard.clear();
      await this.simulateCopy();
      setTimeout(() => {
        const text = clipboard.readText("clipboard") || "";
        resolve({
          text,
        });
      }, 0);
    });
  }

  unregisterAll() {
    globalShortcut.unregisterAll();

    // 清除剪贴板监听器
    if (this.clipboardCheckInterval) {
      clearInterval(this.clipboardCheckInterval);
      this.clipboardCheckInterval = null;
    }
  }
}
