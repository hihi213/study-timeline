---
type: 생각조각
status: inbox
source: 
creation_date: 2025-09-16
---

## **TL;DR**

- **cascade**: 부모에 한 동작을 **자식에도 전파** (PERSIST/REMOVE/MERGE/REFRESH/DETACH/ALL).
- **orphanRemoval=true**: **관계가 끊겨 고아가 되면 자식 엔티티를 DELETE**.
- 적용 원칙: **애그리거트 내부**, **공유되지 않는 자식**에만.
- **혼동 금지**: _JPA cascade_ ≠ _DB ON DELETE CASCADE_. 보통 **둘 중 하나만** 쓴다.

> 개념 기초는 [JPA 연관관계 기초](JPA%20연관관계%20기초.md), 매핑 선택은 [JPA 연관관계 매핑 전략](JPA%20연관관계%20매핑%20전략.md) 참고.
> 실무 성능/안티패턴은 [JPA 연관관계 실무 가이드 (성능, 안티패턴, 운영 팁)](../02_Notes/JPA%20연관관계%20실무%20가이드%20(성능,%20안티패턴,%20운영%20팁).md)에서 정리.

---

### 생명주기(요약)
- `@Transactional` 코드 시작과 종료
	- 트랜잭션 시작: 새로운 **영속성 컨텍스트 열림**
		- **영속(Managed)**: `@Transactional`의 코드가 종료되지 않은 상태에서 `repository.save()`를 호출하거나, DB에서 `repository.find()`로 조회
	- 트랜잭션 종료: **flush → commit → 영속성 컨텍스트 close**.
		- **준영속(Detached)**: 과거에 영속 상태였지만, `@Transactional`의 코드가 종료되서 관리되지 않는 상태
- **비영속(Transient)**: new로 생성만 한 상태, JPA가 모름
- **삭제(Removed)**: `repository.delete()`를 호출하여, DB에서 삭제되기 위해 대기 중인 상태
## **1) cascade 한눈에**

```java
@OneToMany(mappedBy="order",
           cascade = CascadeType.ALL,   // PERSIST/REMOVE/MERGE/REFRESH/DETACH
           orphanRemoval = true)        // 고아 삭제
private List<OrderItem> orderItems = new ArrayList<>();
```

### **종류와 의미**

|**타입**|**전파되는 동작**|**핵심 용도**|
|---|---|---|
|PERSIST|부모 persist → 자식 INSERT|“부모 저장하면 자식도 같이 저장”|
|REMOVE|부모 remove → 자식 DELETE|“부모 삭제하면 자식도 같이 삭제”|
|MERGE|부모 merge → 자식도 병합|분리(detached) 그래프 병합|
|REFRESH|부모 refresh → 자식도 리프레시|드묾|
|DETACH|부모 detach → 자식도 비영속화|드묾|
|ALL|위 전부|애그리거트 내부에서 일괄 관리|

**권장 관점**

- 집합(Aggregate) 루트가 내부 구성요소를 **단독 소유**할 때 ALL (+ orphanRemoval=true).
- 여러 곳에서 **공유**될 수 있는 엔티티에 REMOVE/ALL 금지.

---

## **2) orphanRemoval는 뭐가 다른가?**

- **의미**: 부모 컬렉션에서 자식을 **빼거나**, 1:1/N:1 관계에서 **FK를 끊어 고아**가 되면 **그 자식 자체를 DELETE**.
- **CascadeType.REMOVE와의 차이**
    - REMOVE: **부모 자체를 제거할 때** 자식 삭제 전파.
    - orphanRemoval: **관계를 해제**해도 자식 삭제.

> 따라서 **자식이 절대 공유되지 않을 때만** 사용 (공유 데이터가 의도치 않게 삭제될 수 있음).

---

## **3) 언제 cascade를 써야 하나?**

> 즉, “각 엔티티를 하나씩 persist 해야 하는 번거로움”을 줄여 주는 게 캐스케이드.

### **✅ 사용**

- 부모 엔티티에게만 독점적으로 소유되어, 다른 곳에서는 참조되지 않고, 부모 없이는 존재 의미가 없는 자식엔티티에게 사용

### **❌ 비권장/금지**

- @ManyToOne(자식→부모)에 cascade: **부모는 독립 생명주기**인 경우가 보통이므로 위험.
- Member, Product, Category 처럼 여러 곳에서 **공유**되는 엔티티.

---

## **4) persist / remove 정확히 알기**

### **EntityManager.persist(entity)** : 새로 저장 예약

- 새 엔티티를 **영속성 컨텍스트(1차 캐시)에 등록**.
- 보통 **flush/commit 시점**에 INSERT SQL 발생.
- Cascade.PERSIST(또는 ALL)이면 **자식도 함께 영속 등록**.
- **주의**: GenerationType.IDENTITY(AUTO_INCREMENT)는 키 생성을 위해 **즉시 INSERT**가 나갈 수 있음.

### **EntityManager.remove(entity)** : 삭제 예약

