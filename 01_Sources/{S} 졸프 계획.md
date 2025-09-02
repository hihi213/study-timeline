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


# MVP 10주 기능 정리

## 1) 인증 · 권한

* 이메일/비밀번호 로그인(**JWT**), `/me` 프로필
* **RBAC** 3역할: `ADMIN / INSPECTOR / USER`
* 권한 밖 요청은 403, 비활성 사용자 로그인 차단

## 2) 자원(냉장칸) · 물품 관리

* 자원 타입: `FRIDGE_COMP` 목록 조회(예: 냉장1/냉동1)
* 물품 등록/조회/검색

  * 라벨 번호(`label_no`) 자동/수동
  * **활성 상태에서 (resource\_id, label\_no) 유일**
  * 전량 제거(`removed_at`) 후 **번호 재사용 가능**
* 물품 변경

  * `:adjust`(수량/유통기한/메모), `:remove-all`(전량 제거)

## 3) 검사(Inspection) — **2인 세션 + 단일 제출**

* 세션 열기/참여/나가기

  * **동일 자원 진행 세션 1건 제한**
  * 세션 참가자 **최대 2명**
* 검사 중 해당 자원에 일반 사용자 쓰기 요청 시 **423 Locked**
* 조치 기록: `PASS / WARNING / DISCARD / DISCARD_WITH_PENALTY`

  * **NO\_STICKER**일 때만 `bundle_id` 없이 폐기 가능
* **제출 1회(멱등)**, 제출 후 결과 불변

  * INSERT/DELETE 금지, UPDATE 시 **리비전 기록 + 버전 증가**

## 4) 벌점

* 제출 시 **원본 벌점** 자동 생성(UPDATE/DELETE 차단)
* **조정 벌점**(+/-, 사유 필수) 등록
* 집계 뷰 `v_penalties_totals`로 **최종 점수** 제공

## 5) 실시간(**SSE**)

* 클라이언트: `EventSource` 기반, **자동 재연결 + Last-Event-ID**
* 대표 이벤트 스트림

  * `items.created/updated/removed/adjusted`
  * `inspection.opened/joined/left/locked/action_recorded/submitted`
  * (선택) `penalties.adjusted`
* 역프록시/서버 튜닝: 하트비트, 타임아웃, 버퍼링 Off

## 6) 운영 · 품질

* 헬스체크: `/healthz`, `/readyz`
* 구조화 로그(JSON) + `correlation_id` 전파
* **OpenAPI 스냅샷/계약 테스트**, E2E(SSE 포함)
* 충돌/경합 응답 표준화: `409/422/423`
* **간단 멱등**: 주요 작성계에 `Idempotency-Key` 수용(10주 내 도입)
* 성능 목표: 샘플 부하 **p95 < 300ms**

## 7) 데이터 무결성(핵심 제약)

* `item_bundles` : **(resource\_id, label\_no) 활성 유니크**
* `inspection_sessions` : **자원당 진행 1건**
* `inspection_participants` : **세션당 최대 2명**
* 제출 후 결과 **불변**(+리비전)
* `resource_locks` : **자원당 1개 논리 락**(423 근거)

## 8) 사용자/역할별 시나리오

* **입주자(USER)**: 로그인 → 내 물품 등록/조회/수정/제거(실시간 반영) → 검사 중 칸 쓰기 시 423 피드백 → 벌점 조회
* **검사자(INSPECTOR)**: 칸별 세션 열기/참여(동시 2인) → 조치 기록 → **단일 제출**(사유 포함 수정 이력 보존)
* **관리자(ADMIN)**: 자원 관리/락 해제, 벌점 조정, 기본 운영 점검

## 9) 의도적 제외(10주 이후로 이관)

* **PWA + Web Push(FCM/VAPID)**, 백그라운드 알림
* 세탁/스터디룸/도서관 공통 예약(`allocations`)
* 공간 모델(층/방/존/거주), append-only `activity_logs`
* 정식 `idempotency_store`, Outbox/DueTasks/DomainEvents



# 10주 이후 추가 기능 정리

