## 💾 자료형 및 연산

### 1. 수 자료형

- **정수형 (Integer Type):** 정수를 표현합니다.
- **실수형 (Floating-Point Type):** 실수를 표현합니다.
    - 소수부가 $0$일 경우 `a = 5.`와 같이 $0$을 생략할 수 있습니다. (결과: `5.0`)
    - 지수 표현 방식(`1e9`)을 사용하여 큰 수를 간결하게 표현할 수 있습니다.
    - 컴퓨터는 이진수 체계를 사용하므로 **실수 덧셈에서 정확한 결과**를 산출하지 못할 수 있습니다.
        - 일반적으로 `round(a, 4)`와 같이 5째 자리에서 반올림하여 처리합니다.
- **수 자료형 연산:**
    - 나누기: `/` (실수 나눗셈)
    - 나머지: `%`
    - 몫: `//` (정수 나눗셈 몫)
    - 거듭제곱: `**` (예: `a ** b`는 $a^b$)
        

```Python
# 실수형 예제
#소수부가 0일 때 0을 생략
a = 5. # 5.0

# 10억의 지수 표현 방식
a = 1e9 # 1000000000.0

# 실수 덧셈 오차 처리
a = 0.3 + 0.6
print(round(a))
```

```Python
# 수 자료형의 연산 예제
a = 7
b = 3

print(a / b)  # 나누기
print(a % b)  # 나머지
print(a // b) # 몫
print(a ** b) # 거듭 연산자
```

### 2. 리스트 자료형

- **리스트 초기화:**
    - `a = [1, 2, 3, 4, 5, 6, 7, 8, 9]`와 같이 대괄호(`[]`)를 사용합니다.
    - 빈 리스트는 a <code>=</code> list() 또는 a <code>=</code> \[]로 선언합니다.
    - 크기가 $N$이고 모든 값이 $0$인 리스트는 a = \[0] * n으로 초기화합니다.
- **인덱싱 (Indexing):** 인덱스 값을 입력하여 특정 원소에 접근
    - 파이썬은 양의 정수 인덱스(`a[0]`)와 음의 정수 인덱스(`a[-1]` : 마지막 원소)를 모두 사용합니다.
- **슬라이싱 (Slicing):**
    - `a[시작_인덱스:끝_인덱스]` 형태로 연속적인 위치의 원소들을 가져옵니다. **끝 인덱스의 원소는 포함하지 않습니다.**
        
```Python
# 리스트 인덱싱과 슬라이싱 예제
a = [1,2,3,4,5,6,7,8,9]

print(a[-1])  # 9 (가장 마지막 원소)
print(a[-3])  # 7 (뒤에서 세 번째 원소)
print(a[1:4]) # [2, 3, 4] (인덱스 1부터 3까지)
```

#### 리스트 컴프리헨션: 반복문 `for`를 대체하는 구문
**`[표현식 for 변수 in iterable if 조건]`**
	1. **`iterable`에서** 순차적으로 **`변수`를** 할당받습니다.
	2. **`조건`을** 만족하는 경우에만 다음 단계로 진행합니다.
	3. **`표현식`을** 적용한 결과를 수집하여 새로운 리스트를 생성합니다.
```Python
#리스트 컴프리헨션 이용x : 0부터 19까지의 수의 홀수만 포함한 리스트생성
array = []
for i in range(20)
        if i % 2 == 1:
                array.append(i)
# 리스트 컴프리헨션 이용했을때: 0부터 19까지의 수의 홀수만 포함한 리스트생성
array = [i for i in range(20) if i % 2 == 1]

# 리스트 컴프리헨션 이용했을때: 1부터 9까지의 수의 제곱 값을 포함한 리스트생성
array = [i*i for i in range(1,10)]
```
#### 잘못된 2차원 리스트 초기화: 객체 참조 공유

