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
# 🔔 실무 주의 2가지(항상 상단 고정)

**① 라벨 교체(동일 라벨 `remove→create`)는 한 트랜잭션으로**

```sql
BEGIN;
  UPDATE item_bundles SET removed_at = now() WHERE bundle_id = :old_id;
  INSERT INTO item_bundles(resource_id,label_no,name,quantity,expires_on,owner_user_id,memo)
  VALUES (:res_id,:label_no,:name,:qty,:exp,:owner,:memo);
COMMIT;
```

> 활성만 UNIQUE(부분 UNIQUE)라서, **분리 호출 시 경쟁**으로 409가 납니다.

**② 423 락 = “근거 테이블”만, 강제 차단은 앱에서**

* `resource_locks`는 **락 상태 근거 저장** 용도.
* **차단 판단은 미들웨어**에서 수행(만료는 워커/크론으로 정리).

---

# 0) 리포/운영 기본

## 0-1. 레이아웃/규약

* `backend/`, `frontend/`, `db/migrations/`, `db/seeds/`, `db/ops/`, `docs/`, `ops/`
* 브랜치: `feat/*`, `fix/*`, `chore/*`, `release/*`
* PR 라벨: `schema`, `api`, `sse`, `security`, `perf`, `docs`

## 0-2. Make 최소 타깃

* `make schema` → `db/migrations/V000__baseline.sql`
* `make seed` → `db/seeds/R_seed.sql`
* `make seed-demo` → `db/seeds/R_seed_demo.sql`
* `make openapi-snapshot` → `docs/openapi/snapshots/v0.1.0.json`
* `make test` → 백엔드/계약/E2E 통합

## 0-3. 환경변수/기동 검증

* `.env.example`:
  `DATABASE_URL`, `JWT_SECRET`, `JWT_TTL_MIN=20`,
  `CORS_ALLOWED_ORIGINS`, `RATE_LIMIT_REQ_PER_MIN=60`,
  `LOG_LEVEL=json`, `TZ=UTC`
* 기동 시 **필수 키 없으면 실패**

## 0-4. DB 권한(최소화)

```sql
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON DATABASE dcs FROM PUBLIC;
```

* `db/ops/R_privileges.sql`로 **권한 스크립트 분리**(멱등)

---

# 1) 공통 표준(에러/로그/SSE)

## 1-1. RFC7807 에러 카탈로그(정본)

* `docs/errors.json`(정본) → `errors.md`(생성물)

  * `409 LABEL_CONFLICT`, `422 CHECK_VIOLATION`, `423 RESOURCE_LOCKED`, `429 RATE_LIMITED`
* 서버 미들웨어에서 **일괄 변환**

## 1-2. 구조화 로그/코릴레이션

* 요청→응답/SSE **`correlation_id` 전파**
* 토큰/비번/이메일 **마스킹**

## 1-3. SSE 엔벨로프(고정)

```json
{ "event_id":"...", "v":"1.0", "ts":"...", "correlation_id":"...", "floor_code": null, "resource_id":123, "data":{...} }
```

* 하트비트 `:\n`, `Last-Event-ID` 재동기
* `floor_code`는 **R9 이전 `null` 허용**(UI 탭 대비, 호환성 확보)

---

# 2) 마이그/시드 구조

* `db/migrations/V000__baseline.sql` : **스키마/제약/트리거/뷰/인덱스만**
* `db/seeds/R_seed.sql` : **운영 기본 시드**(roles/resources/관리자 훅, 멱등)
* `db/seeds/R_seed_demo.sql` : **데모 전용 시드**
* `db/ops/R_privileges.sql` : **권한 최소화/롤 그랜트**
* `db/ops/R_trgm_enable.sql` : **TRGM 인덱스(선택, 기본 미적용)**

**규약**

* 파일명: `YYYYMMDDHH_mm_desc.sql`
* 모든 DDL `IF NOT EXISTS`
* 접두사: `ck_/ux_/idx_`

---

# 3) 지연 시 컷 스위치

* 먼저 컷: **번호 가용 조회 API**, 일부 UI 폴리싱
* 반드시 유지: **2인 검사 / 423 락 / 단일 제출 / 벌점(원본+조정) / 에러 카탈로그 / OpenAPI 계약 / SSE**

# 상시 보안/운영 체크

* 해시(Argon2id/bcrypt≥12), JWT TTL 15–30분
* 사용자/IP 레이트리밋, SSE 1–2개/유저
* 민감정보 로깅 금지(Authorization/비번/토큰)
* 분기별 백업→복구 리허설, 장애 런북 최신화


# MVP 10주개발

## 공통 운영 원칙

* [ ] **실시간은 SSE만** 사용(폴링/웹소켓 금지). `Last-Event-ID` 기반 유실 복구.
* [ ] 로그인은 **아이디(=username) + 비밀번호**. 이메일 로그인 아님.
* [ ] **resource\_id**는 공개 불변 ID로 사용(라벨은 표시용).
* [ ] 서버/DB **UTC 저장**, 클라이언트 **KST 표시**.
* [ ] 구조화 로그(JSON) + **correlation\_id** 전파(요청→응답/SSE).
* [ ] 보안 베이스라인: HTTPS, CORS 화이트리스트, 기본 CSP, RBAC(ADMIN/INSPECTOR/USER), 레이트리밋, 비밀번호 해시(Argon2id 또는 bcrypt≥12).
* [ ] 사용자/IP 레이트리밋, SSE 동시 1–2개/유저 제한
---

## Day 0 — 부트스트랩 & SSE 베이스 (6–8h)

* [ ] `docker-compose`로 로컬 실행, 환경변수 검증
* [ ] `/healthz`, `/readyz` 도입, JSON 로그+`correlation_id`
* [ ] **SSE 엔드포인트**(하트비트 `:\n`, 자동 재연결 지시)
* [ ] OpenAPI 골격(로그인/리소스/아이템/검사/벌점) + 에러 카탈로그(RFC7807)
* [ ] `.env.example` 필수 키 정리(DB/JWT/CORS/RATE\_LIMIT) + 검증 로직
* [ ] `/readyz`에서 **DB 커넥션 + 마이그 버전** 체크
* [ ] `make V000__baseline.sql / make seed / make seed-demo` 타깃 제공
* [ ] **시드 멱등성**: `R_seed*.sql` 2회 실행도 동일 결과
* [ ] **시스템 타임존 문서화**: 서버/DB UTC, 클라 KST 표기


