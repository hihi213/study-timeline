---
type: 생각조각
tags:
source:
creation_date: 2026-10-02
---

# 🔍 맥락
- 처음 떠올랐던 상황:
- 이 정리가 중요한 이유:
- 이 노트가 연결되면 좋을 것 같은 방향 (예: “개발자 커리어 불안 시리즈로 묶기”)

# 📜 원본
{{BLOCK_REFERENCE}}

# 📝 정리
> 여기에 나의 언어로 재작성

## 처리 논리

### 문제: 받은 문자열을 DB 통신도구를 이용해 그대로 DB에 직접저장한다
- 본문은 JSON 문자열이다. 그런데, 악의적으로 필수값이 빠져있거나 들어오면 안되는 값이 들어있다면(수량에 -1를 입력) 서버에서 안걸려지고 네트워크 통신 낭비하며 DB까지 간뒤에 튕기는 자원낭비를 하게 된다 (db에서 제약조건 걸어뒀을 경우에만 튕김)
- DB에서도 막을수있지만, 스프링 서버에서 1차로 미리 걸러내는 것이 실무의 정석

#### 올바른 처리
- 1. controller계층: spring이 외부에서 받은 요청데이터를 DTO 객체에 담는다 (파싱) 그후 controller가 Service 계층에 전달
	- DTO의 검증 애너테이션이 규칙을 정의하고, Controller의 `@Valid`가 검증 실행해 기초적인 에러를 반환
	- 예: 마이너스인 수량 감지
- 2. Service(비즈니스)계층: 1차 검증된 DTO를 테이블에 매핑되는 엔티티 객체로 변환후 Repository계층에 전달
	- 고도화된 비즈니스 규칙이 2차검증해 적발뒤 에러를 반환
	- 예: 이 상품이 이미 단종처리된것인가 류의 DB확인하는 검증 등
- 3. Repository 계층: 저장을 요청
	- JPA 구현체인 Hibernate가 Service에서 받은 엔티티 객체를 SQL 쿼리문으로 변환
- 4. DB에 저장되면 보통 식별자가 부여된다. 응답본문에 식별자를 담아 클라이언트에 돌려줘서 제대로 저장됐는지/방금 등록된 식별자를 알려준다.
	- Service/Controller는 저장된 Entity에서 클라이언트에게 전달할 필드들만 골라 **Response DTO**에 담아 응답합니다.


```text
요청: POST /items
입력 본문: {"name":"노트","quantity":3}
처리: 요청 DTO → Service → Entity 저장 → 응답 DTO를 클라이언트에게 반환
응답 상태 코드: 201 Created
응답 본문: {"id":1,"name":"노트","quantity":3}
```


## 구현논리_엔티티

**물품 하나를 DB에 저장할 형태인 `Item` Entity**를 작성하자. Entity는 DB 테이블의 한 행과 연결되는 Java 클래스야.
```java  
private Long id; //새 물품을 생성해서 아직 DB에 INSERT하기 전 상태라면, DB가 자동 발급(Auto Increment)해주기 전이므로 식별자가 존재하지 않는 상태(null)여야 합니다.  
private String name;  
private Integer quantity; // 수량 데이터가 아직 확정되지 않았거나 입력되지 않았을 때, 이를 '수량 0개'와 '값 없음(null)'으로 구분할수있어야한다.  
```  
- 해당 객체가 제공하는 생성자/비즈니스메서드를 통해서만 상태를 제어하기 위해 모든 필드를 private으로 감춥니다. (public이면 외부 클래스가 변조가능)  
- 래퍼 클래스(`Long`, `Integer`) 사용 이유: `null`과 `0`의 명확한 구분
	- 기본형(`long`, `int`): 기본값이 `0`이며 `null`을 가질 수 없음
	- 래퍼 클래스(`Long`, `Integer`): 참조 타입이므로 `null` 할당 가능
	- 적용 목적: DB 저장 전 상태(ID 없음)나 값 미입력 상태를 숫자 `0`과 혼동 없이 구분하기 위함


### 이제 클래스 안에 생성자 두 개를 추가하자.  
  