## A. 실시간/알림 체계

* **PWA + Web Push 도입**: Service Worker, 구독/해지 API, 구독 만료 정리(job)
* **iOS 사파리 안내**: 홈 화면(PWA) 추가 조건/권한 UX
* **알림 파이프라인**: `outbox / due_tasks / domain_events` + 워커(재시도/백오프/멱등키)
* **알림 센터**: 헤더 배지·목록·딥링크, 읽음 처리
* **규칙 예시**: 유통기한 D-1, 세탁 종료 5분 전, 예약 확정/취소, 연체 발생 등

## B. 자원 예약/사용(Allocations) 계층

* **공통 모델 도입**: `allocations(kind=RESERVATION|USAGE|LOAN)` + 시간 겹침 EXCLUDE
* **세탁실 v1**: 사용 시작/완료, 동시 사용 금지, 진행바
* **세탁실 v2**: 미등록 사용 타임아웃 복귀, 종료 5분 전 리마인더, 고장 신고→`OUT_OF_SERVICE`
* **스터디룸 v1**: 주간 오픈(10분 슬롯), 예약/취소, 타임라인 뷰
* **스터디룸 v2**: 합석 옵션, 관리자 강제예약, 블록 휴무
* **도서관 v1**: 대출/반납/연장/예약, 반납 D-3 알림, **연체 벌점 원본** 자동 적재

## C. 권한/공간 모델

* **공간 테이블 추가**: `floors / dorm_rooms / zones / user_zone_assignments / stays`
* **존 기반 접근제어**: 목록/검사/예약/대출이 존 필터를 통과해야 함
* **운영 화면**: 존/층 배정·변경, 권역 이동 시 즉시 반영

## D. 보안/신뢰성 강화

* **멱등 저장소**: `idempotency_store`(요청 해시·응답 스냅샷·TTL)
* **레이트리밋 고도화**: 사용자/엔드포인트·버스트 제어
* **토큰 보안**: 토큰 버전 무효화(권한 변경 즉시), **JWKS 키 회전**
* **로그/감사**: `activity_logs`(append-only), 고위험 액션 이중 확인(추가)
* **SSE 운영값**: 하트비트/타임아웃/동시 연결 제한·모니터링

## E. PWA 품질

* **오프라인 캐시**(핵심 조회 뷰), 설치 프로프트
* **푸시 구독 위생**: 410 Gone/만료 구독 정리, 백오프/재시도 전략
* **딥링크 라우팅**: 푸시 탭 시 대상 화면으로 이동

## F. 관측/운영

* **대시보드(라이트)**: 에러율, SSE 커넥션 수, 워커 큐 길이, 알림 실패율/지연
* **런북**: 알림 지연/실패·락 해제·키 회전·슬롯 재생성 절차
* **성능 목표**: p95 < 300ms 유지, 알림 실패율 < 1%

## G. 데이터/마이그 전략

* **확장→백필→전환→수축** 원칙으로 순차 반영
* **리소스 라벨 정책 전환**: (전역 유일 → 층/냉장고 스코프 유일)로 마이그 문서화
* **백업/복구 리허설** 정례화

---

### 산출물/엔드포인트 예시(증가분)

* `POST /push/subscriptions` / `DELETE /push/subscriptions/{id}`
* `GET/POST /outbox`(운영 조회용), 워커 내부 전용 큐 처리
* `POST /laundry/{id}:start|finish|report-error`
* `POST /studyrooms/reservations` / `DELETE /.../{id}` / `POST /studyrooms:open-slots`
* `POST /library/loans` / `POST /library/loans/{id}:return|extend`
* `GET /zones` / `POST /zones/assignments`

---

### 요약

* **포그라운드 실시간 = SSE 유지**, \*\*백그라운드 알림 = PWA+Web Push(FCM/VAPID)\*\*로 이원화.
* **Allocations**와 **공간/권한**을 “추가만으로” 붙일 수 있게 현재 스키마를 존중.
* 운영 신뢰성(멱등/워크플로/감사)과 보안을 릴리스별로 점진 강화.






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