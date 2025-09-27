---
type: 생각조각
status: inbox
source: 
creation_date: 2025-09-16
---

## 📜 원본 맥락

![](JPQL.md#^dp9w89)

---
## 0) 초간단 결정표

- **새로 저장** → persist  (쓰기 트랜잭션 필요)
- **PK로 단건 조회** → find
- **여러 건/조건 조회** → createQuery(...).setParameter(...).getResultList()
- **단건(없을 수도 있음)** → getResultList().stream().findFirst()
- **정적 재사용 쿼리** → createNamedQuery
- DB SQL 그대로? → createNativeQuery (+ 매핑 지정)
- **분리 엔티티 갱신** → 가급적 find 후 필드 변경(권장), 어쩔 수 없을 때 merge
- **삭제** → remove (managed 보장)
- **대량 갱신/삭제** → executeUpdate() 후 **em.clear()**

## **1) 엔티티 생명주기 작업**

| **메서드**             | **목적/효과**                              | **반환**             | **관리 상태 요건**         | **전파(Cascade)**         | **자주 겪는 함정**                              |
| ------------------- | -------------------------------------- | ------------------ | -------------------- | ----------------------- | ----------------------------------------- |
| persist(e)          | 새 엔티티 **등록 예약**(flush/commit 때 INSERT) | void               | e = transient        | PERSIST/ALL이면 자식도 같이 등록 | IDENTITY 전략은 키 받으려 **즉시 INSERT**가 나갈 수 있음 |
| find(T.class, id)   | 1차 캐시→DB에서 **조회**                      | T 또는 null          | 불필요                  | 없음                      | 1차 캐시에 있으면 DB 안 감. 연관은 LAZY면 프록시          |
| merge(detached)     | 분리(detached) 객체 상태를 **새 관리 엔티티에 복사**   | **새 managed 인스턴스** | 인자: detached/새 객체 가능 | MERGE/ALL               | 인자로 준 객체는 **계속 detached**. 반환값으로 작업할 것    |
| remove(e)           | 엔티티 **삭제 예약**(flush/commit 때 DELETE)   | void               | e는 **managed** 여야 함  | REMOVE/ALL              | detached면 예외→보통 em.remove(em.merge(e))    |
| flush()             | 변경분을 DB와 **동기화**(SQL 전송)               | void               | -                    | -                       | 트랜잭션 안에서 쓰기. 커밋 직전에 자동 호출됨                |
| clear() / detach(e) | 1차 캐시 비움 / 특정 엔티티만 분리                  | void               | -                    | -                       | 분리 후 변경은 반영 안 됨                           |

> 실무 팁
> • “쓰기”는 트랜잭션 필수. “쓰기 후 엔티티 반환” 대신 **id만 반환**하고 필요 시 다시 조회(조회/쓰기 분리).
> • 애그리거트 내부만 cascade = ALL, orphanRemoval = true 고려.

---

## **2) 쿼리 만들기 & 실행**

| **메서드**                           | **용도**                     | **반환/행동**                 | **포인트**                                                             |
| --------------------------------- | -------------------------- | ------------------------- | ------------------------------------------------------------------- |
| createQuery(jpql, T.class)        | **JPQL**(엔티티 대상) 작성        | TypedQuery<T>             | select e from Order e where e.status = :s                           |
| getResultList()                   | **여러 건 조회**                | List\<T> (비어 있을 수 있음)     | N건 결과. 절대 null 아님                                                   |
| getSingleResult()                 | **단건 조회**                  | T                         | 없으면 NoResultException, 2건+이면 NonUniqueResultException               |
| createNamedQuery(name, T.class)   | 사전에 정의한 **@NamedQuery** 실행 | TypedQuery<T>             | 재사용/정적쿼리, 컴파일 타임 검증 장점                                              |
| createNativeQuery(sql)            | **순수 SQL**                 | Query (기본 List<Object[]>) | createNativeQuery(sql, Entity.class) 또는 SqlResultSetMapping으로 매핑 가능 |
| **setParameter(name, val)**       | 파라미터 바인딩                   | `Query`                   | 이름/위치 파라미터 모두 가능(이름 권장)                                             |
| **setFirstResult/ setMaxResults** | **페이징**                    | `Query`                   | JPA 표준 페이징                                                          |
| **executeUpdate()**               | **벌크 UPDATE/DELETE**실행     | `int`(영향 행 수)             | 실행 직후 `em.clear()` **권장**(1차 캐시 불일치 방지)                             |

> 단건 안전 조회 패턴
>createQuery(...).setParameter(...).setMaxResults(1).getResultList().stream().findFirst().orElse(null)

---

## **3) 사용 시나리오 스니펫**

**등록** (부모-자식 cascade)

```java
@Transactional
public Long placeOrder(Order o, List<OrderItem> items, Delivery d){
  items.forEach(o::addOrderItem); // 편의 메서드로 양쪽 세팅
  o.setDelivery(d);
  em.persist(o);                  // cascade=ALL이면 자식/딜리버리까지 같이 INSERT
  return o.getId();
}
```

**수정** (변경 감지)

```java
@Transactional
public void changeAddress(Long memberId, Address newAddr){
  Member m = em.find(Member.class, memberId); // managed
  m.changeAddress(newAddr); // dirty checking → flush/commit 시 UPDATE
}
```

**분리 객체 갱신(merge 주의)**

> 가능하면 **find → 필드 변경**을 권장. 어쩔 수 없이 DTO→엔티티로 병합할 때만 merge.

```java
@Transactional
public void updateViaMerge(Member detached){
  Member managed = em.merge(detached); // 반환 객체를 사용해야 함
}
```

**단건 조회(예외 피하기)**

```java
Order o = em.createQuery(
  "select o from Order o where o.id = :id", Order.class)
  .setParameter("id", id)
  .setMaxResults(1)
  .getResultList().stream().findFirst().orElse(null);
```

**네이티브 조회**

```java
List<Object[]> rows = em.createNativeQuery(
  "select id, username from member where status = ?")
  .setParameter(1, "ACTIVE")
  .getResultList();
```

---

## **4) 예외/주의 요약**

- getSingleResult() → **없음**: NoResultException, **2건+**: NonUniqueResultException.
- remove()는 **managed**만. detached면 merge 후 삭제.
- merge()는 **새 managed 인스턴스**를 반환(인자는 계속 detached).
- IDENTITY 전략: persist 시점에 **즉시 INSERT** 가능.
- 트랜잭션 밖에서의 쓰기/flush 금지.
- createNativeQuery 기본 결과는 Object\[]; 엔티티 매핑을 지정해야 타입 안정.

---
# 세부정리

## **1) persist(entity)**

- 새 엔티티를 **영속성 컨텍스트**에 등록(Managed). DB 반영은 보통 **flush/commit** 시점.
- **Cascade.PERSIST/ALL** 시 자식도 저장.
- 쓰기 작업은 **@Transactional 필수**.

```java
em.persist(order); // INSERT는 flush/commit 시점
```

---

## **2) find(EntityClass\<T> entityClass, Object id)**

- **역할**: **PK로 단건 조회**.
- **동작 순서**: 1차 캐시(영속성 컨텍스트) → 없으면 DB SELECT → 캐시에 넣어 반환.
- **결과**: 없으면 **null**(예외 X). 반환 엔티티는 **Managed**.
- **연관 로딩**: LAZY 연관은 접근 시 추가 쿼리(N+1 주의).
- **비교**: getReference 는 프록시만 반환(접근 시 로딩).

```
Order order = em.find(Order.class, orderId); // 캐시 히트면 SQL 안 나감
```

---

## **3)createQuery(...)** **(JPQL 쿼리 생성)**
- **오버로드**
    - createQuery(String jpql, Class\<T> resultClass) → **TypedQuery** (권장, 컴파일 타입 안전)
    - createQuery(String jpql) → **Query** (비타입)
- **변형**
    - createNamedQuery("name", Class\<T>) : @NamedQuery 사용
    - createNativeQuery(sql) : 네이티브 SQL (가능하면 DTO 매핑 지정)
- **파라미터 바인딩**
    - **이름 기반**: :name → setParameter("name", v) (권장)
- **페이징**
    - setFirstResult(int) / setMaxResults(int)

```java
TypedQuery<Order> q = em.createQuery(
  "select o from Order o join fetch o.member m where m.name = :name",
  Order.class
).setParameter("name", name)
 .setFirstResult(0).setMaxResults(50);
```

- **파라미터 바인딩 (Parameter Binding):** SQL 쿼리문에 변수가 들어갈 자리를 미리 **'틀'로** 만들어 놓고(예: `:username`), 실행 시점에 `setParameter`를 통해 **'값'을** 안전하게 채워 넣는 기술입니다.
	- **이름 기반 파라미터 (Named Parameter):** `... WHERE m.name = :name` 처럼 이름으로 자리를 지정.
	- **위치 기반 파라미터 (Positional Parameter):** `... WHERE m.name = ?1` 처럼 물음표와 순서로 자리를 지정.
---

## **4)getResultList() (쿼리 실행)**
- **역할**: SELECT 실행 후 **List** 반환.
- **특징**: 결과가 없으면 **빈 리스트** \[] 를 반환(절대 null 아님).
- **단건 조회 대안**: getSingleResult() 는 0건이면 **NoResultException**, 2건 이상이면 **NonUniqueResultException** → 실무에선 getResultList() 받아서 stream().findFirst() 패턴을 자주 씀.

```java
List<Order> orders = q.getResultList();      // 0건이면 []
Order maybeOne = orders.stream().findFirst().orElse(null);
```

## merge(entity)

- 분리(detached) 객체 상태를 **새 managed 인스턴스**에 **전체 복사**.
- **반환 객체만** 변경 추적 대상. **부분 업데이트**에는 부적합(널 덮어쓰기 위험).

## remove(entity)

- **Managed** 엔티티를 삭제 예약 → flush/commit 때 **DELETE**.
- 자식 삭제는 `cascade = REMOVE/ALL` 또는 `orphanRemoval = true` 고려(공유 엔티티 주의).

## getSingleResult()

- **정확히 1건** 기대 시 사용. 0건/다건은 예외.
- “없을 수도 있음”이면 `getResultList()` → `findFirst()` 권장.

## createNamedQuery(name, resultClass)

- 엔티티에 선언한 **@NamedQuery**를 이름으로 실행.
- 재사용/표준화 장점, **부트 시 파싱**으로 오류 조기 발견.

## createNativeQuery(sql, …)

- **원시 SQL** 실행. 1) 기본: `Object[]` 2) 엔티티 매핑 3) `@SqlResultSetMapping` 이름으로 매핑.
- 이식성↓, 컬럼 별칭/매핑 정확히. 페치조인 개념 없음.
---

