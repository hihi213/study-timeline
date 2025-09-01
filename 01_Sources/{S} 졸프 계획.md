---
type: 소스
status: inbox
topics: 
source_url: "{{SOURCE}}"
author: 
creation_date: 2025-09-01
---
1. 10주간은 연습용으로, 작동+증빙에만 집중해 배포가능한 mvp를 만든다
2. 그후 **하드닝/리팩터링 스프린트**로 품질을 끌어오른다


# A. 10주 MVP로 “실제로 되는 것” (실시간 = **SSE**)

## 1) 인증·권한

* 로그인(JWT) / `/me`
* RBAC: `ADMIN / INSPECTOR / USER` 역할 가드
* 기본 보안: CORS 허용 도메인, 보안 헤더, 단순 브루트포스 쿨다운

## 2) 냉장고(칸 단위 자원) · 물품

* 자원 조회: `FRIDGE_COMP`(예: 냉장1/냉동1)
* 물품 등록/조회/검색

  * 라벨 번호(`label_no`) 자동/수동, **활성 상태에서 (칸, 번호) 유일**
  * 전량 제거 후 동일 번호 **재사용** 가능
* 물품 변경

  * `:adjust`(수량/유통기한/메모), `:remove-all`(전량 제거)

## 3) 검사(Inspection) — **2인 세션 + 단일 제출**

* 세션: 열기/참여/나가기, **동일 칸 진행 세션 1건** 제한
* 검사 중 해당 칸에 일반 사용자 쓰기 요청 시 **423 Locked**
* 조치 기록: `PASS / WARNING / DISCARD / DISCARD_WITH_PENALTY`

  * **NO\_STICKER**일 때만 `bundle_id` 없이 폐기 가능(미등록 물품)
* **제출은 1회(멱등)**, 제출 후 결과 **INSERT/DELETE 금지**, UPDATE 시 **리비전 기록 + 버전 증가**

## 4) 벌점

* 제출 시 **원본 벌점** 자동 생성(UPDATE/DELETE 차단)
* **조정 벌점**(+/-, 사유 필수)로 합산
* `v_penalties_totals` 집계: `원본 + Σ조정 = 최종점수`

## 5) 실시간(**SSE**)

* 클라: `EventSource` 기반 실시간 반영, **자동 재연결 + Last-Event-ID**
* 대표 이벤트(예):

  * `items.created/updated/removed`
  * `inspection.opened/joined/left/locked/action_recorded/submitted`
  * (선택) `penalties.adjusted`
* 프록시/서버 튜닝: `proxy_buffering off`, 하트비트(`:\n`), 충분한 `read_timeout`

## 6) 운영·품질

* `/healthz`, `/readyz`
* 구조화 로그(JSON) + `correlation_id`
* OpenAPI 스냅샷/계약 테스트, E2E(SSE 포함)
* 충돌/경합 응답 표준화: `409/422/423`
* 성능 목표 샘플 부하 p95 < 300ms
* 간단 멱등: 작성계 API `Idempotency-Key` 수용(Week 9)

## 7) DB 무결성(핵심 제약)

* `item_bundles`: **(resource\_id, label\_no) 활성 유니크**
* `inspection_sessions`: **자원당 진행 1건**
* `inspection_participants`: **세션당 최대 2명**
* 제출 후 결과 불변(INSERT/DELETE 금지, UPDATE는 리비전)
* `resource_locks`: 423 근거용 논리락(자원당 1개)

## 8) MVP에서 의도적 제외(다음 단계로 이관)

* 알림 파이프라인(Outbox/DueTasks/DomainEvents)
* 세탁/스터디룸/도서관 예약·사용 공통(Allocations)
* Floors/Rooms/Zones/Stays(세밀 권한/거주)
* append-only `activity_logs`, 정식 `idempotency_store`
* PWA 오프라인/푸시(백그라운드 알림)

---

# B. 10주 이후 **확장 기능** (포그라운드=**SSE 유지**, 백그라운드=**PWA + FCM(Web Push)**)

## R1 — 하드닝①

* `idempotency_store` 테이블(요청해시/응답스냅샷/TTL)
* 429/409/423 에러 메시지 표준화
* SSE 커넥션/FD 모니터링(간단 대시보드)

## R2 — 알림 파이프라인

