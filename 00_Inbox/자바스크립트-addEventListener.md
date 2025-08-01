---
type: 생각조각
status: inbox
source: 
creation_date: 2025-08-01
---


## 📜 원본 맥락
![[01_Sources/{S} 인프런 그린코딩 52시간 풀스택+ Gemini.md#^opa8z9]]

---
## 정리

### .addEventListener('이벤트종류', 실행할함수)
- HTML 요소에 **특정 이벤트가 발생했을 때, 지정한 함수(이벤트 핸들러)를 실행하도록 등록**
	- HTML 요소에서 발생하는 특정 이벤트(클릭, 마우스 오버 등)를 계속 주시하다가, 그  이벤트가 발생하면 약속된 함수(동작)를 실행
- 과거에는 `<button onclick="myFunction()">`처럼 HTML 태그 안에 직접 자바스크립트 코드를 넣어 이벤트를 처리했습니다. 이 방식은 HTML(구조)과 JavaScript(동작)가 뒤섞여 코드를 관리하기 어렵게 만들었습니다.
- 또한, `onclick` 같은 예전 방식은 하나의 이벤트에 **오직 하나의 함수**만 연결할 수 있었지만, `addEventListener`는 **하나의 이벤트에 여러 개의 함수**를 등록할 수 있어 훨씬 더 유연하고 강력합니다.

#### 이벤트의 종류
`addEventListener`에 사용할 수 있는 이벤트의 종류는 수백 가지가 넘기 때문에 모두 나열하기는 어렵습니다. 대신, 가장 중요하고 자주 사용되는 이벤트들을 **종류별로 묶어서** 설명해 드릴게요.

### ## 마우스 이벤트 (Mouse Events) 🖱️

사용자가 마우스를 사용할 때 발생합니다.

- **`click`**: 요소를 클릭했을 때
    
- **`dblclick`**: 요소를 더블 클릭했을 때
    
- **`mousedown`**: 요소 위에서 마우스 버튼을 눌렀을 때
    
- **`mouseup`**: 요소 위에서 마우스 버튼을 뗐을 때
    
- **`mouseover`**: 마우스 포인터가 요소 위로 올라왔을 때
    
- **`mouseout`**: 마우스 포인터가 요소 밖으로 나갔을 때
    
- **`mousemove`**: 마우스 포인터가 요소 위에서 움직일 때
    

---

### ## 키보드 이벤트 (Keyboard Events) ⌨️

사용자가 키보드를 사용할 때 발생합니다.

- **`keydown`**: 키를 누르고 있을 때
    
- **`keyup`**: 키를 뗐을 때
    
- **`keypress`**: 키를 눌러 글자가 입력되었을 때 (최근에는 `keydown` 사용을 권장)
    

---

### ## 폼 이벤트 (Form Events) 📝

`<form>`, `<input>`, `<select>` 등 폼 요소와 관련된 이벤트입니다.

- **`submit`**: `<form>`을 제출할 때
    
- **`change`**: `<input>`, `<select>` 등의 값이 변경되었을 때
    
- **`input`**: 사용자가 `<input>`이나 `<textarea>`에 값을 입력할 때 (실시간)
    
- **`focus`**: 요소가 포커스를 얻었을 때 (예: 텍스트 상자를 클릭)
    
- **`blur`**: 요소가 포커스를 잃었을 때
    

---

### ## 문서/창 이벤트 (Document/Window Events) 📄

브라우저 창이나 문서 전체에 관련된 이벤트입니다.

- **`DOMContentLoaded`**: 브라우저가 HTML을 전부 읽고 DOM 트리를 완성했을 때 (가장 많이 사용)
    
- **`load`**: 이미지, 스크립트 등 모든 리소스가 완전히 로드되었을 때
    
- **`scroll`**: 페이지를 스크롤할 때
    
- **`resize`**: 브라우저 창 크기를 조절할 때
    

---

### ## 참고: addEventListener의 옵션

`addEventListener`는 세 번째 인자로 옵션 객체를 받을 수 있습니다.

JavaScript

```
element.addEventListener('click', myFunction, {
  capture: false, // true면 캡처링 단계에서 이벤트 실행
  once: true,     // true면 이벤트를 한 번만 실행하고 자동 제거
  passive: true   // true면 스크롤 성능 향상에 도움
});
```
---
## 💭 나의 추가적 생각/질문
-