## **미니 치트시트**

|**메서드**|**주요 용도**|**트랜잭션 필요**|**예외/반환**|
|---|---|---|---|
|persist(e)|새 엔티티 저장 예약|쓰기이므로 **필수**|반환값 없음|
|find(T.class, id)|PK로 단건 조회|읽기라 선택(스냅샷 일관성 원하면 권장)|없으면 null|
|createQuery(jpql, T.class)|JPQL 작성 + 타입 안전 쿼리|아니오(읽기); 쓰기 쿼리는 executeUpdate|쿼리 객체 반환|
|getResultList()|리스트 결과 수집|아니오(읽기)|없으면 빈 리스트|

---

## **merge(entity)**

- **무엇**: _분리(detached)_ 상태 엔티티의 값을 **영속 컨텍스트의 동일 엔티티에 복사**해서 **관리(managed)되는 새 인스턴스**를 돌려줌.
- **반환**: **관리되는 엔티티 인스턴스**(새 객체). **넘긴 객체는 계속 detached**임!
- **언제**
    - 트랜잭션 밖에서 수정된 엔티티를 다시 저장해야 할 때
    - DTO → 엔티티로 역매핑해 덮어써야 할 때(주의 필요)
- **동작 요약**
    
    1. ID가 있으면 DB(또는 1차 캐시)에서 **관리 엔티티**를 조회
    2. 관리 엔티티가 없고 ID도 없으면 **새 엔티티 생성 후 persist와 유사하게 INSERT**
    3. **모든 필드를 덮어씀**(null 포함) → “전체 병합”

