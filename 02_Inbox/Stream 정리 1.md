---
type: 생각조각
status: inbox
source: 
creation_date: 2025-09-23
---

스트림(Stream)은 데이터 묶음(리스트, 배열 등)을 **물 흐르듯 처리**할 수 있게 해주는 **가상의 통로**입니다.

`for`문이 데이터를 하나씩 직접 꺼내 요리하는 방식이라면, 스트림은 **컨베이어 벨트 위에 데이터를 올려놓고, 여러 공정을 거쳐 최종 결과물을 만드는** 방식과 같습니다.

---

### 1) 부족 포인트 스캔 (놓쳤을 수 있는 관점)

- **저장소 vs. 통로:** 스트림을 리스트처럼 데이터를 **저장하는** 새로운 컬렉션으로 오해하고 있습니다. 스트림은 데이터가 **흘러가는 통로**일 뿐, 스스로 데이터를 저장하지 않습니다.
- **원본 데이터의 불변성:** 스트림을 사용한 여러 가공 작업이 **원본 데이터(리스트 등)를 전혀 변경하지 않는다**는 중요한 특징을 놓치고 있습니다.
- **지연 연산(Lazy Evaluation):** 스트림의 중간 연산(`.filter()`, `.map()`)은 최종 연산(`.collect()`, `.sum()`)이 호출되기 전까지는 **실제로 실행되지 않는다**는 지연 평가의 개념을 모르고 있습니다.
- **일회용품:** 스트림은 한 번 사용하고 나면 닫혀버리는 **일회용품**이라는 점을 인지하지 못하고 있습니다. 같은 스트림을 재사용할 수 없습니다.

### 2) 핵심 개념 요약

- **스트림 (Stream) 🌊:**
    - **정의:** 데이터 소스(컬렉션, 배열 등)를 추상화하여, 데이터가 흐르는 파이프라인처럼 다룰 수 있게 하는 객체입니다.
    - **핵심 특징:**
        
        1. **데이터를 저장하지 않는다:** 데이터가 통과하는 통로 역할만 합니다.
        2. **원본 데이터를 변경하지 않는다:** 원본은 그대로 두고, 가공된 결과는 별도로 만들어냅니다.
        3. **일회용이다:** 한 번 최종 연산까지 거친 스트림은 재사용이 불가능합니다.
            
- **스트림 파이프라인 (Stream Pipeline):**
    - 스트림 작업은 보통 세 단계로 이루어진 파이프라인을 형성합니다.
    - **1. 스트림 생성 (Source):** 데이터 묶음에 `.stream()`을 호출하여 컨베이어 벨트를 설치합니다.
    - **2. 중간 연산 (Intermediate Operations):** 컨베이어 벨트 위의 데이터들을 가공하는 공정입니다. 여러 개를 연결할 수 있습니다. (예: `filter`, `map`, `sorted`)
    - **3. 최종 연산 (Terminal Operation):** 모든 가공이 끝난 데이터를 모아 최종 결과물을 만들어내는 마지막 공정입니다. 이 단계가 실행되어야 모든 중간 연산이 비로소 동작합니다. (예: `collect`, `forEach`, `sum`)

### 3) 용어 매핑

- **스트림 (Stream)**: **데이터가 흐르는 컨베이어 벨트** 또는 파이프라인.
- **`.stream()`**: 컬렉션을 컨베이어 벨트 위에 **올리는 작업**.
- **중간 연산 (`.filter()`, `.map()`)**: 컨베이어 벨트 위의 **가공 장치**(필터기, 변환기).
- **최종 연산 (`.collect()`, `.sum()`)**: 벨트 끝에서 완성품을 **상자에 담는 작업**.

---

### 4) 사고 틀 & 판단 기준 (라면 끓이기 비유)

"10,000원 이하의 라면 중, '치즈'가 들어간 신제품을 찾아, 이름만 모아줘"라는 요구사항을 처리해 봅시다.

- **기존 `for`문 방식 (내가 직접 요리):**
    
    1. 결과를 담을 빈 그릇(`List<String>`)을 준비한다.
    2. 라면 진열대(`List<Ramen>`)를 처음부터 끝까지 손으로 살핀다.
    3. 라면 하나를 집어 가격표를 본다. 10,000원 이하인가? (첫 번째 `if`문)
    4. 맞다면, 다시 제품명을 본다. '치즈'가 포함됐나? (두 번째 `if`문)
    5. 맞다면, 다시 제품 타입을 본다. 신제품인가? (세 번째 `if`문)
    6. 모두 통과하면, 라면의 이름만 꺼내서 준비한 그릇에 담는다.
    7. 다음 라면을 집어 3~6번을 반복한다.
        
