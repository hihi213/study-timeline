<%*
// 1. 클립보드 내용을 읽어옵니다.
const clipboard = await navigator.clipboard.readText();
let title = "새 개념 노트 - " + tp.date.now("YYYYMMDD_HHmm");
let content = clipboard;

// ... (URL, 하이라이트, 텍스트를 분석하여 title과 content를 결정하는 부분 - 이전과 동일) ...
const urlRegex = /^(https?:\/\/[^\s]+)/;
if (urlRegex.test(clipboard)) {
    title = await tp.web.title(clipboard) || "웹 페이지";
    title = title.replace(/[\\/:*?"<>|]/g, '-');
    content = `URL: ${clipboard}`;
} else if (clipboard.startsWith("> [!quote")) {
    const match = clipboard.match(/> \[!quote\|.*?\] (.*?)\n/);
    title = match ? match[1].slice(0, 50) : "PDF 하이라이트";
} else if (clipboard) {
    title = clipboard.slice(0, 50);
}

// ✨ 새로운 기능! 사용자에게 노트 타입을 물어봅니다.
const noteType = await tp.system.suggester(
    ["🟡 객관 (concept)", "🟢 응용 (example)", "🔵 의견/주장 (author_view)", "🟣 의견/통찰 (my_thought)"],
    ["concept", "example", "author_view", "my_thought"]
);

// 2. 파일 이름을 최종적으로 변경합니다.
await tp.file.rename(title);

// 3. 노트의 최종 내용을 구성합니다. (type: noteType 추가)
const finalContent = `---
tags: concept
type: ${noteType || ''}
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