- **주의/팁**
    - 부분 업데이트엔 **merge보다 ‘조회→수정’**이 안전(예상치 못한 null 덮어쓰기 방지).
    - merge()는 연관까지 **Cascade.MERGE/ALL**일 때 전파.
    - 트랜잭션 안에서 쓰기. 반환 받은 **관리 엔티티**를 계속 사용하자.

```
@Transactional
public void updateName(Member detached) {
    Member managed = em.merge(detached); // managed만 변경 추적됨
    managed.setName("new"); // OK
}
```

---

## **remove(entity)**

- **무엇**: **관리 중인 엔티티**를 삭제 상태로 표시 → flush/commit 때 **DELETE** 실행.
- **언제**: 엔티티 자체를 지울 때. (자식까지 지우려면 cascade = REMOVE/ALL 또는 orphanRemoval = true)
- **주의/팁**
    - **반드시 managed 상태**여야 함. detached면 먼저 find()나 merge()로 붙인 뒤 삭제.
    - 공유되는 자식이 있으면 **연쇄 삭제 주의**(cascade/remove/orphanRemoval 남용 금지).

```
@Transactional
public void deleteOrder(Long id){
    Order o = em.find(Order.class, id); // managed
    em.remove(o);
}
```

---

## **getSingleResult()**

