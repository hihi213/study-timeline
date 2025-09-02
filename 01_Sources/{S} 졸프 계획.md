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



# MVP 10주 기능 정리 (최종)

## 0) 핵심 목표

* 로그인(로컬) → 냉장칸 자원/물품 등록·조회 → **2인 검사**(동시 2명, 자원당 진행 1건) → **단일 제출**
  → **벌점 원본 자동 생성 + 조정 합산** → 화면은 **SSE 실시간 반영**.
* **라이트 스키마**: 공간모델(층/방/존)·예약공통은 제외, 확장 여지 보존.

---

## 1) 인증/권한 (로컬 계정)

* **아이디(=username) + 비밀번호** 로그인, `Argon2id`(권장) 또는 `bcrypt(cost≥12)` 해시.
* **JWT Access(짧은 TTL 15–30m)**, 리프레시는 MVP 범위 밖. `token_version` 컬럼으로 추후 무효화 준비.
* **RBAC 3역할**: `ADMIN / INSPECTOR / USER` 미들웨어 가드.
* **계정상태**: `is_active=false` 차단, 실패 누적 **쿨다운**(429)로 브루트포스 완화.

---

## 2) 냉장칸 자원·물품

* 자원: `FRIDGE_COMP` 목록/상태. **비즈니스 키는 `resource_id`(공개 불변)**, `label`은 표시용.
* 물품: 등록/조회/검색/수정/전량제거.

  * **활성 상태에서 (resource\_id, label\_no) 유일**, 제거 후 번호 재사용 OK.
  * 교체 시 원본 `removed_at` 필수(번호 유지 교체 플로우 지원).
* 물품 변경

  * `:adjust`(수량/유통기한/메모), `:remove-all`(전량 제거)
---

## 3) 검사(Inspection) — **2인 세션 + 단일 제출**

* 세션 열기/참여/나가기, **동일 자원 진행 1건**(인덱스 보장), 참가자 **최대 2명**.
* 검사 중 해당 자원 쓰기 요청은 **423 Locked** (서버/클라 UX 포함).
* 조치: `PASS / WARNING / DISCARD / DISCARD_WITH_PENALTY`

  * **NO\_STICKER**일 때만 미등록 폐기(`bundle_id` NULL) 허용.
* **제출 1회(멱등)**, 제출 후 결과 **INSERT/DELETE 금지**, UPDATE 시 리비전 적재(+버전 증가).

---

## 4) 벌점

* 제출 시 **원본 벌점** 자동 생성(UPDATE/DELETE **차단 트리거**).
* **조정 벌점**(±, 사유 필수), 최종점수 = **원본 합 + Σ조정**(뷰 제공).

---

## 5) 실시간 (**SSE-first**)

* **인증된 SSE**(`Authorization: Bearer <JWT>`), 자동 재연결 + **Last-Event-ID** 재전송.
* 최소 하트비트(`:\n`)·`retry`·아이들 타임아웃. **사용자당 동시 1–2커넥션 제한**.
* 대표 이벤트:
  `items.created/updated/removed`,
  `inspection.opened/joined/left/locked/action_recorded/submitted`,
  (선택) `penalties.adjusted`.

---

## 6) 운영·품질·계약

* 헬스 체크 `/healthz`·`/readyz`(미마이그/미설정 503).
* **OpenAPI 스냅샷/계약 테스트**, E2E(SSE 수신 포함).
* 구조화 로그(JSON) + **`correlation_id` 전파**, 토큰/비번 등 **민감정보 마스킹**.
* **레이트리밋**(사용자/IP, SSE 별도), **응답 표준화**(RFC7807 + 409/422/423/429).
* 성능 목표: 샘플 부하 **p95 < 300ms**.

---

## 7) DB 라이트 스키마(핵심 제약)

* `resources(type='FRIDGE_COMP')`, **`resource_id` 공개 불변**.
* `item_bundles`: **(resource\_id, label\_no) WHERE removed\_at IS NULL** 유니크.
* `inspection_sessions`: **자원당 진행 1건** 유니크.
* `inspection_participants`: 세션당 **최대 2명**(seat\_no·user 중복 금지).
* `inspection_results`: 제출 후 **INSERT/DELETE 금지**, UPDATE 시 **리비전 적재**(+버전).
* `resource_locks`: 자원당 단일 락(423 근거).
* `penalties_original`: **UPDATE/DELETE 차단** 트리거, `v_penalties_totals` 제공.

---

## 8) 네트워크/보안 베이스라인 (MVP에서 실제 적용)

* **HTTPS/HSTS** 강제, Helmet류 보안헤더(CSP 라이트, XFO DENY, XCTO nosniff, Referrer-Policy).
* **CORS 화이트리스트**(허용 도메인만).
* **입력 스키마 검증** + 본문 크기 제한(예: 256KB).
* **비밀 관리**: env/CI 시크릿, 저장소 커밋 금지.
* **백업 스냅샷 일 1회 + 복구 리허설 1회**.
* 공개 상용 전 보강 항목(다음 릴리스): 리프레시 토큰, 2FA/SSO, JWKS 키 회전, append-only 감사 로그, 세밀 권한(층/존), 정식 `idempotency_store`, Outbox/DueTasks, PWA/푸시 하드닝.

---

## 9) 주차별 핵심 산출물(요약)

* **Day0**: DB 베이스라인, `/healthz`·`/readyz`, **SSE 골격**(하트비트/재연결), OpenAPI 골격.
* **W1**: 로컬 로그인(아이디/비번) + JWT + RBAC, SSE 인증/재연결.
* **W2**: 자원/아이템 CRUD + **SSE: items.\***.
* **W3**: 번호 교체/충돌 UX + 요청 로그 + **SSE: items.adjusted**.
* **W4**: **2인 검사 세션 + 423 락** + **SSE: inspection.opened/…/locked**.
* **W5**: 조치 기록 + **단일 제출** → 벌점 원본 생성 + **SSE: submitted**.
* **W6**: 벌점 조정/집계(뷰) (+선택 SSE).
* **W7**: 프론트 E2E 플로우 + **Last-Event-ID 유실 복구** + 단일 탭 연결.
* **W8**: 계약 리그레션 + **SSE E2E**(재연결/유실 테스트).
* **W9**: 멱등 키(라이트), 레이트리밋, **SSE 연결 보호**, p95 기록.
* **W10**: 문서/런북(락·SSE·오류), 1분 데모, 태그 `v0.1.0-mvp`, 롤백 리허설.

