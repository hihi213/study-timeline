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
### **2-1) Dirty Checking & save() 호출 기준**

> **핵심:** JPA에서는 **영속(Managed)** 엔티티의 **필드만 바꾸면** JPA가 알아서 업데이트 쿼리를 DB에 보낸다.
> 정확히는 트랜잭션 끝(= flush/commit)에 **Dirty Checking**으로 **UPDATE SQL이 자동**으로 나간다.
> → 변경 시 **별도 repository.save() 호출이 필요 없다**(특수 케이스 제외).

#### Repository.save()가 필요없는경우

- DB에서 **조회해 온 엔티티(영속)** 를 **수정만** 할 때

```java
@Transactional
public void cancelOrder(Long orderId) {
    Order order = orderRepository.findById(orderId).orElseThrow();
    order.cancel(); // 내부에서 this.status = CANCEL; + orderItems.forEach(oi -> oi.addStock(...));
    // save() 불필요 — 커밋 시 JPA가 UPDATE 자동 실행
}
```

#### 언제 Repository.save()가 필요?

- **새로 만든 엔티티(비영속)** 를 **처음 저장**할 때 → persist
    - 보통 **애그리거트 루트**만 save()하고, 자식은 **Cascade(PERSIST/ALL)** 로 전파
- **준영속(detached)** 엔티티의 변경을 **반영**할 때 → merge(Spring Data JPA의 save가 처리) 또는 **재조회 후 수정**

#### **엔티티 생명주기(요약)**

- **비영속(Transient)**: new로 생성만 한 상태, JPA가 모름
- **영속(Managed)**: `repository.save()`를 호출하거나, DB에서 `repository.find()`로 조회한 엔티티의 상태.
- **준영속(Detached)**: 과거에 영속 상태였지만, 영속성 컨텍스트(병원)가 닫히는 등 관리 범위에서 벗어난 상태.
- **삭제(Removed)**: `repository.delete()`를 호출하여, DB에서 삭제되기 위해 대기 중인 상태.

#### **Dirty Checking 동작 조건**

- **영속 상태** 이어야 함(보통 findById로 조회)
- **트랜잭션 안**에서 변경 (@Transactional)
- **flush 시점**(대개 커밋 직전)에 스냅샷과 비교해 변경 필드만 UPDATE 생성
- @Transactional(readOnly = true)에선 **수정 금지/최적화**로 업데이트가 나가지 않음(벤더 구현 주의)

#### **주의사항**

- **벌크 JPQL(update/delete)** 은 1차 캐시를 **무시** → 실행 후 clear() 필요
- **동시성** 민감 구간은 @Version(낙관적 락) 고려
- 트랜잭션 밖/컨트롤러 계층에서 값만 바꿔도 **아무 일도 안 일어남**

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

### **6-9) 생성 메서드(정적 팩토리) – 생성 지점 단일화**

> 목적: **객체 생성·초기화 로직을 한 곳에 모아** 규칙 변경 시 그 메서드만 고치면 되게 하자.
- [[00_Inbox/객체를 생성할때 생성시점을 메서드화해서 생성시점을 단일화 하자.md|객체를 생성할때 생성시점을 메서드화해서 생성시점을 단일화 하자]]
- 이렇게 생성지점을 단일화했는데 다른곳에서 New로 만들면 나중에 필드/검증/연관 세팅이 흩어져 유지보수가 힘들어짐
- 그래서 Proctected 기본생성자를 선언해주면 다른곳에서 new로 생성할때 컴파일에러가 나서 막아준다
	- lombook으로 편하게 생성가능
	- @NoArgsConstructor(access = AccessLevel.PROTECTED)

## **7) 로딩 전략과 N+1**

- **실무 기본:** 모든 연관관계 **LAZY**.
    (@ManyToOne, @OneToOne는 기본이 EAGER → 반드시 LAZY로 오버라이드)
- **N+1 문제:** JPQL로 N개 로우 조회 시, 연관 엔티티를 개별로 N번 추가 조회하는 현상.
- **해결:**
    - **fetch join**(JPQL)
    - **@EntityGraph**
    - **@BatchSize** (배치 페치)

## **8) 캐스케이드/고아 삭제**

### **8-0. 한 줄 정의**
- 잘 모르면 처음엔 쓰지 말자. 나중에 리펙토링할때 써라
- cascade = CascadeType.ALL **=** PERSIST + MERGE + REMOVE + REFRESH + DETACH 전파

    → **부모에 한 JPA 연산이 자식에도 그대로 적용**.

---

### **8-1. 언제 쓰나 (권장 기준)**

- **프라이빗 오너(Private Owner)**: 자식이 **그 부모에서만** 참조됨
    - 다른곳에서 자식을 참조x일때
- **수명주기 동일**: 부모 생성/삭제 시 자식도 **항상 함께** 생성/삭제
- 위 두 조건이면 보통 cascade = ALL + 필요 시 orphanRemoval = true