- **스트림 방식 (자동화된 요리 기계):**

    ```Java
    List<String> result = allRamens.stream() // 1. 모든 라면을 기계에 투입
        .filter(ramen -> ramen.getPrice() <= 10000)   // 2. 만원 이하 필터 통과
        .filter(ramen -> ramen.getName().contains("치즈")) // 3. '치즈' 포함 필터 통과
        .filter(Ramen::isNewProduct)                  // 4. 신제품 필터 통과
        .map(Ramen::getName)                          // 5. 이름만 추출
        .collect(Collectors.toList());                // 6. 결과물을 그릇에 담아줘
    ```

> **판단 기준:** 스트림은 **"무엇을(What)"** 원하는지에 집중하고, `for`문은 **"어떻게(How)"** 할지 절차에 집중합니다. 데이터에 대한 여러 단계의 가공 작업이 필요할 때, 스트림을 사용하면 코드의 의도가 훨씬 명확하고 간결해집니다.

### 5) 체크 질문 (자가 점검)

1. `List`의 데이터를 스트림으로 필터링하면, 원본 `List`의 크기가 줄어드나요?
2. 스트림 파이프라인에서 `.collect()` 같은 최종 연산을 호출하지 않으면, `.filter()`나 `.map()` 같은 중간 연산은 실제로 동작할까요?
3. 한 번 사용한 스트림 객체를 변수에 저장해두고, 여러 번 최종 연산을 호출하는 것이 가능한가요?
4. 스트림을 사용하는 주된 목적은 데이터를 '저장'하는 것인가요, '처리'하는 것인가요?
	- 스트림의 주된 목적은 데이터 **처리(Processing)**입니다.
	`List`, `Set`, 배열 같은 컬렉션의 주된 목적이 데이터를 **저장(Storage)**하는 것과 명확히 구분됩니다.
	- **컬렉션 (List, Set 등)**: 데이터를 담아두는 **창고**나 **컨테이너** 🗄️
	- **스트림 (Stream)**: 창고에서 꺼낸 데이터를 **가공하는 공장의 컨베이어 벨트** 🏭
	스트림은 '저장'된 데이터를 '처리'하여 원하는 결과를 효율적으로 얻어내기 위한 도구입니다. 원본 데이터를 필터링하고, 변환하고, 계산하는 등 데이터의 흐름을 다루는 데에만 집중합니다.
스트림을 **'데이터를 저장하는 컨테이너'가 아니라, '데이터 처리 단계를 기억하는 레시피'**로 설계했기 때문입니다.

최종 연산은 이 레시피대로 요리를 하는 것과 같아서, 한 번 요리하고 나면 그 레시피는 사용된 것이 됩니다. 같은 요리를 또 하려면, 재료(원본 컬렉션)부터 다시 가져와 새로운 레시피(스트림)를 만들어야 합니다.

---

### 1) 부족 포인트 스캔 (놓쳤을 수 있는 관점)

- **지연 평가 (Lazy Evaluation) 원리:** 스트림의 가장 중요한 특징인 '지연 평가'를 놓치고 있습니다. `.filter()`, `.map()` 같은 중간 연산은 호출 즉시 실행되지 않고, 최종 연산이 호출될 때 비로소 한꺼번에 처리됩니다. 스트림 객체는 이 '처리 계획'을 저장하는 역할입니다.
- **상태 없는(Stateless) 설계:** 스트림은 스스로 데이터를 저장하거나 중간 결과를 보관하지 않는 '상태 없는' 구조로 설계되었습니다. 만약 재사용이 가능하다면, 스트림은 첫 번째 연산의 결과물을 어딘가에 저장(상태를 가짐)해야 하는데, 이는 스트림의 근본적인 설계 철학에 어긋납니다.
- **성능 최적화:** 스트림이 일회용이고 지연 평가를 하기 때문에 **숏 서킷(Short-circuiting)** 같은 성능 최적화가 가능해집니다. 이 디자인이 오히려 성능에 이점을 준다는 점을 간과하고 있습니다.

### 2) 핵심 개념 요약

- **지연 평가 (Lazy Evaluation) - 핵심 원리:**
    - **중간 연산 (`.filter`, `.map` 등):** 호출 즉시 실행되지 않고, **"이런 작업을 해야 한다"는 계획(레시피)만** 스트림에 차곡차곡 쌓아둡니다.
    - **최종 연산 (`.collect`, `.forEach` 등):** "이제 요리를 시작해!"라는 신호입니다. 이 메서드가 호출되는 순간, 원본 데이터 소스에서 데이터를 하나씩 꺼내 쌓아뒀던 계획들을 전부 실행합니다.
    - **비유:** 유튜브 재생 버튼을 누르기 전까지는 영상이 재생되지 않는 것과 같습니다. 중간 연산은 재생 목록을 만드는 것이고, 최종 연산은 재생 버튼을 누르는 것입니다.