- 잘못된 **구문:** `array = [[0] * m] * n `
- **문제 발생 원인:** `[0] * m` **표현식**은 **단 하나의 하위 리스트 객체**를 **생성**합니다. 이후 `* n` **연산자**는 이 **하나의 객체**에 대한 **참조**를 **$n$번 복사**하여 **상위 리스트**에 **저장**합니다.
- **결과:** **모든 행**이 메모리 상의 **동일한 리스트 객체**를 가리키게됩니다
    - 특정 행의 원소 하나(`array[1][1] = 5`)를 변경하면, 이 참조를 공유하는 **모든 행**의 해당 열 값이 동시에 변경됩니다.
```Python
n = 3
m = 4
# 2차원 리스트 초기화(잘못된 방법)
array = [[0] * m] * n
array[1][1] = 5 
# 결과: [[0, 5, 0, 0], [0, 5, 0, 0], [0, 5, 0, 0]]
```

---
#### 올바른 2차원 리스트 초기화 :리스트 컴프리헨션을 사용
**구문:** `array = [[0] * m for _ in range(n)]`
- 리스트 컴프리헨션이 range(n)만큼 반복될 때마다 내부의 `[0] * m` **표현식**이 **새로운 하위 리스트 객체**를 **생성**합니다.
- **`_` (언더바):** 반복 변수 자체의 **값**을 **내부 로직**에서 **사용하지 않을 때** (단순히 **반복 횟수**만 필요할 때) **사용**하는 **관용적 변수**
```Python
n = 3
m = 4
# N * M 크기의 2차원 리스트 초기화 (올바른 방법)
array = [[0] * m for _ in range(n)]
# 결과: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]
array[1][1] = 5
# 결과: [[0, 0, 0, 0], [0, 5, 0, 0], [0, 0, 0, 0]]
```
#### **리스트 메서드:**

| **메서드**                | **설명**                                      | **시간 복잡도**    |
| ---------------------- | ------------------------------------------- | ------------- |
| `append(x)`            | 리스트 맨 뒤에 원소 $x$ 삽입                          | $O(1)$        |
| `sort()`               | 오르차순 원소 정렬                                  | $O(N \log N)$ |
| `sort(reverse = True)` | 내리차순 원소 정렬                                  | $O(N \log N)$ |
| `reverse()`            | 원소 순서 뒤집기                                   | $O(N)$        |
| `insert(i, x)`         | $i$ 인덱스에 값 $x$ 삽입                           | $O(N)$        |
| `count(x)`             | 값이 $x$인 데이터 개수 세기                           | $O(N)$        |
| `remove(x)`            | **첫 번째** 나타나는 $x$값 데이터 삭제 만약 존재하지 않으면 예외 발생 | $O(N)$        |

- **특정 값 여러개**을 **삭제**: 힌번만 순회하여 삭제집합에 포함되지 않은 값만 선택한 새 List 생성. 즉 한번만 순회해 $O(N)$
	- `remove()`는 여러번 호출해야해 K x $O(N)$ 비효율
	- 이때 **리스트 컴프리헨션**으로 코드 줄이기
```Python
# 특정 값을 갖는 원소 삭제해야할때
remove_set = {3,5} #삭제해야하는 값을 정의
a = [1,2,3,4,5,5,5]

# 포함되지 않은 값만을 저장한 새 리스트 생성
result = [i for i in a if i not in remove_set] # [1, 2, 4]
```

### 3. 문자열 자료형 (String Type)