* `outbox / due_tasks / domain_events` 도입
* 워커(READY→SENT, 재시도/백오프, 멱등키)
* 알림 센터(헤더 배지/목록, 딥링크), **유통기한 D-1** 알림(로그/배지)

## R3 — **PWA + Web Push(FCM/VAPID)**

* Service Worker 등록, 구독 저장/해지 API
* 서버: VAPID 키/FCM 전송 경로 모두 지원
* 포그라운드=**SSE**, 백그라운드=**Web Push**(iOS는 홈화면 추가 조건)
* 구독 만료/정리, 권한 프롬프트 UX

## R4 — 세탁실 ①(기본 사용)

* `resources`에 `WASHER/DRYER` 추가
* `allocations(USAGE)`로 시작/완료, **시간 겹침 금지**
* 대시보드 진행바

## R5 — 세탁실 ②(현장 이슈)

* **미등록 사용** 등록 → 경과 시 자동 `AVAILABLE`
* **종료 5분 전 알림**(DueTask)
* **고장 신고** → `OUT_OF_SERVICE`(사용 차단)

## R6 — 스터디룸 ①(예약)

* `STUDYROOM` 자원 + **10분 슬롯 예약/취소**
* 매주 월요일 09:00 오픈(슬롯 생성)
* 타임라인 뷰

## R7 — 스터디룸 ②(운영)

* **합석 플래그**, **관리자 강제예약**, 블록 휴무

## R8 — 도서관 ①

* `BOOK` 자원 + 대출/반납/연장/예약
* 반납 D-3 알림, **연체 벌점 원본** 자동 적재

## R9 — 권한 확장

* `floors / dorm_rooms / zones / user_zone_assignments / stays`
* **층/존 기반 권한**으로 검사·자원 접근 제어

## R10 — 관측·보안·PWA 폴리싱

* `activity_logs`(append-only) + 간단 운영 대시보드
* 토큰 버전 무효화, **JWKS 키 회전**
* PWA 오프라인 캐시(핵심 화면), 설치 프로프트

---

## 최종 사용자/운영자 경험 스냅샷

* **입주자**
  MVP: 로그인 → 냉장고 물품 등록/조회/관리(실시간 SSE 반영) → 검사 결과/벌점 확인
  확장: 세탁 사용/알림, 스터디룸 예약, 도서 대출/반납/알림, 푸시 딥링크

* **검사자(층별장)**
  MVP: 칸별 검사 세션(동시 2인) → 조치 → 단일 제출(사유 포함 수정 이력)
  확장: 권역(층/존) 범위 내 관리, 알림 파이프라인 연계

* **관리자**
  MVP: 자원/락 관리, 벌점 조정
  확장: 고장/휴무 운영, 강제예약, 알림/작업 모니터링, 감사로그/대시보드

---

# ✅ 10주 MVP 체크리스트 (실시간 = **SSE**)

## 공통 범위/원칙

* [ ] **실시간 채널은 SSE만** 사용(폴링/웹소켓 없음)
* [ ] 서버/DB UTC 저장, 클라이언트 KST 표시
* [ ] API 계약(OpenAPI) 스냅샷 테스트 유지
* [ ] 충돌/경합 응답 표준화: `409/422/423`

## 지연 시 컷 스위치

* 먼저 컷: Week 3 `available-numbers` API, Week 7 일부 UI 폴리싱
* 반드시 유지: **2인 검사 / 423 락 / 단일 제출 / 벌점 원본+조정 / 에러 카탈로그 / OpenAPI 계약 / SSE**

## 주간 공통 루틴

* [ ] ADR 1건 병합
* [ ] 마이그레이션 적용/롤백 검증
* [ ] OpenAPI 최신화 + 스냅샷 갱신
* [ ] 스모크(health/login/me) 녹색
* [ ] 구조화 로그에 `correlation_id` 확인

---

## Day 0 — 환경 · ADR · 관측 · **SSE 베이스** (6–8h)

**Infra & 설정**

* [ ] `docker-compose`로 DB 기동, `make dev` 원클릭
* [ ] `application-{local,dev,prod}.yml` 분리, 필수 env 검증
* [ ] Nginx/프록시: `proxy_buffering off`, `proxy_read_timeout ≥ 1h`, `gzip off`

**관측가능성**

* [ ] `/healthz`(liveness), `/readyz`(readiness)
* [ ] 구조화 로그(JSON) + `correlation_id` 주입(요청→응답/이벤트 전파)

