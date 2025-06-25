---
tags: concept
status: seedling
aliases: []
date-created: <% tp.date.now("YYYY-MM-DD") %>
---
<%*
const clipboard = await navigator.clipboard.readText();
let title = "새 개념 노트";
let content = clipboard;

// URL인지 확인
const urlRegex = /^(https?:\/\/[^\s]+)/;
if (urlRegex.test(clipboard)) {
    title = await tp.web.title(clipboard) || "웹 페이지";
    title = title.replace(/[\\/:*?"<>|]/g, '-');
    content = `URL: ${clipboard}`;
} 
// PDF++ 하이라이트 형식인지 확인
else if (clipboard.startsWith("> [!quote")) {
    // 콜아웃 내용에서 실제 텍스트만 추출하여 제목으로 사용
    const match = clipboard.match(/> \[!quote\|.*?\] (.*?)\n/);
    title = match ? match[1].slice(0, 50) : "PDF 하이라이트";
    // 내용은 클립보드 원본 그대로 사용
} else {
    // 일반 텍스트
    title = clipboard.slice(0, 50);
}

await tp.file.rename(title);

const finalContent = `---
tags: concept
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
