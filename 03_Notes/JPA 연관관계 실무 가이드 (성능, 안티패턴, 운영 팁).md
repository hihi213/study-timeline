---
type: 생각조각
status: inbox
source: 
creation_date: 2025-09-16
---

## **TL;DR**

- **기본은 LAZY + 명시적 조회 전략(fetch join / @EntityGraph / @BatchSize)**.
- **엔티티를 API로 직접 노출하지 말기**(무한 루프/LAZY 초기화 예외). DTO 변환이 원칙.
- **애그리거트 내부만 cascade/orphanRemoval**, 공유 엔티티엔 금지.
- **컬렉션 fetch join + 페이징 금지**(카디널리티 폭발). 대안: 배치 페치/두 단계 조회.
- **연관관계 편의 메서드로 양쪽 동기화**(FK 주인 필드 반드시 세팅).

---

## **1) 기본 세팅 원칙**

### **로딩 전략**

- @ManyToOne, @OneToOne: **LAZY 권장** (기본 EAGER를 명시적으로 LAZY로 바꾸기).
- @OneToMany, @ManyToMany: 기본 LAZY. 필요 시 선택적 로딩 전략 적용.

### **equals/hashCode, toString**

- **연관 필드를 equals/hashCode에 넣지 말기**(순환/지연로딩 폭발).
- 보통 **식별자(PK)**만 사용(생성 전 비교 이슈가 있으면 비즈니스 키 + 주의).
- toString()에 연관 필드 포함 금지(순환 참조/LAZY 로딩 폭탄).
- Lombok @Data 지양 → @Getter + 필요한 메서드만 명시.

### **직렬화/JSON**

- 컨트롤러에서 **엔티티 직접 반환 금지**. DTO로 변환.
- 임시로 쓸 때는 @JsonIgnore / @JsonManagedReference / @JsonBackReference 등으로 순환 차단(권장 X).

---

## **2) N+1 문제와 해법**

### **뭐가 문제?**

- LAZY 연관을 루프에서 접근 → 연관마다 추가 SELECT(N회). 트래픽/지연 급증.

### **해결 도구 3종**

1. **fetch join (JPQL)**
    
    - 한 번에 조인 로딩.
    - **주의:** 컬렉션(OneToMany) fetch join에 **페이징 금지**(중복 행/메모리 페이징로 변질).
	
	```java
		// 단건/ToOne들만 fetch join은 페이징 안전
		select o from Order o
		  join fetch o.member
		  join fetch o.delivery
		where o.status = :status
	```
2. **@EntityGraph**
    
    - 리포지토리 메서드에 선언적으로 페치 그래프 지정.
	
	```java
	@EntityGraph(attributePaths = {"member","delivery"})
	List<Order> findByStatus(OrderStatus s);
	```
	 
3. **@BatchSize** (배치 페치)
    
    - 컬렉션/ToOne 지연 로딩 시 **IN 쿼리로 묶어서** 가져옴.
	
	```java
	@BatchSize(size = 100)
	private List<OrderItem> orderItems;
	```
	 - 전역: hibernate.default_batch_fetch_size=100~500 권장.

### **컬렉션 + 페이징 패턴**

- 페이지 대상 엔티티만 먼저 조회(아이디 리스트) → **두 번째 쿼리**로 연관 로딩(fetch join 또는 배치 페치).
- 또는 DTO 프로젝션으로 필요한 필드만 한방 조회.

---

## **3) 트랜잭션 & 영속성 컨텍스트**

- **서비스 계층 @Transactional**에서 쓰기/읽기 경계를 관리.
- @Transactional(readOnly=true) → 스냅샷 생략/성능 약간 ↑.
- **OSIV(Open Session In View)**
    - ON: 뷰까지 영속성 열림 → 컨트롤러/뷰에서 LAZY 접근 가능(편하지만 계층 침식).
    - OFF(권장): 서비스 내에서 데이터 완결. 컨트롤러로 나갈 때는 **DTO로 완전 변환**.
- **flush 타이밍**: 보통 commit 직전 자동. JPQL 실행 전 동기화될 수 있음.

---

## **4) 쓰기/삭제 규칙 (Aggregate)**

