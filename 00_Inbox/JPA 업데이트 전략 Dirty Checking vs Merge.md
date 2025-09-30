---
type: 생각조각
status: inbox
source: 
creation_date: 2025-09-16
---
- 전제 개념: [[JPA_업데이트·동기화_흐름(persist_remove_flush_commit)|JPA_업데이트·동기화_흐름(persist_remove_flush_commit)]]
## **TL;DR**

- **수정의 정석:** 조회 → (도메인 메서드로) 필요한 필드만 변경 → 커밋
- **신규 생성:** **ID 없이** persist
- **merge()는 최후의 수단:** 스냅샷 **전체 치환**이라 누락 필드가 **NULL로 덮어쓰기**될 위험 큼
- **레이어 원칙:** 컨트롤러는 **폼/DTO만 다루고**, 엔티티 생성·변경은 **서비스(트랜잭션)** 에서

---
## 요약

공통점

- **조회→변경(권장)**: DB/컨텍스트에서 **영속 엔티티를 ‘새로 로드’** 해서 개발자가 필드를 선택해 직접 수정한다.
- **merge(detached)**: DB/컨텍스트에서 **영속 엔티티를 ‘새로 로드’** 해본뒤, DB조회에도 없으면 persist와 같은 과정을 걸쳐 영속객체를 만들고, 영속 객체에 준영속 객체의 필드 전체를 복사한다
	- DB조회에도 없는경우: 회원정보가 없는 신규회원이 회원가입하는경우
	- merge가 persist 기능을 대신해준다고 해도 개발자는 명시적으로 persist를 사용할것
- **조회→변경(권장)**: 1차캐시조회해보고 없으면 DB/컨텍스트에서 **영속 엔티티를 ‘새로 로드’** 해서 개발자가 필드를 선택해 직접 수정한다.
- **merge(detached)**: 1차캐시 조회해보고 없으면 DB/컨텍스트에서 **영속 엔티티를 ‘새로 로드’** 해본뒤, DB조회에도 없으면 persist와 같은 과정을 걸쳐 영속객체를 만들고, 영속 객체에 준영속 객체의 필드 전체를 복사한다
	- DB조회에도 없는경우: 회원정보가 없는 신규회원이 회원가입하는경우
	- merge가 persist 기능을 대신해준다고 해도 개발자는 명시적으로 persist를 사용할것
## 요약

두 메커니즘 모두 **1차 캐시를 활용**.

1. 1차 캐시 조회: 대상 엔티티의 ID를 사용하여 **1차 캐시에 해당 엔티티가 있는지 확인**합니다.
2. 만약 캐시에 없다면 **DB에 `SELECT` 쿼리를 실행**하여 DB의 데이터를 가져온 후, 그 엔티티를 **1차 캐시에 저장(영속 상태로 만듦)** 합니다.
3. DB조회에도 없다면 (신규회원의 회원가입)
	- **조회→변경**: DB에 없으면 null 반환하고 끝
	- merge: persist와 같은 과정을 걸쳐 영속객체를 만들고, 영속 객체에 준영속 객체의 필드 전체를 복사한다
		-  merge가 persist 기능을 대신해준다고 해도 개발자는 명시적으로 persist를 사용할것
4. **DB 반영 (UPDATE 준비)**: **영속 엔티티에 적용된 변경을 flush 때 감지(Dirty Checking)해서 SQL을 보낸다**.
	- 두 경우 모두 최종적으로 변경된 내용이 감지되면 **`UPDATE(기존변경)`/`INSERT(새로생성)` 쿼리가 쓰기 지연 저장소에 등록**되고, 트랜잭션 커밋(`commit()`) 시점에 DB에 반영됩니다(Flush).

> 차이점: **Dirty가 ‘어떻게 만들어졌는지’** 가 완전히 다름 (선택적 변경 vs 스냅샷 복사).

## 1. 조회->수정

`find()` : 로드된 영속 엔티티를 **그대로 반환**하고 대기. **없으면 끝** → null/Optional.empty() 반환, **새로 안 만듦**

1. 서비스 메서드에서 **@Transactional 시작**: 영속성 컨텍스트 오픈
2. **ID로 영속 엔티티 조회** (findById)
	- **1차 캐시 조회 및 저장**.
3. **의미 있는 변경 메서드**로 필요한 필드만 수정 (changeName, changePrice 등)
	- 엔티티에 **더티 표식**(스냅샷 대비 변경 플래그)만 남음
4. **flush** (커밋 직전/쿼리 전 자동 혹은 명시적)
    - 이때 **Dirty Checking 실행** → 바뀐 필드가 있으면 **UPDATE 생성·전송**
