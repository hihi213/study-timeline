## 자료형

## 수 자료형

### 정수형

### 실수형

```Java
#소수부가 0일 때 0을 생략
a = 5. # 5.0

# 10억의 지수 표현 방식 (최단 경로문제에서 자주 사용)
a = 1e9 # 100000000.0

# 컴퓨터는 2진수 체계이기 때문에 실수 덧셈을 정확히 하지 못한다. 보통 5째 자리에서 반올림 하면된다.
a = 0.3 + 0.6
print(round(a,4))
```

### 수 자료형의 연산

```Java
a = 7
b = 3

# 나누기
a / b

# 나머지
a % b

# 몫
a // b

# 거듭 연산자
a ** b   # a의 b승
```

## 리스트 자료형

## 리스트 초기화

```Java
a = [1,2,3,4,5,6,7,8,9]

print(a)
print(a[4])

# 빈 리스트 선언 방법
a = list()
a = []

# 크기가 N이고 모든 값이 0인 1차원 리스트 초기화
n = 10
a = [0] * n
# [0,0,0,0,0,0,0,0,0,0]
```

## 리스트 인덱싱과 슬라이싱

### 인덱싱

- 인덱스 값을 입력하여 리스트의 특정한 원소의 접근하는 것을 인덱싱이라 한다.
- 파이썬의 인덱스값은 양,음 정수를 모두 사용할 수 있으며 음의 정수를 넣으면 원소를 거꾸로 탐색한다.

### 슬라이싱

- 리스트의 연속적인 위치를 갖는 원소들을 가져와야 할 때 사용

```Java
a = [1,2,3,4,5,6,7,8,9]

a[-1] # 9
a[-3] # 7
a[1:4] # [2,3,4]
```

## 리스트 컴프리헨션

- 리스트를 초기화하는 방법 중 하나이다
- 대괄호안에 조건문과 반복문을 넣는 방식으로 리스트를 초기화할 수 있다.
- **2차원 리스트를 초기화할 때 매우 효과적으로 사용된다.**
- 리스트 컴프리헨션과 일반소스코드 비교

```Java
# 0부터 19까지의 수 중에서 홀수만 포함하는 리스트

array = [i for i in range(20) if i % 2 == 1]

array = []
for i in range(20)
        if i % 2 == 1:
                array.append(i)
```

```Java
# 1부터 9까지의 수의 제곱 값을 포함하는 리스트
array = [i*i for i in range(1,10)]
```

```Java
# N * M 크기의 2차원 리스트 초기화
n = 3
m = 4

array = [[0] * m for _ in range(n) ] # [[0,0,0,0],[0,0,0,0], [0,0,0,0]]
```

- 언더바(_)의 역할

### 특정 크기의 2차원 리스트를 초기화 할 때는 반드시 리스트 컴프리헨션을 사용

```Java
# N * M 크기의 2차원 리스트 초기화(잘못된 방법)
n = 3
m = 4
array = [[0] * m] * n # [[0,0,0,0],[0,0,0,0], [0,0,0,0]]

array[1][1] = 5 # [[0,5,0,0],[0,5,0,0], [0,5,0,0]]

# 내부적으로 3개의 리스트가 모두 동일한 객체에 대한 3개의 레퍼런스로 인식되기 때문
```

## 리스트 관련 기타 메서드

- append() O(1)
- sort()
- reverse()
- insert() O(N)
- count()
- remove() O(N)

```Java
a = [1,4,3]

# 리스트에 원소 삽입
a.append(2)

# 오름차순 정렬
a.sort()

# 내림차순 정렬
a.sort(reverse = True)

# 리스트 원소 뒤집기
a.reverse()

# 특정 인덱스에 데이터 추가
a.insert(2,3) # 인덱스2에 3추가

# 특정 값인 데이터 개수 세기
a.count(3)

# 특정 값 데이터 삭제 (인덱스가 낮은 것 하나)
a.remove(1) 
```

특정한 값을 갖는 원소 삭제하려면?

```Java
# 시간복잡도를 고려해서 remove는 사용하지 않는 것을 추천

a = [1,2,3,4,5,5,5]
remove_set = {3,5}

# remove_set에 포함되지 않은 값만을 저장
result = [i for i in a if i not in remove_set] # [1,2,4]
```

## 문자열 자료형

## 문자열 초기화

```Java
data = 'Hellow World'

data =  "Don't you know \"Python\"?"
print(data) # Don't you know "Python"?
```

## 문자열 연산

```Java
a = "Hello"
b = "World"

a + " " + b # Hello World

a * 3 # HelloHelloHello

# 파이썬 문자열은 내부적으로 리스트와 같이 처리 (인덱싱,슬라이싱) 사용 가능

a = "ABCDEF"

a[2:4] #CD
```

