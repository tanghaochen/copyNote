import { globalShortcut, clipboard, Clipboard } from "electron";
import { keyboard, Key } from "@nut-tree-fork/nut-js";

export class ShortcutManager {
  private windowManager: any;
  private lastClipboardContent: string = "";
  private clipboardCheckInterval: NodeJS.Timeout | null = null;

  constructor(windowManager: any) {
    this.windowManager = windowManager;
  }

  // 检查文本是否有效内容（不仅仅是空白字符或换行符）
  private hasValidContent(text: string): boolean {
    if (!text) return false;

    // 去除所有空白字符和换行符后，检查是否还有内容
    const contentWithoutWhitespace = text.replace(/[\s\r\n\t]/g, "");
    return contentWithoutWhitespace.length > 0;
  }

  setupGlobalShortcuts() {
    const isResgist = globalShortcut.isRegistered("CommandOrControl+Shift+F1");
    const modifier = Key.LeftControl;

    if (!isResgist) {
      // 快捷键打开窗口
      globalShortcut.register("CommandOrControl+Space", async () => {
        console.log("触发快捷键 CommandOrControl+Space");

        // 检查secondary窗口状态
        this.windowManager.checkSecondaryWindow();

        const win2 = this.windowManager.getSecondaryWindow();
        if (win2 && !win2.isDestroyed()) {
          const clipboardContent = await this.getSelectedContent(clipboard);
          console.log("clipboardContent", clipboardContent);

          // 检查剪贴板内容是否为空或只有空白字符
          if (!this.hasValidContent(clipboardContent.text)) {
            console.log(
              "剪贴板内容无效（可能只有空白字符或换行符），不显示窗口",
            );
            return;
          }

          // 窗口可见性状态
          const isVisible = win2.isVisible();
          console.log("窗口当前可见状态:", isVisible);

          win2.webContents.send("clipboard-update", {
            event: "clipboard-update",
            text: clipboardContent.text,
            isVisible: isVisible,
            // 不再传递clipboardContent，因为它已经包含在text中了
          });

          if (!win2.isVisible()) {
            console.log("窗口不可见，显示窗口");
            this.windowManager.showSecondaryWindowAtCursor(true);
          } else {
            console.log("窗口已可见，不需要再次显示");
          }
        } else {
          console.log("窗口不存在或已销毁，创建新窗口");
          // 创建新窗口前检查剪贴板内容
          const clipboardContent = await this.getSelectedContent(clipboard);
          if (!this.hasValidContent(clipboardContent.text)) {
            console.log("剪贴板内容无效，不创建新窗口");
            return;
          }
          this.windowManager.showSecondaryWindowAtCursor(true);
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

      // 如果内容改变且含有有效内容，则触发窗口显示
      if (
        currentContent !== this.lastClipboardContent &&
        this.hasValidContent(currentContent)
      ) {
        this.lastClipboardContent = currentContent;
        this.handleClipboardChange(currentContent);
      }
    }, 1000); // 每秒检查一次
  }

  // 处理剪贴板内容变化
  private async handleClipboardChange(text: string) {
    // 再次确认文本有效
    if (!this.hasValidContent(text)) {
      console.log("剪贴板变化内容无效，不触发窗口显示", text);
      return;
    }

    console.log(
      "检测到剪贴板内容变化:",
      text.substring(0, 20) + (text.length > 20 ? "..." : ""),
    );

    // 检查secondary窗口状态
    this.windowManager.checkSecondaryWindow();

    const win2 = this.windowManager.getSecondaryWindow();
    if (win2 && !win2.isDestroyed()) {
      // 窗口可见性状态
      const isVisible = win2.isVisible();
      console.log("窗口当前可见状态:", isVisible);

      // 先发送剪贴板更新事件，让前端组件决定是否显示窗口
      win2.webContents.send("clipboard-update", {
        event: "clipboard-update",
        text: text,
        isVisible: isVisible,
      });

      // 如果窗口不可见，则显示窗口（初始放在屏幕外）
      if (!win2.isVisible()) {
        console.log("窗口不可见，显示窗口");
        this.windowManager.showSecondaryWindowAtCursor(true);
      } else {
        console.log("窗口已可见，不需要再次显示");
      }
    } else {
      console.log("窗口不存在或已销毁，创建新窗口");
      this.windowManager.showSecondaryWindowAtCursor(true);
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
