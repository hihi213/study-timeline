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


# 10주 MVP 기능 정리 (기능 설명만)

## 1) 인증·권한

* **로컬 로그인**: 아이디/비밀번호로 로그인, 짧은 수명의 액세스 토큰 발급.
* **내 정보 조회**: 로그인 상태/역할 확인.
* **역할 가드**: `ADMIN / INSPECTOR / USER`별 접근 제어.
* **계정 상태**: 비활성 계정 로그인 차단.
* **간단 브루트포스 완화**: 로그인 실패 횟수 제한 및 쿨다운.

## 2) 자원(냉장 칸)·물품 관리

* **칸 목록 조회**: 현재 운영 상태(사용 가능/고장) 포함.
* **물품 등록**: 칸과 라벨 번호로 등록(라벨 번호는 활성 중 중복 불가).
* **물품 검색/필터**: 내 물품, 특정 칸, 키워드로 조회.
* **물품 변경**:

  * `수정(adjust)`: 수량, 유통기한, 메모 갱신.
  * `전량 제거(remove-all)`: 폐기/소진 처리 후 라벨 번호 재사용 가능.
* **번호 충돌 가이드**: 라벨 번호 중복 시 표준 오류 + UI 가이드.

> 참고: **개별 아이템마다 다른 이름/유통기한**은 **포스트-MVP**에서 제공(이번 MVP는 “묶음/공통명/공통 유통기한” 모델).

## 3) 검사(Inspection) — **2인 세션 + 단일 제출**

* **세션 열기/참여/나가기**: 한 칸에는 동시에 **진행 중 세션 1개**만 존재.
* **동시 참여 인원**: 최대 2명(3번째는 거절).
* **검사 중 쓰기 차단**: 해당 칸에 일반 등록/변경 요청이 오면 **423 Locked**로 거절.
* **조치 기록**: `PASS / WARNING / DISCARD / DISCARD_WITH_PENALTY`

  * 스티커 없는 물품은 ‘미등록 폐기’로 기록 가능.
* **제출(멱등)**: 한 번 제출하면 결과는 **불변**(수정 시 변경 이력과 사유 필수).

## 4) 벌점

* **원본 벌점 자동 생성**: 검사 **제출 시** 위반 결과에 따라 자동 반영(수정/삭제 불가).
* **조정 벌점**: 운영자가 +/- 조정(사유 필수).
* **집계 조회**: 원본 합 + 조정 합 = **최종 점수** 제공(사용자별/기간별).

## 5) 실시간(포그라운드 = **SSE**)

* **단일 SSE 엔드포인트**: 자동 재연결, 하트비트, `Last-Event-ID` 지원(유실 복구).
* **대표 이벤트**:

  * 물품: `items.created / items.updated / items.removed`
  * 검사: `inspection.opened / joined / left / locked / action_recorded / submitted`
  * (선택) 벌점: `penalties.adjusted`
* **연결 제한**: 사용자당 동시 연결 수 제한(1–2개 권장).

## 6) 오류·경합 처리(클라이언트 UX 기준)

* **표준 오류 본문**: 필드/사유/재시도 힌트 포함.
* **409/422/423/429** 사용:

  * 409: 상태 충돌(예: 라벨 번호 중복, 동시 변경)
  * 422: 규칙 위반(입력은 형식상 맞지만 의미가 안 맞음)
  * 423: 해당 칸이 검사 중이라 쓰기 금지
  * 429: 요청 과다(잠시 후 재시도)
* **요청 멱등성(작성계)**: 중복 제출에 대해 같은 결과를 안전히 반환(간이 방식).

## 7) 보안 베이스라인(파일럿 운영에 충분)

* **전송 보안**: HTTPS/HSTS, 보안 헤더(CSP 라이트 등).
* **입력 검증**: 요청 바디/쿼리 스키마 검증, 페이로드 크기 제한.
* **레이트리밋**: 사용자/IP 기준 윈도우 제한, 로그인 실패 쿨다운.
* **민감정보 마스킹 로그**: 토큰/비번/이메일 일부 마스킹.
* **상태 엔드포인트**: `/healthz`, `/readyz`.

## 8) 운영·관측

* \*\*구조화 로그(JSON)\*\*와 `correlation_id` 전파(요청→응답→SSE).
* **간단 문서 세트**: OpenAPI 스냅샷, 에러 카탈로그, 운영 런북(락/오류 대응).
* **성능 가이드**: 샘플 부하 p95 < 300ms 목표.

## 9) 핵심 사용자 여정

* **입주자**: 로그인 → 칸 선택 → 물품 등록/조회/관리 → 실시간 반영 확인 → 검사 결과·내 벌점 보기
* **검사자**: 세션 개시/참여(2인) → 조치 기록 → 단일 제출 → 벌점 자동 반영 확인
* **관리자**: 칸 상태(사용/고장) 관리, 벌점 조정

## 10) 포스트-MVP로 이관(명확한 비범위)

