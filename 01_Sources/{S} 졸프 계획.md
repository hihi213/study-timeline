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

# 상단 고정 (주의 2가지)

* [ ] **라벨 교체**(`remove→create`)는 **한 트랜잭션**으로 처리(경쟁 시 UNIQUE 409 방지)
* [ ] **423 락**은 **근거 테이블만(DB)**, **차단 판단은 앱 미들웨어**(락 GC는 워커/크론)

---

# 선행 필수(폴링 실시간용) — **DB/앱 공통**

## A) DB 마이그 (이미 만들어둔 파일 적용)

* [x] `event_log` 테이블/인덱스 생성 (폴링 단일 소스)
* [x] `resources.floor_code` 추가 + 백필(임시 `F1`) + NOT NULL + 인덱스
* [x] `resource_locks(expires_at)` 인덱스(락 GC 성능)
* [x] `penalties_adjustments.delta_points <> 0` 체크 제약
* [x] (권장) dcs\_app/dcs\_read 권한에 `event_log` 접근 부여

## B) 앱 필수 6가지

* [ ] **이벤트 기록 삽입**: 아이템 생성/수정/제거, 검사 open/join/locked/submitted, 벌점 조정 시
  `INSERT INTO event_log(type,resource_id,floor_code,correlation_id,data)` 호출
* [ ] **폴링 엔드포인트**: `GET /events/poll?sinceId&limit[&resourceId&floor]` (커서 방식)
  ↳ 응답: `{ lastId, events:[{event_id, created_at, type, resource_id, floor_code, data, correlation_id}] }`
* [ ] **API 응답에 `floor_code` 포함**(리소스/아이템/검사 관련)
* [ ] **OpenAPI & 에러카탈로그 업데이트**: `/events/poll` 스펙, 이벤트 타입 enum, 예제 페이로드
* [ ] **권한 확인**: 앱 커넥션 롤에 `event_log` 접근 OK
* [ ] **실제 층 코드 백필**: 임시 `F1` → 실제 값으로 `UPDATE`

---

# ✅ 10주 실행 플랜 (주당 10–15h, “작동+증빙” 중심)


## Week 1 — 부트스트랩 + 인증 베이스 

* [x] `docker-compose`, `/healthz` `/readyz`, 요청 요약 로그(+지연)	 ^2ebl98
* [ ] OpenAPI 골격 + **RFC7807 초안** ^qasm2v
* [ ] `/auth/login`(JWT 15–30m), `/me`, **RBAC(ADMIN/INSPECTOR/USER)**
* [ ] **`/events/poll` 스텁**(“hello” 1건, `sinceId/limit` 커서 처리)
* **Gate/DoD**: 헬스 200, 권한 밖 403, 폴링으로 hello 수신 캡처 
* 구현
	* [[00_Inbox/dockercompose설정.md|dockercompose설정]]
	* [[00_Inbox/헬스체크와 요청로그.md|헬스체크와 요청로그]]
	* [[00_Inbox/OpenApi골격.md|OpenApi골격]]

## Week 2 — 자원·아이템 등록/조회 + **이벤트 기록**

* [ ] 리소스(냉장 칸) 목록(+ `floor_code`)
* [ ] 아이템 묶음 **등록/조회/검색**(LIKE; TRGM 인덱스는 파일만)
* [ ] **event\_log.append**: `items.created/updated/removed` 기록
* [ ] 페이지네이션(`?limit&cursor`), 모든 응답/이벤트에 `floor_code` 포함
* **Gate/DoD**: 활성 라벨 중복 409, 제거 후 재사용 OK, 폴링에 신규 이벤트 노출

## Week 3 — 조정/제거 + 멱등/감사 슬롯

* [ ] `items/:id:adjust`, `:remove-all`
* [ ] **경량 Idempotency-Key**(작성계, TTL 10m)
* [ ] **GUC/컨텍스트 주입**(`app.user_id`,`app.change_reason`)
* [ ] 이벤트: `items.adjusted` / `items.removed_all`
* **Gate/DoD**: `remove-all→create` 라벨 교체 OK, 중복요청 동일응답

## Week 4 — **2인 검사 세션** + 423 락

* [ ] 세션 열기/참여/나가기(자원당 진행 1건, 참가자 ≤2)
* [ ] 세션 중 해당 칸 쓰기 **423 Locked**(미들웨어 판단)
* [ ] 락 TTL(5–10m) + 만료 인덱스 + GC 잡
* [ ] 이벤트: `inspection.opened/joined/left/locked`
* **Gate/DoD**: 3번째 참여 409/422, 폴링에서 락 상태 즉시 확인

