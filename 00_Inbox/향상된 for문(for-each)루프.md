---
type: 생각조각
status: inbox
source: 
creation_date: 2025-09-23
---

## 📜 원본 맥락

![](../01_Sources/{S}%20김영한%20응용.md#^4h4frx)

---
## 정리

- **문법 설탕**: 배열이나 Iterable 컬렉션을 편하게 순회하는 문법.
- 내부적으로 **배열이면 인덱스 for**, **컬렉션이면 Iterator**를 쓰도록 컴파일됩니다.

```java
for (타입 변수명 : 배열또는컬렉션) {
    // 요소를 읽어 쓰는 코드
}
```

## **기본 예시**

```java
int[] nums = {1, 2, 3};
for (int n : nums) {
    System.out.println(n);
}

List<String> names = List.of("A", "B");
for (String name : names) {
    System.out.println(name);
}
```

## **장점**

- **간결**하고 **안전**(인덱스 실수/Iterator 보일러플레이트 없음)
- break / continue 사용 가능

## **주의점(제한)**

1. **인덱스가 필요하면 부적합**
    
    - 인덱스를 써야 하면 전통 for 사용:

```java
for (int i = 0; i < list.size(); i++) { ... }
```
    
2. **요소 제거/삽입 불가**
    
    - 순회 중 삭제는 Iterator 사용:

```java
for (Iterator<String> it = list.iterator(); it.hasNext(); ) {
    if (조건) it.remove(); // OK
}
// 또는 사전/사후 처리로 list.removeIf(조건) 사용
```
    
3. **요소 재할당은 컬렉션/배열에 반영 안 됨**
    
    - 아래 코드는 리스트의 원소를 바꾸지 못함(로컬 변수 재할당일 뿐):

```java
for (Point p : points) { p = new Point(0,0); } // 원소 교체 X
```

3. - 객체의 **내부 상태 변경**은 가능:

```java
for (Point p : points) { p.setX(0); } // OK
```
    
4. **Map은 entry로 도는 게 정석**

```java
for (Map.Entry<K,V> e : map.entrySet()) {
    K k = e.getKey(); V v = e.getValue();
}
// 키만/값만: map.keySet(), map.values()
```
    
5. **컬렉션이 null이면 NPE**
    
    - 방지: for (T t : Objects.requireNonNullElse(list, List.of())) { ... }

## **성능**

- 일반적으로 **전통 for와 동급**. 가독성 때문에 for-each 선호, 인덱스나 변경이 필요할 때만 다른 방식 사용.

# **요약 치트시트**

- **읽기 전용 순회**: for-each 최고.
- **인덱스 필요 / 원소 교체 / 중간 삭제**: 전통 for 또는 Iterator/ListIterator.
- **Map**: entrySet()로 for-each.

---
## 💭 나의 추가적 생각/질문