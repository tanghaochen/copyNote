import { useCurrentEditor } from "@tiptap/react";
import React, { useEffect, useState, useRef } from "react";
import Button from "@mui/material/Button";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import {
  extTypeList,
  listTypeList,
  paragraphTList,
  textAlignTypeList,
} from "@/components/richNote/constants";
import MenuItem from "@mui/material/MenuItem";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import HightlightComp from "@/components/richNote/subComponents/highlight";
import { worksListDB } from "@/database/worksLists";
import HeadingSelector from "@/components/richNote/subComponents/headingSelector";
import TpTable from "../tpTable";
import CodeIcon from "@mui/icons-material/Code";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import IconButton from "@mui/material/IconButton";
import CodeJumpDialog from "@/components/richNote/subComponents/codeJump/CodeJumpDialog";
import { Popper, Paper, ClickAwayListener } from "@mui/material";

// 定义组件props类型
interface MenuBarProps {
  setTabs?: (tabs: any) => void;
  tabItem?: any;
  setWorksList?: (worksList: any) => void;
  isShowHeading?: boolean;
  enableResponsiveLayout?: boolean;
}

// 定义隐藏项类型
interface HiddenItem {
  element: HTMLElement;
  index: number;
  type: string;
  props: any;
}

const MenuBar: React.FC<MenuBarProps> = ({
  setTabs,
  tabItem,
  setWorksList,
  isShowHeading = true,
  enableResponsiveLayout = true,
}) => {
  const { editor } = useCurrentEditor();
  const [inputTitleValue, setInputTitleValue] = useState(tabItem?.label || "");
  const editorRef = useRef<any>(null);
  const [isCodeJumpDialogOpen, setIsCodeJumpDialogOpen] = useState(false);

  // 响应式布局相关状态
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const [showMoreButton, setShowMoreButton] = useState(false);
  const [hiddenItems, setHiddenItems] = useState<HiddenItem[]>([]);
  const [popperOpen, setPopperOpen] = useState(false);
  const [popperAnchor, setPopperAnchor] = useState<HTMLElement | null>(null);

  // 添加定时器引用来管理Popper的隐藏
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 清除隐藏定时器
  const clearHideTimer = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  // 设置延迟隐藏
  const setHideTimer = (delay: number = 300) => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      console.log("定时器触发，隐藏Popper");
      setPopperOpen(false);
      hideTimerRef.current = null;
    }, delay);
  };

  useEffect(() => {
    setInputTitleValue(tabItem?.label || "");
  }, [tabItem?.label]);

  useEffect(() => {
    if (editor) {
      editorRef.current = editor;
    }
  }, [editor]);

  // 检查是否需要显示更多按钮
  const checkMenuOverflow = () => {
    if (!enableResponsiveLayout || !menuContainerRef.current) return;

    const container = menuContainerRef.current;
    const buttons = container.querySelectorAll(".menu-button");

    if (buttons.length === 0) return;

    const firstButtonTop = buttons[0] as HTMLElement;
    const firstTop = firstButtonTop.offsetTop;
    const wrappedButtons: HiddenItem[] = [];
    let hasWrapped = false;

    console.log("检查菜单换行状态:", {
      总按钮数: buttons.length,
      第一个按钮offsetTop: firstTop,
    });

    buttons.forEach((button, index) => {
      const element = button as HTMLElement;
      const currentTop = element.offsetTop;

      console.log(
        `按钮${index} offsetTop:`,
        currentTop,
        element.textContent?.trim() || element.className,
      );

      if (currentTop > firstTop) {
        hasWrapped = true;
        console.log(
          `按钮${index}换行了，offsetTop: ${currentTop} > ${firstTop}`,
        );
        wrappedButtons.push({
          element: element,
          index: index,
          type: element.dataset.buttonType || "unknown",
          props: element.dataset.buttonProps
            ? JSON.parse(element.dataset.buttonProps)
            : {},
        });
      }
    });

    console.log("检测结果:", {
      hasWrapped,
      wrappedButtons: wrappedButtons.length,
      hiddenItems: wrappedButtons.map((item) => ({
        index: item.index,
        type: item.type,
      })),
    });

    setShowMoreButton(hasWrapped);
    setHiddenItems(wrappedButtons);
  };

  useEffect(() => {
    if (!enableResponsiveLayout || !menuContainerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      setTimeout(checkMenuOverflow, 10);
    });

    resizeObserver.observe(menuContainerRef.current);

    setTimeout(checkMenuOverflow, 100);

    return () => {
      resizeObserver.disconnect();
    };
  }, [enableResponsiveLayout, editor]);

  // 处理鼠标进入菜单区域
  const handleMenuMouseEnter = () => {
    console.log("鼠标进入菜单区域:", {
      enableResponsiveLayout,
      hiddenItemsLength: hiddenItems.length,
    });

    // 清除任何待执行的隐藏定时器
    clearHideTimer();

    if (enableResponsiveLayout && hiddenItems.length > 0) {
      console.log("显示Popper菜单");
      setPopperAnchor(menuContainerRef.current);
      setPopperOpen(true);
    }
  };

  // 处理鼠标离开菜单区域
  const handleMenuMouseLeave = (e: React.MouseEvent) => {
    console.log("鼠标离开菜单区域");

    // 延迟隐藏，给用户时间移动到Popper
    if (popperOpen) {
      console.log("设置延迟隐藏定时器");
      setHideTimer(300); // 增加到300ms给用户更多时间
    }
  };

  // 处理Popper鼠标进入
  const handlePopperMouseEnter = () => {
    console.log("鼠标进入Popper，清除隐藏定时器");
    clearHideTimer();
    setPopperOpen(true);
  };

  // 处理Popper鼠标离开
  const handlePopperMouseLeave = () => {
    console.log("鼠标离开Popper，立即隐藏");
    clearHideTimer();
    setPopperOpen(false);
  };

  // 处理点击外部区域
  const handleClickAway = (event: MouseEvent | TouchEvent) => {
    console.log("点击外部区域，隐藏Popper");
    clearHideTimer();
    setPopperOpen(false);
  };

  // 监听隐藏项状态变化
  useEffect(() => {
    console.log("隐藏菜单状态更新:", {
      showMoreButton,
      hiddenItemsCount: hiddenItems.length,
      popperOpen,
      enableResponsiveLayout,
    });
  }, [showMoreButton, hiddenItems.length, popperOpen, enableResponsiveLayout]);

  // 监听隐藏项变化，如果鼠标仍在菜单区域且有隐藏项，保持显示Popper
  useEffect(() => {
    if (
      enableResponsiveLayout &&
      hiddenItems.length > 0 &&
      menuContainerRef.current
    ) {
      // 检查鼠标是否仍在菜单区域内
      const checkMousePosition = () => {
        if (menuContainerRef.current) {
          const rect = menuContainerRef.current.getBoundingClientRect();
          // 这里我们假设如果Popper已经打开，用户可能仍在菜单区域
          if (popperOpen || hiddenItems.length > 0) {
            console.log("隐藏项变化，检查是否需要显示Popper");
            // 可以根据需要决定是否自动显示
          }
        }
      };

      checkMousePosition();
    } else if (hiddenItems.length === 0 && popperOpen) {
      // 如果没有隐藏项了，关闭Popper
      console.log("没有隐藏项，关闭Popper");
      clearHideTimer();
      setPopperOpen(false);
    }
  }, [hiddenItems.length, enableResponsiveLayout]);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      clearHideTimer();
    };
  }, []);

  if (!editor) {
    return null;
  }

  const CommonBtn = (props: any) => {
    const {
      extType = "bold",
      toggleFunName,
      iconName,
      toggleFunParam,
      disabled: externalDisabled = false,
      className = "",
    } = props;
    const toggleFun =
      toggleFunName || `toggle${extType[0].toUpperCase()}${extType.slice(1)}`;

    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      editor.commands.focus();

      if (typeof (editor.commands as any)[toggleFun] === "function") {
        (editor.commands as any)[toggleFun](toggleFunParam || undefined);
      }
    };

    return (
      <Button
        size="small"
        className={`menu-button ${className}`}
        data-button-type="common"
        data-button-props={JSON.stringify(props)}
        style={{
          backgroundColor: editor?.isActive(extType) ? "#E7E9E8" : "",
          height: "100%",
          color: "#000000",
        }}
        onMouseDown={handleClick}
        disabled={externalDisabled}
      >
        <span className="material-symbols-outlined">
          {iconName || `format_${extType}`}
        </span>
      </Button>
    );
  };

  const renderHiddenMenuItem = (item: HiddenItem) => {
    const props = item.props;
    const {
      extType = "bold",
      toggleFunName,
      iconName,
      toggleFunParam,
      disabled: externalDisabled = false,
    } = props;

    const toggleFun =
      toggleFunName || `toggle${extType[0].toUpperCase()}${extType.slice(1)}`;

    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      editor.commands.focus();
      if (typeof (editor.commands as any)[toggleFun] === "function") {
        (editor.commands as any)[toggleFun](toggleFunParam || undefined);
      }
      setPopperOpen(false);
    };

    return (
      <Button
        key={item.index}
        size="small"
        style={{
          backgroundColor: editor?.isActive(extType) ? "#E7E9E8" : "",
          color: "#000000",
          margin: "0 2px",
          minWidth: "auto",
          padding: "4px 8px",
        }}
        onMouseDown={handleClick}
        disabled={externalDisabled}
      >
        <span className="material-symbols-outlined">
          {iconName || `format_${extType}`}
        </span>
      </Button>
    );
  };

  const handleInputTitleBlur = () => {
    setTabs &&
      setTabs((tabs: any) => {
        return tabs.map((tab: any) => {
          if (tab.value === tabItem?.value) {
            tab.label = inputTitleValue;
            return tab;
          }
          return tab;
        });
      });
    setWorksList &&
      setWorksList((worksList: any) => {
        return worksList.map((item: any) => {
          if (item.id == tabItem?.value) {
            item.title = inputTitleValue;
            return item;
          }
          return item;
        });
      });
    console.log("tabItem", tabItem);
    worksListDB.updateMetadata(tabItem?.value, {
      title: inputTitleValue,
    });
  };

  return (
    <div className="control-group sticky top-0 z-10 bg-white">
      <div
        ref={menuContainerRef}
        className={`button-group inline-flex justify-start align-middle overflow-auto ${
          enableResponsiveLayout ? "flex-wrap" : ""
        }`}
        onMouseEnter={handleMenuMouseEnter}
        onMouseLeave={handleMenuMouseLeave}
        style={{
          position: "relative",
          maxHeight: enableResponsiveLayout ? "40px" : "auto",
          overflow: enableResponsiveLayout ? "hidden" : "auto",
        }}
      >
        <HeadingSelector editor={editor} />

        {extTypeList.map((item, index) => {
          return <CommonBtn key={index} {...item} />;
        })}

        <Divider
          orientation="vertical"
          variant="middle"
          flexItem
          className="menu-button"
          data-button-type="divider"
        />

        <HightlightComp editor={editor} />

        <Divider
          orientation="vertical"
          variant="middle"
          flexItem
          className="menu-button"
          data-button-type="divider"
        />

        {listTypeList.map((item, index) => {
          return <CommonBtn key={index} {...item} />;
        })}

        <Divider
          orientation="vertical"
          variant="middle"
          flexItem
          className="menu-button"
          data-button-type="divider"
        />

        {textAlignTypeList.map((item, index) => {
          return <CommonBtn key={index} {...item} />;
        })}

        <Divider
          orientation="vertical"
          variant="middle"
          flexItem
          className="menu-button"
          data-button-type="divider"
        />

        <TpTable editor={editor} />

        <IconButton
          onClick={() => setIsCodeJumpDialogOpen(true)}
          size="small"
          title="代码跳转"
          className="menu-button"
          data-button-type="code"
        >
          <CodeIcon />
        </IconButton>
      </div>

      {/* 隐藏菜单的 Popper */}
      {enableResponsiveLayout && (
        <Popper
          open={popperOpen}
          anchorEl={popperAnchor}
          placement="bottom"
          style={{ zIndex: 1300 }}
        >
          <ClickAwayListener onClickAway={handleClickAway}>
            <Paper
              data-popper-menu="true"
              elevation={3}
              style={{
                padding: "4px",
                maxWidth: "none",
                marginTop: "4px",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: "2px",
              }}
              onMouseEnter={handlePopperMouseEnter}
              onMouseLeave={handlePopperMouseLeave}
            >
              {(() => {
                console.log("渲染Popper，隐藏项数量:", hiddenItems.length);
                return null;
              })()}
              {hiddenItems.length === 0 && (
                <div style={{ padding: "8px", color: "#666" }}>
                  没有隐藏的菜单项
                </div>
              )}
              {hiddenItems.map((item) => {
                console.log("渲染隐藏项:", item.type, item.index);
                if (item.type === "common") {
                  return renderHiddenMenuItem(item);
                } else if (item.type === "divider") {
                  return;
                } else if (item.type === "code") {
                  return (
                    <IconButton
                      key={item.index}
                      size="small"
                      title="代码跳转"
                      style={{
                        margin: "0 2px",
                        padding: "4px",
                      }}
                      onClick={() => {
                        console.log("点击代码按钮");
                        setPopperOpen(false);
                      }}
                    >
                      <CodeIcon />
                    </IconButton>
                  );
                }
                return null;
              })}
            </Paper>
          </ClickAwayListener>
        </Popper>
      )}

      <div className="w-full my-4">
        {isShowHeading && (
          <input
            className="border-none w-full font-bold text-4xl content-title focus:ring-0"
            minLength={1}
            maxLength={30}
            size={10}
            onChange={(e) => setInputTitleValue(e.target.value)}
            value={inputTitleValue}
            onBlur={handleInputTitleBlur}
            placeholder={"请输入标题"}
          />
        )}
      </div>

      <CodeJumpDialog
        open={isCodeJumpDialogOpen}
        onClose={() => setIsCodeJumpDialogOpen(false)}
        onSubmit={(values: any) => {
          (editor as any)?.commands.setCodeJump(values);
          setIsCodeJumpDialogOpen(false);
        }}
        initialValues={{}}
      />
    </div>
  );
};

export default MenuBar;