* **Items v2**: 묶음/개별 분리(개별 아이템별 **이름/유통기한/제거시각**), UI “개별 변경” 정식 도입.
* **알림 파이프라인**: 만료 D-1, 종료 5분 전 등 예약/재시도 워커.
* **PWA + Web Push**: 백그라운드 알림 및 오프라인 읽기.
* **권역 권한**: 층/존/거주 기반 접근 제어.
* **감사 로그/키 회전/정식 멱등 저장소** 등 하드닝.

---

## 10주 타임라인(기능 관점 요약)

* **Day 0**: 환경/헬스체크/기본 문서 + SSE 베이스(hello 수신)
* **W1**: 로그인/권한/보안 헤더/쿨다운 + SSE 인증 흐름
* **W2**: 칸/물품 등록·조회 + 물품 이벤트 실시간 반영
* **W3**: 물품 변경(adjust/remove-all) + 번호 충돌 UX
* **W4**: 2인 검사 세션 + 검사 중 쓰기 423 락 + 이벤트
* **W5**: 조치 기록 + **단일 제출(멱등)** + 벌점 자동 생성
* **W6**: 벌점 조정/집계 조회
* **W7**: 전체 플로우 UI 통합 + SSE 안정화(유실 복구/단일 탭 연결)
* **W8**: 계약 회귀/ E2E(실시간 포함)
* **W9**: 경합/성능/보안 라이트 하드닝
* **W10**: 폴리싱/문서/릴리즈(데모·런북 포함)


# 10주 이후 기능 정리(최종)

## 공통 원칙

* **포그라운드 = SSE / 백그라운드 = Web Push**(PWA 서비스워커).
* **기능 플래그 + 카나리** → 점진적 롤아웃, 즉시 롤백 가능.
* **확장 → 백필 → 전환 → 수축**의 점진 이행(사용자 경험 끊김 최소화).
* **호환 계층 유지**: 기존 API는 일정 기간 읽기 가능(또는 리디렉션), 새 API 병행.

---

## R1 — 하드닝 ① (성능·신뢰성·기본 보안)

**목표:** 안정화 기반 깔기.

* **멱등성 강화**: 작성계 요청에 Idempotency-Key 수용, 중복 제출 동일 응답.
* **레이트리밋 세분화**: 사용자·엔드포인트·버스트별 제한.
* **에러 카탈로그 확정**: 409/422/423/429 메시지 일관화.
* **SSE 관측**: 현재 연결 수, 하트비트, 전송 지연 지표 대시보드.
* **DoD:** p95 유지·중복제출 재현 테스트 통과·SSE 누수 0.

## R2 — 알림 파이프라인 (이벤트→큐→전송)

**목표:** 예약/재시도 가능한 알림 흐름.

* **워커**: 준비→전송→확정, **재시도/백오프/중복 억제**.
* **알림센터 UI**: 헤더 배지/목록/읽음 처리, 딥링크.
* **사용 시나리오**: 유통기한 D-1, 검사 결과 알림.
* **SSE/푸시**: 포그라운드(SSE 배지), 백그라운드(Push).
* **DoD:** 실패 재시도·중복 억제 동작 로그로 확인.

## R3 — PWA + Web Push

**목표:** 앱 같은 사용감과 백그라운드 도달성.

* **PWA 설치/오프라인(읽기 핵심 화면)**, **서비스워커** 캐시 전략.
* **푸시 구독/해지 UX**, 만료 구독 정리, 권한 프롬프트 설계.
* **iOS 가이드**: 홈 화면 추가(지원 버전 안내).
* **딥링크**: 푸시 탭 시 대상 화면 진입.
* **DoD:** 포그라운드=SSE, 백그라운드=Push 양방향 검증.

## R4 — **Items v2** (개별 아이템: 이름/유통기한/제거시각)

**목표:** 묶음 내 개별 단위까지 정밀 관리.

* **기능**

  * 등록 시 **묶음명 + 수량** 입력 → 기본값으로 개별 항목 생성.
  * **개별 변경 UI**: 각 아이템별 이름/유통기한 수정, 부분 폐기/소진.
  * 목록/상세에서 **개별 단위 D-Day/상태** 표시.
* **API**

  * “묶음” 단위 엔드포인트는 **호환 모드(읽기/요약)** 유지.
  * 신규 “개별 단위” 엔드포인트 도입(조회/수정/부분제거).
  * SSE 이벤트 키를 **묶음ID/개별ID**로 명확화.
* **이행(무중단)**

  * **섀도우-쓰기/백필** → 새 API 병행 → 프론트 전환 → 구 API 수축.
* **DoD:** 기존 데이터/신규 데이터 혼재 상황에서 UI/실시간 정확 동작.

## R5 — 세탁실 ① (기본 사용/완료)

**목표:** 사용 시작/종료 흐름.

* **기능**: 사용 시작, 진행 상태 표시, 완료 처리.
* **충돌 방지**: 동일 장비 **동시 사용 불가**, 409 처리.
* **실시간/푸시**: 시작/완료 이벤트 반영, 종료 임박 배지(옵션).
* **DoD:** 동시 시작 차단·진행바 UI 정확.