**Gate/DoD:** 스모크 3콜 200, 브라우저 `EventSource`로 `hello` 수신 빈 DB에 `schema→seed`만으로 기동 OK, 헬스/레디니스 200

---

## Week 1 — 인증·인가·SSE 인증 (6–9h)

* [ ] `/auth/login`(username+password → **JWT Access** 짧은 TTL) / `/me`
* [ ] **RBAC** 미들웨어(ADMIN/INSPECTOR/USER)
* [ ] **SSE 인증**: `Authorization: Bearer <JWT>` 헤더, 만료 시 재연결 처리
* [ ] CORS 화이트리스트, 기본 CSP/보안 헤더, 브루트포스 쿨다운(앱/캐시)

* [ ] **로그인 쿨다운**: 실패 N회 → 429 + `Retry-After`
* [ ] **패스워드 정책/메시지** 표준화(길이/조합/에러문구 고정)
* [ ] **JWT floors 클레임 슬롯만 예약**(예: `floors:["2F"]`) — *검증·강제는 R8에서*
* [ ] **SSE 인증 만료 흐름 문서화**(재연결/토스트 규칙)

**Gate/DoD:** 권한 밖 403, 토큰 만료 후 SSE 재연결 정상, 만료·비활성·쿨다운 케이스 E2E 녹색

---

## Week 2 — 자원·아이템 등록/조회 + SSE (6–9h)

* [ ] 자원 목록 조회(냉장 **칸** 단위)
* [ ] 아이템(묶음) **생성/조회/검색**(묶음 공통명/유통기한/수량만)
* [ ] **SSE 발행**: `items.created/updated/removed`


* [ ] **페이지네이션 규약 고정**: `?limit&cursor`, 정렬 `(created_at, id)`
* [ ] 모든 **리소스/아이템 응답·이벤트에 `floor_code` 포함**(UI 탭/필터 대비, 저비용/고호환)
* [ ] **검색은 LIKE로 시작**, TRGM는 *포스트-MVP 전용 마이그 파일*로 분리만
**Gate/DoD:** 활성 라벨 충돌 시 409, 제거 후 라벨 재사용 OK, 리스트가 SSE로 즉시 갱신, 라벨 충돌 409 본문 표준, floor 탭 필터 동작


---

## Week 3 — 조정/제거 UX + 요청 로깅 (6–9h)

* [ ] `items/:id:adjust`(수량/유통기한/메모) / `:remove-all`(전량 제거)
* [ ] 요청 요약 로그(메서드/경로/결과/지연)
* [ ] **SSE**: `items.adjusted/items.removed_all`


* [ ] **경량 Idempotency-Key**(메모리 TTL 10분) — 작성계 엔드포인트만
* [ ] **요청 요약 로그** 필드 고정(메서드/경로/지연/결과/코릴레이션ID)
* [ ] **GUC 주입 미들웨어 실제 적용**(리비전/감사 일관성)
**Gate/DoD:** `remove-all → create`로 라벨 번호 유지 교체 동작, 동일 Key 재호출 2xx + 동일 바디

---

## Week 4 — **2인 검사 세션** + 423 락 (7–9h)

* [ ] 세션 열기/참여/나가기(동일 칸 **진행 1건** 제한, 참가자 **최대 2명**)
* [ ] 세션 중 해당 칸 쓰기 요청 **423 Locked**
* [ ] **SSE**: `inspection.opened/joined/left/locked`


* [ ] **락 TTL 기본값 & GC 잡**(5\~10분) + 만료 인덱스

  ```sql
  CREATE INDEX IF NOT EXISTS idx_resource_locks_expires ON resource_locks(expires_at);
  ```
* [ ] **3번째 참여 거절은 409로 고정**(본문에 현 참가자 노출)
* [ ] **락 UX 규칙**(토스트/버튼 비활성/재시도 경로) 문서화
**Gate/DoD:** 3번째 참여 409/422, 락 상태 실시간 반영
, 만료 후 자동 쓰기 허용, 경합 시 409/423 구분 명확

---

## Week 5 — 조치 기록 + **단일 제출** → 벌점 원본 (7–9h)

* [ ] `PASS/WARNING/DISCARD/DISCARD_WITH_PENALTY` 기록
* [ ] **제출 1회(멱등)**, 제출 후 결과 **INSERT/DELETE 금지**, UPDATE는 리비전 적재(+버전)
* [ ] **SSE**: `inspection.action_recorded/submitted`
* [ ] 제출 시 **원본 벌점 자동 생성**

* [ ] **리비전 사유 UI 필수화**(제출 이후 수정시에만)
* [ ] **벌점 매핑표 상수화**(`action/violation_type → points`) 소스에 스냅샷 보관
* [ ] **재제출 멱등** 케이스 계약 테스트
**Gate/DoD:** 재제출 동일 응답, 벌점 원본 생성 확인
,제출 후 UPDATE 시 version +1, 원본 벌점 생성 확인

---

## Week 6 — 벌점 **조정** + 집계 (6–8h)

* [ ] 조정 벌점(+/-, 사유 필수) 작성
* [ ] 사용자별 **최종 점수** 조회(원본 합 + Σ조정)
* [ ] (선택 SSE) `penalties.adjusted`

* [ ] **집계 API 계약**: `original/adjusted/total` 3필드 + 기간 필터
* [ ] (선택) **조정 사유 프리셋** 코드 — 자유기입과 병행
**Gate/DoD:** 원본 벌점은 불변, 최종 점수 정확, 카티전 곱 회귀 테스트(v\_penalties\_totals 정확)

---

## Week 7 — 프론트 E2E + SSE 안정화 (7–9h)

* [ ] 로그인 → 등록/조회 → 검사(2인) → 제출 → 벌점 조회 **엔드투엔드**
* [ ] **Last-Event-ID** + **최근 이벤트 링버퍼**로 유실 복구
* [ ] 단일 탭 연결(BroadcastChannel), 423 토스트/다이얼로그

* [ ] **단일 탭 연결**: `BroadcastChannel`로 SSE 1개 공유
* [ ] **Last-Event-ID 링버퍼** 서버 N=500, 재동기 흐름 확정
**Gate/DoD:** 1분 데모 시나리오 매끄럽게 동작, 오프라인→복귀 후 이벤트 재적재 OK

---

## Week 8 — 계약/회귀 + SSE E2E (6–9h)

* [ ] OpenAPI 스냅샷 리그레션(계약 고정)
* [ ] **네트워크 단절→재연결→복구** E2E 포함

