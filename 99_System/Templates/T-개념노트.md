<%*
// 1. 클립보드 내용을 읽어옵니다.
const clipboard = await navigator.clipboard.readText();
let title = tp.file.title; // 임시 제목
let content = clipboard;
let noteType = "note"; // 기본 타입

const calloutRegex = /> \[!(\w+)\|(.+?)\] ### \[(.*?)\]\((.*?)\)/s; const calloutMatch = clipboard.match(calloutRegex);
if (calloutMatch) {
    const colorValue = calloutMatch[2].trim();        // "74, 144, 226"
    const linkPath = calloutMatch[3].trim();          // "02_Notes/스프링--부트--라이브러리"
    const textLabel = calloutMatch[4].trim();         // "스프링 부트 라이브러리"

    console.log("🎯 Match Success");
    console.log("📁 linkPath:", linkPath);
    console.log("📝 textLabel:", textLabel);

    title = linkPath.split('/').pop();                // "스프링--부트--라이브러리"

    switch (colorValue) {
        case "74, 144, 226": case "concept": noteType = "concept"; break;
        case "127, 211, 33": case "example": noteType = "example"; break;
        case "248, 231, 28": case "author_view": noteType = "author_view"; break;
        case "176, 16, 224": case "my_thought": noteType = "my_thought"; break;
    }
}else if (clipboard) { // 일반 텍스트나 URL인 경우 (기존 로직)
 new Notice("❗ 일반텍스트인가용.");

    console.log("⚠️ calloutMatch 실패. clipboard 내용:", clipboard);
    const urlRegex = /^(https?:\/\/[^\s]+)/;
    if (urlRegex.test(clipboard)) {
        title = await tp.web.title(clipboard) || "웹 페이지";
    } else {
        title = clipboard.slice(0, 50);
    }
}

// 2. 파일 이름을 최종적으로 변경합니다. (이제 공백/특수문자 치환도 함께 처리)
const finalName = title.replace(/[\\/:*?"<>| ]/g, '_');
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