---
type: 생각조각
status: inbox
source: 
creation_date: 2025-09-10
---

## 📜 원본 맥락
![](../01_Sources/{S}%20김영한%20응용수정전.md#^25yu6q)

---
## 정리
- 상속관계 테이블은 추상클래스로 구현하기
	- item->book,album....
- @Inheritance(strategy = …) 으로 부모클래스라고 알려주고 매핑 전략 설정
- @DiscriminatorColumn(name = "dtype")
	- 여러 자식 클래스들을 **하나의 테이블에 모두 저장할 때, 여러 자식 데이터들 중 어떤 데이터가 어떤 자식 클래스에 해당하는지 구분해 주는 필수적인 식별자** 
### **1)** **SINGLE_TABLE (기본값)**

- **구조**: 부모+자식 모두 **하나의 테이블**에 저장, 구분용 **DTYPE**(판별자) 컬럼 사용.
- **장점**: 조인/UNION 없음 → **조회 빠름**, insert 1번, 인덱싱/유니크 제약 설정 쉬움.
- **단점**: 자식마다 쓰지 않는 컬럼이 **NULL 다수**, 스키마가 **비대**.
- **언제**: 읽기 많고 계층이 단순, NULL 허용 ok.

```java
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name="DTYPE")
```

---

### **2) JOINED**

- **구조**: **부모 테이블 + 자식별 테이블** 분리, 조회 시 **JOIN**.
- **장점**: 정규화, **NULL 컬럼 최소화**, 스키마 깔끔.
- **단점**: 조회마다 **조인 비용**, insert 시 부모+자식 **2회 쓰기**.
- **언제**: 스키마 안정성/정규화 중요, 쓰기/조회 비용 감당 가능.
    
```java
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name="DTYPE") // 권장(식별·디버깅 용이)
```

---

### **3) TABLE_PER_CLASS**

- **구조**: **자식마다 독립 테이블**(부모 테이블 없음). 부모 타입으로 조회 시 **UNION ALL**.
- **장점**: 각 자식 조회는 테이블 1개만 접근 → 단일-타입 조회는 심플.
- **단점**: **다형성 조회가 느림**(UNION), **공통 유니크/인덱스** 일관 관리 어려움.
- **ID 주의**: 전체 계층에서 **ID 충돌 방지** 위해 **공유 시퀀스** 권장.
- **언제**: 거의 비권장. 다형성 조회 드묾 + 자식별 단독 조회 위주일 때만.

```java
@Inheritance(strategy = InheritanceType.TABLE_PER_CLASS)
```

---

## **보조 어노테이션 & 팁**
- @DiscriminatorColumn, @DiscriminatorValue
    - **SINGLE_TABLE 필수**, **JOINED 권장**, **TABLE_PER_CLASS 사용 안 함**.
- @MappedSuperclass
    - **테이블 없음**, 필드/매핑만 **상속 재사용**. 다형성 쿼리 X.
    - “상속 매핑이 필요 없는” 공통 속성(생성일, 수정일 등)에 사용.
- **전략 선택 가이드**
    - **기본 추천**: JOINED (정규화/유연성)
    - **속도·단순성**: SINGLE_TABLE (NULL 많이 생겨도 OK면)
    - **특수 케이스**: TABLE_PER_CLASS (거의 안 씀)
- **성능/쿼리**
    - N+1 피하려면 fetch join/엔티티그래프/배치사이즈 고려.
    - TABLE_PER_CLASS는 부모 타입 조회 시 UNION이라 페이징·정렬 비용 ↑.
- **ID 전략**
    - TABLE_PER_CLASS는 **공유 시퀀스(@SequenceGenerator)** 로 충돌 방지.
- **DDL 관리**
    - 운영에선 Flyway/Liquibase로 스키마 관리, JPA는 validate 권장.

---

## **간단 예시**

```
@Entity
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "DTYPE")
abstract class Product {
  @Id @GeneratedValue Long id;
  String name;
}

@Entity
@DiscriminatorValue("BOOK")
class Book extends Product {
  String author;
}

@Entity
@DiscriminatorValue("ALBUM")
class Album extends Product {
  String artist;
}
```
## 💭 나의 추가적 생각/질문
-