5. **commit**
    - 트랜잭션 확정, 컨텍스트 종료 → 엔티티는 **준영속(detached)**
```java
@Transactional
public void updateItem(Long id, ItemUpdateParam p) {
  Item item = itemRepository.findById(id).orElseThrow();
  item.changeName(p.getName());
  item.changePrice(p.getPrice());
  item.changeStockQuantity(p.getStockQuantity());
  // save/merge 호출 불필요
}
```

### **장점**

- **부분 업데이트** 안전
- **권한/검증 규칙**을 도메인 메서드로 강제
- **NULL 덮어쓰기 없음**
- 변경 지점이 **메서드로 수렴**되어 추적·테스트 용이
- 조회한 **영속 엔티티**를 그대로 사용

---

## **2.** **merge() -병합**

- 파라미터(준영속/복원 엔티티)의 **모든 필드**를 DB에서 찾은 **새 영속 엔티티**에 **복사** → 그 **새 엔티티를 반환**
- 인자로 받은 **준영속 객체의 변경된 내용**을 방금 로드한 **영속 엔티티에 복사**하고 반환.
- **이미 한 번 DB에 저장되었다가 영속성 컨텍스트에서 분리된(Detached) 객체**를 다시 관리 대상(Managed)으로 되돌릴 때 사용됩니다.
1. **준영속 객체**: 영속성 컨텍스트 **밖**에서 수정된 객체(`detachedEntity`)가 존재
2. **트랜잭션 시작** → 영속성 컨텍스트 오픈
3. **em.merge(detached) 호출**
	- **1차 캐시 조회 및 저장**
    - **모든 속성**을 영속 인스턴스에 **복사**(누락 필드 null도 포함)
    - **반환값이 영속 인스턴스**이고, **넘긴 객체는 계속 준영속**
4. **flush**
    - 복사로 인해 달라진 부분을 Dirty Checking이 계산 → **UPDATE/INSERT 전송**
5. **commit**
    - 확정, 컨텍스트 종료
### **위험**

- 요청에 **없는 필드 = NULL** 로 **덮어쓰기**
- **선택적 변경** 불가(전체 갈아끼우기)
- 권한 밖 필드가 의도치 않게 갱신될 수 있음

> 결론: **폼이 “완전 스냅샷”임을 보장**할 때만, **화이트리스트/NULL-무시 복사** 등 가드와 함께 제한적으로 사용.
---

## **C. 레이어드 아키텍처 원칙**

- **컨트롤러**
    - 폼 → **DTO(Command)** 로 변환만
    - 엔티티 **생성·변경 금지**
- **서비스(트랜잭션 경계)**
    - **조회 → 변경감지** 수행
    - 파라미터 많으면 **전용 Command DTO** 도입
- **엔티티**
    - **세터 남발 금지**, 의미 있는 **도메인 변경 메서드** 제공
    - 컬렉션/연관관계는 **편의 메서드**로 일관성 유지

```java
public record UpdateItemCommand(Long id, String name, Integer price, Integer stockQuantity) {}

@Transactional
public void updateItem(UpdateItemCommand c) {
  Item item = repo.findById(c.id()).orElseThrow();
  item.changeName(c.name());
  item.changePrice(c.price());
  item.changeStockQuantity(c.stockQuantity());
}
```

---

## **D. 체크리스트 (실무용)**

- **신규**: ID 미지정 + persist
- **수정**: findById 후 **필드만 변경**(Dirty Checking)
- 컨트롤러 → **DTO만 전달**, 서비스에서 **명시적 매핑/검증**
- 엔티티에 **change*** 메서드로 변경 수렴
- **수정 가능/불가 필드** 구분(예: price, stockQuantity만 수정; isbn 등은 금지)
- merge() 필요한 경우 **NULL-무시/화이트리스트 복사**로 가드

---

## **E. 안티패턴**

- new Entity() 후 **ID만 세팅**해서 저장 → JPA가 **준영속**으로 보고 merge() 경로로 빠짐(전체 덮어쓰기 위험)
- 변경 후 **save() 습관** → JPA에선 **불필요**(커밋 시 자동 반영)
- 컨트롤러에서 **엔티티 직접 생성/수정**

---

## **한 줄 마무리**

> **“폼은 DTO로 끝, 수정은 서비스 트랜잭션에서 ‘조회→도메인 변경→커밋’.”**
> 이 규칙만 지키면 안전성·가독성·추적성·테스트가 모두 좋아집니다.