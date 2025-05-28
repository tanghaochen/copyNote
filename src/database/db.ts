// src/renderer/api/db.js
export const db = {
  // 通用查询方法（支持事务）
  query: (sql: string, params: any[] = []) => {
    return window.ipcRenderer.invoke("db:query", sql, params);
  },

  // 创建笔记（事务版）
  createNote: async (title: string, content: string) => {
    return db.query(
      `
      BEGIN TRANSACTION;
      INSERT INTO notes_metadata (title) VALUES (?);
      INSERT INTO notes_content (note_id, content, plain_text) 
      VALUES (last_insert_rowid(), ?, '');
      COMMIT;
    `,
      [title, content],
    );
  },

  // 渲染进程中的db.createNoteSafe方法
  createNoteSafe: async (
    title: string,
    content: string,
    plainText: string = "",
  ) => {
    const metaResult = (await db.query(
      "INSERT INTO notes_metadata (title) VALUES (?) RETURNING id",
      [title],
    )) as Array<{ id: number }>;
    // metaResult 现在是数组，例如 [{ id: 123 }]
    const noteId = metaResult[0].id;

    await db.query(
      "INSERT INTO notes_content (note_id, content, plain_text) VALUES (?, ?, ?)",
      [noteId, content, plainText],
    );
    return noteId;
  },
};