## R6 — 세탁실 ② (현장 이슈 대응)

**목표:** 운영 편의/사고 대응.

* **미등록 사용** 신고 → 일정 시간 후 자동 복귀.
* **종료 5분 전 알림**(Push 권한 허용 시).
* **고장 신고/조치**: OUT-OF-SERVICE 전환 시 사용 차단.
* **DoD:** 자동 타임아웃·알림 정상, 운영 화면에서 상태 전환 가능.

## R7 — 스터디룸 ① (예약/취소)

**목표:** 타임슬롯 예약.

* **기능**: 10분 슬롯 예약/취소, 월요일 09:00 정기 오픈(자동 생성).
* **규칙**: **시간 겹침 예약 불가**(409), 취소 정책(시간 제한) 옵션.
* **UI**: 주간 타임라인, 내 예약 하이라이트.
* **DoD:** 동시간대 중복 예약 차단·슬롯 생성 멱등.

## R8 — 스터디룸 ② (운영/합석/강제예약/블록)

**목표:** 운영 통제 강화.

* **합석 옵션**, **관리자 강제예약**, **휴무/블록** 기간 설정.
* **실시간/푸시**: 강제변경/블록 즉시 반영 및 안내.
* **DoD:** 운영자 화면에서 규칙 적용과 되돌리기 가능.

## R9 — 도서관 ① (대출/반납/연장/예약 + 연체 벌점)

**목표:** 대출 라이프사이클.

* **기능**: 대출, 반납, 연장, 예약/취소, 예약 대기열(옵션).
* **알림**: 반납 D-3 리마인더, **연체 시 자동 벌점**.
* **DoD:** 연체 시 자동 반영·D-3 알림 수신.

## R10 — 관측·보안·운영 폴리싱

**목표:** 운영 신뢰성·보안 레벨 업.

* **감사 로그**(추적 가능한 액션 코드), 간단 운영 대시보드(오류율/알림 실패율/SSE 연결/큐 길이).
* **보안 고도화**:

  * **리프레시 토큰**(HttpOnly/SameSite) + **토큰 버전 무효화**,
  * **키 회전(JWKS)**,
  * **2FA(선택)**,
  * 민감 엔드포인트 이중 확인.
* **PWA 폴리싱**: 오프라인 캐시 무효화 전략, 설치 UX.
* **DoD:** 키 교체 리그레션·오프라인 UX·감사 조회 시나리오 통과.

---

## 가이드라인 & 컷 스위치

* **가이드라인**

  * 모든 신규 기능은 **SSE 이벤트 정의 → API → UI** 순으로 얇게 세공.
  * **권한·에러·실시간**을 DoD에 반드시 포함.
* **컷 스위치(지연 시)**

  * R3: 오프라인 캐시는 **조회 화면만** 우선.
  * R4: 개별 수정은 **이름 또는 유통기한 중 하나만** 먼저.
  * R7: 자동 슬롯 생성 실패 시 수동 오픈 버튼 제공.
  * R9: 예약 대기열은 후속 릴리스로 이관 가능.

---

## 품질 바(모든 릴리스 공통)

* **성능**: p95 < 300ms(대표 트래픽), SSE 재연결 손실 0(Last-Event-ID 복구).
* **보안**: HTTPS/HSTS/보안 헤더, 입력 검증, 레이트리밋, 비밀 노출 0.
* **테스트**: 계약 스냅샷, E2E(실시간/푸시 포함), 롤백 리허설.
* **문서**: 릴리스노트, 운영 런북(장애/락/알림 재시도), 권한 매트릭스.

# MVP 10주개발

## 공통 운영 원칙

* [ ] **실시간은 SSE만** 사용(폴링/웹소켓 금지). `Last-Event-ID` 기반 유실 복구.
* [ ] 로그인은 **아이디(=username) + 비밀번호**. 이메일 로그인 아님.
* [ ] **resource\_id**는 공개 불변 ID로 사용(라벨은 표시용).
* [ ] 서버/DB **UTC 저장**, 클라이언트 **KST 표시**.
* [ ] 구조화 로그(JSON) + **correlation\_id** 전파(요청→응답/SSE).
* [ ] 보안 베이스라인: HTTPS, CORS 화이트리스트, 기본 CSP, RBAC(ADMIN/INSPECTOR/USER), 레이트리밋, 비밀번호 해시(Argon2id 또는 bcrypt≥12).
## 보안 체크(항상 병행)

* [ ] HTTPS/HSTS, CORS 화이트리스트, 라이트 CSP
* [ ] 비밀번호 해시: Argon2id 또는 bcrypt(≥12)
* [ ] JWT Access **짧은 TTL(15–30분)** / 리프레시는 **이후 단계**
* [ ] 에러는 RFC7807, 민감정보 마스킹, 로그에 토큰/비번 금지
* [ ] 사용자/IP 레이트리밋, SSE 동시 연결 1–2개 제한