* [ ] **OpenAPI 스냅샷 잠금**(`v0.1.0-mvp`) + 계약 테스트 CI
* [ ] **혼합 네트워크**(느린 SSE/빠른 HTTP) 회귀 시나리오 1건만 유지
**Gate/DoD:** 스냅샷·E2E 모두 녹색, 스냅샷 diff 0, 끊김 복구 시나리오 통과

---

## Week 9 — 견고화(경합·성능·보안 라이트) (6–9h)

* [ ] 작성계 API **Idempotency-Key** 수용(서버 캐시 기반)
* [ ] 레이트리밋(사용자/IP, SSE 별도 제한), 429 + Retry-After
* [ ] p95 < 300ms(샘플 부하 10→30 rps)

* [ ] **k6/Artillery 시나리오**(로그인/목록/SSE/제출 혼합)
* [ ] **레이트리밋 테스트**: 429 + `Retry-After` 헤더 검증
* [ ] **VACUUM/ANALYZE 스케줄** + 인덱스 블로트 체크 쉘 스크립트
* [ ] **Idempotency 캐시 누수 검사**(TTL 만료 후 메모리 회수)
**Gate/DoD:** 동시 등록 409 정상, 중복 제출 멱등, SSE 커넥션 누수 없음, p95 < 300ms, 에러율 < 0.5%, SSE 누수 0

---

## Week 10 — 폴리싱 · 문서 · **릴리즈** (6–8h)

* [ ] README(아키/플로우/시퀀스/실행가이드)
* [ ] ADR 정리, 변경로그, **Runbook(SSE/락/오류 대응)**
* [ ] 1분 데모 영상, Postman/Bruno 컬렉션
* [ ] 태그 `v0.1.0-mvp`, 롤백 리허설

* [ ] **릴리즈 체크리스트**(마이그 순서/시드/롤백/알림) 문서
* [ ] **백업→복구 리허설**(스냅샷 일부 테이블 복구)
* [ ] **권한 매트릭스 표**(역할×API×층) 공개
* [ ] **Postman/Bruno 컬렉션** + 1분 데모 영상

**Gate/DoD:** 스모크/계약/E2E 전부 녹색, 실시간 이벤트/락 규칙 최종 점검, 롤백 리허설 1회 통과, 문서/데모 배포

---

## “Items v2”(MVP 이후) 준비 사항(오늘부터 가볍게)

* [ ] UI/도메인 문서에 **개별 아이템 이름/유통기한** 요구사항 명시
* [ ] 이벤트·로그에 **라벨/리소스/소유자/세션ID** 포함(향후 백필 추적 대비)
* [ ] 마이그 전략만 문서화: **확장 → 백필 → 코드 전환 → 수축**
## MVP 범위에서 의도적 제외(다음 단계)

* [ ] **Items v2**(개별 아이템 별도 이름/유통기한)
* [ ] PWA 오프라인/푸시(Web Push), 알림 워커(Outbox/DueTasks), 층·존 권한, 감사로그, 키 회전/토큰버전 무효화, 정식 멱등 스토어
* TRGM GIN 인덱스 실제 적용(별도 마이그 파일만 보유)
* JWT floors 클레임 **강제 검증/권한 로직**(R8)
* 혼합 네트워크 시나리오의 세부 케이스 다건(대표 1건만 유지)
* 조정 사유 프리셋 고도화(코드/다국어/리포트)


# MVP이후

## 공통 원칙(상시)

* [ ] 실시간은 계속 **SSE**(포그라운드), 백그라운드는 **푸시**로 보완
* [ ] 변경은 가급적 **추가만**으로 진행(다운마이그 회피)
* [ ] **피처 플래그**로 카나리 → 점진 → 전체
* [ ] **SLO** 유지: p95 < 300ms, 푸시 실패율 < 1%
* [ ] 보안 베이스라인 유지(HTTPS, CORS, CSP, RBAC, 레이트리밋, 비번 해시)

---

## R1 — 하드닝 ① / 운영가시성 (v0.2.x, 1–2주)

* [ ] 작성계 API **Idempotency-Key** 정식화(중복요청 동일응답)
* [ ] 에러 응답 **RFC7807** 카탈로그 확정(409/422/423/429 등)
* [ ] **SSE 커넥션/하트비트 모니터링**(대시보드 지표 노출)
  **Gate/DoD:** 중복요청 스냅샷 재사용, 커넥션 누수 0, p95 유지

## R2 — 알림 파이프라인(Outbox / DueTasks / DomainEvents) (v0.3.x, 1–2주)

* [ ] 알림/지연작업 파이프라인 도입(재시도·백오프·멱등)
* [ ] **알림 센터**(배지/목록/딥링크) 1차
* [ ] 트리거: 검사 제출/벌점/만료 임박
  **Gate/DoD:** 제출→큐잉→전송→성공 지표 관찰 가능, 중복 억제 동작

## R3 — PWA + Web Push(FCM/VAPID) (v0.4.x, 1–2주)

* [ ] **Service Worker** 등록/업데이트 전략
* [ ] 푸시 구독 저장/해지 API, 만료 구독 정리 잡
* [ ] iOS는 **홈화면(PWA)** 조건 안내
  **Gate/DoD:** 포그라운드=SSE, 백그라운드=푸시 수신·딥링크 OK

## R4 — **Items v2(핵심)**: 개별 아이템 이름/유통기한 (v0.5.x, 2–3주)

* [ ] **도메인/UX**: 묶음(공통명/메모) + **개별 단위**(이름/유통기한/제거)
* [ ] **API**: 그룹/유닛 CRUD, 목록/검색, 검사 흐름 연동
* [ ] **마이그 전략**:

  * [ ] 확장(새 구조 추가) →
  * [ ] **백필**(MVP 묶음 레코드 → 그룹 1 + 유닛 N) →
  * [ ] **코드 전환**(읽기/쓰기를 새 모델로) →
  * [ ] 수축(구조체계 중복 경로 정리)
* [ ] **SSE 이벤트 키**: groupId/unitId 기반으로 전환
  **Gate/DoD:** 기존 데이터/화면 무중단 전환, 검사/벌점 플로우 정상

## R5 — 세탁실 ①: 기본 사용(시작/완료) (v0.6.x, 1–2주)

* [ ] 자원 타입 확장(세탁기/건조기) 및 **동시 사용 금지** 규칙
* [ ] 사용 시작/완료 API + 실시간 상태(SSE)
  **Gate/DoD:** 동시 시작 409, 진행 상태 실시간 반영

## R6 — 세탁실 ②: 미등록 사용·종료 알림·고장 신고 (v0.7.x, 1–2주)

