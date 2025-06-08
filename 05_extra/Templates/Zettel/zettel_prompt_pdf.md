<%*
let concept = await tp.system.prompt("개념 이름을 입력하세요 (예: 상태 패턴)").trim();

const relatedConcepts = [];
while (true) {
  const rel = await tp.system.prompt(`관련 개념 ${relatedConcepts.length + 1} (없으면 Enter)`).trim();
  if (!rel) break;
  relatedConcepts.push(rel);
}

const question = (await tp.system.prompt("복습용 질문 (예: 전략 패턴과 차이점?)")).trim();
const answer = (await tp.system.prompt("질문에 대한 답변")).trim();

let clip = "";
try {
  clip = await navigator.clipboard.readText();
} catch (e) {
  clip = "복사된 링크 없음";
}
-%>

---
title: "<%= concept %>"
tags: ["#개념", "#복습"]
created: <% tp.date.now("YYYY-MM-DD") %>
---

# 📘 <%= concept %>

> [!PDF|yellow]  
> [[<%= clip %>|본문 보기]]

## 💡 내 언어로 설명
- 

## ❓ 질문  
- 어떤 맥락에서 등장했는가?  
- 언제 어떻게 써야 할까?

<% if (relatedConcepts.length > 0) { %>
## 🔗 관련 개념
<% relatedConcepts.forEach(rel => { %>- [[<%= rel %>]]  
<% }) %>
<% } %>

## 🧠 복습 카드  
**Q:** <%= question %>  
**A:** <%= answer %>