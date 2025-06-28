<%*
// 1. 클립보드에서 하이라이트 내용을 읽어옵니다.
const clipboard = await navigator.clipboard.readText();
let title = "새 개념 노트 - " + tp.date.now("YYYYMMDDHHmm");
let content = clipboard;
let noteType = "note"; // 기본 타입

// 2. [✨ 새로운 기능!] 콜아웃에서 색상(RGB 또는 이름)을 추출합니다.
const calloutRegex = /> \[!quote\|(.*?)]/;
const calloutMatch = clipboard.match(calloutRegex);

if (calloutMatch) {
    const colorValue = calloutMatch[1]; // 예: "74, 144, 226" 또는 "concept"
    
    // 3. [✨ 새로운 기능!] 색상 값을 우리가 정한 키워드로 변환합니다.
    switch (colorValue) {
        case "74, 144, 226": // 파란색
        case "concept":
            noteType = "concept";
            break;
        case "127, 211, 33": // 초록색
        case "example":
            noteType = "example";
            break;
        case "248, 231, 28": // 노란색
        case "author_view":
            noteType = "author_view";
            break;
        case "176, 16, 224": // 보라색
        case "my_thought":
            noteType = "my_thought";
            break;
    }
    
    // 콜아웃에서 실제 제목 텍스트만 추출합니다.
    const titleRegex = /### \[\[.*?\|(.*?)\]\]/;
    const titleMatch = clipboard.match(titleRegex);
    if (titleMatch) {
        title = titleMatch[1];
    }
} else if (clipboard) { // 일반 텍스트나 URL인 경우 (기존 로직)
    const urlRegex = /^(https?:\/\/[^\s]+)/;
    if (urlRegex.test(clipboard)) {
        title = await tp.web.title(clipboard) || "웹 페이지";
        title = title.replace(/[\\/:*?"<>|]/g, '-');
    } else {
        title = clipboard.slice(0, 50);
    }
}

// 4. 파일 이름을 최종적으로 변경합니다.
// 중요: 개념 노트는 02_Notes에 생성되어야 하므로, 경로를 직접 지정합니다.
const finalName = title.replace(/[\\/:*?"<>|]/g, '-'); // 파일명에 못쓰는 특수문자 최종 제거
const finalPath = `02_Notes/${finalName}.md`;
await tp.file.move(finalPath);

// 5. 노트의 최종 내용을 구성합니다.
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

tR += finalContent;
%>