- **무엇**: 쿼리 결과에서 **정확히 한 행**만 기대할 때 사용.
- **반환/예외**
    - 결과 1건 → 단일 객체 반환
    - **0건 → NoResultException**
    - **2건 이상 → NonUniqueResultException**
- **언제**: ID로 조회, 단일 합계/카운트 등.
- **주의/팁**
    - “없을 수도 있음” 상황이면 예외 처리가 번거로움 → 보통

```
T result = em.createQuery(jpql, T.class)
             .setParameter("x", v)
             .getResultList()
             .stream().findFirst().orElse(null);
```
    
    처럼 **getResultList() 후 findFirst()** 패턴으로 안전 처리.

---

## **createNamedQuery(name, resultClass)**

- **무엇**: **미리 선언한 JPQL**(@NamedQuery)을 이름으로 가져와 실행.
- **어디서 선언?**

```
@NamedQuery(
  name="Member.findByName",
  query="select m from Member m where m.name = :name"
)
@Entity
class Member { ... }
```
- **장점**
    - 쿼리를 **컴파일 시점에 파싱**(부트 시 기동 실패로 빨리 오류 발견)
    - 재사용/표준화 쉬움, 코드 깔끔
- **주의/팁**
    - **이름 충돌** 조심(패키지+도메인 접두어 네이밍 권장)
    - 리팩토링 시 **파라미터/필드명 변경 영향** 주의

```
List<Member> list = em
  .createNamedQuery("Member.findByName", Member.class)
  .setParameter("name", "A")
  .getResultList();
```

---

## **createNativeQuery(sql, …)**

- **무엇**: **원시 SQL** 실행. JPQL로 어려운 DB 전용 기능/복잡 쿼리/뷰/스칼라 결과에 사용.
- **반환 타입 3가지**
    
    1. createNativeQuery(sql) → List<Object[]> (스칼라 컬럼들)
    2. createNativeQuery(sql, EntityClass.class) → **엔티티 매핑**(컬럼 별칭=매핑)
    3. createNativeQuery(sql, "MappingName") → **@SqlResultSetMapping** 사용한 커스텀 매핑

