import { app, Tray, Menu, nativeImage, BrowserWindow } from "electron";
import path from "node:path";

export class TrayManager {
  private tray: Tray | null = null;

  constructor() {}

  /**
   * 初始化系统托盘
   * @param iconPath 托盘图标路径
   * @param mainWindow 主窗口引用
   */
  public createTray(iconPath: string, mainWindow?: BrowserWindow): void {
    try {
      // 创建托盘图标
      const icon = nativeImage.createFromPath(iconPath);
      this.tray = new Tray(icon);

      // 设置托盘菜单
      const contextMenu = Menu.buildFromTemplate([
        {
          label: "显示/隐藏窗口",
          click: () => {
            if (mainWindow) {
              if (mainWindow.isVisible()) {
                mainWindow.hide();
              } else {
                mainWindow.show();
                mainWindow.focus();
              }
            }
          },
        },
        { type: "separator" },
        {
          label: "退出",
          click: () => {
            // 强制退出应用
            this.forceQuitApp();
          },
        },
      ]);

      // 设置托盘属性
      this.tray.setToolTip("Electron应用");
      this.tray.setContextMenu(contextMenu);

      // 点击托盘图标时显示/隐藏主窗口
      if (mainWindow) {
        this.tray.on("click", () => {
          if (mainWindow.isVisible()) {
            mainWindow.hide();
          } else {
            mainWindow.show();
            mainWindow.focus();
          }
        });
      }

      console.log("系统托盘创建成功");
    } catch (error) {
      console.error("创建系统托盘时出错:", error);
    }
  }

  /**
   * 销毁托盘
   */
  public destroyTray(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }

  private forceQuitApp(): void {
    // 实现强制退出应用的逻辑
    console.log("强制退出应用");

    try {
      // 设置退出标志，防止窗口关闭被阻止
      (app as any).isQuitting = true;

      // 强制关闭所有窗口
      const allWindows = BrowserWindow.getAllWindows();
      allWindows.forEach((window) => {
        window.destroy();
      });

      // 销毁托盘
      this.destroyTray();

      // 尝试正常退出
      app.quit();

      // 如果正常退出失败，强制退出进程
      setTimeout(() => {
        console.log("强制退出进程");
        process.exit(0);
      }, 1000);
    } catch (error) {
      console.error("退出时发生错误:", error);
      // 如果发生错误，直接强制退出
      process.exit(1);
    }
  }
}
