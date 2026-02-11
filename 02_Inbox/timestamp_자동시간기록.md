---
type: 생각조각
status: inbox
source: 
creation_date: 2025-10-24
---


## 📜 원본 맥락
![[../06_Output/졸프(정리하고 삭제예정/졸프에서 배운것#^n8o334]]

---
## 정리
생긴 이유
- 개발자가 데이터를 저장할때마다 'createdAt = new Date()', 'updadeBy="user_uuid'같은 코드를 매번넣는것은 번거롭고 실수하기 쉽다.
- 자동화를 하자
### 자동시간기록(Timestamp)-언제
> 모든 테이블에 필드를 자동으로 넣고 싶다
- 공통 필드 템플릿을 만들자
	- 엔티티가 개별적으로 created At 등의 필드를 가지지 말고, 공통된 '부모 템플릿'을 하나 만들어 상속시켜 유지보수성을 높이자
	- 이 탬플릿은 테이블이아닌, 설계도 역할이다
	- @MappedSuperclass : 나를 상속받는 자식들은 이 필드를 가져라
		- 추상클래스의 구현으로 상속받게 하면 자바 관점에서는 완벽하지만, JPA는 '부트시점'에 '3가지의 대상'만 스캔해 필드와 컬럼매핑 메타 데이터를 만든다 이때의 3가지 대상은 다음과 같다
			1. @Entity
			2. @MappedSuperclass
			3. @Embeddable
		- 그냥 추상클래스는 자바레벨에선 필드가 상속되어 '존재'는 하지만 JPA의 메타데이터 테이블에 등록되지 않으니 컬럼이 생성/바인딩되지 않는다
		- 왜? : JPA가 상속받은 모든 부모 클래스의 필드를 무조건 DB 컬럼으로 만든다면, DB와 전혀 상관없는 부모 클래스의 필드까지 테이블에 생성하려고 해서 엉망 그래서 어노테이션을 붙여주는걸 매핑해줘 구현.

---
## 💭 나의 추가적 생각/질문


**Iteration 1 – AUTH-01 상세 기능 계획 (Skeleton → 구현 → 검토 사이클 전제)**

- **공통 인프라**
    - AbstractTimestampedEntity: @MappedSuperclass, @EntityListeners, @CreatedDate/@LastModifiedDate 주석·필드 구조만 Skeleton.
    - DormmateAuditorAware: SecurityContext에서 DormUser UUID 추출 흐름, SYSTEM UUID 폴백 TODO.
    - JpaConfig: @EnableJpaAuditing(auditorAwareRef="auditorAware"), AuditorAware Bean 정의 Skeleton.
    - 테스트 환경 메모: Postgres Testcontainers, JWT 시크릿/PasswordEncoder 설정 TODO.
- **기능 1. 회원가입 요청 제출**
    - 엔터티 Skeleton: SignupRequest, Room (호실 정보 활용), SignupStatus.
    - Repository Skeleton: SignupRequestRepository (pending 조회, 중복 검사 메서드 TODO).
    - DTO/Controller Skeleton: SignupRequestController (요청/대기 목록 API 주석), 입력 검증 TODO.
    - Service Skeleton: 중복 검사, 저장, 타 시스템 핸드오프 TODO.
    - 테스트 Skeleton: valid/duplicate, 권한 없는 접근 시나리오 TODO.
    - 문서 TODO: docs/mvp-log.md에 테스트 케이스/시나리오 항목 추가.
- **기능 2. 관리자 승인/반려**
    - 엔터티 Skeleton 보강: DormUser, RoomAssignment (승인 시 즉시 배정 로직 TODO).
    - Service Skeleton: 승인 플로우(상태 전환, DormUser 생성, RoomAssignment 기록), 반려 플로우(로그/결과 저장), 감사 로그 TODO.
    - Controller Skeleton: 승인/반려 API, 관리자 권한 체크 주석.
    - Repository Skeleton: DormUserRepository, RoomAssignmentRepository, 쿼리 메서드 TODO.
    - 테스트 Skeleton: 승인 전 접근 제한, 승인/반려 결과 검증, 감사 기록 여부 TODO.
- **기능 3. 로그인 & 세션 관리**
    - 엔터티 Skeleton: UserSession, DormUserStatus.
    - Service Skeleton: 로그인(비밀번호 비교, JWT 발급, 세션 저장), 토큰 재발급, 로그아웃(세션 무효화) TODO.
    - Security Skeleton: JWT 필터, AuthenticationProvider, PasswordEncoder 주석.
    - Controller Skeleton: 로그인/재발급/로그아웃 엔드포인트.
    - 테스트 Skeleton: 올바른 자격 증명/오류 케이스, 세션 만료 시나리오 TODO.
- **기능 4. 역할 부여/해제 & 접근 제어**
    - 엔터티 Skeleton: Role, UserRole.
    - Service Skeleton: 역할 부여/해제, 활성 역할 중복 방지, grantedBy 처리 TODO.
    - Security Skeleton: 역할 기반 권한 체크, 관리자/층별장 구분 주석.
    - Controller/Admin API Skeleton: 역할 조회/변경, 최소 UI 요구사항 TODO.
    - 테스트 Skeleton: 역할 부여/해제 흐름, 동시 세션 권한 갱신 TODO.
- **기능 5. 계정 비활성화(탈퇴)**
    - DormUser Skeleton에 deactivated_at, 상태 전환 TODO.
    - Service Skeleton: 탈퇴 시 세션/역할 정리, 데이터 보존 정책 주석.
    - Controller Skeleton: 탈퇴 요청 엔드포인트(본인/관리자 구분).
    - 테스트 Skeleton: 탈퇴 후 로그인 불가, 히스토리 보존 확인 TODO.
- **기능 6. 문서·로그·테스트 계획 관리**
    - docs/mvp-log.md: 각 기능별 Confirm/Plan/Execute/Verify 항목 업데이트 Skeleton.
    - OpenAPI Skeleton: AUTH-01 관련 엔드포인트 주석, 스키마 TODO.
    - 테스트 목록 정리: 단위@Test 클래스, 인수 테스트 템플릿.
    - CI TODO: Flyway migrate + 테스트 단계, Render 배포 체크리스트 메모.

**Iteration 2 – FRIDGE-02 상세 계획 (Skeleton → 사용자 구현 → 검토 사이클 전제)**  
_목표: 냉장고 포장/물품 CRUD, 칸 용량 검증, 미등록 물품 처리까지 MVP 수준으로 마무리._

---

**공통 기반**

- 인프라: Spring Boot + Spring Data JPA, Flyway V2__fridge_core.sql 마이그레이션 준비.
- 문서: docs/data-model.md §4.2, docs/feature-inventory.md §2 참고; Skeleton 작성 시 근거 주석 포함.
- 테스트: Postgres Testcontainers, JUnit5 + Spring Boot Test, MockMvc/RestAssured 권장.

---

**기능 1. 냉장고 리소스 관리**

1. 엔터티 Skeleton
    - fridge_unit, fridge_compartment, compartment_room_access
    - 컬럼(칸 방문능력, 상태, 용량), 관계(@OneToMany 등) TODO.
2. Repository Skeleton
    - 칸 조회, 층별 호실 매핑 검증 쿼리 메서드 TODO.
3. 관리자 서비스 Skeleton
    - 냉장고 증설/재배치 로직, max_bundle_count 계산 TODO.
4. 관리자 API Skeleton
    - 자원 조회/증설/칸 재배치 endpoint 주석.
5. 테스트 Skeleton
    - 증설 시 재배치, 호실-칸 매핑 정합성 확인 시나리오 TODO.

---

**기능 2. 포장(FridgeBundle) & 물품(FridgeItem) 등록/조회/수정/삭제**

1. 엔터티 Skeleton
    - fridge_bundle, fridge_item (라벨 코드, 임박/만료 플래그, soft delete) TODO.
2. DTO & Mapper Skeleton
    - 등록/수정/조회 응답 구조, 검증 애노테이션 TODO.
3. Service Skeleton
    - 포장 등록(칸 용량/라벨 할당), 수정(포장명, 메모), 삭제(soft), 물품 CRUD 로직.
    - 물품 수정 시 검사 이후 플래그 관리 TODO.
4. Controller Skeleton
    - /fridge/bundles REST API 구조, 인증/권한 검증 TODO.
5. 테스트 Skeleton
    - 칸 용량 초과, 라벨 중복, 권한 위반(403) 시나리오.

---

**기능 3. 조회/필터링/검색 UX**

1. Service Skeleton
    - 최신순 목록, D-3 임박/만료 필터, 이름/라벨 검색 TODO.
2. Controller Skeleton
    - Query 파라미터(필터, 검색) 처리 주석.
3. DTO Skeleton
    - 목록 응답, 임박/만료 배지 표현 TODO.
4. 테스트 Skeleton
    - 임박/만료 계산, 검색 정확도, 페이지네이션 케이스.

---

**기능 4. 미등록 물품 처리 & 검사 연계**

1. 엔터티 Skeleton
    - unregistered_item_event (미등록 물품 기록) TODO.
2. Service Skeleton
    - 검사자가 미등록 물품 등록+폐기 처리, 통계용 저장 TODO.
3. Controller Skeleton
    - 층별장 API, SSE 연동 TODO.
4. 테스트 Skeleton
    - 즉시 폐기 로직, 알림 제외 확인.

---

**기능 5. 검사와 포장 잠금 동기화**

1. Service Skeleton
    - 검사 시작 시 칸 잠금, 검사 종료 시 해제, SSE 전송 TODO.
2. 엔터티 Skeleton
    - inspection_session, inspection_participant (Iteration3 준비, 현재는 TODO).
3. Controller Skeleton
    - “검사 중” 상태 반환 API, 합류/종료 시나리오 주석.
4. 테스트 Skeleton
    - 동시 검사 시 잠금 상태, 소유자 접근 제한 확인.

---

**기능 6. 알림/배치 시드 (FRIDGE-02 관점)**

1. 알림 배치 Skeleton
    - 매일 09:00 D-3 임박/만료 알림 생성 TODO (NOTI-01과 연계).
2. Notification 엔터티 TODO
    - notification.kind=FRIDGE_EXPIRY/EXPIRED, dedupe 키 정책 주석.
3. 테스트 Skeleton
    - 임박/만료 알림 중복 방지 로직 검증.

---

**테스트 & 문서관리**

- docs/mvp-log.md: 기능별 Confirm/Plan/Execute/Verify Skeleton 업데이트.
- docs/data-model.md: 냉장고 엔터티 확정 시 컬럼 표/관계도 갱신 TODO.
- OpenAPI Skeleton: 포장/물품 API 엔드포인트 정의, 예시 응답 TODO.
- CI 파이프라인: Flyway V2, 테스트, Lint 단계 주석.
- Render/인프라 TODO: 환경변수, 스케줄드 작업 설정 메모.
.

**Iteration 3 – 검사 & 알림 (NOTI-01) 상세 계획**

- **공통 환경 정비**
    - Flyway V3__inspection_notification.sql 스키마 초안(Skeleton): inspection_session, inspection_participant, inspection_action, notification, notification_preference, notification_dispatch_log, 필요 시 notification_policy 보강.
    - Spring Boot 3.x, Spring Data JPA, Spring Security(역할 체크), Spring WebFlux/SSE, Spring Scheduling 기반.
    - 비동기/이벤트 처리용으로 Spring ApplicationEvent 또는 Kafka 등 외부 의존성 없이 우선 ApplicationEvent + 비동기 실행 전략 주석화.
    - 테스트 전략: Testcontainers(Postgres), MockMvc + WebTestClient(SSE), @SpringBootTest + @Sql.
- **기능 1. 검사 세션 관리**
    - 엔터티 Skeleton
        - inspection_session: 세션 ID, 층/칸, 상태(IN_PROGRESS, COMPLETED, CANCELLED), 시작/종료 시각, 잠금 여부.
        - inspection_participant: 세션-검사자 매핑, 조인 시각, 역할(주검사/보조) 등.
    - Repository Skeleton: 세션 상태 조회, 현재 진행 중 세션 검색, 층별 필터 쿼리 TODO.
    - Service Skeleton
        - 세션 시작: 권한(층별장) 확인, 칸 잠금, SSE 채널 등록 TODO.
        - 세션 합류: 동시 검사 최대 2명 제한, 참여자 기록 TODO.
        - 세션 종료/취소: 조치 내역 검증 후 종료, 잠금 해제, 히스토리 저장 TODO.
    - Controller Skeleton
        - /inspections/sessions REST + SSE 엔드포인트, 권한 체크(FLOOR_MANAGER).
        - SSE 연결 실패 시 폴백 API 주석.
    - 테스트 Skeleton
        - 세션 시작/합류/중복 검사, 잠금 상태 검증, 권한 없는 사용자 접근 차단.
- **기능 2. 검사 조치 기록**
    - 엔터티 Skeleton
        - inspection_action: 조치 대상(포장/물품), 사유 코드(WARN_INFO_MISMATCH, WARN_STORAGE_POOR, DISPOSE_EXPIRED, UNREGISTERED_ITEM, OTHER), free_note, 처리자, 타임스탬프.
        - 필요 시 inspection_action_item으로 물품별 상세 저장.
    - Service Skeleton
        - 조치 수행 API: 경고/폐기/통과/미등록 처리 로직, free_note 요구 조건 TODO.
        - “검사 전” → “검사 완료” 탭 이동, SSE 전파 로직 주석.
        - 제출 조건(검사 전 목록 비어야 제출) 검증, 통계 집계 TODO.
    - Controller Skeleton
        - 조치 등록/수정/취소 API, SSE 브로드캐스트 TODO.
        - 제출 API: 조치 요약 반환, 알림 트리거 TODO.
    - 테스트 Skeleton
        - 조치 유형별 흐름, 미등록 물품 등록 후 폐기, 제출 조건 검증.
- **기능 3. 알림 도메인 구현**
    - 엔터티 Skeleton
        - notification: 수신자, kind(FRIDGE_EXPIRY, FRIDGE_EXPIRED, FRIDGE_RESULT 등), dedupe_key, ttl_at, read_at.
        - notification_preference: 사용자별 kind별 on/off, 백그라운드 허용.
        - notification_dispatch_log: 알림 전송 상태(성공/실패), 재시도 TODO.
        - notification_policy: kind별 TTL/일일 최대치/기본 허용 状態.
    - Repository Skeleton: dedupe 조회, 미읽음 목록, 정책 조회 메서드 TODO.
- **기능 4. 알림 발송 서비스**
    - Service Skeleton
        - 즉시 알림(검사 제출): 대상 사용자 탐색(경고/폐기 받은 거주자), dedupe 적용, dispatch 로그 기록 TODO.
        - 배치 알림(임박/만료): 매일 09:00 스케줄러, dedupe & TTL 정책 준수, 하루 1회 제한 TODO.
        - 읽음/만료 처리: 유효 기간 24시간 후 자동 만료, 하단 탭 진입 시 읽음 처리 로직 주석.
    - 배치/Scheduler Skeleton
        - Spring @Scheduled 주석, Render Cron 대비 환경변수 설명.
        - 테스트/드라이런 옵션 TODO.
- **기능 5. 알림 설정 & UX**
    - Controller Skeleton
        - /notifications 목록 조회(필터: 미읽음/읽음), 읽음 처리 API.
        - /notification-preferences 온/오프/백그라운드 설정 저장 API.
        - NotificationSettingService Skeleton: 기본값 로드, 정책과 사용자 설정 병합 로직 TODO.
    - DTO Skeleton: 알림 카드(제목, 본문, 배지 정보), 설정 저장/조회 구조.
    - 테스트 Skeleton
        - 읽음 처리, 설정 토글, 배지 감소 확인.
- **기능 6. SSE/실시간 동기화 인프라**
    - 공통 SSE Helper Skeleton: Emitter 관리, 타임아웃 처리, 재연결 시 상태 동기화.
    - 검사 전용 SSE 채널: 조치 이벤트, 참가자 변경, 세션 종료 브로드캐스트.
    - 테스트 Skeleton: SSE 연결, 이벤트 수신 검증, 타임아웃/재연결 시나리오.
- **기능 7. 관리자/통계**
    - 알림/검사 통계 Service Skeleton: 경고/폐기 건수, 알림 발송 성공률, 재시도 TODO.
    - Controller Skeleton: 관리자 대시보드 API(기간/층 필터), CSV/리포트 TODO.
    - 테스트 Skeleton: 통계 계산 정확성, 권한 검증.
- **테스트 & 문서 관리**
    - docs/mvp-log.md: 기능별 Confirm-Plan-Execute-Verify 주석 추가.
    - docs/data-model.md §4.3 업데이트 Skeleton: 검사/알림 엔터티 컬럼, 관계도 수정.
    - OpenAPI Skeleton: 검사/알림 API 명세 초안.
    - CI TODO: Flyway V3, 배치 테스트, SSE 통합 테스트 포함.
    - Render 배포 준비: Cron Job 설정, SSE 지원 여부 체크, 환경변수/시크릿 TODO.

이 계획에 따라 Skeleton → 사용자 구현 → 검토를 반복하면, Iteration 3의 검사·알림 모듈(NOTI-01)을 체계적으로 완성할 수 있습니다.
