---
type: 생각조각
status: inbox
source: 
creation_date: 2025-09-16
---

# **1) 객체 vs. DB: 관계 표현의 근본 차이**

| **구분**     | **객체(스프링/자바)**                                  | **관계형 DB**                  |     |
| ---------- | ----------------------------------------------- | --------------------------- | --- |
| **연결 방식**  | 객체 **참조**(A가 B 필드 참조)                           | **외래 키(FK)** 로 테이블 행 연결     |     |
| **탐색**     | **단방향** 참조 기반                                   | **조인(Join)** 으로 임의 방향 탐색 가능 |     |
| **동일성/식별** | JVM 레퍼런스(메모리 동일성\==)와는 별개로, **도메인 동일성은 PK**가 기준 | **PK 값**으로 행 식별             |     |
| **상속**     | 클래스 상속/다형성 자연스러움                                | 테이블엔 상속 개념 없음(전략 필요)        |     |
| **컬렉션**    | List/Set/Map 등 컬렉션 타입 풍부                        | 테이블만 존재, **조인/조인 테이블**로 표현  |     |
| **수명주기**   | 객체 그래프 단위 관리                                    | 부모/자식 **별도 행**을 개별 DML로 관리  |     |

이 차이를 흔히 **오브젝트-관계 임피던스 미스매치**라고 합니다.

---
- **관계 표현 방식**
    - 객체: **참조(Reference) 그래프** — parent.getChildren() 처럼 컬렉션/필드로 서로를 가리킴. **양방향**을 표현해도 “양쪽 필드를 둘 다” 유지해야 함.
	    - "객체 세상에서는 A가 B를 알더라도, B가 A를 아는 것은 보장되지 않는다"는 점이 핵심입니다. B가 A를 알려면 `private A a;` 필드를 별도로 추가해야 합니다
    - DB: **외래키(FK) / 조인 테이블** — 방향 개념이 없고, **데이터만 일관**하면 됨. 동일 관계라도 “어느 테이블이 FK를 갖는가”가 핵심.
- **동일성과 키**
    - 객체: 동일성(identity)은 **JVM 레퍼런스/equals**로 판단.
	    - [JPA vs 자바에서의 동일성 차이와 극복(영속성컨텍스트)](../02_Inbox/JPA%20vs%20자바에서의%20동일성%20차이와%20극복(영속성컨텍스트).md)
    - DB: 동일성은 **PK(대개 surrogate key)** 로 판단.
- **카디널리티와 컬렉션**
    - 객체: List/Set/Map 사용 → **순서/중복/동등성** 이슈가 발생.
    - DB: 집합 기반 → 정렬/중복 제어는 인덱스·제약·쿼리로 처리.
- **로딩/트랜잭션**
    - 객체: 접근 시점에 **지연로딩(LAZY) 프록시**가 개입.
    - DB: **항상 트랜잭션** 안에서 동작하지만(자동 커밋 포함) **ORM 세션/트랜잭션 경계 밖의 LAZY 접근**이 문제
# **2) 차이에서 실제로 생기는 문제들**

1. **연관관계 주인(owner) 오해로 인한 저장 누락/이중 갱신**
	- @OneToMany(mappedBy="parent")에서 **DB에 FK가 있는 쪽(대개 Many·자식)이 주인**인데, 주인이 아닌 컬렉션만 수정하면 **DB 반영 안 됨**.
	- 반대로 **양쪽을 모두 바꾸다** 중복 insert/update가 발생하기도.
2. **양방향 동기화 누락**
	- 메모리 상에서 child.setParent(p)만 하고 p.getChildren().add(child)를 빼먹으면 **객체 그래프**와 **DB 결과**가 어긋남.
3. **N+1 문제(지연 로딩의 부작용)**
       
	- LAZY 연관을 컬렉션 반복문에서 접근 → 연쇄적으로 쿼리 발생.
	    - orders 한 번 조회(N개) 후, 각 order의 member/items를 접근할 때 **추가 쿼리 N번** 발생.
	
4. **상속/다형성의 테이블 매핑**
    
    - Item(부모) – Book/Movie/Album(자식) 같은 구조를 DB에 어떻게 녹일지(단일 테이블/조인 전략 등) 선택 필요.
	- 부모-자식 생명주기가 묶였음에도 cascade/orphanRemoval 설정이 없어 **쓰레기 레코드**가 남거나, 반대로 공유 엔티티에 cascade REMOVE를 걸어 **연쇄 삭제 사고**.
	
5. **무한 순환/스택오버플로** (직렬화/로깅/toString)
	- 양방향 연관을 가진 엔티티를 그대로 JSON 변환하거나 Lombok @Data를 쓰면 **순환 참조**로 폭발.
