---
tags: 소스노트
type:       # book, article, lecture, youtube 등
author: 
year: 
source_url: 
creation_date: 2025-07-01
---
# {S} 스프링 입문 - 코드로 배우는 스프링 부트, 웹 MVC, DB 접근 기술


## 📖 소스 요약 (Summary)
- 이 정보원의 핵심 내용이나 주제를 한두 문장으로 요약합니다.

## ✨ 하이라이트 및 발췌 (Highlights & Excerpts)
> 이 섹션에 PDF++ 등으로 복사한 하이라이트를 붙여넣으세요.


- 스프링  부트  스타터  사이트로  이동해서  스프링  프로젝트  생성** https://start.spring.io 프로젝트  선택 Project:  **Gradle - Groovy** Project Spring Boot:  **3.x.x** Language: Java Packaging: Jar Java: 17  또는  21 Project Metadata groupId: hello artifactId: hello-spring Dependencies: Spring Web, Thymeleaf
  - > 💬 _maven보단 gradle를 쓰는게 요즘 추세  groupid: 기업도메인명 artifactid: 빌드된 결과물(프로젝트명) dependencies: 어떤 라이브러리를 쓸거냐_
  - **출처:** [[01_Sources/스프링 입문 - 코드로 배우는 스프링 부트, 웹 MVC, DB 접근 기술.pdf#page=4]]

- MVC: Model, View, Controlle
  - > 💬 _과거 view에 모든걸 집중했다면 지금은 관심사, 역할과 책임을 분리한 MVC패턴을 따른다. mvc패턴으로 모델, 뷰, 컨트롤로 쪼갰다. 뷰: 화면과 관련된일만, 컨트롤러: 비즈니스 로직, 모델: 화면에 필요한걸 담아서 넘겨줌_

  - **출처:** [[01_Sources/스프링 입문 - 코드로 배우는 스프링 부트, 웹 MVC, DB 접근 기술.pdf#page=15]]

- \<html  xmlns:th="http://www.thymeleaf.org">
  - > 💬 _html를 바꾸는 타임리프라는 템플릿 엔진을 사용한다. 타임리프의 장점: html를 그대로 쓰고 서버없이 열어도 뭔가 껍데기를 볼수있다( JSP는 <\%@ 같은 문법 있어서 열기 불가하다. 그래서 프론트 개발자가 서버 없이 디자인할 때, 파일 열어서 버튼 위치, 구조 미리 확인 가능,	GitHub 같은 데서 .html 템플릿 파일 열어도 깨진 문법 없이 구조가 자연스럽게 보임

  - **출처:** [[01_Sources/스프링 입문 - 코드로 배우는 스프링 부트, 웹 MVC, DB 접근 기술.pdf#page=15]]

- spring-boot-starter-web
  - > 💬 _이안에 톰캣과 스프링웹mvc가 있다는게 핵심_
  - **출처:** [[01_Sources/스프링 입문 - 코드로 배우는 스프링 부트, 웹 MVC, DB 접근 기술.pdf#page=10]]

- spring-boot-starter
  - > 💬 _이 라이브러리로 스프링부트, 스프링 코어, 로깅에 관한게 다 떙겨진다_
  - **출처:** [[01_Sources/스프링 입문 - 코드로 배우는 스프링 부트, 웹 MVC, DB 접근 기술.pdf#page=10]]

- spring-boot
  - > 💬 _스프링코어 자동실행 환경설정_
  - **출처:** [[01_Sources/스프링 입문 - 코드로 배우는 스프링 부트, 웹 MVC, DB 접근 기술.pdf#page=10]]

- 로깅
  - > 💬 _로그기록_
  - **출처:** [[01_Sources/스프링 입문 - 코드로 배우는 스프링 부트, 웹 MVC, DB 접근 기술.pdf#page=10]]

- thymeleaf  템플릿  엔진
  - > 💬 _자바스크립트가 하는 "동적 DOM변경"과는 개념도 다르고 역할도 다르다 
  - 루프, 조건문 등으로 HTML을 서버에서 만들어서 완성된 페이지를 클라이언트에 내려주는 역할 
  - 사용자가 웹페이지를 요청 →스프링 컨트롤러가 데이터를 준비 → Thymeleaf가 그 데이터를 HTML에 채워 넣음 → 완성된 HTML을 브라우저로 보냄_

  - **출처:** [[01_Sources/스프링 입문 - 코드로 배우는 스프링 부트, 웹 MVC, DB 접근 기술.pdf#page=11]]

- [[02_Notes/java와 스프링컨트롤러에서의 return의 차이]]
	java에서의 return: 계산결과를 되돌려주는 행위  ->스프림 mvc프레임워크가 다음동작을 결정
	spring Controller에서 return: 
	->이 요청에 대해 후속처리를 하도록 스프링 프레임워크에게 지시를 내리는 명령
	->스프림 mvc프레임워크가 해석
	
	return 일반 자바: 값을 호출자에게 전달->호출자가 받음
	Return 스프링컨트롤러: 뷰이름을 반환->템블릿 엔진이 처리->viewResolver가 받아서 html만들고 응답

- 참고:  `spring-boot-devtools` 라이브러리를  추가하면,  `html` 파일을  컴파일만  해주면  서버  재시작 없이  View  파일  변경이  가능하다. 인텔리J  컴파일  방법:  메뉴  build  Recompile
  - > 💬 _한번만 읽어야 빠르고 안전한, 애초에 고정된 로직인, 읽는시점이 시작시점인 빈(java클래스)와 달리 자주바뀌는 view는 요청올때마다 매번 파일을 다시읽어 랜더링 하기 때문에 서버 재시작없이 view 파일 변경이 가능_
  - **출처:** [[01_Sources/스프링 입문 - 코드로 배우는 스프링 부트, 웹 MVC, DB 접근 기술.pdf#page=12]]

- java  -jar  hello-spring-0.0.1-SNAPSHOT.jar
  - > 💬 _만들어진 Jar파일을 실제로 실행하는 명령어_
  - **출처:** [[01_Sources/스프링 입문 - 코드로 배우는 스프링 부트, 웹 MVC, DB 접근 기술.pdf#page=12]]


- {{text}}
  - {{`${comment && comment.trim() !== "" ? `> 💬 _${comment}_` : ''}`}}
  - **출처:** {{linkToPage}}

- {{text}}
  - {{`${comment && comment.trim() !== "" ? `> 💬 ${comment.replace(/\n/g, '  ')}`  : ''}`}}
  - **출처:** {{linkToPage}}

- {{text}}
  - {{`${comment && comment.trim() !== "" ? `> 💬 ${comment.replace(/\n/g, '  \n')}`  : ''}`}}
  - **출처:** {{linkToPage}}
- java  -jar  hello-spring-0.0.1-SNAPSHOT.jar
  - `$만들어진 Jar파일을 실제로 실행하는 명령어 인텔리제이에서 실행하는 것과의 차이:  개발중 실행/디버깅용, .jar안만들고, 클래스만 실행 즉 ide 내부에서 클래스 컴파일+ 메모리에서 바로실행(빠름).replace(/\n/g, '\n> ')`
  - **출처:** [[01_Sources/스프링 입문 - 코드로 배우는 스프링 부트, 웹 MVC, DB 접근 기술.pdf#page=12]]
---
## 💡 전체적인 나의 생각 (Overall Thoughts)
- 이 정보원을 전체적으로 읽고 난 후의 생각이나 비판, 연결되는 아이디어 등을 자유롭게 기록합니다.