* [ ] **미등록 사용** 등록→시간 경과 자동 복귀
* [ ] **종료 5분 전** 알림 예약
* [ ] **고장 신고**→운영 전환(사용 차단)
  **Gate/DoD:** 알림 큐잉/전송 확인, 상태 전환 감사 가능

## R7 — 스터디룸 ①: 10분 슬롯 예약 (v0.8.x, 1–2주)

* [ ] 주간 슬롯 생성(월 09:00), 예약/취소 API
* [ ] 타임라인 뷰 + 실시간 반영(SSE)
  **Gate/DoD:** 동일 시간대 중복 예약 409, 타임라인 즉시 갱신

## R8 — 스터디룸 ② & 운영 옵션 (v0.9.x, 1주)

* [ ] **합석 옵션**, **관리자 강제예약**, **블록 휴무**
  **Gate/DoD:** 운영 화면에서 옵션·블록 관리, 충돌 규칙 통과

## R9 — 권역 권한(층/존) (v0.10.x, 1–2주)

* [ ] 사용자 권역 할당, 리스트/검사/예약 **권역 필터링**
* [ ] `/me`에 권역 포함, 프런트 라우팅/보안 가드 연동
  **Gate/DoD:** 권역 밖 403, 층별장 권역 내만 조작 가능

## R10 — 보안·관측·PWA 폴리싱 (v0.11.x, 1주)

* [ ] **append-only 감사로그**(고위험 액션 추적)
* [ ] **키 회전/JWKS**, 토큰 **버전 무효화**(로그아웃·권한변경 즉시 반영)
* [ ] PWA 오프라인(핵심 조회 캐싱), 푸시 딥링크 안정화
  **Gate/DoD:** 키 교체 리그레션 OK, 오프라인 조회 동작

---

## 상시 보안/운영 체크리스트

* [ ] 비밀번호 해시(Argon2id 또는 bcrypt≥12) 계속 준수
* [ ] Access JWT **짧은 TTL(15–30분)** 유지(리프레시는 후속 도입)
* [ ] 사용자/IP 별 레이트리밋, **SSE 연결 1–2개/사용자** 제한
* [ ] 민감정보 로깅 금지(비번/토큰/Authorization 헤더), 마스킹 규칙 점검
* [ ] 백업/복구 리허설 분기별 1회, 장애 복구 런북 최신화

---

## 데이터/제품 전환 메모(요약)

* **Items v2**는 최우선: **확장→백필→코드 전환→수축** 순서로 무중단 이행
* 실시간은 **항상 SSE**로 유지, 푸시는 **보완 채널**
* 모든 신규 기능은 **피처 플래그**로 카나리 운영 후 전면 전환



