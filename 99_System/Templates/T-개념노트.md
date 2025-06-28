<%*
// 1. 클립보드 내용을 읽어옵니다.
const clipboard = await navigator.clipboard.readText();
let title = tp.file.title; // QuickAdd가 만든 임시 파일의 제목을 가져옴
let content = clipboard;
let noteType = "note";

// 2. [수정] 정규식을 사용하여 클립보드 내용을 분석합니다.
const calloutRegex = /> \[!(\w+)\|(.+?)\] ### \[(.+?)\]\(.*\)/s;
const calloutMatch = clipboard.match(calloutRegex);

if (calloutMatch) {
    const colorValue = calloutMatch[2].trim();
    title = calloutMatch[3]; 
    switch (colorValue) {
        case "74, 144, 226": case "concept": noteType = "concept"; break;
        case "127, 211, 33": case "example": noteType = "example"; break;
        case "248, 231, 28": case "author_view": noteType = "author_view"; break;
        case "176, 16, 224": case "my_thought": noteType = "my_thought"; break;
    }
} else if (clipboard) {
    const urlRegex = /^(https?:\/\/[^\s]+)/;
    if (urlRegex.test(clipboard)) {
        title = await tp.web.title(clipboard) || "웹 페이지";
    } else {
        title = clipboard.slice(0, 50);
    }
}

// 3. [수정] 현재 파일의 이름만 변경합니다. (새로 만들거나 옮기지 않음)
const finalName = title.replace(/[\\/:*?"<>|]/g, '-');
await tp.file.rename(finalName);

// 4. [수정] 노트에 채워넣을 최종 내용만 구성합니다.
const finalContent = `---
tags: concept
type: ${noteType}
status: seedling
aliases: []
date-created: ${tp.date.now("YYYY-MM-DD")}
---

# ${finalName}

> [!abstract] 한 줄 요약
> 

## 핵심 내용
${content}

## 질문 및 추가 탐구점
- 

## 관련 노트 (Connections)
- `;

// 5. [수정] 현재 파일의 내용을 이 내용으로 완전히 교체합니다.
tR = finalContent;
%>
