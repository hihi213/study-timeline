---
type: 생각조각
status: inbox
source: 
creation_date: 2025-07-04
---


## 📜 원본 맥락
![[01_Sources/{S} 스프링 입문 - 코드로 배우는 스프링 부트, 웹 MVC, DB 접근 기술.md#^150704120105]]

---
## 정리
- **@RequestParam("name") String name에서 각각의 의미:**
- "name": 클라이언트가 보낸 **요청 파라미터의 키 이름**
    - 예: /hello-mvc?name=승현 에서 name=승현
- String name: 이 값을 **자바 메서드의 변수로 저장할 이름** (컨트롤러에서 써먹기위해 저장할 변수이름)

- 작동 문제 없음. 단, 키("name")와 변수(userName)가 달라서 처음엔 헷갈릴 수 있음.


----

## 💭 나의 생각/질문
- 