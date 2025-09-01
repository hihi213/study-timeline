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


# 10주 MVP로 “실제로 되는 것”

## 1) 인증·권한

* 로그인(JWT) / `/me`
* RBAC: `ADMIN / INSPECTOR / USER` 3역할 가드

## 2) 냉장고(칸 단위 자원) · 물품 관리

* 자원: `FRIDGE_COMP` 목록 조회(예: 냉장1/냉동1)
* 물품 등록/조회/검색

  * 라벨 번호(`label_no`) 자동/수동 사용, **활성 상태에서 (칸, 번호) 유일**
  * 전량 제거 후 **번호 재사용** 가능
* 물품 수정/제거

  * `:adjust`(수량/유통기한/메모), `:remove-all`(전량 제거)

## 3) 검사(Inspection) — **2인 세션 + 단일 제출**

* 세션 열기/참여/나가기(동일 칸 **진행 중 세션 1건** 제한)
* 검사 중 해당 칸은 일반 사용자 쓰기 **423 Locked**
* 조치 기록: `PASS / WARNING / DISCARD / DISCARD_WITH_PENALTY`

  * 규칙: **NO\_STICKER**일 때만 `bundle_id` 없이 폐기 가능
* **제출은 1회**(멱등), 제출 후 결과 **INSERT/DELETE 금지**, UPDATE는 **리비전 기록+버전 증가**

## 4) 벌점

* 제출 시 **원본 벌점** 자동 생성(불변: UPDATE/DELETE 차단)
* **조정 벌점**(+/-, 사유 필수)로 합산
* 집계 뷰 `v_penalties_totals`: 원본+조정 = 최종점수

## 5) 운영·품질(10주 범위)

* `/healthz`, `/readyz`, **구조화 로그 + `correlation_id`**
* OpenAPI 스냅샷/계약 테스트, E2E(15s 폴링)
* 충돌/경합 처리: 409/422/423 응답 정리
* 성능 목표: 샘플 부하 p95 < 300ms
* 간단 멱등: 주요 작성계에 `Idempotency-Key` 수용(Week 9)

## 6) DB 불변성으로 보장되는 핵심 제약

* (칸, 라벨번호) **활성 유일**
* 검사 세션: **자원당 진행 1건**, **참여자 최대 2명**
* 제출 후 결과 **불변**(+리비전)
* 423 근거용 **자원 논리 락**

---

# 10주 이후, 릴리스 단위로 확장되는 기능

## R1 하드닝①（v0.2.0）

* **멱등 저장소** 테이블 도입(요청해시/응답스냅샷/TTL)
* 429/409/423 에러 응답 표준화

## R2 알림 파이프라인（v0.3.0）

* **Outbox / DueTasks / DomainEvents**로 알림·예약 작업 처리
* 알림 센터(헤더 뱃지+목록), **유통기한 D-1 알림**(로그/배지)

## R3 세탁실 ① 기본 흐름（v0.4.0）

* 자원 타입 `WASHER/DRYER` 추가
* \*\*Allocations(USAGE)\*\*로 시작/완료, **시간 겹침 금지**
* 대시보드: “바로 사용 가능” 상단 그룹 + 진행바

## R4 세탁실 ② 현장 이슈（v0.5.0）

* **미등록 사용** 등록 → 시간 경과 시 자동 `AVAILABLE`
* **종료 5분 전 알림**(DueTask)
* **고장 신고** → `OUT_OF_SERVICE` 전환(운영 차단)

## R5 스터디룸 ① 예약（v0.6.0）

* 자원 타입 `STUDYROOM`
* **10분 슬롯 예약/취소**, **매주 월요일 오픈**(자동 생성)
* 타임라인 뷰

## R6 스터디룸 ② 운영（v0.7.0）

* **합석 플래그**, **관리자 강제예약**, 블록 휴무

## R7 도서관 ① 대출（v0.8.0）

* 자원 타입 `BOOK` + **LOAN/RESERVATION**
* 반납 D-3 알림, **연체 시 벌점 원본 자동 적재**

## R8 권한 확장（v0.9.0）

* `floors / dorm_rooms / zones / user_zone_assignments / stays`
* **층/존 기반 권한**으로 검사·자원 접근 제어

## R9 관측·감사·운영（v0.10.0）

* **activity\_logs**(append-only)
* 간단 운영 대시보드(에러율/알림 실패/지연)

## R10 보안·PWA 폴리싱（v0.11.0）