```java  
protected Item() {  
}  
  
public Item(String name, Integer quantity) {  
    this.name = name;    this.quantity = quantity;}  
```  
  
- **기본 생성자**는 JPA가 DB 조회 결과로 `Item` 객체를 만들 때 필요해. JPA는 `public` 또는 `protected` 기본 생성자를 요구해.  
- **이름·수량 생성자**는 우리가 새 물품을 만들 때 사용해. `id`는 DB가 생성하므로 받지 않아.  
  
자바 컴파일러는 클래스에 생성자가 하나도 없을 때만 기본 생성자를 자동으로 만들어 줍니다. 그래서 매걔변수 생성자만 추가하면 기본생성자 자동 생성이 사라지므로, 기본 생성자도 명시해야 해.

### JPA 엔티티 클래스에는 기본생성자가 필수인 이유:
- DB에서 데이터를 조회해 올 때, JPA/Hibernate는 객체를 리플렉션을 사용해 인스턴스화하고 값을 채워넣는다
- 리플렉션 기술은 클래스의 이름과 메타정보만 보고 "일단 매개변수가 없는 기본 생성자로 껍데기 객체를 먼저 만든 뒤, private 필드에 직접 값을 꽂아 넣는 방식"으로 동작합니다.
- 만약 기본 생성자가 아예 없다면 Hibernate는 어떤 매개변수에 뭘 넣어야 할지 알 수 없어 객체를 생성하지 못하고 예외를 던집니다. 이것이 **기본 생성자가 반드시 필요한 이유**입니다.

### 기본 생성자가 protected인 이유
- **프록시(가짜 객체) 상속:** JPA는 지연 로딩 등을 구현할 때 `Item`을 상속받은 가짜 자식 객체(Proxy)를 동적으로 만들어냅니다. 자식 클래스가 부모의 기본 생성자를 호출할 수 있어야 하므로 `private`은 안 되고, 최소 `protected`여야 합니다.
- **개발자의 실수 방지 (불완전한 객체 차단):** 만약 `public Item() {}`으로 열어두면, 동료 개발자가 실수로 필드가 텅 빈 `new Item()`을 마구 만들어 쓸 위험이 있습니다. `protected`로 막아두면 같은 패키지나 상속 관계가 아닌 일반 비즈니스 코드에서는 빈 객체 생성이 원천 차단됩니다.

[자바의 프록시 생성과 상속](자바의%20프록시%20생성과%20상속.md)


### 그리고 저장 결과를 응답 DTO로 옮길 수 있도록 `getId()`, `getName()`, `getQuantity()`를 작성해 줘. 각각 해당 필드를 반환하는 `public` 메서드야.

#### getid
```java
public Long getId(){  
    return id;  
}
```
- **저장 직후:** DB가 방금 발급한 새 ID를 파악하기 위해 `getId()` 호출
- **재방문 시:** 클라이언트가 "내 목록 줘(`GET /items`)"라고 요청하면 서버가 DB에서 꺼내 **ID가 이미 포함된 전체 목록 데이터**를 통째로 내려주므로, 클라이언트 입장에서 `getId`를 따로 호출할 이유가 없다.

### getName, getQuantity

```java
public String getName(){//객체안이므로 name을 알아내는데 id가 필요하지 않다. id는 db식별용이다  
    return name;  
}
```

- **`id`의 역할:** DB에서 수많은 행(row) 중 특정 데이터를 식별(검색)하기 위한 번호표
- **Getter의 역할:** 이미 특정 인스턴스(객체) 내부이므로, 자기 `name`이나 `quantity`를 꺼낼 때는 `id` 없이 바로 읽기만 하면 됨

## 구현논리_repository구현
이제 **DB 저장·조회 창구인 `ItemRepository`**를 만들자.  
  
`Item.java`와 같은 패키지에 `ItemRepository.java`를 만들고, `public interface`로 선언해. 인터페이스 이름 뒤에는 다음을 붙이면 돼.  
  
```java  
extends JpaRepository<Item, Long>  
```  
  
