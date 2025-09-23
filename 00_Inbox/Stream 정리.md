---
type: 생각조각
status: inbox
source: 
creation_date: 2025-09-23
---

## **0) 핵심 한 줄**

```java
int total =
  orderItems.stream()                 // Stream<OrderItem>
            .mapToInt(OrderItem::getTotalPrice) // IntStream (박싱X)
            .sum();                   // 합계(int)
```

---

## **1) Stream**

##  **만들기(생성)**

```java
collection.stream()                  // List, Set 등
Stream.of(a, b, c)                   // 가변 인자
Arrays.stream(T[])                   // 배열
Stream.<T>empty()                    // 빈 스트림
Stream.generate(supplier)            // 무한 스트림(중간 제한 필요)
Stream.iterate(seed, unaryOp)        // 시드부터 생성
Files.lines(path)                    // 파일 행 스트림
```

---

## **2) 중간 연산(Intermediate)**

- **map**: Stream\<T> → Stream\<R>
- **mapToInt/mapToLong/mapToDouble**: Stream\<T> → IntStream/… _(합계·평균에 유리, 박싱X)_
- **flatMap / flatMapToInt**: 중첩 컬렉션 평탄화
- **filter**: 조건 통과만 흐르게
- **distinct**: 중복 제거(동등성 기준)
- **sorted**: 정렬 (예: .sorted(comparing(OrderItem::getTotalPrice)))
- **peek**: 디버깅용 엿보기
- **limit / skip**: 앞 N개 / 건너뛰기

> 중간 연산은 **지연(lazy)**. 최종(terminal) 연산이 와야 실행됨.

---

## **3) 최종 연산(Terminal)**

- **forEach / forEachOrdered**
- **collect(…Collectors)** → List/Set/Map 등으로 수집
- **reduce**: 누적(합계·곱·최댓값 등 커스텀)
- **count / min / max**
- **anyMatch / allMatch / noneMatch**
- **findFirst / findAny**

---

## **4) IntStream/LongStream/DoubleStream (원시 스트림)**

**생성**

```java
Ints:  Arrays.stream(int[]) , IntStream.of(1,2,3),
       IntStream.range(0, n), IntStream.rangeClosed(1, n)
```

**중간**

```java
map / mapToObj / filter / distinct / sorted / peek / limit / skip
```

**최종**

```java
sum()                     // 합계
average()                 // OptionalDouble
min() / max()             // OptionalInt/…
count()
reduce(identity, op)      // 커스텀 누적
summaryStatistics()       // IntSummaryStatistics
boxed()                   // IntStream → Stream<Integer>
```

---

## **5) Collectors (자주 쓰는 것)**

```java
toList(), toSet()
toMap(keyMapper, valueMapper[, mergeFn])      // 키 충돌 시 mergeFn 필수
counting()                                    // 개수
summingInt/Long/Double(...)                   // 합계
averagingInt/…                                 // 평균(Double)
summarizingInt/…                               // 합·평균·최소·최대·개수 한 번에
joining(delimiter, prefix, suffix)            // 문자열 결합
mapping(mapper, downstream)                   // 중간 매핑 후 하위 수집
groupingBy(key[, downstream])                 // 그룹화
partitioningBy(predicate[, downstream])       // true/false 2-way
collectingAndThen(downstream, finisher)       // 수집 후 변환
```

**예**
```java
int total = orderItems.stream()
                      .collect(Collectors.summingInt(OrderItem::getTotalPrice));

IntSummaryStatistics stats = orderItems.stream()
    .collect(Collectors.summarizingInt(OrderItem::getTotalPrice));
// stats.getSum(), getAverage(), getMin(), getMax(), getCount()
```

---

## **6) reduce 패턴(합계/커스텀 누적)**

```java
// (1) Stream<Integer>일 때
int sum = list.stream().reduce(0, Integer::sum); // 박싱 비용 발생

// (2) IntStream이면
int sum2 = list.stream().mapToInt(x -> x).reduce(0, (a,b)->a+b);

// (3) 세 파라미터 버전(병렬 시 결합자 필요)
U result = stream.reduce(identity, accumulator, combiner);
```

---

## **7) 박싱/언박싱 & 변환**

- map(OrderItem\:\:getTotalPrice) → **Stream**(박싱 발생)
- mapToInt(OrderItem::getTotalPrice) → **IntStream**(박싱X, 합계·평균 유리)
- int ↔ Integer: 오토박싱/언박싱은 성능에 민감한 루프에서는 피하기
- boxed() / mapToObj(…)로 원시↔객체 전환

