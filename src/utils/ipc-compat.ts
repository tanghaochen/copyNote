/**
 * IPC 兼容层 - 为了支持旧的 window.ipcRenderer 接口
 */

// 确保 window.ipcRenderer 存在
if (!window.ipcRenderer && window.electronAPI) {
  console.log("创建 IPC 兼容层...");
  // 创建一个兼容层对象，将调用转发到新的 electronAPI
  window.ipcRenderer = {
    on: (channel: string, listener: (...args: any[]) => void) => {
      window.electronAPI.receive(channel, listener);
      // 返回虚拟对象以支持链式调用
      return window.ipcRenderer;
    },

    send: (channel: string, ...args: any[]) => {
      if (args.length === 0) {
        window.electronAPI.send(channel, null);
      } else if (args.length === 1) {
        window.electronAPI.send(channel, args[0]);
      } else {
        window.electronAPI.send(channel, args);
      }
      return window.ipcRenderer;
    },

    invoke: (channel: string, ...args: any[]) => {
      return window.electronAPI.invoke(channel, ...args);
    },

    // 添加 sendSync 方法支持
    sendSync: (channel: string, ...args: any[]) => {
      console.warn(
        "sendSync 方法在兼容层不是真正的同步调用，需要使用 invoke 替代",
      );
      // 注意: 调用此方法时，一定要使用 await 修饰，
      // 否则将无法获取正确的返回值
      return window.electronAPI.invoke(channel, ...args);
    },

    // 向后兼容
    off: () => window.ipcRenderer,
    removeListener: () => window.ipcRenderer,
  };

  console.log("IPC 兼容层已创建");
}

export {};