6. **다대다의 환상**
    
    - 객체는 Set\<Role>처럼 바로 ManyToMany가 쉽지만, **실무 DB**는 거의 항상 **조인 테이블 + 추가 속성**이 필요 → **연결 엔티티**가 정석.
	- 추가 속성(역할 부여일, 상태 등)이 필요하면 **JPA 순수 다대다로는 불가**.
	- 삭제/정렬/쿼리 제어가 어려워 **현실과 안 맞음**.
7. **식별/동일성/equals·hashCode 이슈**
    
    - 아직 PK가 없는 새 엔티티의 동등성 비교, 컬렉션 Key로 쓸 때 중복/변경 가능성 등.
	- 식별자 생성 전(Transient) equals가 컬렉션 필드를 포함하거나 비즈니스 키로만 구성돼 **Set/Map에서 중복/유실** 발생.
	- 프록시/지연로딩 필드를 equals에 넣어 **예상치 못한 쿼리**가 발생.
8. **수명주기 전파/삭제 처리**
    
    - 부모 저장/삭제 시 자식을 어떻게 처리할 것인가(연쇄 persist/remove, 고아 삭제 등).
9. **갱신 로직의 중복 SQL**
    
    - 필드 바꿀 때마다 UPDATE 작성 필요 → 유지보수 부담.
# **3) 해결을 위한 도입 방법 (실무 체크리스트)**

## **A. 모델링 & 매핑 규칙**

- **연관관계 주인 명확화**
    - FK 가진 쪽이 **owner**. JPA는 **owner만** DB에 반영한다.
    - **편의 메서드**로 양방향 동기화 강제:

```Java
public class Parent {
  @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<Child> children = new ArrayList<>();
  public void addChild(Child c) { //편의메서드
    children.add(c); //객체관계 동기화
    c.setParent(this); //DB 반영
  }
  public void removeChild(Child c) { //편의메서드
    children.remove(c); //객체관계 동기화
    c.setParent(null); //DB 반영
  }
}

public class Child {
  @ManyToOne(optional = false, fetch = FetchType.LAZY)
  @JoinColumn(name = "parent_id", nullable = false)
  private Parent parent;
}
```
    
- **다대다는 “연결 엔티티”로 풀기 (강력 권장)**
```java
@Entity class MemberRole {
  @Id @GeneratedValue Long id;
  @ManyToOne(fetch = LAZY) @JoinColumn(name="member_id") Member member;
  @ManyToOne(fetch = LAZY) @JoinColumn(name="role_id") Role role;
  // 추가 속성
  LocalDate assignedAt;
  @Enumerated(STRING) RoleStatus status;
}
```

- → 현실 요구에 맞추어 속성 추가 대응가능, 쿼리/인덱스 최적화 유리.
- **로딩 전략 기본값은 LAZY**
    - 즉시 로딩(EAGER) 금지. 필요 시
        - **JPQL fetch join**
        - @EntityGraph
        - @BatchSize(컬렉션/ManyToOne에 배치 페치)
    - **컬렉션 fetch join + 페이징 금지** → 두 단계 조회나 ID 먼저 조회 후 IN 쿼리.
- **동등성/문자열화 가이드**
    - equals/hashCode는 **식별자(id)만 사용**(id 없으면 객체 주소 기반 권장).
    - 컬렉션/지연로딩 필드는 equals/toString에서 **제외**.
    - Lombok은 @EqualsAndHashCode(onlyExplicitlyIncluded = true) + @ToString.Exclude 활용.
- **직렬화(응답)는 DTO로**
    - 엔티티 직접 노출 금지. 필요하면
        - @JsonIgnore/@JsonManagedReference/@JsonBackReference로 순환 차단
        - 하지만 **근본 해결은 DTO 분리**.
- **값 타입은 불변**
    - @Embeddable은 가변 Setter 금지, 생성자/팩토리로만 생성.

## **B. 트랜잭션 & 계층 규칙**

- **서비스 계층에서 @Transactional 경계 확정**
	하나의 비즈니스 기능은 하나라도 실패하면 전부 취소해야 데이터 정합성이 유지된다 그래서 서비스는 트랜잭션의 경계가 되고, 실제 비즈니스 로직은 서비스에서 처리한다.
    - 쓰기/변경은 필수, 조회는 readOnly=true.
    - **OSIV OFF 권장**: 컨트롤러 진입 전 DTO 변환 완료.
- **CQRS Lite**
    - **커맨드(쓰기)**는 **엔티티 반환 금지, ID만 반환**.
    - **쿼리(읽기)**는 전용 조회 경로(프로젝션/DTO)로.

## **C. 생명주기/전파/고아 관리**

- **Aggregate 내부 전용 자식**만 cascade = ALL, orphanRemoval = true
    - 공유 엔티티(예: 공통 코드, 사용자 등)에는 **REMOVE 전파 금지**.
