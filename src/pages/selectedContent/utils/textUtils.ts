import DOMPurify from "dompurify";

// HTML转义方法
export const escapeHtml = (unsafe: string) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// 正则表达式转义
export const escapeRegExp = (str: string) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// 清理剪贴板内容
export const cleanClipboardText = (text: string) => {
  return text
    .replace(/\n{3,}/g, "\n")
    .replace(/^\n+|\n+$/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "");
};

// 安全地清理HTML内容
export const sanitizeHtml = (content: string) => {
  return DOMPurify.sanitize(content);
};