## Week 5 — 조치 기록 + **단일 제출** → 벌점 원본

* [ ] 액션: `PASS / WARNING / DISCARD / DISCARD_WITH_PENALTY`
* [ ] **제출 1회(멱등)**, 제출 후 INSERT/DELETE 금지, UPDATE=**리비전(+버전)**
* [ ] 제출 시 **원본 벌점 자동 생성**
* [ ] 이벤트: `inspection.action_recorded` / `inspection.submitted`
* **Gate/DoD**: 재제출 동일응답, 원본 벌점 생성, 수정 시 version +1

## Week 6 — 벌점 조정 + 집계 API

* [ ] 조정 벌점(+/-, 사유 필수), 합산 뷰로 **사용자별 집계**(`original/adjusted/total`, 기간 필터)
* [ ] (선택) 조정 사유 프리셋
* **Gate/DoD**: 집계 정확(E2E/쿼리 회귀), 원본 불변 보장

## Week 7 — 프런트 E2E + **폴링 안정화**

* [ ] 로그인→등록/조회→검사(2인)→제출→벌점 **엔드투엔드**
* [ ] **폴링 커서 규약 확정**(localStorage), 중복 억제/역순 보정
* [ ] **단일 탭 공유**(BroadcastChannel)로 폴링 주기 2–5s 공유
* [ ] 임시 스테이징 예행: `/healthz` + `/events/poll`
* **Gate/DoD**: 1분 데모 OK, 오프라인→복귀 후 재동기 OK(폴링)

## Week 8 — 계약/회귀 + CI 골격

* [ ] OpenAPI **스냅샷 회귀**(CI)
* [ ] **폴링 계약 테스트**(커서/중복/순서/limit)
* [ ] **CI 골격**: build + unit/contract + snapshot
* **Gate/DoD**: CI 녹색, 폴링 계약 테스트 통과

## Week 9 — **Cloud v1(Staging)** / 부하 / 지표

* [ ] AWS: EC2(도커/컴포즈), RDS(Postgres/SG=EC2만), Route53 + **HTTPS(ACM/LE)**
* [ ] **배포 스크립트**: test → image → 배포 → 스모크(`/readyz` & `/events/poll`)
* [ ] **부하(k6/Artillery)**: 로그인/목록/**poll**/제출 혼합, 10→30 rps
* [ ] **지표 초판**: API p50/p95, 429 비율, DB Top-N(before)
* **Gate/DoD**: HTTPS 접근, p95 < 300ms(샘플), 리포트 커밋

## Week 10 — **Cloud v2(Prod-like)** / 릴리즈

* [ ] 운영 도메인 `app.*` HTTPS, CORS 반영
* [ ] **CI/CD 2단계**: migrate → deploy → smoke → **auto-rollback**
* [ ] **DB Before/After** 비교(인덱스 1–2건 `EXPLAIN ANALYZE`) + Top-N 비교표
* [ ] **백업→복구 리허설**(RDS 스냅샷)
* [ ] README/ADR/Runbook, Postman/Bruno, **1분 데모** 정리
* [ ] 태그 `v0.1.0-mvp`
* **Gate/DoD**: 운영 도메인 OK, 배포로그/롤백 리허설/지표 그래프 제출

> **컷 스위치(지연 시 이동)**: Week 7(단일탭 공유), Week 9(자동배포), Week 10(DB 비교)은 **R1\~R2로 슬립**.






---

# MVP 이후(헤더)

* [ ] **R1** 하드닝(정식 Idempotency-Store, **SSE 전환/지표 대시보드**)
* [ ] **R2** 알림 파이프라인(Outbox/DueTasks)
* [ ] **R3** PWA + Web Push
* [ ] **R4** Items v2(그룹/유닛) 무중단 전환
* [ ] **R5–R9** 리소스 확장·권역 권한·운영 옵션
* [ ] **R10** 보안·관측·PWA 폴리싱

---

## 제출/증빙 팩(권장)

* **지표**: p50/p95, 429 비율, DB Top-N(전/후)
* **데모**: 1분 시나리오(로그인→등록/조회→2인검사→제출→벌점)
* **문서**: OpenAPI 스냅샷, 에러 카탈로그, 배포/복구 런북
* **안전장치**: 배포 로그·롤백 리허설 기록


# ▶️ 10주 이후 — 하드닝/리팩터링 스프린트 (SSE 도입 포함)

## 🧱 R1 — 하드닝① & **SSE 도입** (v0.2.x, 1–2주)

**목표:** 멱등/에러 정합화 + **SSE 전환** + 관측/알람

