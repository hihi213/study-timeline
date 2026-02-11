---
type: 생각조각
status: inbox
source: 
creation_date: 2025-09-16
---

## 📜 원본 맥락

![](../01_Sources/{S}%20김영한%20응용수정전.md#^4h4frx)

---
- **SQL:** 데이터베이스가 직접 이해하는 언어
- JPQL: JPA가 이해하는 객체지향 쿼리 언어, 최종적으로는 SQL로 변환되어야 합니다.
	- 테이블이 아닌 ‘객체(Entity)’를 대상으로 함
	- 데이터베이스 종류에 상관없이 코드를 작성할 수 있게 해줍니다. (DB 독립성)
- **실행 주체:** 데이터베이스가 JPQL을 직접 받는 것이 아니라, 중간에 JPA 구현체(예: Hibernate)와 JDBC 드라이버가 이 변환 및 전달 과정을 담당합니다.
- **영속성 컨텍스트(Persistence Context):** 쿼리를 보내기 전에, JPA는 영속성 컨텍스트라는 메모리 공간에서 객체를 관리하며, 이것이 JPA 동작의 핵심 전제입니다.
- **JPA (Java Persistence API):** 자바 애플리케이션에서 관계형 데이터베이스를 사용하는 방식을 정의한 ‘인터페이스(규격)’입니다. ORM(Object-Relational Mapping) 기술의 표준입니다.
- **ORM (Object-Relational Mapping):** 객체(Object)는 객체답게, 관계형 데이터베이스(Relational Database)는 관계형 데이터베이스답게 사용하도록 중간에서 ‘매핑(Mapping)’해주는 기술입니다. 코드 복잡도를 줄이고 생산성을 높이는 것이 핵심 목표입니다.
- **JPA 구현체 (JPA Provider):** JPA라는 규격(인터페이스)을 실제로 구현한 라이브러리입니다. Hibernate, EclipseLink 등이 있으며, JPQL을 SQL로 번역하는 실질적인 역할을 합니다.
- **영속성 컨텍스트 (Persistence Context):** 엔티티를 영구 저장하는 ‘환경’이자, 1차 캐시, 쓰기 지연(transactional write-behind) 등의 기능을 제공하는 논리적인 영역입니다. JPA 성능의 핵심입니다.
- **JDBC (Java Database Connectivity):** 자바 애플리케이션이 데이터베이스와 통신할 수 있도록 해주는 표준 API입니다. JPA 구현체는 최종적으로 JDBC를 통해 SQL을 데이터베이스에 전달합니다.

1. **객체 중심 사고:** "어떤 테이블을 조회할까?"가 아니라, **"어떤 엔티티(Entity) 객체를 어떤 조건으로 찾아올까?"** 로 먼저 생각해야 합니다. 이것이 JPQL의 출발점입니다.
2. **JPQL 작성:** 1번에서 정의한 내용을 바탕으로 JPQL 쿼리를 작성합니다. `SELECT m FROM Member m WHERE m.age > 20` 처럼 테이블명이 아닌 엔티티명과 필드명을 사용합니다.
3. **JPA 내부 변환 과정 상상:** 내가 작성한 JPQL이 **JPA 구현체(Hibernate)에 의해** 내가 연결한 DB(MySQL, Oracle 등)가 알아들을 수 있는 **SQL로 번역될 것**이라고 예상해야 합니다.
4. **트랜잭션(Transaction) 범위 고려:** 이 모든 과정은 데이터베이스 트랜잭션 단위 내에서 일어나는 것을 항상 인지해야 합니다. 특히 데이터를 변경하는 쿼리는 트랜잭션 커밋(commit) 시점에 실제 DB에 반영됩니다
## **0) 기본 규칙**

- **엔티티/필드 이름 기준**(테이블/컬럼 아님)
- SELECT e FROM Entity e 처럼 **별칭 필수**
- 경로 탐색: 단일값은 점으로 계속 탐색 가능, **컬렉션은 별칭으로 join 후 탐색**

---

## **1) 기본 SELECT**

```sql
SELECT m              -- 프로젝션(엔티티/임베디드/스칼라/DTO)
FROM Member m         -- 엔티티명 기준
WHERE m.status = :st  -- 바인딩 파라미터
ORDER BY m.createdAt DESC
```

### **DTO 프로젝션**

```sql
SELECT new com.example.dto.MemberDto(m.id, m.name)
FROM Member m
```

### **DISTINCT (중복 제거)**

```sql
SELECT DISTINCT m FROM Member m JOIN m.teams t
```

---

## **2) JOIN & FETCH JOIN**

```sql
-- 내부조인
SELECT o FROM Order o JOIN o.member m

-- 외부조인
SELECT o FROM Order o LEFT JOIN o.delivery d

-- 페치조인(연관 즉시 로딩, N+1 완화)
SELECT o FROM Order o
JOIN FETCH o.member
LEFT JOIN FETCH o.delivery
```

**주의**

- 컬렉션 페치조인에 **페이징 금지**(DB 결과 폭증). 필요 시 배치사이즈/쿼리분해 고려.
- **다중 컬렉션** 동시 페치조인 금지(카테시안 폭발).
- 중복 발생 시 DISTINCT(엔티티 동일성 기준으로 중복 제거).

### **ON 절 조인 (필터링/비연관 조인)**

```sql
SELECT m, t
FROM Member m LEFT JOIN m.team t ON t.name = :name
```

[join(SQL, JPQL) 1](join(SQL,%20JPQL)%201.md)

--- ^vho6g4

## **3) WHERE 조건식**

```sql
WHERE m.age BETWEEN :min AND :max
AND m.name LIKE CONCAT(:prefix, '%') ESCAPE '\'
AND m.status IN :statuses
AND m.deletedAt IS NULL
AND m.team IS NOT NULL
AND :tag MEMBER OF m.tags
AND SIZE(m.orders) > 0
```

---

## **4) GROUP BY / HAVING**

```sql
SELECT t.name, COUNT(m)
FROM Team t JOIN t.members m
GROUP BY t.name
HAVING COUNT(m) >= 5
```

---

## **5) 서브쿼리 (FROM 불가)**

```sql
-- EXISTS / ANY / ALL
SELECT m
FROM Member m
WHERE EXISTS (
  SELECT 1 FROM Order o WHERE o.member = m AND o.status = :st
)
AND m.age > ALL (SELECT p.age FROM Profile p WHERE p.member = m)
```

> JPQL은 FROM 절 서브쿼리 불가 → **뷰/네이티브/임시 엔티티/조인 재작성**으로 대체.

---

## **6) 집계 & 내장/문자 함수**

```sql
SELECT COUNT(o), SUM(o.totalPrice), AVG(o.totalPrice), MIN(o.createdAt), MAX(o.createdAt)
FROM Order o

SELECT LOWER(m.name), UPPER(m.name), LENGTH(m.name),
       SUBSTRING(m.name, 1, 3), LOCATE('ab', m.name),
       COALESCE(m.nickname, m.name),
       NULLIF(m.status, 'BLOCKED'),
       CURRENT_DATE, CURRENT_TIME, CURRENT_TIMESTAMP
FROM Member m
```

커스텀/DB 함수:

```sql
SELECT function('json_extract', m.profileJson, '$.city') FROM Member m
```

---

## **7) 다형성/상속**

```sql
-- 타입 판별
SELECT i FROM Item i WHERE TYPE(i) = Book

-- 다운캐스팅(TREAT, JPA 2.1+/Hibernate)
SELECT b FROM Item i TREAT(i AS Book) b WHERE b.isbn = :isbn
```

---

## **8) 파라미터 바인딩**

```sql
-- 이름 기반(권장)
query.setParameter("st", OrderStatus.PAID)

-- 위치 기반(비권장)
WHERE m.age > ?1
```

---

## **9) 페이징**

```sql
TypedQuery<Member> q = em.createQuery(
  "SELECT m FROM Member m ORDER BY m.id", Member.class);
List<Member> result = q.setFirstResult(0)  // offset
                       .setMaxResults(20)  // limit
                       .getResultList();
```

> **컬렉션 페치조인과 동시 사용 금지.** (엔티티/단일값 페치조인은 가능)

---

## **10) 벌크 UPDATE / DELETE**

```sql
UPDATE Member m SET m.status = :new WHERE m.status = :old
DELETE FROM Order o WHERE o.createdAt < :cutoff
```

**반드시 기억**

- 실행은 executeUpdate() 사용, 결과는 영향 행 수.
- **영속성 컨텍스트를 무시**하고 바로 DB 반영 → **실행 후 em.clear()로 1차 캐시 초기화**!

---

## **11) 네임드 쿼리**

```java
@Entity
@NamedQuery(
  name = "Member.findByName",
  query = "SELECT m FROM Member m WHERE m.name = :name"
)
class Member { ... }

// 사용
em.createNamedQuery("Member.findByName", Member.class)
  .setParameter("name", "A")
  .getResultList();
```

---

## **12) 네이티브 쿼리 (필요할 때만)**

```java
// 엔티티 매핑
List<Member> list = em.createNativeQuery(
  "SELECT * FROM member WHERE created_at > ?", Member.class)
  .setParameter(1, Timestamp.valueOf(cutoff))
  .getResultList();

// 스칼라/DTO
Query q = em.createNativeQuery(
  "SELECT id, name FROM member WHERE status = :st");
List<Object[]> rows = q.setParameter("st", "ACTIVE").getResultList();
```

> 복잡 매핑은 @SqlResultSetMapping 또는 스프링 JdbcTemplate/Querydsl SQL도 고려.

---

## **13) 자주 쓰는 패턴 스니펫**

### **N+1 방지**

```sql
SELECT o FROM Order o
JOIN FETCH o.member
LEFT JOIN FETCH o.delivery
```

### **조건부 정렬**

```sql
SELECT m FROM Member m
ORDER BY CASE WHEN m.status = 'VIP' THEN 0 ELSE 1 END, m.createdAt DESC
```

### **존재 여부 체크**

```sql
SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END
FROM Member m WHERE m.email = :email
```

---

## **14) 실수 방지 체크리스트**

- 테이블/컬럼 이름 사용 금지 → **엔티티/필드** 사용
- 컬렉션 경로는 **반드시 JOIN 후 별칭으로 탐색**
- 컬렉션 **fetch join + 페이징 금지**
- 벌크 연산 후 **em.clear()**
- 문자열 비교는 LIKE/= 사용, Enum은 **STRING 저장 + 파라미터 바인딩**
- 복잡 보고/통계는 **네이티브**도 고민

---

## **15) API 요약 (EntityManager/Query)**
- **persist**: “새 엔티티 저장 예약” → 트랜잭션 커밋/flush 때 INSERT.
- **find**: PK로 **영속성 컨텍스트(1차 캐시 → DB)** 에서 조회, 없으면 null.
- createQuery(String jpql, Class\<T>) : JPQL 생성
- setParameter(name, value) : 파라미터 바인딩
- getResultList() : 결과 목록(없으면 빈 리스트, null아님)
- getSingleResult() : 정확히 1건(없음/다중 시 예외)
- setFirstResult(int) / setMaxResults(int) : 페이징
- executeUpdate() : 벌크 UPDATE/DELETE
- createNamedQuery(name, type) : @NamedQuery 실행(정적 JPQL 재사용)
- createNativeQuery(sql, \[resultClass|mapping]) : 네이티브 SQL
- getResultStream() : 결과를 Stream\<T>로 처리(JPA 2.2+)

[JPA EntityManager 치트시트 1](JPA%20EntityManager%20치트시트%201.md)

## 💭 나의 추가적 생각/질문
- [SQL 논리적 실행 순서 1](SQL%20논리적%20실행%20순서%201.md)