* **토큰 버전 무효화**, **JWKS 키 회전**
* PWA 오프라인 캐시(핵심 화면), 설치 프로프트/푸시(옵션)

---

## 사용자/운영자 관점 최종 그림

* **입주자**: 로그인 → 냉장고 물품 등록/조회/관리 → 세탁기 사용/대기/알림 → 스터디룸 예약 → 도서 대출/알림 → 마이페이지에서 이용/벌점 확인
* **검사자(층별장)**: 칸별 검사 세션 개시/참여(동시 2인) → 조치 → 단일 제출(사유 포함 수정 이력)
* **관리자**: 자원 상태/고장/휴무 관리, 벌점 조정, 강제예약, 권역(층/존) 권한 부여, 알림/작업 모니터링


# 졸프 10주계획


## 범위 확정(이번 MVP에서 **의도적 제외**)

* Outbox/DueTasks/Domain Events(알림·스케줄 파이프라인)
* Allocations(세탁/스터디룸/도서관 예약·사용 공통)
* Floors/Rooms/Zones/Stays(세밀 권한/거주 모델)
* ActivityLogs(DB append-only 로그), Idempotency Store 정식 테이블

## 지연 시 컷 스위치

* 먼저 컷: Week 3 `available-numbers` API, Week 7 일부 프론트 폴리싱
* 반드시 유지: **2인 검사 / 423 락 / 단일 제출 / 벌점 원본+조정 / 에러 카탈로그 / OpenAPI 계약**

## 주간 공통 루틴

* [ ] ADR 1건 이상 병합(이번 주 결정)
* [ ] 마이그레이션 적용/롤백 검증
* [ ] Swagger/OpenAPI 최신화 + 스냅샷 업데이트
* [ ] 스모크 스크립트(health/login/me) 녹색 확인
* [ ] 구조화 로그에 `correlation_id` 확인

## Day 0 — 환경·ADR·관측 베이스 (6–8h)

**Infra & 설정**

* [ ] `docker-compose`로 DB 기동, `make dev` 원클릭
* [ ] `application-{local,dev,prod}.yml`(또는 `.env.*`) 분리
* [ ] 서버/DB 타임존 정책 고정(UTC 저장, KST 표시)

**관측가능성**

* [ ] `/healthz`(liveness), `/readyz`(readiness)
* [ ] 구조화 로그(JSON) + `correlation_id` 주입(요청→응답 전파)
* [ ] 요청/응답 샘플 로거(민감정보 마스킹)

**문서/계약**

* [ ] `API.yaml` 골격(로그인/리소스/아이템/검사/벌점)
* [ ] 에러 카탈로그 + 공통 에러 스키마(RFC7807 스타일)
* [ ] ADR #001: 인증 토큰 방식(JWT) / #002: 라벨 번호 정책

**DB**

* [ ] `V000__baseline.sql` 적용(MVP-라이트 DDL: `users/resources/item_bundles/inspection_* / penalties_* / resource_locks`)

**Gate/DoD**

* [ ] `compose up` → 서버 기동 & Swagger/Redoc 열람
* [ ] 스모크 3콜: `POST /auth/login` / `GET /healthz` / `GET /me` 200 OK

---

## Week 1 — 로그인 최소 + RBAC + 계약테스트 (6–9h)

**백엔드**

* [ ] `/auth/login`(JWT Access), `/me`
* [ ] RBAC 가드(ADMIN/INSPECTOR/USER) 미들웨어

**보안 라이트**

* [ ] CORS 허용 도메인 설정
* [ ] 보안 헤더(Helmet류) 적용
* [ ] 단순 브루트포스 방지(아이디당/아이피당 쿨다운)

**테스트/계약**

* [ ] OpenAPI 스냅샷 계약테스트(로그인/권한)

**Gate/DoD**

* [ ] 권한 밖 호출 403
* [ ] `/readyz` 503 조건(미마이그/필수 env 미설정) 동작
* [ ] 계약테스트 녹색

---

## Week 2 — 리소스+아이템 등록/조회(MVP) (6–9h)

**DB**

* [ ] `resources(type='FRIDGE_COMP')` 시드(예: 냉장1/냉동1)
* [ ] `item_bundles` 인덱스/부분 유니크 확인
  → `(resource_id, label_no) WHERE removed_at IS NULL`

**API**

* [ ] `GET /resources?type=FRIDGE_COMP` (목록)
* [ ] `POST /items`(등록) / `GET /items?mine|resource|q`

