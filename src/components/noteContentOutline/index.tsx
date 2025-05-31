import * as React from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import "./styles/index.scss";
import RichNote from "../richNote";
import { useEffect, useState } from "react";
import { worksListDB } from "@/database/worksLists";
import { noteContentDB } from "@/database/noteContentDB";
import { IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { preferencesDB } from "@/database/perferencesDB";
import ReactDOM from "react-dom";
import ContextMenu from "./ContextMenu";

interface TabItem {
  id: string;
  label: string;
  value: string;
  content: string;
}

interface BasicTabsProps {
  worksItem: any;
  setWorksItem: (item: any) => void;
  setWorksList: (list: any[]) => void;
  setCurrentEditor: (editor: any) => void;
  setCurrentTab: (tab: any) => void;
  setActiveRichTextEditor: (editor: any) => void;
}

export default function BasicTabs({
  worksItem,
  setWorksItem,
  setWorksList,
  setCurrentEditor,
  setCurrentTab,
  setActiveRichTextEditor,
}: BasicTabsProps) {
  const [tabs, setTabs] = React.useState<TabItem[]>([]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [activeTabsItem, setActiveTabsItem] = React.useState<TabItem | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<
    "left" | "right" | null
  >(null);

  // 右键菜单相关状态
  const [contextMenu, setContextMenu] = React.useState<{
    mouseX: number;
    mouseY: number;
    tabIndex: number;
  } | null>(null);
  const [contextMenuAnchorEl, setContextMenuAnchorEl] =
    React.useState<HTMLElement | null>(null);

  // 增强的关闭标签页功能 - 支持快捷键
  const handleCloseTabWithNavigation = React.useCallback(
    (tabValue?: string, event?: any) => {
      if (event) {
        event.stopPropagation();
      }

      // 如果没有指定要关闭的标签，关闭当前标签
      const targetTabValue = tabValue || tabs[selectedIndex]?.value;
      if (!targetTabValue) return;

      const currentTabIndex = tabs.findIndex((t) => t.value === targetTabValue);
      if (currentTabIndex === -1) return;

      const newTabs = tabs.filter((t) => t.value !== targetTabValue);

      // 计算新的选中索引
      let newSelectedIndex = 0;
      if (newTabs.length > 0) {
        if (currentTabIndex === selectedIndex) {
          // 如果关闭的是当前标签，选择下一个标签，如果没有下一个则选择前一个
          if (currentTabIndex < newTabs.length) {
            newSelectedIndex = currentTabIndex; // 下一个标签
          } else {
            newSelectedIndex = newTabs.length - 1; // 最后一个标签
          }
        } else if (currentTabIndex < selectedIndex) {
          // 如果关闭的标签在当前标签之前，当前索引需要减1
          newSelectedIndex = selectedIndex - 1;
        } else {
          // 如果关闭的标签在当前标签之后，当前索引不变
          newSelectedIndex = selectedIndex;
        }
      }

      setTabs(newTabs);
      setSelectedIndex(newSelectedIndex);

      // 更新当前活动标签
      if (newTabs.length > 0) {
        const newActiveTab = newTabs[newSelectedIndex];
        setActiveTabsItem(newActiveTab);
        setCurrentTab(newActiveTab);
      } else {
        setActiveTabsItem(null);
        setCurrentTab(null);
      }

      // 更新数据库
      const noContentTabs = newTabs.map((tab) => ({
        ...tab,
        content: "",
      }));

      preferencesDB.updatePreferences({
        openedTabs: noContentTabs,
        selectedTab: newTabs.length > 0 ? newTabs[newSelectedIndex] : null,
        selectedIndex: newSelectedIndex,
      });
    },
    [
      tabs,
      selectedIndex,
      setTabs,
      setSelectedIndex,
      setActiveTabsItem,
      setCurrentTab,
    ],
  );

  // 同步当前选中标签
  useEffect(() => {
    if (tabs.length > 0 && selectedIndex >= tabs.length) {
      setSelectedIndex(tabs.length - 1);
    }
    const updateCurrentTab = async () => {
      // 更新当前活动标签
      if (
        tabs.length > 0 &&
        selectedIndex >= 0 &&
        selectedIndex < tabs.length
      ) {
        const currentTab = tabs[selectedIndex];
        setCurrentTab(currentTab);
        setActiveTabsItem(currentTab); // 确保更新活动标签项
        // 记录被选中的tab, 是合并重叠的方式更新{...currentTab}
        // tab去掉content保存
        const noContentTabs = tabs.map((tab) => ({
          ...tab,
          content: "",
        }));
        // console.log("更新当前活动标签", currentTab);
        preferencesDB.updatePreferences({
          openedTabs: noContentTabs,
          selectedTab: currentTab,
          selectedIndex: selectedIndex,
        });
      } else {
        setCurrentTab(null);
        setActiveTabsItem(null);
      }
    };
    updateCurrentTab();
  }, [tabs, selectedIndex, setCurrentTab]);

  // 页面加载时，恢复上次打开的tab
  useEffect(() => {
    let isMounted = true;

    const fetchOpenedTabs = async () => {
      try {
        setIsLoading(true);
        if (!isMounted) return;

        const preferencesRes = await preferencesDB.getPreferences();
        if (!isMounted) return;

        const { openedTabs, selectedIndex, selectedTab } = preferencesRes;
        if (!openedTabs?.length || !isMounted) return;

        const openedTabsData = await Promise.all(
          openedTabs.map(async (tab: any) => ({
            ...tab,
            content: await noteContentDB.getContentByNoteId(tab.id),
          })),
        );

        if (!isMounted) return;

        ReactDOM.unstable_batchedUpdates(() => {
          setTabs(openedTabsData);
          setActiveTabsItem(selectedTab);
          setCurrentTab(selectedTab);
          setSelectedIndex(selectedIndex);
          setIsLoading(false);
        });
      } catch (error) {
        console.error("Error fetching opened tabs:", error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchOpenedTabs();

    return () => {
      isMounted = false;
    };
  }, []);

  // 监听键盘事件，实现 Ctrl+W 快捷键
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 检查是否按下 Ctrl+W (Windows/Linux) 或 Cmd+W (Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === "w") {
        event.preventDefault(); // 阻止浏览器默认行为

        // 如果有打开的标签页，关闭当前标签
        if (tabs.length > 0) {
          handleCloseTabWithNavigation();
        }
      }
    };

    // 添加事件监听器
    document.addEventListener("keydown", handleKeyDown);

    // 清理事件监听器
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [tabs, selectedIndex, handleCloseTabWithNavigation]); // 依赖于 tabs 和 selectedIndex

  // 点击词条 添加新标签页
  useEffect(() => {
    const fetchAndAddTab = async () => {
      if (!worksItem?.id) return;

      const tabId = String(worksItem.id);
      const existsIndex = tabs.findIndex((t) => t.value === tabId);

      if (existsIndex !== -1) {
        setSelectedIndex(existsIndex);
        return;
      }
      // 获取笔记内容
      const noteContent = await noteContentDB.getContentByNoteId(worksItem.id);

      const newTab = {
        id: tabId,
        label: worksItem.title,
        value: tabId,
        content: noteContent || "",
      };

      setTabs((prev) => [...prev, newTab]);
      // 记录打开的tab, 不记录content
      const openedTabs = tabs?.map((tab) => ({
        id: tab.id,
        label: tab.label,
        value: tab.value,
      }));
      // console.log("openedTabs", openedTabs, tabs);
      // 记录打开了哪些tab, 不记录content
      preferencesDB.updatePreferences({
        openedTabs: [...openedTabs, newTab],
      });

      setSelectedIndex(tabs.length); // 切换到新标签
    };

    fetchAndAddTab();
  }, [worksItem]);

  // 关闭标签页
  const handleCloseTab = (tabValue: any, e: any) => {
    e.stopPropagation();
    setTabs((prev) => {
      const newTabs = prev.filter((t) => t.value !== tabValue);
      return newTabs;
    });
  };

  // 右键菜单处理
  const handleContextMenu = (event: React.MouseEvent, index: number) => {
    event.preventDefault();
    setContextMenuAnchorEl(event.currentTarget as HTMLElement);
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      tabIndex: index,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
    setContextMenuAnchorEl(null);
  };

  // 关闭所有标签页
  const handleCloseAll = () => {
    setTabs([]);
    setSelectedIndex(0);
    setActiveTabsItem(null);
    setCurrentTab(null);
    // 更新数据库
    preferencesDB.updatePreferences({
      openedTabs: [],
      selectedTab: null,
      selectedIndex: 0,
    });
  };

  // 关闭其他标签页
  const handleCloseOthers = () => {
    if (contextMenu === null) return;

    const targetIndex = contextMenu.tabIndex;
    const targetTab = tabs[targetIndex];

    setTabs([targetTab]);
    setSelectedIndex(0);
    setActiveTabsItem(targetTab);
    setCurrentTab(targetTab);

    // 更新数据库
    preferencesDB.updatePreferences({
      openedTabs: [{ ...targetTab, content: "" }],
      selectedTab: targetTab,
      selectedIndex: 0,
    });
  };

  // 关闭右边所有标签页
  const handleCloseRight = () => {
    if (contextMenu === null) return;

    const targetIndex = contextMenu.tabIndex;
    const newTabs = tabs.slice(0, targetIndex + 1);

    setTabs(newTabs);

    // 如果当前选中的标签被关闭了，选中最后一个标签
    if (selectedIndex > targetIndex) {
      setSelectedIndex(targetIndex);
      setActiveTabsItem(newTabs[targetIndex]);
      setCurrentTab(newTabs[targetIndex]);
    }

    // 更新数据库
    const noContentTabs = newTabs.map((tab: any) => ({
      ...tab,
      content: "",
    }));

    preferencesDB.updatePreferences({
      openedTabs: noContentTabs,
      selectedTab:
        selectedIndex > targetIndex
          ? newTabs[targetIndex]
          : tabs[selectedIndex],
      selectedIndex: selectedIndex > targetIndex ? targetIndex : selectedIndex,
    });
  };

  // useEffect(() => {
  //   console.log("Tabs changed:", tabs);
  // }, [tabs]);

  // useEffect(() => {
  //   console.log("ActiveTabsItem changed:", activeTabsItem);
  // }, [activeTabsItem]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isLeft = x < rect.width / 2;

    setDragOverIndex(index);
    setDragOverPosition(isLeft ? "left" : "right");
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
    setDragOverPosition(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData("text/plain"));

    if (dragIndex !== dropIndex) {
      const newTabs = [...tabs];
      const [draggedItem] = newTabs.splice(dragIndex, 1);

      const insertIndex =
        dragOverPosition === "left" ? dropIndex : dropIndex + 1;
      newTabs.splice(insertIndex, 0, draggedItem);

      setTabs(newTabs);
    }

    setDragOverIndex(null);
    setDragOverPosition(null);
  };

  return (
    <div className="flex-1 relative overflow-hidden">
      <Tabs
        selectedIndex={selectedIndex}
        onSelect={(index) => setSelectedIndex(index)}
        forceRenderTabPanel
      >
        <TabList className="flex flex-wrap m-0 p-0 bg-gray-100">
          {tabs.map((tab, index) => (
            <Tab key={tab.value}>
              {dragOverIndex === index && (
                <div
                  className={`absolute top-0 h-full w-1 bg-blue-500 z-10 ${
                    dragOverPosition === "left" ? "left-[-1px]" : "right-[-1px]"
                  }`}
                />
              )}
              <div className="relative flex">
                <div
                  className="custom-tab-content group"
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onContextMenu={(e) => handleContextMenu(e, index)}
                >
                  <span>{tab.label || "未命名"}</span>
                  {/* 关闭按钮: 默认隐藏，hover或active时显示 */}
                  <IconButton
                    size="small"
                    className={`custom-close-button ${
                      selectedIndex === index ? "visible" : "invisible"
                    } group-hover:visible`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseTabWithNavigation(tab.value, e);
                    }}
                    sx={{
                      p: 0,
                      ml: 1,
                      "&:hover": { backgroundColor: "rgba(0,0,0,0.08)" },
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </div>
              </div>
            </Tab>
          ))}
        </TabList>

        <div className={"w-auto"}>
          {tabs.map((tab) => (
            <TabPanel key={tab.value}>
              <RichNote
                activeTabsItem={activeTabsItem}
                tabItem={tab}
                setTabs={setTabs}
                setWorksList={setWorksList}
                setCurrentEditor={setCurrentEditor}
                setActiveRichTextEditor={setActiveRichTextEditor}
                enableResponsiveLayout={true}
              />
            </TabPanel>
          ))}
        </div>
      </Tabs>

      {/* 右键菜单 */}
      {contextMenu && (
        <ContextMenu
          anchorEl={contextMenuAnchorEl}
          open={Boolean(contextMenu)}
          onClose={handleCloseContextMenu}
          onCloseCurrent={() => {
            if (contextMenu !== null) {
              const targetTab = tabs[contextMenu.tabIndex];
              handleCloseTabWithNavigation(targetTab.value);
            }
          }}
          onCloseAll={handleCloseAll}
          onCloseOthers={handleCloseOthers}
          onCloseRight={handleCloseRight}
          hasOtherTabs={tabs.length > 1}
          hasRightTabs={
            contextMenu ? contextMenu.tabIndex < tabs.length - 1 : false
          }
        />
      )}
    </div>
  );
}
