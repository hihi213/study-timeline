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
## 💭 나의 추가적 생각/질문