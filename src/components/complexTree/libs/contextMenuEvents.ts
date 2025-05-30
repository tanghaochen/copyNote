import { useEffect } from "react";
import { tagsdb } from "@/database/tagsdb";

interface ContextMenu {
  mouseX: number;
  mouseY: number;
  targetItem?: string;
}

interface TreeItem {
  index: string;
  isFolder: boolean;
  children: string[];
  label: string;
}

interface Items {
  root: TreeItem;
  [key: string]: TreeItem;
}

interface DataProvider {
  injectItem: (targetItem?: string) => void;
  deleteItem: (targetItem: string) => void;
  onDidChangeTreeData: (callback: (changedItemIds: string[]) => void) => {
    dispose: () => void;
  };
}

interface TreeRef {
  current: {
    startRenamingItem: (itemId: string) => any;
    selectItems: (itemIds: string[]) => void;
    focusItem: (itemId: string) => void;
  } | null;
}

interface ContextMenuEventsProps {
  contextMenu: ContextMenu | null;
  setContextMenu: (menu: ContextMenu | null) => void;
  tree: TreeRef;
  items: Items;
  dataProvider: DataProvider;
}

export default function contextMenuEvents({
  contextMenu,
  setContextMenu,
  tree,
  items,
  dataProvider,
}: ContextMenuEventsProps) {
  const handleCloseMenu = () => {
    setContextMenu(null);
  };
  const handleAddItem = async () => {
    handleCloseMenu();

    if (!contextMenu?.targetItem) return;
    // 调用自定义 dataProvider 的 injectItem 方法：
    dataProvider.injectItem(contextMenu.targetItem);
    console.log("contextMenu", contextMenu);
  };

  const handleEditItem = (e: any) => {
    // 先关闭上下文菜单
    handleCloseMenu();

    if (!contextMenu?.targetItem || !tree.current) return;

    const targetItem = contextMenu.targetItem; // 确保类型安全

    // 延迟执行以确保菜单关闭后再启动重命名
    setTimeout(() => {
      if (!tree.current) return; // 再次检查null

      try {
        // 先选中和聚焦目标项
        tree.current.selectItems([targetItem]);
        tree.current.focusItem(targetItem);

        // 然后启动重命名
        setTimeout(() => {
          if (!tree.current) return; // 再次检查null

          const renameRes = tree.current.startRenamingItem(targetItem);
          console.log("renameRes", renameRes, tree, tree.current, targetItem);
        }, 50); // 短暂延迟确保选中和聚焦操作完成
      } catch (error) {
        console.error("启动重命名失败:", error);
      }
    }, 100); // 等待菜单关闭动画完成
  };

  const handleDeleteItem = () => {
    // Handle deleting the selected item
    handleCloseMenu();

    if (items.root.children.length === 0) return;
    if (!contextMenu?.targetItem || contextMenu.targetItem === "root") return;

    dataProvider.deleteItem(contextMenu.targetItem);
  };

  const handleFindItem = () => {
    handleCloseMenu();
  };
  useEffect(
    () =>
      dataProvider.onDidChangeTreeData((changedItemIds: string[]) => {})
        .dispose,
    [dataProvider, items],
  );
  const handleContextMenu = (event: any, item: any) => {
    // event.preventDefault();
    // event.stopPropagation();
    console.log("event,item", event, item);
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      targetItem: item.item.index, // store the item's ID (or the whole item if needed)
    });
  };

  return {
    handleContextMenu,
    handleCloseMenu,
    handleAddItem,
    handleEditItem,
    handleDeleteItem,
    handleFindItem,
  };
}