## 튜플 자료형

- 튜플은 한 번 선언된 값을 변경할 수 없다.
- 리스트는 대괄호[] 를 이용하지만 , 튜플은 소괄호 ()를 이용한다
- 그래프 알고리즘을 구현할 때 자주사용
    - 다익스트라 최단 경로 알고리즘 (우선순위큐 사용)
        - (비용,노드번호) 형태로 튜플을 묶어서 관리한다.

```Java
a = (1, 2, 3, 4)

a[2] = 7 # TypeError
```

## 사전 자료형

## 사전 자료형 소개

- key와 value의 쌍을 데이터로 가지는 자료형
- 튜플 자료형이 사전자료형의 키로 사용되는 경우 (Q 22 블록이동하기)
- 사전 자료형에 특정한 원소가 있는 지 검사할 때는 '원소 in 사전'의 형태를 사용할 수 있다.
    - 리스트나 튜플에 대해서도 사용할 수 있는 문법

```Java
data = dict()
data['사과'] = 'Apple'
data['바나나'] = 'Banana'
data['코코넛'] = 'Coconut'

# {'사과': 'Apple', '바나나': 'Banana', '코코넛': 'Coconut'}

if '사과' in data:
        print("'사과'를 키로 가지는 데이터가 존재합니다.")
```

## 사전 자료형 관련 함수

- 키 데이터만 뽑아서 리스트로 이용할 때는 keys()함수
- 값 데이터만을 뽑아서 리스트로 이용할 때는 values() 함수를 이용한다.

```Java
data = dict()
data['사과'] = 'Apple'
data['바나나'] = 'Banana'
data['코코넛'] = 'Coconut'

# 키 데이터만 담은 리스트
key_list = data.keys()
value_list = data.values()

for key in key_list:
        print(data[key]) # Apple Banana Coconut
```

## 집합 자료형(Set)

## 집합 자료형 소개

- 중복을 허용하지 않는다
- 순서가 없다
- 특정한 데이터가 이미 등장한 적이 있는지 여부를 체크할 때 효과적이다.

```Java
# 집합 자료형 초기화 방법 
data = set([1,1,2,3,4,4,5])

data = {1,2,3,4,5}
```

## 집합 자료형의 연산

- 합집합, 교집합, 차집합 연산이 있다.

```Java
# 집합 자료형 초기화 방법 
a = set([1,2,3,4,5])
b = {3,4,5,6,7}

a | b # 합집합 {1,2,3,4,5,6,7}
a & b # 교집합 {3,4,5}
a - b # 차집합 {1,2}
```

## 집합 자료형 관련 함수

```Java
data = set([1,2,3])
print(data)

# 새로운 원소 추가
data.add(4)

# 새로운 원소 여러 개 추가
data.update([5,6])

# 특정한 값을 갖는 원소 삭제
data.remove(3)

print(data)
```

## 조건문

- 조건문 작성은 if ~ elif ~ else문을 이용한다.

## 비교 연산자

```Java
x == y
x != y
x > y
x < y
x >= y
x <= y
```

## 논리 연산자

```Java
x and y
x or y
not x # x가 거짓일 때 참이다.
```

## 파이썬의 기타 연산자

- 파이썬에서는 추가적으로 'in 연산자'와 'not in 연산자'를 제공한다.
- 자료형 (리스트, 튜플, 문자열, 사전)에 사용된다.
- pass문 (조건문의 값이 참이라고 해도 아무것도 처리하고 싶지 않을 때)
- 조건부 표현식을 이용하면 if ~ else문을 한줄에 작성해 사용할 수 있다.
    - 리스트에 있는 원소의 값을 변경해서 또 다른 리스트를 만들고자 할 때 매우 간결하게 사용가능

```Java
X in 리스트     # 리스트 안에 X가 들어가 있을 때 참(True)이다.
X not in 문자열 # 문자열 안에 X가 들어가 있지 않을 때 참(True)이다.

score = 85
if score >= 80:
        pass
else:
    print('성적이 80점 미만입니다.')

# 1줄일 경우 줄이기
if score >= 80: result = "Success"
else: result = "Fail"

## 조건부 표현식
result = "Success" if score >= 80 else "Fail"

# 3항 연산자
result = score >= 80 and "Success" or "Fail"

# 리스트에 있는 원소의 값을 변경해서 또 다른 리스트를 만들고자 할 때 매우 간결하게 사용가능

a = [1,2,3,4,5,5,5]
remove_set = {3,5}

result = []
for i in a:
        if i not in remove_set:
                result.append(i)

result = [i for i in a if i not in remove_set]
```

