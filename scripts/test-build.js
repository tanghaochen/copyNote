#!/usr/bin/env node

/**
 * 测试构建脚本
 * 此脚本用于测试应用构建和输出文件，不会更改版本号或推送到GitHub
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 主函数
async function main() {
  try {
    console.log("开始测试构建...");

    // 检查electron-builder.json配置
    const builderConfigPath = path.resolve(
      __dirname,
      "../electron-builder.json",
    );
    const builderConfig = JSON.parse(
      fs.readFileSync(builderConfigPath, "utf-8"),
    );
    console.log(`产品名称 (productName): ${builderConfig.productName}`);

    // 获取package.json配置
    const packageJsonPath = path.resolve(__dirname, "../package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    console.log(`包名称 (name): ${packageJson.name}`);
    console.log(`当前版本: ${packageJson.version}`);

    // 执行构建
    console.log("\n开始构建Windows应用...");
    execSync("pnpm run build:win", { stdio: "inherit" });
    console.log("✅ Windows应用构建完成");

    // 查找最新版本目录
    const releaseDir = path.resolve(__dirname, "../release");
    const versionDirs = fs
      .readdirSync(releaseDir)
      .filter((d) => fs.statSync(path.join(releaseDir, d)).isDirectory())
      .sort((a, b) => {
        // 尝试按版本号排序
        try {
          const [aMajor, aMinor, aPatch] = a.split(".").map(Number);
          const [bMajor, bMinor, bPatch] = b.split(".").map(Number);

          if (aMajor !== bMajor) return bMajor - aMajor;
          if (aMinor !== bMinor) return bMinor - aMinor;
          return bPatch - aPatch;
        } catch (e) {
          // 如果解析失败，使用字符串比较
          return b.localeCompare(a);
        }
      });

    if (versionDirs.length === 0) {
      console.error("❌ 未找到构建版本目录!");
      process.exit(1);
    }

    const latestVersionDir = path.join(releaseDir, versionDirs[0]);
    console.log(`\n最新版本目录: ${latestVersionDir}`);

    // 显示构建的文件
    console.log("\n构建文件:");
    const files = fs.readdirSync(latestVersionDir);
    files.forEach((file) => {
      const filePath = path.join(latestVersionDir, file);
      const stats = fs.statSync(filePath);
      if (stats.isFile()) {
        const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`- ${file} (${sizeInMB} MB)`);
      }
    });

    // 检查是否包含预期的文件
    const exeFiles = files.filter((f) => f.endsWith(".exe"));
    const ymlFiles = files.filter((f) => f.endsWith(".yml"));
    const blockmapFiles = files.filter((f) => f.endsWith(".blockmap"));

    console.log("\n验证构建结果:");
    console.log(
      `- EXE安装文件: ${exeFiles.length > 0 ? "✅ 已找到" : "❌ 未找到!"}`,
    );
    console.log(
      `- YML更新文件: ${ymlFiles.length > 0 ? "✅ 已找到" : "❌ 未找到!"}`,
    );
    console.log(
      `- Blockmap文件: ${
        blockmapFiles.length > 0 ? "✅ 已找到" : "❌ 未找到!"
      }`,
    );

    if (exeFiles.length > 0) {
      const exeFilename = exeFiles[0];
      console.log(`\n安装程序文件名: ${exeFilename}`);
      if (!exeFilename.includes(builderConfig.productName)) {
        console.warn(
          `⚠️ 警告: 安装程序文件名中不包含 productName (${builderConfig.productName})`,
        );
      }
      if (!exeFilename.includes(packageJson.version)) {
        console.warn(
          `⚠️ 警告: 安装程序文件名中不包含当前版本号 (${packageJson.version})`,
        );
      }
    }

    console.log("\n✅ 测试构建完成");
  } catch (error) {
    console.error("❌ 构建过程中出错:", error);
  }
}

// 执行主函数
main();
