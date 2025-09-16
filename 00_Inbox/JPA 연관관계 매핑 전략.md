---
type: 생각조각
status: inbox
source: 
creation_date: 2025-09-16
---
## **TL;DR**

- **기본값은 @JoinColumn(FK 컬럼)**: 대부분 상황(N:1, 1:1 주인)에 가장 단순·명확.
- **@JoinTable(연결 테이블)**은 특수/레거시/학습용. 실무에선 **연결 엔티티**로 분해가 정석.
- **1:N 단방향**이 꼭 필요할 때만 @JoinColumn(자식 FK 생성) 혹은 @JoinTable 고려.
- **N:N**은 학습용 @ManyToMany만 간단히, 실무는 **연결 엔티티**(N:1 + 1:N)로.

> 먼저 개념은 [JPA 연관관계 기초](JPA%20연관관계%20기초.md) 참고. 전파/삭제 정책은 [JPA 연관관계 생명주기 관리 (cascade ,orphanRemoval, persist & remove)](JPA%20연관관계%20생명주기%20관리%20(cascade%20,orphanRemoval,%20persist%20&%20remove).md)에서 다룹니다.

---

## **1) 선택 기준 / 의사결정 트리**

1. **관계 수**: N:1 / 1:N / 1:1 / N:N ?
2. **자식 테이블에 FK를 둘 수 있는가?**
    
    - 가능 → **@JoinColumn(권장 기본)**
    - 불가(레거시 제약/독립성 필요) → @JoinTable 또는 **연결 엔티티**

3. **탐색 방향**: 단방향로 충분? 자주 반대편 탐색 필요하면 **양방향 + 주인 하나**.
4. **추가 메타필드/이력 필요?** → **연결 엔티티 도입** 결정.
5. **제약/성능**: FK 제약, UNIQUE, 인덱스, 조인 수 증가 여부 점검.

---

## **2)** **@JoinColumn** **(FK) — 권장 기본**

### **N:1 양방향(표준)**

```java
// N측(자식) = 주인
@ManyToOne(fetch = LAZY)
@JoinColumn(name = "member_id")  // FK
private Member member;

// 1측(부모) = 거울
@OneToMany(mappedBy = "member")
private List<Order> orders = new ArrayList<>();
```

- 장점: 스키마 단순, 조인 1단계, FK/UNIQUE 제약 명확.

### **1:1 (의존 쪽 주인) + 공유 PK 옵션**

```java
// 일반 FK
@OneToOne(fetch = LAZY)
@JoinColumn(name = "delivery_id", unique = true) // UNIQUE로 1:1 강제
private Delivery delivery;

// 공유 PK(자식 PK = 부모 PK)
@OneToOne @MapsId
@JoinColumn(name = "order_id")
private Delivery delivery;
```

- **FK 위치**는 의존성/생명주기 기준으로 결정. 공유 PK는 정합성↑(조인 단순화) 대신 유연성↓.

### **1:N 단방향(지양, 필요 시)**

```java
@OneToMany
@JoinColumn(name = "parent_id") // 자식 테이블에 FK 생성
private List<Child> children = new ArrayList<>();
```

- 단점: 추가 UPDATE 가능(컬렉션 관리 비용). 가급적 **N:1 양방향**으로 모델링.

---

## **3)** **@JoinTable** **(연결 테이블) — 특수/레거시/학습용**

### **1:N 단방향을 꼭 강제해야 할 때(자식에 FK 두기 싫을 때)**

```java
@OneToMany
@JoinTable(
  name = "parent_child",
  joinColumns = @JoinColumn(name = "parent_id"),
  inverseJoinColumns = @JoinColumn(name = "child_id")
)
private List<Child> children = new ArrayList<>();
```

- 장점: 자식 테이블 **독립성 유지**(자식에 FK 無)
- 단점: 조인 1단계 증가, 삭제/고아 처리 정책 복잡. **연결 엔티티**가 더 안전한 경우 多.

### **N:N (학습용** **@ManyToMany)**

```java
@ManyToMany
@JoinTable(
  name = "category_item",
  joinColumns = @JoinColumn(name = "category_id"),
  inverseJoinColumns = @JoinColumn(name = "item_id")
)
private Set<Item> items = new HashSet<>();
```

- 실무에선 비권장: 추가 메타필드/감사/제약/삭제 정책에 취약 → **연결 엔티티**로 분해 권장.

---

## **4) 연결 엔티티로 분해 (실무 정석)**

```java
@Entity
class CategoryItem {
  @Id @GeneratedValue Long id;             // (선택) 서로그 PK
  @ManyToOne @JoinColumn(name = "category_id") Category category;
  @ManyToOne @JoinColumn(name = "item_id")     Item item;

  // 메타필드
  private int sortOrder;
  private LocalDate activeFrom;
}
```

- 장점: 메타필드 추가, 고아/삭제 정책 명시, 감사 용이, 제약/인덱스 세밀 제어.
- 추천 제약: (category_id, item_id) **UNIQUE**로 중복 방지.

---

## **5) 복합 키/복합 FK가 있는 경우**

### **복합 FK 매핑**

```java
@ManyToOne
@JoinColumns({
  @JoinColumn(name="order_id", referencedColumnName="order_id"),
  @JoinColumn(name="order_seq", referencedColumnName="order_seq")
})
private Order order;
```

### **ID 매핑 방식**

- **@EmbeddedId + @MapsId** (추천) 또는 **@IdClass**.
- 단, 복합키는 설계/테스트 복잡도↑ → 가능하면 **대리키(Long)** + 유니크 제약으로 단순화.

---

## **6) 트레이드오프 요약 표**

|**선택지**|**장점**|**단점**|**주 사용처**|
|---|---|---|---|
|@JoinColumn|단순, 조인 1단, 제약 명확|1:N 단방향에서 추가 UPDATE 가능|일반적인 N:1, 1:1|
|@JoinTable|자식 독립성, 레거시 수용|조인 증가, 삭제 정책 복잡|1:N 단방향 강제, 학습용 N:N|
|연결 엔티티|확장/감사/제약 유연|테이블/엔티티 추가|실무 N:N, 풍부한 관계 정보|

---

## **7) 네이밍 & 제약 팁**

- FK 컬럼: member_id, order_id (snake_case 일관)
- 연결 테이블: parent_child, category_item
- 1:1: FK 컬럼에 **UNIQUE** (또는 공유 PK)
- 인덱스: FK 컬럼에 인덱스 필수, 연결 테이블은 두 FK **복합 인덱스**

---

## **8) 안티패턴 체크리스트**

- 단순 케이스에 @JoinTable 남용 ❌
- N:N을 @ManyToMany로 실무 적용 ❌ (연결 엔티티로)
- 1:N 단방향을 기본값처럼 채택 ❌ (가능하면 N:1 양방향)
- 복합키를 PK로 남발 ❌ (대리키 + UNIQUE로 단순화)

---

## **함께 보기**

- 개념 기초: [JPA 연관관계 기초](JPA%20연관관계%20기초.md)
- 전파/고아 삭제: [JPA 연관관계 생명주기 관리 (cascade ,orphanRemoval, persist & remove)](JPA%20연관관계%20생명주기%20관리%20(cascade%20,orphanRemoval,%20persist%20&%20remove).md)
- 성능/실무 팁: [JPA 연관관계 실무 가이드 (성능, 안티패턴, 운영 팁)](JPA%20연관관계%20실무%20가이드%20(성능,%20안티패턴,%20운영%20팁).md)