---

## MVP 범위에서 의도적 제외(다음 단계)

* [ ] **Items v2**(개별 아이템 별도 이름/유통기한)
* [ ] PWA 오프라인/푸시(Web Push), 알림 워커(Outbox/DueTasks), 층·존 권한, 감사로그, 키 회전/토큰버전 무효화, 정식 멱등 스토어

## 지연 시 컷 스위치

* [ ] 먼저 컷: 번호 가용 조회 API, 일부 UI 폴리싱
* [ ] 반드시 유지: **2인 검사 / 423 락 / 단일 제출 / 벌점 원본+조정 / 에러 카탈로그 / OpenAPI 계약 / SSE**

---

## Day 0 — 부트스트랩 & SSE 베이스 (6–8h)

* [ ] `docker-compose`로 로컬 실행, 환경변수 검증
* [ ] `/healthz`, `/readyz` 도입, JSON 로그+`correlation_id`
* [ ] **SSE 엔드포인트**(하트비트 `:\n`, 자동 재연결 지시)
* [ ] OpenAPI 골격(로그인/리소스/아이템/검사/벌점) + 에러 카탈로그(RFC7807)

**Gate/DoD:** 스모크 3콜 200, 브라우저 `EventSource`로 `hello` 수신

---

## Week 1 — 인증·인가·SSE 인증 (6–9h)

* [ ] `/auth/login`(username+password → **JWT Access** 짧은 TTL) / `/me`
* [ ] **RBAC** 미들웨어(ADMIN/INSPECTOR/USER)
* [ ] **SSE 인증**: `Authorization: Bearer <JWT>` 헤더, 만료 시 재연결 처리
* [ ] CORS 화이트리스트, 기본 CSP/보안 헤더, 브루트포스 쿨다운(앱/캐시)

**Gate/DoD:** 권한 밖 403, 토큰 만료 후 SSE 재연결 정상

---

## Week 2 — 자원·아이템 등록/조회 + SSE (6–9h)

* [ ] 자원 목록 조회(냉장 **칸** 단위)
* [ ] 아이템(묶음) **생성/조회/검색**(묶음 공통명/유통기한/수량만)
* [ ] **SSE 발행**: `items.created/updated/removed`

**Gate/DoD:** 활성 라벨 충돌 시 409, 제거 후 라벨 재사용 OK, 리스트가 SSE로 즉시 갱신

---

## Week 3 — 조정/제거 UX + 요청 로깅 (6–9h)

* [ ] `items/:id:adjust`(수량/유통기한/메모) / `:remove-all`(전량 제거)
* [ ] 요청 요약 로그(메서드/경로/결과/지연)
* [ ] **SSE**: `items.adjusted/items.removed_all`

**Gate/DoD:** `remove-all → create`로 라벨 번호 유지 교체 동작

---

## Week 4 — **2인 검사 세션** + 423 락 (7–9h)

* [ ] 세션 열기/참여/나가기(동일 칸 **진행 1건** 제한, 참가자 **최대 2명**)
* [ ] 세션 중 해당 칸 쓰기 요청 **423 Locked**
* [ ] **SSE**: `inspection.opened/joined/left/locked`

**Gate/DoD:** 3번째 참여 409/422, 락 상태 실시간 반영

---

## Week 5 — 조치 기록 + **단일 제출** → 벌점 원본 (7–9h)

* [ ] `PASS/WARNING/DISCARD/DISCARD_WITH_PENALTY` 기록
* [ ] **제출 1회(멱등)**, 제출 후 결과 **INSERT/DELETE 금지**, UPDATE는 리비전 적재(+버전)
* [ ] **SSE**: `inspection.action_recorded/submitted`
* [ ] 제출 시 **원본 벌점 자동 생성**

**Gate/DoD:** 재제출 동일 응답, 벌점 원본 생성 확인

---

## Week 6 — 벌점 **조정** + 집계 (6–8h)

* [ ] 조정 벌점(+/-, 사유 필수) 작성
* [ ] 사용자별 **최종 점수** 조회(원본 합 + Σ조정)
* [ ] (선택 SSE) `penalties.adjusted`

**Gate/DoD:** 원본 벌점은 불변, 최종 점수 정확

---

## Week 7 — 프론트 E2E + SSE 안정화 (7–9h)

* [ ] 로그인 → 등록/조회 → 검사(2인) → 제출 → 벌점 조회 **엔드투엔드**
* [ ] **Last-Event-ID** + **최근 이벤트 링버퍼**로 유실 복구
* [ ] 단일 탭 연결(BroadcastChannel), 423 토스트/다이얼로그

**Gate/DoD:** 1분 데모 시나리오 매끄럽게 동작

---

## Week 8 — 계약/회귀 + SSE E2E (6–9h)

* [ ] OpenAPI 스냅샷 리그레션(계약 고정)
* [ ] **네트워크 단절→재연결→복구** E2E 포함

**Gate/DoD:** 스냅샷·E2E 모두 녹색