* [ ] 작성계 **Idempotency-Key 스토어**(캐시/Redis/DB 택1)
* [ ] **SSE 엔드포인트** `/events/sse`(하트비트 `:\n`, 인증, `Last-Event-ID`)
* [ ] **Nginx SSE 튜닝**: `proxy_buffering off`, `http/1.1`, `read_timeout 1d`
* [ ] **링버퍼**(서버 N≈500) + 전송 지연/드롭률 지표 수집
* [ ] **클라: SSE→폴링 폴백**(네트/브라우저별)
* [ ] **알람 임계치**: p95>300ms(5m), 429>1%(5m), SSE 드롭률>1%(10m)
* [ ] **RFC7807 카탈로그 확정**(409/422/423/429 메시지)
* DoD: SSE/폴링 동시 운영, 재연결 복구 OK, 알람 발화 테스트

## 🔔 R2 — 알림 파이프라인 (Outbox/DueTasks) (v0.3.x, 1–2주)

* [ ] **Outbox** + 워커(지수 백오프/멱등 키)
* [ ] **DueTasks**(예약 실행) + 락/픽킹 전략
* [ ] 큐 백엔드 결정: **SQS(+DLQ)** 권장 *(대안: Redis Stream 등)*
* [ ] 알림센터 1차(배지/목록/읽음/딥링크)
* DoD: 큐잉→전송 지표 확인, 중복억제·재시도 성공 로그

## 📱 R3 — PWA + Web Push (v0.4.x, 1–2주)

* [ ] **Service Worker** 등록/업데이트 전략
* [ ] 푸시 구독/해지 API + 만료구독 정리 잡
* [ ] iOS 홈화면 가이드, 딥링크
* DoD: 백그라운드 푸시 수신→딥링크 진입 OK

## 📦 R4 — Items v2(개별) 무중단 전환 (v0.5.x, 2–3주)

* [ ] 스키마 **확장→백필→코드 전환→수축**
* [ ] **섀도우-쓰기** 운용, SSE 키를 `groupId/unitId`로 이행
* DoD: 기존/신규 데이터 혼재에서도 UI/실시간 정확


---

# 🧺 R5 — 세탁실 ①: 사용 시작/완료 (v0.6.x, 1–2주)

## 목표

* 자원 타입 확장(WASHER/DRYER) + **동시 사용 금지** 규칙

## 작업

* 사용 시작/완료 API + SSE 상태 업데이트
* 중복 시작 409, 사용 중 상태 표시/타이머

## Gate/DoD

* 동시 시작 409, 실시간 상태 반영, 타임라인 표시

---

# 🧼 R6 — 세탁실 ②: 미등록/알림/고장 (v0.7.x, 1–2주)

## 목표

* **미등록 사용** 처리, 종료 5분 전 알림, **고장 신고→운영 차단**

## 작업

* 미등록 사용 자동 복귀, 알림 예약(DueTasks), 고장 상태 전파(SSE)

## Gate/DoD

* 알림 큐잉→전송 성공률 ≥ 99%, 상태 전환 로그/감사 가능

---

# 📚 R7 — 스터디룸 ①: 10분 슬롯 예약 (v0.8.x, 1–2주)

## 목표

* 주간 슬롯 생성, 예약/취소, 타임라인 뷰 + SSE

## 작업

* 월 09:00 배치 슬롯 생성, 겹침 방지(UX+서버), 409 충돌 규칙

## Gate/DoD

* 동일 시간대 중복 예약 409, 타임라인 즉시 갱신

---

# 🧩 R8 — 스터디룸 ② & 운영 옵션 (v0.9.x, 1주)

## 목표

* **합석 옵션**, **관리자 강제예약**, **휴무 블록**

## 작업

* 옵션/블록 관리 UI, 충돌 규칙·권한 반영

## Gate/DoD

* 운영 화면에서 옵션/블록 시나리오 통과

---

# 🗺️ R9 — 권역 권한(층/존) (v0.10.x, 1–2주)

## 목표

* 사용자 권역 할당, 리스트/검사/예약 **권역 필터링**

## 작업

* `/me`에 권역 포함, 프런트 라우팅/가드, 서버 필터
* (MVP에서 예약해둔 `floor_code` 필드와 호환 유지)

## Gate/DoD

* 권역 밖 403, 층별장 권역 내만 조작 가능(E2E)

---

# 🔐 R10 — 보안·관측·PWA 폴리싱 (v0.11.x, 1주)

## 목표

* **감사로그(append-only)**, **키 회전/JWKS**, 토큰 **버전 무효화**
* PWA 오프라인(핵심 조회 캐싱) + 푸시 딥링크 안정화

## 작업

