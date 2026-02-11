---
type: 생각조각
status: inbox
source: 
creation_date: 2025-11-07
---


## 📜 원본 맥락
![[(체화 ㄱ)제네릭의 역할 (JAVA)#^8ht5el]]

---
## 정리
## 자바: NULL은 참조타입의 값이다. 원시 타입은 NULL을 사용 불가.
자바 원시타입(기본형)은 **`null`이 불가능한 이유:**
- 스택 메모리 공간은 **오직 해당 타입의 값(숫자, 문자, 불리언)만**을 담도록 설계되었습니다.
- `null`은 '값이 없음'이 아니라 '참조(주소)가 없음'을 뜻하는 **참조 타입 전용** 값이라, 값 자체를 저장하는 원시 타입의 공간에는 들어갈 수 없습니다.
- 값이 없는" 원시 타입은 어떻게 되나요?
	원시 타입은 null을 가질 수 없는 대신, **기본값(default value)** 이라는 개념을 가집니다.
	int는 null이 될 수 없는 대신, 값이 없다는 상태를 0으로 표현하는 것입니다


## 다른언어는 NULL이 가능하다

### 1. `null` 자체가 원시 타입인 '자바스크립트'

자바스크립트는 타입 구분이 유연한 동적 타입 언어이며,
`null`은 '원시 값(Primitive Value)' 중 하나로 의도적인 빈 값을 표현합니다.[[자바스크립트의 NULL NAN undefined|자바스크립트의 NULL NAN undefined]] ^lrh7bc

- **JavaScript의 7가지 원시 값:**
    - `String`
    - `Number` (NUMBER의 값인 NAN이 여기에 속함)
    - `Boolean`
    - `BigInt`
    - `Symbol`
    - `undefined`
    - **`null`** (존재)
        

따라서 자바스크립트에서는 변수에 `null`을 할당하는 것이 매우 자연스럽습니다.

```JavaScript
let a = 10;    // a는 Number 타입
let b = "hi";  // b는 String 타입
let c = null;  // c는 Null 타입 (원시 값)

a = null;      // ✅ 가능! (a의 타입이 Null로 변경됨)
```

---
### 1. '널 가능 타입(Nullable Type)'을 문법적으로 지원

**C#**이나 **Kotlin**, **Swift** 같은 최신 정적 타입 언어들이 이 방식을 사용합니다.

이 언어들은 자바의 `NullPointerException` 문제를 해결하기 위해 '안전성'을 높이는 방향으로 설계되었습니다.

- **기본 원칙:** "모든 타입은 기본적으로 `null`을 가질 수 없다." (자바와 반대)
- **예외 허용:** 프로그래머가 **`?`** 기호를 붙여 "이 변수는 `null`이 될 수도 있다"고 명시적으로 선언합니다.
#### 💬 C# 예시

```c
int a = 10;   // 'int'는 원시 타입. null 불가능 (Java의 int와 동일)
a = null;     // 💥 컴파일 오류!

int? b = 10;  // 'int?'는 '널 가능한(Nullable) int'라는 특별한 타입
b = null;     // ✅ 가능!
```

#### 💬 Kotlin 예시

```Kotlin
var a: Int = 10   // 'Int'는 null 불가능
a = null          // 💥 컴파일 오류!

var b: Int? = 10  // 'Int?'는 '널 가능한 Int' 타입
b = null          // ✅ 가능!
```

자바와 달리, 코틀린은 `int`와 `Integer`를 구분하지 않고 `Int`로 통일하며, 컴파일러가 상황에 맞게 원시 타입과 래퍼 타입을 오가며 최적화합니다.

---
## 💭 나의 추가적 생각/질문
