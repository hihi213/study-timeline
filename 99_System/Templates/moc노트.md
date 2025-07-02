---
type: MOC
status: processing
creation_date: <% tp.date.now("YYYY-MM-DD") %>
topics: []
---

# MOC - <% tp.file.title.replace("MOC - ", "") %>

> [!abstract] 이 주제의 핵심 아이디어
> 

---
## 🧭 핵심 개념 지도 (Core Concept Map)
- 

---
## 🌱 관련 노트 목록 (Related Notes)
```dataview
LIST
FROM ""
WHERE type = "개념" AND contains(topics, this.topics) AND !contains(file.inlinks, this.file.link)
````
