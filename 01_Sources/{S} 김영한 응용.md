---
type: 소스
status: inbox
topics: 
source_url: "{{SOURCE}}"
author: 
creation_date: 2025-09-09
---
# 무제

## 📖 소스 요약 (Summary)

## **1) 쓰기/읽기 분리(CQRS Lite)**

- **원칙:** “쓰기와 읽기를 분리하자.”
- **커맨드(쓰기)**: 엔티티를 **반환하지 말고 ID만 반환**한다.
    → 후속 조회는 **쿼리 모델**(전용 조회)로 처리.
- **이유:** 변경 사이드이펙트 최소화, API 계약 단순화, 테스트 쉬움.

---

## **2) 트랜잭션**

- **쓰기와 테스트는 트랜잭션 필수**:
    @Transactional 경계 안에서만 JPA가 제대로 동작(쓰기 지연, flush, 영속성 컨텍스트 일관성).
    
- 테스트에서도 트랜잭션으로 격리/롤백 보장.
---

## **3) 연관관계 핵심**

- **“반드시 외래 키가 있는 곳을 연관관계의 주인으로 정해라.”**
- **양방향은 편의일 뿐**: 주인은 하나(FK 가진 쪽); 거울(mappedBy)은 **조회 전용**.
- **영속성 컨텍스트 동일성:** “식별자(PK)가 같으면 같은 엔티티로 인식한다.”
    
    → 같은 트랜잭션/퍼시스턴스 컨텍스트에서 **동일성(\==)** 보장.

---

## **4) DB 설계 가이드**

- **네이밍:** 소문자 + 스네이크(member_point) 권장.
- **1:1 매핑:** FK 위치는 **접근 빈도 높은 테이블**에 두자.
    
    예) Delivery보다 Order에서 Delivery를 더 자주 본다 → **Order에 FK(=delivery_id)**.
    
- **상속 매핑:**
    - 부모(추상 클래스) + 자식들(Book/Album/…)
    - 부모에 @Inheritance(strategy=...), @DiscriminatorColumn(name = "dtype")
        → 단일 테이블 전략 사용 시 **dtype**으로 자식 타입 구분.

- **FK를 꼭 걸어야 해?**
    - 돈과 관련되서 **정합성 최우선(금융/정산 등)인경우 ** → FK **걸기**.
    - **고(高)트래픽/가용성 우선**인경우 → FK 없이 **인덱스만**으로도 운영 가능(정합성 보완은 애플리케이션/배치/모니터링로).
        (조직 기준·SLA에 따라 결정.)

---

## **5) Enum 매핑**

- @Enumerated(EnumType.STRING)으로 사용
	- ORDINAL(숫자) 금지: **중간 값 추가 시 전체 밀림(대형 장애 포인트)**.

---

## **6) 엔티티 설계 원칙**

### **6-1) Setter 금지 & 의도 드러내기**

- **Setter를 가급적 열지 말자.**
    Setter 남발은 “변경점 추적 불가” 문제를 만든다.
    
- **의도 드러나는 메서드**로만 상태 변경:
    예) order.cancel(), orderItem.changeQuantity(…)
- 변경은 항상 **@Transactional 내부**에서.

### **6-2) 값 타입은 불변**

- 값 타입은 **불변(Immutable)** 으로 설계:
    @Setter 제거, **생성자/정적 팩토리로만** 초기화 → 변경은 **교체**로.
    
- 이점: 사이드이펙트 감소, 동시성 안전성 ↑.

### **6-3) 기본 생성자**

- JPA 스펙: 엔티티/임베디드에 **기본 생성자 public 또는 protected** 필요.
    → 보안·의미상 **protected 권장**.
    (리플렉션 생성 지원 목적)

### **6-4) 양방향 편의 메서드**

- “**주인(FK) 쪽 필드를 꼭 세팅**”해야 DB FK 갱신.

```java
public void addOrderItem(OrderItem item) {
    orderItems.add(item);   // 뷰(컬렉션)
    item.setOrder(this);    // ★ 주인(FK) 세팅
}
```

