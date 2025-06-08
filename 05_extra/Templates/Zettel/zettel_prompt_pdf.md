<%*
let concept = (await tp.system.prompt("개념 이름 (예: 상태 패턴)")).trim();

const relatedConcepts = [];
while (true) {
  const input = (await tp.system.prompt(`관련 개념 ${relatedConcepts.length + 1} (없으면 Enter)`)).trim();
  if (!input) break;
  relatedConcepts.push(input);
}

const question = (await tp.system.prompt("복습 질문 (예: 전략 패턴과 차이점?)")).trim();
const answer = (await tp.system.prompt("질문에 대한 답변")).trim();
const clip = (await navigator.clipboard.readText()).trim();
-%>
---
title: "<%= concept %>"
tags: ["#개념", "#복습"]
created: <% tp.date.now("YYYY-MM-DD") %>
sr-due: <% tp.date.now("YYYY-MM-DD") %>
sr-interval: 1
sr-ease: 250
Level: 🟥
LastReview: <% tp.date.now("YYYY-MM-DD") %>
question: "<%= question %>"
---

# 📘 <%= concept %>

> [!PDF|yellow]  
> [[<%= clip %>|본문 보기]]

---

## 💡 내 언어로 설명
- 

---

## ❓ 개념 질문  
**Q:** <%= question %>  
**A:** <%= answer %>

<!--SR: <% tp.date.now("YYYY-MM-DD") %>,2,5,10-->

---

## 🔁 복습 메타정보
- 다음 복습일: `= this.sr-due`
- 복습 간격: `= this.sr-interval`일
- 난이도 계수(Ease): `= this.sr-ease`
- 복습 단계(Level): `= this.Level`

---

<% if (relatedConcepts.length > 0) { %>
## 🔗 관련 개념
<% relatedConcepts.forEach(rel => { %>- [[<%= rel %>]]  
<% }) %>
<% } %>