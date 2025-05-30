import { app } from "electron";
import fs from "fs";
import path from "path";

export class ResourceManager {
  private basePath: string;
  private resourcesDir: string;
  private imagesDir: string;
  private documentsDir: string;
  private databaseDir: string;
  private iconsDir: string;

  constructor() {
    // 根据环境确定基础路径
    console.log("当前环境:", process.env.NODE_ENV);

    if (process.env.NODE_ENV === "development") {
      // 开发环境：使用项目根目录下的 testdata
      this.basePath = path.resolve("testdata");
      console.log("开发环境 - 基础路径:", this.basePath);
    } else {
      // 生产环境：使用用户文档目录下的 CPNotes 文件夹
      const documentsPath = app.getPath("documents");
      this.basePath = path.join(documentsPath, "CPNotes");
      console.log("生产环境 - Documents路径:", documentsPath);
      console.log("生产环境 - 基础路径:", this.basePath);
    }

    // 设置资源目录结构
    this.resourcesDir = path.join(this.basePath, "resources");
    this.imagesDir = path.join(this.resourcesDir, "images");
    this.documentsDir = path.join(this.resourcesDir, "documents");
    this.databaseDir = path.join(this.resourcesDir, "database");
    this.iconsDir = path.join(this.resourcesDir, "icons");

    console.log("资源存储基础路径:", this.basePath);
    console.log("图片目录:", this.imagesDir);
    console.log("数据库目录:", this.databaseDir);

    this.ensureDirectories();
  }

  private ensureDirectories() {
    // 确保所有必要的目录都存在
    const directories = [
      this.resourcesDir,
      this.imagesDir,
      this.documentsDir,
      this.databaseDir,
      this.iconsDir,
    ];

    console.log("开始创建目录结构...");
    directories.forEach((dir) => {
      console.log("检查目录:", dir);
      if (!fs.existsSync(dir)) {
        console.log("目录不存在，正在创建:", dir);
        fs.mkdirSync(dir, { recursive: true });
        console.log("目录创建成功:", dir);
      } else {
        console.log("目录已存在:", dir);
      }
    });
    console.log("目录结构创建完成");
  }

  // 获取基础路径
  getBasePath() {
    return this.basePath;
  }

  // 获取资源根目录
  getResourcesDir() {
    return this.resourcesDir;
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

  // 获取图标存储路径
  getIconsDir() {
    return this.iconsDir;
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

  // 保存图标
  async saveIcon(iconData: string | Buffer, fileName: string): Promise<string> {
    try {
      const filePath = path.join(this.iconsDir, fileName);

      if (typeof iconData === "string") {
        // 如果是base64字符串
        const base64Image = iconData.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Image, "base64");
        fs.writeFileSync(filePath, buffer);
      } else {
        // 如果是Buffer
        fs.writeFileSync(filePath, iconData);
      }

      console.log("图标已保存到:", filePath);
      return filePath;
    } catch (error) {
      console.error("保存图标失败:", error);
      throw error;
    }
  }

  // 保存文档
  async saveDocument(
    fileData: Buffer,
    fileName: string,
    type: "pdf" | "excel" | "word",
  ): Promise<string> {
    try {
      const filePath = path.join(this.documentsDir, fileName);
      fs.writeFileSync(filePath, fileData);
      console.log(`${type}文档已保存到:`, filePath);
      return filePath;
    } catch (error) {
      console.error(`保存${type}文档失败:`, error);
      throw error;
    }
  }
}
