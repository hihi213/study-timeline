---
type: 생각조각
status: inbox
source: 
creation_date: 2025-09-09
---
## **엔티티/기본 매핑**

### **식별자/PK**

- @Id: 기본키(PK) 필드 지정.
- @GeneratedValue(strategy=...): PK 생성 전략(IDENTITY/SEQUENCE/TABLE/AUTO).

### **컬럼/값 매핑**

- @Column(name=..., nullable=..., length=..., unique=...): 컬럼 속성 지정.
- @Basic(fetch=..., optional=...): 단순 값 매핑(대부분 기본값 사용).
- @Enumerated(EnumType.STRING): enum을 문자열로 저장(권장).
- @Lob: 대용량 CLOB/BLOB 매핑.
- @Transient: 영속성 제외(컬럼 생성·저장 안 함).

### **시간/버전**

- @Temporal(TemporalType.DATE/TIME/TIMESTAMP): Date/Calendar 시간 정밀도(java.time이면 불필요).
- @Version: 낙관적 락 버전 컬럼(동시 수정 충돌 방지).

### **접근/테이블**

- @Access(AccessType.FIELD/PROPERTY): 필드/프로퍼티 접근 방식 선택.
- @Entity: 이 클래스를 JPA 엔티티로 등록.
- @Table(name=...): 매핑할 테이블/스키마/인덱스 지정.

## **값 타입(임베디드/컬렉션)**

### **정의/사용**

- @Embeddable: 값 타입 정의(별도 테이블 없음, 소유자 테이블에 내장).
- @Embedded: 값 타입 사용/포함.

### **컬럼명 재정의**

- @AttributeOverride(s): 임베디드 컬럼명 재정의.

### **컬렉션/보조 테이블**

- @ElementCollection: 값 타입 컬렉션(엔티티 아님) 저장.
- @CollectionTable(name=..., joinColumns=...): 값 컬렉션용 보조 테이블 지정.
## **연관관계**

mappedBY="다른 테이블의 이 필드이름이 관계의 주인이야 이쪽 수정하면 변화없어" ex) @OneToMany(mappedBy="필드이름")

- @ManyToOne: N:1의 **주인(FK 가진 쪽)**. 여기 값을 바꿔야 DB FK가 갱신됨(기본 EAGER→실무 LAZY 권장).
- @OneToMany: 1:N의 **역방향(거울)** 이 되는 경우가 보통. **단방향**이면 자식 테이블에 FK가 생기도록 @JoinColumn(또는 연결 테이블로 @JoinTable) 필요.
- @OneToOne: 1:1에서 **FK를 가진 쪽이 주인**. 보통 **의존(자식) 테이블에 FK**를 두고, 반대편은 mappedBy.
- @ManyToMany: 연결 테이블 기반. 단순 학습용은 가능하지만 **실무는 연결 엔티티로 분해(N:1+1:N)** 권장(메타데이터/이력/제약 관리 용이).
- 연관관계의 주인은 나다. 나를 수정해야 연관관계가 변경이 된다
	- @JoinColumn(name=...): **FK 컬럼 위치/이름 지정**(**주인/시작점** 선언). DML은 **내 테이블의 FK**를 갱신. 
		- 다른테이블 말고 이 필드가 연관관계의 주인이다, 즉 이쪽 필드를 수정해야 연관관계가 변경이된다.
	- @JoinColumns(...): **복합 FK** 매핑(필요 시 referencedColumnName 명시).
	- @JoinTable(name=..., joinColumns=..., inverseJoinColumns=...): **연결 테이블로 링크 관리**. DML은 **연결 테이블에 INSERT/DELETE**
		- 두 엔티티사이에 중간 조인테이블이 있는데 각각 조인테이블을 매핑할떄
- @MapsId: **공유 PK(식별자 매핑)**. 자식의 PK=부모 PK(+FK). 주로 1:1에서 정합성 좋음.
- @PrimaryKeyJoinColumn: PK=FK 조인. 최근엔 @MapsId 선호.
- @OrderBy("field ASC"): 컬렉션 **정렬을 SQL ORDER BY**로 보장(읽기 전용 정렬).
- @OrderColumn(name=...): **순서 보존용 인덱스 컬럼** 유지(재배열 시 UPDATE 다수→변경 비용 큼).

## **상속 매핑**

- @Inheritance(strategy=...): 상속 전략(SINGLE_TABLE/JOINED/TABLE_PER_CLASS).
- @DiscriminatorColumn(name=...): 상속 구분 판별 컬럼.
- @DiscriminatorValue("..."): 자식 타입 판별 값.
- @MappedSuperclass: 테이블 없음, 공통 매핑 상속 전용(다형성 조회 X).