---

## 10) 의도적 제외(다음 단계로 이관)

* Outbox/DueTasks/DomainEvents(알림 파이프라인), Allocations(예약/사용/대여).
* Floors/Rooms/Zones/Stays(세밀 권한/거주), append-only `activity_logs`, 정식 `idempotency_store`.
* PWA 오프라인/푸시(Web Push). *(포그라운드 실시간은 계속 SSE)*

---

## 11) 데모 증빙물(출고 시)

* Swagger/OpenAPI(+스냅샷), E2E 스크립트(SSE 수신 검증 포함), 1분 데모 영상,
* README(아키텍처/ERD/시퀀스/실행가이드), **Runbook(SSE/락/오류 대응)**.

---

# 10주 이후 기능 정리(최종)

## 공통 운영 원칙

* **피처 플래그**: 기본 Off → 카나리(관리자/내 계정) → 전원 On
* **마이그**: 확장(ADD) → 백필 → 전환(코드 스위치) → 수축(삭제)
* **SLO**: p95 < 300ms, 알림 실패율 < 1%, 워커 평균 재시도 < 3
* **실시간 전략**: 포그라운드(SSE) 지속 / 백그라운드(Web Push) 단계 도입
* **보안 베이스라인 유지** + 릴리스별 보강(아래 각 R에 명시)

---

## R1 — 하드닝① (v0.2.0)

**목표**: 멱등·오류 표준화로 “실수해도 안전한” 상태 만들기

* DB: `idempotency_store(key, request_hash, response_snapshot, status_code, expires_at)`
* 서버: 작성계(아이템 생성/수정/삭제, 검사 조치/제출) **Idempotency-Key** 수용
* 에러 카탈로그 표준화(409/422/423/429 + RFC7807 본문)
* **SSE 커넥션 메트릭**(현재 연결/하트비트/최근 전송) 노출
* DoD: 중복 요청 시 **동일 응답 스냅샷** 반환, p95 < 300ms 유지

---

## R2 — 알림 파이프라인(Outbox + DueTasks + DomainEvents) (v0.3.0)

**목표**: 푸시/예약성 작업의 “신뢰 가능한 파이프라인” 마련(아직 푸시 발사 최소화)

* DB: `outbox(type, dedup_key, payload, status, attempts, sent_at)`,
  `due_tasks(run_at, kind, payload, status)`,
  `domain_events(type, payload)`
* 워커: READY→SENT, **멱등(dedup\_key)**, 백오프/재시도
* 이벤트: 검사 제출 시 `Fridge.InspectionSubmitted.v1` 적재
* UI: **알림 센터(헤더 배지/목록)** 1차(로그/배지만, 푸시는 다음 R에서)
* DoD: 제출→outbox 적재→워커 **SENT** 로그 확인

---

## R3 — PWA + Web Push(FCM/VAPID) (v0.4.0)

**목표**: **백그라운드 알림** 도입. 포그라운드는 계속 SSE.

* PWA: Service Worker 등록, 구독/해지 API(`POST /push/subscriptions`)
* 서버: **VAPID 표준** + **FCM 경유** 모두 지원(브라우저/플랫폼별 엔드포인트)
* iOS 안내: **홈 화면(PWA) 설치 + iOS 16.4+** 필요(가이드 배포)
* 구독 만료 정리(410 Gone), 권한 프롬프트 지연 UX
* 맵핑:

  * 포그라운드 변화 ⇒ **SSE**
  * 백그라운드 리마인더/딥링크 ⇒ **Web Push**
* DoD: 포그라운드=SSE, **백그라운드=Web Push** 동작/딥링크 확인

---

## R4 — 세탁실 ① (기본 사용/완료) (v0.5.0)

**목표**: 최소 사용 흐름(겹침 금지, 진행바)

* DB: `resources.type`에 `WASHER`,`DRYER` 추가
* DB: `allocations(kind=USAGE, starts_at, ends_at)` + **EXCLUDE(시간 겹침 금지)**
* API: `GET /laundry/devices`, `POST /laundry/{id}:start|finish`
* SSE: `laundry.started|finished`
* DoD: 동시 시작 409, 시작→완료 정상

---

## R5 — 세탁실 ② (미등록 사용/종료 알림/고장 신고) (v0.6.0)

**목표**: 현장 이슈 처리 + 리마인더

* DueTasks: `LAUNDRY_FINISH_MINUS_5M`, `UNAUTHORIZED_TIMEOUT`
* API: `report-unauthorized`, `report-error`, (선택)`schedule-finish-reminder`
* 상태: 고장 신고 시 `resources.status=OUT_OF_SERVICE`
* SSE: 미등록/오류 이벤트 반영, Web Push: **종료 5분 전 리마인더**
* DoD: 미등록 사용 자동 복귀, 리마인더 큐잉/전송

---

## R6 — 스터디룸 ① (주간 오픈/10분 슬롯) (v0.7.0)

**목표**: 예약 기본기(슬롯 생성, 겹침 금지)

* DB: `resources.type='STUDYROOM'`, `allocations(kind=RESERVATION)`(EXCLUDE)
* API: 예약 생성/취소, 관리 `:open-slots`(매주 월 09:00 자동 생성)
* UI: 주간 타임라인, 내 예약 강조
* SSE: `studyroom.slot.created|reserved|canceled`
* DoD: 동일 시간대 이중 예약 409, 타임라인 실시간 반영

