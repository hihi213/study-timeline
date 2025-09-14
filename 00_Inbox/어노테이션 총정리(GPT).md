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

- @Temporal(TemporalType.DATE/ TIME/ TIMESTAMP): Date/Calendar 시간 정밀도(java.time이면 불필요).
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

### **핵심 용어/규칙**

- JPA에서의 **주인(owner)**=DB에서 FK 가진 쪽(여기 변경해야 DB FK가 갱신).
- **비주인(inverse)**=mappedBy=여긴 FK 없음. 진짜 주인은 저쪽 필드다.”
- **단방향**: 한쪽만 참조. **양방향**: 양쪽 참조하되 주인은 하나.
- [자세한 설명- 반드시 외래 키가 있는 곳을 연관관계의 주인으로 정해라](반드시%20외래%20키가%20있는%20곳을%20연관관계의%20주인으로%20정해라.md)

### **주인측 어노테이션**

- @JoinColumn(name=...): FK 컬럼 위치/이름 지정(주인/시작점 선언, DML은 내 FK 갱신).
- @JoinColumns(...): 복합 FK 매핑(referencedColumnName 필요 시 명시).
- @JoinTable(name=..., joinColumns=..., inverseJoinColumns=...): 
	- [[00_Inbox/다대다매핑구현(JoinTable).md|다대다매핑구현(JoinTable)]]
- @MapsId: 공유 PK(자식 PK=부모 PK(+FK), 주로 1:1 정합성↑). ^lcdriv

### **비주인측 어노테이션**

- mappedBy="필드명": “진짜 주인은 저쪽 필드(=FK). 여기선 읽기 거울.”

### **관계별 레시피**

- **N:1 / 1:N(양방향 권장)**
    - 주인: @ManyToOne(fetch=LAZY) @JoinColumn("...")
    - 거울: @OneToMany(mappedBy="...")
    - 1:N 단방향이 꼭 필요하면 부모 컬렉션에 @OneToMany @JoinColumn(자식 FK 생성) 또는 @JoinTable 사용.
- **1:1**
    - 주인=FK 가진 쪽(보통 의존/자식). @OneToOne @JoinColumn
    - 거울: @OneToOne(mappedBy="...")
    - 정합성↑: 자식에 @MapsId로 공유 PK.
- **N:N**
    - 학습용: @ManyToMany @JoinTable
    - 실무권장: **연결 엔티티**로 분해(N:1+1:N), 추가필드/제약/감사 가능.

### **컬렉션 정렬/순서**

- @OrderBy("field ASC"): 조회 시 SQL ORDER BY 정렬(읽기 전용 정렬).
- @OrderColumn(name=...): 순서 보존 인덱스 컬럼(재배열 UPDATE 많아질 수 있음).

### **로딩/튜닝 팁**

- @ManyToOne 기본 EAGER → **실무 LAZY 권장**.
- N+1 완화: fetch join/@EntityGraph/@BatchSize.

## **상속 매핑**

### **전략/판별**

- @Inheritance(strategy=...): SINGLE_TABLE/JOINED/TABLE_PER_CLASS.
- @DiscriminatorColumn(name=...): 판별 컬럼.
- @DiscriminatorValue("..."): 자식 판별 값.

### **공통 매핑 상속**

- @MappedSuperclass: 테이블 없음, 공통 매핑 상속 전용(다형성 조회 X).

## **엔티티 그래프/쿼리**

### **정적 쿼리**

- @NamedQuery / @NamedNativeQuery: 정적 JPQL/네이티브 정의.

### **페치 계획**

- @NamedEntityGraph / @EntityGraph: 페치 그래프(N+1 완화).

## **하이버네이트 확장(선택)**

### **타임스탬프**

- @CreationTimestamp: INSERT 시 생성시각 자동.
- @UpdateTimestamp: UPDATE 시 수정시각 자동.

### **성능/SQL**

- @BatchSize(size=...): 연관 로딩 배치 페치.
- @DynamicInsert: 값 있는 컬럼만 INSERT(DB default 활용).
- @DynamicUpdate: 변경된 컬럼만 UPDATE.