- **문자열 초기화:**
    - 작은따옴표(`'`) 또는 큰따옴표(`"`)를 사용하여 데이터를 초기화합니다.
    - 문자열 내부에 따옴표를 포함할 경우, 역슬래시(`\`)를 사용하여 이스케이프(Escape) 처리를 수행합니다.
    - **백슬래시 사용 예:** `\"` 또는 `\'`
```Python
data = 'Hellow World'

data =  "Don't you know \"Python\"?"
print(data) # Don't you know "Python"?
```
- **문자열 연산:**
	- **연결(Concatenation):** `+` 연산자를 사용하여 문자열을 결합합니다.
    - **반복:** `*` 연산자를 사용하여 문자열을 지정된 횟수만큼 반복합니다.
    - **인덱싱 및 슬라이싱:** 파이썬의 문자열은 내부적으로 리스트와 유사하게 처리되어 인덱싱과 슬라이싱을 지원합니다.
        - 단, 문자열은 **불변(Immutable) 객체**이므로 특정 인덱스의 값을 직접 변경할 수 없습니다.
```Python
a = "Hello"
b = "World"

print(a + " " + b) # Hello World
print(a * 3)       # HelloHelloHello

# 문자열 인덱싱 및 슬라이싱
a = "ABCDEF"
print(a[2:4])      # CD
```

### 4. 튜플 자료형 (Tuple Type)

- **특징:**
    - 한 번 선언된 값을 **변경할 수 없습니다 (Immutable)**.
    - 소괄호 `()`를 이용하여 초기화합니다. (리스트는 대괄호 `[]`)
- **활용:**
	- **데이터 무결성 유지:** 프로그램 실행 도중 변경되지 않아야 하는 데이터를 보호할 때 사용합니다.
    - **알고리즘:** 최단 경로 알고리즘(예: 다익스트라) 등에서 `(비용, 노드 번호)`의 형태로 데이터를 묶어 관리할 때 사용합니다. 해싱(Hashing)의 키(Key) 값으로 사용 가능합니다.

```Python
# 튜플은 값 변경 불가능
a = (1, 2, 3, 4)
# a[2] = 7 # TypeError 발생
```

### 5. 사전 자료형 (Dictionary Type)

- **특징:**
    - **키(Key)와** **값(Value)의** 쌍을 데이터로 가집니다.
    - **해시 테이블(Hash Table)** 구조를 이용하여 데이터를 저장하므로, 데이터 조회 및 수정에 있어서 $O(1)$의 시간 복잡도를 가집니다.
    - 키(Key)로는 변경 불가능한 자료형(튜플 등)만 사용할 수 있습니다.
- **관련 함수:**
    - `keys()`: 키 데이터만 추출하여 리스트와 유사한 객체로 반환합니다.
    - `values()`: 값 데이터만 추출하여 반환합니다.
```Python
data = dict()
data['사과'] = 'Apple'
data['바나나'] = 'Banana'

# 키 확인
if '사과' in data:
    print("'사과'를 키로 가지는 데이터가 존재합니다.")

# 키 데이터만 담은 리스트
key_list = list(data.keys()) 
# 값 데이터만 담은 리스트
value_list = list(data.values())

for key in key_list:
    print(data[key])
```

### 6. 집합 자료형 (Set Type)

- **특징:**
    - **중복을 허용하지 않습니다.**
    - **순서가 없습니다.** (인덱싱을 사용할 수 없습니다.)
    - 특정 데이터가 이미 등장한 적이 있는지 여부를 체크할 때 효율적입니다.
- **초기화:**
    - 방법1: `data = set([1, 1, 2, 3, 4, 4, 5])`
	- 방법2: `data = {1, 2, 3, 4, 5}`
- **연산:** SET이라 당연히 중복, 순서가 없다.
    - 합집합: `|` (예: `a | b`, a와 b 모든요소)
    - 교집합: `&` (예: `a & b`, a와 b의 공통만)
    - 차집합: `-` (예: `a - b`, a에서 b의 요소를 뺀)
- **관련 함수:**
    - `data.add(x)`: 새로운 원소 추가
    - `data.update([x, y])`: 새로운 원소 여러 개 추가
    - `data.remove(x)`: 특정 값 원소 삭제 (존재하지 않을 경우 에러 발생)
        
```Python
# 집합 자료형 초기화
data = set([1, 1, 2, 3, 4, 4, 5]) # {1, 2, 3, 4, 5}
data = {1, 2, 3, 4, 5}

a = {1, 2, 3, 4, 5}
b = {3, 4, 5, 6, 7}

print(a | b) # 합집합: {1, 2, 3, 4, 5, 6, 7}
print(a & b) # 교집합: {3, 4, 5}
print(a - b) # 차집합: {1, 2}

# 데이터 조작
data = {1, 2, 3}
data.add(4)        # {1, 2, 3, 4}
data.update([5, 6])# {1, 2, 3, 4, 5, 6}
data.remove(3)     # {1, 2, 4, 5, 6}
```
---

## 💻 제어문

### 조건문 (Conditional Statements)

- **구조:** `if ~ elif ~ else`문을 이용합니다. 파이썬은 들여쓰기로 블록을 구분합니다.
- **비교 연산자:** <code>==</code>, `!=`, `>`, `<`, `>=`, `<=`
- **논리 연산자:** `and`, `or`, `not`
- **원소 존재여부 연산자:** `in`, `not in` (리스트, 튜플, 문자열, 사전 등)
- **`pass` 문:** 조건문의 값이 참이더라도 아무것도 처리하고 싶지 않을 때 사용합니다.
- **조건부 표현식 (Conditional Expression):** `변수 = 참_값 if 조건 else 거짓_값` 형태를 사용하여 한 줄로 표현합니다.

```Python

score = 85

if score >= 90:
    print("A")
elif score >= 80:
    print("B")
else:
    print("C")
# 긴 문법
if score >= 80: result = "Success"
else: result = "Fail"

# 긴 문법 줄이기 1. 조건부 표현식
result = "Success" if score >= 80 else "Fail"

# 긴 문법 줄이기 2. 3항 연산자
result = score >= 80 and "Success" or "Fail"

X in 리스트     # 리스트 안에 X가 들어가 있을 때 참(True)이다.
X not in 문자열 # 문자열 안에 X가 들어가 있지 않을 때 참(True)이다.
```

### 반복문 (Loops)

- **`while` 문:** 조건이 참인 동안 반복을 수행합니다.
- **`for` 문:** 리스트, 튜플 등 순회 가능한(Iterable) 객체의 원소를 하나씩 방문할 때 사용합니다
    - `range(시작값, 끝값, 증감)` 형태를 사용하여 반복합니다. (끝 값은 포함하지 않습니다.)
    - `continue`: 현재 반복을 중단하고 다음 반복을 진행합니다.
    - `break`: 반복문 전체를 즉시 탈출합니다.
    - **이중 `for` 문:** 플로이드 워셜 알고리즘, 다이나믹 프로그래밍 등 복잡한 문제에서 자주 사용됩니다.
        
```Python
# while문 예제
i = 1
result = 0
while i <= 9:
    result += i
    i += 1
print(result) # 45

# for문 range 예제
result = 0
for i in range(1, 10): # 1부터 9까지
    result += i
print(result) # 45

# continue 활용 예제
scores = [90, 85, 77, 65, 97]
cheating_list = {2, 4} # 부정행위 번호 집합

for i in range(5):
    if i + 1 in cheating_list:
        continue
    if scores[i] >= 80:
        print(f"{i + 1}번 학생은 합격입니다.")
```
---

## 📝 함수 (Functions)

- **정의:** `def 함수명(매개변수):` 형태로 정의합니다.
- **`global` 키워드:** 함수 안에서 **함수 밖의 전역 변수** 데이터를 변경해야 하는 경우 `global 변수명`을 사용합니다. (리스트와 같은 가변 객체는 `global` 없이도 내부 메서드로 수정 가능하지만, 변수 자체 재할당 시에는 필수입니다.)
- **람다 표현식 (Lambda Expression):** 함수를 한 줄로 간결하게 작성할 때 사용합니다. 주로 `sort()` 함수의 `key` 매개변수나 `map()` 함수 등에서 1회성으로 사용됩니다.
```Python
def add(a,b):
        return a + b
print(add(3,7)) # 매개변수에다가 직접 지정해 호출할수도있다 (add(b = 3, a = 7))


def add(a, b):
        print('함수의 결과:', a+b)

```

```Python
# global 키워드 예제
a = 0
def func():
    global a
    a += 1

for i in range(10):
    func()
print(a) # 10

# 람다 표현식 예제
print( (lambda a, b: a + b)(3,7) ) # 10
```

---

## 📥 입출력 (Input/Output)

### 입력

- **기본 입력:** `input()` 함수는 한 줄의 문자열을 입력받습니다.
- **공백 구분 입력:** `list(map(int, input().split()))` 패턴을 사용하여 공백으로 구분된 여러 정수 데이터를 입력받습니다.
- **대량의 데이터 입력:** 입력 데이터가 많을 경우(예: 백준 온라인 저지), `sys.stdin.readline().rstrip()`을 사용하여 입력 속도를 높입니다.
    - `import sys`가 필요합니다.
    - `rstrip()`: 입력 후 줄 바꿈 문자(`\n`)를 제거하기 위해 사용합니다.`readline()`은 줄 바꿈 기호를 포함함)
        