---

## R7 — 스터디룸 ② (합석/강제예약/블록) (v0.8.0)

**목표**: 운영 편의 고도화

* (옵션) DB: `reservation_meta(reservation_id, allow_coshare boolean)`
* API: 합석 토글, **관리자 강제예약**, 블록 휴무
* SSE/푸시: 강제변경/블록 반영
* DoD: 운영 화면에서 블록/강제예약 관리 가능

---

## R8 — 도서관 ① (대출/반납/연장/예약 + 연체 벌점) (v0.9.0)

**목표**: 최소 도서 흐름 + 벌점 연계

* DB: `resources.type='BOOK'`, `allocations(kind=LOAN|RESERVATION)`
* 벌점: `penalties_original.source='BOOK_OVERDUE'`
* API: 대출/반납/연장, 예약/취소
* DueTasks: **반납 D-3 알림**, 연체 시 벌점 원본 자동 적재
* SSE/푸시: 대출/반납/예약 이벤트 + 리마인더
* DoD: 연체 시 벌점 원본 생성, D-3 알림 전송

---

## R9 — 권한 확장(층/거주/검사 권역화) (v0.10.0)

**목표**: 실제 공간 단위 운영 권한

* DB: `floors / dorm_rooms / zones / user_zone_assignments / stays`
* `/me` 응답에 `zones[]` 포함, 목록/검사/예약 **zone 필터** 적용
* SSE/푸시: 서버에서 **대상자(zone) 선별** 후 브로드캐스트
* DoD: 권역 밖 403, 권역 변경 즉시 반영

---

## R10 — 관측·보안·PWA 폴리싱 (v0.11.0)

**목표**: 운영 신뢰도·보안 마무리

* DB: `activity_logs`(append-only) + 변경 트리거
* 대시보드(라이트): 오류율/알림 실패율·지연, **SSE 연결 수**, 큐 길이
* 보안: **토큰 버전 무효화**, **JWKS 키 회전**, 레이트리밋 상향/세분화
* PWA: 핵심 조회 **오프라인 캐시**, 만료 구독 정리, 푸시 딥링크 안정화
* SSE 튜닝: 하트비트/타임아웃/역프록시 값 재점검
* DoD: 오프라인 조회 캐시 동작, 키 회전 리그레션 OK

---

## 영역별 “무엇이 늘어나는가” 한눈 요약

* **알림/푸시**: R2 파이프라인 → R3 PWA+Web Push → R5/R7/R8 각 도메인 리마인더/이벤트
* **자원/예약/대여**: R4 세탁 사용 → R6 스터디룸 예약 → R8 도서 대출
* **권한/도메인**: R9 zone 기반 인가로 운영 현실화
* **보안/운영**: R1 멱등, R10 키 회전/감사·관측 강화
* **실시간**: 전 단계에서 **SSE 유지**(푸시는 백그라운드 보완)

---

## 컷 스위치(시간 빠듯할 때)

* 먼저 컷: R6 합석/강제예약 일부, R8 예약 대기열, R10 푸시 고급 UX
* 반드시 유지: **멱등(R1)**, **알림 파이프라인(R2)**, **겹침 금지/락 규칙(R4/R6)**, **벌점 연계(R8)**


# MVP 10주개발

* [ ] `resource_id`는 **공개 불변 ID**로 사용(라벨은 표시용).
* [ ] 라벨 유일성 정책은 **변경 가능**(전역 → 층/냉장고 스코프). 전환은 인덱스 Concurrently.
* [ ] 모든 로그/이벤트에 **`correlation_id`**, **`resource_id`**, **`session_id`** 포함.
* [ ] ADR로 확장 경로 고정: Allocations(R3/R5), Outbox/DueTasks(R2), Floors/Zones(R8).
* [ ] 시간 정책: **서버/DB UTC 저장**, 클라이언트는 KST 포맷.

## ⛔️ MVP에서 의도적 제외

* Outbox/DueTasks/DomainEvents(알림 파이프라인), Allocations(예약/사용/대여 공통)
* Floors/Rooms/Zones/Stays(세밀 권한/거주), append-only `activity_logs`, 정식 `idempotency_store`
* PWA 오프라인/푸시(Web Push) — **10주 이후**

## ✂️ 지연 시 컷 스위치

* 먼저 컷: Week 3 `available-numbers` API, Week 7 일부 UI 폴리싱
* 반드시 유지: **2인 검사 / 423 락 / 단일 제출 / 벌점 원본+조정 / 에러 카탈로그 / OpenAPI 계약 / SSE**

## 🗓 주간 공통 루틴

* [ ] ADR 1건 이상 병합(이번 주 결정 기록)
* [ ] 마이그레이션 적용/롤백 검증
* [ ] Swagger/OpenAPI 최신화 + 스냅샷 업데이트
* [ ] 스모크(health/login/me) 녹색
* [ ] 구조화 로그(JSON)에 `correlation_id` 확인

---

## Day 0 — 환경 · ADR · 관측 · **SSE 베이스** (6–8h)

**해야 할 일**

* [ ] `docker-compose` DB 기동, `make dev` 원클릭
* [ ] `application-{local,dev,prod}.yml` 분리(필수 env 검증)
* [ ] `/healthz`, `/readyz`, 구조화 로그 + `correlation_id` 주입
* [ ] `API.yaml` 골격(로그인/리소스/아이템/검사/벌점), 에러 카탈로그(RFC7807)
* [ ] **SSE 엔드포인트 `/sse`**(하트비트 `:\n`, `retry` 헤더)
* [ ] **프록시 튜닝**: `proxy_buffering off`, `proxy_read_timeout ≥ 1h`, `Cache-Control: no-transform`, `Content-Type: text/event-stream`
* [ ] DB 베이스라인 `V000__baseline.sql` 적용(라이트 스키마)

**Gate/DoD**

