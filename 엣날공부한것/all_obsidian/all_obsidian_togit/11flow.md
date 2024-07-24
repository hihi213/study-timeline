11장의 흐름은 다음과 
	1.  컬렉션 프레임웍이란 
		- 컬렉션 클래스 : 여러 객체(데이터)를 모아놓은 클래스 
		- 프레임웍 :다양한 컬렉션 클래스들을 표준화된 프로그래밍 방식으로 다루는것
	2. 컬렉션 클래스에는 크게 3가지 타입이 존재한다
		 그래서 3개의 인터페이스를 정의
	3. 그 3개의 인터페이스가 list set map 이다
		list: 순서가 있는 데이터의 집합
			데이터의 중복을 허용함
		set: 순서를 유지하지 않는 데이터들의 집합
			데이터들의 중복을 허용하지 않는다
		map:key와 value의 쌍으로 묶어서 저장하는 컬렉션 클래스를 구현하는데 사용됨
			 순서는 유지되지 않으며 
			 key는 중복을 허용하지 않고,
			 value는 중복을 허용한다.
	4. 데이터 저장방식의 공통점으로 list set인터페이스가 collection 인터페이스로 묶인다 .
	5. 아무튼 이를 구현한, 구현한 인터페이스의 성격을 가지고 있는 컬렉션 클래스들을 살펴보면,
			list:	ArrayList LinkedList Vector Stack 클래스 Queue 인터페이스
			set: Hashset LinkedHashSet TreeSet 클래스
			map:  HashMap Properties LinkedHashMap TreeMap 클래스
6.  Vector클래스, 보완한게 [[ArrayList_class]] 이걸 보완한게 [[LinkedList_class]]  그리고 LinkedLIst가 list말고도 구현한  [[Queue_interface]] 와 vector를 상속받은 [[Stack_class]]
1. [[Hashset_class]] , [[LinkedHashSet_class]], [[TreeSet_class]]
2. [[HashMap_class]] , [[Properties_class]] , [[LinkedHashMap_class]] , [[TreeMap_class]]
3. 그리고 이 모든 클래스에 적용가능한 있는거 다 뱉어 [[Iterator_class]]
4. comparator와 comparable이다.
5. 이제 [[vs]]를 들면



	*******arrays의 list,set,map위치를 찾고 6.1*****