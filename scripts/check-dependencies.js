/**
 * 检查关键依赖项是否安装正确
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

// 需要检查的关键依赖项
const criticalDependencies = [
  "@nut-tree-fork/nut-js",
  "lodash",
  "electron-updater",
];

function checkDependencies() {
  console.log("检查关键依赖项是否正确安装...");

  let hasError = false;

  for (const dep of criticalDependencies) {
    const depPath = path.join(rootDir, "node_modules", dep);

    if (fs.existsSync(depPath)) {
      console.log(`✓ ${dep} 安装正确`);

      // 获取版本信息
      try {
        const pkgJsonPath = path.join(depPath, "package.json");
        if (fs.existsSync(pkgJsonPath)) {
          const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
          console.log(`  版本: ${pkgJson.version}`);
        }
      } catch (err) {
        console.log(`  无法读取版本信息: ${err.message}`);
      }
    } else {
      console.error(`✗ ${dep} 未安装或安装不正确`);
      hasError = true;
    }
  }

  if (hasError) {
    console.error(
      "\n一些关键依赖项未正确安装。请运行 pnpm install 重新安装依赖。",
    );
    process.exit(1);
  } else {
    console.log("\n所有关键依赖项已正确安装。");
  }
}

checkDependencies();
