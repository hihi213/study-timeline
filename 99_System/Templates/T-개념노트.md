<%*

// 1. 클립보드 내용을 읽어옵니다.

const clipboard = await navigator.clipboard.readText();

let title = tp.file.title; // QuickAdd가 만든 임시 파일의 제목을 가져옴

let content = clipboard;

let noteType = "note"; // 기본 타입

  

// ✨ [최종 수정] 링크의 '경로'에서 제목을 추출하는 가장 똑똑한 정규식

const calloutRegex = /> \[!(\w+)\|(.+?)\] ### \[(.*?)\]\((.*?)\)/s;

const calloutMatch = clipboard.match(calloutRegex);

  

if (calloutMatch) {

    // calloutMatch[2]는 색상 값 (예: "74, 144, 226")

    // calloutMatch[4]가 우리가 원하는 '경로' (예: "02_Notes/스프링--부트--라이브러리")

    const colorValue = calloutMatch[2].trim();

    const linkPath = calloutMatch[4];

    // 경로에서 마지막 부분(파일명)만 추출합니다. 이것이 진짜 최종 제목이 됩니다.

    title = linkPath.split('/').pop(); 

    // RGB 코드를 우리가 정한 키워드로 변환합니다.

    switch (colorValue) {

        case "74, 144, 226": case "concept": noteType = "concept"; break;

        case "127, 211, 33": case "example": noteType = "example"; break;

        case "248, 231, 28": case "author_view": noteType = "author_view"; break;

        case "176, 16, 224": case "my_thought": noteType = "my_thought"; break;

    }

} else if (clipboard) { // 일반 텍스트나 URL인 경우 (기존 로직)

    const urlRegex = /^(https?:\/\/[^\s]+)/;

    if (urlRegex.test(clipboard)) {

        title = await tp.web.title(clipboard) || "웹 페이지";

    } else {

        title = clipboard.slice(0, 50);

    }
    // 일반 텍스트의 경우, 파일명 안전을 위해 여기서도 치환을 적용합니다.
    title = title.replace(/[\\/:*?"<>| ]/g, '_');
}

// 2. 파일 이름을 최종적으로 변경합니다. (이제 경로에서 직접 가져왔으므로 완벽합니다.)

console.log(title);
const finalName = title;
await tp.file.rename(finalName);

  

// 3. 노트의 최종 내용을 구성합니다.

const finalContent = `---
tags: concept
type: ${noteType}
status: seedling
aliases: []
date-created: ${tp.date.now("YYYY-MM-DD")}
---

  

# ${finalName}

  

> [!abstract] 나만의 단어로한 줄 요약
> 

  

## 소스노트

${content}

  

  

## 질문 및 추가 탐구점/ 관련 노트
- `;

  

// 4. 현재 파일의 내용을 이 내용으로 완전히 교체합니다.
tR = finalContent;

%>