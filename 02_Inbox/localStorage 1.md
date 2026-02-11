---
type: 생각조각
status: inbox
source: 
creation_date: 2025-08-03
---


## 📜 원본 맥락
![]({S}%20인프런%20그린코딩%2052시간%20풀스택+%20Gemini.md#^2h279a)

---
## 정리
### localStorage (브라우저 저장소)

- 웹 브라우저에 `key:value` 형태의 데이터를 저장하는 공간입니다.
    
- **영속성**: `localStorage`에 저장된 데이터는 사용자가 직접 삭제하거나 브라우저의 캐시를 지우지 않는 한, **브라우저를 껐다 켜거나 컴퓨터를 재부팅해도 사라지지 않고** 계속 유지됩니다.

`localStorage`는 웹 브라우저에 데이터를 반영구적으로 저장하는 기능으로, 다음과 같은 주요 메서드(함수)들을 사용합니다.

---

##### `setItem(key, value)`: 데이터 저장하기

**`key`와** **`value`를**  쌍으로 하여 데이터를 저장합니다. `value`는 **반드시 문자열이어야** 하므로, 객체나 배열은 `JSON.stringify()`를 이용해 문자열로 변환한 후 저장해야 합니다.

```JavaScript
localStorage.setItem('username', 'Alice');
localStorage.setItem('user', JSON.stringify({ name: 'Bob', age: 30 }));
```

---

### ## `getItem(key)`: 데이터 불러오기

주어진 **`key`** 에 해당하는 값을 불러옵니다. 저장된 값이 없으면 **`null`** 을 반환합니다. `JSON.stringify()`로 저장된 데이터는 `JSON.parse()`를 이용해 다시 객체나 배열로 변환해야 합니다.

```JavaScript
const username = localStorage.getItem('username'); // "Alice"
const user = JSON.parse(localStorage.getItem('user')); // { name: 'Bob', age: 30 }
```

---

### ## `removeItem(key)`: 특정 데이터 삭제하기

주어진 **`key`**에 해당하는 데이터를 삭제합니다.

```JavaScript
localStorage.removeItem('username');
```

---
### ## `clear()`: 모든 데이터 삭제하기

해당 도메인의 `localStorage`에 저장된 **모든 데이터를 한 번에 삭제**합니다.

```JavaScript
localStorage.clear();
```

---

### ## `key(index)`: 특정 순서의 키(Key) 이름 가져오기

`localStorage`에 저장된 데이터 중 **`index`**(0부터 시작)에 해당하는 키(key)의 이름을 가져옵니다. `for` 반복문과 함께 사용하여 저장된 모든 항목을 순회할 때 유용합니다.

```JavaScript
// localStorage에 저장된 모든 key-value 쌍을 출력
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  const value = localStorage.getItem(key);
  console.log(`${key}: ${value}`);
}
```

---
## 💭 나의 추가적 생각/질문
-