- **언제**
    - DB 함수/힌트/CTE/윈도우 함수 등 **JPQL로 힘든 경우**
    - 리포트성 쿼리(프로젝션)
- **주의/팁**
    - **이식성↓**(DB 벤더 락인), **엔티티 매핑 시 컬럼 별칭**을 정확히 맞추기.
    - 엔티티를 반환해도 **영속성 컨텍스트 규칙**은 그대로(1차 캐시와 동일성 보장).
    - 페치조인 개념이 없음. 성능/조인 전략은 직접 SQL로 책임져야 함.
    - 스칼라 결과는 DTO로 매핑해 쓰는 게 보통.

```
// 스칼라 → DTO 매핑
List<Object[]> rows = em.createNativeQuery(
  "select m.id, m.name from member m where m.status = ?")
  .setParameter(1, "ACTIVE")
  .getResultList();

List<Member> members = em.createNativeQuery(
  "select * from member where status = :s", Member.class)
  .setParameter("s", "ACTIVE")
  .getResultList();
```

---

## **한눈에 비교표**

|**메서드**|**용도**|**트랜잭션**|**주의점/예외**|
|---|---|---|---|
|merge(e)|분리 엔티티 상태 반영(전체 덮어쓰기)|**필수**|반환 객체만 managed, null 덮어쓰기 위험|
|remove(e)|삭제 예약 → flush/commit에 DELETE|**필수**|대상은 **managed**여야 함|
|getSingleResult()|단일 행 기대|선택(읽기)|0건 NoResultException, 2+건 NonUniqueResultException|
|createNamedQuery()|미리 선언된 JPQL 실행|선택|이름 충돌/리팩토링 영향 주의|
|createNativeQuery()|원시 SQL 실행|선택|이식성↓, 매핑/성능 직접 책임|

---
## 6) 추가 API(선택)

- **refresh(entity)**: DB 값으로 **재로딩**(메모리 변경 덮어씀). 대상은 **managed**.
- **lock(entity, LockModeType)**: 명시적 락(OPTIMISTIC/OPTIMISTIC_FORCE_INCREMENT/PESSIMISTIC_*). 낙관적 락은 보통 `@Version` 필요.
- **getReference(Class, id)**: **프록시 즉시 획득**(접근 시 조회). 존재 안 하면 접근 시 예외.
- **contains(entity)**: 현재 영속성 컨텍스트가 **관리 중인지** 여부.
- **setFlushMode(AUTO/COMMIT)**: EM/쿼리 단위로 flush 시점 조정.
- **setHint(key, val)**: 쿼리 힌트(캐시/타임아웃/읽기전용 등).
- **getResultStream()**(JPA 2.2): 결과를 `Stream<T>`로 처리.
- **getCriteriaBuilder()/createQuery(CriteriaQuery)**: 타입 세이프 Criteria API.
- **createStoredProcedureQuery(...)**: 저장 프로시저 호출.
- **unwrap(Class)**: 공급자(Hibernate) 고유 API 접근.
## **실무 패턴 미니 가이드**

- **업데이트**: find()로 **managed** 가져와 **필드만 수정** → 변경감지(Dirty Checking) 이용. merge()는 진짜 필요할 때만.
- **삭제**: find() → remove() (연쇄삭제 필요하면 cascade/orphanRemoval를 “애그리거트 내부”에만).
- **단건 조회**: “없을 수도 있다”면 getResultList().stream().findFirst() 패턴.
- **쿼리 관리**: 공용/복잡 JPQL은 @NamedQuery, DB 특화는 createNativeQuery + DTO 매핑.

---
## 💭 나의 추가적 생각/질문

[entitymanager.find와 createQuery로 구현한 findall의 차이](entitymanager.find와%20createQuery로%20구현한%20findall의%20차이.md) ^kbp5xd