```sql
-- =========================================================
-- Dorm Convenience System — 10주 MVP 통합 스키마 (ALL-IN-ONE)
--  • 범위: 확장 → 테이블/제약/트리거/뷰 → 초기 인덱스(개선안2) → 핫픽스(뷰/체크) → (옵션) TRGM
--  • 트랜잭션: 전체를 한 번에 실행 가능 (CONCURRENTLY 사용 안 함)
--  • 시각: timestamptz = UTC 보관 (표시는 클라이언트에서 KST)
--  • 원칙: 핵심 불변성은 DB가 보장(UNIQUE/CHECK/TRIGGER), 그 외 정책은 앱에서 처리
--  • 실시간: 포그라운드 = SSE, 백그라운드 = (포스트-MVP) Web Push
-- =========================================================

BEGIN;

-- ---------------------------------------------------------
-- 0) 확장
--    - citext: 아이디/이메일 고유성 검사에서 대소문자 무시
--    - btree_gist: EXCLUDE 제약 대비(이후 예약/시간 겹침 등에 활용)
--    - pg_trgm: (옵션) LIKE/검색 성능 향상(초기엔 비활성/소규모면 생략 가능)
-- ---------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS citext;       -- 대소문자 무시 문자열(아이디 고유성)
CREATE EXTENSION IF NOT EXISTS btree_gist;   -- (향후 EXCLUDE 제약 대비)
CREATE EXTENSION IF NOT EXISTS pg_trgm;      -- (옵션) 키워드 검색 최적화

-- ---------------------------------------------------------
-- 1) 사용자/역할 (로컬 계정)
--    - 로그인은 아이디(username) + 비밀번호(해시)
--    - email은 선택(운영/알림 용도), NULL 다중 허용
--    - roles/user_roles로 단순 RBAC(ADMIN/INSPECTOR/USER)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  user_id         BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, -- 사용자 ID(식별용)
  username        CITEXT NOT NULL UNIQUE,        -- 로그인 아이디(대소문자 무시 고유)
  email           CITEXT UNIQUE,                 -- 선택 저장이메일, NULL 다중 허용
  password_hash   TEXT   NOT NULL,               -- Argon2id/bcrypt 해시(평문 저장 금지)
  display_name    TEXT   NOT NULL,               -- 사용자 표시명
  is_active       BOOLEAN NOT NULL DEFAULT TRUE, -- false면 로그인 차단
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS roles (
  role_id SMALLINT PRIMARY KEY,
  name    TEXT NOT NULL UNIQUE,
  CHECK (name IN ('ADMIN','INSPECTOR','USER'))   -- 역할 집합 고정
);

INSERT INTO roles(role_id, name) VALUES (1,'ADMIN'),(2,'INSPECTOR'),(3,'USER')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS user_roles (
  user_id    BIGINT    NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  role_id    SMALLINT  NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, role_id) --사용자-역할 매핑(N:N)
);

-- ---------------------------------------------------------
-- 2) 자원(Resources) — MVP는 냉장 "칸"만
--    - 라벨(label)은 사람에게 보여줄 식별자, 비즈니스 키는 resource_id 사용 필수
--    - 타입/라벨 조합 UNIQUE로 전역 중복 방지(운영 편의)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS resources (
  resource_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, -- 자원 ID(식별용)
  type        TEXT    NOT NULL CHECK (type IN ('FRIDGE_COMP')),  -- 이후 WASHER/DRYER/STUDYROOM/BOOK 등 확장
  label       TEXT    NOT NULL,                                  -- UI 라벨(예: '냉장1', '냉동1')
  status      TEXT    NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','OUT_OF_SERVICE')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(type, label)   -- 타입별 라벨 고유(운영/디버깅 편의)
);

-- ---------------------------------------------------------
-- 3) 물품(Item) — MVP: 단일 계층(묶음 1행)
--    - 활성(removed_at IS NULL) 상태에서 (resource_id, label_no) 유일
--      → 라벨 충돌 방지(제거되면 동일 라벨 재사용 가능)
--    - replaced_by_bundle_id: 라벨 교체 이력 추적(선택)
--    - group_hint: 포스트-MVP 이행(Items v2)시 매핑 힌트(현재 미사용)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS item_bundles (
  bundle_id     BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, -- 묶음 ID(식별용)
  resource_id   BIGINT NOT NULL REFERENCES resources(resource_id) ON DELETE RESTRICT, -- 칸 ID
  owner_user_id BIGINT REFERENCES users(user_id) ON DELETE SET NULL, -- 소유자 ID
  label_no      INTEGER NOT NULL CHECK (label_no > 0),   -- 스티커 라벨 번호. 활성 상태에서 칸 단위 유일
  name          TEXT    NOT NULL,                        -- 품목명(묶음 공통)
  quantity      INTEGER NOT NULL CHECK (quantity >= 0),  -- 0 허용(부분소비 후)
  expires_on    DATE    NOT NULL,                        -- 공통 유통기한
  memo          TEXT, -- 메모
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(), -- 생성일시
  removed_at    TIMESTAMPTZ,                             -- 전량 제거(폐기/소진)
  replaced_by_bundle_id BIGINT REFERENCES item_bundles(bundle_id) ON DELETE SET NULL, -- 교체된 묶음 ID
  group_hint    UUID, -- Items v2 이행 시 그룹 매핑 힌트(현재 미사용)
  CHECK (replaced_by_bundle_id IS NULL OR removed_at IS NOT NULL)  -- 교체되면 제거 상태여야 함
);

-- 부분 UNIQUE: "활성 레코드"에 한해 (resource_id, label_no) 유일
CREATE UNIQUE INDEX IF NOT EXISTS ux_item_label_active
  ON item_bundles(resource_id, label_no) WHERE removed_at IS NULL;

-- ---------------------------------------------------------
-- 3-β) Items v2 — 묶음/개별 분리(포스트-MVP 대비, 현재 미사용)
--    - 그룹(item_groups): 라벨/공통명/메모/소유/칸(활성 라벨 유일)
--    - 개별(item_units): 각 아이템별 이름/유통기한/제거시각
--    - 전환시 "확장→백필→코드 전환→수축" 순서로 무중단 이행 가능
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS item_groups (
  group_id      BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, -- 묶음 ID(식별용)
  resource_id   BIGINT NOT NULL REFERENCES resources(resource_id) ON DELETE RESTRICT, -- 칸 ID
  owner_user_id BIGINT REFERENCES users(user_id) ON DELETE SET NULL, -- 소유자 ID
  label_no      INTEGER NOT NULL CHECK (label_no > 0), -- 묶음 라벨 번호. 활성 묶음에 대해 칸 단위 유일
  group_name    TEXT    NOT NULL, -- 묶음 공통명
  memo          TEXT, -- 메모
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(), -- 생성일시
  removed_at    TIMESTAMPTZ, -- 묶음 전체 제거/소진
  replaced_by_group_id BIGINT REFERENCES item_groups(group_id) ON DELETE SET NULL -- 교체된 묶음 ID
);

-- 활성 그룹에 대해 (칸, 라벨) 유일
CREATE UNIQUE INDEX IF NOT EXISTS ux_item_groups_label_active
  ON item_groups(resource_id, label_no) WHERE removed_at IS NULL;

-- 교체 시 제거 필수(대칭 규칙 보강)
DO $$
BEGIN 
  IF NOT EXISTS ( 
    SELECT 1 FROM pg_constraint -- 제약 조회
    WHERE conrelid='item_groups'::regclass -- 테이블 참조
      AND conname='ck_group_replaced_requires_removed' -- 제약 이름
  ) THEN
    ALTER TABLE item_groups
      ADD CONSTRAINT ck_group_replaced_requires_removed -- 제약 추가
      CHECK (replaced_by_group_id IS NULL OR removed_at IS NOT NULL);
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS item_units (
  unit_id     BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, -- 개별 ID(식별용)
  group_id    BIGINT NOT NULL REFERENCES item_groups(group_id) ON DELETE CASCADE,
  seq_no      INTEGER NOT NULL CHECK (seq_no > 0),      -- 묶음 내 순번(1..N)
  name        TEXT    NOT NULL,                         -- 개별명(그룹명과 달라도 됨)
  expires_on  DATE    NOT NULL,                         -- 개별 유통기한
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(), -- 생성일시
  removed_at  TIMESTAMPTZ, -- 개별 제거/소진
  UNIQUE (group_id, seq_no) -- 그룹 내 순번(1..N)
);

CREATE INDEX IF NOT EXISTS idx_item_units_group ON item_units(group_id); -- 그룹 인덱스

-- ---------------------------------------------------------
-- 4) 검사(Inspection) — 2인 세션 + 단일 제출 + 결과 불변(리비전)
--    - 자원당 진행중 세션은 1개만(동시 검사 방지)
--    - 제출되면 결과는 불변(INSERT/DELETE 금지, UPDATE는 리비전 적재)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS inspection_sessions (
  session_id    BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, -- 세션 ID(식별용)
  resource_id   BIGINT NOT NULL REFERENCES resources(resource_id) ON DELETE RESTRICT, -- 칸 ID
  started_by    BIGINT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT, -- 시작자 ID
  status        TEXT  NOT NULL CHECK (status IN ('IN_PROGRESS','SUBMITTED','CANCELED')),
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(), -- 시작일시
  ended_at      TIMESTAMPTZ,                           -- SUBMITTED 시 필수
  submitted_by  BIGINT REFERENCES users(user_id) ON DELETE SET NULL, -- 제출자 ID
  submitted_at  TIMESTAMPTZ -- 제출일시
);

-- 자원당 진행중 세션 단일(부분 UNIQUE)
CREATE UNIQUE INDEX IF NOT EXISTS ux_inspection_res_inprog -- 자원당 진행중 세션 단일
  ON inspection_sessions(resource_id) WHERE status='IN_PROGRESS'; -- 진행중 상태일 때만

-- SUBMITTED ⇒ submitted_at/ended_at 필수
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint -- 제약 조회
    WHERE conrelid='inspection_sessions'::regclass AND conname='ck_submitted_has_ts'
  ) THEN
    ALTER TABLE inspection_sessions
      ADD CONSTRAINT ck_submitted_has_ts -- 제약 추가
      CHECK (status <> 'SUBMITTED' OR (submitted_at IS NOT NULL AND ended_at IS NOT NULL));
  END IF;
END$$;

-- IN_PROGRESS ⇒ 제출 타임스탬프 없어야 함(정합성 강화)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='inspection_sessions'::regclass AND conname='ck_inprog_has_no_submit_ts' -- 제약 이름
  ) THEN
    ALTER TABLE inspection_sessions
      ADD CONSTRAINT ck_inprog_has_no_submit_ts -- 제약 추가
      CHECK (status <> 'IN_PROGRESS' OR (submitted_at IS NULL AND ended_at IS NULL));
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS inspection_participants (
  participant_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, -- 참가자 ID(식별용)
  session_id     BIGINT NOT NULL REFERENCES inspection_sessions(session_id) ON DELETE CASCADE,
  user_id        BIGINT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  seat_no        SMALLINT NOT NULL CHECK (seat_no IN (1,2)), -- 최대 2명
  joined_at      TIMESTAMPTZ NOT NULL DEFAULT now(), -- 참여일시
  UNIQUE (session_id, seat_no),
  UNIQUE (session_id, user_id)
);

CREATE TABLE IF NOT EXISTS inspection_results (
  result_id    BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  session_id   BIGINT NOT NULL REFERENCES inspection_sessions(session_id) ON DELETE CASCADE, -- 세션 ID
  bundle_id    BIGINT REFERENCES item_bundles(bundle_id) ON DELETE SET NULL, -- 미등록 폐기 시만 NULL
  performer_participant_id BIGINT NOT NULL REFERENCES inspection_participants(participant_id) ON DELETE RESTRICT, -- 수행자 참가자 ID
  action       TEXT NOT NULL CHECK (action IN ('PASS','WARNING','DISCARD','DISCARD_WITH_PENALTY')),
  violation_type TEXT CHECK (violation_type IS NULL OR violation_type IN ('EXPIRED','NO_STICKER','PACKAGING_DEFECT','INFO_MISMATCH')),
  note         TEXT,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(), -- 수행일시  
  version      INTEGER NOT NULL DEFAULT 1, -- 버전
  CHECK (bundle_id IS NOT NULL OR violation_type='NO_STICKER')
);

-- action ↔ violation_type 정합성 체크(비즈니스 규칙 정착)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='inspection_results'::regclass AND conname='ck_action_violation' -- 제약 이름
  ) THEN
    ALTER TABLE inspection_results
      ADD CONSTRAINT ck_action_violation -- 제약 추가
      CHECK (
        (action='PASS' AND violation_type IS NULL)
     OR (action='WARNING' AND violation_type IS NOT NULL)
     OR (action IN ('DISCARD','DISCARD_WITH_PENALTY') AND violation_type IS NOT NULL)
      );
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS inspection_result_revisions (
  rev_id     BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, -- 리비전 ID(식별용)
  result_id  BIGINT NOT NULL REFERENCES inspection_results(result_id) ON DELETE CASCADE, -- 결과 ID
  session_id BIGINT NOT NULL,                         -- 조인 편의
  changed_by BIGINT REFERENCES users(user_id) ON DELETE SET NULL, -- 변경자 ID
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(), -- 변경일시
  reason     TEXT,                                    -- 제출 후 수정 사유(필수 취지, 트리거에서 검증)
  prev_row   JSONB NOT NULL,                          -- 변경 전 스냅샷
  new_row    JSONB NOT NULL                           -- 변경 후 스냅샷
);

-- 트리거: 제출 세션 INSERT/DELETE 차단 + UPDATE 리비전 적재(+버전 증가)
CREATE OR REPLACE FUNCTION ensure_session_not_submitted()
RETURNS TRIGGER LANGUAGE plpgsql AS $$ -- 트리거 함수
DECLARE st TEXT;
BEGIN
  SELECT status INTO st -- 세션 상태
  FROM inspection_sessions
  WHERE session_id = COALESCE(NEW.session_id, OLD.session_id)
  FOR UPDATE; -- 세션 상태 업데이트
  IF st='SUBMITTED' THEN
    RAISE EXCEPTION '이미 제출된 검사 세션입니다(결과 불변)';
  END IF;
  RETURN COALESCE(NEW, OLD);
END$$;

CREATE OR REPLACE FUNCTION trg_audit_ir_update()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_status TEXT; v_reason TEXT; v_user BIGINT;
BEGIN
  SELECT status INTO v_status FROM inspection_sessions WHERE session_id = NEW.session_id; -- 세션 상태
  v_reason := current_setting('app.change_reason', true); -- 앱에서 SET LOCAL app.change_reason 로 주입
  IF current_setting('app.user_id', true) IS NOT NULL THEN
    v_user := current_setting('app.user_id')::BIGINT;     -- 앱에서 SET LOCAL app.user_id 로 주입
  END IF;
  IF v_status='SUBMITTED' AND (v_reason IS NULL OR btrim(v_reason)='') THEN -- 제출된 결과 수정에는 사유가 필요함
    RAISE EXCEPTION '제출된 검사결과 수정에는 사유(app.change_reason)가 필요합니다';
  END IF;
  INSERT INTO inspection_result_revisions(result_id, session_id, changed_by, reason, prev_row, new_row)
  VALUES (OLD.result_id, OLD.session_id, v_user, v_reason, to_jsonb(OLD), to_jsonb(NEW));
  NEW.version := OLD.version + 1;
  RETURN NEW;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_ir_block_ins') THEN -- 제출된 결과 수정에는 사유가 필요함
    CREATE TRIGGER trg_ir_block_ins BEFORE INSERT ON inspection_results
    FOR EACH ROW EXECUTE FUNCTION ensure_session_not_submitted();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_ir_audit_upd') THEN -- 제출된 결과 수정에는 사유가 필요함
    CREATE TRIGGER trg_ir_audit_upd BEFORE UPDATE ON inspection_results
    FOR EACH ROW WHEN (OLD.* IS DISTINCT FROM NEW.*)
    EXECUTE FUNCTION trg_audit_ir_update();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_ir_block_del') THEN -- 제출된 결과 수정에는 사유가 필요함
    CREATE TRIGGER trg_ir_block_del BEFORE DELETE ON inspection_results
    FOR EACH ROW EXECUTE FUNCTION ensure_session_not_submitted();
  END IF;
END$$;

-- ---------------------------------------------------------
-- 5) 423 Locked 근거(자원 논리 락)
--    - 검사/운영 작업 중 일반 쓰기(등록/변경)를 앱에서 423으로 거절할 때의 "근거 데이터"
--    - 강제 차단 로직은 DB 트리거로 넣지 않고, 앱 미들웨어에서 판단/반환(복잡도 상승 방지)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS resource_locks (
  lock_id        BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, -- 락 ID(식별용)
  resource_id    BIGINT NOT NULL REFERENCES resources(resource_id) ON DELETE CASCADE, -- 자원 ID
  holder_user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT, -- 보유자 ID
  reason         TEXT    NOT NULL,   -- 예: 'INSPECTION_IN_PROGRESS'
  expires_at     TIMESTAMPTZ NOT NULL,  -- 자동 만료(유령 락 방지)
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(), -- 생성일시
  UNIQUE(resource_id)                  -- 자원당 1개만
);

-- ---------------------------------------------------------
-- 6) 벌점 — 원본(불변) + 조정(합산)
--    - 원본: 검사 제출 시 도메인 이벤트에 의해 생성(수정/삭제 불가)
--    - 조정: 운영자 +/- (사유 필수), 최종 점수는 합산 뷰로 조회
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS penalties_original (
  penalty_id  BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, -- 벌점 ID(식별용)
  user_id     BIGINT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT, -- 사용자 ID
  inspection_result_id BIGINT REFERENCES inspection_results(result_id) ON DELETE SET NULL, -- 결과 ID
  violation_type TEXT NOT NULL, -- 예: 'EXPIRED'
  points      INTEGER NOT NULL, -- 양수
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 핫픽스: 양수 제약(실수 데이터 방지)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint -- 제약 조회
    WHERE conrelid='penalties_original'::regclass AND conname='ck_po_points_positive'
  ) THEN
    ALTER TABLE penalties_original
      ADD CONSTRAINT ck_po_points_positive CHECK (points > 0);
  END IF;
END$$;

-- 원본 벌점 불변성 보장(UPDATE/DELETE 차단)
CREATE OR REPLACE FUNCTION block_penalty_mutation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$ -- 트리거 함수
BEGIN
  RAISE EXCEPTION '원본 벌점은 수정/삭제할 수 없습니다';
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_po_block_upd') THEN -- 제출된 결과 수정에는 사유가 필요함
    CREATE TRIGGER trg_po_block_upd BEFORE UPDATE ON penalties_original
    FOR EACH ROW EXECUTE FUNCTION block_penalty_mutation();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_po_block_del') THEN -- 제출된 결과 수정에는 사유가 필요함
    CREATE TRIGGER trg_po_block_del BEFORE DELETE ON penalties_original
    FOR EACH ROW EXECUTE FUNCTION block_penalty_mutation();
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS penalties_adjustments (
  adj_id       BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, -- 벌점 ID(식별용)
  user_id      BIGINT  NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT, -- 사용자 ID
  delta_points INTEGER NOT NULL,  -- +/- 가능(감면/추가)
  reason       TEXT    NOT NULL,  -- 사유(필수)
  created_by   BIGINT  NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT, -- 생성자 ID
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 집계 뷰: 카티전 곱 방지(서브집계 후 조인)
CREATE OR REPLACE VIEW v_penalties_totals AS
WITH po AS (
  SELECT user_id, SUM(points) AS original_points -- 원본 벌점
  FROM penalties_original
  GROUP BY user_id
),
pa AS (
  SELECT user_id, SUM(delta_points) AS adjusted_points -- 조정 벌점
  FROM penalties_adjustments
  GROUP BY user_id
)
SELECT u.user_id, -- 사용자 ID      
       COALESCE(po.original_points, 0) AS original_points, -- 원본 벌점
       COALESCE(pa.adjusted_points, 0) AS adjusted_points,
       COALESCE(po.original_points, 0) + COALESCE(pa.adjusted_points, 0) AS total_points -- 최종 벌점
FROM users u
LEFT JOIN po ON po.user_id = u.user_id -- 원본 벌점
LEFT JOIN pa ON pa.user_id = u.user_id; -- 조정 벌점

-- ---------------------------------------------------------
-- 7) 초기 인덱스(개선안2 세트)
--    - MVP 주 조회패턴 최적화(부분 인덱스 + 커버링), FK 조인 가속
--    - 운영 중 추가 인덱스가 필요하면 CONCURRENTLY로 보강 권장
-- ---------------------------------------------------------
-- FK/조인 기반
CREATE INDEX IF NOT EXISTS idx_ir_session      ON inspection_results(session_id); -- 결과 세션  
CREATE INDEX IF NOT EXISTS idx_ir_performer    ON inspection_results(performer_participant_id); -- 결과 수행자
CREATE INDEX IF NOT EXISTS idx_ip_session      ON inspection_participants(session_id); -- 참가자 세션
CREATE INDEX IF NOT EXISTS idx_ip_user         ON inspection_participants(user_id); -- 참가자 사용자
CREATE INDEX IF NOT EXISTS idx_po_user         ON penalties_original(user_id); -- 원본 벌점 사용자
CREATE INDEX IF NOT EXISTS idx_pa_user         ON penalties_adjustments(user_id);

-- 활성 아이템 조회 최적화(커버링 + 부분 인덱스)
CREATE INDEX IF NOT EXISTS idx_item_owner_expires_covering -- 소유자 유통기한 최적화
  ON item_bundles(owner_user_id, expires_on, created_at DESC)   -- 소유자 유통기한 최적화
  INCLUDE (bundle_id, name, quantity) -- 번들 아이디, 이름, 수량
  WHERE removed_at IS NULL; -- 제거되지 않은 경우

CREATE INDEX IF NOT EXISTS idx_item_resource_label_covering -- 리소스 라벨 최적화
  ON item_bundles(resource_id, label_no) -- 리소스 라벨 최적화
  INCLUDE (bundle_id, name, quantity, expires_on, owner_user_id, created_at) -- 번들 아이디, 이름, 수량, 유통기한, 소유자, 생성일시
  WHERE removed_at IS NULL; -- 제거되지 않은 경우

-- 진행중 세션 빠른 조회(부분 인덱스)
CREATE INDEX IF NOT EXISTS idx_sessions_inprog_started -- 진행중 세션 빠른 조회
  ON inspection_sessions(status, started_at DESC) -- 진행중 세션 빠른 조회
  WHERE status = 'IN_PROGRESS'; -- 진행중 상태일 때만

-- 결과 타임라인(커버링)
CREATE INDEX IF NOT EXISTS idx_ir_session_time_covering -- 결과 타임라인 최적화
  ON inspection_results(session_id, performed_at) -- 결과 타임라인 최적화
  INCLUDE (result_id, action, violation_type, note, version, performer_participant_id); -- 결과 아이디, 액션, 위반 타입, 메모, 버전, 수행자 참가자 아이디

-- (옵션) 키워드 검색: GIN(TRGM) — 초기 데이터 적으면 보류 가능
CREATE INDEX IF NOT EXISTS idx_item_bundles_name_trgm -- 번들 이름 최적화
  ON item_bundles USING gin (name gin_trgm_ops); -- 번들 이름 최적화
CREATE INDEX IF NOT EXISTS idx_item_bundles_memo_trgm -- 번들 메모 최적화
  ON item_bundles USING gin (memo gin_trgm_ops); -- 번들 메모 최적화

-- ---------------------------------------------------------
-- 8) (옵션) 초기 시드 — 리소스만 (존재 시 스킵)
--     ※ 관리자 계정은 보안상 해시를 외부에서 주입 권장:
--        SET app.admin_password_hash = '<bcrypt_or_argon2_here>';
-- ---------------------------------------------------------
INSERT INTO resources(type, label) VALUES
 ('FRIDGE_COMP','냉장1'), ('FRIDGE_COMP','냉장2'), ('FRIDGE_COMP','냉동1') -- 냉장고 칸
ON CONFLICT DO NOTHING;

DO $$
DECLARE v_hash TEXT := current_setting('app.admin_password_hash', true); -- 관리자 비밀번호 해시
DECLARE v_uid  BIGINT; -- 관리자 아이디
BEGIN
  -- 환경변수로 비번 해시가 주입된 경우에만 관리자 자동 생성(없으면 스킵)
  IF v_hash IS NOT NULL AND btrim(v_hash) <> '' THEN
    INSERT INTO users(username, email, password_hash, display_name, is_active) -- 관리자 생성
    VALUES ('admin', 'admin@example.local', v_hash, '관리자', TRUE) 
    ON CONFLICT (username) DO NOTHING -- 관리자 아이디 중복 방지
    RETURNING user_id INTO v_uid; -- 관리자 아이디

    IF v_uid IS NULL THEN
      SELECT user_id INTO v_uid FROM users WHERE username='admin'; -- 관리자 아이디
    END IF;

    IF v_uid IS NOT NULL THEN
      INSERT INTO user_roles(user_id, role_id) VALUES (v_uid, 1) -- 관리자 역할
      ON CONFLICT DO NOTHING; -- 관리자 역할 중복 방지
    END IF;
  END IF;
END$$;

-- ---------------------------------------------------------
-- 9) (옵션) 권한 잠금 — dcs_app/dcs_read 롤이 존재할 때만 적용
--    - 마이그/DDL은 관리자 롤, 앱 커넥션은 dcs_app, 리드 전용은 dcs_read 권장
--    - 원본 벌점 UPDATE/DELETE는 트리거에 더해 권한도 REVOKE(이중 안전망)
-- ---------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='dcs_app') THEN
    EXECUTE 'GRANT USAGE ON SCHEMA public TO dcs_app'; -- 관리자 권한
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO dcs_app'; -- 관리자 권한
    EXECUTE 'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO dcs_app'; -- 관리자 권한
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO dcs_app'; -- 관리자 권한
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO dcs_app'; -- 관리자 권한
    EXECUTE 'REVOKE UPDATE, DELETE ON penalties_original FROM dcs_app';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='dcs_read') THEN
    EXECUTE 'GRANT USAGE ON SCHEMA public TO dcs_read'; -- 관리자 권한  
    EXECUTE 'GRANT SELECT ON ALL TABLES IN SCHEMA public TO dcs_read'; -- 관리자 권한
    EXECUTE 'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO dcs_read'; -- 관리자 권한
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO dcs_read'; -- 관리자 권한
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO dcs_read'; -- 관리자 권한
    EXECUTE 'REVOKE UPDATE, DELETE ON penalties_original FROM dcs_read';
  END IF;
END$$;

COMMIT;

-- =========================================================
-- 실행 메모:
--  • 관리자 계정 자동 생성 원하면:
--      SET app.admin_password_hash = '$2b$12$.........................';
--      \i 이_파일.sql
--  • API 에러 매핑(권장):
--      UNIQUE/경합=409, CHECK/FK=422, 검사중/락=423, 레이트=429
--  • 라벨 교체(동일 라벨 재사용)는 트랜잭션으로 원자적 처리 권장
-- =========================================================

-- =========================================================
-- [향후 구현 방향(로드맵) — 참고 주석]
--
-- R1) 하드닝 ① (성능/신뢰성/보안)
--  - 작성계 멱등성: Idempotency-Key 수용(캐시/스토어)
--  - 레이트리밋 세분화: 사용자·엔드포인트·버스트
--  - SSE 관측: 연결 수/하트비트/지연/드롭률 대시보드
--  - OpenAPI 스냅샷/에러 카탈로그 확정
--
-- R2) 알림 파이프라인
--  - outbox/due_tasks(예약·재시도·백오프), 워커 멱등 처리
--  - 유통기한 D-1, 검사 결과 알림, 실패 재시도/중복억제
--  - 포그라운드=SSE, 백그라운드=Web Push 병행
--
-- R3) PWA + Web Push
--  - 서비스워커/오프라인 캐시(읽기 우선), 푸시 구독/해지
--  - iOS 홈화면 가이드, 딥링크(푸시 탭→대상화면)
--
-- R4) Items v2 전환(개별 아이템 이름/유통기한/제거시각)
--  - 확장(현 스키마 준비完) → 백필(item_bundles → groups/units)
--  - 새 API 병행/섀도우-쓰기 → 프론트 전환 → 구 경로 수축
--  - SSE 이벤트 키를 group_id/unit_id로 명확화
--
-- R5) 자원 확장(세탁실/스터디룸/도서관)
--  - type 추가 + 예약/대출/반납 도메인 테이블(추가만으로 확장)
--  - EXCLUDE/파티셔닝/아카이빙은 데이터 규모 커질 때 도입
--
-- R6) 운영/관측 고도화
--  - pg_stat_statements 대시보드, 인덱스 효율 뷰
--  - 슬로우쿼리/락 경합 알림, 주간 점검 런북
--
-- 주의:
--  - TRGM/GIN 인덱스는 데이터가 커지기 전까지 보류 가능(공간/빌드비용 절감)
--  - resource_locks는 "근거 데이터"로 유지, 쓰기 차단은 앱 미들웨어에서 423 반환
--  - inspection_results 불변성은 MVP 기간 유지(나중에 저장함수로 점진 전환 고려)
-- =========================================================
```