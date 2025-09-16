---
type: 생각조각
status: inbox
source:
creation_date: 2025-09-09
---

## 📜 원본 맥락
![](../01_Sources/{S}%20김영한%20응용.md#^ar2qgy)

---
## 정리

트랜잭션 = “하나의 작업 단위”를 묶어서 전부 반영(Commit) 또는 전부 취소(Rollback) 하는 장치입니다.

- ## @Transactional이 “왜” 필요한가 (테스트에서)
	- JPA는 쓰기 시 트랜잭션 필수: persist/merge/remove는 활성 트랜잭션이 없으면 TransactionRequiredException이 납니다.
	- 테스트 격리/자동 롤백: 테스트 메서드에 @Transactional을 붙이면 시작~끝까지 하나의 트랜잭션으로 돌고, 끝나면 자동 롤백되어 DB가 깨끗하게 유지됩니다. (테스트 간 간섭 방지)
	- 일관된 1차 캐시(Persistence Context): 하나의 트랜잭션 내에서 persist() 후 find() 하면 같은 PC(1차 캐시) 를 공유하므로 예측 가능한 동작을 합니다.
- ## 반대로 없으면
	- 쓰기 시점에 트랜잭션이 없어 예외가 나거나,
	- DB 자동커밋/플러시 타이밍에 의존하는 비표준/불안정 동작으로 테스트가 깨지기 쉽습니다.
	- 남은 데이터가 다른 테스트에 영향을 줄 수 있어요.
---
- ## 어떤 @Transactional을 써야 해?
	- 권장: org.springframework.transaction.annotation.Transactional (스프링 제공)
	- 스프링 테스트가 각 테스트마다 트랜잭션 시작/롤백을 확실히 관리합니다.
	- jakarta.transaction.Transactional(JTA)도 동작하긴 하지만, 스프링 테스트 관례/기능은 스프링 어노테이션 기준으로 문서화되어 있어 테스트에선 스프링 버전을 추천합니다.
- ## 팁
	- “정말 DB에 써졌는지”까지 확인하고 싶으면 중간에
	entityManager.flush(); entityManager.clear(); 를 호출해서 1차 캐시를 비운 뒤 재조회하세요.
	- 리포지토리만 빠르게 검증하고 싶다면 @DataJpaTest가 더 가볍고, 테스트마다 자동 롤백 됩니다.

## 한 줄 정리
- JPA 쓰기 = 트랜잭션 필수, 테스트 청결 = 자동 롤백 필수 → 테스트에는 @Transactional(스프링 버전) 붙이는 게 정석입니다.

## 💭 나의 추가적 생각/질문
-