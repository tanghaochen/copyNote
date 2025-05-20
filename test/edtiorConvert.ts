function decodeGitKrakenLink(url: string): {
  editor: string;
  repository: string | null;
  file: string | null;
  lines: number | null;
} | null {
  try {
    // 处理 URL 编码的 %3D 等符号
    const decodedUrl = decodeURIComponent(url);

    // 提取并清理 Base64 部分
    const base64Part = decodedUrl.split("/link/")[1].split("?")[0];
    const base64 = base64Part
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(base64Part.length + ((4 - (base64Part.length % 4)) % 4), "=");

    // 兼容 Node.js 的 Buffer 解码
    const decoded = Buffer.from(base64, "base64").toString("utf-8");

    // 解析 VS Code 格式的 URL
    const vscodeUrl = new URL(decoded);
    const params = new URLSearchParams(vscodeUrl.search);

    // 提取文件路径（处理 Windows 路径）
    const pathMatch = vscodeUrl.pathname.match(/\/f\/(.+?)(?:\?|$)/);
    const filePath = pathMatch?.[1].replace(/\\/g, "/") || null;

    // 处理 lines 参数
    const linesParam = params.get("lines");

    return {
      editor: "Visual Studio Code (GitLens)",
      repository: params.get("url")?.replace(/\.git$/, "") || null,
      file: filePath,
      lines: linesParam ? parseInt(linesParam, 10) : null,
    };
  } catch (error) {
    console.error("Decode failed:", error);
    return null;
  }
}

// 注意：确保两个URL字符串正确闭合
const link1 =
  "https://gitkraken.dev/link/dnNjb2RlOi8vZWFtb2Rpby5naXRsZW5zL2xpbmsvci8xOTVlNTlkODBkMTNlYmE2NTZmYzlhZGQ1OWQ3MmU5MGVlNDIyY2RjL2YvZWxlY3Ryb24vZGF0YWJhc2UvX190ZXN0c19fL3BhcnNlVXJsLnRzP3VybD1odHRwcyUzQSUyRiUyRmdpdGh1Yi5jb20lMkZ0YW5naGFvY2hlbiUyRmNvcHlOb3RlLmdpdCZsaW5lcz05NQ%3D%3D?origin=gitlens";
const link2 =
  "https://gitkraken.dev/link/dnNjb2RlOi8vZWFtb2Rpby5naXRsZW5zL2xpbmsvci8xOTVlNTlkODBkMTNlYmE2NTZmYzlhZGQ1OWQ3MmU5MGVlNDIyY2RjL2YvZWxlY3Ryb24vZGF0YWJhc2UvX190ZXN0c19fL3BhcnNlVXJsLnRzP3VybD1odHRwcyUzQSUyRiUyRmdpdGh1Yi5jb20lMkZ0YW5naGFvY2hlbiUyRmNvcHlOb3RlLmdpdCZsaW5lcz04OA%3D%3D?origin=gitlens";

console.log(decodeGitKrakenLink(link1));
console.log(decodeGitKrakenLink(link2));