## 반복문

## while문

```Java
i = 1
result = 0
while i <= 9:
        result += i
        i += 1
print(result)
```

## for문

- range(시작값, 끝값+1 ,증감)
- continue
- break

```Java
result = 0

for i in range(1,10):
        result += 1
print(result)
```

```Java
scores = [90, 85, 77, 65, 97]
cheating_list = {2,4}

for i in range(5):
        if i + 1 in cheating_list:
                continue
        if scores[i] >= 80:
                print(i + 1, '번 학생은 합격입니다'.)
```

### 이중 for문

- 플로이드 워셜 알고리즘
- 다이나믹 프로그래밍

```Java
# 구구단
for i in range(2,10):
        for j in range(1,10):
                print(i, "X", j, "=", i*j)
        print()
```

## 함수

- 동일한 알고리즘을 반복적으로 수행해야 할 때 사용
- 매개변수나 return문은 존재하지 않을 수도 있다.

```Java
def add(a,b):
        return a + b

print(add(3,7))

def add(a, b):
        print('함수의 결과:', a+b)

# 매개변수를 직접 지정해 줄 수도 있다.
add(b = 3, a = 7)
```

### global

- 함수 안에서 함수 밖의 변수 데이터를 변경해야 하는 경우

```Java
a = 0

def func():
        global a
        a += 1

for i in range(10):
        func()

print(a)
```

## 람다 표현식(Lambda Express)

- 특정한 기능을 수행하는 함수를 한 줄에 작성할 수 있다
- 람다식은 파이썬의 정렬 라이브러리를 사용할 때, 정렬 기준(Key)을 설정할 때에도 자주 사용한다.

```Java
def add(a, b):
        return a + b

print(add(3,7))

# 람다 표현식으로 구현한 add() 메서드
print( (lambda a, b: a + b)(3,7) )
```

## 입출력

## 입력

- map()
    - 해당 리스트의 모든 원소에 int() 함수를 적용한다.
- sys.stdin.readline()
    - 입력을 최대한 빠르게 받아야하는 경우
    - readline()으로 입력하면 입력후 엔터가 줄 바꿈 기호로 인식, 공백 문자를 제거하려면 rstrip()함수를 사용해야한다.

```Java
# 데이터의 개수 입력
n = int(input())

# 각 데이터를 공백으로 구분하여 입력
data = list(map(int, input().split()))

data.sort(reverse = True)
print(data)

# 공백을 기준으로 구분하여 적은수의 데이터 입력

n, m, k = map(int, input().split()
```

```Java
# 입력을 최대한 빠르게 받아야하는 경우

import sys

# 문자열 입력받기
sys.stdin.readline().rstrip()
```

## 출력

- print()
    - 기본적으로 출력 이후에 줄 바꿈을 수행한다.
- f-string

```Java
# 출력할 변수들
a = 1
b = 2

print(a,b)
```

- 출력 시 오류가 발생하는 소스코드 예시 (자바와 다름 주의)

```Java
# 출력할 변수들

answer = 7

print("정답은 " + answer + "입니다.") # TypeError: can only concatenate str (not "int") to str

# 올바른 예
print("정답은 " + str(answer) + "입니다")
print("정답은" , str(answer), "입니다")

# Python 3.6 이상

answer = 7
print(f"정답은 {answer}입니다.")
```

## 주요 라이브러리 문법과 유의점

## 코딩테스트를 준비하며 반드시 알아야 하는 라이브러리 6가지

1. 내장 함수
    - print(), input()과 같은 기본 입출력 기능부터 sorted()와 같은 정렬 기능을 포함하고 있는 내장 라이브러리
2. itertools
    - 파이썬에서 반복되는 형태의 데이터를 처리하는 기능을 제공하는 라이브러리, 순열과 조합 라이브러리를 제공
3. heapq
    - 힙(Heap) 기능을 제공하는 라이브러리. 우선순위 큐 기능을 구현하기 위해 사용한다.
4. bisect
    - 이진탐색/이분탐색(Binary Search) 기능을 제공하는 라이브러리
5. Collections
    - 덱(deque), 카운터(Counter) 등의 유용한 자료구조를 포함하고 있는 라이브러리
6. math
    - 필수적인 수학적 기능을 제공하는 라이브러리
    - 팩토리얼, 제곱급, 최대공약수(GCD), 삼각함수, 파이(pi)

## 내장 함수

```Java
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

## itertools

- 반복되는 데이터를 처리하는 기능을 포함하고 있는 라이브러리
- permutations (순열)
- combinations (조합)
- product (중복을 허용하는 순열)
- combinations_with_replacement (중복을 허용하는 모든 조합)
- 순열 조합 모두 클래스이므로 객체 초기화 이후 리스트 자료형으로 변환하여 사용한다.

```Java
from itertools import permutations, combinations, product,
                                            combinations_with_replacement