**문서/ADR**

* [ ] `API.yaml` 골격(로그인/리소스/아이템/검사/벌점)
* [ ] 에러 카탈로그(RFC7807 스타일)
* [ ] **ADR-001** 인증(JWT), **ADR-002** 라벨 정책, **ADR-003** *왜 SSE인지*(단방향, 브라우저 기본, 운영 단순)

**DB**

* [ ] `V000__baseline.sql`(라이트): `users / resources / item_bundles / inspection_* / penalties_* / resource_locks`

**SSE 최소작동**

* [ ] `GET /sse` 엔드포인트(하트비트 `:\n`, `retry` 헤더)
* [ ] 인증: **짧은 JWT 쿼리 스트링**(`?access_token=`) 또는 커스텀 헤더 방식 중 택1
* [ ] 클라: `EventSource` 헬로 이벤트 수신, **자동 재연결 + Last-Event-ID** 적용

**Gate/DoD**

* [ ] `compose up` 후 서버 기동 & Swagger 열람
* [ ] 스모크 3콜 200 OK, SSE에서 `hello` 이벤트 수신

---

## Week 1 — 로그인 + RBAC + SSE 인증 고도화 (6–9h)

* [ ] `/auth/login`(JWT Access), `/me`
* [ ] RBAC 가드(ADMIN/INSPECTOR/USER)
* [ ] CORS/보안헤더, 간단 브루트포스 쿨다운
* [ ] SSE 토큰 갱신 흐름(짧은 토큰 만료 시 자동 재연결)
  **Gate/DoD**: 권한 밖 403, `/readyz` 503 조건 동작, SSE 재연결 정상

---

## Week 2 — 리소스+아이템 등록/조회 + **SSE 이벤트** (6–9h)

**DB**

* [ ] `resources(type='FRIDGE_COMP')` 시드
* [ ] `item_bundles (resource_id,label_no)` **활성 부분 유니크**

**API**

* [ ] `GET /resources?type=FRIDGE_COMP`
* [ ] `POST /items`, `GET /items?mine|resource|q`

**SSE 이벤트**

* [ ] `items.created / items.updated / items.removed` 발행(리소스 스코프/내 소유 구분)

**Gate/DoD**: 활성 중복 409, 제거 후 재사용 OK, SSE로 목록 자동 갱신

---

## Week 3 — 번호 충돌/이동 UX + 기본 로깅 (6–9h)

* [ ] `POST /items/{id}:adjust` / `:remove-all`
* [ ] (선택) `GET /items/available-numbers?resource=...`
* [ ] 요청요약 로그(메서드/경로/결과/지연)
* [ ] **SSE**: `items.adjusted / items.removed_all`
  **Gate/DoD**: 교체 플로우(`remove-all→create`)로 번호 유지, 충돌 가이드 문서화

---

## Week 4 — **2인 검사 세션** + 423 락 + SSE (7–9h)

* [ ] `POST /inspections/open` / `{id}/join|leave`
* [ ] 동일 자원 **진행 1건**, 참가자 **최대 2명**
* [ ] 세션 중 해당 자원 쓰기 요청 **423 Locked**
* [ ] **SSE**: `inspection.opened / joined / left / locked`
  **Gate/DoD**: 3번째 참여 409/422, 잠금 UX 반영 실시간

---

## Week 5 — 조치 기록 + **단일 제출** → 원본 벌점 (7–9h)

* [ ] `POST /inspections/{id}/actions`(PASS/WARNING/DISCARD/…)
* [ ] `POST /inspections/{id}/submit`(멱등키 허용)
* [ ] 제출 후 결과 INSERT/DELETE 금지, UPDATE는 리비전 기록(+버전)
* [ ] **SSE**: `inspection.action_recorded / submitted`
  **Gate/DoD**: 재제출 시 멱등 동일 응답, 벌점 원본 생성 확인

---

## Week 6 — 벌점 **조정** + 집계 뷰 (6–8h)

* [ ] `POST /penalties/adjustments`(+/- 사유 필수)
* [ ] `GET /penalties?user|period`
* [ ] 뷰 `v_penalties_totals`(원본+조정)
* [ ] (선택 **SSE**): `penalties.adjusted`
  **Gate/DoD**: 최종점수 정확, 원본 벌점 불변성 보장

---

## Week 7 — 프론트 MVP 플로우 + SSE 안정화 (7–9h)