필요한 import는 다음이야.  
  
```java  
import org.springframework.data.jpa.repository.JpaRepository;  
```  
  
`<Item, Long>`은 **저장할 Entity가 `Item`이고, ID 타입이 `Long`**이라는 뜻이야. Spring Data JPA가 구현 객체를 만들어 주므로, 내부는 비워 두면 돼.  
  
이 Repository에서 사용할 핵심 기능은 두 개야.  
  
- `save(item)`: 물품 저장  
- `findById(id)`: ID로 물품 조회  
  
### 용어정리

- **JPA(Java Persistence API)**: Java 객체와 DB 테이블을 매핑하고 저장·조회하기 위한 **표준 명세와 API**를 제공한다.
	1. **명세 문서**: 객체와 테이블을 매핑하는 방식, 저장·조회 시 동작 규칙 등을 정의한다
	2. **표준 API 코드**: 매핑 정보를 표현하는 애너테이션과 구현체가 제공해야 할 기능의 인터페이스를 정의한다.
		- `@Entity`, `@Id`, `@Table`, `@Column`: 객체와 테이블의 매핑 정보를 지정한다.
		- `EntityManager`: 개발자가 DB 작업을 (기본 CRUD용 SQL과 JDBC 연결 코드등)을 직접 작성하지 않고 처리할 수 있도록 `persist()`, `find()`, `remove()` 등 객체의 저장·조회·삭제와 생명주기를 관리하는 메서드가 선언된 인터페이스
- **Hibernate**: JPA의 비어있는 메서드 본문을 구현한 **구현체**. 매핑 정보를 해석하고 SQL을 생성해 JDBC로 실행하는 실제 구현 코드를 개발자가 구현한 구현체
- **Spring Data**: 여러 종류의 데이터 저장소에 접근하는 코드를 줄여 주는 Spring 프로젝트
	- **Spring Data JPA**: Spring Data 중 JPA를 사용하는 부분. 우리가 작성한 Repository 인터페이스를 바탕으로 구현 객체를 만들어 준다.
		- **`JpaRepository<Entity 타입, ID 타입>`**: Spring Data JPA가 제공하는 인터페이스. 기본 CRUD에서는 SQL과 JDBC 연결 코드를 직접 작성하지 않고 `save()`, `findById()` 같은 메서드를 사용할 수 있다.
.




## AI 논리
**1. Controller 계층 (요청 수신 및 1차 검증)**
- **역할:** 외부 요청 데이터(JSON)를 DTO 객체로 변환(파싱)하여 Service로 전달
- **검증:** 어노테이션(`@Valid` 등)을 통한 기초적인 데이터 형식 및 범위 검증 (예: 마이너스 수량 감지)
 
**2. Service 계층 (비즈니스 로직 및 2차 검증)**

- **역할:** 핵심 비즈니스 규칙을 수행하고, 검증된 DTO를 DB용 Entity 객체로 변환하여 Repository로 전달
- **검증:** DB 조회 등 상황 맥락이 필요한 고도화된 비즈니스 검증 (예: 단종 상품 여부, 재고 부족 확인)

**3. Repository 계층 (DB 접근 및 저장)**

- **역할:** Service로부터 넘겨받은 Entity 객체의 상태를 SQL 쿼리문으로 변환하여 실제 물리적 DB에 실행

**💡 한 줄 흐름 요약**

`[클라이언트]` $\rightarrow$ **Controller**(DTO 파싱 & 1차 형식 검증) $\rightarrow$ **Service**(Entity 변환 & 2차 비즈니스 검증) $\rightarrow$ **Repository**(SQL 실행) $\rightarrow$ `[DB]`

## 💭 추가적 생각/질문


## 03_Notes 이동기준
>부담감 때문에 인박스(Inbox)에 노트가 쌓이기만 하는 현상을 줄이기위해 하단을 만족하면 이동한다.
- 외부 정보를 나의 언어로 완전히 다시 작성했는가?
- 작성자의 관점(메타 사고)이 포함되었는가?
- 다른 관련 노트와 상호 참조(Link)가 준비되었는가?
