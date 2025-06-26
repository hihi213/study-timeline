<%*
// 1. 클립보드에서 URL을 읽어옵니다.
const url = await navigator.clipboard.readText();
const urlRegex = /^(https?:\/\/[^\s]+)/;
if (!urlRegex.test(url)) {
    new Notice("오류: 클립보드에 유효한 URL이 없습니다.", 5000);
    return;
}

// 2. 웹페이지의 제목을 자동으로 가져옵니다.
let title = await tp.web.title(url) || "웹 소스";
title = title.replace(/[\\/:*?"<>|]/g, '-'); // 파일명에 못쓰는 특수문자 제거

// 3. 사용자에게 저자/채널명을 직접 물어봅니다.
const author = await tp.system.prompt("저자 또는 채널명을 입력하세요 (선택 사항)");

// 4. 최종 파일명을 결정합니다.
const finalName = `[S] ${author ? author + ' - ' : ''}${title}`;
await tp.file.rename(finalName);

// 5. 노트의 최종 내용을 구성합니다.
const finalContent = `---
tags: source
type: ${url.includes("youtube.com") ? '#video' : '#article'}
status: unprocessed
author: "${author || ''}"
source-link: "${url}"
date-created: ${tp.date.now("YYYY-MM-DD")}
---

# ${finalName}

> [!abstract] 이 자료의 핵심 질문
> - 

## 하이라이트 및 나의 생각
- `;

tR += finalContent;
%>