* [ ] 로그인 → 등록/조회 → 검사(2인) → 제출 → 벌점 조회
* [ ] SSE **유실 복구**(`Last-Event-ID`), **단일 탭 연결**(BroadcastChannel)
* [ ] 423 UX(토스트/다이얼로그)
  **Gate/DoD**: 1분 데모에서 실시간 흐름 매끄럽게 동작

---

## Week 8 — 계약 리그레션 + **SSE E2E** (6–9h)

* [ ] E2E: 등록→이동→검사→조치→제출→벌점(+SSE 수신 검증)
* [ ] OpenAPI 스냅샷 리그레션
  **Gate/DoD**: E2E 녹색, 네트워크 끊김→재연결 케이스 통과

---

## Week 9 — 견고화(경합·성능·보안 라이트) (6–9h)

* [ ] `Idempotency-Key` 수용(서버 캐시 기반)
* [ ] 레이트리밋(사용자별 5분 N회, 429)
* [ ] **SSE 리소스 보호**: 사용자당 연결 수 제한, 하트비트/타임아웃 조정
* [ ] p95 < 300ms 목표(샘플 부하 10→30 rps)
  **Gate/DoD**: 동시 등록 409 정상, 중복 제출 멱등, SSE 커넥션 누수 없음

---

## Week 10 — 폴리싱 · 문서 · 릴리즈 (6–8h)

* [ ] README(아키텍처/ERD/시퀀스/실행가이드)
* [ ] ADR 정리/변경로그, Runbook(SSE/락/오류 대응)
* [ ] 1분 데모 영상 & Postman/Bruno 컬렉션
* [ ] 태그 `v0.1.0-mvp`, 롤백 리허설
  **Gate/DoD**: 스모크/계약/E2E 전부 녹색, 실시간 이벤트/락 규칙 최종 점검

---

# 🚀 10주 이후 릴리스 플랜 (백그라운드 알림 = **PWA + FCM(Web Push)**)

> 전략: **포그라운드 = SSE 유지**, **백그라운드 = Web Push**(서비스워커·VAPID/FCM 하이브리드)

## 공통 배포 수칙

* 마이그 전략: **확장 → 백필 → 전환 → 수축**
* 피처 플래그: 기본 Off → 카나리 → 온
* 롤백: 다운마이그 지양, 코드 즉시 롤백
* SLO: p95 < 300ms, 알림 실패율 < 1%

## R1 — 하드닝① (v0.2.0, 1–2주)

* [ ] `idempotency_store` 테이블(요청해시/응답스냅샷/TTL)
* [ ] 429/409/423 메시지 표준화
* [ ] SSE 커넥션/FD 모니터링 대시보드(간단)

## R2 — 알림 파이프라인(Outbox + DueTasks + DomainEvents) (v0.3.0, 1–2주)

* [ ] `outbox / due_tasks / domain_events` 도입
* [ ] 워커: READY→SENT, 재시도/백오프, 멱등키
* [ ] 알림 센터(헤더 배지+목록, 딥링크)
* [ ] **유통기한 D-1** 알림(로그/배지)

## R3 — **PWA + Web Push(FCM/VAPID)** 도입 (v0.4.0, 1–2주)

* [ ] **Service Worker** 등록 + 푸시 핸들러
* [ ] **구독 저장/해지 API**(`POST /push/subscriptions`)
* [ ] 서버: **VAPID 키** 보관, 브라우저 엔드포인트별 전송
* [ ] **FCM 경유 전송**(Chrome/Edge 등), VAPID 표준 경로 병행
* [ ] 권한 UX: 점진적 프롬프트, 실패/만료 구독 정리
* [ ] iOS Safari는 **홈 화면(PWA)에서 Web Push** 동작 전제(사용자 가이드 제공)
  **Gate/DoD**: 포그라운드=SSE, 백그라운드=Web Push 알림 수신/딥링크 확인

## R4 — 세탁실 ② (미등록 사용/종료 알림/고장 신고) — v0.5.0

### 범위 & 유스케이스

* 미등록 사용(UNAUTHORIZED\_USE) 등록 → 일정 시간 뒤 자동 `AVAILABLE`
* 종료 5분 전 알림(예: 사용 시작 + (설정시간-5분))
* 고장 신고 → 운영자가 `OUT_OF_SERVICE`로 전환

### DB

