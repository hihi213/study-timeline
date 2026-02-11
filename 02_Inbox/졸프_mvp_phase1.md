---
type: 생각조각
status: inbox
source: 
creation_date: 2025-10-28
---


## 📜 원본 맥락
![[../05_Sources/졸프/최근/졸프 진행#^yo827e]]

---
## 정리
- 요구 정의 재확인: docs/feature-inventory.md, docs/ai-impl/backend.md에서 인증 도메인 요구와 용어 정리하고, 기존 시스템과 경계 검토.
- 도메인/DB 설계 고도화: DormUser, Role, UserSession 값 객체/엔티티 설계 → JPA 매핑과 마이그레이션 스크립트 V1__auth_core_schema.sql 작성 → 시드 R__Seed.sql로 기본 데이터 구성.
- 도메인 서비스 계층: Repository 인터페이스 작성 후 AuthService, JwtTokenService에서 인증·세션·토큰 플로우 구현하고, 도메인 이벤트·에러 시나리오까지 점검.
- 표현 계층: /auth/login, /auth/refresh, /auth/logout, /profile/me 컨트롤러와 DTO(LoginRequest, TokenPairResponse, UserProfileResponse 등) 분리 구현 → 예외 처리/상태 코드 정책 검증.
- 통합 테스트: AuthIntegrationTest를 AbstractPostgresIntegrationTest 기반으로 구성하여 로그인→토큰 재발급→프로필 조회 시나리오와 실패 케이스까지 검증.
- QA 및 문서: 플로우 다이어그램/시퀀스 정리 후 docs/ops/status-board.md 업데이트, 추후 추가 확인 항목(토큰 만료, 동시 로그인 제어 등) 체크리스트화.
---
## 요구요약
- 인증은 거주자, 층별장, 관리자 3역할을 기본으로 하며, 내부인증/세션으로 처리
- 회원가입은 호실+개인번호 조합, 승인전 대기 상태가 기본 플로우
- 로그인은 아이디 대소문자 무시, 세션 유지 7일, 비밀번호 변경시 기존세션 전부 무효화가 필수 정책
- 역할별 접근 권한(거주자=본인 자원, 층별장=층 단위, 관리자=전역)
## 구현 가이드 연결
- 인증 모듈은 modules/auth/{domain, application, presentation, infra} 계층 분리를 전제로 설계해야함
세션/비밀번호 정책
- UTC 필드를 명시하고, 생성 시점 +7일로 고정계산하도록 구현하면 추적이 가능하고, revokedAt를 추가해 수동 무효화 사유를 구분(비밀번호 변경, 강제 로그아웃)
- 세션 검증엣 expiresAt 또는 revokedAt !=null체크로직을 반드시 포함하자
- 비밀번호 변경 시 전체 세션 무효화를 보장하기 위해서 DormUser에 인증자격(비밀번호 등)이 갱신될때마다 숫자를 증가시키는 버전필드, 비밀번호가 마지막으로 바뀐시각을 기록하는 타임스탬프 필드를 도입하고,세션 생성 시점의 값을 UserSession에 함께 저장해 비교하자 이러면 다중노드 환경에도 즉시 무효화가 가능
알림 설정 범위
- 나중에 알림을 본격적으로 구현하므로, 지금은 플래그만 설계, 저장한다

## DOMUSER 구현
- @UUID 전세계 어디서 생성하더라도 거의 겹치지 않는 128비트 고유 식별자
	- java.util.uuid 클래스를 사용해 UUID.radomUUID()로 새 값을 만들고, JPA에서 @Id 필드 타입을 UUID로 두고, @GenaratedValue 전략을 UUID 전용으로 설정해야함
		- 고유하므로 @GenaratedValue는 하나씩 증가하는 IDENTITY가 아니다
- `java.sql.Date` **시간 부분이 전부 잘려나가고** 날짜만 저장한다
	- **올바른 방법:**
    - **`LocalDateTime`**: 날짜와 시간(예: `2025-10-28T20:17:30`)을 모두 저장합니다.
    - **`OffsetDateTime`**: 날짜, 시간 + 타임존(예: `…T20:17:30+09:00`)까지 저장합니다. 글로벌 서비스라면 타임존까지 저장하는 것이 더 좋습니다.

---
## 💭 나의 추가적 생각/질문