---

## **8) null/빈 컬렉션 안전 패턴**

```java
int total = Optional.ofNullable(orderItems).orElseGet(List::of).stream()
    .filter(Objects::nonNull)
    .mapToInt(OrderItem::getTotalPrice)
    .sum(); // 빈 리스트면 0
```

---

## **9) 금액 타입 선택**

- 합계가 **int를 넘을 수 있으면**: long 또는 **BigDecimal** 사용

```java
long total = orderItems.stream().mapToLong(OrderItem::getTotalPriceLong).sum();

BigDecimal total = orderItems.stream()
    .map(OrderItem::getTotalPriceBD)
    .reduce(BigDecimal.ZERO, BigDecimal::add);
```

---

## **10) Map 순회 팁**

```java
for (Map.Entry<K,V> e : map.entrySet()) { /* e.getKey(), e.getValue() */ }

map.entrySet().stream()
   .sorted(Map.Entry.comparingByValue())
   .forEachOrdered(System.out::println);
```

---

## **11) 성능/병렬**

- 작은 데이터셋은 **for-each ≈ stream**. 가독성 위주로 선택.
- parallelStream()은 **큰 데이터 + CPU 바운드**에서만 고려(오버헤드/경합 주의).
- 정렬 중요하면 forEachOrdered 또는 종단 전에 sorted.

---

## **요약**

- **합계**엔 mapToInt(...).sum()이 가장 단순·효율적.
- 통계가 필요하면 summarizingInt, 그룹·집계는 groupingBy(…, summingInt(…)).
- **박싱 피하려면** 원시 스트림(IntStream 등)을 우선 고려.
- **null/빈 컬렉션**은 Optional+List::of로 방어.

원하면 네 OrderItem 클래스 시그니처(금액 타입/메서드명)를 알려줘. 거기에 최적화된 “합계/통계/그룹별 합계” 예제까지 맞춤으로 만들어줄게!

---
**메서드 레퍼런스 (Method Reference) `::`**:

- 람다(Lambda) 표현식을 더 간단하게 줄여 쓰는 문법입니다.
- `orderItem -> orderItem.getTotalPrice()` (람다 표현식)
- `OrderItem::getTotalPrice` (메서드 레퍼런스)
- 둘은 "각각의 `orderItem`에 대해 `getTotalPrice()` 메서드를 실행하라"는 완전히 똑같은 의미입니다.
[향상된 for문(for-each)루프](향상된%20for문(for-each)루프.md)

## 💭 나의 추가적 생각/질문

아니요, 어려운 문법이 아니라 **데이터 묶음을 컨테이너벨트처럼 다루는 편리한 문법**입니다.

이 코드 한 줄은 "**`orderItems` 리스트를 컨테이너벨트에 올려놓고, 각 상품(`OrderItem`)에서 가격(`getTotalPrice`)만 뽑아낸 뒤, 그걸 전부 더해라**"는 의미입니다.

---

### 1) 부족 포인트 스캔 (놓쳤을 수 있는 관점)

- **데이터 처리 방식의 전환:** `for`문을 사용해서 개발자가 하나하나 절차를 지시하는 방식(명령형)에서, "무엇을 원하는지"만 선언하는 방식(선언형)으로 코딩 패러다임이 바뀐다는 점을 놓치고 있습니다.
- **스트림(Stream)의 개념:** `stream()`이 단순히 리스트를 다른 형태로 바꾸는 것이 아니라, 데이터가 흘러가는 **가상의 통로(Stream)**를 만드는 개념이라는 것을 인지하지 못하고 있습니다. 이 통로에 여러 장치를 연결해 데이터를 가공하는 것입니다.
- **중간 연산과 최종 연산:** 스트림은 여러 개의 **중간 연산(Intermediate Operation)**(예: `mapToInt`)을 거쳐 데이터를 가공하고, 마지막에 **최종 연산(Terminal Operation)**(예: `sum`)을 통해 결과를 만들어낸다는 파이프라인 구조를 모르고 있습니다.
- **메서드 레퍼런스(Method Reference):** `OrderItem::getTotalPrice` 라는 생소한 문법이 "각 `OrderItem` 객체의 `getTotalPrice()` 메서드를 호출하라"는 의미의 축약형이라는 것을 모르고 있습니다.

### 2) 핵심 개념 요약