---

## Week 9 — 견고화(경합·성능·보안 라이트) (6–9h)

* [ ] 작성계 API **Idempotency-Key** 수용(서버 캐시 기반)
* [ ] 레이트리밋(사용자/IP, SSE 별도 제한), 429 + Retry-After
* [ ] p95 < 300ms(샘플 부하 10→30 rps)

**Gate/DoD:** 동시 등록 409 정상, 중복 제출 멱등, SSE 커넥션 누수 없음

---

## Week 10 — 폴리싱 · 문서 · **릴리즈** (6–8h)

* [ ] README(아키/플로우/시퀀스/실행가이드)
* [ ] ADR 정리, 변경로그, **Runbook(SSE/락/오류 대응)**
* [ ] 1분 데모 영상, Postman/Bruno 컬렉션
* [ ] 태그 `v0.1.0-mvp`, 롤백 리허설

**Gate/DoD:** 스모크/계약/E2E 전부 녹색, 실시간 이벤트/락 규칙 최종 점검

---

## “Items v2”(MVP 이후) 준비 사항(오늘부터 가볍게)

* [ ] UI/도메인 문서에 **개별 아이템 이름/유통기한** 요구사항 명시
* [ ] 이벤트·로그에 **라벨/리소스/소유자/세션ID** 포함(향후 백필 추적 대비)
* [ ] 마이그 전략만 문서화: **확장 → 백필 → 코드 전환 → 수축**


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
-- Dorm Convenience System — 최종 10주 MVP 라이트 스키마 (PostgreSQL)
--  • 실시간: 포그라운드 = SSE (DB에 세션상태 저장 안함, 이벤트는 앱에서 발행)
--  • 로그인: 아이디(=username) + 비밀번호(로컬 계정)  ← 이메일 로그인 아님!
--  • MVP 범위: 로그인 → 냉장칸 등록/조회 → 2인 검사 → 단일 제출 → 벌점 집계
--  • 불변성: UNIQUE / CHECK / TRIGGER로 핵심 규칙을 DB가 보장
--  • 시각: timestamptz UTC 저장(표시는 클라이언트 KST)
--  • 이후(Items v2): 묶음/개별 분리(item_groups/item_units), 알림 파이프라인, 권역 권한, PWA+Push
-- =========================================================

BEGIN;

-- ---------------------------------------------------------
-- 0) 확장
-- ---------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS citext;      -- 대소문자 무시 문자열(아이디 고유성)
CREATE EXTENSION IF NOT EXISTS btree_gist;  -- EXCLUDE 제약용(이후 allocations에서 사용)

-- ---------------------------------------------------------
-- 1) 사용자/역할 (로컬 계정)
--    • 로그인 키 = username (필수, 대소문자 무시 고유)
--    • email은 선택(연락/알림용). Postgres UNIQUE는 NULL 다중 허용.
--    • password_hash는 앱에서 Argon2id 또는 bcrypt(>=12)로 해시 저장
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  user_id         BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  username        CITEXT NOT NULL UNIQUE,   -- 로그인 아이디(대소문자 무시, 고유)
  email           CITEXT UNIQUE,            -- 선택 저장(여러 NULL 허용)
  password_hash   TEXT   NOT NULL,          -- 비밀번호 해시(평문 금지)
  display_name    TEXT   NOT NULL,          -- 유저이름
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,  -- false면 로그인 차단
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE users IS '로컬 계정(아이디/비밀번호) 사용자';
COMMENT ON COLUMN users.username IS '로그인 아이디(대소문자 무시 고유)';
COMMENT ON COLUMN users.email IS '선택 저장용 이메일(연락/알림). UNIQUE이지만 NULL 다중 허용';
COMMENT ON COLUMN users.password_hash IS 'Argon2id/bcrypt 해시(평문 저장 금지)';

CREATE TABLE IF NOT EXISTS roles (
  role_id SMALLINT PRIMARY KEY,
  name    TEXT NOT NULL UNIQUE,
  CHECK (name IN ('ADMIN','INSPECTOR','USER'))
);
INSERT INTO roles(role_id, name) VALUES (1,'ADMIN'),(2,'INSPECTOR'),(3,'USER')
ON CONFLICT DO NOTHING;
COMMENT ON TABLE roles IS '고정 역할 테이블(ADMIN/INSPECTOR/USER)';

CREATE TABLE IF NOT EXISTS user_roles (
  user_id    BIGINT    NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  role_id    SMALLINT  NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, role_id)
);
COMMENT ON TABLE user_roles IS '사용자-역할 매핑(N:N)';

