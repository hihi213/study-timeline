---
type: 생각조각
status: inbox
source:
creation_date: 2025-09-28
---

## 📜 원본 맥락

{{BLOCK_REFERENCE}}

---
## 정리

## **0) 해야할것

- **서비스 계층 @Transactional**로 읽기/쓰기 경계를 끝낸다.
	- 읽기는 readOnly=true 설정으로 불필요 작업방지
- **쓰기/읽기 분리(CQRS lite)**:
	- 커맨드(쓰기)는 **엔티티 반환 금지, ID만 반환**
	- 조회는 **DTO 전용 경로**
- **Dirty Checking**활용:
	- “**영속** 엔티티의 **필드 변경**하면 커밋 시 자동 UPDATE.” → 그래서 별도로 repository.save() 불필요.
- **연관관계 주인(실제 DB변경쪽)은 FK 가진 쪽**을 선택
	- 양방향이면 **한쪽만 주인**, 반대는 `mappedBy`. 
	- **편의 메서드**필수: 주인변경코드+ 반대쪽 동기화코드
- **로딩 전략**: 전부 **LAZY**로 두기
	- 필요 시 **fetch join / @EntityGraph / @BatchSize**. 로 최적화
- **N+1**회피하기: Fetch Join or @BatchSize 사용
	- N+1: **처음 1번의 쿼리**로 N개의 데이터를 가져왔는데, 그 N개의 데이터 각각에 대해 **추가 쿼리가 N번 더 발생**
	- **컬렉션 fetch join + 페이징 금지** : 데이터베이스의 페이징은 **결과 행(Row)의 개수**를 기준으로 동작하는데, **컬렉션 페치 조인은 데이터의 개수를 뻥튀기**하기 때문
- **equals/hashCode 규칙**
    └ **연관 포함 금지**, **식별자(또는 불변 비즈니스 키)만 포함**
    └ Lombok 사용 시 @EqualsAndHashCode(onlyExplicitlyIncluded = true) 등 명시
- **Aggregate 규칙준수**:
	- 내부 전용 자식만 cascade=ALL + orphanRemoval=true (공유 엔티티엔 금지).
- OSIV 기본 OFF 권장
	- OSIV: 영속성 컨텍스트의 뷰까지 확장
	- 서비스 내에서 모든 로딩을 끝내고 DTO로 반환
---

## **1) 트랜잭션 & 영속성 컨텍스트**

### **1-1. @Transactional 규칙**

- **쓰기/테스트에선 필수**: 지연쓰기·flush·1차 캐시 일관성은 **트랜잭션 내부**에서만 보장. 컨트롤러/서비스 밖(트랜잭션 밖)에선 아무일도 안일어남
- **읽기 최적화**: @Transactional(readOnly = true) → 스냅샷·더티체킹 생략 등 약간의 이점(벤더별 차).
- **동일한 이름의 다른 어노테이션 주의: org.springframework.transaction.annotation.Transactional 사용하기

> **AOP 한계(매우 중요)**
> **private/final 메서드**, **같은 클래스 내 자기 호출(self-invocation)** 에는 트랜잭션이 적용되지 않음.
> **서비스 public 메서드**에 선언하고, 내부 공용 로직은 별도 빈/메서드로 분리하기
### **1-2. 생명주기(요약)**
- `@Transactional` 코드 시작과 종료
	- 트랜잭션 시작: 새로운 **영속성 컨텍스트 열림**
		- **영속(Managed)**: `@Transactional`의 코드가 종료되지 않은 상태에서 `repository.save()`를 호출하거나, DB에서 `repository.find()`로 조회
	- 트랜잭션 종료: **flush → commit → 영속성 컨텍스트 close**.
		- **준영속(Detached)**: 과거에 영속 상태였지만, `@Transactional`의 코드가 종료되서 관리되지 않는 상태
- **비영속(Transient)**: new로 생성만 한 상태, JPA가 모름
- **삭제(Removed)**: `repository.delete()`를 호출하여, DB에서 삭제되기 위해 대기 중인 상태

### **1-3. Dirty Checking & save() 기준**

