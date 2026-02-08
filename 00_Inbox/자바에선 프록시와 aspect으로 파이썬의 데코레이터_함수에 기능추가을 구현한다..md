---
type: 생각조각
status: inbox
source:
creation_date: 2026-02-08
---
자바(특히 Spring 프레임워크)에서 파이썬의 데코레이터처럼 동작하게 만드는 핵심 기술이 바로 **AOP(Aspect-Oriented Programming, 관점 지향 프로그래밍)**입니다.

사용자가 직접 만든 `@Annotation`을 감지해서 특정 로직을 끼워 넣는 과정을 상세히 설명해 드릴게요.

---
데코레이터: 들어오는 데이터 종류에 맞추어 데코레이터로 데이터에 맞게 작업을 추가
## 1. AOP의 핵심 동작 원리

AOP는 "핵심 비즈니스 로직"과 "공통 부가 기능(로깅, 보안, 트랜잭션)"을 분리하는 것이 목적입니다.

- **Proxy(대리자):** 사용자가 메서드를 호출하면, 실제 객체가 아닌 **프록시 객체**가 호출을 가로챕니다.
- **Aspect:** 가로챈 시점에 "어떤 부가 기능(Advice)"을 "어디에(Pointcut)" 적용할지 결정하고 실행합니다.
    

---

## 2. AOP 구현 3단계 (상세 예시)

"메서드 실행 시간을 측정하는 `@ExeTimer` 어노테이션"을 만든다고 가정해 보겠습니다.

### ① 단계: 어노테이션 정의

먼저, 타겟 메서드에 붙일 이름표를 만듭니다.

```Java
import java.lang.annotation.*;

@Target(ElementType.METHOD)    // 메서드에 붙이겠다고 선언
@Retention(RetentionPolicy.RUNTIME) // 실행 중(Runtime)에 이 어노테이션을 참조함
public @interface ExeTimer {
}
```

### ② 단계: Aspect 클래스 작성 (실제 로직)

여기서 "언제, 무엇을 할지" 정의합니다.

```Java
@Aspect
@Component // Spring 빈으로 등록
public class TimerAspect {

    // @ExeTimer 어노테이션이 붙은 메서드를 타겟(Pointcut)으로 설정
    @Around("@annotation(ExeTimer)") 
    public Object measureTime(ProceedingJoinPoint joinPoint) throws Throwable {
        long start = System.currentTimeMillis(); // [전처리] 실행 전 시간 측정

        try {
            // 실제 대상 메서드 실행 (파이썬의 original_function() 호출과 같음)
            return joinPoint.proceed(); 
        } finally {
            long finish = System.currentTimeMillis(); // [후처리] 실행 후 시간 측정
            System.out.println(joinPoint.getSignature().getName() + " 실행 시간: " + (finish - start) + "ms");
        }
    }
}
```

### ③ 단계: 어노테이션 사용

이제 원하는 메서드 위에 한 줄만 적으면 끝납니다.

```Java
@Service
public class MyService {
    @ExeTimer // 이 한 줄로 실행 시간 측정 기능이 주입됨!
    public void runBusinessLogic() {
        // 복잡한 비즈니스 로직…
        System.out.println("본체 실행");
    }
}
```

---

## 3. 주요 용어 정리 (AOP 핵심 개념)

|**용어**|**설명**|**파이썬 데코레이터와 비교**|
|---|---|---|
|**Target**|부가 기능을 부여할 대상|`original_function`|
|**Advice**|실질적으로 수행할 '기능' 그 자체 (로깅, 시간측정 등)|`wrapper` 함수 내부 로직|
|**Pointcut**|Advice를 어디에 적용할지 결정하는 '규칙'|어떤 함수에 `@`를 붙일지 결정하는 것|
|**JoinPoint**|Advice가 적용될 수 있는 지점 (자바는 주로 메서드 호출 시점)|함수 호출 시점|
|**Aspect**|Advice + Pointcut을 합친 모듈|데코레이터 함수 전체|

---

## 4. 파이썬 데코레이터 vs 자바 AOP

- **파이썬**은 언어 자체가 함수를 1급 객체로 취급하기 때문에 **구조가 매우 단순**합니다. 그냥 함수를 넣으면 함수가 나옵니다.
- **자바**는 객체지향의 원칙을 지키기 위해 **프록시(Proxy) 패턴**을 사용합니다. 컴파일 시점 혹은 런타임 시점에 가짜 객체를 만들어 중간에 끼어드는 방식이라 설정(Aspect 클래스)이 별도로 필요합니다.