```Python
# 데이터의 개수 입력
n = int(input())

# 각 데이터를 공백으로 구분하여 입력
data = list(map(int, input().split()))
data.sort(reverse = True)

# 변수 3개 공백 구분 입력
n, m, k = map(int, input().split())
```

```Python
import sys
# 대량의 데이터 입력
input_data = sys.stdin.readline().rstrip()
```

### 출력

- **`print()`:** 데이터를 출력하고 자동으로 줄 바꿈을 수행합니다. `end` 속성을 변경하여 줄 바꿈을 방지할 수 있습니다.
- **f-string (Python 3.6+):** `f"문자열 {변수}"` 형식을 사용하여 변수 값을 문자열 내에 직관적으로 삽입합니다. 정수와 문자열을 `+` 연산자로 결합할 때 발생하는 `TypeError`를 방지할 수 있습니다.
- 출력 시 오류가 발생하는 소스코드 예시 (자바와 다름 주의)

```Python
answer = 7
#' ' (공백)을 사용하여 연결
print("Hello", end=' ') print("World") # 출력: Hello World
# 오류 예시: print("정답은 " + answer + "입니다.") # TypeError 발생
# 올바른 예
print("정답은 " + str(answer) + "입니다")
print("정답은" , str(answer), "입니다")

# Python 3.6 이상 f-string 사용 (권장)
print(f"정답은 {answer}입니다."
```
## 🛠️ 코딩테스트를 준비하며 반드시 알아야 하는 라이브러리 6가지

