---
tags: moc
---
- `tags: moc`: 이 노트가 'MOC'임을 명확히 합니다.
- **핵심 개념 (직접 큐레이션):** 이 주제에서 가장 중요하다고 생각하는 노트들을 직접 엄선하여 연결합니다. 당신의 '편집권'이 들어가는 영역입니다.
- **Dataview 자동 목록:** 수동으로 관리하기 힘든 나머지 노트들을 자동으로 불러옵니다. `[[<% tp.file.title %>]]` 부분은 이 MOC를 링크한 모든 노트를 자동으로 찾아 목록화하라는 뜻입니다. 당신이 해야 할 일은 그저 개념 노트를 만들 때 관련 MOC를 링크(`[[네트워크 MOC]]`)하는 것뿐입니다.
# <% tp.file.title %> MOC

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
\`\`\`dataview
LIST FROM #concept AND [[<% tp.file.title %>]]
SORT file.name ASC
\`\`\`

### 소스 노트 (Sources)
\`\`\`dataview
LIST FROM #source AND [[<% tp.file.title %>]]
SORT file.name ASC
\`\`\`