**문서**

* [ ] D-Day(색상) 클라이언트 계산 규칙 명시

**Gate/DoD**

* [ ] 활성 상태 번호 중복 시 409
* [ ] 제거(removed\_at) 후 동일 번호 재사용 OK
* [ ] OpenAPI 예시/상태코드 반영 + 스냅샷 녹색

---

## Week 3 — 번호 충돌/이동 UX + 기본 로깅 (6–9h)

**API**

* [ ] `POST /items/{id}:adjust`(수량/만료/메모 변경)
* [ ] `POST /items/{id}:remove-all`(전량 제거)
* [ ] (선택) `GET /items/available-numbers?resource=...`

**관측**

* [ ] 요청 요약+결과 코드 애플리케이션 로그(append)

**Gate/DoD**

* [ ] 교체 플로우: `remove-all → create`로 번호 유지
* [ ] 번호 충돌/재시도 응답 메시지 가이드 문서화

---

## Week 4 — 2인 검사 세션(칸 단위) + 423 락 (7–9h)

**API**

* [ ] `POST /inspections/open`(resource 단위)
* [ ] `POST /inspections/{id}/join|leave`
* [ ] 검사 중인 resource에 대해 일반 사용자 쓰기 요청 423

**규칙**

* [ ] 참가자 최대 2명(DB 유니크로 보조)
* [ ] 동일 자원 진행 세션 1건 제한(인덱스)

**Gate/DoD**

* [ ] 3번째 참여 시 409/422
* [ ] 세션 중 해당 자원 `POST /items` 등 쓰기 423

---

## Week 5 — 조치 기록 + **단일 제출** → 원본 벌점 (7–9h)

**API**

* [ ] `POST /inspections/{id}/actions`
  (PASS/WARNING/DISCARD/DISCARD\_WITH\_PENALTY)
* [ ] `POST /inspections/{id}/submit`(제출자 1명, 멱등키 허용)

**DB**

* [ ] `inspection_result_revisions` 트리거 확인(제출 후 UPDATE 감사)
* [ ] `penalties_original` 자동 생성 연결

**Gate/DoD**

* [ ] 제출 후 세션 상태 SUBMITTED, 재제출 시 멱등 동일 응답
* [ ] 원본 벌점 생성/검증

---

## Week 6 — 벌점 **조정** + 뷰 집계 (6–8h)

**API**

* [ ] `POST /penalties/adjustments`(+/-, 사유 필수)
* [ ] `GET /penalties?user|period`

**Gate/DoD**

* [ ] 최종 점수 = 원본 합 + Σ조정 합 정확
* [ ] 원본 벌점 UPDATE/DELETE 차단 정책/권한 검증

---

## Week 7 — 프론트 MVP 흐름(검사 포함) + 423 UX (7–9h)

**UI(PWA)**

* [ ] 로그인 → 내 아이템 등록/조회 → 검사 참여(2인) → 제출 → 벌점 조회
* [ ] 검사 중 칸 쓰기 시도 시 423 UX(토스트/다이얼로그)

**문서**

* [ ] “현장 스티커 규칙(칸라벨+3자리)” 안내 모달/도움말

**Gate/DoD**

* [ ] 1분 데모 플로우에서 423/409/422 등 오류 핸들링 확인

---

## Week 8 — 계약 리그레션 + E2E(폴링) (6–9h)

**테스트**

* [ ] 주요 경로 E2E: 등록→이동→검사→조치→제출→벌점
* [ ] OpenAPI 스냅샷 재검증(리그레션)

**실시간 대체**

* [ ] 15s 폴링(신규 검사/조치/제출 반영), SSE/푸시는 플래그 Off

**Gate/DoD**

* [ ] E2E 시나리오 **끊김 없이 성공**

---

## Week 9 — 견고화(경합·성능·보안 라이트) (6–9h)

**동시성/멱등**

* [ ] 등록/제출/조치에 `Idempotency-Key` 수용(서버 캐시 기반 간단 멱등)
* [ ] 유니크 충돌(번호/참여/세션) 처리·재시도 전략 문서화

**보안/성능**

* [ ] 레이트리밋(사용자별 5분 N회, 429 + Retry-After)
* [ ] 샘플 부하: p95 < 300ms 목표(10→30 rps)

**Gate/DoD**

* [ ] 동시 등록 409 정상, 중복 제출 동일 응답
* [ ] 성능 측정치 기록

---