### 1. 내장 함수 (Built-in Functions): 별도의 `import` 없이 사용가능

- `sum(iterable)`: 객체의 모든 원소의 합을 반환합니다.
- `min(args)`, `max(args)`: 최솟값과 최댓값을 반환합니다.
- `eval(expression)`: 문자열로 된 수식을 계산하여 결과를 반환합니다.
- `sorted(iterable)`: 오름차순으로 정렬된 **새로운 리스트**를 반환합니다. (`key` 속성 사용 가능)

| **함수**             | **기능**                       | **예시**                                          |
| ------------------ | ---------------------------- | ----------------------------------------------- |
| `sum(iterable)`    | iterable 객체의 합               | `sum([1, 2, 3])` <code>=</code> 6               |
| `min(*args)`       | 최솟값 반환                       | `min(7, 3, 5)` <code>=</code> 3                 |
| `max(*args)`       | 최댓값 반환                       | `max(7, 3, 5)` <code>=</code> 7                 |
| `eval(expression)` | 문자열로 표현된 파이썬 수식 실행           | `eval("(3+5) * 7")` <code>=</code> 56           |
| `sorted(iterable)` | 새 리스트로 오름차순 정렬하여 반환          | `sorted([9, 1, 8])` <code>=</code> `[1, 8, 9]`  |
| `list.sort()`      | 원본 리스트를 정렬 (반환 값 없음, `void`) | `result.sort(reverse = True)`                   |
| `:`.join(list)     | 리스트의 원소들을 특정 구분자(`:`)로 연결    | `":".join(["23", "59"])` <code>=</code> "23:59" |
```python
result = [1,2,3,4,5]

sum(result) #iterable 객체가 들어왔을 때 (반복 가능한 객체) 리스트, 사전자료형, 튜플자료형 등

min(7,3,5,2)

max(7,3,5,2)

result = eval( "(3+5) * 7" )

result = sorted([9,1,8,5,4]) # 오름차순 정렬
result = sorted([9,1,5,1,4], reverse=True) # 기존 객체는 변경되지 않으며 return 값이 존재한다.

result.sort() # void 문이다 result가 변경된다.

data = [('홍길동', 35), ('이순신', 17), ('아무개', 88)]
result = sorted(data, key = lambda x : x[1], reverse = True)
print(result)

# 위와 같은 값을 가진다.
data.sort(key = lambda x: x[1], reverse = True)
print(data)

data = ["23", "59", "59"]
print(":".join(data))
# 23:59:59
```
### 2. `itertools` (반복 가능한 데이터 처리)