* [ ] (없음) 기존 `allocations(USAGE)`·`resources.status` 재사용
* [ ] `due_tasks` 규칙 추가: `LAUNDRY_FINISH_MINUS_5M`, `UNAUTHORIZED_TIMEOUT`
* [ ] `outbox` 알림 타입 추가: `Laundry.Reminder.v1`, `Laundry.ErrorReported.v1`

### API

* [ ] `POST /laundry/{resourceId}:report-unauthorized` (duration 분)
* [ ] `POST /laundry/{resourceId}:report-error` (reason)
* [ ] `POST /laundry/{allocId}:schedule-finish-reminder` (선택: 클라가 커스텀 설정 시)
* [ ] 권한: 신고는 사용자, 상태 전환은 ADMIN

### 워커/스케줄

* [ ] DueTask 워커: 시간 도래 시 상태 전환 / `outbox` 큐잉
* [ ] 실패 재시도/백오프, 멱등키(dedup\_key) 적용

### 실시간 & 푸시

* [ ] SSE: `laundry.unauthorized.created|expired`, `laundry.reminder.scheduled`, `laundry.error.reported`
* [ ] Web Push: 배지/헤드업(플랫폼 가능 시) + 딥링크

### UI

* [ ] 대시보드: 미등록 사용 배너/남은시간, 종료 5분 전 배지
* [ ] 고장 신고 플로우(사유 입력) + 장비 카드에 상태 반영

### 관측/운영

* [ ] 알림 성공/실패율, DueTask 지연 메트릭
* [ ] `resources.status` 변경 감사 로그

### 테스트

* [ ] 미등록 사용 등록→자동 복귀
* [ ] 종료 5분 전 알림 큐잉/전송
* [ ] 고장 신고 → `OUT_OF_SERVICE`에서 시작/완료 차단

### Gate/DoD

* [ ] 워커 로그로 SENT 확인, 재시도 정상
* [ ] iOS/Android(Web Push) 최소 1대씩 E2E

### 컷 스위치

* [ ] 알림(Web Push)을 배지/헤더 카운트만 먼저 켜기

---

## R5 — 스터디룸 ① (주간 오픈/10분 슬롯) — v0.6.0

### DB

* [ ] `resources.type='STUDYROOM'` 시드
* [ ] `allocations(kind=RESERVATION)` 시간 겹침 EXCLUDE 제약 확인
* [ ] (선택) `studyroom_policies` 테이블: 오픈요일/시간, 슬롯단위(10m)

### API

* [ ] `POST /studyrooms/reservations` (resourceId, start, end)
* [ ] `DELETE /studyrooms/reservations/{id}`
* [ ] `POST /studyrooms:open-slots` (관리자: 주간 슬롯 생성 또는 자동 생성)

### 워커/스케줄

* [ ] 매주 월요일 09:00 슬롯 생성 DueTask
* [ ] 슬립/중복 생성 대비 멱등키

### 실시간 & 푸시

* [ ] SSE: `studyroom.slot.created|reserved|canceled`
* [ ] (선택) 예약 확정 푸시

### UI

* [ ] 타임라인 뷰(일/주), 내 예약 하이라이트
* [ ] 충돌(409) UX 재시도 가이드

### 테스트

* [ ] 겹침 예약 409
* [ ] 오픈 타이밍 지연 허용 범위 내 동작

### Gate/DoD

* [ ] 동일시간 중복 예약 불가, 딥링크로 상세 이동

### 컷 스위치

* [ ] 자동 오픈 실패 시 수동 `open-slots`로 대체

---

## R6 — 스터디룸 ② (합석/강제예약/운영) — v0.7.0

### DB

* [ ] `reservation_meta(reservation_id, allow_coshare boolean)` 경량 테이블(옵션)

### API

* [ ] 합석 플래그 토글 `PATCH /studyrooms/reservations/{id}`
* [ ] 관리자 강제예약 `POST /studyrooms/reservations:admin`
* [ ] 블록 휴무 `POST /studyrooms/blocks` (기간/사유)

### 규칙

* [ ] 합석 시 좌석 수/동시 사용자 제한 룰
* [ ] 블록 기간 내 예약 금지

### 실시간 & 푸시

* [ ] SSE: 합석 플래그 변경/강제예약/블록 반영
* [ ] 푸시: 강제변경 알림(예약자 대상)

### 테스트

