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
    - 데이터 변경하는 service에 그래서 트랜잭션널 어노테이션있어야
- @Transactional은 두가지 있는데 spring제공하는걸로 사용하기 ^h0d1r6
	- 조회는 @Transactional(readOnly=true)로 써서 더 최적화 할수있으니 true키기
		- 데이터를 변경할 때 필요한 여러 복잡한 작업들을 **생략** [[00_Inbox/@Transactional(readOnly)를 키면 일어나는일.md|@Transactional(readOnly)를 키면 일어나는일]]
	- 클래스에 @Transactional하고 매서드에 @Transactional(readOnly = true)해서 조회만 옵션을 켜준다거나 그 반대도 가능
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
- 아이디 Unique로 설정해서 DB가 최후에 막을수 있도록
	- 두 명의 사용자가 거의 동시에 같은 이름으로 가입을 요청할 때, 서비스 로직이 중복을 검사하는 시점(SELECT)과 실제 데이터를 저장하는 시점(INSERT) 사이에 아주 짧은 시간적 틈이 있다. 이 틈 때문에 서비스 로직의 방어는 뚫릴 수 있습니다.
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
    //     이 동작만으로는 SQL이 발생하지 않는다(DB 미변경)
    orderItems.add(item);   // 하지만 DB단계가 아닌 객체 단계 메모리 상에서 Order ↔ OrderItem의 일관성 맞추기 위해 추가
    
    //실제 DB변경관련 메소드
    item.setOrder(this);    // "`OrderItem` 객체인 item안의 `order` 필드에, 지금 이 `Order` 객체(this)를 넣어준다.
    //이때의 this는 이 메서드를 호출한 Order객체 자신
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

### 6-7) 의존성주입
- 스프링필드주입말고 final+ 룸북으로 생성자 주입을 쓰자
	![**D) 롬복으로 생성자 주입 (최종권장)**](../00_Inbox/의존성주입방식비교.md#**D\)%20롬복으로%20생성자%20주입%20(최종권장)**)
---
### 6_8 엔티티에 비즈스 로직을 두는경우(도메인 주도 설계)

서비스 계층 같은 외부에서 엔티티의 데이터를 꺼내어 수정하고 다시 저장하는 방식이 아니라, **엔티티가 스스로 자신의 상태를 변경하는 메서드를 내부에 구현**하라는 의미

- **엔티티(Entity)**:
    
    1. 자신의 데이터(상태)를 가집니다. (예: `stockQuantity`)
    2. 자신의 데이터를 변경하는 **비즈니스 로직(행위)을 메서드로 직접 포함**합니다. (예: `addStock(int quantity)`)
    3. Setter를 무분별하게 열어두기보다, 의미 있는 메서드를 통해 상태 변경을 제어합니다.
        
- **서비스(Service)**:
    
    1. 트랜잭션 관리나 여러 도메인(엔티티)을 엮어주는 **조율자(Orchestrator)** 역할을 합니다.
    2. 직접적인 비즈니스 계산보다는 엔티티에 "요청"하는 역할을 합니다. (예: `item.addStock(10);`)

이 방식은 관련 데이터와 로직이 한곳에 뭉쳐있어 **응집도**가 높고, 코드를 재사용하거나 테스트하기 용이하며, 복잡한 비즈니스 로직을 체계적으로 관리할 수 있게 해줍니다

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
## 10) TEST
- `assertThrows(예외, 람다)` 사용, 람다를 실행했을 때 지정한 예외가 발생하지 않으면 테스트가 실패한다
- fail
- [[00_Inbox/스프링test정리.md|스프링test정리]]
## **11) 최종 체크리스트** ^ifx69f

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

> **persist 순간, JPA는 캐시 키로 쓸 PK가 필요해서 ID를 즉시 확보해 엔티티에 채워 넣는다.**
> 전략에 따라 “바로 INSERT(ID 받아오기)”(IDENTITY) 혹은 “키만 미리 땡김”(SEQUENCE/TABLE).

## 💭 생각의 인큐베이터 (My Thoughts & Connections)
- - [임베디드 값타입과 ENUM의 차이](../00_Inbox/임베디드%20값타입과%20ENUM의%20차이.md)
- - [assertThat(actual).isEqualTo(expected)란](../00_Inbox/assertThat(actual).isEqualTo(expected)란.md)
- [어노테이션 총정리(GPT)](../00_Inbox/어노테이션%20총정리(GPT).md)
- [[00_Inbox/데이터베이스에서의 표현vs 객체에서의 표현.md|데이터베이스에서의 표현vs 객체에서의 표현]]
- [[00_Inbox/인텔리제이 단축키.md|인텔리제이 단축키]]
- [[00_Inbox/JPQL.md|JPQL]] ^4h4frx
- [[00_Inbox/매서드에 배열로 받되 몇개 받을지 지정안해도 되는 문법_가변인자.md|매서드에 배열로 받되 몇개 받을지 지정안해도 되는 문법_가변인자]]
- [[00_Inbox/향상된 for문(for-each)루프.md|향상된 for문(for-each)루프]]