### **쓰기**

- **편의 메서드**로 양쪽 동기화(뷰 컬렉션 + FK 주인).
	```java
	order.addOrderItem(oi); // 내부에서 oi.setOrder(this)
	order.setDelivery(d);   // 내부에서 d.setOrder(this)
	```

### **삭제**

- **cascade=REMOVE + orphanRemoval**은 애그리거트 내부에서만.
- 대량 삭제는 락/성능 고려 → 단계적 삭제 or DB 제약/스케줄러 활용 검토.
- 소프트 삭제 필요 시: @SQLDelete + @Where 패턴(조인/카운트 시 주의).

---

## **5) 매핑 전략 실전 팁**

- **기본은 @JoinColumn(FK)**. 단순/빠름/제약 명확.
- **@JoinTable**은 특수/레거시/1:N 단방향 강제 시만. 조인 1단계 증가 감수.
- **N:N은 학습용**. 실무는 **연결 엔티티**로 분해(추가 메타, 감사, 제약 가능).

---

## **6) ID 전략과 연관관계 성능**

- **IDENTITY**: 키 생성을 위해 즉시 INSERT → 쓰기 흐름 쪼개짐(플러시 조기).
    - 대안: **SEQUENCE**(DB 시퀀스) + allocationSize 튜닝로 INSERT 뭉치기.
- **연관 저장**은 보통 부모만 persist(cascade)로 처리 → INSERT 순서 안정화.

---

## **7) 스키마/레거시 다루기**

- **복합키**: @EmbeddedId/@IdClass. equals/hashCode 주의(불변 필드로).
- **FK 없는 레거시**: @JoinColumns, @JoinTable, 뷰/스토어드 프로시저, 네이티브 쿼리 조합.
- **인덱스**: FK 컬럼, 조인 자주 타는 컬럼에 인덱스 필수.

---

## **8) 테스트 전략**

- @DataJpaTest로 슬라이스 테스트(임베디드 DB/H2).
- 대용량/실성능은 **실제 DB**로도 검증(쿼리 플랜/인덱스 확인).
- hibernate.show_sql=false, 로거 org.hibernate.SQL=debug + 바인딩 로깅으로 추적.

---

## **9) 안티패턴 체크리스트**

- EAGER 방치(특히 ToOne) → **LAZY로 변경**
- 컬렉션 fetch join + 페이징 사용 → **금지**(중복/메모리 페이징)
- 엔티티 직접 JSON 반환 → **DTO 변환**
- 편의 메서드 미구현 → **FK 주인 필드 누락**
- 공유 엔티티에 cascade=ALL/orphanRemoval=true → **데이터 유실 위험**
- equals/hashCode에 연관 포함 → **순환/폭발**
- OSIV로 컨트롤러에서 LAZY 남발 → **서비스 내 완결**
- @ManyToMany 실무 사용 → **연결 엔티티로 분해**

---

## **10) 스니펫 모음**

### **안전한 조회 (ToOne만 fetch join + 페이징 OK)**

```java
Page<Order> page = orderRepo.findByStatus(s, PageRequest.of(0, 20));
// JPQL 예시
select o from Order o
 join fetch o.member
 join fetch o.delivery
where o.status = :s
```

### **컬렉션 안전 페이징 (두 단계)**

```java
// 1단계: 페이지 대상만
Page<Long> ids = orderRepo.findIdsByStatus(s, pageable);

// 2단계: IN 조회 + 배치 페치로 하위 로딩
List<Order> orders = orderRepo.findWithMemberDeliveryByIds(ids.getContent());
```

### **배치 페치 전역 설정(application.yml)**

```java
spring:
  jpa:
    properties:
      hibernate:
        default_batch_fetch_size: 200
```

---

## **함께 보기**

- [JPA 연관관계 기초](JPA%20연관관계%20기초.md)
- [JPA 연관관계 매핑 전략](JPA%20연관관계%20매핑%20전략.md)
- [[JPA_업데이트·동기화_흐름(persist_remove_flush_commit)|JPA_업데이트·동기화_흐름(persist_remove_flush_commit)]]
- [JPA cascade ,orphanRemoval](JPA%20cascade%20,orphanRemoval.md)