> **체크리스트**
> [ ] 자식이 **부모 전용**인가?
> [ ] **부모와 함께** 생성/삭제되는가?
> [ ] 부모 컬렉션에서 빠지면 **삭제가 규칙**인가? → 그러면 orphanRemoval = true
> [ ] 자식을 다른 곳에서 **재사용/독립 저장**하나? → 그렇다면 **cascade 금지** ->별도의 Repository생성해서 persist

---

### **8-2. 언제 피하나**

- 자식을 **여러 애그리거트/도메인에서 공유**(예: Member, Product)
- 삭제 전파가 위험하거나, 대형 그래프에 **성능/트랜잭션 리스크**
- **@ManyToOne 쪽에 무지성 cascade** (부모까지 의도치 않게 persist/remove)

---

### **8-3. 자동으로 되는 것 (예:** Order ->OrderItem, Delivery)

```java
@OneToMany(mappedBy="order", cascade = CascadeType.ALL, orphanRemoval = true)
private final List<OrderItem> orderItems = new ArrayList<>();

@OneToOne(fetch = LAZY, cascade = CascadeType.ALL)
@JoinColumn(name = "delivery_id")
private Delivery delivery;
```

- **PERSIST**: save(order) 한 번으로 자식들도 INSERT
- **MERGE**: 분리된 그래프 merge(order) 시 자식 변경도 병합
- **REMOVE**: remove(order) 시 자식들도 DELETE
- **REFRESH/DETACH**: 부모에 맞춰 자식도 갱신/분리

---

### **8-4. 자동이** 아닌것

- **컬렉션에서 제거 ≠ DB 삭제**
    → orphanRemoval = true일 때만 “부모와 단절된 자식”을 자동 DELETE
- **DB의 ON DELETE CASCADE와 다름**
    → JPA의 **연산 전파**일 뿐, DB 제약/트리거와 별개

---

### **8-5. 저장 패턴(생성 지점 단일화 + 전파 활용)**

```Java
@Transactional
public Long placeOrder(Member m, Delivery d, List<OrderItem> items) {
  Order o = Order.placeOrder(clock, m, d, items); // 정적 팩토리에서 검증/초기화/양방향 동기화
  orderRepository.save(o);                        // cascade로 자식까지 함께 persist
  return o.getId();
}
```

---

### **8-6. 실무 팁**

- 초반엔 **보수적으로(미사용)** 시작 → “**프라이빗 + 수명 동일**”이 **명확**해지면 ALL 도입
- 전파 범위가 과할 땐 **선별 전파**: cascade = {PERSIST, REMOVE} 등만 사용
- 삭제 의도가 도메인 규칙이면 orphanRemoval = true로 **“컬렉션에서 빠지면 삭제”**를 모델링

---

### **8-7. 결론**

> **“프라이빗 + 수명 동일”**일 때만 **Cascade**.
> 그 외에는 **명시적 save/remove**가 안전하다.

---

## **9) 용어·동작 이해 (persist/remove/flush)**

- **persist**: “저장 예약(INSERT)” → flush/commit 때 실제 SQL.

    (IDENTITY 전략이면 즉시 INSERT 가능)

- **remove**: “삭제 예약(DELETE)” → flush/commit 때 SQL.
- **flush**: 1차 캐시 변경을 DB에 **동기화**(보통 commit 직전 자동).

---
## 10) TEST
- `assertThrows(예외, 람다)` 사용, 람다를 실행했을 때 지정한 예외가 발생하지 않으면 테스트가 실패한다
- **가장 좋은 테스트는 “도메인(엔티티) 단위 테스트”**다.
    DB·스프링 컨텍스트 없이 **순수 자바로 메서드 하나하나 검증**하면 더 빠르고, 실패 원인도 명확하다. (**Spring 띄우지 말고** JUnit만으로 테스트)
- **통합 테스트는 “연결이 맞는지” 확인용**이다.
    여러 엔티티·리포지터리·트랜잭션을 **엮어서 동작**을 볼 때 의미가 있다.

