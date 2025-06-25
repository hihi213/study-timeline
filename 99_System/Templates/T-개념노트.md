---
tags: concept
status: seedling
aliases: []
date-created: <% tp.date.now("YYYY-MM-DD") %>
---
<%*
const clipboard = await navigator.clipboard.readText();
let title = "새 개념 노트 - " + tp.date.now("YYYYMMDDHHmm");
let content = clipboard;
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