- **스트림은 '데이터 통로'이지 '데이터 창고'가 아니다:**
    - 스트림은 강과 같습니다. 강물은 계속 흘러가 버리지, 특정 지점에 고여있지 않습니다. **한 번 흘러간 물(데이터)을 다시 흘려보낼 수는 없습니다.** 최종 연산을 호출하는 것은 강물이 바다에 도달하여 여정이 끝나는 것과 같습니다. 이 때문에 스트림은 소모되었다(consumed)고 표현하며, 재사용이 불가능합니다.
- **숏 서킷 (Short-circuiting)을 통한 최적화:**
    - 스트림이 일회용이고 지연 평가를 하기 때문에 가능한 최적화 기법입니다.
    - 예를 들어, `list.stream().filter(...).findFirst()` 코드는 **조건에 맞는 첫 번째 요소를 찾는 즉시** 스트림 처리를 중단합니다. 나머지 99만개의 데이터를 더 이상 쳐다보지도 않아 엄청난 성능 이득을 봅니다.
    - 만약 스트림이 재사용 가능하고 중간 결과를 저장해야 한다면, 이런 최적화는 구현하기 매우 복잡해집니다.

---

### 3) 용어 매핑

- **"왜 스트림은 일회용이야?"**: **"지연 평가(Lazy Evaluation)와 상태 없는(Stateless) 설계를 통한 성능 최적화를 위해"**
- **"사용한 스트림"**: **소모된(Consumed)** 스트림. 최종 연산이 호출되어 데이터의 흐름이 끝난 상태.

---

### 4) 사고 틀 & 판단 기준 (스트림의 생명주기)

1. **1단계: 생성 및 계획 수립 (지연 단계)**
    
    - `Stream<String> stream = names.stream()`: `names` 리스트에서 데이터를 꺼내 처리할 **계획서(스트림)**를 만듭니다. (아직 데이터는 흐르지 않음)
    - `.filter(s -> s.startsWith("A"))`: 계획서에 "A로 시작하는 것만 남겨라"는 **계획을 추가**합니다. (여전히 데이터는 흐르지 않음)
        
2. **2단계: 실행 및 소모 (실행 단계)**
    
    - `.count()`: 최종 연산(개수를 세라) 명령이 내려옵니다.
    - 이 순간, `names` 리스트에서 데이터가 **비로소 하나씩 흘러나오기 시작**하여, `filter` 계획을 거치고, 최종적으로 개수가 계산됩니다.
    - 계산이 끝나면 스트림이라는 통로는 닫히고, **소모**됩니다.
        
3. **3단계: 종료 (닫힌 상태)**
    
    - 위에서 사용된 `stream` 변수에 `.forEach(...)` 같은 또 다른 최종 연산을 호출하면 `IllegalStateException` 예외가 발생합니다.
    - 새로운 작업을 하려면, `names.stream()`으로 새로운 계획서를 다시 만들어야 합니다.

---

### 5) 체크 질문 (자가 점검)

1. `list.stream().filter(...)` 코드가 실행되는 순간, 리스트의 모든 데이터에 대한 필터링이 즉시 완료되나요?
2. 스트림을 강물에 비유할 때, 최종 연산은 무엇에 해당할까요? (강물을 만드는 것 vs. 강물이 바다에 도달하는 것)
3. 100만 개의 데이터 중 조건에 맞는 첫 번째 데이터를 찾는 `.findFirst()` 연산이 매우 효율적인 이유는 스트림의 어떤 특징 때문인가요?
4. 스트림이 일회용으로 설계된 것은 개발자를 불편하게 하려는 걸까요, 아니면 특정 이점(최적화 등)을 얻기 위함일까요?
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
**메서드 레퍼런스 (Method Reference) `::`

- 람다(Lambda) 표현식을 더 간단하게 줄여 쓰는 문법입니다.
- `orderItem -> orderItem.getTotalPrice()` (람다 표현식)
- `OrderItem::getTotalPrice` (메서드 레퍼런스)
- 둘은 "각각의 `orderItem`에 대해 `getTotalPrice()` 메서드를 실행하라"는 완전히 똑같은 의미입니다.
[향상된 for문(for-each)루프 1](향상된%20for문(for-each)루프%201.md)

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