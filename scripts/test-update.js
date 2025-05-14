#!/usr/bin/env node

/**
 * 测试自动更新配置脚本
 * 此脚本用于测试应用更新配置和GitHub Releases的设置
 */

import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 主函数
async function main() {
  try {
    console.log("开始测试自动更新配置...");

    // 读取package.json获取版本和仓库信息
    const packageJsonPath = path.resolve(__dirname, "../package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    console.log(`应用名称: ${packageJson.name}`);
    console.log(`当前版本: ${packageJson.version}`);

    // 读取electron-builder.json获取发布配置
    const builderConfigPath = path.resolve(
      __dirname,
      "../electron-builder.json",
    );
    const builderConfig = JSON.parse(
      fs.readFileSync(builderConfigPath, "utf-8"),
    );

    // 检查发布配置
    if (!builderConfig.publish || builderConfig.publish.length === 0) {
      console.error("❌ electron-builder.json 中未找到 publish 配置!");
      return;
    }

    const publishConfig = builderConfig.publish[0];
    console.log("发布配置:");
    console.log(`- 提供者: ${publishConfig.provider}`);
    console.log(`- 所有者: ${publishConfig.owner}`);
    console.log(`- 仓库: ${publishConfig.repo}`);

    // 测试GitHub API
    const owner = publishConfig.owner;
    const repo = publishConfig.repo;

    console.log("\n正在检查GitHub Releases...");
    const releaseUrl = `https://api.github.com/repos/${owner}/${repo}/releases`;

    try {
      const response = await fetch(releaseUrl);

      if (!response.ok) {
        console.error(`❌ 无法访问GitHub Releases API: ${response.statusText}`);
        return;
      }

      const releases = await response.json();

      if (!Array.isArray(releases) || releases.length === 0) {
        console.warn("⚠️ 未找到任何发布版本!");
        return;
      }

      console.log(`找到 ${releases.length} 个发布版本`);

      // 检查最新的发布版本
      const latestRelease = releases[0];
      console.log(`\n最新发布版本: ${latestRelease.tag_name}`);
      console.log(
        `发布日期: ${new Date(latestRelease.published_at).toLocaleString()}`,
      );
      console.log(`下载地址: ${latestRelease.html_url}`);

      // 检查发布版本中的资源文件
      if (!latestRelease.assets || latestRelease.assets.length === 0) {
        console.error("❌ 最新发布版本中没有资源文件!");
        return;
      }

      console.log("\n资源文件:");
      latestRelease.assets.forEach((asset) => {
        console.log(
          `- ${asset.name} (${(asset.size / 1024 / 1024).toFixed(2)} MB)`,
        );
        console.log(`  下载地址: ${asset.browser_download_url}`);
      });

      // 检查是否有latest.yml文件
      const latestYml = latestRelease.assets.find(
        (asset) => asset.name === "latest.yml",
      );

      if (!latestYml) {
        console.error("❌ 未找到latest.yml文件，这将导致自动更新失败!");

        // 查找其他yaml文件
        const otherYamlFiles = latestRelease.assets.filter(
          (asset) =>
            asset.name.endsWith(".yml") || asset.name.endsWith(".yaml"),
        );

        if (otherYamlFiles.length > 0) {
          console.log("\n找到其他YAML文件:");
          otherYamlFiles.forEach((file) => {
            console.log(`- ${file.name}`);
          });
          console.log(
            "\n建议: 手动下载这些文件，重命名为latest.yml，然后重新上传",
          );
        }
      } else {
        console.log("\n✅ 找到latest.yml文件");

        // 检查latest.yml内容
        try {
          const ymlResponse = await fetch(latestYml.browser_download_url);
          if (ymlResponse.ok) {
            const ymlContent = await ymlResponse.text();
            console.log("\nlatest.yml内容预览:");
            console.log("----------------------------");
            console.log(
              ymlContent.substring(0, 500) +
                (ymlContent.length > 500 ? "..." : ""),
            );
            console.log("----------------------------");

            // 检查是否缺少关键字段
            if (!ymlContent.includes("version:")) {
              console.warn("⚠️ latest.yml 缺少 version 字段!");
            }
            if (!ymlContent.includes("files:")) {
              console.warn("⚠️ latest.yml 缺少 files 字段!");
            }
            if (!ymlContent.includes("path:")) {
              console.warn("⚠️ latest.yml 缺少 path 字段!");
            }
            if (!ymlContent.includes("sha512:")) {
              console.warn("⚠️ latest.yml 缺少 sha512 字段!");
            }
          } else {
            console.error(
              `❌ 无法获取latest.yml内容: ${ymlResponse.statusText}`,
            );
          }
        } catch (err) {
          console.error("❌ 获取latest.yml内容时出错:", err);
        }
      }

      // 测试安装程序的下载链接
      const installer = latestRelease.assets.find(
        (asset) =>
          asset.name.endsWith(".exe") &&
          asset.name.includes(builderConfig.productName),
      );

      if (installer) {
        console.log("\n✅ 找到安装程序:", installer.name);
        console.log("测试下载链接...");

        const headResponse = await fetch(installer.browser_download_url, {
          method: "HEAD",
        });

        if (headResponse.ok) {
          console.log("✅ 安装程序下载链接有效");
        } else {
          console.error(`❌ 安装程序下载链接无效: ${headResponse.statusText}`);
        }
      } else {
        console.error("❌ 未找到匹配的安装程序!");

        const exeFiles = latestRelease.assets.filter((asset) =>
          asset.name.endsWith(".exe"),
        );
        if (exeFiles.length > 0) {
          console.log("\n找到其他安装程序文件:");
          exeFiles.forEach((file) => {
            console.log(`- ${file.name}`);
          });
        }
      }

      console.log("\n自动更新配置检查总结:");
      console.log("----------------------------");
      console.log(`1. GitHub仓库可访问: ${response.ok ? "✅ 是" : "❌ 否"}`);
      console.log(
        `2. 存在发布版本: ${releases.length > 0 ? "✅ 是" : "❌ 否"}`,
      );
      console.log(`3. 最新版本有安装程序: ${installer ? "✅ 是" : "❌ 否"}`);
      console.log(`4. 存在latest.yml: ${latestYml ? "✅ 是" : "❌ 否"}`);
      console.log("----------------------------");

      if (!latestYml) {
        console.log("\n解决方案:");
        console.log("1. 创建一个名为latest.yml的文件，内容如下:");
        console.log("----------------------------");
        const exeName = installer
          ? installer.name
          : `${builderConfig.productName}_${packageJson.version}.exe`;
        const sampleYml = `version: ${latestRelease.tag_name.replace("v", "")}
files:
  - url: ${exeName}
    sha512: 0
path: ${exeName}
sha512: 0
releaseDate: ${new Date().toISOString().split("T")[0]}`;
        console.log(sampleYml);
        console.log("----------------------------");
        console.log("2. 手动上传这个文件到GitHub Release");
      }
    } catch (error) {
      console.error("❌ 测试GitHub Releases时出错:", error);
    }
  } catch (error) {
    console.error("❌ 测试自动更新配置时出错:", error);
  }
}

// 执行主函数
main().catch(console.error);
