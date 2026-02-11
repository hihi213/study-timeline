---
type: 생각조각
status: inbox
source: 
creation_date: 2025-08-06
---


## 📜 원본 맥락
![](자바스크립트-addEventListener.md#^f2u89m)

---
## 정리
- 
### 1. `addEventListener`를 사용할 때: `'change'`

최신 자바스크립트에서 권장되는 `addEventListener` 메서드를 사용할 때는, 이벤트 이름에 `on`을 붙이지 않은 **'change'** 문자열을 사용합니다.

```JavaScript
// 바닐라 자바스크립트
const myInput = document.getElementById('my-input');

myInput.addEventListener('change', function(e) {
  console.log('값이 변경되었습니다!');
});
```

### 2. HTML 속성이나 DOM 프로퍼티를 사용할 때: `onchange`

HTML 태그에 직접 속성으로 넣거나, DOM 요소 객체의 프로퍼티에 직접 함수를 할당하는 오래된 방식에서는 `on`을 붙인 **`onchange`**를 사용합니다.

```HTML
<input onchange="console.log('값이 변경되었습니다!')">
```

```JavaScript
// DOM 프로퍼티로 사용
myInput.onchange = function(e) {
  console.log('값이 변경되었습니다!');
};
```

### 3. 리액트(React)에서 사용할 때: `onChange`

리액트의 JSX 안에서는 카멜 케이스(camelCase)를 따르는 **`onChange`**를 사용합니다.

```JavaScript
// React
<input onChange={handleChange} />
```

---

### 결론
- **`addEventListener`**: `'change'`
- **HTML 속성 / JS 프로퍼티**: `onchange` (소문자)
- **React JSX**: `onChange` (카멜 케이스)
---
## 💭 나의 추가적 생각/질문
-