* 고위험 액션 감사 테이블/뷰(append-only)
* 키 회전 파이프라인, 토큰 버전 무효화(강제 로그아웃)
* **권장 옵션(Week9–10 배포 재사용)**:

  * **ACM 자동갱신**, **CloudWatch 대시보드 강화**, **기본 WAF 룰**

## Gate/DoD

* 키 교체 리그레션 OK, 오프라인 조회 동작, 감사 쿼리로 추적 가능

## 산출물

* `docs/security/key-rotation.md`, `docs/audit/queries.md`
* 대시보드/알람 정의서 업데이트

---

# 🧪 상시 보안·운영 체크리스트

* 비밀번호 해시(Argon2id/bcrypt≥12), Access JWT TTL 15–30분
* 사용자/IP 레이트리밋, **SSE 연결 1–2개/사용자** 제한
* 민감정보 로깅 금지(Authorization/토큰/비번) & 마스킹 테스트
* 분기별 **백업→복구 리허설**, 장애 복구 런북 최신화

---

# 🔄 데이터/제품 전환 메모(요약)

* **Items v2**는 “**확장→백필→코드 전환→수축**”으로 **무중단** 이행
* 실시간은 **항상 SSE**, 푸시는 **보완 채널**
* 신규 기능은 **피처 플래그**로 카나리 후 전체 전환

---

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


```sql
-- =========================================================
-- Migration: event_log + floor_code (+ 소소한 보강)
-- Idempotent, PG >= 11 가정 (IDENTITY / metadata-only DEFAULT)
-- =========================================================
BEGIN;

-- 1) 폴링 이벤트 소스
CREATE TABLE IF NOT EXISTS event_log (
  event_id       BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  type           TEXT NOT NULL,              -- 'items.created' | 'inspection.opened' ...
  resource_id    BIGINT REFERENCES resources(resource_id) ON DELETE SET NULL,
  floor_code     TEXT,                       -- 응답/이벤트에 포함
  correlation_id TEXT,
  data           JSONB NOT NULL              -- EventEnvelope.data (앱에서 스키마 검증)
);
CREATE INDEX IF NOT EXISTS idx_eventlog_id          ON event_log(event_id);
CREATE INDEX IF NOT EXISTS idx_eventlog_res_id_id   ON event_log(resource_id, event_id);
CREATE INDEX IF NOT EXISTS idx_eventlog_created_desc ON event_log(created_at DESC);

-- 2) resources.floor_code 추가 (+ 백필 → NOT NULL → 인덱스)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name='resources' AND column_name='floor_code'
  ) THEN
    ALTER TABLE resources ADD COLUMN floor_code TEXT;              -- 일단 NULL 허용
  END IF;

  -- 기존 행 백필: 기본 'F1' (추후 실제 층 코드로 UPDATE 권장)
  UPDATE resources SET floor_code='F1' WHERE floor_code IS NULL;

  -- NOT NULL 제약 (백필 이후)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='resources'::regclass AND conname='resources_floor_code_not_null'
  ) THEN
    ALTER TABLE resources
      ALTER COLUMN floor_code SET NOT NULL,
      ADD CONSTRAINT resources_floor_code_not_null CHECK (floor_code IS NOT NULL);
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_resources_floor ON resources(floor_code);

-- 3) 락 GC 성능 보강
CREATE INDEX IF NOT EXISTS idx_resource_locks_expire ON resource_locks(expires_at);

-- 4) 조정 벌점 0 금지
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='penalties_adjustments'::regclass
      AND conname='ck_pa_nonzero_delta'
  ) THEN
    ALTER TABLE penalties_adjustments
      ADD CONSTRAINT ck_pa_nonzero_delta CHECK (delta_points <> 0);
  END IF;
END$$;

-- 5) (선택) 권한 부여: dcs_app / dcs_read 있을 때만
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='dcs_app') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON event_log TO dcs_app';
    EXECUTE 'ALTER TABLE event_log ENABLE ROW LEVEL SECURITY';        -- 필요시 비활성화/정책 추가
    -- 참고: RLS 쓸 계획 없으면 위 줄은 삭제해도 됨
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='dcs_read') THEN
    EXECUTE 'GRANT SELECT ON event_log TO dcs_read';
  END IF;
END$$;

COMMIT;

-- 사용 예시(폴링):
--   SELECT * FROM event_log
--   WHERE event_id > $1             -- sinceId 커서
--     AND ($2::bigint IS NULL OR resource_id=$2)   -- 선택: 특정 자원
--     AND ($3::text   IS NULL OR floor_code=$3)    -- 선택: 특정 층
--   ORDER BY event_id ASC
--   LIMIT $4;
-- =========================================================

```