<%*
// 1. 클립보드 내용을 읽어옵니다.
const clipboard = await navigator.clipboard.readText();
let title = tp.file.title; // 임시 제목
let content = clipboard;
let noteType = "note"; // 기본 타입

// ✨ [최종 수정] 당신의 아이디어를 그대로 구현한, 가장 단순하고 강력한 정규식
const calloutRegex = /#### \[\[(.*?)\|/s;
const calloutMatch = clipboard.match(calloutRegex);

if (calloutMatch) {
    // calloutMatch[1]이 우리가 원하는 '경로' (예: "02_Notes/스프링--부트--라이브러리")
    const linkPath = calloutMatch[1];
    
    // 경로에서 마지막 부분(파일명)만 추출합니다. 이것이 진짜 최종 제목이 됩니다.
    title = linkPath.split('/').pop(); 
    
    // --- (색상 코드를 추출하는 부분도 더 안정적으로 수정합니다) ---
    const colorRegex = /> \[!(\w+)\$(.+?)\]/;
    const colorMatch = clipboard.match(colorRegex);
    if (colorMatch) {
        const colorValue = colorMatch[2].trim();
        switch (colorValue) {
            case "74, 144, 226": case "concept": noteType = "concept"; break;
            case "127, 211, 33": case "example": noteType = "example"; break;
            case "248, 231, 28": case "author_view": noteType = "author_view"; break;
            case "176, 16, 224": case "my_thought": noteType = "my_thought"; break;
        }
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

// 2. 파일 이름을 최종적으로 변경합니다.
const finalName = title;
await tp.file.rename(finalName);

// 3. 노트의 최종 내용을 구성합니다. (당신이 요청한 양식 반영)
const finalContent = `---
tags: concept
type: ${noteType}
status: seedling
aliases: []
date-created: ${tp.date.now("YYYY-MM-DD")}
---

# ${finalName}

> [!abstract] 나만의 단어로 한 줄 요약
> 

## 질문 및 추가 탐구점 / 관련 노트
- 

## 소스
${content}`;


// 4. 현재 파일의 내용을 이 내용으로 완전히 교체합니다.
tR = finalContent;
%>