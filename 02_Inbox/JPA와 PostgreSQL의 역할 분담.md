---
type: 생각조각
status: inbox
source: 
creation_date: 2025-08-14
---


## 📜 원본 맥락
![](../01_Sources/{S}%20졸프-%2010주계획%20상세#^e2xutc)

---
## 정리
개발자는 자바라는 언어에만 집중하고, 복잡하고 귀찮은 SQL 번역은 JPA에게 맡기는 방식입니다.

#### 1. 개발자의 역할: 자바 코드로 지시 내리기

개발자는 `User` 엔티티 클래스를 만들고, `userRepository.save(user)` 와 같은 자바 코드를 작성하여 "이 user 데이터를 저장해줘" 라고 지시만 합니다.

#### 2. JPA의 역할: '자동 번역기'

JPA는 개발자의 `save(user)` 라는 지시를 받아서, 현재 연결된 데이터베이스가 PostgreSQL인 것을 확인하고, PostgreSQL이 알아들을 수 있는 언어인 SQL(`INSERT INTO users ...`)로 **자동으로 번역**하여 전달합니다.

#### 3. PostgreSQL의 역할: '실제 창고'

PostgreSQL은 JPA로부터 번역된 SQL 명령어를 받아서, 실제 물리적인 공간에 데이터를 저장하거나 조회하는 **최종 창고** 역할을 합니다.

---
## 💭 나의 추가적 생각/질문
-