* [ ] 스모크 3콜 200 OK
* [ ] 브라우저 `EventSource`로 `hello` 수신(자동 재연결 OK)

---

## Week 1 — 로그인 + RBAC + **SSE 인증 흐름** (6–9h)

**해야 할 일**

* [ ] `/auth/login`(JWT), `/me`
* [ ] RBAC 미들웨어(ADMIN/INSPECTOR/USER)
* [ ] CORS/보안헤더, 간단 브루트포스 쿨다운
* [ ] **SSE 인증**: **SSE는 `HttpOnly; Secure; SameSite=Lax` 쿠키로만 인증**(쓰기 API는 Bearer 유지) (+자동 재연결 갱신)

**Gate/DoD**

* [ ] 권한 밖 403, `/readyz` 503 조건 동작
* [ ] 토큰 만료 후 SSE 자동 재연결 정상

---

## Week 2 — 리소스/아이템 등록·조회 + **SSE 이벤트** (6–9h)

**해야 할 일**

* [ ] `resources(type='FRIDGE_COMP')` 시드
* [ ] `POST /items`, `GET /items?mine|resource|q`
* [ ] **SSE 발행**: `items.created / items.updated / items.removed`
* [ ] `item_bundles (resource_id,label_no)` **활성 부분 유니크** 확인

**Gate/DoD**

* [ ] 활성 중복 409, 제거 후 동일 번호 재사용 OK
* [ ] 목록 화면이 **SSE 수신으로 즉시 갱신**

---

## Week 3 — 번호 충돌/교체 UX + 기본 로깅 (6–9h)

**해야 할 일**

* [ ] `POST /items/{id}:adjust`(수량/만료/메모), `:remove-all`
* [ ] (선택) `GET /items/available-numbers?resource=...`
* [ ] 요청 요약 로그(메서드/경로/결과/지연)
* [ ] **SSE**: `items.adjusted / items.removed_all`

**Gate/DoD**

* [ ] `remove-all → create`로 라벨 **번호 유지 교체**
* [ ] 충돌/재시도 UX 가이드 문서화

---

## Week 4 — **2인 검사 세션** + 423 락 + SSE (7–9h)

**해야 할 일**

* [ ] `POST /inspections/open` / `{id}/join|leave`
* [ ] 동일 자원 **진행 1건**, 참가자 **최대 2명** 인덱스/유니크
* [ ] 세션 중 해당 자원 쓰기 요청 **423 Locked**
* [ ] **SSE**: `inspection.opened / joined / left / locked`

**Gate/DoD**

* [ ] 3번째 참여 409/422
* [ ] 잠금 상태가 **실시간 반영**됨

---

## Week 5 — 조치 기록 + **단일 제출** → 원본 벌점 (7–9h)

**해야 할 일**

* [ ] `POST /inspections/{id}/actions`(PASS/WARNING/DISCARD/…)
* [ ] `POST /inspections/{id}/submit`(멱등키 수용)
* [ ] 제출 후 결과 INSERT/DELETE 금지, UPDATE는 **리비전 적재(+버전)**
* [ ] **SSE**: `inspection.action_recorded / submitted`
* [ ] 원본 벌점 자동 생성

**Gate/DoD**

* [ ] 재제출 멱등(동일 응답)
* [ ] 벌점 원본 생성 확인

---

## Week 6 — 벌점 **조정** + 집계 뷰 (6–8h)

**해야 할 일**

* [ ] `POST /penalties/adjustments`(+/- 사유 필수)
* [ ] `GET /penalties?user|period`
* [ ] `v_penalties_totals`(원본+조정=최종) 뷰
* [ ] (선택 SSE) `penalties.adjusted`

**Gate/DoD**

* [ ] 최종 점수 정확
* [ ] 원본 벌점 UPDATE/DELETE 차단 검증

---

## Week 7 — 프론트 MVP 플로우 + **SSE 안정화** (7–9h)

**해야 할 일**

* [ ] 로그인 → 등록/조회 → 검사(2인) → 제출 → 벌점 조회 **엔드투엔드**
* [ ] **Last-Event-ID** + **인메모리 링버퍼**(최근 N분)로 유실 복구
* [ ] 단일 탭 보장(BroadcastChannel)로 SSE 중복 연결 방지
* [ ] 423 UX(토스트/다이얼로그)

**Gate/DoD**

* [ ] 1분 데모 플로우 매끄럽게 동작(실시간 반영 포함)

---

## Week 8 — 계약 리그레션 + **SSE E2E** (6–9h)

**해야 할 일**

* [ ] E2E: 등록→이동→검사→조치→제출→벌점(+SSE 수신 검증)
* [ ] OpenAPI 스냅샷 리그레션

**Gate/DoD**

* [ ] 네트워크 단절→재연결→**유실 이벤트 복구** 케이스 통과
* [ ] 스냅샷 테스트 녹색

---

## Week 9 — 견고화(경합·성능·보안 라이트) (6–9h)

**해야 할 일**

* [ ] 작성계 API `Idempotency-Key` 수용(서버 캐시 기반)
* [ ] 레이트리밋(사용자별 5분 N회, 429 + Retry-After)
* [ ] **SSE 리소스 보호**: 사용자당 연결 수 제한, 하트비트 주기/타임아웃 튜닝
* [ ] p95 < 300ms 목표(샘플 부하 10→30 rps)

**Gate/DoD**

* [ ] 동시 등록 409 정상, 중복 제출 멱등 응답
* [ ] SSE 커넥션 누수 없음(프로세스 재시작/네트워크 변동 포함)

---

## Week 10 — 폴리싱 · 문서 · **릴리즈** (6–8h)

**해야 할 일**

* [ ] README(아키텍처/ERD/시퀀스/실행가이드)
* [ ] ADR 정리/변경로그, **Runbook(SSE/락/오류 대응)**
* [ ] 1분 데모 영상 & Postman/Bruno 컬렉션
* [ ] 태그 `v0.1.0-mvp`, 롤백 리허설(마이그/이미지)

