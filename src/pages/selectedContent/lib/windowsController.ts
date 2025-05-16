export class WindowsController {
  private static instance: WindowsController;
  private constructor() {}
  // 控制内容是否显示
  private isVisibleContentPanel = false;

  public static getInstance(): WindowsController {
    if (!WindowsController.instance) {
      WindowsController.instance = new WindowsController();
    }
    return WindowsController.instance;
  }

  public isWindowVisible(): boolean {
    return window.ipcRenderer?.sendSync("is-window-visible") ?? false;
  }

  public resizeWindow(width: number, height: number) {
    window.ipcRenderer?.send("resize-window", width, height);
  }

  public closeWindow() {
    window.ipcRenderer?.send("close-window");
  }
}