data = ['a', 'b', 'c'] # 데이터 준비

# 리스트에서 3개를 뽑아 나열하는 모든 경우를 출력
result = list(permutations(data,3)) # 모든 순열 구하기

print(result)

result = list(combinations(data,2)) # 2개를 뽑는 모든 조합 구하기

print(result)

result = list(product(data,repeat = 2)) # 2개를 뽑는 모든 순열 구하기 (중복 허용)

print (result)

result = list(combinations_with_replacement(data,2)) # 2개를 뽑는 모든 조합 구하기 (중복 허용)

print (result)

[('a', 'b', 'c'), ('a', 'c', 'b'), ('b', 'a', 'c'), ('b', 'c', 'a'), ('c', 'a', 'b'), ('c', 'b', 'a')]
[('a', 'b'), ('a', 'c'), ('b', 'c')]
[('a', 'a'), ('a', 'b'), ('a', 'c'), ('b', 'a'), ('b', 'b'), ('b', 'c'), ('c', 'a'), ('c', 'b'), ('c', 'c')]
[('a', 'a'), ('a', 'b'), ('a', 'c'), ('b', 'b'), ('b', 'c'), ('c', 'c')]
```

## heapq (Min heap)

- 힙기능을 위해 heapq 라이브러리를 제공
- 다익스트라 최단 경로 알고리즘등에서 우선운위 큐 기능을 구현하고자 할 때 사용
    - PriorityQueue 라이브러리를 사용할 수 있지만 코딩테스트 환경에서는 heapq가 더빠르게 동작함으로 heapq를 사용하자
- 최소 힙(min heap)으로 구성되어 있으므로 넣었다 빼는 것만으로 O(NlogN)에 오름차순 정렬이 완료된다.
    - 보통 최소 힙 자료구조의 최상단 원소는 항상 '가장 작은'원소이기 때문이다
- heapq.heappush() 삽입
- heapq.heappop() 꺼냄

```Java
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

## bisect

- 이진탐색을 쉽게 구현할 수 있도록 하는 라이브러리
- '정렬된 배열'에서 특정한 원소를 찾아야 할 때 매우 효과적으로 사용
- bisect_left(a,x)
    - 정렬된 순서를 유지하면서 리스트 a에 데이터 x를 삽입할 가장 왼쪽 인덱스를 찾는 메서드
- bisect_right(a,x)
    - 정렬된 순서를 유지하면서 리스트 a에 데이터 x를 삽입할 가장 오른쪽 인덱스를 찾는 메서드
- '정렬된 리스트'에서 '값이 특정 범위에 속하는 원소의 개수'를 구하고자 할 때 사용

```Java
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

## collections

- 유용한 자료구조를 제공하는 표준 라이브러리
- deque
    - 스택, 큐를 구현할 때 사용하는 라이브러리
    - 가장 앞 원소추가, 가장 앞 원소제거에서 O(1)의 시간복잡도를 가진다
    - 인덱싱, 슬라이싱 등은 사용할 수 없다.
        
        ```Java
        from collections import deque
        
        data = deque([2,3,4])
        data.appendleft(1)
        data.append(5)
        
        data.pop()
        data.popleft()
        
        print(data)  # deque([2, 3, 4])
        print(list(data)) # [2, 3, 4]
        ```
        
- Counter
    - 등장 횟수를 세는 기능을 제공
    - 리스트와 같은 iterable 객체가 주어졌을 때, 해당 객체 내부의 원소가 몇 번씩 등장했는지를 알려준다.
    - 원소별 등장 횟수를 세는 기능이 필요할 때 짧은 코드로 이를 구현할 수 있다.
        
        ```Java
        from collections import Counter
        
        counter = Counter(['red', 'blue', 'green', 'blue', 'blue'])
        
        print(counter['blue']) # 'blue'가 등장한 횟수 출력
        print(dict(counter)) # 사전 자료형으로 변환 list,set도 가능하고 두개가 같은 값을 가진다
        
        # 3
        # {'red': 1, 'blue': 3, 'green': 1}
        ```
        

## math

- 수학적인 기능을 포함하고 있는 라이브러리
- 팩토리얼, 제곱근, 최대공약수(GCD) , Pi

```Java
import math

print(math.factorial(5)) # 5 팩토리얼 출력

print(math.sqrt(7)) # 7의 제곱근 출력

print(math.gcd(21,14)) # 21과 14의 최대 공약수 , 7

print(math.pi) # 파이 출력

print(math.e) # 자연상수 출력
```