### **6-5) 컬렉션 초기화 & 재할당 금지**

- **필드에서 바로 초기화**:

``` java
private List<Order> orders = new ArrayList<>();
```

- null 안전, 하이버네이트 컬렉션 래핑과 충돌 방지.
- 이후 orders = new LinkedList<>() 같은 **재할당/Null 할당 금지**.

### **6-6) 스프링 부트 신규 네이밍 전략**

1. 카멜케이스 → 스네이크 (memberPoint → member_point)
2. .(점) → _(언더스코어)
3. 대문자 → 소문자

---

## **7) 로딩 전략과 N+1**

- **실무 기본:** 모든 연관관계 **LAZY**.
    
    (@ManyToOne, @OneToOne는 기본이 EAGER → 반드시 LAZY로 오버라이드)
    
- **N+1 문제:** JPQL로 N개 로우 조회 시, 연관 엔티티를 개별로 N번 추가 조회하는 현상.
- **해결:**
    - **fetch join**(JPQL)
    - **@EntityGraph**
    - **@BatchSize** (배치 페치)

---

## **8) 캐스케이드/고아 삭제 (짧게 요약)**

- **cascade**: 부모 동작을 자식에 전파(PERSIST/REMOVE/…/ALL).
- **orphanRemoval=true**: 컬렉션에서 제거되거나 FK 끊겨 **고아**가 되면 자식 **DELETE**.
- **언제 쓰나:** 애그리거트 내부, **부모에만 종속**되는 자식(예: Order↔OrderItem, Order↔Delivery).
    
    공유 엔티티(Member, Product 등)에는 **금지**.

---

## **9) 용어·동작 이해 (persist/remove/flush)**

- **persist**: “저장 예약(INSERT)” → flush/commit 때 실제 SQL.
    
    (IDENTITY 전략이면 즉시 INSERT 가능)
    
- **remove**: “삭제 예약(DELETE)” → flush/commit 때 SQL.
- **flush**: 1차 캐시 변경을 DB에 **동기화**(보통 commit 직전 자동).

---

## **10) 최종 체크리스트**

- 커맨드 핸들러는 **ID만 반환**(엔티티 반환 금지)
- **@Transactional** 경계 안에서만 쓰기/테스트
- **FK 있는 쪽 = 주인**(그쪽 필드만 바꾸면 됨)
- **LAZY 기본화**, N+1은 **fetch join/EntityGraph/BatchSize**
- **Enum은 STRING**, ORDINAL 금지
- **Setter 금지**, 의도 메서드로 변경
- **값 타입 불변**, 교체로 변경
- **컬렉션 필드 즉시 초기화**, 재할당 금지
- 1:1 FK는 **접근 빈도 높은 곳**에
- FK 사용 여부는 **도메인/운영 요구**로 결정(정합성 vs 가용성)
- **편의 메서드**로 양쪽 동기화(특히 주인/FK 세팅)
- 컨트롤러가 서비스를 무조건 거치는 설계x 
	- 다 서비스를 걸치면 그건 그거대로 문제.
	- 리포지토리에 간단한 회원정보 하나 뿌릴땐 
	- 회원 리포지 토리에 바로 회원
	- 서비스는 단순하게 레포지토리 위임할일밖에 없는데 모든걸 서비스를 타면 그것도 실용적으로 문제

## 💭 생각의 인큐베이터 (My Thoughts & Connections) 
- - [임베디드 값타입과 ENUM의 차이](../00_Inbox/임베디드%20값타입과%20ENUM의%20차이.md)
- - [assertThat(actual).isEqualTo(expected)란](../00_Inbox/assertThat(actual).isEqualTo(expected)란.md)
- [어노테이션 총정리(GPT)](../00_Inbox/어노테이션%20총정리(GPT).md)
- [[00_Inbox/데이터베이스에서의 표현vs 객체에서의 표현.md|데이터베이스에서의 표현vs 객체에서의 표현]]
- [[00_Inbox/인텔리제이 단축키.md|인텔리제이 단축키]]