- **동작 조건**: (1) **현재 컨텍스트의 영속 엔티티**, (2) **트랜잭션 안** 변경, (3) **flush 시점** 스냅샷 비교.
- repository.**save() 불필요**: DB에서 조회한 **영속 엔티티의 값만 수정**했다면 자동으로 DB에 반영.
- repository.**save()/merge() 필요한 때**
    - **신규 엔티티 최초 저장**: save(= persist).
	    - 이때 자식은 **Cascade(PERSIST/ALL)** 로 전파하면 별도 저장작업 필요 없음
    - **준영속(detached)** 변경 반영: **merge** 또는 **다시 조회 후 변경**.
- **주의**: @Transactional(readOnly=true)에선 쓰기 최적화로 **업데이트가 안 나갈 수 있음**(벤더 차).

```
@Transactional
public void cancelOrder(Long id) {
    Order o = orderRepo.findById(id).orElseThrow();
    o.cancel();  // 상태만 바꾸면 됨
    // save() 불필요 — 커밋 시 UPDATE 자동
}
```

### **1-4. 운영 주의**

- **벌크 JPQL(update/delete)** 은 1차 캐시 **무시** → 실행 후 clear() 필요
- **동시성**: 민감 구간은 @Version(낙관적 락) 고려.
- **OSIV**: ON은 뷰까지 영속성 열어 편하지만 계층 침식 위험. **OFF 권장** (서비스에서 끝내고 컨트롤러에 LAZY 접근 금지).

---

## **2) 연관관계 매핑 원칙**

### **2-1. Owner / Inverse**

- **Owner(주인)**: **FK 가진 쪽**(DB 갱신 기준).
- **Inverse(거울)**: mappedBy="owner필드" → **조회 전용**(여기만 바꿔선 DB 안 바뀜).
- **규칙**: “**FK 있는 곳을 주인으로**.”

### **2-2. 안전한 기본 패턴**

- **N:1 양방향(표준)**
    - N측(자식): @ManyToOne(fetch = LAZY) @JoinColumn(...) **← 주인**
    - 1측(부모): @OneToMany(mappedBy = "...") **← 거울(컬렉션 뷰)**
- **1:1**: 의존/자식이 주인인 경우 흔함. 필요 시 @MapsId로 공유 PK.
- **N:N**: 학습용만. 실무는 **연결 엔티티**로 분해(N:1 + 1:N)하기

> **1:N 단방향** 보단 N:1 양방향으로 설계하기
### **2-3. 양방향 편의 메서드(반드시 한 쪽에서 FK도 맞춰주기)**

```java
public void addOrderItem(OrderItem oi) {
  orderItems.add(oi);   // 컬렉션(뷰)
  oi.setOrder(this);    // ★ 주인(FK) 갱신
}
public void setDelivery(Delivery d) {
  this.delivery = d;
  d.setOrder(this);
}
```

---

## **3) 로딩 전략 & N+1 대응**

### **3-1. 기본 로딩**

- @ManyToOne / @OneToOne: **기본 EAGER로 설정되어있음 -> LAZY로 변경 권장**.
- @OneToMany / @ManyToMany: 기본 LAZY.

### **3-2. N+1 회피 3종**

1. **fetch join (JPQL)**
    
    - **컬렉션 fetch join + 페이징 금지**(중복행·메모리 페이징).
    - **ToOne만 fetch join**하면 페이징 안전.

```sql
select o from Order o
  join fetch o.member
  join fetch o.delivery
where o.status = :status
```
    
2. **@EntityGraph**

```java
@EntityGraph(attributePaths = {"member","delivery"})
List<Order> findByStatus(OrderStatus s);
```

3. **배치 페치**(@BatchSize / default_batch_fetch_size)

```java
spring:
  jpa:
    properties:
      hibernate:
        default_batch_fetch_size: 200
```

### **3-3. 컬렉션 + 페이징 안전 패턴(두 단계)**

```java
// 1) 페이지 대상의 PK만
Page<Long> ids = orderRepo.findIdsByStatus(s, pageable);

// 2) IN 조회 + ToOne은 fetch join, 컬렉션은 배치 페치
List<Order> orders = orderRepo.findWithMemberDeliveryByIds(ids.getContent());
```

---

