데이터 처리 api임

# 1.  중간 연산 (Intermediate Operation)

중간 연산은 **스트림을 변환하거나 필터링하는 연산**으로, 최종 연산이 호출될 때까지 실행되지 않는 **지연 연산(Lazy Evaluation)**입니다. 여러 중간 연산을 체인 형태로 연결할 수 있습니다.
- **메서드** **설명** **예제**
	filter(Predicate) 
		스트림 요소를 조건에 맞게 **필터링**합니다. 
		stream.filter(n -> n > 0)
	
	map(Function) 
		각 요소를 주어진 함수로 **변환**합니다. 
		stream.map(String::toUpperCase)
	
	flatMap(Function) 
		각 요소를 스트림으로 변환하고 **하나의 스트림으로 평탄화**합니다. 
		stream.flatMap(List::stream)
	
	distinct() 
		중복을 제거하여 **고유한 요소만 남깁니다**. 
		stream.distinct()
	
	sorted() 
		스트림 요소를 **정렬**합니다. 기본 또는 Comparator로 정렬 가능합니다. 
		stream.sorted() 또는 stream.sorted(Comparator)
	
	limit(long n) 
		**처음 n개의 요소**만 포함하는 스트림을 반환합니다. 
		stream.limit(5)
	
	skip(long n) 
		**처음 n개의 요소를 건너뛰고** 나머지를 포함하는 스트림을 반환합니다. 
		stream.skip(3)
	
	peek(Consumer) 
		스트림의 각 요소를 소비자 함수로 처리하고, 변경 없이 반환합니다. **디버깅용**으로 유용합니다.
		stream.peek(System.out::println)
# 2. 최종 연산 (Terminal Operation)

최종 연산은 스트림의 **데이터 처리를 종료하고 결과를 반환**하는 연산입니다. 최종 연산이 호출되면 스트림이 닫히고 더 이상 사용할 수 없습니다.
- **메서드** **설명** **예제**
	collect(Collector) 
		스트림의 요소를 **리스트, 집합, 문자열 등으로 수집**합니다. 
		stream.collect(Collectors.toList())
	forEach(Consumer) 
		각 요소를 주어진 소비자 함수로 처리합니다. **반환 값이 없습니다.** 
		stream.forEach(System.out::println)
	reduce(BinaryOperator) 
		스트림의 모든 요소를 하나의 결과로 **축소**합니다. **초기값이 없는 경우 사용** 
		stream.reduce((a, b) -> a + b)
	reduce(identity, BinaryOperator) 
		스트림의 모든 요소를 초기값과 함께 하나의 결과로 **축소**합니다. 
		stream.reduce(0, (a, b) -> a + b)
	
	count() 
		스트림의 **총 요소 개수**를 반환합니다. 
		stream.count()
	
	anyMatch(Predicate) 
		하나의 요소라도 조건을 만족하면 true를 반환합니다. 
		stream.anyMatch(n -> n > 0)
	
	allMatch(Predicate) 
		모든 요소가 조건을 만족하면 true를 반환합니다.
		 stream.allMatch(n -> n > 0)
	
	noneMatch(Predicate) 
		모든 요소가 조건을 만족하지 않으면 true를 반환합니다. 
		stream.noneMatch(n -> n > 0)
	
	findFirst() 
		**첫 번째 요소**를 반환합니다(옵셔널). 
		stream.findFirst()
	
	findAny() 
		**임의의 요소**를 반환합니다(병렬 스트림에서 유용).
		stream.findAny()
	
	toArray() 
		스트림을 **배열로 변환**합니다. 
		stream.toArray(String[]::new)