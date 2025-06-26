<%*
// 1. 클립보드 내용을 읽어옵니다.
const clipboard = await navigator.clipboard.readText();
let title = "새 개념 노트 - " + tp.date.now("YYYYMMDDHHmm");
let content = clipboard;
let noteType = "note"; // 기본 타입을 'my_thought'와 유사한 'note'로 설정

// ✨ 새로운 기능! 하이라이트 키워드를 추출하여 노트 타입으로 자동 설정합니다.
const highlightRegex = /^(concept|example|author_view|my_thought)::/;
const highlightMatch = clipboard.match(highlightRegex);

if (highlightMatch) {
    // "concept::", "example::" 등에서 "::"를 제외한 키워드를 추출합니다.
    noteType = highlightMatch[1];
}

// ... (URL, 하이라이트, 텍스트를 분석하여 title과 content를 결정하는 부분 - 이전과 동일) ...
const urlRegex = /^(https?:\/\/[^\s]+)/;
if (urlRegex.test(clipboard)) {
    title = await tp.web.title(clipboard) || "웹 페이지";
    title = title.replace(/[\\/:*?"<>|]/g, '-');
    content = `URL: ${clipboard}`;
    noteType = 'concept'; // URL은 보통 개념으로 간주
} else if (clipboard.startsWith("> [!quote")) { // PDF++ 콜아웃 형식
    const match = clipboard.match(/> \[!quote\|(.*?)] (.*?)\n/);
    if(match) {
        title = match[2].slice(0, 50);
        noteType = match[1]; // 콜아웃의 색상 이름(yellow, green 등)을 타입으로 사용
    } else {
        title = "PDF 하이라이트";
    }
} else if (highlightMatch) { // key:: value 형식
    title = clipboard.replace(highlightRegex, '').trim().slice(0, 50);
} else if (clipboard) { // 일반 텍스트
    title = clipboard.slice(0, 50);
}

// 2. 파일 이름을 최종적으로 변경합니다.
await tp.file.rename(title);

// 3. 노트의 최종 내용을 구성합니다. (type: noteType 이 자동으로 채워짐!)
const finalContent = `---
tags: concept
type: ${noteType}
status: seedling
aliases: []
date-created: ${tp.date.now("YYYY-MM-DD")}
---

# ${title}

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