- **`permutations(iterable, r)` (순열):** $r$개를 뽑아 나열하는 모든 경우의 수.
- **`combinations(iterable, r)` (조합):** $r$개를 뽑는 모든 조합.
- **`product(iterable, repeat=r)` (중복 순열):** $r$개를 뽑는 모든 순열 (중복 허용).
- **`combinations_with_replacement(iterable, r)` (중복 조합):** $r$개를 뽑는 모든 조합 (중복 허용).
- **유의점:** 모두 **클래스**이므로 사용 시 `list()`로 변환해야 합니다.
    
```python
from itertools import permutations, combinations, product,
                                            combinations_with_replacement

data = ['a', 'b', 'c'] # 데이터 준비

# 리스트에서 3개를 뽑아 나열하는 모든 경우를 출력
result = list(permutations(data)) # 모든 순열 구하기

print(result)

result = list(combinations(data)) # 2개를 뽑는 모든 조합 구하기

print(result)

result = list(product(data,repeat = 2)) # 2개를 뽑는 모든 순열 구하기 (중복 허용)

print (result)

result = list(combinations_with_replacement(data)) # 2개를 뽑는 모든 조합 구하기 (중복 허용)

print (result)

[('a', 'b', 'c'), ('a', 'c', 'b'), ('b', 'a', 'c'), ('b', 'c', 'a'), ('c', 'a', 'b'), ('c', 'b', 'a')]
[('a', 'b'), ('a', 'c'), ('b', 'c')]
[('a', 'a'), ('a', 'b'), ('a', 'c'), ('b', 'a'), ('b', 'b'), ('b', 'c'), ('c', 'a'), ('c', 'b'), ('c', 'c')]
[('a', 'a'), ('a', 'b'), ('a', 'c'), ('b', 'b'), ('b', 'c'), ('c', 'c')]
```
### 3. `heapq` (힙 기능)

- **기능:** 최소 힙 (Min Heap) 기능을 제공하여 우선순위 큐를 구현할 때 사용됩니다. 코딩 테스트에서 `PriorityQueue`보다 빠르게 동작합니다.
- **작동 원리:** 최소 힙의 최상단 원소는 항상 **가장 작은** 원소입니다.
	- 최소 힙(min heap)으로 구성되어 있으므로 넣었다 빼는 것만으로 O(NlogN)에 오름차순 정렬이 완료된다.
- **메서드:**
    - `heapq.heappush(h, value)`: 원소 삽입
    - `heapq.heappop(h)`: 가장 작은 원소 (최상단) 꺼내기
- **최대 힙 (Max Heap) 구현:** 원소에 **음수 부호**를 붙여서 삽입/제거합니다. (예: `heapq.heappush(h, -value)`)
    

