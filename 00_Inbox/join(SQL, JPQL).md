---
type: 생각조각
status: inbox
source: 
creation_date: 2025-09-16
---

## 📜 원본 맥락
![[00_Inbox/JPQL.md#^vho6g4]]

---

## **엔티티

```java
// JPA 엔티티
@Entity class Team {
  @Id Long id; String name;
  @OneToMany(mappedBy = "team") List<Member> members = new ArrayList<>();
}
@Entity class Member {
  @Id Long id; String name;
  @ManyToOne @JoinColumn(name="team_id") Team team;
}
```

## **테이블**

|**Team(id,name)**|**비고**|
|---|---|
|(10,‘Dev’)|멤버 2명|
|(20,‘Ops’)|멤버 1명|
|(30,‘Sales’)|멤버 0명(고아)|

| **Member(id,name,team_id)** | **비고**      |
| --------------------------- | ----------- |
| (1,‘Alice’,10)              | Dev 소속      |
| (2,‘Bob’,10)                | Dev 소속      |
| (3,‘Carol’,NULL)            | 팀 없음 (NULL) |
| (4,‘Dave’,20)               | Ops 소속      |

---

## **1) INNER JOIN (내부 조인)**

- **의미**: 양쪽 모두 매칭되는 행만.
```JPQL
SELECT m, t FROM Member m JOIN m.team t
```

```SQL
SELECT m.*, t.* FROM member m INNER JOIN team t ON m.team_id = t.id;
```

- **결과 행**

|**m.id**|**m.name**|**t.id**|**t.name**|
|---|---|---|---|
|1|Alice|10|Dev|
|2|Bob|10|Dev|
|4|Dave|20|Ops|

> 팀이 **NULL**인 Carol, 멤버가 없는 **Sales 팀**은 제외.

---

# **2) LEFT OUTER JOIN (왼쪽 기준 외부 조인)**

- **의미**: 왼쪽(기준) 테이블의 모든 행 + 매칭 없으면 오른쪽을 **NULL**.
```JPQL
SELECT m, t FROM Member m LEFT JOIN m.team t
```

```SQL
SELECT m.*, t.* FROM member m LEFT JOIN team t ON m.team_id = t.id;
```

- **결과 행**

|**m.id**|**m.name**|**t.id**|**t.name**|
|---|---|---|---|
|1|Alice|10|Dev|
|2|Bob|10|Dev|
|3|Carol|NULL|NULL|
|4|Dave|20|Ops|

> 모든 **멤버는 다 나오고**, 팀 없는 Carol은 **t 컬럼들이 NULL**.

---

# **3) RIGHT OUTER JOIN (오른쪽 기준)** 

# **JPQL 미지원**

- **JPQL엔 없음**. **대신** “오른쪽을 기준으로 한 LEFT JOIN”으로 **뒤집어 표현**하면 동일.

```jpql
-- RIGHT JOIN(Member→Team)과 동등
SELECT t, m FROM Team t LEFT JOIN t.members m
```

```sql
SELECT m.*, t.* FROM member m RIGHT JOIN team t ON m.team_id = t.id;
```

- **결과 행**

|**t.id**|**t.name**|**m.id**|**m.name**|
|---|---|---|---|
|10|Dev|1|Alice|
|10|Dev|2|Bob|
|20|Ops|4|Dave|
|30|Sales|NULL|NULL|

> 모든 **팀은 다 나오고**, 멤버 없는 **Sales**는 **멤버 컬럼이 NULL**.

---

# **4) FULL OUTER JOIN (양쪽 모두 기준)** 

# **JPQL 미지원 / DB 의존**

- **의미**: 양쪽 모두의 “모든 행”; 매칭 없으면 다른 쪽이 NULL.
- **SQL(DB가 지원할 때)**

```SQL
SELECT m.*, t.* FROM member m
FULL OUTER JOIN team t ON m.team_id = t.id;
```
- **결과 행** (우리 데이터 기준 5행)

|**m.id**|**m.name**|**t.id**|**t.name**|
|---|---|---|---|
|1|Alice|10|Dev|
|2|Bob|10|Dev|
|4|Dave|20|Ops|
|3|Carol|NULL|NULL|
|NULL|NULL|30|Sales|

> JPQL로는 **직접 불가**. 필요하면 **네이티브 SQL** 또는 쿼리 2개 합치기(UNION) 같은 우회.

---

# **5) CROSS JOIN (카테시안 곱)**

- **의미**: 모든 조합 (M×T).
```JPQL
SELECT m, t FROM Member m, Team t
-- 또는 CROSS JOIN (벤더/방언에 따라 다름)
```

```SQL
SELECT m.*, t.* FROM member m CROSS JOIN team t;
```

- **결과 행 수**: 4 멤버 × 3 팀 = **12행** (일부 예)

|**m.name**|**t.name**|
|---|---|
|Alice|Dev|
|Alice|Ops|
|Alice|Sales|
|Bob|Dev|
|…|…|

> 보통 실무에선 거의 사용하지 않고, **명시적 JOIN + ON/WHERE**로 관계를 제한.

---

# **6) JOIN … ON vs WHERE 필터 차이**

```
-- (A) LEFT JOIN + ON 필터
SELECT m, t
FROM Member m
LEFT JOIN m.team t ON t.name = 'Dev'
```

- **모든 멤버는 유지**, 팀 이름이 ‘Dev’가 아니면 **t가 NULL**.

```
-- (B) LEFT JOIN 후 WHERE 필터
SELECT m, t
FROM Member m
LEFT JOIN m.team t
WHERE t.name = 'Dev'
```

- WHERE에서 **NULL을 걸러** 버리므로, 사실상 **INNER JOIN과 동일 결과**(Dev에 속한 멤버만).

> **요약**: LEFT JOIN 유지하고 싶으면 **ON**에서 필터,
> WHERE에 조건 걸면 **NULL이 제거**되어 결과가 **내부 조인처럼** 줄어든다.
[[JOIN...ON vs WHERE 차이|JOIN...ON vs WHERE 차이]] ^srw7kc

---

# **7) FETCH JOIN (JPQL 전용, 로딩 최적화)**

- **의미**: 조인 결과를 **즉시 로딩**해서 **연관 엔티티를 한 번에 가져오기** (N+1 완화).
- **예1: ManyToOne 페치 조인**

```
SELECT m FROM Member m JOIN FETCH m.team
```

- - 결과: Member 3명(Alice, Bob, Dave)만 반환(Carol은 team 없음이라 제외).
        
        m.getTeam() 호출해도 추가 쿼리 없이 이미 로딩됨.
        
    
- **예2: OneToMany 페치 조인(주의)**

```
SELECT t FROM Team t JOIN FETCH t.members
```

- - 결과: Team이 **멤버 수만큼 중복**되어 반환될 수 있음(Dev 2행, Ops 1행, Sales 0행).
    - **페이징 금지**(DB 결과 폭증) / **다중 컬렉션 페치조인 금지**.
    - **중복 제거**가 필요하면 SELECT DISTINCT t … (JPA는 동일 엔티티 중복을 메모리에서 한번만 남김).

---

## **한눈 정리**

|**조인**|**JPQL 지원**|**기준 테이블 모두 보존?**|**우리 데이터 결과 핵심**|
|---|---|---|---|
|INNER|✅|❌|(Alice, Bob, Dave)만, Sales/Carol 제외|
|LEFT|✅|✅(왼쪽)|멤버 4명 모두; Carol의 팀 NULL|
|RIGHT|❌(대신 Team LEFT JOIN members)|✅(오른쪽)|팀 3개 모두; Sales의 멤버 NULL|
|FULL|❌(네이티브 필요)|✅(양쪽)|5행(위 표 참고)|
|CROSS|✅(콤마 문법)|-|12행(모든 조합)|
|FETCH|✅(JPQL만)|-|N+1 완화용(로딩 전략), 결과 행은 조인 구조 따라 변동|

---

---
## 💭 나의 추가적 생각/질문
-