**Gate/DoD**

* [ ] 스모크/계약/E2E 전부 녹색
* [ ] 실시간 이벤트·락 규칙 최종 점검 완료

---

# MVP이후

## 공통 배포 수칙

* **피처 플래그**: 기본 Off → 카나리(내 계정/관리자) → 온
* **롤백**: 다운마이그 지양, 코드 즉시 롤백
* **SLO**: p95 < 300ms, 알림 실패율 < 1%, 워커 평균 재시도 < 3
## R1 — 하드닝① (v0.2.0, 1–2주)

**해야 할 일**

* [ ] DB: `idempotency_store(key, request_hash, response_snapshot, status_code, expires_at)`
* [ ] 서버: 작성계 API(`items.create/adjust/remove`, `inspections.actions/submit`)에 **Idempotency-Key** 수용
* [ ] 에러 응답 표준화(409/422/423/429 + RFC7807 본문)
* [ ] **SSE 커넥션 모니터링**(현재 연결 수/최근 전송/하트비트 지표 노출)

**Gate/DoD**

* [ ] 중복 요청에 **동일 응답 스냅샷** 반환
* [ ] p95 < 300ms 유지, SSE 연결 누수 없음

---

## R2 — 알림 파이프라인 (v0.3.0, 1–2주)

**해야 할 일**

* [ ] DB: `outbox(type, dedup_key, payload, status, attempts, sent_at)`, `due_tasks(run_at, kind, payload, status)`, `domain_events(type, payload)`
* [ ] 워커: READY→SENT, 재시도/백오프, **dedup\_key 멱등**
* [ ] 이벤트 적재: 검사 제출 시 `Fridge.InspectionSubmitted.v1`
* [ ] UI: 알림 센터(헤더 배지/목록, 딥링크만)

**Gate/DoD**

* [ ] 제출→outbox 적재→워커 **SENT** 로그 확인
* [ ] 실패 재시도 및 중복 억제 동작

---

## R3 — **PWA + Web Push(FCM/VAPID)** (v0.4.0, 1–2주)

**해야 할 일**

* [ ] **Service Worker** 등록, 푸시 핸들러 및 딥링크 라우팅
* [ ] 서버: 구독 저장/해지 `POST /push/subscriptions`(endpoint+keys), **VAPID 키** 보관, **FCM 경유 전송**도 지원
* [ ] 권한 UX: 지연 프롬프트/재요청, 만료 구독 정리 job
* [ ] iOS 가이드: **홈 화면(PWA)** 추가 필요, iOS 16.4+

**Gate/DoD**

* [ ] 포그라운드=SSE, **백그라운드=Web Push**로 알림 수신/딥링크 OK
* [ ] 410 Gone 등 만료 구독 자동 정리

---

## R4 — 세탁실 ① (기본 사용/완료) (v0.5.0, 1–2주)

**해야 할 일**

* [ ] DB: `resources.type`에 `WASHER`,`DRYER` 추가
* [ ] DB: `allocations(resource_id, user_id, kind=USAGE, starts_at, ends_at)` + **EXCLUDE(기간 겹침 금지)**
* [ ] API: `GET /laundry/devices`, `POST /laundry/{id}:start|finish`
* [ ] SSE: `laundry.started|finished`
* [ ] UI: “지금 사용 가능/사용 중/완료” 카드 + 진행바

**Gate/DoD**

* [ ] 동시 시작 409, 정상 흐름(시작→완료) 작동

---

## R5 — 세탁실 ② (미등록 사용/종료 알림/고장 신고) (v0.6.0, 1–2주)

**해야 할 일**

* [ ] DB 재사용: `allocations`, `resources.status=OUT_OF_SERVICE`
* [ ] DueTask 규칙: `LAUNDRY_FINISH_MINUS_5M`, `UNAUTHORIZED_TIMEOUT`
* [ ] API: `report-unauthorized`, `report-error`, (선택) `schedule-finish-reminder`
* [ ] SSE: `laundry.unauthorized.created|expired`, `laundry.error.reported`
* [ ] Web Push: 종료 5분 전 리마인더(가능 플랫폼)

**Gate/DoD**

* [ ] 미등록 사용 자동 복귀, 종료-5분 알림 큐잉/전송

---

## R6 — 스터디룸 ① (주간 오픈/10분 슬롯) (v0.7.0, 1–2주)

**해야 할 일**

* [ ] DB: `resources.type='STUDYROOM'`; `allocations(kind=RESERVATION)`(EXCLUDE)
* [ ] API: `POST /studyrooms/reservations`, `DELETE /.../{id}`, `POST /studyrooms:open-slots`
* [ ] DueTask: 매주 월 09:00 슬롯 생성(멱등)
* [ ] SSE: `studyroom.slot.created|reserved|canceled`
* [ ] UI: 주간 타임라인, 내 예약 강조

**Gate/DoD**

* [ ] 동일 시간대 중복 예약 409, 타임라인 실시간 반영

---

## R7 — 스터디룸 ② (합석/강제예약/블록) (v0.8.0, 1주)

**해야 할 일**

* [ ] DB(옵션): `reservation_meta(reservation_id, allow_coshare boolean)`
* [ ] API: 합석 토글, 관리자 강제예약, 블록 휴무 생성
* [ ] 규칙: 합석 중복/정원, 블록 우선순위
* [ ] SSE/푸시: 강제변경/블록 반영

**Gate/DoD**

* [ ] 운영 화면에서 합석/강제예약/블록 관리 가능

---

## R8 — 도서관 ① (대출/반납/연장/예약 + 연체 벌점) (v0.9.0, 1–2주)

**해야 할 일**

* [ ] DB: `resources.type='BOOK'`; `allocations(kind=LOAN|RESERVATION)`
* [ ] DB: `penalties_original.source='BOOK_OVERDUE'` 사용
* [ ] API: 대출/반납/연장, 예약/취소
* [ ] DueTask: 반납 D-3 알림, 연체 발생 시 벌점 적재
* [ ] SSE/푸시: 대출/반납/연장/예약 이벤트