- **스트림 (Stream):**
    - Java 8부터 도입된 기능으로, 컬렉션(리스트, 셋 등)의 데이터들을 **하나의 흐름(Stream)**처럼 다룰 수 있게 해주는 도구입니다. 데이터가 컨테이너벨트를 따라 흐르는 것과 같습니다.
    - **특징:** 원본 데이터를 직접 바꾸지 않고, 일회용입니다.
- **스트림 파이프라인 (Stream Pipeline):** 스트림은 보통 3단계의 파이프라인으로 구성됩니다.
    
    1. **생성 (Creation):** 컬렉션에 `.stream()`을 붙여 데이터의 흐름(스트림)을 만듭니다. (예: `orderItems.stream()`)
    2. **중간 연산 (Intermediate Operation):** 흐르는 데이터를 가공합니다. 여러 개를 연결(chaining)할 수 있습니다.
        
        - **`mapToInt(OrderItem::getTotalPrice)`**: "흐르는 데이터(`OrderItem` 객체)를 `int` 값으로 **변환(map)**해라. 변환 방법은 각 객체의 `getTotalPrice()` 메서드를 호출해서 나온 결과(가격)를 쓰는 거야."
            
    3. **최종 연산 (Terminal Operation):** 가공된 데이터의 흐름을 끝내고 최종 결과를 만들어냅니다.
        
        - **`.sum()`**: "지금까지 흘러온 모든 `int` 값들을 **전부 더해서(sum)** 최종 합계를 내놔."
- **메서드 레퍼런스 (Method Reference) `::`**:
    - 람다(Lambda) 표현식을 더 간단하게 줄여 쓰는 문법입니다.
    - `orderItem -> orderItem.getTotalPrice()` (람다 표현식)
    - `OrderItem::getTotalPrice` (메서드 레퍼런스)
    - 둘은 "각각의 `orderItem`에 대해 `getTotalPrice()` 메서드를 실행하라"는 완전히 똑같은 의미입니다.

### 3) 용어 매핑

- **`orderItems.stream()`**: `orderItems` 리스트를 **데이터가 흐르는 통로(스트림)로 변환**하는 단계.
- **`.mapToInt(...)`**: 흐르는 객체를 특정 **정수(`int`) 값으로 매핑(변환)**하는 중간 작업.
- **`OrderItem::getTotalPrice`**: "각 `OrderItem` 요소의 `getTotalPrice()` 메서드를 호출하라"는 **작업 지시서**.
- **`.sum()`**: 모든 숫자들의 **합계를 구하는** 최종 작업.

### 4) 사고 틀 & 판단 기준

이 코드를 공장에서 제품을 만드는 과정에 비유해 보세요.

1. **`orderItems.stream()` (원재료 투입):**
    
    - `orderItems`라는 상자에서 `OrderItem` 객체들을 컨테이너벨트 위에 하나씩 올립니다.
        
2. **`.mapToInt(OrderItem::getTotalPrice)` (1번 기계 - 가공):**
    
    - 컨테이너벨트를 따라 들어오는 `OrderItem` 객체들마다, `getTotalPrice`라는 기계가 가격표(`int`)만 떼어내서 다음 컨테이너벨트로 넘깁니다. 이제 컨테이너벨트 위에는 객체가 아닌 숫자(가격)들만 흐릅니다.
        
3. **`.sum()` (2번 기계 - 최종 조립):**
    
    - 가격들이 흘러 들어오면, 마지막 기계가 이 숫자들을 모두 합산해서 최종 합계 금액이라는 완제품을 만들어냅니다.

> **판단 기준:** `for`문을 써서 합계를 구하는 것보다 코드가 훨씬 **간결하고, "무엇을 하려는지" 그 의도가 명확하게 드러날 때** 스트림을 사용하는 것이 좋습니다. "모든 주문 상품의 가격을 합산한다"는 목적이 코드 한 줄에 그대로 나타납니다.

### 5) 체크 질문 (자가 점검)

1. `stream()`은 원본 `orderItems` 리스트의 내용을 직접 변경하나요?
2. `mapToInt`는 중간 연산인가요, 최종 연산인가요?
3. 만약 `getTotalPrice`가 아니라 각 `OrderItem`의 `getQuantity()`(수량)의 총합을 구하고 싶다면, 코드의 어느 부분을 바꿔야 할까요?
4. 스트림을 사용하면 `for`문과 `if`문을 여러 줄 쓰는 것보다 코드의 의도를 더 쉽게 파악할 수 있을까요?