- **orphanRemoval=true**: 컬렉션에서 빠지면 **삭제가 도메인 규칙**일 때만
- **삭제 vs 관계 해제** 정책을 코드에 명시(편의 메서드로 강제).

## **D. DB 제약과 동기화**

- JPA 매핑과 DB 스키마를 **정합**:
    - nullable=false ↔ optional=false, 유니크 제약 ↔ @UniqueConstraint/@Column(unique=true)
    - FK/인덱스 필수. 상태값은 @Enumerated(STRING) 고정.
- **소프트 삭제**가 필요하면 상태 컬럼+부분 유니크/필터 고려.

## **E. 성능·쿼리 최적화**

- **N+1 대응 순서**:
    
    1. 조회 전용은 **DTO 프로젝션**(JPQL/QueryDSL)
    2. 필요 지점에 **fetch join**
    3. **배치 페치**로 남은 꼬리 줄이기

- 대용량 컬렉션 업데이트는 **벌크 쿼리**+영속성 컨텍스트 정리(clear) 병행.
## **F. 수정 패턴**

- **권장**: “**재조회 → 값 변경** → 커밋 시 Dirty Checking”

    (save() 불필요)

- **준영속 갱신**이 꼭 필요할 땐: **merge(save)**는 **전필드 덮어쓰기 위험** 인지
# **4) “문제 → 해결” 빠른 매핑표**

- 주인 아닌 쪽만 수정 → **owner 쪽 수정** + 편의 메서드 도입
- 양방향 동기화 누락 → **add/remove 편의 메서드 강제**
- N+1 → **DTO 프로젝션 / fetch join / EntityGraph / BatchSize**
- 직렬화 순환 → **DTO로 분리**(부득이하면 @JsonIgnore 계열)
- equals/hashCode로 컬렉션 포함 → **id 기반 equals**, 컬렉션/LAZY 제외
- LazyInitializationException → **서비스 내에서 모두 로딩 후 DTO화**, OSIV OFF
- @ManyToMany 한계 → **조인 엔티티 도입**
- 연쇄 삭제 사고 → **cascade REMOVE는 aggregate 내부에만**
- DB 제약 불일치 → **nullable/unique/FK/인덱스 동기화**

필드 몇 개를 더/덜 매핑하는 문제가 아니라, **“누가 진짜로 DB에 반영되는가(주인)”**, **“언제 무엇을 로딩할 것인가(트랜잭션/쿼리)”**, **“무엇을 외부에 노출할 것인가(DTO)”**를 팀 규칙으로 고정하면 대부분의 함정이 사라집니다.

# **JPA 연관관계 기초**

## **TL;DR**

> **FK 있는 쪽 = 주인(owner)**
> **mappedBy = 거울(inverse)**
> 단방향은 한쪽만 참조
> 양방향은 둘 다 참조하되 **주인은 하나만**.

- 객체는 필드 참조, DB는 FK 컬럼_으로 관계를 구현한다.
- 그런데 DB엔 “양방향 참조”가 없음. **역방향은 스키마가 아니라 조회(JOIN) 문제**.
- 연관관계는 보통 **N측(자식)** 이 FK를 가지며 **주인**이 됨. (1:1은 의존/자식이 주인인 경우가 많음)

---

## **1) 객체 vs DB 관점 한 줄 정리**

- **객체(도메인)**: 다른 엔티티를 **필드(참조)** 로 들고 다님. (order.setMember(member))
- **DB(스키마)**: **FK 컬럼**으로만 관계를 표현. 역방향은 **JOIN으로 조회**할 뿐.
- 따라서 **객체의 참조 방향은 설계 선택**이며, **DB의 FK 위치는 물리 제약**임.
- 그래서 DB 필드는 하나인데 객체 필드는 두 개이니, DB와 동기화할 필드 하나를 정하는 원칙이 바로 '연관관계의 주인
- [데이터베이스에서의 표현vs 객체에서의 표현](../02_Inbox/데이터베이스에서의%20표현vs%20객체에서의%20표현.md)

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

- 다음 단계: **매핑 선택/트레이드오프** → [JPA 연관관계 매핑 전략 1](JPA%20연관관계%20매핑%20전략%201.md)
- 개념 심화: [[JPA_업데이트·동기화_흐름(persist_remove_flush_commit) 1|JPA_업데이트·동기화_흐름(persist_remove_flush_commit)]]
- 생명주기/전파(cascade, orphanRemoval) → [JPA cascade ,orphanRemoval 1](JPA%20cascade%20,orphanRemoval%201.md)
- 성능/안티패턴/실무 팁 → [JPA 연관관계 실무 가이드 (성능, 안티패턴, 운영 팁) 1](JPA%20연관관계%20실무%20가이드%20(성능,%20안티패턴,%20운영%20팁)%201.md)

