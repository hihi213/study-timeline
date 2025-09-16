---
type: 생각조각
status: inbox
source: 
creation_date: 2025-09-16
---

# **JPA 연관관계 기초**

## **TL;DR**

> **FK 있는 쪽 = 주인(owner)** 
> **mappedBy = 거울(inverse)**
> 단방향은 한쪽만 참조
> 양방향은 둘 다 참조하되 **주인은 하나만**.

- **객체 참조**와 **DB FK**는 독립. 객체는 필드 참조, DB는 FK 컬럼_으로 연결. 
- DB엔 “양방향 참조”가 없음. **역방향은 스키마가 아니라 조회(JOIN) 문제**.
- 연관관계는 보통 **N측(자식)** 이 FK를 가지며 **주인**이 됨. (1:1은 의존/자식이 주인인 경우가 많음)

---

## **1) 객체 vs DB 관점 한 줄 정리**

- **객체(도메인)**: 다른 엔티티를 **필드(참조)** 로 들고 다님. (order.setMember(member))
- **DB(스키마)**: **FK 컬럼**으로만 관계를 표현. 역방향은 **JOIN으로 조회**할 뿐.
- 따라서 **객체의 참조 방향은 설계 선택**이며, **DB의 FK 위치는 물리 제약**임.
- [데이터베이스에서의 표현vs 객체에서의 표현](데이터베이스에서의%20표현vs%20객체에서의%20표현.md)

---

## **2) 주인(owner) / 거울(inverse) 이해**

- **주인(Owner)**: **FK를 가진 쪽**. JPA가 **INSERT/UPDATE** 할 때 이 필드를 기준으로 FK를 갱신.
- **거울(Inverse)**: 반대편 **조회 전용 뷰**. mappedBy="주인측 필드명" 으로 표시. 이쪽만 바꿔선 DB 안 바뀜.
- **규칙**: “**FK가 있는 곳을 연관관계의 주인으로** 정해라.”

---

## **3) 관계별 기본 매핑 레시피**

### **3-1. N:1 양방향 (가장 흔한 표준 패턴)**

```java
// N측(자식) = 주인(FK 보유)
@ManyToOne(fetch = LAZY)
@JoinColumn(name = "member_id")
private Member member;

// 1측(부모) = 거울(조회용)
@OneToMany(mappedBy = "member")
private List<Order> orders = new ArrayList<>();
```

- 읽기엔 양방향이 편하지만, **DB 반영은 주인(자식)만** 가능.

---

### **3-2. 1:N 단방향 (가능하면 지양)**

```java
@OneToMany
@JoinColumn(name = "parent_id") // 자식 테이블에 FK 생성
private List<Child> children = new ArrayList<>();
```

- 내부적으로 **UPDATE 추가**가 발생할 수 있어 비효율.
    → **대안**: 보통 **N:1 양방향**으로 모델링.

---

### **3-3. 1:1 (의존 쪽이 주인인 경우가 일반적)**

```java
// 의존/자식 = 주인(FK 보유)
@OneToOne(fetch = LAZY)
@JoinColumn(name = "delivery_id")
private Delivery delivery;

// (심화) 공유 PK 패턴
@OneToOne
@MapsId
@JoinColumn(name = "order_id")
private Delivery delivery;
```

- 누가 FK를 들고 있을지 **도메인 의존 방향**과 **생명주기** 기준으로 결정.

---

### **3-4. N:N (학습용 ManyToMany / 실무는 연결 엔티티)**

```java
// 실무 권장: 연결 엔티티로 분해 (N:1 + 1:N)
class CategoryItem {
  @ManyToOne @JoinColumn(name = "category_id") Category category;
  @ManyToOne @JoinColumn(name = "item_id")     Item item;
  // 메타필드(순서/기간/생성자 등) 추가 가능
}
```

- @ManyToMany 는 빠르지만 확장성/제약/감사에 취약 → **연결 엔티티** 권장.

---

## **4) 방향(단/양방향) 선택 가이드**

- **단방향만**으로도 저장/조회는 충분히 가능. 시작은 단방향으로 단순하게.
- **양방향**은 “반대편에서 탐색이 자주 필요”할 때 추가.
    
    단, **주인은 하나**이며 **거울(mappedBy)** 은 **조회 전용**임을 잊지 말 것.

---

## **5) 양방향 편의 메서드 패턴 (필수 습관)**

> 주인(FK) 쪽 필드를 세팅하지 않으면 **DB FK가 갱신되지 않음**. -> 관계가 저장되지 않음

```java
// Order(부모) 쪽 예시
public void addOrderItem(OrderItem item) {
  orderItems.add(item);   // 뷰(컬렉션) 갱신
  item.setOrder(this);    // 주인(FK) 갱신 ★
}

public void setDelivery(Delivery delivery) {
  this.delivery = delivery;
  delivery.setOrder(this); // 1:1도 동일
}
```

- 한 메서드 호출로 **컬렉션 쪽(뷰)** 과 **주인 쪽(FK)** 을 **동시에** 일관된게 맞춰준다.

---

## **6) 기본 어노테이션 한 줄 요약**

- @ManyToOne : 보통 **N측(자식)** 에서 선언, **주인**. (기본 EAGER → 실무 **LAZY 권장**)
- @OneToMany(mappedBy="...") : **거울(조회)**. 컬렉션 뷰.
- @OneToOne : 의존/자식 쪽이 주인인 경우가 흔함. 필요시 @MapsId 로 공유 PK.
- @ManyToMany : 학습용. 실무는 **연결 엔티티**로 분해.
- @JoinColumn(name="...") : **FK 컬럼 지정**(= 여기가 주인).
- mappedBy="..." : **FK는 저쪽 필드**(= 난 거울).

---

## **7) 빠른 체크리스트**

- **FK 가진 쪽이 주인**으로 설정되어 있는가?
- 양방향이라면 **한쪽만 주인**, 반대는 mappedBy 인가?
- 자주 탐색되는 방향만 **양방향**으로 열었는가?
- **편의 메서드**로 양쪽을 항상 동기화하는가?
- @ManyToOne/@OneToOne 은 **LAZY**로 명시했는가?

---

## **함께 보기**

- 다음 단계: **매핑 선택/트레이드오프** → [JPA 연관관계 매핑 전략](../02_Notes/JPA%20연관관계%20매핑%20전략.md)
- 생명주기/전파(cascade, orphanRemoval) → [JPA 연관관계 생명주기 관리 (cascade ,orphanRemoval, persist & remove)](../02_Notes/JPA%20연관관계%20생명주기%20관리%20(cascade%20,orphanRemoval,%20persist%20&%20remove).md)
- 성능/안티패턴/실무 팁 → [JPA 연관관계 실무 가이드 (성능, 안티패턴, 운영 팁)](../02_Notes/JPA%20연관관계%20실무%20가이드%20(성능,%20안티패턴,%20운영%20팁).md)

> 파일 이름은 취향대로 바꿔도 됩니다. 위 링크명은 이후 파일 만들 때 맞춰 주세요!