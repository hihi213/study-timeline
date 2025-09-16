---
type: 소스
status: inbox
topics: 
source_url: "{{SOURCE}}"
author: 
creation_date: 2025-09-09
---
# 무제

## 📖 소스 요약 (Summary)
[어노테이션 총정리(GPT)](../00_Inbox/어노테이션%20총정리(GPT).md)
[[00_Inbox/데이터베이스에서의 표현vs 객체에서의 표현.md|데이터베이스에서의 표현vs 객체에서의 표현]]
[[00_Inbox/엔티티 설계시 주의할점.md|엔티티 설계시 주의할점]]
[[00_Inbox/인텔리제이 단축키.md|인텔리제이 단축키]]
- 쓰기와 읽기를 분리하자
	- 커맨드(쓰기) 할때는 엔티티를 반환하지 않고, id만 반환한다 어차피 읽으면 되니까
	- [[00_Inbox/Setter와 Getter구현.md|Setter와 Getter구현]]
- [assertThat(actual).isEqualTo(expected)란](../00_Inbox/assertThat(actual).isEqualTo(expected)란.md)
- [JPA 쓰기,테스트시 =트랜잭션 필수](../00_Inbox/JPA%20쓰기,테스트시%20=트랜잭션%20필수.md)
- [영속성 컨텍스트에서 식별자가 같으면 같은 엔티티로 인식한다](../00_Inbox/영속성%20컨텍스트에서%20식별자가%20같으면%20같은%20엔티티로%20인식한다.md)
- DB
	- 소문자_언더바형식을 사용
	- [임베디드 값타입과 ENUM의 차이](../00_Inbox/임베디드%20값타입과%20ENUM의%20차이.md)
	- [일대일매핑 구현](../00_Inbox/일대일매핑%20구현.md)
	- [상속관계 테이블 구현](../00_Inbox/상속관계%20테이블%20구현.md) ^n7wzoy
	 [주인의 개념](../00_Inbox/주인의%20개념.md) 
	- fk를 꼭 걸어야해여?
		- 실시간 트랙픽이 중요해 정합성보다는 잘 서비스되는게 중요하면 fk 빼고 인덱스만 잡아도 되고
		- 돈과 관련되서 정합성이 매우 중요해서 꼭 맞아떨어져야한다 이거면 fk잡아야함
## 💭 생각의 인큐베이터 (My Thoughts & Connections) 
