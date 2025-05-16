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

    // 设置定期检查剪贴板内容的间隔
    this.clipboardCheckInterval = setInterval(() => {
      const currentContent = clipboard.readText() || "";

      // 如果内容改变且不为空，则触发窗口显示
      if (
        currentContent !== this.lastClipboardContent &&
        currentContent.trim() !== ""
      ) {
        this.lastClipboardContent = currentContent;
        this.handleClipboardChange(currentContent);
      }
    }, 1000); // 每秒检查一次
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
