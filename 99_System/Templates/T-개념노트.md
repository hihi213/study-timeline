<%*
// 1. 클립보드 내용을 읽고, 제목/타입/내용을 분석합니다. (자동화 로직)
const clipboard = await navigator.clipboard.readText();
let title = tp.file.title;
let content = clipboard;
let noteType = "note";

const calloutRegex = /> \[!(\w+)\|(.+?)\] ### \[(.+?)\]\(.*\)/s;
const calloutMatch = clipboard.match(calloutRegex);

if (calloutMatch) {
    const colorValue = calloutMatch[2].trim();
    title = calloutMatch[3]; 
    switch (colorValue) {
        case "74, 144, 226": case "concept": noteType = "concept"; break;
        case "127, 211, 33": case "example": noteType = "example"; break;
        case "248, 231, 28": case "author_view": noteType = "author_view"; break;
        case "176, 16, 224": case "my_thought": noteType = "my_thought"; break;
    }
} else if (clipboard) {
    const urlRegex = /^(https?:\/\/[^\s]+)/;
    if (urlRegex.test(clipboard)) {
        title = await tp.web.title(clipboard) || "웹 페이지";
    } else {
        title = clipboard.slice(0, 50);
    }
}

// 2. 파일 이름을 최종적으로 변경합니다.
const finalName = title.replace(/[\\/:*?"<>|]/g, '-');
await tp.file.rename(finalName);

// 3. 노트에 채워넣을 최종 '내용'을 '생각 발전기' 양식에 맞춰 구성합니다.
const finalContent = `---
tags: concept
type: ${noteType}
status: seedling
aliases: []
date-created: ${tp.date.now("YYYY-MM-DD")}
sources: []
---

# ${finalName}

### 1. 한 줄 정의 (Definition)
> [!abstract] 
> > 

---

### 2. 나만의 언어로 설명 (My Understanding)
${content}

### 3. 왜 중요한가? (Why it Matters / So What?)
- 

### 4. 구체적인 예시 또는 비유 (Examples or Analogies)
- 

### 5. 추가 질문 및 탐구점 (Open Questions)
- 

### 6. 관련 노트 (Connections)
- `;

// 4. 현재 파일의 내용을 이 내용으로 완전히 교체합니다.
tR = finalContent;
%>