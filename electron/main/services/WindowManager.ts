import { BrowserWindow, screen, session, shell } from "electron";
import path from "path";
// 修改导入方式，处理CommonJS和ESM兼容性问题
// import lodash from "lodash";
// const { throttle } = lodash;

export class WindowManager {
  private win: BrowserWindow | null = null;
  private win2: BrowserWindow | undefined = undefined;
  private preload: string;
  private indexHtml: string;
  private viteDevServerUrl: string | undefined;

  constructor(preload: string, indexHtml: string, viteDevServerUrl?: string) {
    this.preload = preload;
    this.indexHtml = indexHtml;
    this.viteDevServerUrl = viteDevServerUrl;
  }

  async createMainWindow() {
    // 获取所有显示器
    const displays = screen.getAllDisplays();
    // 获取主显示器
    const primaryDisplay = screen.getPrimaryDisplay();
    // 获取主显示器之外的第一个显示器（如果存在）
    const externalDisplay = displays.find(
      (display) => display.id !== primaryDisplay.id,
    );

    // 窗口配置
    this.win = new BrowserWindow({
      title: "Main window",
      icon: path.join(process.env.VITE_PUBLIC, "favicon.ico"),
      // 如果有外部显示器，则在外部显示器上显示
      x: externalDisplay ? externalDisplay.bounds.x + 50 : 850,
      y: externalDisplay ? externalDisplay.bounds.y + 50 : 500,
      width: externalDisplay ? externalDisplay.bounds.width - 100 : 1200,
      height: externalDisplay ? externalDisplay.bounds.height - 100 : 800,
      autoHideMenuBar: true,
      // 取消置顶
      alwaysOnTop: false,
      webPreferences: {
        devTools: true,
        preload: this.preload,
        sandbox: true,
        webSecurity: false,
        experimentalFeatures: true,
      },
    });

    // 如果有外部显示器，设置全屏
    if (externalDisplay) {
      console.log("检测到外部显示器，设置窗口在外部显示器上");
      console.log("外部显示器信息:", externalDisplay.bounds);

      // 先移动窗口到外部显示器
      this.win.setBounds({
        x: externalDisplay.bounds.x,
        y: externalDisplay.bounds.y,
        width: externalDisplay.bounds.width,
        height: externalDisplay.bounds.height,
      });

      // 然后设置全屏
      // setTimeout(() => {
      //   this.win.setFullScreen(true);
      // }, 500);
    }

    if (this.viteDevServerUrl) {
      this.win.loadURL(this.viteDevServerUrl);
      this.win.webContents.openDevTools();
    } else {
      // 检查路径格式，如果是带有协议的URL则使用loadURL，否则使用loadFile
      if (this.indexHtml.startsWith("file://")) {
        this.win.loadURL(this.indexHtml);
      } else {
        this.win.loadFile(this.indexHtml);
      }
    }

    // 加载扩展
    session.defaultSession
      .loadExtension(
        "C:/Users/tang/AppData/Local/Microsoft/Edge/User Data/Default/Extensions/gpphkfbcpidddadnkolkpfckpihlkkil/6.1.1_0",
        {
          allowFileAccess: true,
        },
      )
      .then((rest) => {
        console.log(JSON.stringify(rest));
      });

    // 打开开发者工具
    this.win.webContents.openDevTools();

    // this.win.webContents.on("did-finish-load", () => {
    //   this.win?.webContents.send(
    //     "main-process-message",
    //     new Date().toLocaleString(),
    //   );
    // });

    // 设置链接处理
    this.win.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith("https:")) shell.openExternal(url);
      return { action: "deny" };
    });

    // 创建第二个窗口
    this.setupSecondaryWindow();

    return this.win;
  }

  private setupSecondaryWindow() {
    // 窗口创建在鼠标位置，支持跨屏
    setInterval(() => {
      if (this.win2) return;
      const globelMousePoint = screen.getCursorScreenPoint();
      this.win2 = new BrowserWindow({
        title: "Dashboard",
        frame: false,
        transparent: true,
        backgroundColor: "white", // 完全透明的背景色
        hasShadow: true, // 启用窗口阴影
        autoHideMenuBar: true,
        width: 940,
        height: 550,
        show: false,
        alwaysOnTop: true,
        webPreferences: {
          preload: this.preload,
          webSecurity: false, // 允许加载本地资源
          nodeIntegration: true,
        },
      });

      // 添加鼠标离开窗口的检测
      let mouseLeaveTimeout: NodeJS.Timeout | null = null;
      let noMouseEnterTimeout: NodeJS.Timeout | null = null; // 新增：鼠标未进入自动关闭计时器
      let isPinned = false;
      let isMouseInWindow = false; // 新增：跟踪鼠标是否在窗口内
      let isMoving = false; // 新增：跟踪窗口是否正在移动
      let windowShowTime: number = 0; // 新增：记录窗口显示时间

      // 将isPinned作为窗口的属性保存
      (this.win2 as any).isPinned = isPinned;

      // 监听窗口开始移动事件
      this.win2.on("will-move", () => {
        isMoving = true;
        console.log("窗口开始移动");
        // 窗口移动时清除自动关闭计时器
        if (mouseLeaveTimeout) {
          clearTimeout(mouseLeaveTimeout);
          mouseLeaveTimeout = null;
        }
      });

      // 监听窗口大小调整事件
      this.win2.on("resize", () => {
        console.log("窗口大小正在调整");
        // 窗口调整大小时也清除自动关闭计时器
        if (mouseLeaveTimeout) {
          clearTimeout(mouseLeaveTimeout);
          mouseLeaveTimeout = null;
        }
      });

      // 监听窗口调整大小结束事件
      this.win2.on("resized", () => {
        console.log("窗口大小调整结束");

        // 立即将isMoving设置为false，确保状态及时更新
        isMoving = false;
        console.log("重置isMoving状态为false");

        // 如果窗口未被固定且鼠标不在窗口内，立即设置自动关闭计时器
        if (!isPinned && !isMouseInWindow) {
          console.log("调整大小结束，立即设置自动关闭计时器");
          setAutoCloseTimer();
        }
      });

      // 监听窗口持续移动事件
      this.win2.on("move", () => {
        // 窗口正在移动中，确保状态为移动中
        isMoving = true;
        // 确保移动过程中不会自动关闭
        if (mouseLeaveTimeout) {
          clearTimeout(mouseLeaveTimeout);
          mouseLeaveTimeout = null;
        }
      });

      // 监听窗口移动结束事件
      this.win2.on("moved", () => {
        console.log("窗口移动结束");

        // 立即将isMoving设置为false，确保状态及时更新
        isMoving = false;
        console.log("重置isMoving状态为false");

        // 如果窗口未被固定且鼠标不在窗口内，立即设置自动关闭计时器
        if (!isPinned && !isMouseInWindow) {
          console.log("移动结束，立即设置自动关闭计时器");
          setAutoCloseTimer();
        }
      });

      // 查询win2窗口是否存在或显示，监听消息查询
      this.win2.webContents.on("ipc-message", (event, channel, ...args) => {
        if (channel === "is-window-visible") {
          // 同步返回窗口可见性状态
          if (this.win2 && !this.win2.isDestroyed()) {
            event.returnValue = this.win2.isVisible();
          } else {
            event.returnValue = false;
          }
        }
      });

      // 设置自动关闭定时器
      const setAutoCloseTimer = () => {
        if (mouseLeaveTimeout) {
          clearTimeout(mouseLeaveTimeout);
          mouseLeaveTimeout = null;
        }

        // 如果窗口未被固定且鼠标不在窗口内，且窗口不在移动中，设置定时器
        if (!isPinned && !isMouseInWindow && !isMoving) {
          console.log("设置自动关闭计时器");
          mouseLeaveTimeout = setTimeout(() => {
            if (this.win2 && !this.win2.isDestroyed()) {
              this.win2.hide();
              console.log("自动关闭win2窗口");
            }
          }, 3000);
        } else {
          console.log(
            "不设置自动关闭计时器，isPinned:",
            isPinned,
            "isMouseInWindow:",
            isMouseInWindow,
            "isMoving:",
            isMoving,
          );
        }
      };

      // 监听从渲染进程发来的固定窗口消息
      this.win2.webContents.on("ipc-message", (event, channel, ...args) => {
        if (channel === "pin-window") {
          isPinned = args[0];
          // 更新isPinned属性
          if (this.win2) {
            (this.win2 as any).isPinned = isPinned;
          }
          console.log("窗口固定状态更改为:", isPinned);

          // 更新固定状态后立即处理定时器
          if (isPinned) {
            // 如果固定了窗口，清除现有的定时器
            if (mouseLeaveTimeout) {
              clearTimeout(mouseLeaveTimeout);
              mouseLeaveTimeout = null;
            }
            if (noMouseEnterTimeout) {
              clearTimeout(noMouseEnterTimeout);
              noMouseEnterTimeout = null;
            }
          } else {
            // 如果取消固定，立即设置新的定时器（只有当鼠标不在窗口内时）
            if (!isMouseInWindow) {
              setAutoCloseTimer();
            }
          }
        } else if (channel === "resize-window") {
          // 处理窗口大小调整请求
          const { width, height } = args[0];
          // 使用原始方式设置窗口大小
          if (this.win2 && !this.win2.isDestroyed()) {
            console.log("调整窗口大小为:", width, height);
            this.win2.setSize(width, height);
          }
        } else if (channel === "is-window-visible") {
          // 同步返回窗口可见性状态
          if (this.win2 && !this.win2.isDestroyed()) {
            event.returnValue = this.win2.isVisible();
          } else {
            event.returnValue = false;
          }
        } else if (channel === "close-window") {
          // 处理关闭窗口请求 - 直接执行，不使用节流
          console.log("收到关闭窗口请求");
          if (this.win2 && !this.win2.isDestroyed()) {
            this.win2.hide();
          }
        } else if (channel === "auto-close-check") {
          // 检查并设置自动关闭定时器（只有当鼠标不在窗口内时）
          if (!isPinned && !isMouseInWindow) {
            setAutoCloseTimer();
          }
        } else if (channel === "mouse-enter-window") {
          // 处理鼠标进入窗口的消息
          isMouseInWindow = true;
          console.log("鼠标进入窗口");

          // 鼠标已进入窗口，取消3秒未进入的自动关闭计时器
          if (noMouseEnterTimeout) {
            clearTimeout(noMouseEnterTimeout);
            noMouseEnterTimeout = null;
          }

          // 鼠标进入窗口时，如果不是固定状态，取消常规的自动关闭定时器
          if (!isPinned && mouseLeaveTimeout) {
            clearTimeout(mouseLeaveTimeout);
            mouseLeaveTimeout = null;
          }
        } else if (channel === "mouse-leave-window") {
          // 处理鼠标离开窗口的消息
          isMouseInWindow = false;
          console.log("鼠标离开窗口");

          // 检查isMoving状态是否异常停留在true
          if (isMoving) {
            console.log("检测到isMoving为true但鼠标已离开，强制重置为false");
            isMoving = false;
          }

          // 鼠标离开窗口时，如果不是固定状态，设置自动关闭定时器
          if (!isPinned) {
            setAutoCloseTimer();
          }
        } else if (channel === "window-drag-start") {
          // 处理窗口开始拖拽的消息
          isMoving = true;
          console.log("渲染进程通知: 窗口开始拖拽");
          // 清除自动关闭计时器
          if (mouseLeaveTimeout) {
            clearTimeout(mouseLeaveTimeout);
            mouseLeaveTimeout = null;
          }
        } else if (channel === "window-drag-end") {
          // 处理窗口结束拖拽的消息
          console.log("渲染进程通知: 窗口结束拖拽");

          // 立即将isMoving设置为false
          isMoving = false;
          console.log("重置isMoving状态为false (拖拽结束)");

          // 如果窗口未被固定且鼠标不在窗口内，立即设置自动关闭计时器
          if (!isPinned && !isMouseInWindow) {
            console.log("拖拽结束，立即设置自动关闭计时器");
            setAutoCloseTimer();
          }
        }
      });

      // 窗口显示时设置自动关闭定时器和记录显示时间
      this.win2.on("show", () => {
        // 记录窗口显示时间
        windowShowTime = Date.now();

        // 设置3秒倒计时，如果鼠标没有进入窗口则自动关闭
        if (noMouseEnterTimeout) {
          clearTimeout(noMouseEnterTimeout);
          noMouseEnterTimeout = null;
        }

        noMouseEnterTimeout = setTimeout(() => {
          // 如果3秒后鼠标仍未进入窗口且窗口未被固定，则关闭窗口
          if (
            !isMouseInWindow &&
            !isPinned &&
            this.win2 &&
            !this.win2.isDestroyed()
          ) {
            console.log("窗口显示3秒后鼠标未进入，自动关闭窗口");
            this.win2.hide();
          }
        }, 3000);

        // 原有的自动关闭逻辑（鼠标离开窗口后的自动关闭）
        if (!isPinned && !isMouseInWindow) {
          setAutoCloseTimer();
        }
      });

      // 监听鼠标进入窗口事件
      this.win2.on("focus", () => {
        // 如果窗口被固定，则不自动关闭
        if (isPinned) {
          if (mouseLeaveTimeout) {
            clearTimeout(mouseLeaveTimeout);
            mouseLeaveTimeout = null;
          }
        }
        // 注意：仅依赖mouseenter/mouseleave事件来处理定时器，不在focus时取消定时器
      });

      // 监听鼠标离开窗口事件
      this.win2.on("blur", () => {
        // 窗口失去焦点时，我们不立即设置定时器
        // 我们会依赖mouseleave事件来处理，因为鼠标可能仍在窗口内
      });

      // 窗口加载完成后注入鼠标事件监听脚本
      this.win2.webContents.on("did-finish-load", () => {
        // 注入监听鼠标进入和离开窗口的脚本
        this.win2?.webContents
          .executeJavaScript(
            `
          // 跟踪鼠标是否在窗口内
          let isMouseInWindow = false;
          
          // 监听鼠标进入窗口
          document.body.addEventListener('mouseenter', () => {
            console.log('鼠标进入窗口');
            isMouseInWindow = true;
            window.ipcRenderer?.send('mouse-enter-window');
          });
          
          // 监听鼠标离开窗口
          document.body.addEventListener('mouseleave', () => {
            console.log('鼠标离开窗口');
            isMouseInWindow = false;
            window.ipcRenderer?.send('mouse-leave-window');
          });
          
          // 使用mousemove作为额外的检测机制
          document.addEventListener('mousemove', () => {
            if (!isMouseInWindow) {
              console.log('鼠标移动检测到在窗口内');
              isMouseInWindow = true;
              window.ipcRenderer?.send('mouse-enter-window');
            }
          });
          
          // 全局监听鼠标移动
          window.addEventListener('mousemove', (e) => {
            // 检查鼠标是否在窗口内
            const isInside = 
              e.clientX >= 0 && 
              e.clientX <= window.innerWidth && 
              e.clientY >= 0 && 
              e.clientY <= window.innerHeight;
            
            // 状态发生变化时才发送消息
            if (isInside && !isMouseInWindow) {
              console.log('全局检测到鼠标进入窗口');
              isMouseInWindow = true;
              window.ipcRenderer?.send('mouse-enter-window');
            } else if (!isInside && isMouseInWindow) {
              console.log('全局检测到鼠标离开窗口');
              isMouseInWindow = false;
              window.ipcRenderer?.send('mouse-leave-window');
            }
          });
        `,
          )
          .catch((err) => console.error("注入鼠标事件监听脚本失败:", err));
      });

      // this.win2.webContents.openDevTools();

      if (this.viteDevServerUrl) {
        this.win2.loadURL(this.viteDevServerUrl + "dashboard");
      } else {
        // 对于dashboard路径，在非开发环境下也使用正确的方法加载
        if (this.indexHtml.startsWith("file://")) {
          const url =
            this.indexHtml.replace(/index\.html$/, "") + "#/dashboard";
          this.win2.loadURL(url);
        } else {
          this.win2.loadFile(this.indexHtml, { hash: "dashboard" });
        }
      }
      this.win2.on("closed", () => {
        this.win2 = undefined;
        if (mouseLeaveTimeout) {
          clearTimeout(mouseLeaveTimeout);
        }
        if (noMouseEnterTimeout) {
          clearTimeout(noMouseEnterTimeout);
          noMouseEnterTimeout = null;
        }
      });
    }, 1);
  }

  getMainWindow() {
    return this.win;
  }

  getSecondaryWindow() {
    return this.win2;
  }

  showSecondaryWindowAtCursor(offscreen: boolean = false) {
    if (!this.win2 || this.win2.isDestroyed()) return;

    // 检查窗口是否已经显示
    const isVisible = this.win2.isVisible();

    // 如果窗口之前是隐藏的，现在要显示，则设置小尺寸
    if (!isVisible) {
      console.log("窗口之前是隐藏的，现在显示之前设置为小尺寸");
      this.win2.setSize(200, 200);
    }

    if (offscreen) {
      // 放置在屏幕外的位置（用户看不到的地方）
      console.log("将窗口放置在屏幕外");
      this.win2.setPosition(100000, 100000);
    } else {
      // 正常显示在鼠标位置
      const globelMousePoint = screen.getCursorScreenPoint();
      this.win2.setPosition(globelMousePoint.x + 10, globelMousePoint.y + 10);
    }

    this.win2.setAlwaysOnTop(true);
    this.win2.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

    // 显示窗口但不聚焦，避免打断用户的当前操作
    this.win2.showInactive();

    // 窗口显示时将自动触发show事件，该事件已设置自动关闭定时器的逻辑
  }

  moveSecondaryWindowToCursor() {
    if (!this.win2 || this.win2.isDestroyed() || !this.win2.isVisible()) return;

    const globelMousePoint = screen.getCursorScreenPoint();
    console.log("将窗口移动到鼠标位置:", globelMousePoint);
    this.win2.setPosition(globelMousePoint.x + 10, globelMousePoint.y + 10);
  }

  createChildWindow(hash: string) {
    const childWindow = new BrowserWindow({
      webPreferences: {
        preload: this.preload,
        nodeIntegration: true,
        contextIsolation: false,
      },
      show: false, // 创建时不显示窗口，避免自动聚焦
    });

    if (this.viteDevServerUrl) {
      childWindow.loadURL(`${this.viteDevServerUrl}#${hash}`);
    } else {
      // 根据路径格式选择正确的加载方法
      if (this.indexHtml.startsWith("file://")) {
        childWindow.loadURL(`${this.indexHtml}#${hash}`);
      } else {
        childWindow.loadFile(this.indexHtml, { hash });
      }
    }

    // 当窗口准备好后，显示窗口但不聚焦
    childWindow.once("ready-to-show", () => {
      childWindow.showInactive(); // 显示窗口但不聚焦
    });

    return childWindow;
  }
}
