---
type: 생각조각
status: inbox
source: 
creation_date: 2025-07-04
---


## 📜 원본 맥락
![[01_Sources/{S} 스프링 입문 - 코드로 배우는 스프링 부트, 웹 MVC, DB 접근 기술.md#^150704121023]]

---
## 정리
- java에서의 return: 계산결과를 되돌려주는 행위  
	- ->스프림 mvc프레임워크가 다음동작을 결정
- spring Controller에서 return: 
	->이 요청에 대해 후속처리를 하도록 스프링 프레임워크에게 지시를 내리는 명령
	->스프림 mvc프레임워크가 해석

- return 일반 자바: 값을 호출자에게 전달->호출자가 받음
- return 스프링컨트롤러: 뷰이름을 반환->템블릿 엔진이 처리->viewResolver가 받아서 html만들고 응답

---
## 💭 나의 추가적 생각/질문
-