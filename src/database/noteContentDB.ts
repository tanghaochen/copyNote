// src/renderer/api/tagsdb.js
interface NoteContent {
  note_id: number;
  content: string;
}

export const noteContentDB = {
  // 复用通用查询方法
  query: <T = any>(sql: string, params: any[] = []) => {
    return window.ipcRenderer.invoke("db:query", sql, params) as Promise<T>;
  },

  /**
   * 创建新的笔记内容
   * @param {string} content - HTML内容字符串
   * @returns {Promise<number>} 返回新创建的笔记ID
   */
  create: async (content: string | object) => {
    if (!content) throw new Error("content 不能为空");

    // 自动序列化JSON对象
    const contentString =
      typeof content === "object" ? JSON.stringify(content) : content;

    const result = await noteContentDB.query(
      `INSERT INTO notes_content (content) VALUES (?) RETURNING note_id`,
      [contentString],
    );

    return result[0].note_id;
  },

  /**
   * 创建/更新笔记内容（使用 INSERT OR REPLACE 实现upsert）
   * @param {number} noteId - 关联的元数据ID
   * @param {string} content - HTML内容字符串
   * @param {string} plainText - 纯文本内容字符串
   * @returns {Promise<void>}
   */
  updateContent: async (
    noteId: number,
    content: string | object,
    plainText: string = "",
  ) => {
    if (!content) throw new Error("content 不能为空");

    // 自动序列化JSON对象
    const contentString =
      typeof content === "object" ? JSON.stringify(content) : content;

    await noteContentDB.query(
      `INSERT INTO notes_content (note_id, content, plain_text)
       VALUES (?, ?, ?)
       ON CONFLICT(note_id) DO UPDATE SET 
         content = excluded.content, 
         plain_text = excluded.plain_text,
         updated_at = CURRENT_TIMESTAMP`,
      [noteId, contentString, plainText],
    );
  },

  /**
   * 获取笔记内容
   * @param {number} noteId - 笔记ID
   * @returns {Promise<string|null>} 内容HTML字符串
   */
  getContentByNoteId: async (noteId: number, parseJson = false) => {
    const result = await noteContentDB.query<{ content: string }[]>(
      "SELECT content FROM notes_content WHERE note_id = ?",
      [noteId],
    );

    const content = result[0]?.content || null;

    if (content && parseJson) {
      try {
        return JSON.parse(content);
      } catch (error) {
        console.warn("内容不是有效的JSON格式:", error);
        return content;
      }
    }

    return content;
  },

  /**
   * 获取笔记纯文本内容
   * @param {number} noteId - 笔记ID
   * @returns {Promise<string|null>} 纯文本内容字符串
   */
  getPlainTextByNoteId: async (noteId: number) => {
    const result = await noteContentDB.query<{ plain_text: string }[]>(
      "SELECT plain_text FROM notes_content WHERE note_id = ?",
      [noteId],
    );

    return result[0]?.plain_text || null;
  },

  /**
   * 获取所有笔记内容
   * @returns {Promise<Array<NoteContent>>} 所有笔记内容数组
   */
  getAllContents: async () => {
    return noteContentDB.query<NoteContent[]>(
      "SELECT note_id, content FROM notes_content ORDER BY note_id",
    );
  },

  /**
   * 删除笔记内容
   * @param {number} noteId - 笔记ID
   */
  deleteContent: async (noteId: number) => {
    await noteContentDB.query("DELETE FROM notes_content WHERE note_id = ?", [
      noteId,
    ]);
  },

  /**
   * 检查是否存在内容记录
   * @param {number} noteId
   * @returns {Promise<boolean>}
   */
  exists: async (noteId: number) => {
    const result = await noteContentDB.query<{ "1": number }[]>(
      "SELECT 1 FROM notes_content WHERE note_id = ? LIMIT 1",
      [noteId],
    );
    return result.length > 0;
  },

  /**
   * 搜索笔记内容
   * @param {string} query - 搜索关键词
   * @returns {Promise<Array<{id: number, title: string, content: string}>>} 搜索结果
   */
  searchNoteContent: async (query: string) => {
    if (!query.trim()) return [];

    const searchTerm = `%${query}%`;
    const result = await noteContentDB.query<
      Array<{
        note_id: number;
        title: string;
        plain_text: string;
        content: string;
      }>
    >(
      `SELECT nc.note_id, nm.title, nc.plain_text, nc.content 
       FROM notes_content nc
       LEFT JOIN notes_metadata nm ON nc.note_id = nm.id
       WHERE nc.plain_text IS NOT NULL 
         AND nc.plain_text != '' 
         AND nc.plain_text LIKE ?
       ORDER BY nc.note_id 
       LIMIT 50`,
      [searchTerm],
    );

    return result
      .filter((item) => item.plain_text && item.plain_text.trim() !== "")
      .map((item) => ({
        id: item.note_id,
        title: item.title || `笔记 ${item.note_id}`,
        content: item.plain_text,
      }));
  },

  /**
   * 为现有笔记生成纯文本内容
   * 从JSON格式的content中提取纯文本，用于搜索
   * @returns {Promise<number>} 更新的笔记数量
   */
  generatePlainTextForExistingNotes: async () => {
    // 获取所有没有plain_text或plain_text为空的笔记
    const result = await noteContentDB.query<
      Array<{ note_id: number; content: string }>
    >(
      `SELECT note_id, content 
       FROM notes_content 
       WHERE plain_text IS NULL OR plain_text = ''`,
    );

    let updatedCount = 0;

    for (const note of result) {
      try {
        let plainText = "";

        // 尝试解析JSON内容并提取纯文本
        if (note.content) {
          try {
            const jsonContent = JSON.parse(note.content);
            // 这里需要实现一个简单的JSON到文本的转换
            // 递归提取所有text节点
            plainText = noteContentDB.extractTextFromTiptapJSON(jsonContent);
          } catch (error) {
            // 如果不是JSON格式，直接使用原内容
            plainText = note.content;
          }
        }

        // 更新数据库
        if (plainText.trim()) {
          await noteContentDB.query(
            `UPDATE notes_content 
             SET plain_text = ? 
             WHERE note_id = ?`,
            [plainText.trim(), note.note_id],
          );
          updatedCount++;
        }
      } catch (error) {
        console.error(`处理笔记 ${note.note_id} 时出错:`, error);
      }
    }

    console.log(`成功为 ${updatedCount} 个笔记生成了纯文本内容`);
    return updatedCount;
  },

  /**
   * 从Tiptap JSON格式中提取纯文本
   * @param {any} content - Tiptap JSON内容
   * @returns {string} 提取的纯文本
   */
  extractTextFromTiptapJSON: (content: any): string => {
    if (!content) return "";

    if (typeof content === "string") return content;

    let text = "";

    if (content.type === "text" && content.text) {
      text += content.text;
    }

    if (content.content && Array.isArray(content.content)) {
      for (const child of content.content) {
        text += noteContentDB.extractTextFromTiptapJSON(child);
      }
    }

    // 在块级元素后添加换行
    if (
      content.type &&
      ["paragraph", "heading", "listItem"].includes(content.type)
    ) {
      text += "\n";
    }

    return text;
  },
};
