import { useEffect, useState } from "react";

// 全局状态管理，实现单例模式
class ExpendedState {
  private static instance: ExpendedState;
  private _isExpended: boolean = false;
  private _debugInfo: any = {};
  private listeners: Set<(value: boolean) => void> = new Set();

  private constructor() {}

  static getInstance(): ExpendedState {
    if (!ExpendedState.instance) {
      ExpendedState.instance = new ExpendedState();
    }
    return ExpendedState.instance;
  }

  get isExpended(): boolean {
    return this._isExpended;
  }

  get debugInfo(): any {
    return this._debugInfo;
  }

  set isExpended(value: boolean) {
    if (this._isExpended !== value) {
      this._isExpended = value;
      this.listeners.forEach((listener) => listener(value));
    }
  }

  setDebugInfo(info: any) {
    this._debugInfo = info;
  }

  subscribe(listener: (value: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

const expendedState = ExpendedState.getInstance();

/**
 * 检查元素是否完全可见
 */
const isElementFullyVisible = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect();
  const viewportHeight =
    window.innerHeight || document.documentElement.clientHeight;
  const viewportWidth =
    window.innerWidth || document.documentElement.clientWidth;

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= viewportHeight &&
    rect.right <= viewportWidth &&
    rect.width > 0 &&
    rect.height > 0
  );
};

/**
 * 查找目录按钮元素
 */
const findOutlineButton = (): HTMLElement | null => {
  // 优先通过ID查找
  const buttonById = document.getElementById("outline-toggle-button");
  if (buttonById) {
    return buttonById;
  }

  // 查找包含目录图标的按钮
  const buttons = document.querySelectorAll(
    'button[title*="目录"], button[title*="隐藏目录"], button[title*="显示目录"]',
  );

  for (let button of buttons) {
    const icons = button.querySelectorAll("svg");
    for (let icon of icons) {
      // 检查是否包含目录相关的图标
      if (
        icon.getAttribute("data-testid")?.includes("TocOutlined") ||
        icon.getAttribute("data-testid")?.includes("List") ||
        icon.innerHTML.includes("toc") ||
        icon.innerHTML.includes("list")
      ) {
        return button as HTMLElement;
      }
    }
  }
  return null;
};

/**
 * useIsExpended Hook
 * 观察目录按钮是否完全显示，使用单例模式确保全局唯一返回值
 * @returns {boolean} 目录按钮是否完全显示
 */
export const useIsExpended = (): boolean => {
  const [isExpended, setIsExpended] = useState(expendedState.isExpended);

  useEffect(() => {
    // 订阅全局状态变化
    const unsubscribe = expendedState.subscribe(setIsExpended);
    return unsubscribe;
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    let intervalId: NodeJS.Timeout;

    const checkButtonVisibility = () => {
      const button = findOutlineButton();

      if (button) {
        const isFullyVisible = isElementFullyVisible(button);
        const rect = button.getBoundingClientRect();

        // 更新全局状态
        expendedState.isExpended = isFullyVisible;

        // 设置调试信息
        const debugInfo = {
          isFullyVisible,
          buttonExists: true,
          boundingClientRect: {
            top: rect.top,
            left: rect.left,
            bottom: rect.bottom,
            right: rect.right,
            width: rect.width,
            height: rect.height,
          },
          viewportSize: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
          timestamp: new Date().toLocaleTimeString(),
        };

        expendedState.setDebugInfo(debugInfo);
        // console.log("目录按钮可见性调试:", debugInfo);
      } else {
        // 按钮未找到
        expendedState.isExpended = false;
        const debugInfo = {
          isFullyVisible: false,
          buttonExists: false,
          timestamp: new Date().toLocaleTimeString(),
        };
        expendedState.setDebugInfo(debugInfo);
        // console.log("目录按钮可见性调试:", debugInfo);
      }
    };

    // 初始检查
    checkButtonVisibility();

    // 使用定时器定期检查
    intervalId = setInterval(checkButtonVisibility, 100);

    // 监听窗口大小变化
    const handleResize = () => {
      animationFrameId = requestAnimationFrame(checkButtonVisibility);
    };

    // 监听滚动事件
    const handleScroll = () => {
      animationFrameId = requestAnimationFrame(checkButtonVisibility);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);

    // 监听DOM变化
    const observer = new MutationObserver(() => {
      animationFrameId = requestAnimationFrame(checkButtonVisibility);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    return () => {
      clearInterval(intervalId);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
      observer.disconnect();
    };
  }, []);

  return isExpended;
};

/**
 * 获取调试信息的hook
 */
export const useExpendedDebugInfo = () => {
  const [debugInfo, setDebugInfo] = useState(expendedState.debugInfo);

  useEffect(() => {
    const interval = setInterval(() => {
      setDebugInfo({ ...expendedState.debugInfo });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return debugInfo;
};

export default useIsExpended;