```python
# 힙정렬(heap sort)을 heapq로 구현하는 예제

import heapq

def heapsort(iterable):
      h = []
      result = []
      # 모든 원소를 차례대로 힙에 삽입
      for value in iterable:
              heapq.heappush(h, value)
      # 힙에 삽입된 모든 원소를 차례대로 꺼내어 담기
      for i in range(len(h)):
              result.append(heapq.heappop(h))
      return result

result = heapsort([1,3,5,7,9,2,4,6,8,0])
print(result)
# [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

# 부호를 사용하여 최대 힙(max heap) 구현
import heapq

def heapsort(iterable):
      h = []
      result = []
      # 모든 원소를 차례대로 힙에 삽입
      for value in iterable:
              heapq.heappush(h, -value)
      # 힙에 삽입된 모든 원소를 차례대로 꺼내어 담기
      for i in range(len(h)):
              result.append(-heapq.heappop(h))
      return result

result = heapsort([1,3,5,7,9,2,4,6,8,0])
print(result)
#[9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
```

### 4. `bisect` 이진탐색을 쉽게 구현할 수 있도록 하는 라이브러리

- **기능:** **정렬된 배열**에서 특정 원소를 찾아야 할 때 사용됩니다.
- **메서드:**
    - `bisect_left(a, x)`: 정렬된 리스트 $a$에 $x$를 삽입할 **가장 왼쪽** 인덱스 반환.
    - `bisect_right(a, x)`: 정렬된 리스트 $a$에 $x$를 삽입할 **가장 오른쪽** 인덱스 반환.
- **활용:** 정렬된 리스트에서 값이 특정 범위에 속하는 원소의 개수를 구할 때 `bisect_right(a, right_value) - bisect_left(a, left_value)` 계산에 사용됩니다.
    
```python
from bisect import bisect_left, bisect_right

a = [1, 2, 4, 4, 8]
x = 4

print(bisect_left(a, x))  # 2
print(bisect_right(a, x)) # 4

#'정렬된 리스트'에서 '값이 특정 범위에 속하는 원소의 개수'를 구하고자 할 때 사용

def count_by_range(a, left_value, right_value):
        right_index = bisect_right(a, right_value)
        left_index = bisect_left(a, left_value)
        return right_index - left_index

# 리스트 선언
a = [1, 2, 3, 3, 3, 3, 4, 4, 8, 9]

# 값이 4인 데이터 개수 출력
print(count_by_range(a, 4, 4))       # 2

# 값이 [-1, 3] 범위에 있는 데이터 개수 출력
print(count_by_range(a, -1, 3))      # 6
```
### 5. `collections` (유용한 자료구조)

- **`deque` (덱):**
    - 양쪽 끝에서 삽입/제거하는 스택, 큐 구현에 사용됩니다.
    - **가장 앞 원소 추가/제거**에서 $O(1)$의 시간 복잡도를 가집니다.
    - 메서드: `data.appendleft(x)`, `data.popleft()`, `data.append(x)`, `data.pop()`
    - 인덱싱, 슬라이싱 등은 사용할 수 없다.
- **`Counter` (카운터):**
    - 리스트와같은 Iterable 객체 내부의 원소가 몇 번씩 등장했는지 등장 횟수를 세는 기능을 제공합니다.
        
```python
        from collections import deque
        
        data = deque([2,3,4])
        data.appendleft(1)
        data.append(5)
        
        data.pop()
        data.popleft()
        
        print(data)  # deque([2, 3, 4])
        print(list(data)) # [2, 3, 4]
        ```
```Python
from collections import deque, Counter

# deque 예제
data = deque([2,3,4])
data.appendleft(1)
print(list(data)) # [1, 2, 3, 4]

# Counter 예제
counter = Counter(['red', 'blue', 'blue'])
print(counter['blue'])  # 2
print(dict(counter))    # {'red': 1, 'blue': 2}
```

### 6. `math` (수학적 기능)

|**함수**|**기능**|**예시**|
|---|---|---|
|`math.factorial(x)`|$x$의 팩토리얼|`math.factorial(5)` <code>=</code> 120|
|`math.sqrt(x)`|$x$의 제곱근|`math.sqrt(7)` $\approx$ 2.645|
|`math.gcd(a, b)`|$a$와 $b$의 최대공약수|`math.gcd(21, 14)` <code>=</code> 7|
|`math.pi`|원주율 $\pi$ 값||
|`math.e`|자연 상수 $e$ 값||

