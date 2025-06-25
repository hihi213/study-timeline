---
tags: moc
---
---
tags: moc
---

# <% tp.file.title %>

> [!abstract] 이 주제의 개요
> 이 MOC는 ...에 대한 지식들을 종합하고 연결하기 위한 허브 노트입니다.

## 핵심 개념 (직접 큐레이션)
- [[가장 중요한 개념 노트 링크 1]]
- [[가장 중요한 개념 노트 링크 2]]

## 하위 MOC 또는 관련 MOC
- [[더 세부적인 주제 MOC 링크]]

---
## 이 주제와 관련된 모든 노트 (Dataview 자동 목록)

### 개념 노트 (Concepts)
```dataview
LIST
FROM #concept AND #topic/주제태그 
WHERE file.name != this.file.name
SORT file.name ASC
/* '#topic/주제태그' 부분을 이 MOC에 맞는 실제 태그(예: #topic/network)로 수정해주세요.
*/
```


```dataview
LIST
FROM #source AND #topic/주제태그
SORT file.name ASC
/* '#topic/주제태그' 부분을 이 MOC에 맞는 실제 태그(예: #topic/network)로 수정해주세요.
*/
```