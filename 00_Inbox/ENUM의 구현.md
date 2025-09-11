---
type: 생각조각
status: inbox
source: 
creation_date: 2025-09-10
---


## 📜 원본 맥락
![](임베디드%20값타입과%20ENUM의%20차이.md#^64ca56)

---
## 정리
- @Enumerated(EnumType.STRING): Emum 필드 사용시 사용
	- (EnumType.STRING): 문자열 ENUM임
	- (EnumType.ORDINAL): 숫자 ENUM임, 기본값
		- 중간에 다른상태 넣을때 큰일남 밀림
		- 오디널 절대쓰지말고 스트링 사용하기.

---
## 💭 나의 추가적 생각/질문
-