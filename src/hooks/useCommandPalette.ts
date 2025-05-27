import { useState, useEffect, useCallback } from "react";

export interface UseCommandPaletteOptions {
  enabled?: boolean;
  shortcut?: string;
}

export const useCommandPalette = (options: UseCommandPaletteOptions = {}) => {
  const { enabled = true, shortcut = "ctrl+o" } = options;
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    if (enabled) {
      setIsOpen(true);
    }
  }, [enabled]);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    if (enabled) {
      setIsOpen(!isOpen);
    }
  }, [enabled, isOpen]);

  // 解析快捷键
  const parseShortcut = useCallback((shortcutStr: string) => {
    const parts = shortcutStr.toLowerCase().split("+");
    return {
      ctrl: parts.includes("ctrl"),
      alt: parts.includes("alt"),
      shift: parts.includes("shift"),
      meta: parts.includes("meta") || parts.includes("cmd"),
      key: parts[parts.length - 1],
    };
  }, []);

  // 键盘事件处理
  useEffect(() => {
    if (!enabled) return;

    const shortcutConfig = parseShortcut(shortcut);

    const handleKeyDown = (event: KeyboardEvent) => {
      const matchesModifiers =
        event.ctrlKey === shortcutConfig.ctrl &&
        event.altKey === shortcutConfig.alt &&
        event.shiftKey === shortcutConfig.shift &&
        event.metaKey === shortcutConfig.meta;

      const matchesKey = event.key.toLowerCase() === shortcutConfig.key;

      if (matchesModifiers && matchesKey) {
        event.preventDefault();
        event.stopPropagation();
        toggle();
      }

      // ESC键关闭面板
      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        close();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, shortcut, isOpen, toggle, close, parseShortcut]);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
};
