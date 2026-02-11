---
type: 생각조각
status: inbox
source: 
creation_date: 2025-09-16
---

## 📜 원본 맥락
![](join(SQL,%20JPQL)%201.md#^srw7kc) ^0vjh51

---
## 정리

- `FROM`과 `JOIN`(+`ON`)을 거쳐 하나의 거대한 가상 테이블(임시 결과물)이 만들어지고, 
	- **ON**: 테이블을 \_붙이는 순간_의 조건(조인 대상 한정).
		- (조인 조건)**: “\_누구를 옆에 붙일까?\_”
- `WHERE`는 이 가상 테이블을 상대로\_최종 결과_를 필터링.
	- (최종 필터)**: “\_붙이고 난 결과에서 무엇을 남길까?(필터링)\_”

## **1) 개념 한 장**
- **`ON` 절 (Join Condition):** 테이블을 ‘연결하는 시점’에 사용되는 조건입니다. `LEFT JOIN`에서는 왼쪽 테이블의 모든 행을 일단 살려두고, `ON` 조건을 만족하는 오른쪽 테이블의 행만 가져와 붙입니다. 만족하는 행이 없으면 `NULL`을 붙입니다.
- **`WHERE` 절 (Filtering Condition):** 테이블 연결이 **모두 끝난 후**, 최종 결과 집합에 대한 필터링 조건입니다. `FROM`과 `JOIN`으로 만들어진 결과 전체를 대상으로 조건을 검사하며, `false`나 `unknown`(주로 `NULL`과의 비교)으로 판정되는 행을 버립니다.
- **NULL의 생성/소멸**
    - LEFT JOIN … ON: 짝이 없으면 오른쪽을 NULL로 **생성**
    - WHERE: 그 NULL이 조건을 통과 못 하면 **제거**
## **2) 논리 실행 순서(요지)**

FROM → ON → JOIN → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT/OFFSET

## **3) 예시로 비교**

```sql
-- A) ON에서 필터(왼쪽 다 살리고, 오른쪽만 선택적으로 붙임)
SELECT m.*, t.*
FROM member m
LEFT JOIN team t
  ON t.name = 'Dev' AND t.id = m.team_id;

-- B) WHERE에서 필터(최종 결과에서 거름 → 사실상 INNER JOIN처럼 줄어듦)
SELECT m.*, t.*
FROM member m
LEFT JOIN team t
  ON t.id = m.team_id
WHERE t.name = 'Dev';
```

- A: ‘Dev’ 팀이 아니면 t.* = NULL인 상태로 **행은 남음**(왼쪽 보존).
- B: WHERE t.name = 'Dev'가 NULL도 떨어뜨리므로 **왼쪽 일부가 사라짐**(내부조인처럼).

## **4) 판단 기준 표**

|**상황**|**어디에 쓰나**|
|---|---|
|LEFT JOIN 기준 테이블(왼쪽)은 **무조건 살리고** 싶다|**ON**|
|조인 여부와 상관 없이 **최종 결과**를 특정 조건으로 **좁히고 싶다**|**WHERE**|

## **5) JPQL 메모**

- JPQL도 연관 조인에서 ON 지원(필터링 조인, 비연관 조인 일부 구현체 지원).
- **컬렉션 경로는 반드시 JOIN 후 별칭**으로 탐색.

## **6) 체크리스트**

- LEFT JOIN … WHERE right.col = … → 내부조인처럼 줄어드는지?
- WHERE right.col IS NULL로 **조인 실패 행**만 보고 싶은 경우?
- ON은 “붙이는 규칙”, WHERE는 “최종 거르기”라는 역할 차이를 항상 의식.

## **함께 보기**

- [SQL 논리적 실행 순서 1](SQL%20논리적%20실행%20순서%201.md)
- [JPQL 1](JPQL%201.md)

| **판단 기준**                                   | **어디에 쓸까?**          |
| ------------------------------------------- | -------------------- |
| `LEFT JOIN`의 기준 테이블(왼쪽)은 모두 유지하고 싶다.        | 조건을 **`ON`**에 쓴다.    |
| 조인 결과와 상관없이, 최종 결과물에서 특정 조건을 만족하는 행만 보고 싶다. | 조건을 **`WHERE`**에 쓴다. |

---
## 💭 나의 추가적 생각/질문
-