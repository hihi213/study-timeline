<%*
const concept = await tp.system.prompt("개념 제목을 입력하세요");
const related1 = await tp.system.prompt("관련 개념 1 (없으면 Enter)");
const related2 = await tp.system.prompt("관련 개념 2 (없으면 Enter)");
const question = await tp.system.prompt("복습 질문");
const answer = await tp.system.prompt("복습 답변");
const clip = await navigator.clipboard.readText();

const bookPath = tp.file.folder(true);
const parts = bookPath.split("/");
const bookTitle = parts[parts.length - 2];
-%>

---
title: "<%= concept %>"
tags: ["#개념", "#복습_D1"]
book: [[<%= bookTitle %>]]
created: <% tp.date.now("YYYY-MM-DD") %>
question: "<%= question %>"
---

# 📘 <%= concept %>

> [!PDF|yellow]  
> [[<%= clip %>|본문 보기]]

## 💡 내 언어로 설명
- 

## ❓ 질문
- 어떤 맥락에서 등장했는가?
- 언제 어떻게 써야 할까?

<% if (related1.trim()) { %>
## 🔗 관련 개념
- [[<%= related1 %>]]
<% } %>
<% if (related2.trim()) { %>
- [[<%= related2 %>]]
<% } %>

## 🧠 복습 카드  
**Q:** <%= question %>  
**A:** <%= answer %>

<!--SR: <% tp.date.now("YYYY-MM-DD") %>,2,5,10-->