## Week 10 — 폴리싱·문서·릴리즈 (6–8h)

**문서/데모**

* [ ] README(아키텍처/ERD/시퀀스/실행가이드)
* [ ] ADR 정리/변경로그, Runbook(헬스/락/오류 대응)
* [ ] 1분 데모 영상 & Postman/Bruno 컬렉션

**릴리즈**

* [ ] 태그 `v0.1.0-mvp`
* [ ] 롤백 리허설(마이그/이미지)

**Gate/DoD**

* [ ] 스모크 3콜/계약/E2E 전부 녹색
* [ ] 검사/벌점/락 규칙 최종 점검

---


# 10주이후 계획

## 공통 배포 수칙 (모든 릴리스에 적용)

* **마이그 전략**: 확장(컬럼/테이블 추가) → 백필(데이터 채움) → 전환(코드 사용) → 수축(구조 삭제).
* **피처 플래그**: 새 기능은 기본 Off → 카나리(내 계정/관리자) → 전원 온.
* **롤백**: DB 다운 마이그 없음(가능하면). 코드 롤백 즉시 가능.
* **SLO**: p95 < 300ms, 알림 실패율 < 1%, 워커 재시도 < 3회 평균.

## 추천 브랜치/버전 운영

* `main`: 항상 배포 가능 상태.
* `release/x.y.z`: 릴리스 준비→태깅.
* 태그: `v0.2.0`(R1) … `v0.11.0`(R10) … 필요 시 hotfix `v0.11.1`.

## 우선순위/시간이 빠듯할 때 컷 스위치

* 먼저 컷: 스터디룸 합석(R6), 도서 연장/예약 일부(R7), 푸시 알림(R10).
* 반드시 유지: 멱등(R1), 알림 파이프라인(R2), 세탁/스터디룸의 **겹침 금지**(R3/R5), 벌점 연계(R7).

## R1 — 하드닝 ① (v0.2.0, 1\~2주)

**목표**: 안정성·보안 기초를 올리고, 이후 기능 개발의 안전망 확보.

* DB

  * `idempotency_store` 테이블 도입(요청해시·응답스냅샷·TTL).
* API·UI

  * 작성계 API들(Idempotent): 등록/조치/제출에 `Idempotency-Key` 수용.
  * 429/409/423 에러 메시지 표준화.
* 테스트

  * 중복 제출 재현 → 동일 응답 스냅샷 반환 확인.
  * 경합(동시 라벨 생성/동시 제출) 테스트.
* Gate/DoD

  * 재시도/중복 요청에 서버가 **멱등 응답**. p95 < 300ms 유지.
* 컷 스위치

  * 스토어 TTL 축소(기능은 유지).

---

## R2 — 알림 파이프라인(Outbox + DueTasks) (v0.3.0, 1\~2주)

**목표**: 알림·예약성 작업을 안전하게 운영.

* DB

  * `outbox`, `due_tasks`, `domain_events` 추가.
* API·워커

  * 워커 스텁(READY→SENT, 재시도/백오프).
  * 이벤트 적재: 검사 제출 시 `Fridge.InspectionSubmitted.v1` 큐잉.
  * DueTask 샘플: 유통기한 D-1 알림(로그만, 푸시는 플래그 Off).
* UI

  * 알림 센터(헤더 드롭다운) 1차: 읽지 않음 카운트 + 관련 화면 딥링크.
* 테스트

  * Outbox 멱등키(dedup\_key) 중복 방지. 실패 재시도 로깅.
* Gate/DoD

  * 제출→outbox 적재→워커 로그 **SENT** 확인.
* 컷 스위치

  * D-1 규칙만 먼저, 복합 규칙은 보류.

---

## R3 — 세탁실 ①(기본 사용/완료) (v0.4.0, 1\~2주)

**목표**: 최소 세탁실 흐름. “지금 사용 가능/사용 중/완료”만.

* DB

  * `resources.type`에 `WASHER`,`DRYER` 허용.
  * `allocations` 도입(RESERVATION/USAGE/LOAN 중 USAGE만 사용), EXCLUDE로 시간 겹침 금지.
* API

  * `GET /laundry/devices`(상태), `POST /laundry/{id}:start|finish`.
  * 완료 후 자동 `AVAILABLE` 전환(서버 타임아웃은 R4로).
* UI

  * 대시보드에 “바로 사용 가능” 상단 그룹 + 진행바.
* 테스트

  * 동시 시작 → EXCLUDE로 409.
