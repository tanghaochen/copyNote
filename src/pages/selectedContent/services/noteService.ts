import { worksListDB } from "@/database/worksLists";
import { noteContentDB } from "@/database/noteContentDB";
import { tagsdb } from "@/database/tagsdb";
import { HighlightItem } from "../types";

// 获取词库列表
export const getWorksList = async (): Promise<HighlightItem[]> => {
  try {
    // 1. 先获取category_id为1的所有标签
    const tags = await tagsdb.getTagsByCategory(1);

    // 2. 初始化结果数组
    let allMetadata: HighlightItem[] = [];

    // 3. 对每个标签查询对应的metadata
    for (const tag of tags) {
      const metadata = await worksListDB.getMetadataByTagId(tag.id);
      if (metadata && metadata.length > 0) {
        // 处理含有分号的标题，将其分割为多个条目
        const processedMetadata = metadata.flatMap(
          (item: { id: number; title: string }) => {
            // 检查标题中是否包含分号（中文分号或英文分号）
            if (
              item.title &&
              (item.title.includes("；") || item.title.includes(";"))
            ) {
              // 将标题按分号分割
              const titles = item.title.split(/[；;]/);
              // 为每个分割后的标题创建新条目，保持相同的ID，originalTitle保存完整标题
              return titles
                .map((title: string) => ({
                  id: item.id,
                  title: title.trim(), // 分割后的标题，用于检测
                  originalTitle: item.title, // 原始完整标题，用于显示
                }))
                .filter((item: { title: string }) => item.title); // 过滤掉空标题
            }
            // 不含分号的直接返回，originalTitle等于title
            return {
              id: item.id,
              title: item.title,
              originalTitle: item.title,
            };
          },
        );

        allMetadata = allMetadata.concat(processedMetadata);
      }
    }

    console.log("获取词库列表", allMetadata);
    return allMetadata;
  } catch (error) {
    console.error("获取词库列表失败:", error);
    return [];
  }
};

// 根据笔记ID获取内容
export const getNoteContentById = async (id: number): Promise<string> => {
  try {
    const noteItem = await noteContentDB.getContentByNoteId(id);
    return noteItem || "<p>获取笔记内容失败</p>";
  } catch (error) {
    console.error("获取笔记内容失败:", error);
    return "<p>获取笔记内容失败</p>";
  }
};