-- ---------------------------------------------------------
-- 2) 자원(Resources) — MVP는 냉장 "칸"만
--    • 비즈니스 키는 항상 resource_id를 사용(라벨은 표시용)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS resources (
  resource_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  type        TEXT    NOT NULL CHECK (type IN ('FRIDGE_COMP')),  -- 이후 WASHER/DRYER/STUDYROOM/BOOK 등 확장
  label       TEXT    NOT NULL,                                  -- UI 라벨(예: '냉장1', '냉동1')
  status      TEXT    NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','OUT_OF_SERVICE')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(type, label)   -- 타입별 라벨 고유(운영/디버깅 편의)
);
COMMENT ON TABLE resources IS '운영 자원(현재는 냉장 칸만 사용)';
COMMENT ON COLUMN resources.label IS '사람이 보는 표기. 비즈니스 키는 resource_id 사용 권장';

-- ---------------------------------------------------------
-- 3) 물품(Item) — ★MVP 본편: 단일 계층(=묶음 레코드 1행)
--    • 활성(removed_at IS NULL) 상태에서 (resource_id, label_no) 유일 → 라벨 충돌 방지
--    • removed_at이 채워지면 동일 (resource_id, label_no) 재사용 가능
--    • group_hint(UUID): v2 전환시 묶음 추정/백필 힌트(현재 미사용)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS item_bundles (
  bundle_id     BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  resource_id   BIGINT NOT NULL REFERENCES resources(resource_id) ON DELETE RESTRICT,
  owner_user_id BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
  label_no      INTEGER NOT NULL CHECK (label_no > 0),   -- 스티커 번호(정수, UI 3자리 패딩)
  name          TEXT    NOT NULL,                        -- 품목명(묶음 공통)
  quantity      INTEGER NOT NULL CHECK (quantity >= 0),  -- 수량(부분소비 시 0 허용)
  expires_on    DATE    NOT NULL,                        -- 공통 유통기한
  memo          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  removed_at    TIMESTAMPTZ,                             -- 전량 제거(폐기/소진)
  replaced_by_bundle_id BIGINT REFERENCES item_bundles(bundle_id) ON DELETE SET NULL,
  group_hint    UUID,
  CHECK (replaced_by_bundle_id IS NULL OR removed_at IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_item_label_active
  ON item_bundles(resource_id, label_no) WHERE removed_at IS NULL;
COMMENT ON TABLE item_bundles IS 'MVP용 물품(묶음 1행). 활성 상태에서 (칸,라벨) 유일';
COMMENT ON COLUMN item_bundles.label_no IS '스티커 라벨 번호. 활성 상태에서 칸 단위 유일';
COMMENT ON COLUMN item_bundles.group_hint IS 'Items v2 이행 시 그룹 매핑 힌트(현재 미사용)';

-- ---------------------------------------------------------
-- 3-β) Items v2 (★MVP 이후) — "묶음/개별 분리"
--    • 현재 운영 미사용(스키마만 추가). 이후 릴리스에서 코드 전환.
--    • 라벨 유일성은 "활성 묶음"에 대해서만 보장(removed_at NULL 조건부 UNIQUE)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS item_groups (
  group_id      BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  resource_id   BIGINT NOT NULL REFERENCES resources(resource_id) ON DELETE RESTRICT,
  owner_user_id BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
  label_no      INTEGER NOT NULL CHECK (label_no > 0),  -- 묶음 라벨(칸+라벨 유일: 활성만)
  group_name    TEXT    NOT NULL,                       -- 묶음 공통명
  memo          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  removed_at    TIMESTAMPTZ,                            -- 묶음 전체 제거/소진
  replaced_by_group_id BIGINT REFERENCES item_groups(group_id) ON DELETE SET NULL
);
-- ✅ "활성 묶음"만 유일 → 제거 후 동일 라벨 재사용 가능
CREATE UNIQUE INDEX IF NOT EXISTS ux_item_groups_label_active
  ON item_groups(resource_id, label_no) WHERE removed_at IS NULL;
COMMENT ON TABLE item_groups IS 'Items v2: 묶음 헤더(라벨/공통명/메모/소유/칸)';
COMMENT ON COLUMN item_groups.label_no IS '묶음 라벨 번호. 활성 묶음에 대해 (칸,라벨) 유일';

CREATE TABLE IF NOT EXISTS item_units (
  unit_id     BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  group_id    BIGINT NOT NULL REFERENCES item_groups(group_id) ON DELETE CASCADE,
  seq_no      INTEGER NOT NULL CHECK (seq_no > 0),      -- 묶음 내 순번(1..N)
  name        TEXT    NOT NULL,                         -- 개별 표시명(그룹명과 달라도 됨)
  expires_on  DATE    NOT NULL,                         -- 개별 유통기한
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  removed_at  TIMESTAMPTZ,
  UNIQUE (group_id, seq_no)
);
CREATE INDEX IF NOT EXISTS idx_item_units_group ON item_units(group_id);
COMMENT ON TABLE item_units IS 'Items v2: 개별 아이템(각각 이름/유통기한 보유)';

-- ---------------------------------------------------------
-- 4) 검사(Inspection) — 2인 세션 + 단일 제출 + 결과 불변(리비전)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS inspection_sessions (
  session_id    BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  resource_id   BIGINT NOT NULL REFERENCES resources(resource_id) ON DELETE RESTRICT,
  started_by    BIGINT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  status        TEXT  NOT NULL CHECK (status IN ('IN_PROGRESS','SUBMITTED','CANCELED')),
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at      TIMESTAMPTZ,                         -- SUBMITTED 시 필수
  submitted_by  BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
  submitted_at  TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_inspection_res_inprog
  ON inspection_sessions(resource_id) WHERE status='IN_PROGRESS';
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='inspection_sessions'::regclass AND conname='ck_submitted_has_ts'
  ) THEN
    ALTER TABLE inspection_sessions
      ADD CONSTRAINT ck_submitted_has_ts
      CHECK (status <> 'SUBMITTED' OR (submitted_at IS NOT NULL AND ended_at IS NOT NULL));
  END IF;