```Python
import math

print(math.gcd(21, 14)) # 7
print(math.pi)
```


## 🧩 컴프리헨션 (Comprehension) 설명

**컴프리헨션**은 Python에서 **컬렉션**(`List`, `Set`, `Dictionary` 등)을 **생성**하는 **문법적 구조**를 **통칭**하는 **용어**입니다. 이 **구조**는 **반복 가능한 객체**(`iterable`)를 **순회**하며 **필터링** 및 **변형**을 **동시에 수행**하여 **새로운 컬렉션**을 **내포적**으로 **정의**합니다.

- **컴프리헨션의 의미:**
    - 수학에서 **집합**을 **내포적 정의**하는 **방식**과 **유사**합니다. 이는 **원소**의 **포괄적인 규칙**을 **제시**하여 **집합**을 **정의**하는 **행위**를 **의미**합니다.
    - 프로그래밍에서는 **반복문**을 **사용**하여 **데이터 구조**를 **채우는** **전통적인 방식**을 **단순화**하고 **명시적인 문법**으로 **대체**합니다.
        

---

## 1. 리스트 컴프리헨션 (List Comprehension)

가장 **일반적인 형태**이며, **새로운 리스트**를 **생성**하는 데 **사용**됩니다.

- **구문:** `[표현식 for 변수 in iterable if 조건]`
- **작동:** `iterable`의 **각 원소**를 **순회**하며, **`조건`**을 **만족**할 경우 **`표현식`**을 **적용**한 **결과**를 **새 리스트**의 **원소**로 **포함**시킵니다.
    

### 📝 예시

```Python
# 0부터 9까지의 수 중 홀수의 제곱 리스트 생성
list_comp = [i * i for i in range(10) if i % 2 == 1]
# 결과: [1, 9, 25, 49, 81]
```

---

## 2. 딕셔너리 컴프리헨션 (Dictionary Comprehension)

**새로운 딕셔너리**를 **생성**하며, **키**와 **값**을 **쌍**으로 **정의**하는 **구조**를 **가집니다.**

- **구문:** `{키_표현식: 값_표현식 for 변수 in iterable if 조건}`
- **작동:** `iterable`의 **각 원소**를 **순회**하며, **각 원소**를 **키**와 **값**으로 **분리**하거나 **변형**하여 **딕셔너리**를 **구성**합니다.
    

### 📝 예시

```Python
words = ["apple", "banana", "cat"]

# 단어를 키로, 단어의 길이를 값으로 갖는 딕셔너리 생성
dict_comp = {word: len(word) for word in words}
# 결과: {'apple': 5, 'banana': 6, 'cat': 3}
```

---

## 3. 세트 컴프리헨션 (Set Comprehension)

**새로운 세트(집합)**를 **생성**하며, **리스트 컴프리헨션**과 **유사**하나 **중괄호**(`{}`)를 **사용**합니다. **세트**의 **특징**상 **중복된 원소**는 **자동으로 제거**됩니다.

- **구문:** `{표현식 for 변수 in iterable if 조건}`
    

### 📝 예시

```Python
data = [1, 2, 2, 3, 4, 4, 5]

# 중복이 제거된 제곱값 세트 생성
set_comp = {i * i for i in data}
# 결과: {1, 4, 9, 16, 25} (세트이므로 순서는 보장되지 않음)
```

---

## 4. 제너레이터 표현식 (Generator Expression)

**제너레이터 표현식**은 **컴프리헨션**과 **유사**한 **문법**을 **사용**하지만, **새로운 컬렉션**을 **즉시 생성**하지 않고 **제너레이터 객체**를 **반환**합니다.

- **구문:** `(표현식 for 변수 in iterable if 조건)`
- **특징:** **소괄호**(`()`)를 **사용**하며, **원소**를 **요청**할 때 **실행**되는 **지연 평가**(`Lazy Evaluation`) 방식을 **채택**하여 **메모리 사용량**을 **절감**시킵니다. 이는 **대용량 데이터**를 **처리**할 때 **효율적**입니다.
