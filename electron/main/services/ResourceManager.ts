import { app } from "electron";
import fs from "fs";
import path from "path";

export class ResourceManager {
  private userDataPath: string;
  private resourcesDir: string;
  private imagesDir: string;
  private documentsDir: string;
  private databaseDir: string;

  constructor() {
    this.userDataPath = app.getPath("userData");
    this.resourcesDir = path.join(this.userDataPath, "resources");
    this.imagesDir = path.join(this.resourcesDir, "images");
    this.documentsDir = path.join(this.resourcesDir, "documents");
    this.databaseDir = path.join(this.resourcesDir, "database");

    this.ensureDirectories();
  }

  private ensureDirectories() {
    // 确保所有必要的目录都存在
    const directories = [
      this.resourcesDir,
      this.imagesDir,
      this.documentsDir,
      this.databaseDir,
    ];

    directories.forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  // 获取图片存储路径
  getImagesDir() {
    return this.imagesDir;
  }

  // 获取文档存储路径
  getDocumentsDir() {
    return this.documentsDir;
  }

  // 获取数据库存储路径
  getDatabaseDir() {
    return this.databaseDir;
  }

  // 保存base64图片
  async saveBase64Image(base64Data: string): Promise<string> {
    try {
      // 移除base64头部信息
      const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Image, "base64");

      // 生成唯一文件名
      const fileName = `img_${Date.now()}_${Math.floor(
        Math.random() * 10000,
      )}.png`;
      const filePath = path.join(this.imagesDir, fileName);

      // 写入文件
      fs.writeFileSync(filePath, buffer);
      console.log("Base64图片已保存到:", filePath);
      return filePath;
    } catch (error) {
      console.error("保存Base64图片失败:", error);
      throw error;
    }
  }

  // 保存网络图片
  async saveNetworkImage(
    url: string,
    referer?: string,
    originalUrl?: string,
  ): Promise<string> {
    try {
      // 生成唯一文件名
      const fileName = `img_${Date.now()}_${Math.floor(
        Math.random() * 10000,
      )}.png`;
      const filePath = path.join(this.imagesDir, fileName);

      // 设置请求选项
      const options: { headers: Record<string, string> } = {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      };

      if (referer) {
        options.headers["Referer"] = referer;
      }

      if (originalUrl) {
        options.headers["Origin"] = new URL(originalUrl).origin;
      }

      // 下载图片
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(
          `图片下载失败: ${response.status} ${response.statusText}`,
        );
      }

      const buffer = await response.arrayBuffer();
      fs.writeFileSync(filePath, Buffer.from(buffer));

      console.log("网络图片已保存到:", filePath);
      return filePath;
    } catch (error) {
      console.error("保存网络图片失败:", error);
      throw error;
    }
  }
}