END$$;
COMMENT ON TABLE inspection_sessions IS '검사 세션(자원 단위 동시 1건, 제출 시 종결)';

CREATE TABLE IF NOT EXISTS inspection_participants (
  participant_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  session_id     BIGINT NOT NULL REFERENCES inspection_sessions(session_id) ON DELETE CASCADE,
  user_id        BIGINT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  seat_no        SMALLINT NOT NULL CHECK (seat_no IN (1,2)), -- 최대 2명
  joined_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, seat_no),
  UNIQUE (session_id, user_id)
);
COMMENT ON TABLE inspection_participants IS '검사 세션 참가자(최대 2명)';

CREATE TABLE IF NOT EXISTS inspection_results (
  result_id    BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  session_id   BIGINT NOT NULL REFERENCES inspection_sessions(session_id) ON DELETE CASCADE,
  bundle_id    BIGINT REFERENCES item_bundles(bundle_id) ON DELETE SET NULL, -- 미등록 폐기 시만 NULL 허용
  performer_participant_id BIGINT NOT NULL REFERENCES inspection_participants(participant_id) ON DELETE RESTRICT,
  action       TEXT NOT NULL CHECK (action IN ('PASS','WARNING','DISCARD','DISCARD_WITH_PENALTY')),
  violation_type TEXT CHECK (violation_type IS NULL OR violation_type IN ('EXPIRED','NO_STICKER','PACKAGING_DEFECT','INFO_MISMATCH')),
  note         TEXT,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version      INTEGER NOT NULL DEFAULT 1,
  CHECK (bundle_id IS NOT NULL OR violation_type='NO_STICKER')
);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='inspection_results'::regclass AND conname='ck_action_violation'
  ) THEN
    ALTER TABLE inspection_results
      ADD CONSTRAINT ck_action_violation
      CHECK (
        (action='PASS' AND violation_type IS NULL)
     OR (action='WARNING' AND violation_type IS NOT NULL)
     OR (action IN ('DISCARD','DISCARD_WITH_PENALTY') AND violation_type IS NOT NULL)
      );
  END IF;
END$$;
COMMENT ON TABLE inspection_results IS '검사 조치 결과(제출 후 INSERT/DELETE 금지, UPDATE는 리비전 적재)';

CREATE TABLE IF NOT EXISTS inspection_result_revisions (
  rev_id     BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  result_id  BIGINT NOT NULL REFERENCES inspection_results(result_id) ON DELETE CASCADE,
  session_id BIGINT NOT NULL,                         -- 조인 편의
  changed_by BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason     TEXT,                                    -- 제출 후 수정 사유(필수)
  prev_row   JSONB NOT NULL,                          -- 변경 전 스냅샷
  new_row    JSONB NOT NULL                           -- 변경 후 스냅샷
);
COMMENT ON TABLE inspection_result_revisions IS '제출 후 UPDATE 감사 로그(스냅샷/사유/수정자)';

-- [트리거] 제출 세션에는 INSERT/DELETE 금지 + UPDATE는 리비전 적재(+버전)
CREATE OR REPLACE FUNCTION ensure_session_not_submitted()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE st TEXT;
BEGIN
  SELECT status INTO st
  FROM inspection_sessions
  WHERE session_id = COALESCE(NEW.session_id, OLD.session_id)
  FOR UPDATE;
  IF st='SUBMITTED' THEN
    RAISE EXCEPTION '이미 제출된 검사 세션입니다(결과 불변)';
  END IF;
  RETURN COALESCE(NEW, OLD);
END$$;
COMMENT ON FUNCTION ensure_session_not_submitted() IS '검사 세션 제출 후 결과 INSERT/DELETE 차단';

CREATE OR REPLACE FUNCTION trg_audit_ir_update()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_status TEXT; v_reason TEXT; v_user BIGINT;
BEGIN
  SELECT status INTO v_status FROM inspection_sessions WHERE session_id = NEW.session_id;
  v_reason := current_setting('app.change_reason', true);
  IF current_setting('app.user_id', true) IS NOT NULL THEN
    v_user := current_setting('app.user_id')::BIGINT;
  END IF;
  IF v_status='SUBMITTED' AND (v_reason IS NULL OR btrim(v_reason)='') THEN
    RAISE EXCEPTION '제출된 검사결과 수정에는 사유(app.change_reason)가 필요합니다';
  END IF;
  INSERT INTO inspection_result_revisions(result_id, session_id, changed_by, reason, prev_row, new_row)
  VALUES (OLD.result_id, OLD.session_id, v_user, v_reason, to_jsonb(OLD), to_jsonb(NEW));
  NEW.version := OLD.version + 1;
  RETURN NEW;