### **타입/자연키**

- @Type(...): 사용자 정의/특수 타입 매핑(JSON 등).
- @NaturalId: 자연키 매핑/캐시.

### **필터/삭제/무시**

- @Where(clause="..."): 상시 필터.
- @SQLDelete(sql="..."): 소프트 삭제 등 커스텀 DELETE SQL.
- @NotFound(action=IGNORE): 누락 FK 무시(정합성 주의).

## **Web MVC(컨트롤러/요청 매핑)**

### **핸들러 종류**

- @Controller: 뷰 반환 컨트롤러.
- @RestController: @Controller + @ResponseBody(JSON 등).

### **요청 매핑**

- @RequestMapping: URI/HTTP 메서드/조건 공통 매핑(클래스/메서드).
- @GetMapping/@PostMapping/@PutMapping/@DeleteMapping/@PatchMapping: 메서드 전용 단축 매핑.

### **바인딩/직렬화**

- @RequestParam: 쿼리/폼 파라미터.
- @PathVariable: 경로 변수.
- @RequestBody: 본문(JSON)→객체.
- @ResponseBody: 리턴값을 HTTP 바디로 직렬화.
- @ResponseStatus: 고정 상태코드.
- @RequestHeader/@CookieValue: 헤더/쿠키 바인딩.
- @ModelAttribute: 폼 객체 바인딩+모델 탑재.

### **예외/전역/CORS**

- @ExceptionHandler: 컨트롤러 예외 처리.
- @ControllerAdvice/@RestControllerAdvice: 전역 예외/바인딩 처리.
- @CrossOrigin: CORS 허용.

## **DI/구성(Spring 기본)**

### **부트 시작점**

- @SpringBootApplication: @Configuration + @EnableAutoConfiguration + @ComponentScan.

### **구성/컴포넌트**

- @Configuration: 설정 클래스.
- @Bean: 빈 팩토리 메서드.
- @Component/@Service/@Repository: 스캔 대상(계층 의미).
- @ComponentScan: 스캔 범위 지정.

### **속성/환경**

- @Value: 설정값 주입(프로퍼티/환경변수).
- @ConfigurationProperties: 프리픽스 단위 바인딩.

### **프로파일/임포트**

- @Profile: 환경별 빈 활성화.
- @Import: 다른 구성 클래스 포함.

## **데이터/JPA & 스프링 데이터 JPA**

### **엔티티/기본 매핑**

- @Entity/@Table/@Column/@Id/@GeneratedValue/@Enumerated/@Lob/@Transient/@Version: 기본 매핑 세트.

### **연관관계**

- @ManyToOne/@OneToMany/@OneToOne/@ManyToMany/@JoinColumn/@JoinTable: 관계/연결 매핑.

### **임베디드**

- @Embeddable/@Embedded/@AttributeOverride(s): 값 타입/재정의.

### **쿼리/그래프**

- @EntityGraph: 로딩 계획.
- @Query: 커스텀 JPQL/네이티브.
- @Modifying: 변경 쿼리(UPDATE/DELETE).

### **리포지토리/락/트랜잭션**

- @EnableJpaRepositories: 리포지토리 스캔 시작점.
- @Lock: JPA 락(PESSIMISTIC/OPTIMISTIC).
- @Transactional: 트랜잭션 경계.

### **감사(Auditing)**

- @CreatedDate/@LastModifiedDate/@CreatedBy/@LastModifiedBy + @EnableJpaAuditing.

## **검증(Bean Validation)**

### **트리거**

- @Valid/@Validated: 검증 실행(컨트롤러/서비스 파라미터 등).

### **널/문자열**

- @NotNull/@NotBlank/@NotEmpty: 널/공백/빈 컬렉션 금지.

### **크기/수치**

- @Size/@Min/@Max/@Positive/@PositiveOrZero: 크기/범위 제약.

### **형식/날짜**

- @Email/@Pattern: 형식 제약.
- @Past/@PastOrPresent/@Future/@FutureOrPresent: 날짜 제약.