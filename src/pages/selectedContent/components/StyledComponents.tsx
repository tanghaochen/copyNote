import { styled } from "@mui/system";

// 自定义样式组件
export const ControlBar = styled("div")(
  ({ theme, isPinned }: { theme?: any; isPinned: boolean }) => ({
    backgroundColor: "#1f2937", // 深灰色背景
    padding: "0.25rem 1rem",
    borderRadius: "0.375rem 0.375rem 0 0", // 只有顶部圆角
    marginBottom: "0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    transition: "all 0.3s ease",
    position: "relative", // 改为relative避免遮挡
    top: "0",
    zIndex: 100,
    height: "1.5rem",
    color: "#fff",
    WebkitAppRegion: "drag", // 添加可拖拽属性
    flexShrink: 0, // 防止压缩
  }),
);

export const KeywordsContainer = styled("div")({
  padding: "0.5rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
  backgroundColor: "#f9fafb",
  borderBottom: "1px solid #e5e7eb",
  height: "100%",
  overflowY: "auto",
  width: "15rem",
  flexShrink: 0,
  // maxHeight: "250px", // 限制高度以适应初始窗口大小
});

// 添加主内容容器样式
export const MainContentContainer = styled("div")({
  display: "flex",
  height: "calc(100vh - 1.5rem)", // 减去ControlBar的高度
  overflow: "hidden",
});

export const KeywordItem = styled("div")(
  ({ isActive }: { isActive: boolean }) => ({
    padding: "0.25rem 0.5rem",
    cursor: "pointer",
    backgroundColor: isActive ? "#EAEAEA" : "transparent",
    borderRadius: "4px",
    fontWeight: isActive ? "bold" : "normal",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: "#EAEAEA",
    },
  }),
);
