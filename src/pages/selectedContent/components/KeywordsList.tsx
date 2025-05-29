import React from "react";
import { KeywordsContainer, KeywordItem } from "./StyledComponents";

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
      {keywords.length === 0 && (
        <div style={{ padding: "0.5rem", color: "#666" }}>未找到相关关键词</div>
      )}
    </KeywordsContainer>
  );
};

export default KeywordsList;