**Gate/DoD**

* [ ] 연체 시 벌점 원본 생성, D-3 알림 전송

---

## R9 — 권한 확장 (층/거주/검사 권역화) (v0.10.0, 1–2주)

**해야 할 일**

* [ ] DB: `floors / dorm_rooms / zones / user_zone_assignments / stays`
* [ ] `/me`에 `zones[]` 포함, 목록/검사/예약을 zone 필터로 제한
* [ ] 마이그: **확장→백필→전환→수축** 원칙
* [ ] SSE/푸시: zone 스코프 필터링(대상자 선별)

**Gate/DoD**

* [ ] 권역 밖 403, 층별장 권역 내 조작 가능

---

## R10 — 관측·보안·PWA 폴리싱 (v0.11.0, 1주)

**해야 할 일**

* [ ] DB: `activity_logs`(append-only) + 변경 트리거
* [ ] 운영 대시보드(간단): 오류율/알림 실패율·지연/SSE 연결 수/큐 길이
* [ ] 보안: 토큰 **버전 무효화**, **JWKS 키 회전**, 레이트리밋 상향
* [ ] PWA: 오프라인 캐시(핵심 조회), 만료 구독 정리, 딥링크 안정화
* [ ] SSE 튜닝: 하트비트/타임아웃/역프록시 재점검

**Gate/DoD**

* [ ] 오프라인 조회 화면 캐시 동작, 키 회전 리그레션 OK
* [ ] 로그만으로 주요 플로우 문제 원인 추적 가능

---