## **엔티티 그래프/쿼리**

- @NamedQuery / @NamedNativeQuery: 정적 JPQL/네이티브 쿼리 정의.
- @NamedEntityGraph / @EntityGraph: 페치 그래프(N+1 완화용 페치 계획).

## **하이버네이트 확장(선택)**

- @CreationTimestamp: INSERT 시 생성시각 자동.
- @UpdateTimestamp: UPDATE 시 수정시각 자동.
- @BatchSize(size=...): 연관 로딩 배치 페치(N+1 완화).
- @DynamicInsert: 값 있는 컬럼만 INSERT(DB default 활용).
- @DynamicUpdate: 변경된 컬럼만 UPDATE.
- @Type(...): 사용자 정의/특수 타입 매핑(JSON 등).
- @NaturalId: 자연키 매핑/캐시.
- @Where(clause="..."): 엔티티/컬렉션에 상시 필터.
- @SQLDelete(sql="..."): 소프트 삭제 등 커스텀 DELETE SQL.
- @NotFound(action=IGNORE): 누락된 FK 무시(데이터 정합성 주의).

## **Web MVC (컨트롤러/요청 매핑)**

- @Controller: 뷰 반환 컨트롤러.
- @RestController: @Controller + @ResponseBody(바디에 JSON 등 반환).
- [핸들러매핑](핸들러매핑.md)
    - @RequestMapping: URI/HTTP 메서드 공통 매핑(클래스/메서드 모두)
    - @GetMapping/@PostMapping/@PutMapping/@DeleteMapping/@PatchMapping: HTTP 메서드 전용 단축 매핑.
        - 조건설정까지하려면 RequestMapping을 사용
- @RequestParam: 쿼리스트링/폼 파라미터 바인딩.
- @PathVariable: 경로 변수 바인딩.
- @RequestBody: 요청 본문(JSON) → 객체 바인딩.
- @ResponseBody: 리턴값을 HTTP 바디로 직렬화.
- @ResponseStatus: 고정 응답 상태코드 지정.
- @RequestHeader/@CookieValue: 헤더/쿠키 바인딩.
- @ModelAttribute: 폼 객체 바인딩 + 모델 탑재.
- @ExceptionHandler: 컨트롤러 예외 처리 메서드.
- @ControllerAdvice/@RestControllerAdvice: 전역 예외/바인딩 처리.
- @CrossOrigin: CORS 허용 설정.

## **DI/구성(SPRING 기본)**

- @SpringBootApplication: 앱 시작점(@Configuration + @EnableAutoConfiguration + @ComponentScan).
- @Configuration: 자바 기반 설정 클래스.
- @Bean: 빈 등록 팩토리 메서드.
- @Component/@Service/@Repository: 컴포넌트 스캔 대상(계층 의미).
- @ComponentScan: 스캔 범위 지정.
- @Value: 설정값 주입(프로퍼티/환경변수).
- @ConfigurationProperties: 프리픽스 단위 묶음 바인딩.
- @Profile: 환경별 빈 활성화.
- @Import: 다른 구성 클래스 가져오기.

## **데이터/JPA & 스프링 데이터 JPA**

- @Entity: JPA 엔티티.
- @Table/@Column/@Id/@GeneratedValue/@Enumerated/@Lob/@Transient/@Version: 기본 매핑.
- @ManyToOne/@OneToMany/@OneToOne/@ManyToMany/@JoinColumn/@JoinTable: 연관관계 매핑.

- @Embeddable/@Embedded/@AttributeOverride(s): 임베디드 값 타입.
- @EntityGraph: 연관 로딩 계획 지정(N+1 완화).
- @Query: 커스텀 JPQL/네이티브 쿼리.
- @Modifying: 변경 쿼리(UPDATE/DELETE) 표시.
- @Lock: JPA 락 모드(PESSIMISTIC/OPTIMISTIC).
- @EnableJpaRepositories: 리포지토리 스캔 시작점.
- @Transactional: 트랜잭션 경계(클래스/메서드).
- 감사(Auditing): @CreatedDate/@LastModifiedDate/@CreatedBy/@LastModifiedBy + @EnableJpaAuditing.

## **검증(Bean Validation)**

- @Valid/@Validated: 검증 트리거(컨트롤러/서비스 파라미터 등).
- @NotNull/@NotBlank/@NotEmpty: 널/공백/빈 컬렉션 금지.
- @Size/@Min/@Max/@Positive/@PositiveOrZero: 크기/범위 제약.
- @Email/@Pattern: 형식 제약.
- @Past/@PastOrPresent/@Future/@FutureOrPresent: 날짜 제약.