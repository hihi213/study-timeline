---
type: 생각조각
status: inbox
source: 
creation_date: 2025-09-09
---

@SpringBootTest` : 스프링 부트 띄우고 테스트(이게 없으면 `@Autowired` 다 실패

## **1) 엔티티/테이블 & 식별자(PK)**

### **@Entity**
- **위치**: 클래스
- **역할**: JPA가 이 클래스를 엔티티로 인식(영속성 컨텍스트 관리 대상).
- **주의**: 기본 생성자 public/protected 필요. final, enum, interface, 내부클래스 금지.

### **@Table(name, schema, indexes)**
- **위치**: 클래스
- **매개변수**:
    - name: 매핑할 테이블명
    - schema: 스키마명
    - indexes: @Index(name, columnList, unique) 배열
- **역할**: 테이블/스키마/인덱스 매핑 세부 설정.
- **주의**: DDL 생성 시에만 영향(운영 DB에 이미 존재하면 효과 없음).

### **@Id**
- **위치**: 필드/게터
- **역할**: PK 지정(동등성/식별·영속성 캐시 키).

### **@GeneratedValue(strategy=IDENTITY|SEQUENCE|TABLE|AUTO, generator = "name" )**

- **위치**: 필드/게터
- **매개변수**:
    - strategy: 키 생성 전략
    - generator = "name"
	    - ### **@SequenceGenerator / @TableGenerator**와 **이름 연결**
- **역할**: PK 자동 생성.
- **주의**:
    - IDENTITY: **persist 시 즉시 INSERT**(flush 앞서 실행될 수 있음).
    - SEQUENCE: DB 시퀀스 필요(성능 위해 allocationSize 조정).
    - TABLE: 키 생성 테이블(일반적 비권장).
    - AUTO: 방언에 따라 선택.

### **@SequenceGenerator(name, sequenceName, allocationSize, initialValue)**

- **위치**: 클래스/필드
- **매개변수**:
    - name: 제너레이터 식별자
    - sequenceName: DB 시퀀스명
    - allocationSize: 미리 할당 크기(버퍼링)
    - initialValue: 초기값
- **역할**: SEQUENCE 전략 상세 설정.
- **주의**: JPA 캐시와 DB 시퀀스 값 동기화 고려(다중 인스턴스 환경).

### **@TableGenerator(name, table, pkColumnName, valueColumnName, allocationSize)**

- **위치**: 클래스/필드
- **매개변수**: 테이블 기반 키 생성에 필요한 컬럼명들
- **역할**: TABLE 전략 상세 설정.
- **주의**: 락 경합/성능 저하 가능 → 일반적 비권장.

### **@Access(AccessType.FIELD|PROPERTY)**

- **위치**: 클래스 또는 개별 필드/게터
- **매개변수**: 접근 방식
- **역할**: 매핑/더티체킹 접근 지점 지정(필드 vs 게터).
- **주의**: 혼용 시 일관성 유지. PROPERTY면 **게터**에 어노테이션.

### **@Version**

- **위치**: 필드
- **역할**: 낙관적 락 버전 컬럼(동시성 제어).
- **주의**: UPDATE 시 자동 증가. 직접 수정 금지.

### **@Temporal(DATE|TIME|TIMESTAMP)**

- **위치**: 필드
- **매개변수**: 정밀도
- **역할**: java.util.Date/Calendar 매핑 정밀도 지정.
- **주의**: java.time.*(LocalDate/Time/DateTime) 사용 시 **불필요**.

### **@Basic(fetch=EAGER|LAZY, optional=…)**

- **위치**: 필드/게터
- **매개변수**:
    - fetch: 로딩 전략(기본 EAGER)
    - optional: null 허용
- **역할**: 단순 값 매핑 기본 설정.
- **주의**: LAZY는 벤더 확장/바이트코드 인핸서 필요(모든 필드에 보장 X).

### **@Cacheable(true|false)**

- **위치**: 클래스
- **매개변수**: 2차 캐시 사용 여부
- **역할**: JPA 2차 캐시 적용 힌트.
- **주의**: 캐시 제공자 설정 필요(Ehcache/Infinite/…); 일관성 전략 고려.

### **@EmbeddedId**

- **위치**: 엔티티 **필드**
- **역할**: **복합키를 값 타입**(임베디드)으로 묶어 PK 매핑.
- **주의**: 임베디드 키 클래스는 **@Embeddable**, **equals/hashCode** 구현 필수. FK 공유 시 @MapsId와 조합.

### **@IdClass(키클래스)**

- **위치**: 엔티티 **클래스**
- **역할**: 복합키를 **별도 키 클래스**로 선언하고, **각 키 컬럼을 엔티티 필드에 직접 @Id로** 매핑.
- **주의**: 키 클래스는 **Serializable, equals/hashCode** 구현. 필드명/타입이 엔티티의 @Id 필드와 **정확히 일치**해야 함.
---

## **2) 컬럼/값 매핑**

### **@Column(name, nullable, length, unique, precision, scale)**

- **위치**: 필드/게터
- **매개변수**: 컬럼명/널/길이/유니크/소수 정밀도
- **역할**: 컬럼 제약 및 DDL 힌트.
- **주의**: unique는 단일 컬럼 유니크. 복합 유니크는 @Table(indexes/uniqueConstraints) 사용.

### **@Enumerated(EnumType.STRING|ORDINAL)**

- **위치**: 필드
- **매개변수**: 저장 방식(기본 ORDINAL)
- **역할**: enum 매핑.
- **주의**: **STRING 권장**(중간 삽입·순서 변경 시 안전). ORDINAL 지양.

### **@Lob**

- **위치**: 필드
- **역할**: CLOB/BLOB 매핑(String/byte[] 등 타입에 따라 결정).
- **주의**: 대용량 I/O 비용, 지연 로딩 전략 고려.

### **@Transient**

- **위치**: 필드
- **역할**: 영속성 제외(컬럼 생성/저장 안 함).

### **@Converter(autoApply=true) / @Convert(converter=…)**

- **위치**: 클래스 / 필드
- **매개변수**:
    - autoApply: 해당 타입 전체에 자동 적용
    - converter: 변환기 클래스
- **역할**: 값 변환(암복호화, 마스킹, 커스텀 타입 등).
- **주의**: 쿼리 비교시 변환 전/후 값 일관성 확인.

### **@SecondaryTable(name, pkJoinColumns…)**

- **위치**: 클래스
- **매개변수**: 보조 테이블명, PK 조인 컬럼들
- **역할**: 한 엔티티를 2개 테이블에 분산 매핑.
- **주의**: 조인 비용 증가, 부분 로딩 전략 고려.

### **@ColumnDefault(“expr”) (Hibernate)**
- **위치**: **필드**
- **매개변수**: expr(DB 기본값 식, 예: 'N', 0, now() )
- **역할**: **DDL 생성 시** 컬럼 기본값 지정.
- **주의**: 런타임 INSERT 값이 null이면 DB 기본값 적용 여부는 DB 규칙에 따름. JPA 레벨 캐시 값과 **불일치** 주의.

### **@Comment(“text”)**

(Hibernate)

- **위치**: **필드/클래스**
- **역할**: 컬럼/테이블 **주석(DDL)**.
- **주의**: DDL 생성 시에만 반영.

### **@ColumnTransformer(read=“SQL”, write=“SQL”)**

(Hibernate)

- **위치**: **필드**
- **매개변수**: read(조회 식), write(저장 식)
- **역할**: **암복호화/함수** 등, DB 표현과 엔티티 값 사이 변환.
- **주의**: **JPQL 조건에도 식이 그대로** 들어가 성능/인덱스 영향 가능. 가능하면 @Converter 우선.

### **@Nationalized**

(Hibernate)

- **위치**: **필드**
- **역할**: 문자 컬럼을 **NVARCHAR/NCLOB**로 매핑(유니코드).
- **주의**: DB 방언 지원 필요.
## **3) 값 타입(임베디드/컬렉션)**

### **@Embeddable**

- **위치**: 값타입 클래스
- **역할**: 테이블 없이 소유자 컬럼에 **내장**되는 값 타입 정의.
- **주의**: **불변 설계** 권장(Setter 지양, 생성자 완전 초기화/교체 패턴).

### **@Embedded**

- **위치**: 소유 엔티티의 필드
- **역할**: 값 타입 포함.

### **@AttributeOverride(name, column=@Column(…)) / @AttributeOverrides({…})**

- **위치**: @Embedded 필드
- **매개변수**: 재정의할 속성명, 컬럼 정의
- **역할**: 임베디드 내부 컬럼명 재정의.

### **@AssociationOverride(name, joinColumns=…) / @AssociationOverrides({…})**

- **위치**: @Embedded 필드
- **매개변수**: 재정의할 연관 이름, 조인 컬럼
- **역할**: 임베디드 내부 연관 매핑 재정의.
- **주의**: 구조가 복잡해지면 유지보수 난이도↑.

### **@ElementCollection(fetch=…)**

- **위치**: 필드
- **매개변수**: fetch 전략
- **역할**: 값 타입 **컬렉션**(엔티티 아님)을 별도 테이블에 저장.
- **주의**: 변경 시 보통 **delete+insert** 발생(미세 업데이트 어려움). 엔티티처럼 식별자/생명주기 없음.

### **@CollectionTable(name, joinColumns=@JoinColumn(…))**

- **위치**: @ElementCollection 필드
- **매개변수**: 컬렉션 테이블명, 조인컬럼
- **역할**: 값 컬렉션 저장 테이블 지정.

### **@Column(name)**  

### **(값 컬렉션의 값 컬럼명)**

- **위치**: @ElementCollection 필드
- **역할**: 값 컬렉션의 단일 값 컬럼명 지정.

### ****@CollectionId(columns=@Column(name=”…”), type=@Type(…)|@JdbcTypeCode(…),**

generator=”…”)** _(Hibernate)_

- **위치**: **@ElementCollection 필드**
- **매개변수**: 컬럼/타입/제너레이터
- **역할**: 값 타입 컬렉션에 **인조 식별자 컬럼**을 부여(개별 행 식별/추적).
- **주의**: **@GenericGenerator**(Hibernate) 등 제너레이터 필요. JPA 표준 아님.

### **@GenericGenerator(name=”…”, strategy=”…”, parameters=… )**

(Hibernate)

- **위치**: **필드/클래스**
- **역할**: Hibernate 고유 키 생성 전략 정의(예: UUID).
- **주의**: 이식성↓. 가능하면 표준 시퀀스/테이블 제너레이터 우선.

---

## **4) 연관관계 매핑**

> **상세는 전용 문서**: [JPA 연관관계 기초](../02_Notes/JPA%20연관관계%20기초.md)
### **@ManyToOne(optional, fetch)**

- **위치**: 연관 필드
- **매개변수**:
    - optional(기본 true), fetch(기본 **EAGER**)
- **역할**: N:1 관계 주인 측에 주로 사용.
- **주의**: 실무는 **LAZY**로 강제 설정 권장(N+1 방지).

### **@OneToMany(mappedBy, cascade, orphanRemoval, fetch)**

- **위치**: 연관 컬렉션 필드
- **매개변수**:
    - mappedBy: 거울 필드명(주인 아님)
    - cascade, orphanRemoval, fetch(기본 LAZY)
- **역할**: 1:N 거울 측.
- **주의**: 주인 아닌 쪽에서 FK 갱신 불가. 주인 없이 사용하면 **조인 테이블** 생성(지양).

### **@OneToOne(mappedBy, optional, fetch)**

- **위치**: 연관 필드
- **매개변수**: 동일
- **역할**: 1:1 관계.
- **주의**: FK 가진 쪽을 **주인**으로(둘 중 더 자주 접근/테이블 액세스 많은 쪽).

### **@ManyToMany(mappedBy, fetch)**

- **위치**: 연관 컬렉션 필드
- **매개변수**: mappedBy, fetch(기본 LAZY)
- **역할**: 다대다 연결 테이블 자동.
- **주의**: 실무 **지양** → **연결 엔티티**로 풀어 N:M을 1:N,N:1로 설계.

### **@JoinColumn(name, nullable, updatable, insertable, foreignKey=…)**

- **위치**: **주인** 쪽 연관 필드
- **매개변수**: FK 컬럼명/제약/읽기전용 등
- **역할**: FK 컬럼 지정.
- **주의**: 읽기전용 매핑 시 insertable=false, updatable=false.

### **@JoinColumns({@JoinColumn(…), …})**

- **위치**: 복합 FK 연관 필드
- **역할**: 복수 컬럼으로 FK 구성.

### **@JoinTable(name, joinColumns=…, inverseJoinColumns=…)**

- **위치**: 연결 테이블 사용 연관 필드
- **역할**: 조인 테이블 기반 매핑.
- **주의**: 연결 테이블은 쓰기 비용/쿼리 복잡도↑.

### **@MapsId(value?)**

- **위치**: 자식/의존 엔티티의 연관 필드
- **매개변수**: 공유할 ID 속성명(복합키 사용 시)
- **역할**: **공유 PK** 매핑(자식 PK = 부모 PK(+FK)).
- **주의**: @Id 또는 @EmbeddedId와 조합. 생성 순서/라이프사이클 주의.

### **@OrderBy(“prop ASC|DESC”)**

- **위치**: 컬렉션 필드
- **매개변수**: 정렬 속성/방향
- **역할**: DB ORDER BY로 정렬.
- **주의**: 항상 정렬 비용 발생.

### **@OrderColumn(name=“seq”)**

- **위치**: 컬렉션 필드
- **매개변수**: 순서 컬럼명
- **역할**: 물리적 순서 유지.
- **주의**: 삽입/이동 시 **다건 UPDATE** 발생 → 성능 주의.

### **@MapKey(name) / @MapKeyColumn(name) / @MapKeyEnumerated / @MapKeyTemporal / @MapKeyJoinColumn(name)**

- **위치**: Map 컬렉션 필드
- **역할**: Map의 **키** 매핑(단순 값/열거/날짜/연관 등).
- **주의**: 키 불변성/일관성 보장 필요.

### **@OnDelete(action = OnDeleteAction.CASCADE)**

(Hibernate)

- **위치**: **연관 필드**
- **역할**: DB 레벨 **ON DELETE CASCADE** 위임.
- **주의**: 하위 행이 **DB에서 직접 삭제**되므로 영속성 컨텍스트 동기화 주의(캐시 불일치 가능).

### **@JoinFormula(value=“sql_expr”)**

(Hibernate)

- **위치**: **연관 필드**
- **매개변수**: value(조인 식)
- **역할**: **물리 FK 없이** 계산식으로 연관 매핑.
- **주의**: 읽기 중심. 쓰기/무결성 보장은 개발자 책임.

---

## **5) 상속 매핑**

### **@Inheritance(strategy=SINGLE_TABLE|JOINED|TABLE_PER_CLASS)**

- **위치**: 부모 엔티티
- **매개변수**: 전략
- **역할**: 엔티티 상속 매핑.
- **주의**:
    - SINGLE_TABLE: 빠름/스키마 단순, **널 컬럼** 많아질 수 있음.
    - JOINED: 정규화/무결성↑, 조인 비용↑.
    - TABLE_PER_CLASS: 각 자식 개별 테이블, **UNION 쿼리**(조회 비용↑).

### **@DiscriminatorColumn(name, length) / @DiscriminatorValue(”…”)**

- **위치**: 부모 / 자식
- **매개변수**: 컬럼명/길이, 각 자식의 값
- **역할**: 상속 타입 판별 컬럼/값 지정.
- **주의**: TABLE_PER_CLASS에선 보통 불필요.

### **@MappedSuperclass**

- **위치**: 공통 매핑용 부모(테이블 없음)
- **역할**: 공통 필드 매핑 상속(다형성 조회 X).
- **주의**: 직접 조회/연관 대상 불가.

---

## **6) 네임드 쿼리 & 엔티티 그래프**

### **@NamedQuery(name, query) / @NamedQueries({…})**

- **위치**: 엔티티 클래스
- **매개변수**:
    - name: 고유 이름
    - query: JPQL
- **역할**: 정적 JPQL 정의(부트 시 파싱/검증).
- **주의**: 리팩토링 시 필드명·파라미터명 불일치 주의. 이름 충돌 피하기(접두어 전략).

### **@NamedNativeQuery(name, query, resultClass|resultSetMapping)**

- **위치**: 엔티티 클래스
- **매개변수**:
    - query: 네이티브 SQL
    - resultClass: 엔티티 매핑
    - resultSetMapping: @SqlResultSetMapping 이름
- **역할**: 네이티브 정적 쿼리.
- **주의**: 이식성↓, 컬럼 별칭/매핑 정확히.

### **@SqlResultSetMapping(name, entities|columns|constructorResult…)**

- **위치**: 엔티티 클래스
- **매개변수**:
    - entities: @EntityResult(필드-컬럼 매핑)
    - columns: @ColumnResult
    - constructorResult: @ConstructorResult(targetClass, columns=…)
- **역할**: 네이티브 결과를 엔티티/DTO에 매핑.
- **주의**: 컬럼명/별칭 일치 필수. 유지보수 복잡.

### **@NamedEntityGraph(name, attributeNodes=@NamedAttributeNode(”…”), subgraphs=@NamedSubgraph(…))**

- **위치**: 엔티티 클래스
- **매개변수**:
    - attributeNodes: 즉시 로드할 속성들
    - subgraphs: 중첩 속성 그래프
- **역할**: **페치 계획** 미리 정의(N+1 완화).
- **주의**: 컬렉션 다중 그래프 남용 시 카디널리티 폭증.

### **@EntityGraph(attributePaths | value=“graphName”, type=FETCH|LOAD)**

- **위치**: 리포지토리 메서드
- **매개변수**:
    - attributePaths: 인라인 경로 지정
    - value: 네임드 그래프 이름
    - type: FETCH(즉시) / LOAD(기본 전략 보존)
- **역할**: 메서드별 페치 최적화.
- **주의**: 페치조인과 **동시 남용** 시 중복·데이터 폭증 가능. 페이징과의 상호작용 주의(컬렉션 fetch join 금지 원칙 유지).
## **6) 네임드 쿼리 & 엔티티 그래프**

### **@NamedStoredProcedureQuery(name, procedureName, parameters={…}, resultClasses|resultSetMappings)**

- **위치**: **엔티티 클래스**
- **매개변수**: name, procedureName, parameters(@StoredProcedureParameter), result 매핑
- **역할**: **저장 프로시저 호출**을 네임드로 선언.
- **주의**: DB 시그니처와 **정확히 일치**해야 함. 벤더 차이 큼.

### **@StoredProcedureParameter(mode=IN|OUT|INOUT, name, type)**

- **위치**: **@NamedStoredProcedureQuery 내부**
- **역할**: SP 파라미터 정의.
---

## **7) 엔티티 생명주기 / 리스너**

- ### **@EntityListeners(ListenerClass.class)**
    - 위치: 엔티티 **클래스**
    - 매개변수: ListenerClass(콜백 메서드가 정의된 클래스, 여러 개 가능)
    - 역할: 엔티티 상태 변화 시점(저장/수정/삭제/로딩)에 콜백을 실행
    - 주의: 리스너 메서드는 public|protected|package-private void method() 형태, 파라미터 없음. 비즈니스 로직 과도 탑재 주의(부작용·성능).
- ### **@PrePersist**
    - 위치: 엔티티 **메서드**
    - 역할: persist 전에 호출(INSERT 직전 값 초기화 등)
 - ### **@PostPersist**
    - 위치: 엔티티 **메서드**
    - 역할: INSERT 후 호출(로그/감사)
- ### **@PreUpdate**
    - 위치: 엔티티 **메서드**
    - 역할: UPDATE 전 호출(갱신 전 검증/정규화)
- ### **@PostUpdate**
    - 위치: 엔티티 **메서드**
    - 역할: UPDATE 후 호출(부가처리)
- ### **@PreRemove**
    - 위치: 엔티티 **메서드**
    - 역할: DELETE 전 호출(참조 정리)
- ### **@PostRemove**
    - 위치: 엔티티 **메서드**
    - 역할: DELETE 후 호출(감사/알림)
- ### **@PostLoad**
    - 위치: 엔티티 **메서드**
    - 역할: 엔티티가 영속성 컨텍스트에 로드된 직후 호출(파생 필드 계산 등)
    - 주의: 지연로딩 트리거/추가 쿼리 발생 주의

---

## **8) 영속성 컨텍스트 주입**

- ### **@PersistenceContext(type=TRANSACTION|EXTENDED, unitName=…)**
    - 위치: 스프링 **빈의 필드/세터**
    - 매개변수:
        - type: TRANSACTION(기본, 트랜잭션 범위) / EXTENDED(상태풀, 대화형)
        - unitName: persistence-unit 이름(멀티 PU 환경)
    - 역할: 컨테이너가 **EntityManager**를 주입
    - 주의: EXTENDED는 오래사는 EM이라 메모리/동시성 관리 주의. 스프링 부트에선 @Autowired EntityManager도 가능하나 표준은 이 어노테이션.
- ### **@PersistenceUnit(unitName=…)**
    - 위치: 스프링 **빈의 필드**
    - 매개변수: unitName(선택)
    - 역할: **EntityManagerFactory** 주입(직접 EM 생성이 필요할 때)
    - 주의: 대부분은 @PersistenceContext로 충분. 팩토리 직접 다룰 이유가 명확할 때만.

---

## **9) 트랜잭션 & 감사(Auditing)**

- ### **@Transactional(readOnly, propagation, isolation, timeout, rollbackFor, noRollbackFor)**
    - 위치: **서비스/레포지토리 클래스 또는 메서드**
    - 매개변수:
        - readOnly=true(읽기 전용 힌트, 플러시 최적화)
        - propagation(REQUIRED, REQUIRES_NEW 등)
        - isolation(READ_COMMITTED 등 DB 격리 수준)
        - timeout(초)
        - rollbackFor / noRollbackFor(예외 기준)
    - 역할: 트랜잭션 경계 설정, 커밋/롤백 자동화
    - 주의: 쓰기 작업은 반드시 트랜잭션 내에서. readOnly라도 지연로딩은 발생 가능. 벌크 DML 후 clear() 고려.
    - 테스트 클래스에 쓰일때: 트랜잭션을 시작하고 **테스트가 끝나면 트랜잭션을 강제로 롤백** (이 어노테이션이 테스트 케이스에서 사용될 때만 롤백)
- ### **@EnableJpaAuditing**
    - 위치: **설정(@Configuration) 클래스**
    - 역할: JPA 감사(Auditing) 기능 활성화
    - 주의: AuditorAware\<T> 빈(작성자/수정자 주입) 구성 필요 시 등록.
- ### **@EntityListeners(AuditingEntityListener.class)**
    - 위치: **감사 베이스 엔티티 클래스(@MappedSuperclass 권장)**
    - 역할: 생성/수정 시각·사용자 필드 자동 세팅
- ### **@CreatedDate / @LastModifiedDate**
    - 위치: **베이스 엔티티 필드**
    - 역할: 생성시각/수정시각 자동 주입
    - 주의: 필드 타입은 java.time.*(예: LocalDateTime) 권장.
- ### **@CreatedBy / @LastModifiedBy**
    - 위치: **베이스 엔티티 필드**
    - 역할: 생성자/수정자 자동 주입
    - 주의: AuditorAware\<T> 구현에서 현재 사용자 제공 필요.
### **@TransactionalEventListener(phase = BEFORE_COMMIT|AFTER_COMMIT|AFTER_ROLLBACK|AFTER_COMPLETION)**

- **위치**: **스프링 빈 메서드**
- **매개변수**: phase
- **역할**: 트랜잭션 단계에 맞춘 **도메인 이벤트** 소비.
- **주의**: AFTER_COMMIT이면 롤백 시 미실행. 퍼블리시 측은 ApplicationEventPublisher.

### **@EnableTransactionManagement**

### **(스프링)**

- **위치**: **설정 클래스**
- **역할**: 명시적 트랜잭션 AOP 활성화(부트는 자동이나 **멀티 프록시/순서** 조정 시 사용).
- **주의**: 프록시 모드 설정/순서 충돌 주의.

## **10) 스프링 데이터 JPA**

- ### **@EnableJpaRepositories(basePackages, repositoryFactoryBeanClass, entityManagerFactoryRef, transactionManagerRef)**
    - 위치: **설정 클래스**
    - 매개변수:
        - basePackages: 리포지토리 패키지
        - repositoryFactoryBeanClass: 커스텀 팩토리 필요 시
        - entityManagerFactoryRef, transactionManagerRef: 빈 이름 지정
    - 역할: 스프링 데이터 JPA 리포지토리 스캔/활성화
    - 주의: 다중 데이터소스면 ref 정확히 지정.
- ### **@Query(value=“JPQL or SQL”, nativeQuery=false|true)**
    - 위치: **리포지토리 메서드**
    - 매개변수:
        - value: JPQL 또는 네이티브 SQL
        - nativeQuery: 네이티브 사용 여부
    - 역할: 메서드 쿼리 직접 정의
    - 주의: 네이티브는 이식성↓, 매핑·페이징 주의.
- ### **@Modifying(clearAutomatically, flushAutomatically)**
    - 위치: **변경(UPDATE/DELETE) 쿼리 메서드**
    - 매개변수:
        - clearAutomatically: 실행 후 1차 캐시 clear
        - flushAutomatically: 실행 전 flush
    - 역할: DML 쿼리임을 표시하여 executeUpdate 수행
    - 주의: 벌크 연산 후 영속성 컨텍스트와 DB 불일치 주의(보통 clear).
- ### **@Param(“name”)**
    - 위치: **리포지토리 메서드 파라미터**
    - 역할: 쿼리 파라미터 바인딩 이름 매핑
- ### **@Lock(LockModeType.PESSIMISTIC_\*|OPTIMISTIC|OPTIMISTIC_FORCE_INCREMENT)**
    - 위치: **리포지토리 메서드**
    - 역할: 조회 시 락 모드 부여
    - 주의: 비관적 락은 DB 락·타임아웃 이슈, 낙관적 락은 @Version 필수.
- ### **@QueryHints({@QueryHint(name, value)})**
    - 위치: **리포지토리 메서드**
    - 매개변수: JPA/벤더 힌트 이름/값
    - 역할: 읽기 전용/캐시/페치 전략 등 힌트 부여
    - 주의: 구현체(벤더) 의존적.
- ### **@Procedure(name | procedureName)**
    - 위치: **리포지토리 메서드**
    - 매개변수: name(네임드 SP) 또는 procedureName(DB 프로시저명)
    - 역할: 저장 프로시저 호출
    - 주의: DB별 시그니처·바인딩 차이, 테스트 필수.
- ### **@NoRepositoryBean**
    - 위치: **공통(추상) 리포지토리 인터페이스**
    - 역할: 스캔 대상에서 제외(직접 구현체 생성 방지)
- ### **@RepositoryDefinition(domainClass, idClass)** _(레거시)_
    - 위치: **인터페이스**
    - 매개변수: domainClass, idClass
    - 역할: @Repository 없이 도메인 타입 지정
    - 주의: 최신에선 JpaRepository 상속 권장.
------
## **11) Web MVC (필요한 것만)**

### **11-1) 핸들러/매핑**

- ### **@Controller**
    - 위치: **클래스**
    - 역할: MVC 컨트롤러(뷰 반환)
- ### **@RestController**
    - 위치: **클래스**
    - 역할: @Controller + @ResponseBody(JSON 등 바디로 직렬화)
- ### **@RequestMapping**
    - 위치: **클래스/메서드**
    - 매개변수: value|path, method, consumes, produces, params, headers
    - 역할: 요청 매핑의 공통·상세 조건
- ### **@GetMapping / @PostMapping / @PutMapping / @DeleteMapping / @PatchMapping**
    - 위치: **메서드**
    - 매개변수: value|path, consumes, produces, …
    - 역할: HTTP 메서드별 축약 매핑

### **11-2) 바인딩/직렬화**

- ### **@RequestParam**
    - 위치: **메서드 파라미터**
    - 매개변수: name, required, defaultValue
    - 역할: 쿼리스트링/폼 파라미터 바인딩
- ### **@PathVariable**
    - 위치: **메서드 파라미터**
    - 매개변수: name, required
    - 역할: 경로 변수 바인딩
- ### **@RequestBody**
    - 위치: **메서드 파라미터**
    - 역할: HTTP 바디(JSON 등)를 객체로 역직렬화
    - 주의: 메시지 컨버터 설정/검증(@Valid)과 함께 사용
- ### **@ResponseBody**
    - 위치: **메서드/타입**
    - 역할: 리턴값을 HTTP 바디로 직렬화
- ### **@ResponseStatus**
    - 위치: **메서드/타입**
    - 매개변수: code, reason
    - 역할: 고정 상태코드 지정
- ### **@RequestHeader / @CookieValue**
    - 위치: **메서드 파라미터**
    - 역할: 헤더/쿠키 바인딩
- ### **@ModelAttribute**
    - 위치: **메서드/파라미터**
    - 역할: 폼 객체 바인딩+모델 탑재
- ### **@RequestPart**
    - 위치: **메서드 파라미터**
    - 역할: 멀티파트(파일/파트) 바인딩

### **11-3) 전역/예외/세션**

- ### **@ControllerAdvice / @RestControllerAdvice**
    - 위치: **클래스**
    - 역할: 전역 예외/바인딩 처리, 공통 응답 가공
- ### **@ExceptionHandler(Exception.class …)**
    - 위치: **메서드**
    - 역할: 특정 예외를 처리하는 핸들러
- ### **@SessionAttributes / @SessionAttribute**
    - 위치: **클래스 / 메서드 파라미터**
    - 역할: 모델/개별 값을 세션에 보관/조회
    - 주의: 세션 클리어 타이밍 관리
- ### **@CrossOrigin(origins, methods, maxAge, allowedHeaders, exposedHeaders, allowCredentials)**
    - 위치: **클래스/메서드**
    - 역할: CORS 허용
    - 주의: 자격증명 허용 시 오리진 와일드카드 불가 등 브라우저 제약 이해 필요

---

## **12) DI / 구성 (Spring)**

- ### **@SpringBootApplication**
    - 위치: **애플리케이션 시작 클래스**
    - 역할: @Configuration + @EnableAutoConfiguration + @ComponentScan 묶음
- ### **@Configuration**
    - 위치: **클래스**
    - 역할: 자바 기반 설정 클래스
- ### **@Bean**
    - 위치: **설정 클래스의 메서드**
    - 매개변수: name, initMethod, destroyMethod
    - 역할: 메서드 리턴 객체를 빈으로 등록
- ### **@Component / @Service / @Repository**
    - 위치: **클래스**
    - 역할: 컴포넌트 스캔 대상(계층 의미 부여)
    - 주의: @Repository는 예외 변환(AOP) 적용 지점
- ### **@ComponentScan(basePackages, includeFilters, excludeFilters)**
    - 위치: **설정 클래스**
    - 역할: 스캔 범위/필터 지정
    - 주의: 과도한 스캔 범위는 스타트업 비용↑
- ### **@Value(”${prop:default}”)**
    - 위치: **필드/파라미터/메서드**
    - 역할: 환경/프로퍼티 값 주입
    - 주의: 대량 설정은 @ConfigurationProperties 권장
- ### **@ConfigurationProperties(prefix, ignoreUnknownFields, ignoreInvalidFields)**
    - 위치: **클래스/메서드**
    - 역할: 묶음 단위 프로퍼티 바인딩
    - 주의: POJO에 게터/세터(또는 생성자 바인딩) 준비
- ### **@Profile(“dev|prod|…”)**
    - 위치: **클래스/메서드**
    - 역할: 활성 프로파일 조건부 빈 등록
- ### **@Import(ConfigClass.class …)**
    - 위치: **설정 클래스**
    - 역할: 다른 설정/셀렉터/레지스트리 임포트
### **@Primary**

- **위치**: **빈 클래스/메서드**
- **역할**: 동일 타입 **여러 빈 중 우선 순위** 지정.
- **주의**: @Qualifier와 함께 설계 의도 명확히.

---
## **13) 검증(Bean Validation)**

### **13-1) 트리거**

- ### **@Valid**
    - **위치**: 파라미터 / 필드 / 리턴
    - **역할**: 해당 객체(및 그 안의 중첩 필드/컬렉션 요소)에 대해 **카스케이드 검증** 수행.
    - **주의**:
        - 컬렉션/맵의 **요소** 검증은 컬렉션 필드에 @Valid가 필요.
        - **메서드 리턴값** 검증은 스프링에서 메서드 검증이 활성화되어 있어야 함(스프링 부트 3+는 기본 활성화, 클래스에 @Validated 권장).
- ### **@Validated(groups=…)**
    - **위치**: **타입(클래스)** / 메서드(스프링)
    - **매개변수**: groups(검증 그룹 클래스 배열)
    - **역할**: 스프링에서 **메서드 파라미터/리턴 검증 트리거** 및 **그룹 검증** 사용.
    - **주의**: JSR 표준은 @Valid, **그룹**이 필요하면 스프링의 @Validated를 사용.

---

### **13-2) 널/문자열**

- ### **@NotNull**
    - **위치**: 필드
    - **역할**: null 금지(빈 문자열/빈 컬렉션은 허용).
- ### **@NotEmpty**
    - **위치**: 필드(문자열/컬렉션/맵)
    - **역할**: null 및 **길이/사이즈 0 금지**.
- ### **@NotBlank**
    - **위치**: 필드(문자열)
    - **역할**: null/빈문자열/공백만으로 구성 금지(트림 후 길이>0).
- ### **@Null**
    - **위치**: 필드
    - **역할**: 반드시 null 이어야 함(생성/읽기 전용 필드 등에 사용).

---

### **13-3) 수치/범위**

- ### **@Min(value)** / **@Max(value)**
    - **위치**: 수치 필드
    - **매개변수**: value(경계값, 포함)
    - **역할**: 하한/상한(이상/이하) 제약.
- ### **@Positive / @PositiveOrZero / @Negative / @NegativeOrZero**
    - **위치**: 수치 필드
    - **역할**: 양수/양수 또는 0 / 음수 / 음수 또는 0.
- ### **@Digits(integer, fraction)**
    - **위치**: 수치/문자열 숫자 필드
    - **매개변수**: integer(정수부 자리수), fraction(소수부 자리수)
    - **역할**: 자리수 제약.
- ### **@DecimalMin(value, inclusive=true|false) / @DecimalMax(value, inclusive=…)**
    - **위치**: BigDecimal/문자열 숫자 등
    - **매개변수**: value(경계), inclusive(기본 true)
    - **역할**: 실수 경계 제약.
    - **주의**: 소수 비교 시 **문자열 비교 아님**, 숫자 비교.
- ### **@Size(min, max)**
    - **위치**: 문자열/컬렉션/맵/배열
    - **매개변수**: min, max
    - **역할**: 길이/사이즈 범위.
### **@Length(min, max)**

Hibernate Validator

- **위치**: **문자열 필드**
- **역할**: @Size와 유사하나 **문자열 전용**.

### **@Range(min, max)**

Hibernate Validator

- **위치**: **수치 필드**
- **역할**: 값 범위 제약(정수/롱에 자주 사용).

### **@URL(protocol, host, port, regexp, flags)**

Hibernate Validator

- **위치**: **문자열**
- **역할**: URL 형식 검증.

### **@UUID(version=… )**

Hibernate Validator

- **위치**: **문자열**
- **역할**: UUID 형식(필요 시 버전) 검증.
---

### **13-4) 형식/날짜**

- ### **@Email(regexp=…, flags=…)**
    - **위치**: 문자열
    - **매개변수**: regexp(추가 패턴), flags(Pattern.Flag…)
    - **역할**: 이메일 형식 검증(느슨함).
    - **주의**: 엄격한 도메인 규칙은 **추가 @Pattern**으로 보완.
- ### **@Pattern(regexp, flags)**
    - **위치**: 문자열
    - **매개변수**: regexp, flags
    - **역할**: 정규식 매칭.
- ### **@Past / @PastOrPresent / @Future / @FutureOrPresent**
    - **위치**: 날짜/시간 타입
    - **역할**: 과거/현재 포함 과거 / 미래 / 현재 포함 미래.
    - **주의**: 비교 기준은 **ClockProvider(시스템 시간대)**. LocalDate vs Instant 비교 시 **타임존 차이** 유의.

---

### **13-5) 그룹/시퀀스**

- ### **@ConvertGroup(from, to)**
    - **위치**: 필드/파라미터
    - **매개변수**: from(원 그룹), to(대상 그룹)
    - **역할**: **중첩 객체 검증 시 그룹 변환**.
- ### **@GroupSequence({…})**
    - **위치**: 인터페이스(그룹 정의)
    - **매개변수**: 그룹 배열(검증 **순서** 정의)
    - **역할**: 그룹 검증 순서를 지정(선행 그룹 실패 시 이후 그룹 스킵).
    - **주의**: 순환/자기 포함 금지.

---

## **14) Hibernate 확장(선택)**

### **14-1) 타임스탬프/불변**

- ### **@CreationTimestamp**
    - **위치**: 필드
    - **역할**: INSERT 시점에 DB/세션 시간이 자동 세팅.
    - **주의**: 하이버네이트 전용. DB default와 **중복 설정** 주의.
- ### **@UpdateTimestamp**
    - **위치**: 필드
    - **역할**: UPDATE 시점에 자동 갱신.
    - **주의**: 트리거/DB default와 경합 시 값 불일치 가능.
- ### **@Immutable**
    - **위치**: 엔티티 클래스
    - **역할**: 엔티티를 **읽기 전용**으로 취급(더티체킹/UPDATE 없음).
    - **주의**: 변경 시 반영되지 않음(설계 상 불변 aggregate에만).

---

### **14-2) 성능/페치/배치**

- ### **@BatchSize(size)**
    - **위치**: 엔티티 클래스 **또는** 컬렉션/연관 필드
    - **매개변수**: size(한 번에 로딩할 개수)
    - **역할**: LAZY 로딩 시 **IN 절**로 묶어 N+1 완화.
    - **주의**: 너무 크면 IN 폭증/메모리 부담.
- ### **@Fetch(FetchMode.JOIN | SUBSELECT | SELECT)**
    - **위치**: 연관/컬렉션 필드
    - **매개변수**: FetchMode
    - **역할**: 하이버네이트의 **연관 로딩 전략 힌트**.
        - JOIN: 항상 조인으로 로딩
        - SUBSELECT: 동일 부모들에 대해 서브셀렉트 1회
        - SELECT: 기본(개별 선택)
    - **주의**: 무분별한 JOIN은 **카테시안 폭증**/중복 유발. JPA 표준 fetchType과 다름.
- ### **@FetchProfile(name, fetchOverrides=…)**
    - **위치**: 엔티티/패키지
    - **매개변수**: name, FetchOverride(entity, association, mode)
    - **역할**: 특정 시나리오에서 **일괄 페치 전략 전환**.
    - **주의**: 활성화는 세션 수준(session.enableFetchProfile(...)) — JPA 표준 아님.

---

### **14-3) SQL 커스터마이징/필터**

- ### **@SQLDelete(sql) / @SQLDeleteAll(sql) / @Loader(namedQuery)**
    - **위치**: 엔티티 클래스
    - **매개변수**:
        - sql: 커스텀 DELETE/벌크 DELETE SQL
        - namedQuery: 커스텀 로딩용 네임드쿼리 이름
    - **역할**: **소프트 삭제**(플래그 업데이트)나 **특수 로딩** 구현.
    - **주의**: **DB 트리거/기본값**과 충돌 주의, 벌크 삭제는 영속성 컨텍스트 불일치 → **clear** 권장.
- ### **@Where(clause) / @FilterDef(name, parameters) / @Filter(name, condition) / @Subselect(sql) / @Synchronize({ “table” })**
    - **위치**: 엔티티 클래스(일부는 필드도 가능)
    - **역할 & 주의(어노테이션별)**:
        - ### **@Where(clause=“deleted=false”)**
            - **역할**: 모든 SELECT에 **정적 조건**을 추가(행 숨김).
            - **주의**: **파라미터 불가**, UPDATE/DELETE에는 적용 안 됨. 네이티브/벌크 쿼리에선 무력.
        - ### **@FilterDef(name=“active”, parameters=@ParamDef(name=“now”, type=“java.time.Instant”))**
            - **매개변수**: name, @ParamDef(name, type)
            - **역할**: **동적 필터 정의**(파라미터 타입 포함).
            - **주의**: 정의만 하고 **활성화 필요**.
        - ### **@Filter(name=“active”, condition=“start_at <= :now and end_at > :now”)**
            - **역할**: 엔티티에 **필터 적용 규칙** 연결.
            - **주의**: 현재 세션에서 enableFilter("active").setParameter("now", …) 해야 동작.
        - ### **@Subselect(sql=“select … from …”)**
            - **역할**: **뷰 같은 읽기 전용 엔티티**를 서브쿼리로 정의.
            - **주의**: **반드시 @Id 필요**, 보통 **갱신 불가**. 캐시 일관성 위해 @Synchronize 권장.
        - ### **@Synchronize({ “table1”, “table2” })**
            - **역할**: 해당 테이블이 변경되면 쿼리 전에 **flush/동기화** 보장.
            - **주의**: 과도하면 성능 저하. @Subselect와 함께 자주 사용.
### **@WhereJoinTable(clause=”…”)/@FilterJoinTable(name=”…”, condition=”…”)**

- **위치**: **컬렉션 연관 필드**
- **역할**: **연결(조인) 테이블**에 정적/동적 조건 부여.
- **주의**: JPQL/컬렉션 로딩 시에만 반영. 동적 필터는 세션 활성화 필요.
---

### **14-4) 타입/자연키/계산식**

- ### **@Type(type|value) / @TypeDef(name, typeClass)**
    - **위치**: 필드 / 클래스
    - **매개변수**: 사용자 정의 타입 클래스
    - **역할**: JSON/ARRAY 등 **특수 DB 타입** 매핑(하이버네이트 사용자 타입).
    - **주의**: 가능하면 표준 **@Converter** 우선 검토(이식성↑).
- ### **@NaturalId / @NaturalIdCache**
    - **위치**: 필드 / 클래스
    - **역할**: **자연키**로 로딩/캐싱 최적화.
    - **주의**: 유니크 보장 필수, 변경 시 캐시/동등성 문제가 생길 수 있음(가능하면 **불변 자연키**).
- ### **@Formula(“sql_expr”)**
    - **위치**: 필드
    - **매개변수**: sql_expr(SELECT에 포함될 식)
    - **역할**: DB 계산 결과를 **읽기 전용** 필드로 노출.
    - **주의**: 업데이트 불가, **정렬/조건**에 쓰면 식이 그대로 삽입되어 성능 영향 가능.
- ### **@NotFound(action=IGNORE)**
    - **위치**: 연관 필드
    - **매개변수**: action=IGNORE
    - **역할**: 끊어진 FK를 **null처럼 무시**.
    - **주의**: **데이터 정합성 은폐** 위험 큼(운영에서 지양, 마이그레이션 한시적 용도).

## 14-5) 2차 캐시 세부**

### **@Cache(usage=READ_WRITE|NONSTRICT_READ_WRITE|READ_ONLY|TRANSACTIONAL, region=”…”, include=ALL|NON_LAZY)**

- **위치**: **엔티티/컬렉션 필드**
- **매개변수**: usage(일관성 전략), region(영역명), include
- **역할**: 하이버네이트 **2차 캐시 전략** 지정.
- **주의**: 쓰기 패턴과 일관성 모델을 맞춰야 함(READ_ONLY는 **절대 갱신 금지**).

## 14-6) Envers(이력 감사)**

### **@Audited(targetAuditMode=NOT_AUDITED|AUDITED)**

- **위치**: **엔티티/필드**
- **역할**: 변경 이력 테이블(**_AUD**) 자동 관리.
- **주의**: 대용량 테이블에서는 저장 비용↑. 변경 빈도/보관 주기 설계.

### **@NotAudited**

- **위치**: **필드**
- **역할**: 특정 필드를 **이력 제외**.

### **@AuditOverride(s)**/@AuditJoinTable**

- **역할**: 상속/연관의 감사 동작 **오버라이드/조정**.

## 14-7) DB 생성/타입 고급**

### **@Generated(value=ALWAYS|INSERT)** **(Hibernate)**
- **위치**: **필드**
- **역할**: DB가 **계산/기본값으로 채우는 컬럼**임을 선언(읽기 타이밍 조정).
- **주의**: flush/refresh 타이밍과 상호작용.

### **@JdbcTypeCode(Types.JSON|… )** **(Hibernate 6)**
- **위치**: **필드**
- **역할**: 특정 JDBC 타입으로 강제 매핑(JSON 등).
- **주의**: 방언/드라이버 지원 필요.