```SQL
-- =========================================================
-- Dorm Convenience System — 10주 MVP 라이트 스키마 (Postgres)
--  • 목표: 로그인 → 냉장고 등록/조회 → 2인 검사 → 단일 제출 → 벌점 집계
--  • 범위: RBAC 최소, 냉장칸(자원) + 아이템, 검사(≤2명, 제출 후 불변), 벌점
--  • 철학: "DB가 핵심 불변성을 보장" (유니크/체크/트리거/EXCLUDE)
--  • 시간/타임존: timestamptz(UTC 저장), 클라이언트(KST) 포맷
--  • 향후 확장점(10주 이후): allocations(예약/사용/대여), outbox/due_tasks, 층/존 권한 등
-- =========================================================

BEGIN;

-- ---------------------------------------------------------
-- 0) 확장 (citext: 대소문자 무시 문자열 / btree_gist: EXCLUDE용)
--    * citext: 이메일 고유성 체크를 사람 감각대로(대소문자 무시)
--    * btree_gist: 시간 겹침 금지 등에 쓰이는 GiST 인덱스 지원(여기 라이트판에선 아직 미사용)
-- ---------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ---------------------------------------------------------
-- 1) RBAC 최소: 사용자/역할/매핑
--    * 면접/데모에서 "권한 밖 403" 증빙 가능
-- ---------------------------------------------------------
CREATE TABLE users (
  user_id       BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, -- 내부 PK
  email         CITEXT UNIQUE NOT NULL,                               -- 로그인 이메일(대소문자 무시 고유)
  password_hash TEXT NOT NULL,                                        -- 비밀번호 해시(BCrypt 등)
  display_name  TEXT NOT NULL,                                        -- 사용자 표시 이름
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,                        -- 비활성 처리 시 로그인 차단
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()                    -- 생성 시각(감사 용도)
);

CREATE TABLE roles (
  role_id SMALLINT PRIMARY KEY,                                       -- 역할 코드(숫자 고정)
  name    TEXT NOT NULL UNIQUE,                                       -- 역할명
  CHECK (name IN ('ADMIN','INSPECTOR','USER'))                        -- 허용 역할만 제한
);
INSERT INTO roles(role_id,name) VALUES (1,'ADMIN'),(2,'INSPECTOR'),(3,'USER')
ON CONFLICT DO NOTHING;

CREATE TABLE user_roles (
  user_id    BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE, -- 사용자
  role_id    SMALLINT NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE, -- 역할
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),                           -- 부여 시각
  PRIMARY KEY(user_id, role_id)                                            -- 중복 부여 방지
);

-- ---------------------------------------------------------
-- 2) 자원(Resources) — 지금은 냉장칸(FRIDGE_COMP)만 사용
--    * 동일 타입 내 label 고유: 사람이 보는 표기('냉장1','냉동1') 충돌 방지
--    * status: OUT_OF_SERVICE면 쓰기 금지(앱에서 체크)
-- ---------------------------------------------------------
CREATE TABLE resources (
  resource_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,    -- 자원 PK
  type  TEXT NOT NULL CHECK (type IN ('FRIDGE_COMP')),                 -- MVP: 냉장칸만
  label TEXT NOT NULL,                                                 -- UI 라벨(예: '냉장1', '냉동1')
  status TEXT NOT NULL DEFAULT 'ACTIVE'                                -- 사용 가능/불가
        CHECK (status IN ('ACTIVE','OUT_OF_SERVICE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(type, label)                                                  -- 타입별 라벨 고유
);

-- ---------------------------------------------------------
-- 3) 냉장 아이템(Item Bundles)
--    * 핵심 규칙: "활성(removed_at IS NULL) 상태에서 (resource_id, label_no) 유일"
--    * 번호 재사용: removed_at이 채워지면 같은 번호 재사용 가능
--    * 교체 시(replaced_by_bundle_id) → 원본은 제거 상태(removed_at 필수)
-- ---------------------------------------------------------
CREATE TABLE item_bundles (
  bundle_id   BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,    -- 묶음 PK
  resource_id BIGINT NOT NULL REFERENCES resources(resource_id) ON DELETE RESTRICT, -- 소속 칸(자원)
  owner_user_id BIGINT REFERENCES users(user_id) ON DELETE SET NULL,  -- 소유자(NULL 허용: 미지정)
  label_no    INTEGER NOT NULL CHECK (label_no > 0),                  -- 스티커 번호(정수, UI 3자리 패딩)
  quantity    INTEGER NOT NULL CHECK (quantity >= 0),                 -- 수량(부분소비 시 0 허용)
  expires_on  DATE NOT NULL,                                          -- 유통기한(색상/D-Day는 클라 계산)
  memo        TEXT,                                                   -- 비고
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),                     -- 생성 시각
  removed_at  TIMESTAMPTZ,                                            -- 소프트 삭제/폐기 시각
  replaced_by_bundle_id BIGINT REFERENCES item_bundles(bundle_id) ON DELETE SET NULL, -- 교체 추적
  CHECK (replaced_by_bundle_id IS NULL OR removed_at IS NOT NULL)     -- 교체되면 원본은 제거 상태여야 함
);
-- 활성 라벨 유일성(번호 충돌 방지)
CREATE UNIQUE INDEX ux_item_label_active
  ON item_bundles(resource_id, label_no) WHERE removed_at IS NULL;

-- ---------------------------------------------------------
-- 4) 검사(Inspection) — 세션(≤2명) + 제출 후 결과 불변(UPDATE만 리비전)
--    * 세션: 자원 단위로 1개만 진행(IN_PROGRESS 고유 인덱스)
--    * 제출 후: INSERT/DELETE 차단, UPDATE는 리비전 테이블 적재 + 버전 증가
-- ---------------------------------------------------------
CREATE TABLE inspection_sessions (
  session_id   BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,    -- 세션 PK
  resource_id  BIGINT NOT NULL REFERENCES resources(resource_id) ON DELETE RESTRICT, -- 대상 자원(칸)
  started_by   BIGINT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT, -- 세션 개시자
  status       TEXT NOT NULL CHECK (status IN ('IN_PROGRESS','SUBMITTED','CANCELED')), -- 상태
  started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),                     -- 시작
  ended_at     TIMESTAMPTZ,                                            -- 종료(제출 시 필수)
  submitted_by BIGINT REFERENCES users(user_id) ON DELETE SET NULL,    -- 제출자
  submitted_at TIMESTAMPTZ                                             -- 제출 시각
);
-- 동일 자원(IN_PROGRESS) 세션 1건 제한 → 검사 중복 방지
CREATE UNIQUE INDEX ux_inspection_res_inprog
  ON inspection_sessions(resource_id) WHERE status='IN_PROGRESS';
-- 제출 상태 일관성(제출이면 제출/종료 시각 필수)
ALTER TABLE inspection_sessions
  ADD CONSTRAINT ck_submitted_has_ts
  CHECK (status <> 'SUBMITTED' OR (submitted_at IS NOT NULL AND ended_at IS NOT NULL));

CREATE TABLE inspection_participants (
  participant_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,  -- 참가자 PK
  session_id     BIGINT NOT NULL REFERENCES inspection_sessions(session_id) ON DELETE CASCADE,
  user_id        BIGINT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  seat_no        SMALLINT NOT NULL CHECK (seat_no IN (1,2)),           -- 좌석/역할 구분(최대 2명)
  joined_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, seat_no),                                        -- 좌석 중복 방지
  UNIQUE (session_id, user_id)                                         -- 동일 세션 중복 참여 방지
);

CREATE TABLE inspection_results (
  result_id     BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,   -- 결과 PK
  session_id    BIGINT NOT NULL REFERENCES inspection_sessions(session_id) ON DELETE CASCADE,
  bundle_id     BIGINT REFERENCES item_bundles(bundle_id) ON DELETE SET NULL, -- 미등록 폐기는 NULL 허용
  performer_participant_id BIGINT NOT NULL REFERENCES inspection_participants(participant_id) ON DELETE RESTRICT, -- 수행자
  action        TEXT NOT NULL CHECK (action IN ('PASS','WARNING','DISCARD','DISCARD_WITH_PENALTY')), -- 조치
  violation_type TEXT CHECK (violation_type IS NULL OR violation_type IN ('EXPIRED','NO_STICKER','PACKAGING_DEFECT','INFO_MISMATCH')), -- 위반
  note          TEXT,                                                  -- 비고(현장 메모)
  performed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),                    -- 수행 시각
  version       INTEGER NOT NULL DEFAULT 1,                            -- 변경 시 증가(감사)
  -- 규칙1: 미등록 폐기(=스티커 없음)일 때만 bundle_id NULL 허용
  CHECK (bundle_id IS NOT NULL OR violation_type='NO_STICKER')
);
-- 규칙2: PASS는 위반 없음, WARNING/DISCARD 류는 위반 필수
ALTER TABLE inspection_results
  ADD CONSTRAINT ck_action_violation
  CHECK (
    (action='PASS' AND violation_type IS NULL)
 OR (action='WARNING' AND violation_type IS NOT NULL)
 OR (action IN ('DISCARD','DISCARD_WITH_PENALTY') AND violation_type IS NOT NULL)
  );

-- 제출 후 UPDATE 감사(스냅샷/사유) 저장소
CREATE TABLE inspection_result_revisions (
  rev_id     BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,      -- 리비전 PK
  result_id  BIGINT NOT NULL REFERENCES inspection_results(result_id) ON DELETE CASCADE,
  session_id BIGINT NOT NULL,                                          -- 편의 저장(조인 용이)
  changed_by BIGINT REFERENCES users(user_id) ON DELETE SET NULL,      -- 수정자(앱에서 GUC로 주입)
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),                       -- 수정 시각
  reason     TEXT,                                                     -- 수정 사유(제출 후 필수)
  prev_row   JSONB NOT NULL,                                           -- 변경 전 전체 스냅샷
  new_row    JSONB NOT NULL                                            -- 변경 후 전체 스냅샷
);

-- [트리거] 제출 세션에는 INSERT/DELETE 금지 + UPDATE는 리비전 적재
--  • 앱은 SET LOCAL app.user_id / app.change_reason 로 수정자/사유 전달
CREATE OR REPLACE FUNCTION ensure_session_not_submitted()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE st TEXT;
BEGIN
  SELECT status INTO st
  FROM inspection_sessions
  WHERE session_id = COALESCE(NEW.session_id, OLD.session_id)
  FOR UPDATE;  -- 경합 창 최소화(동시에 제출되는 상황 방지)
  IF st='SUBMITTED' THEN
    RAISE EXCEPTION '이미 제출된 검사 세션입니다(결과 불변)';
  END IF;
  RETURN COALESCE(NEW, OLD);
END$$;

CREATE OR REPLACE FUNCTION trg_audit_ir_update()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_status TEXT; v_reason TEXT; v_user BIGINT;
BEGIN
  SELECT status INTO v_status FROM inspection_sessions WHERE session_id = NEW.session_id;
  v_reason := current_setting('app.change_reason', true);             -- 제출 후 수정 시 반드시 필요
  IF current_setting('app.user_id', true) IS NOT NULL THEN
    v_user := current_setting('app.user_id')::BIGINT;
  END IF;

  IF v_status='SUBMITTED' AND (v_reason IS NULL OR btrim(v_reason)='') THEN
    RAISE EXCEPTION '제출된 검사결과 수정에는 사유(app.change_reason)가 필요합니다';
  END IF;

  INSERT INTO inspection_result_revisions(result_id, session_id, changed_by, reason, prev_row, new_row)
  VALUES (OLD.result_id, OLD.session_id, v_user, v_reason, to_jsonb(OLD), to_jsonb(NEW));

  NEW.version := OLD.version + 1;  -- 버전 증가(낙관적 락/감사에 유용)
  RETURN NEW;
END$$;

DO $$BEGIN
  -- 제출 후 INSERT 금지
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_ir_block_ins') THEN
    CREATE TRIGGER trg_ir_block_ins BEFORE INSERT ON inspection_results
    FOR EACH ROW EXECUTE FUNCTION ensure_session_not_submitted();
  END IF;
  -- UPDATE 감사(리비전 적재)
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_ir_audit_upd') THEN
    CREATE TRIGGER trg_ir_audit_upd BEFORE UPDATE ON inspection_results
    FOR EACH ROW WHEN (OLD.* IS DISTINCT FROM NEW.*)
    EXECUTE FUNCTION trg_audit_ir_update();
  END IF;
  -- 제출 후 DELETE 금지
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_ir_block_del') THEN
    CREATE TRIGGER trg_ir_block_del BEFORE DELETE ON inspection_results
    FOR EACH ROW EXECUTE FUNCTION ensure_session_not_submitted();
  END IF;
END$$;

-- ---------------------------------------------------------
-- 5) 423 Locked 근거: 자원 논리 락
--    * 검사/운영 작업 중 일반 사용자 쓰기 차단을 UI/API에서 423으로 응답
--    * UNIQUE(resource_id) : 자원당 락 1개(보유자/사유/만료)
-- ---------------------------------------------------------
CREATE TABLE resource_locks (
  lock_id        BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,  -- 락 PK
  resource_id    BIGINT NOT NULL REFERENCES resources(resource_id) ON DELETE CASCADE,
  holder_user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT, -- 락 소유자
  reason         TEXT NOT NULL,                                        -- 예: 'INSPECTION_IN_PROGRESS'
  expires_at     TIMESTAMPTZ NOT NULL,                                 -- 만료 시각(유령 락 방지)
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(resource_id)                                                  -- 자원당 단일 락
);

-- ---------------------------------------------------------
-- 6) 벌점 — 원본 불변 + 조정 합산
--    * 원본은 비즈니스 결과(검사 제출)에 의해 생성 → UPDATE/DELETE 금지
--    * 조정은 관리 목적(+/-) → reason 필수
-- ---------------------------------------------------------
CREATE TABLE penalties_original (
  penalty_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,      -- 벌점 PK
  user_id    BIGINT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  inspection_result_id BIGINT REFERENCES inspection_results(result_id) ON DELETE SET NULL, -- 근거(선택)
  violation_type TEXT NOT NULL,                                        -- 위반 유형(예: 'EXPIRED')
  points    INTEGER NOT NULL,                                          -- 벌점(양수)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 원본 벌점은 수정/삭제 불가(감사 추적성)
CREATE OR REPLACE FUNCTION block_penalty_mutation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION '원본 벌점은 수정/삭제할 수 없습니다';
END$$;

DO $$BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_po_block_upd') THEN
    CREATE TRIGGER trg_po_block_upd BEFORE UPDATE ON penalties_original
    FOR EACH ROW EXECUTE FUNCTION block_penalty_mutation();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_po_block_del') THEN
    CREATE TRIGGER trg_po_block_del BEFORE DELETE ON penalties_original
    FOR EACH ROW EXECUTE FUNCTION block_penalty_mutation();
  END IF;
END$$;

CREATE TABLE penalties_adjustments (
  adj_id     BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,      -- 조정 PK
  user_id    BIGINT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  delta_points INTEGER NOT NULL,                                       -- 증감(+/-)
  reason     TEXT NOT NULL,                                            -- 사유(필수)
  created_by BIGINT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT, -- 작성자
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 사용자별 최종 점수(원본 합 + 조정 합)
CREATE OR REPLACE VIEW v_penalties_totals AS
SELECT u.user_id,
       COALESCE(SUM(po.points), 0)       AS original_points,
       COALESCE(SUM(pa.delta_points), 0) AS adjusted_points,
       COALESCE(SUM(po.points), 0) + COALESCE(SUM(pa.delta_points), 0) AS total_points
FROM users u
LEFT JOIN penalties_original  po ON po.user_id = u.user_id
LEFT JOIN penalties_adjustments pa ON pa.user_id = u.user_id
GROUP BY u.user_id;

COMMIT;
```