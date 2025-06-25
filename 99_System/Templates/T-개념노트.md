---
tags: concept
status: seedling
aliases: []
date-created: <% tp.date.now("YYYY-MM-DD") %>
---
<%*
// 1. 클립보드에서 텍스트를 읽어옵니다.
const clipboard = await navigator.clipboard.readText();

// 2. 파일 제목을 결정합니다.
let title = "새 개념 노트"; // 기본 제목
let content = clipboard; // 기본 내용

// URL인지 확인합니다.
const urlRegex = /^(https?:\/\/[^\s]+)/;
const isUrl = urlRegex.test(clipboard);

if (isUrl) {
    // URL이라면, 해당 페이지의 제목을 가져와 파일 이름으로 사용합니다.
    title = await tp.web.title(clipboard);
    title = title.replace(/[\\/:*?"<>|]/g, '-'); // 파일명에 못쓰는 특수문자 제거
    content = `URL: ${clipboard}`;
} else {
    // 일반 텍스트라면, 텍스트의 첫 50자를 제목으로 사용합니다.
    title = clipboard.slice(0, 50);
}

// 3. 파일 이름을 최종적으로 변경합니다.
await tp.file.rename(title);

// 4. 노트의 최종 내용을 구성합니다.
const finalContent = `---
tags: concept
status: seedling
aliases: []
date-created: ${tp.date.now("YYYY-MM-DD")}
source-url: ${isUrl ? clipboard : ''}
---

# ${title}

> [!abstract] 한 줄 요약
> 

## 핵심 내용
${isUrl ? '' : content}

## 질문 및 추가 탐구점
- 

## 관련 노트 (Connections)
- `;

tR += finalContent;
%>