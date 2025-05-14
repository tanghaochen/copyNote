import { initDatabase } from "../../database";
import { IpcMain } from "electron";

export class DatabaseManager {
  private db: any;
  private initialized: boolean = false;
  private initPromise: Promise<any> | null = null;

  constructor() {
    // 创建初始化承诺，但不立即执行
    this.init();
  }

  private async init() {
    if (this.initialized) return this.db;

    if (this.initPromise) {
      return this.initPromise;
    }

    try {
      this.initPromise = initDatabase();
      this.db = await this.initPromise;
      this.initialized = true;
      return this.db;
    } catch (error) {
      console.error("数据库初始化失败:", error);
      this.initPromise = null;
      throw error;
    }
  }

  setupIpcHandlers(ipcMain: IpcMain) {
    ipcMain.handle("db:query", async (_, sql: string, params: any) => {
      try {
        // 确保数据库已初始化
        if (!this.initialized || !this.db) {
          console.log("数据库未就绪，尝试初始化...");
          await this.init();
        }

        const stmt = this.db.prepare(sql);

        if (sql.trim().toUpperCase().startsWith("SELECT")) {
          return stmt.all(params);
        } else {
          const result = stmt.run(params);
          return {
            lastInsertRowid: result.lastInsertRowid,
            changes: result.changes,
          };
        }
      } catch (err: any) {
        console.error("数据库错误:", err.message);
        throw new Error(`数据库错误: ${err.message}`);
      }
    });
  }
}
