import React from "react";
import { KeywordsContainer, KeywordItem } from "./StyledComponents";
import { useExpendedDebugInfo } from "../hooks";

interface KeywordsListProps {
  keywords: string[];
  activeKeyword: string | null;
  onKeywordClick: (keyword: string) => void;
}

const KeywordsList: React.FC<KeywordsListProps> = ({
  keywords,
  activeKeyword,
  onKeywordClick,
}) => {
  const debugInfo = useExpendedDebugInfo();

  return (
    <KeywordsContainer>
      {keywords.map((keyword, index) => (
        <KeywordItem
          key={index}
          isActive={activeKeyword === keyword}
          onClick={() => onKeywordClick(keyword)}
        >
          {keyword}
        </KeywordItem>
      ))}
      {/* 调试信息显示 */}
      {debugInfo && (
        <div
          style={{
            padding: "0.5rem",
            fontSize: "12px",
            color: "#999",
            borderBottom: "1px solid #eee",
            fontFamily: "monospace",
          }}
        >
          <div>目录按钮调试信息:</div>
          <div>完全显示: {debugInfo.isFullyVisible ? "✅" : "❌"}</div>
          <div>按钮存在: {debugInfo.buttonExists ? "✅" : "❌"}</div>
          {debugInfo.boundingClientRect && (
            <div>
              位置: ({Math.round(debugInfo.boundingClientRect.left)},{" "}
              {Math.round(debugInfo.boundingClientRect.top)})
            </div>
          )}
          <div>更新时间: {debugInfo.timestamp}</div>
        </div>
      )}
      {keywords.length === 0 && (
        <div style={{ padding: "0.5rem", color: "#666" }}>未找到相关关键词</div>
      )}
    </KeywordsContainer>
  );
};

export default KeywordsList;
