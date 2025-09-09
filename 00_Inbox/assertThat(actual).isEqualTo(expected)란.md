---
type: 생각조각
status: inbox
source: 
creation_date: 2025-09-09
---


## 📜 원본 맥락
![[../01_Sources/{S} 김영한 응용#^ar2qgy]]

---

## 정리
   
   

짧게 결론: **달라요.**

Assert 객체는 테스트 전용 **래퍼(Wrapper)** 이고, actual은 **검증 대상 원본 값**입니다. assertThat(actual)은 actual을 **참조로 품은 Assert 객체**를 만들어 줄 뿐, actual 자체가 되지 않습니다.

> Assert = “검증용 래퍼 객체”, actual = “검증 대상 값”.
> assertThat(actual)은 **actual을 품은 Assert**를 만들어 **체이닝 단언**을 가능하게 합니다.

- 전체 흐름 (요약)
	1. assertThat(actual) 호출
		- AssertJ의 정적 메서드가 actual 타입을 보고 알맞은 Assert 객체를 만든다.
		- 예) String → StringAssert, List\<T> → ListAssert\<T>, 임의 객체 → ObjectAssert\<T>.
		- 이 Assert 객체는 actual(검증 대상)을 참조로 보관하고, 비교 규칙/표현 옵션(메시지 포맷 등)도 같이 들고 있다.
	2. .isEqualTo(expected) 호출
		- 현재 Assert에 저장된 actual과 인자로 받은 expected를 동등성 비교한다.
			타입별 규칙이 적용된다:
		- 일반 객체: equals() 기반(또는 설정한 Comparator).
			- 배열/컬렉션: 내용 비교(요소별 equals).
			- BigDecimal: 기본적으로 스케일 무시하고 compareTo로 가치 비교(예: 10.0 == 10.00).
			-	부동소수: 완전 동일 비교(오차 허용 비교는 isCloseTo 권장).
	3.	판정 결과 처리
		- 성공(동등): 같은 Assert 객체를 그대로 반환 → 체이닝 계속 가능 (예: .isEqualTo(x).isNotNull().extracting(...).isIn(...))
		- 실패(불일치): AssertionError를 던짐
			-	이때 AssertJ가 기대/실제 값, 차이점(diff) 이 보이는 풍부한 실패 메시지를 만들어 준다.
			-	JUnit이 이 예외를 잡아 테스트 실패로 표시.

## 미세 동작(알아두면 좋은 포인트)
-	NPE 안전: assertThat(null).isEqualTo(null)는 통과, null vs 비-null은 실패 메시지 생성.
-	커스텀 비교자: usingComparator(...) 또는 usingRecursiveComparison()으로 비교 전략을 바꿀 수 있음.
-	설명/태그: .as("설명")을 앞에 붙이면 실패 메시지에 설명이 포함됨.
-	소프트 어서션: SoftAssertions를 쓰면 즉시 예외를 던지지 않고 여러 실패를 모아 마지막에 한 번에 보고.

## 아주 작은 예
```Java
import static org.assertj.core.api.Assertions.*;

var names = List.of("Kim", "Lee");

// 1) assertThat : Assert 래퍼 생성(여기선 ListAssert<String>)
assertThat(names)
  // 2) isEqualTo : 내용 동등성 비교(성공하면 체이닝 계속)
  .isEqualTo(List.of("Kim", "Lee"))
  // 추가 단언도 체이닝
  .hasSize(2)
  .contains("Kim");

// 실패 예: AssertionError 던짐(테스트 실패)
assertThat("Hello").isEqualTo("HELLO"); // 대소문자 다름 → 실패 메시지 출력
```
한 줄 정리

assertThat은 “검증용 래퍼”를 만들고, .isEqualTo는 성공 시 체이닝 계속 / 실패 시 AssertionError로 테스트를 끝낸다.
타입별로 똑똑한 비교 + 좋은 실패 메시지까지 제공하는 게 핵심 장점!