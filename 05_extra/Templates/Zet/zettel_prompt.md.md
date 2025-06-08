<%*
const title = await tp.system.prompt("개념 제목을 입력하세요");
const category = await tp.system.prompt("카테고리를 입력하세요 (예: 디자인패턴)");
const book = await tp.system.prompt("책 제목을 입력하세요");
const related1 = await tp.system.prompt("관련 개념 1 (없으면 Enter)");
const related2 = await tp.system.prompt("관련 개념 2 (없으면 Enter)");
const clip = await navigator.clipboard.readText();
-%>

---
tags: #개념/<%= category %> #복습_D1
book: [[<%= book %>]]

---

# <%= title %>

> 📖 [[<%= clip %>|본문 보기]]

## 💡 내 언어로 설명
- 

## ❓ 질문
- 어떤 맥락에서 등장했는가?
- 언제 어떻게 써야 할까?

## 🔗 관련 개념
- [[<%= related1 %>]]
- [[<%= related2 %>]]