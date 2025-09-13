---
date created: 수요일, 6월 25일 2025, 3:39:33 오후
date modified: 수요일, 6월 25일 2025, 3:54:54 오후
---

# 🏭 지식 공장 HQ ^v1xbt4

---
## 📥 처리 대기열 (`status: inbox`)
*QuickAdd로 수집된 날것의 생각들입니다. 검토 후 처리해주세요.*
```dataview
TABLE source AS "출처"
FROM "00_Inbox"
WHERE status = "inbox"
SORT file.ctime DESC
````

---

## 🌱 씨앗 뿌리기: 아직 태어나지 않은 생각들

_소스 노트에 링크만 있고 아직 파일로 만들어지지 않은 생각의 씨앗들입니다. 링크를 클릭해 '생각 조각' 노트를 생성하세요._

```dataview
TABLE rows.file.tasks.text AS "생각의 씨앗 (할 일)"
FROM "01_Sources"
FLATTEN file.tasks AS task
WHERE !task.completed AND task.link AND !task.link.file
GROUP BY file.link AS "출처 소스"
```

---

## 🌳 새싹 키우기: 개념 노트로 자라날 생각 조각들

_'생각 조각'으로 생성되었지만, 아직 '개념 노트'로 승격되지 않은 노트들입니다. 소스별로 모아보며 생각을 증류시키세요._

코드 스니펫

```dataview
TABLE rows.file.link AS "생각 조각들"
FROM "00_Inbox"
WHERE type = "생각조각" AND status != "done"
GROUP BY source AS "출처 소스"
```

---

## 🔥 행동이 필요한 노트 (`#action/...`)

_구체적인 할 일이 기다리는 노트들입니다._

코드 스니펫

```dataview
LIST
FROM #action AND -"99_System"
``` 

이제 모든 설정이 끝났습니다. 이 시스템을 믿고, `수집 모드`와 `사색 모드`를 지키며 당신만의 지식 공장을 운영해 나가시면 됩니다. 축하합니다!