## **4) Aggregate 쓰기/삭제 규칙**

### **4-1. 언제 cascade=ALL, orphanRemoval=true를 쓰나**

- **✅ 소유관계일때 사용**: 부모 엔티티에게만 독점적으로 소유되어, 다른 곳에서는 참조되지 않고, 부모 없이는 존재 의미가 없는 자식엔티티에게 사용
- **❌ 공유 엔티티일땐 사용금지**.

```java
@OneToMany(mappedBy="order",
           cascade = CascadeType.ALL,
           orphanRemoval = true)
private List<OrderItem> orderItems = new ArrayList<>();
```

- **차이**
    - CascadeType.REMOVE: 부모 제거 시 자식 **제거 전파**
    - orphanRemoval=true: **관계만 끊어도** 자식 **DELETE**

### **4-2. 주의**

- 대량 삭제 전파는 락/성능 이슈 → **단계적 삭제/스케줄러/DB 제약** 병행.
- 소프트 삭제방법: @SQLDelete + @Where (조인/카운트 영향 주의).

---

## **5) 매핑 전략 & 스키마 팁**

- **기본은 @JoinColumn(FK)**: 단순·빠름·제약 명확.
- **@JoinTable**: 1:N 단방향 강제, 레거시 수용 등 특수 케이스.
- **연결 엔티티**: 실무 N:N 정석(메타필드·감사·UNIQUE·인덱스 유연).

**네이밍/제약**

- FK 컬럼: member_id, order_id (snake_case 일관).
- 연결 테이블: parent_child, category_item.
- 1:1: FK 컬럼 **UNIQUE**(또는 공유 PK).
- 인덱스: FK 컬럼, 연결 테이블은 (fk1, fk2) **복합 인덱스**.

---

## **6) ID 전략 & 쓰기 흐름**

- **IDENTITY**: 키 생성 위해 **즉시 INSERT**(조기 flush) → **묶음 쓰기 불리**.
- **SEQUENCE**(+ allocationSize 튜닝) 권장: INSERT **뭉치기** 유리(대량 쓰기).
- 연관 저장은 보통 **부모만 persist**(cascade 전파) → INSERT 순서 안정화.

---

## **7) 테스트 & 진단**

- **단위/슬라이스**: @DataJpaTest(+ H2 등 임베디드).
- **실DB 성능 검증**: 대량/인덱스/플랜은 실제 DB로.
- **로깅**

```
spring.jpa.show-sql=false
logging.level.org.hibernate.SQL=debug
logging.level.org.hibernate.type.descriptor.sql=trace  # 바인딩 파라미터까지
```

---
## **8) 유용 스니펫**

**ToOne만 fetch join(페이징 안전)**

```
select o from Order o
 join fetch o.member
 join fetch o.delivery
where o.status = :s
```

**전역 배치 페치**

```
spring:
  jpa:
    properties:
      hibernate:
        default_batch_fetch_size: 200
```

**안전한 저장 흐름**

```
Order o = new Order();
OrderItem i = new OrderItem();
o.addOrderItem(i);   // 컬렉션 + FK 동시 갱신

Delivery d = new Delivery();
o.setDelivery(d);

em.persist(o);       // cascade=ALL → 그래프 전체 INSERT
```

**벌크 연산 후 동기화**

```
int updated = em.createQuery("update Product p set p.price = p.price * 1.1")
                .executeUpdate();
em.clear(); // 1차 캐시 무시했으므로 반드시 동기화
```

**낙관적 락**

```
@Version
private Long version;
```

---

## **9) 빠른 의사결정 트리**

1. **관계 수**: N:1 / 1:N / 1:1 / N:N ?
2. **자식 테이블에 FK 가능?**
	- 가능: **@JoinColumn 기본**
	- 불가: **@JoinTable/연결 엔티티**
3. **탐색 방향**: 단방향으로 충분?
	- 반대 탐색도 잦으면 **양방향 + 주인 하나**
4. **메타필드·감사 필요?** → **연결 엔티티**
5. **성능/페이징**: 컬렉션 fetch join은 **페이징 금지** → **두 단계 조회/배치 페치**

---
## 💭 나의 추가적 생각/질문