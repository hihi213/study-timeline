---
type: MOC
status: processing
creation_date: <% tp.date.now("YYYY-MM-DD") %>
topics: []
---
---
# MOC - <% tp.file.title.replace("MOC - ", "") %>

> [!abstract] 이 주제의 핵심 아이디어
> 이 MOC가 다루는 주제의 가장 중요한 개념이나 목표를 요약합니다.

---
## 🧭 핵심 개념 지도 (Core Concept Map)
*이곳에 관련 개념 노트들을 논리적인 순서와 구조에 따라 연결하고 배열하세요.*
*예시: 계층 구조, 마인드맵 형태 등*

- **기초 개념**
    - [관련 개념 노트 1](관련%20개념%20노트%201)
    - [관련 개념 노트 2](관련%20개념%20노트%202)
- **심화 개념**
    - [관련 개념 노트 3](관련%20개념%20노트%203)
        - [세부 개념 노트 3-1](세부%20개념%20노트%203-1)

---
## 🌱 관련 노트 목록 (Related Notes)
> *이 주제와 관련된 노트들입니다. 아직 위 지도에 연결되지 않은 노트가 있는지 확인하고 추가해 보세요.*

```dataview
LIST
FROM -"99_System"
WHERE type = "개념" AND contains(topics, this.topics) AND !contains(file.inlinks, this.file.link)
```