- [[00_Inbox/스프링test정리.md|스프링test정리]]
## **11) 최종 체크리스트**

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
- **Cascade는 ‘프라이빗 + 수명 동일’ 자식에만**(예: OrderItem/Delivery), 그 외엔 금지
- 필요 시에만 **선별 전파**(PERSIST/REMOVE), 무지성 ALL 지양
- **orphanRemoval=true**는 부모 컬렉션에서 빠지면 **삭제가 도메인 규칙**일 때만
- 생성은 **정적 팩토리**로 단일화, save(order) 한 번 + Cascade로 일괄 persist
> **persist 순간, JPA는 캐시 키로 쓸 PK가 필요해서 ID를 즉시 확보해 엔티티에 채워 넣는다.**
> 전략에 따라 “바로 INSERT(ID 받아오기)”(IDENTITY) 혹은 “키만 미리 땡김”(SEQUENCE/TABLE).
- **영속 엔티티 수정은 save() 없이 Dirty Checking**(트랜잭션 경계 필수)
- **새 엔티티 저장·준영속 병합만 save()**(루트 저장 + Cascade로 전파)
- **벌크 연산 후 clear()**, 동시성은 @Version 검토
## 💭 생각의 인큐베이터 (My Thoughts & Connections)
- [임베디드 값타입과 ENUM의 차이](../00_Inbox/임베디드%20값타입과%20ENUM의%20차이.md)
- [assertThat(actual).isEqualTo(expected)란](../00_Inbox/assertThat(actual).isEqualTo(expected)란.md)
- [어노테이션 총정리(GPT)](../00_Inbox/어노테이션%20총정리(GPT).md)
- [[00_Inbox/데이터베이스에서의 표현vs 객체에서의 표현.md|데이터베이스에서의 표현vs 객체에서의 표현]]
- [[00_Inbox/인텔리제이 단축키.md|인텔리제이 단축키]]
- [[00_Inbox/JPQL.md|JPQL]]
- [[00_Inbox/매서드에 배열로 받되 몇개 받을지 지정안해도 되는 문법_가변인자.md|매서드에 배열로 받되 몇개 받을지 지정안해도 되는 문법_가변인자]]
- [[00_Inbox/향상된 for문(for-each)루프.md|향상된 for문(for-each)루프]]
- [[00_Inbox/Stream 정리.md|Stream 정리]]
- [[00_Inbox/람다정리.md|람다정리]] ^gseyqr
- [[00_Inbox/동적쿼리개발.md|동적쿼리개발]] ->이걸 qurelydsl배우면서 수정해나가기
- [[00_Inbox/김영한 활용1에서의 흐름.md|김영한 활용1에서의 흐름]]
- [[00_Inbox/모델vsDTOvs도메인모델.md|모델vsDTOvs도메인모델]]
- [자바와 스프링 부트로 생애 최초 서버만들기](../04_Archive/민코딩/인프런_자바와%20스프링%20부트로%20생애%20최초%20서버만들기/자바와%20스프링%20부트로%20생애%20최초%20서버만들기.md)

## **12) 폼 검증: @Valid / BindingResult / @NotEmpty (Spring MVC + Bean Validation)**
- 데이터 + HTML 템플릿 → **완성된 웹 페이지** 반환하는 코드 짤때, 즉 서버가 직접 화면을 그릴 때는 내부에서만 쓰이므로 **엔티티를 모델에 넣어 넘겨도 큰 문제는 적다.**(그래도 DTO가 더 깔끔)
- 그런데 프로그램(모바일 앱, 다른 서버 등)이 사용하는 순수 데이터(JSON)를 돌려주는 API에서는 절대 엔티티를 웹으로 반환해선 안된다.
- 왜냐면 엔티티를 모델에 넘기기 위해서 엔티티에 필드/로직을 추가·변경하면 API 응답 스펙이 함께 변해버림(클라이언트 대규모 영향)
	- DTO 사용시 서버 내부에서 `Member` 엔티티의 필드 이름이 `username`으로 바뀌더라도, **DTO로 변환하는 과정에서 `dto.setName(member.getUsername())`처럼 맞춰주면** 외부 약속(`name`)은 그대로 지킬 수 있습니다

> [!PDF|74, 144, 226] [스프링JPA활용.pdf 15-33-19-766](01_Sources/스프링JPA활용.pdf%2015-33-19-766.pdf#page=80&annotation=1742R) 본문: ^80092522657
> 참고: 폼 객체 vs 엔티티 직접 사용 참고: 요구사항이 정말 단순할 때는 폼 객체( `MemberForm` ) 없이 엔티티( `Member` )를 직접 등록과 수정 화면에 서 사용해도 된다. 하지만 화면 요구사항이 복잡해지기 시작하면, 엔티티에 화면을 처리하기 위한 기능이 점점 증 가한다. 결과적으로 엔티티는 점점 화면에 종속적으로 변하고, 이렇게 화면 기능 때문에 지저분해진 엔티티는 결국 유지보수하기 어려워진다. 실무에서 **엔티티는 핵심 비즈니스 로직만 가지고 있고, 화면을 위한 로직은 없어야 한다**. 화면이나 API에 맞는 폼 객체나 DTO를 사용하자. 그래서 화면이나 API 요구사항을 이것들로 처리하고, 엔티티는 최대한 순수하게 유지 하자.
> > [!PDF|248, 231, 28] **강사의말:**
> > 폼객체나 DTO를 사용하자
> > API를 만들때 절대 엔티티를 웹으로 반환하면 안된다
>
> >[!PDF|176, 16, 224] **나의 생각/질문:**
> > -.
> > -.

![12-9) 이걸 언제 쓰나?->현업 시나리오](입력검증.md#12-9\)%20이걸%20언제%20쓰나?->현업%20시나리오)

---

