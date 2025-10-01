---
type: 생각조각
status: inbox
source: 
creation_date: 2025-09-14
---

## 📜 원본 맥락

![](JoinTable이%20생성하는%20연결테이블이%20엔티티가%20아닌이유.md#^tymg0v)

---
## 정리

## **TL;DR**

- **엔티티**: **DB 행(Row)을 대표**하는 도메인 객체. **JPA(영속성 컨텍스트)** 가 수명·상태를 관리. @Entity, @Id.
- **스프링 빈**: **스프링 IoC 컨테이너가 관리**하는 애플리케이션 구성요소(서비스/설정/리포지토리 등). @Service, @Component, @Repository, @Configuration.
- **DTO**: 계층/네트워크 경계에서 **데이터 전달용** 구조체. 비즈니스 로직/영속성 X.
- **값 객체(임베디드)**: **식별자 없이 값으로 동등성**을 판단하는 도메인 값. @Embeddable, @Embedded.
---

## **한 눈 비교표**

|**구분**|**엔티티 (Entity)**|**스프링 빈 (Bean)**|**DTO**|**값 객체 (Value / 임베디드)**|
|---|---|---|---|---|
|누가 관리?|**JPA/영속성 컨텍스트** (EntityManager)|**Spring IoC 컨테이너**|아무도 X(프레임워크가 생성/매핑만)|JPA가 엔티티 **내부에 내장**하여 함께 관리|
|대표 대상|**DB의 행(Row)**|**애플리케이션 구성요소/서비스**|**전달 데이터**|**개념적 값**(주소/기간/돈 등)|
|주요 어노테이션|@Entity, @Id, @Table|@Component, @Service, @Repository, @Configuration|보통 없음(레코드/POJO), 검증용 @NotNull 등|@Embeddable, 엔티티 필드에 @Embedded|
|저장 위치|**DB 테이블**|메모리(컨테이너)|직렬화/HTTP/메시지/뷰모델|**엔티티 테이블의 컬럼들**(별도 테이블 X)|
|식별/동등성|**식별자(@Id)로 동일성**; equals/hashCode는 보통 ID 기반|빈 이름/타입(컨테이너 식별)|값 기반(필드 동일)|**값 기반 동등성**(불변 추천)|
|라이프사이클|트랜잭션/PC 경계에 의존(지연 로딩/변경감지)|컨텍스트 시작~종료(기본 **싱글톤**)|요청/응답 단발|엔티티와 함께 로드/저장|
|스레드 안전|엔티티 인스턴스 **스레드-세이프 전제 아님**|**싱글톤 권장 ⇒ 상태 없게 설계**|해당 없음|값 자체는 **불변 권장**|
|책임|**도메인 상태/행위**(비즈니스 규칙)|**조립/조정/유스케이스/인프라**|표현/전달|개념/규칙(불변·검증)|
|생성 방식|보통 JPA가 프록시/리플렉션으로 생성(기본 생성자 필요)|스프링이 생성/주입|매퍼/컨트롤러에서 수동 생성|엔티티가 포함하여 생성|

---

## **헷갈리기 쉬운 포인트 정리**

### **1) “엔티티도 스프링이 관리하나요?”**

- **아니요.** 엔티티는 **스프링 빈이 아닙니다**. 엔티티 인스턴스는 **JPA(영속성 컨텍스트)** 가 상태를 추적하고, 변경 감지/지연 로딩 등을 처리합니다.
- 반면 **리포지토리**(ex. JpaRepository)는 **스프링 빈**입니다. 엔티티를 DB와 주고받는 **컴포넌트**죠.

### **2) “DTO vs 엔티티, 어디에 로직을 둬야 하나?”**

- **엔티티**: **도메인 규칙/불변식**(ex. “재고 감소는 0 미만 불가”).
- **DTO**: 직렬화/검증/표현 전환(Controller 경계). **비즈니스 로직 X**.

### **3) “값 객체(임베디드)는 엔티티랑 뭐가 달라?”**

- **값 객체(임베디드)**는 **식별자(@Id) 없음**, **값으로 동등성**.

    예: Address(city, street, zip)

    - @Embeddable로 정의, 엔티티에 @Embedded로 사용 ⇒ **별도 테이블 없이** 컬럼들로 함께 저장.
    - **불변(immutable)** + **자기 유효성 보장**이 베스트 프랙티스.

### **4) “빈은 왜 싱글톤을 권장?”**

- 스프링 빈은 **기본 싱글톤**. 요청마다 만들어지는 게 아니라 **하나를 공유**하니, **상태를 들고 있지 않게(Stateless)** 설계해야 안전합니다.
- 상태가 필요하면 **메소드 지역 변수**로 두거나, **프로토타입/리퀘스트 스코프**를 고려.

---

## **언제 누구를 쓰나? (미니 가이드)**

- **엔티티**: “DB에 저장되는 도메인 모델”이 필요할 때.
    - 예: Order, Member, Product, Delivery
- **스프링 빈**: “유스케이스/서비스/인프라”를 조립/조정할 때.
    - 예: OrderService, MailSender, SecurityConfig
- **DTO**: “API 입출력/계층 경계”에서 전송할 때.
    - 예: CreateOrderRequest, OrderResponse
- **값 객체**: “한 덩어리의 도메인 값”을 모델링할 때.
    - 예: Money, Address, Period

---

## **초간단 예시**

```
// 엔티티
@Entity
class Order {
  @Id @GeneratedValue Long id;
  @Embedded Address shippingAddress;   // 값 객체 내장
  @Enumerated(EnumType.STRING) OrderStatus status;
  void complete() { this.status = OrderStatus.COMPLETED; } // 도메인 행위
}

// 값 객체(임베디드)
@Embeddable
class Address {
  private String city, street, zip;
  protected Address() {} // JPA
  public Address(String city, String street, String zip) { /* 불변/검증 */ }
}

// 스프링 빈(서비스)
@Service
class OrderService {
  private final OrderRepository repo;
  OrderService(OrderRepository repo) { this.repo = repo; }
  @Transactional
  public Long place(OrderCreateDto dto) {
    Order o = new Order(/*...*/);
    repo.save(o);
    return o.getId();
  }
}

// DTO
record OrderCreateDto(String city, String street, String zip) {}
```

---

## **기억해 두면 좋은 체크리스트**

- 엔티티는 **스프링 빈 아님**(컨테이너가 아닌 **영속성 컨텍스트**가 관리).
- 빈은 **싱글톤 기본** → **상태 없는 서비스**로 설계.
- DTO는 **전달/표현용**, 엔티티는 **도메인 규칙/행위**의 집합.
- 값 객체는 **불변 + 값 동등성**, **엔티티에 내장**되어 **같은 테이블에 저장**.

---
## 💭 나의 추가적 생각/질문
- [스프링폴더의 도메인은 뭔데?](스프링폴더의%20도메인은%20뭔데?.md) ^le2vnq