- 관리 중 엔티티를 **삭제 상태로 마크**.
- **flush/commit 시점**에 DELETE SQL 발생.
- Cascade.REMOVE(또는 ALL)이면 **자식도 함께 삭제**.
- orphanRemoval=true면 **관계 해제만 해도 자식 삭제**.

---

## **5) 함께 알아두면 좋은 흐름**

### **엔티티 상태 전이**

- **Transient**(순수 객체) → persist → **Managed**(영속)
- **Managed** → remove → **Removed**
- **Detached**(분리) → merge → **Managed**

### **flush**
- SQL은 명령 즉시 DB반영이아니라 flush/commit 때 SQL**이 나간다
- 영속성 컨텍스트 변경 내용을 **DB와 동기화**(SQL 전송).
- 보통 **트랜잭션 커밋 직전 자동** 호출. 쿼리 실행 전 강제 호출될 수도 있음.

### **Spring Data JPA** save(...)

- 새 엔티티(id 없음): 내부적으로 **persist**.
- 기존/분리 엔티티(id 있음): **merge 성격** → 원치 않는 UPDATE가 생길 수 있음.
- 연관 저장까지 기대한다면 **부모 쪽 cascade**가 켜져 있어야 함.

---

## **6) 예시 코드 & 편의 메서드**

```java
@Entity
class Order {

  @OneToMany(mappedBy = "order",
             cascade = CascadeType.ALL,
             orphanRemoval = true)
  private List<OrderItem> orderItems = new ArrayList<>();

  @OneToOne(mappedBy = "order",
            cascade = CascadeType.ALL,
            orphanRemoval = true)
  private Delivery delivery;

  // 양방향 편의 메서드: 컬렉션(뷰) + 주인(FK)을 동시에 맞춤
  public void addOrderItem(OrderItem oi) {
    orderItems.add(oi);   // 뷰 갱신
    oi.setOrder(this);    // ★ 주인(FK) 갱신 (안 하면 관계 미저장)
  }

  public void setDelivery(Delivery d) {
    this.delivery = d;
    d.setOrder(this);     // 1:1도 동일
  }
}
```

**사용 흐름**

```java
Order o = new Order();
OrderItem a = new OrderItem();
o.addOrderItem(a);

Delivery d = new Delivery();
o.setDelivery(d);

// cascade=ALL 덕분에 한 번의 persist로 그래프 저장
em.persist(o);

// 컬렉션에서 자식 제거 → orphanRemoval=true 면 자식 DELETE
o.getOrderItems().remove(a);

// 부모 삭제 → Cascade.REMOVE로 자식도 함께 삭제
em.remove(o);
```

---

## **7) 트러블슈팅 / 함정**

- **관계만 바꾸고 편의 메서드로 FK 주인 필드를 갱신하지 않음** → FK 갱신 누락(행이 안 생기거나 고아 발생).
    → 항상 **편의 메서드**로 양쪽을 동기화.
    
- **EAGER 기본값 방치** → 예상치 못한 N+1.
    → **LAZY 권장**, 필요 시 fetch join / @EntityGraph / @BatchSize.
    
- **@JoinTable + orphanRemoval 오해** → 컬렉션에서 제거하면 **연결만** 끊는 것이 아니라 **자식 자체 DELETE**일 수 있음.
    → 자식이 공유될 수 있으면 사용 금지.
    
- **JPA cascade와 DB ON DELETE CASCADE 혼용** → 동작이 겹쳐 예측 어려움.
    → 보통 **한쪽만** 선택.
    
- **대규모 삭제 전파**(cascade REMOVE) → 대량 DELETE SQL로 락/성능 이슈 가능.
    → 실제 데이터 양과 인덱스/외래키 제약 고려. 필요하면 **명시적 단계 삭제** 설계.

---

## **8) 체크리스트**

- 자식이 **부모에만 종속**되는가? → cascade=ALL, orphanRemoval=true 고려
- 자식이 **공유**되는가? → cascade REMOVE/ALL, orphanRemoval 금지
- **편의 메서드**로 양쪽 동기화하고 있는가?
- 로딩 전략은 **LAZY**로 기본 세팅했는가?
- save(...)가 **merge**로 오동작하지 않는가? (가능하면 명시적 persist 흐름)
- 대량 전파 삭제 시 락/성능 영향 점검했는가?

## **함께 보기**

- 개념 기초: [JPA 연관관계 기초](JPA%20연관관계%20기초.md)
- 개념 심화: [[JPA_업데이트·동기화_흐름(persist_remove_flush_commit)|JPA_업데이트·동기화_흐름(persist_remove_flush_commit)]]
- 매핑 선택: [JPA 연관관계 매핑 전략](JPA%20연관관계%20매핑%20전략.md)
- 실무 가이드/성능: [JPA 연관관계 실무 가이드 (성능, 안티패턴, 운영 팁)](../02_Notes/JPA%20연관관계%20실무%20가이드%20(성능,%20안티패턴,%20운영%20팁).md)