END$$;
COMMENT ON FUNCTION trg_audit_ir_update() IS '검사 결과 UPDATE 시 리비전 적재 및 버전 증가';

DO $$BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_ir_block_ins') THEN
    CREATE TRIGGER trg_ir_block_ins BEFORE INSERT ON inspection_results
    FOR EACH ROW EXECUTE FUNCTION ensure_session_not_submitted();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_ir_audit_upd') THEN
    CREATE TRIGGER trg_ir_audit_upd BEFORE UPDATE ON inspection_results
    FOR EACH ROW WHEN (OLD.* IS DISTINCT FROM NEW.*)
    EXECUTE FUNCTION trg_audit_ir_update();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_ir_block_del') THEN
    CREATE TRIGGER trg_ir_block_del BEFORE DELETE ON inspection_results
    FOR EACH ROW EXECUTE FUNCTION ensure_session_not_submitted();
  END IF;
END$$;

-- ---------------------------------------------------------
-- 5) 423 Locked 근거(자원 논리 락)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS resource_locks (
  lock_id        BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  resource_id    BIGINT NOT NULL REFERENCES resources(resource_id) ON DELETE CASCADE,
  holder_user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  reason         TEXT    NOT NULL,   -- 예: 'INSPECTION_IN_PROGRESS'
  expires_at     TIMESTAMPTZ NOT NULL,  -- 자동 만료(유령 락 방지)
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(resource_id)   -- 자원당 단일 락
);
COMMENT ON TABLE resource_locks IS '자원별 논리 락(검사/운영 중 일반 쓰기 423 근거)';

-- ---------------------------------------------------------
-- 6) 벌점 — 원본(불변) + 조정(합산)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS penalties_original (
  penalty_id  BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  inspection_result_id BIGINT REFERENCES inspection_results(result_id) ON DELETE SET NULL,
  violation_type TEXT NOT NULL, -- 예: 'EXPIRED'
  points      INTEGER NOT NULL, -- 양수
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE penalties_original IS '원본 벌점(비즈니스 이벤트에 의해 생성, 수정/삭제 금지)';

CREATE OR REPLACE FUNCTION block_penalty_mutation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION '원본 벌점은 수정/삭제할 수 없습니다';
END$$;
COMMENT ON FUNCTION block_penalty_mutation() IS '원본 벌점 UPDATE/DELETE 차단';

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

CREATE TABLE IF NOT EXISTS penalties_adjustments (
  adj_id       BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id      BIGINT  NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  delta_points INTEGER NOT NULL,  -- 증감(+/-)
  reason       TEXT    NOT NULL,  -- 사유(필수)
  created_by   BIGINT  NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE penalties_adjustments IS '조정 벌점(+/-) — 원본과 합산하여 최종 점수 산출';

CREATE OR REPLACE VIEW v_penalties_totals AS
SELECT u.user_id,
       COALESCE(SUM(po.points), 0)       AS original_points,
       COALESCE(SUM(pa.delta_points), 0) AS adjusted_points,
       COALESCE(SUM(po.points), 0) + COALESCE(SUM(pa.delta_points), 0) AS total_points
FROM users u
LEFT JOIN penalties_original  po ON po.user_id = u.user_id
LEFT JOIN penalties_adjustments pa ON pa.user_id = u.user_id
GROUP BY u.user_id;
COMMENT ON VIEW v_penalties_totals IS '사용자별 최종 벌점(원본 합 + 조정 합)';

COMMIT;

-- =========================================================
-- [향후 구현 방향 — 참고 주석]
-- 1) Items v2(개별 이름/유통기한):
--    A) item_bundles → item_groups 백필(라벨/소유/메모/공통명, removed_at 포함)
--    B) quantity만큼 item_units 생성(seq_no 1..N, name=group_name, expires_on=item_bundles.expires_on)
--    C) 앱/API를 groups/units 기준으로 전환(SSE 이벤트 키도 group_id/unit_id로),
--       bundle 경로는 읽기 전용 유지 → 최종 수축.
-- 2) 알림 파이프라인(R2): outbox / due_tasks / domain_events + 워커(재시도·멱등) — 테이블 “추가만”.
-- 3) PWA + Web Push(R3): 포그라운드=SSE 유지, 백그라운드=푸시 — 구독 저장 테이블만 추가.
-- 4) 권역 권한(R8): floors / dorm_rooms / zones / user_zone_assignments / stays — “추가만”.
-- 5) 하드닝(R1/R10): idempotency_store, activity_logs(append-only), 키 회전/토큰버전 무효화 — “추가만”.
-- =========================================================
```