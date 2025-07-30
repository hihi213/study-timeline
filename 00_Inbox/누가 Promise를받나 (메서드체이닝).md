---
type: 생각조각
status: inbox
source: 
creation_date: 2025-07-30
---


## 📜 원본 맥락
![[01_Sources/{S} 인프런 그린코딩 52시간 풀스택+ Gemini.md#^minmtx]]

---
## 정리
- 
### 프로미스 체이닝(Promise Chaining)의 원리

`Promise`는 비동기 코드를 깔끔하게 작성할 수 있도록 **메서드 체이닝(Method Chaining)**을 지원합니다.

#### 1. 첫 번째 연결: `Promise`와 `.then()`

`orderPizza()` 함수는 호출되는 즉시 **`Promise` 객체를 반환**합니다. 코드를 한 줄로 합쳐 쓴 `orderPizza().then(...)`은 이 반환된 `Promise` 객체에 `.then()` 메서드를 바로 연결하여 실행하는 것을 의미합니다.

아래와 같이 코드를 나누어 보면 더 명확합니다.



```JavaScript
// 1. orderPizza()가 '대기' 상태의 Promise 객체를 반환하고,
//    이 객체를 aPromise 변수에 저장합니다.
const aPromise = orderPizza();

// 2. aPromise 변수에 저장된 Promise 객체에 .then() 메서드를 연결합니다.
aPromise.then(result => console.log(result));
```

#### 2. 체인의 비밀: `.then()`도 `Promise`를 반환한다

`.then()`과 `.catch()` 메서드는 단순히 콜백 함수를 실행하는 것에서 그치지 않고, 호출되면 **항상 새로운 `Promise` 객체를 반환**합니다.

이것이 바로 체인이 계속 이어질 수 있는 핵심 원리입니다. `orderPizza()`가 반환한 `Promise`에 `.then()`을 연결하고, 그 `.then()`이 반환한 또 다른 `Promise`에 `.catch()`를 연결하는 방식입니다.

#### 3. 체이닝의 목적: 비동기 작업의 순차적 처리

프로미스 체이닝이 필요한 가장 큰 이유는 **여러 개의 비동기 작업을 순서대로 처리**하기 위해서입니다. `.then()`의 콜백 함수 안에서 또 다른 `Promise`를 반환하면, 뒤에 연결된 `.then()`은 앞의 `Promise`가 완료될 때까지 자동으로 기다려줍니다.

JavaScript

```
// 예시: 피자를 받고 나서 콜라를 주문하는 순차적 비동기 처리
orderPizza()
  .then(pizza => {
    console.log(pizza); // "피자 제작 성공!"
    return orderCoke(); // 새로운 Promise를 반환
  })
  .then(coke => {
    console.log(coke); // orderCoke()가 완료된 후 "콜라 주문 성공!"
  })
  .catch(error => {
    console.log(error);
  });
```
---
## 💭 나의 추가적 생각/질문
-