* [ ] 합석 중복 규칙, 블록 우선순위
* [ ] 강제예약 시 기존 예약 충돌 처리

### Gate/DoD

* [ ] 운영자 화면에서 블록/강제예약 관리 가능

### 컷 스위치

* [ ] 강제예약만 먼저, 합석/블록 순차 적용

---

## R7 — 도서관 ① (대출/반납/연장/예약 + 연체 벌점) — v0.8.0

### DB

* [ ] `resources.type='BOOK'` 시드
* [ ] `allocations(kind=LOAN, RESERVATION)`
* [ ] `penalties_original.source=BOOK_OVERDUE` 추가

### API

* [ ] `POST /library/loans` (대출) / `POST /library/loans/{id}:return|extend`
* [ ] `POST /library/reservations` / `DELETE /library/reservations/{id}`

### 워커/스케줄

* [ ] 반납 D-3 알림 DueTask
* [ ] 연체 발생 시 벌점 원본 자동 적재

### 실시간 & 푸시

* [ ] SSE: 대출/반납/연장/예약 이벤트
* [ ] 푸시: D-3 리마인더, 연체 발생 안내

### UI

* [ ] 상세 팝업 원스톱(대출/반납/연장/예약)

### 테스트

* [ ] 대출 중복 금지, 예약 대기열(필요 시)
* [ ] D-3 알림·연체 벌점 적재 E2E

### Gate/DoD

* [ ] 벌점 집계 반영(마이페이지)

### 컷 스위치

* [ ] 예약 대기열은 다음 릴리스로 이관 가능

---

## R8 — 권한 확장 (층/거주/검사 권역화) — v0.9.0

### DB

* [ ] `floors / dorm_rooms / zones / user_zone_assignments / stays` 추가
* [ ] `/me` 응답에 `zones[]` 포함

### API/권한

* [ ] 목록/검사/예약·대출 조회를 zone 필터 기반으로 제한
* [ ] 관리자: 존/층 배정 관리

### 실시간 & 푸시

* [ ] SSE/푸시 모두 zone 스코프 기반 필터링(서버에서 대상자 선별)

### 테스트

* [ ] 권한 범위 밖 403
* [ ] 검사자(층별장) 권역 내만 조작 가능

### Gate/DoD

* [ ] 운영 시나리오(권역 변경) 즉시 반영

### 컷 스위치

* [ ] stays(거주) 없이 zones만 우선 적용 가능

---

## R9 — 관측·감사·운영 — v0.10.0

### DB/로그

* [ ] `activity_logs`(append-only) 도입
* [ ] 주요 흐름(검사 제출/예약/대출/알림 전송) 액션 코드 표준화

### 운영 대시보드(라이트)

* [ ] 에러율, 알림 실패율/지연, SSE 커넥션 수, 워커 큐 길이
* [ ] 간단 표/차트(프론트만)

### 테스트

* [ ] 장애 재현→런북 절차로 복구 검증
* [ ] 알림 재시도/백오프 동작 확인

### Gate/DoD

* [ ] 로그만으로 1건의 문제 원인 추적 가능(엔드투엔드)

### 컷 스위치

* [ ] 차트 대신 CSV 다운로드로 대체 가능

---

## R10 — 보안·PWA 폴리싱 — v0.11.0

### 보안

* [ ] 토큰 버전 무효화(권한 변경 즉시)
* [ ] JWKS 키 회전(자동/수동), 키 롤오버 테스트
* [ ] 레이트리밋 상향·세분화(사용자/엔드포인트/버스트)

### PWA

* [ ] 오프라인 캐시(핵심 조회 뷰) + 설치 프로프트
* [ ] Web Push 구독 정리(job): 만료/410 Gone 제거
* [ ] 딥링크 라우팅(푸시 탭 시 대상 화면)

### 실시간

* [ ] SSE 하트비트/타임아웃/역프록시 설정 재점검(운영값 상향)

### 문서/런북

* [ ] 키 회전/푸시 구독 재발급/롤백 절차

### 테스트

* [ ] 오프라인 모드 UX, 캐시 무효화
* [ ] 키 교체 전후 토큰 검증 정상

### Gate/DoD

* [ ] 오프라인 상태에서 최소 조회 화면 캐시 동작
* [ ] 키 회전 리그레션 OK

### 컷 스위치

* [ ] 오프라인은 읽기 화면만 캐싱, 작성계는 온라인 고정


