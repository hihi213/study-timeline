---
type: 생각조각
status: inbox
source: 
creation_date: 2025-09-17
---

# **TL;DR**

- **테스트는 인메모리 H2**로 돌리면 빠르고 외부 DB에 영향 없음.
- src/test/resources/application.yml이 **메인 yml보다 우선** 적용된다.
- **설정 안 해도**(H2 의존성만 있으면) 스프링 부트가 테스트에서 **자동으로 인메모리 H2 + create-drop**로 돌린다.
- 로컬/운영은 별 yml로 분리하고, 테스트는 **반복 가능(깨끗하게 생성→종료 시 드롭)** 하도록 유지.

---

## **1) 설정 우선순위: 메인 vs 테스트**

- 프로젝트에 **main**과 **test** 리소스가 각각 있고,
- **테스트 실행 시에는 test 쪽에 있는 application.yml이 우선** 적용됨.
- 따라서 운영/로컬 설정은 main에, 테스트 전용 설정은 test에 두면 충돌 없이 분리 가능.

---

## **2) 테스트에서 H2 인메모리로 돌리는 방법**

### **방법 A — 명시적으로 URL 지정**

src/test/resources/application.yml

```java
spring:
  datasource:
    url: jdbc:h2:mem:testdb;MODE=MYSQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
    driver-class-name: org.h2.Driver
  jpa:
    hibernate:
      ddl-auto: create-drop
    properties:
      hibernate.format_sql: true
logging.level:
  org.hibernate.SQL: debug
  org.hibernate.orm.jdbc.bind: trace
```

- 장점: 동작이 명확하고 H2 모드/옵션을 직접 통제 가능.

### **방법 B — 아무 설정도 안 하고 자동 구성** **(가장 간단)**

- test 스코프에 **H2 의존성**만 있으면, 스프링 부트가 테스트에서
    - jdbc:h2:mem:… 인메모리 데이터베이스를 자동 생성
    - JPA **ddl-auto: create-drop** 로 시작 시 스키마 생성, 종료 시 **드롭**(깨끗하게 초기화)
- 로그(P6Spy/hibernate SQL)로 보면 커넥션 URL이 jdbc:h2:mem:…로 찍힘.

> 어느 쪽이든 **반복 테스트**가 쉬워지고, 외부 DB 내려가도 테스트는 **독립**적으로 잘 돈다.

---

## **3) 로컬/운영과 테스트의 분리 원칙**

- **테스트**: 빠른 실행·격리 최우선 → **인메모리 H2 + create-drop**
- **로컬 개발**: 외부 H2/Tc/PostgreSQL 등 별도 DB 사용, 스키마는 update나 마이그레이션 도구(Flyway/Liquibase)로 관리
- **운영**: ddl-auto: validate/none, 마이그레이션 도구로만 스키마 변경

```java
# src/main/resources/application.yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/app
  jpa:
    hibernate:
      ddl-auto: validate
```

---

## **4) P6Spy/로그 팁**

- P6Spy를 사용하면 **바인딩 파라미터가 치환된 실제 SQL**이 찍혀 디버깅에 좋다.
- 운영 프로필에서는 비활성화하고, **test/dev 프로필**에서만 켜기.

## **5) 자주 하는 실수 & 체크리스트**

- 테스트용 yml을 **main에 복사**해두고 잊지 않기 → 반드시 **test에만** 두기
- 외부 DB URL이 test에서 우선 적용되는지 확인(테스트 yml이 우선!)
- 스키마가 남아 테스트 간 **상호 오염**되는지 → 인메모리 + create-drop으로 해결
- 로컬/운영의 DDL 전략(validate/none) 확인, 마이그레이션 도입 고려
- SQL 로그 레벨(org.hibernate.SQL, orm.jdbc.bind)은 **test만 trace**로

---

# **6) 예외 테스트 필수 개념**

## **6.1** assertThrows(예외타입, 람다) 권장 방식 (JUnit 5)

- “람다를 실행했을 때 **지정한 예외가 발생**해야 테스트 통과”.
- 반환값으로 **던져진 예외 객체**를 돌려주므로, **메시지/원인**까지 검증 가능.

```java
import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

@Test
void 중복_회원가입_예외() {
    // when & then
    IllegalStateException ex = assertThrows(
        IllegalStateException.class,
        () -> memberService.join(new Member("kim"))   // 예외가 나와야 함
    );
    assertTrue(ex.getMessage().contains("이미 존재하는 회원"));
}
```

### **팁**

- 정확히 그 예외만 허용하려면 → assertThrowsExactly(...)
- 예외가 **나오면 안 되는** 코드 검증 → assertDoesNotThrow(람다)

---

## **6.2 fail("메시지") **— 실패를 “의도적으로” 표시**

- 테스트가 특정 분기까지 **절대 오면 안 되는** 상황을 명시적으로 실패 처리.
- 옛 스타일(try/catch + fail)보다 JUnit 5에서는 assertThrows가 선호되지만,

    다음 경우엔 fail이 여전히 유용:

    1. 외부 라이브러리 제약 등으로 람다 경계에 넣기 까다로운 경우
    2. **방어적 가드**: switch/if의 “도달 불가” 분기 확인
    3. 임시로 “미구현(should not happen yet)” 표시

```java
@Test
void 레거시식_검증_예시() {
    try {
        memberService.join(new Member("kim"));
        fail("여기까지 오면 안 됨: 예외가 발생해야 정상");
    } catch (IllegalStateException ex) {
        assertTrue(ex.getMessage().contains("이미 존재하는 회원"));
    }
}
```

> 정리: **가능하면 assertThrows 사용**, 불가할 때만 fail을 보조적으로 사용.

---

## **6.3 베스트 프랙티스**

- **하나의 테스트는 하나의 행위(Behavior)**를 검증(Given–When–Then).
- 예외 메시지도 계약의 일부라면 **부분 문자열로 검증**(전체 문자열은 변경에 취약).
- 서비스 레이어 예외는 **도메인 예외(커스텀)로 감싸기** → 테스트 가독성↑

```java
class DuplicateMemberException extends RuntimeException {
    DuplicateMemberException(String name) { super("이미 존재: " + name); }
}

@Test
void 도메인예외_검증() {
    DuplicateMemberException ex = assertThrows(
        DuplicateMemberException.class,
        () -> memberService.join(new Member("kim"))
    );
    assertTrue(ex.getMessage().contains("이미 존재"));
}
```