* Gate/DoD

  * 1대 장비에서 동시 2사용 불가, 흐름: 사용 시작→완료 정상.
* 컷 스위치

  * 진행률/타이머는 단순 카운트다운.

---

## R4 — 세탁실 ②(미등록 사용/종료 알림/고장 신고) (v0.5.0, 1\~2주)

**목표**: 현장 이슈 처리 UX.

* DB

  * 없음(기존 `allocations` 재사용). 고장신고는 `resources.status=OUT_OF_SERVICE`.
* API/UI

  * `UNAUTHORIZED_USE` 등록(서버는 DueTask로 일정시각에 `AVAILABLE` 복귀).
  * 종료 5분 전 알림 DueTask 생성.
  * `POST /laundry/{id}:report-error` → 관리자만 `OUT_OF_SERVICE` 전환.
* 테스트

  * 미등록 사용 타임아웃 복귀, 종료 알림 outbox 전송.
* Gate/DoD

  * 알림 로그로 확인(SENT). 오류 신고 시 예약/사용 차단.
* 컷 스위치

  * 알림은 웹푸시 대신 배지/헤더 카운트만.

---

## R5 — 스터디룸 ①(주간 오픈/10분 슬롯) (v0.6.0, 1\~2주)

**목표**: 주간 예약 오픈과 기본 예약/취소.

* DB

  * `resources.type='STUDYROOM'` 시드. `allocations`에서 `RESERVATION` 사용.
* API

  * `POST /studyrooms/reservations`(10분 단위), `DELETE /.../{id}`.
  * 매주 월요일 09:00 자동 오픈(DueTask로 슬롯 생성 or on-demand 생성).
* UI

  * 타임라인 뷰(일/주), 내 예약 강조.
* 테스트

  * 겹침 예약 409, 오픈 타이밍 드리프트 허용 범위 문서화.
* Gate/DoD

  * 동일 시간대 이중 예약 불가, 타임라인에서 즉시 반영.
* 컷 스위치

  * 합석/강제예약은 R6로 연기.

---

## R6 — 스터디룸 ②(합석/강제예약/운영) (v0.7.0, 1주)

**목표**: 운영 편의 + 합석 시나리오.

* DB

  * 필요 시 `reservation_meta`(合석 여부) 경량 테이블.
* API/UI

  * 합석 플래그, 관리자 강제예약, 블록 휴무.
* 테스트/Gate

  * 합석 중복 규칙, 강제예약 우선순위.

---

## R7 — 도서관 ①(대출/반납/예약) (v0.8.0, 1\~2주)

**목표**: 최소 도서 흐름.

* DB

  * `resources.type='BOOK'`; `allocations.kind=LOAN/RESERVATION` 사용.
  * 연체 벌점: `penalties_original` 소스 `BOOK_OVERDUE` 추가.
* API/UI

  * 상세 팝업에서 대출/반납/연장/예약 원스톱.
* 테스트/Gate

  * 반납 D-3 알림 DueTask, 연체 시 벌점 원본 자동 적재.

---

## R8 — 권한 확장(층/거주/검사 권역화) (v0.9.0, 1\~2주)

**목표**: 운영 권한을 실제 공간 단위로.

* DB

  * `floors / dorm_rooms / zones / user_zone_assignments / stays` 추가.
  * `/me`에 `zones[]` 포함.
* API

  * 검사/자원 조회는 zone 기반 필터.
* 테스트/Gate

  * 층별장 권한 범위를 벗어난 조작 403.

---

## R9 — 관측·감사·운영 (v0.10.0, 1주)

**목표**: 운영자가 믿고 쓸 수 있게.

* DB

  * `activity_logs`(append-only).
* 운영

  * 요청 요약+결과 코드 로그 → 대시보드(간단 표/차트).
  * 알림 실패율/지연 메트릭, p95 라우팅.
* Gate/DoD

  * 장애 재현 시 런북 절차로 복구(로그로 원인 추적 가능).

---

## R10 — 보안·PWA 폴리싱 (v0.11.0, 1주)

**목표**: 마무리 품질.

* 보안

  * 토큰 버전 무효화(권한 변경 즉시), JWKS(키 회전), 더 강한 레이트리밋.
* PWA

  * 오프라인 캐시(필수 뷰), 설치 프로프트, 푸시(필요 시).
* Gate/DoD

  * 오프라인 상태에서 조회 화면 캐시 동작, 키 회전 리그레션 OK.

---
