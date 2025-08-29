---
type: 소스
status: inbox
topics: 
source_url: "{{SOURCE}}"
author: 
creation_date: 2025-08-28
---
# 공통 보조 체크리스트

## 마이그레이션 규율

-  새 컬럼 **NULL 허용** 추가 → [ ] 배치 백필 → [ ] `NOT NULL/CHECK/INDEX` 강화
    
-  `DROP/RENAME`는 다음 스프린트에서(두 번의 하위호환 릴리즈 원칙)
    
-  파일명 예: `V2025_08_28_01__inspection_sessions.sql`
    

## DB 핵심 불변식(레드라인)

-  `(compartment_id, item_number)`는 `status='ACTIVE'`에서 유니크
    
-  `inspection_session` 참여자 ≤2, 제출자는 세션당 1명
    
-  `penalties` 원본 불변, `penalty_adjustments`로만 조정
    

## 스코프 아웃(이번 MVP에서 제외)

-  고도 정책엔진/복잡 통계 대시보드
-  세탁/스터디룸/도서(다음 사이클)
-  SSE 실시간 대시(알림/딥링크로 충분)
    
# 위험 관리 & 조정 레버
- 일정 압박 시 **우선순위 순삭**:
    1. 검사 제출/벌점/알림 → 2) 사용자 임박 알림 배치 → 3) 휴관 라이트
- 동시성 이슈: 1차 **앱단 가드**, 필요 시 2차 DB 제약/트리거 추가
- 알림 실패 대비: `FAILED` 재시도 백오프 & 토큰 정리 배치

---

# ✅ 7주 체크리스트 (MVP: 냉장고 + 검사 + 알림)

# Week 1 — 프로젝트 스켈레톤 & 공통 원칙

**명령 예시**

```bash
# 백엔드 실행
./gradlew bootRun --args='--spring.profiles.active=local'

# 로컬 DB
docker run -d --name dormdb -p 5432:5432 \
  -e POSTGRES_USER=app -e POSTGRES_PASSWORD=app1234 -e POSTGRES_DB=dorm \
  postgres:16
```

**`application-local.yml` 스켈레톤**

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/dorm
    username: ${DB_USER:app}
    password: ${DB_PASS:app1234}
  jpa:
    hibernate:
      ddl-auto: validate
    open-in-view: false
  flyway:
    enabled: true
    locations: classpath:db/migration
server:
  port: 8080
jwt:
  issuer: dorm
  access-token-ttl: PT30M
  refresh-token-ttl: P14D
  secret: ${JWT_SECRET:change-me}
```
---

**`build.gradle` 핵심**

```gradle
dependencies {
  implementation 'org.springframework.boot:spring-boot-starter-web'
  implementation 'org.springframework.boot:spring-boot-starter-validation'
  implementation 'org.springframework.boot:spring-boot-starter-security'
  implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
  runtimeOnly   'org.postgresql:postgresql'
  implementation 'org.flywaydb:flyway-core'
  implementation 'org.springframework.boot:spring-boot-starter-oauth2-resource-server' // JWT 파서 활용 가능
  implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:2.5.0'
  compileOnly   'org.projectlombok:lombok'
  annotationProcessor 'org.projectlombok:lombok'
  testImplementation 'org.springframework.boot:spring-boot-starter-test'
}
```

**DoD**: `./gradlew build` 성공

---

## D. DB 마이그레이션 베이스라인(Flyway)


**`V1__baseline.sql` 최소안**

```sql
-- V1__baseline.sql
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS users (
  user_id      BIGSERIAL PRIMARY KEY,
  username     CITEXT NOT NULL UNIQUE,
  email        CITEXT NOT NULL UNIQUE,
  password_hash TEXT  NOT NULL,
  enabled      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS roles (
  role_id   BIGSERIAL PRIMARY KEY,
  role_name TEXT NOT NULL UNIQUE  -- ADMIN / INSPECTOR / USER
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  role_id BIGINT NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
  PRIMARY KEY(user_id, role_id)
);

-- 시드
INSERT INTO roles(role_name) VALUES ('ADMIN'),('INSPECTOR'),('USER')
ON CONFLICT DO NOTHING;
```

**산출물**: `db/migration/V1__baseline.sql`  
**DoD**: 앱 기동 시 Flyway가 V1 적용, 테이블 생성 확인



# Week 2 — 냉장고(사용자) 핵심 CRUD

## B. DB 마이그레이션 (Flyway: `V2__cold_storage_core.sql`)

-  테이블: `floors`, `refrigerators`, `compartments`, `bundles`, `sub_items`
    
-  인덱스/제약: **부분 유니크 인덱스**(ACTIVE만), 만료일/소유자 인덱스
    
-  시드: 2~5층, 층별 냉장고 1대, 칸 라벨 4개(R1~R3,F1)
    

```sql
-- V2__cold_storage_core.sql (요지)
BEGIN;

CREATE TABLE IF NOT EXISTS floors (
  floor_no int PRIMARY KEY CHECK (floor_no BETWEEN 2 AND 5)
);

CREATE TABLE IF NOT EXISTS refrigerators (
  refrigerator_id bigserial PRIMARY KEY,
  floor_no int NOT NULL REFERENCES floors(floor_no),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 칸 라벨: R1/R2/R3/F1
CREATE TABLE IF NOT EXISTS compartments (
  compartment_id bigserial PRIMARY KEY,
  refrigerator_id bigint NOT NULL REFERENCES refrigerators(refrigerator_id) ON DELETE CASCADE,
  label text NOT NULL CHECK (label IN ('R1','R2','R3','F1')),
  UNIQUE(refrigerator_id, label)
);

-- 묶음(붙는 번호 단위: 칸+번호)
CREATE TYPE bundle_status AS ENUM ('ACTIVE','REMOVED');
CREATE TABLE IF NOT EXISTS bundles (
  bundle_id bigserial PRIMARY KEY,
  compartment_id bigint NOT NULL REFERENCES compartments(compartment_id) ON DELETE RESTRICT,
  owner_user_id bigint NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  item_number int NOT NULL CHECK (item_number BETWEEN 1 AND 999),
  name text NOT NULL,                -- 물품명
  memo text,
  expires_at date,                   -- 유통기한
  status bundle_status NOT NULL DEFAULT 'ACTIVE',
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ACTIVE일 때만 (칸,번호) 유니크
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_number
  ON bundles(compartment_id, item_number)
  WHERE status = 'ACTIVE' AND deleted_at IS NULL;

-- 조회/필터용 인덱스
CREATE INDEX IF NOT EXISTS ix_bundles_owner ON bundles(owner_user_id);
CREATE INDEX IF NOT EXISTS ix_bundles_expires ON bundles(expires_at);

-- 수량 지원(부분 소비 등)
CREATE TYPE sub_item_status AS ENUM ('STORED','CONSUMED');
CREATE TABLE IF NOT EXISTS sub_items (
  sub_item_id bigserial PRIMARY KEY,
  bundle_id bigint NOT NULL REFERENCES bundles(bundle_id) ON DELETE CASCADE,
  qty int NOT NULL CHECK (qty > 0),
  status sub_item_status NOT NULL DEFAULT 'STORED',
  consumed_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 시드: 2~5층, 층별 냉장고 1대, 칸 4개
INSERT INTO floors(floor_no) VALUES (2),(3),(4),(5)
ON CONFLICT DO NOTHING;

INSERT INTO refrigerators(floor_no)
SELECT f.floor_no FROM floors f
ON CONFLICT DO NOTHING;

INSERT INTO compartments(refrigerator_id, label)
SELECT r.refrigerator_id, l.label
FROM refrigerators r
CROSS JOIN (VALUES ('R1'),('R2'),('R3'),('F1')) AS l(label)
ON CONFLICT DO NOTHING;

COMMIT;
```

> 선택: `pg_trgm` 확장 사용 시 `bundles(name)` trigram 인덱스 추가(부분 검색 최적화).

---

# Week 3 — 검사 세션(동시 2인) 1차


## B. DB 마이그레이션 (Flyway: `V3__inspection_core.sql`)

-  `inspection_sessions` / `inspection_participants(슬롯 1..2)` / `inspection_actions`
    
-  **층 단일 진행 세션 보장**: 같은 `floor_no`에 **동시에 1개**만 IN_PROGRESS
    
-  조회/필터용 인덱스(세션시작 이후 변경 탐지, 만료품 탐지)
    

```sql
BEGIN;

-- 1) 검사 세션(층 단위)
CREATE TABLE IF NOT EXISTS inspection_sessions (
  session_id   BIGSERIAL PRIMARY KEY,
  floor_no     INT NOT NULL,  -- floors(floor_no) 참조를 이미 사용 중이면 FK 추가
  created_by   BIGINT NOT NULL REFERENCES users(user_id),
  started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at     TIMESTAMPTZ,
  status       TEXT NOT NULL CHECK (status IN ('IN_PROGRESS','ENDED','CANCELED'))
);
-- 같은 층에 진행중 세션은 1개만
CREATE UNIQUE INDEX IF NOT EXISTS uq_floor_open_session
  ON inspection_sessions(floor_no)
  WHERE status = 'IN_PROGRESS';

-- 2) 세션 참여자(최대 2명) — 슬롯 방식으로 DB 제약
CREATE TABLE IF NOT EXISTS inspection_participants (
  session_id   BIGINT NOT NULL REFERENCES inspection_sessions(session_id) ON DELETE CASCADE,
  inspector_id BIGINT NOT NULL REFERENCES users(user_id),
  slot         SMALLINT NOT NULL CHECK (slot IN (1,2)),
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(session_id, slot)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_session_inspector
  ON inspection_participants(session_id, inspector_id);

-- 3) 검사 중 행동 기록
CREATE TABLE IF NOT EXISTS inspection_actions (
  action_id    BIGSERIAL PRIMARY KEY,
  session_id   BIGINT NOT NULL REFERENCES inspection_sessions(session_id) ON DELETE CASCADE,
  inspector_id BIGINT NOT NULL REFERENCES users(user_id),
  bundle_id    BIGINT REFERENCES bundles(bundle_id),  -- 스티커 있는 대상
  temp_label   TEXT,                                  -- 스티커 없는 경우 임시명
  action       TEXT NOT NULL CHECK (action IN ('PASS','WARNING','DISCARD','NO_STICKER_DISCARD')),
  reason       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_actions_session ON inspection_actions(session_id);
CREATE INDEX IF NOT EXISTS ix_actions_bundle  ON inspection_actions(bundle_id);

-- 4) 필터 최적화(선택) — 만료/변경 탐지에 도움
-- 만료 탐지: bundles(expires_at)
CREATE INDEX IF NOT EXISTS ix_bundles_expires_at ON bundles(expires_at);
-- 변경분 탐지: bundles(updated_at)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='bundles' AND column_name='updated_at'
  ) THEN
    ALTER TABLE bundles ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS ix_bundles_updated_at ON bundles(updated_at);

COMMIT;
```

> **설계 포인트**
> 
> - **참여자 ≤2명**을 **slot(1,2)** 로 강제 → 트리거 없이 DB 레벨에서 보장.
>     
> - **층 단일 진행 세션** 유니크 인덱스로 동시 세션 방지 → 쓰기차단 로직 단순화.
>     
> - 벌점/제출은 4주차에 `penalties` 등으로 확장.

---

## E. 검사 대상 조회/필터 정의

    
-  API:
    
    -  `GET /api/inspections/sessions/{id}/candidates?filter=expired|changed`
        
    -  결과에 `owner, label, itemNumber, name, expiresAt, dday, lastUpdated` 포함
        


---

# Week 4 — 검사 제출·벌점 원본·리포트
---

## B. DB 마이그레이션 (Flyway: `V4__inspection_submit_penalties.sql`)

> 3주차 스키마에 **추가/보강만** 수행(Forward-only). 드롭/리네임 금지.

```sql
BEGIN;
-- V4 패치: SUBMITTED 허용으로 CHECK 재정의
DO $$
DECLARE conname text;
BEGIN
  SELECT tc.constraint_name INTO conname
  FROM information_schema.table_constraints tc
  JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
  WHERE tc.table_name='inspection_sessions'
    AND tc.constraint_type='CHECK'
    AND cc.check_clause ILIKE '%status%';

  IF conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE inspection_sessions DROP CONSTRAINT %I', conname);
  END IF;
END $$;

ALTER TABLE inspection_sessions
  ADD CONSTRAINT ck_inspection_sessions_status
  CHECK (status IN ('IN_PROGRESS','SUBMITTED','CANCELED'));
-- 공통 updated_at 자동 갱신
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tg_bundles_updated_at ON bundles;
CREATE TRIGGER tg_bundles_updated_at
BEFORE UPDATE ON bundles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- 1) inspection_sessions: 제출 메타 추가 + 상태 ENUM 확장
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='inspection_sessions' AND column_name='submitted_at'
  ) THEN
    ALTER TABLE inspection_sessions
      ADD COLUMN submitted_at TIMESTAMPTZ,
      ADD COLUMN submitted_by BIGINT REFERENCES users(user_id);
  END IF;
END $$;

-- 상태 체크 제약은 텍스트 CHECK로 운용 중이므로 값 확장만 가정:
-- ('IN_PROGRESS','ENDED','CANCELED') → 'SUBMITTED' 추가 (ENDED는 구버전 호환용)
-- 별도 DDL 불필요. (신규 코드는 SUBMITTED 사용)

-- 2) 벌점(원본 불변) + 조정
CREATE TABLE IF NOT EXISTS penalties (
  penalty_id   BIGSERIAL PRIMARY KEY,
  user_id      BIGINT NOT NULL REFERENCES users(user_id),
  session_id   BIGINT NOT NULL REFERENCES inspection_sessions(session_id) ON DELETE CASCADE,
  bundle_id    BIGINT REFERENCES bundles(bundle_id),
  base_points  INT NOT NULL,           -- 정책 기본값(예: 1점). 원본은 불변.
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_penalties_user ON penalties(user_id);
CREATE INDEX IF NOT EXISTS ix_penalties_session ON penalties(session_id);

CREATE TABLE IF NOT EXISTS penalty_adjustments (
  adjustment_id BIGSERIAL PRIMARY KEY,
  penalty_id    BIGINT NOT NULL REFERENCES penalties(penalty_id) ON DELETE CASCADE,
  delta         INT NOT NULL,
  reason        TEXT,
  created_by    BIGINT NOT NULL REFERENCES users(user_id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) 층별장(활성 최대 2명 슬롯) — 없으면 생성
CREATE TABLE IF NOT EXISTS floor_leads (
  floor_lead_id BIGSERIAL PRIMARY KEY,
  floor_no      INT NOT NULL,
  user_id       BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  lead_slot     SMALLINT NOT NULL CHECK (lead_slot IN (1,2)),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  assigned_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at    TIMESTAMPTZ
);
-- floors FK는 기존 테이블 유무에 따라 선택
-- ALTER TABLE floor_leads ADD CONSTRAINT fk_floor_leads_floor
--   FOREIGN KEY (floor_no) REFERENCES floors(floor_no);

CREATE UNIQUE INDEX IF NOT EXISTS uq_floor_leads_active
  ON floor_leads(floor_no, lead_slot) WHERE is_active = true;

COMMIT;
```

> **정책 맵(간단 버전)**
> 
> - `DISCARD` → **벌점 1점**
>     
> - `NO_STICKER_DISCARD` → 벌점 0점
>     
> - `PASS/WARNING` → 벌점 0점  
>     (세부 점수 정책은 차후 `ref_penalty_rules`로 마스터화 가능)
>     

---


---

## D. API 스펙(초안)

### 1) 검사 제출/리포트

-  `POST /api/inspections/sessions/{id}/submit`
    
    - 권한: `INSPECTOR`(세션 생성자 또는 참여자)
        
    - Res 예시:
        
        ```json
        {
          "sessionId": 123,
          "submittedAt": "2025-09-01T10:30:00Z",
          "submittedBy": 45,
          "summary": { "PASS": 10, "WARNING": 3, "DISCARD": 2, "NO_STICKER_DISCARD": 1 },
          "penalties": [
            { "penaltyId": 777, "userId": 12, "bundleId": 555, "points": 1 }
          ]
        }
        ```
        

### 2) 벌점 조회/조정

-  `GET /api/penalties?userId=&sessionId=` (ADMIN/INSPECTOR: 권한 범위 내)
    
-  `POST /api/penalties/{penaltyId}/adjustments` (ADMIN 전용)
    
    - req: `{ "delta": -1, "reason": "오검사 정정" }`
        

### 3) 층별장 관리

-  `POST /api/admin/floors/{floorNo}/leads` (lead_slot 1 or 2, user 지정)
    
-  `PATCH /api/admin/floors/{floorNo}/leads/{leadId}/revoke` (`is_active=false`, `revoked_at=now()`)
    

### 4) 냉장고 초기화(소프트 삭제)

-  `POST /api/admin/refrigerators/{floorNo}/reset`
    
    - 내부: 해당 층의 모든 `bundles`에 `status='REMOVED'`, `deleted_at=now()`
        
    - 옵션: `?dryRun=true`로 **영향 건수만** 리턴
        

---

## E. 리포트 집계 로직(쿼리 요지)

- 세션 요약:
    

```sql
SELECT action, COUNT(*) AS cnt
FROM inspection_actions
WHERE session_id = :id
GROUP BY action;
```

- 제출 시 벌점 생성 대상:
    

```sql
SELECT ia.bundle_id, b.owner_user_id
FROM inspection_actions ia
JOIN bundles b ON b.bundle_id = ia.bundle_id
WHERE ia.session_id = :id AND ia.action = 'DISCARD';
```

- 사용자별 벌점 합산(원본+조정):
    

```sql
SELECT p.user_id,
       SUM(p.base_points) + COALESCE(SUM(pa.delta),0) AS total_points
FROM penalties p
LEFT JOIN penalty_adjustments pa ON pa.penalty_id = p.penalty_id
WHERE p.session_id = :id
GROUP BY p.user_id;
```




---

# Week 5 — 알림 파이프라인(PWA/Web Push/딥링크)
    

**DoD(주차 종료 기준)**

- 설치 배지/버튼으로 **홈 화면 추가** 가능
    
- 푸시 수신 & 클릭 시 **딥링크 진입**
    
- SW 업데이트 알림 정상 표시
    
- Lighthouse **PWA 항목 ≥ 90**

- PWA 푸시 토큰 저장 스키마
```sql
-- V5__push_tokens.sql
BEGIN;
CREATE TABLE IF NOT EXISTS push_tokens (
  token_id    BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  token       TEXT   NOT NULL,
  platform    TEXT   NOT NULL CHECK (platform IN ('WEB')),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at  TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_push_token ON push_tokens(token);
CREATE INDEX IF NOT EXISTS ix_push_tokens_user ON push_tokens(user_id);
COMMIT;
```
---


---

## E. 서비스워커(sw.js) 최소 로직

-  **프리캐시**(선택): 핵심 정적 리소스(HTML/CSS/JS/아이콘)
    
-  **푸시 수신**
    
    ```js
    self.addEventListener('push', (e) => {
      const data = e.data?.json() || {};
      const { title='알림', body='', deeplink='/' } = data;
      e.waitUntil(self.registration.showNotification(title, { body, data:{ deeplink } }));
    });
    self.addEventListener('notificationclick', (e) => {
      e.notification.close();
      const url = e.notification.data?.deeplink || '/';
      e.waitUntil(clients.openWindow(url));
    });
    ```
    
-  **업데이트 적용**
    
    ```js
    self.addEventListener('install', () => self.skipWaiting());
    self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
    ```
    
-  **오프라인 폴백(선택)**: `fetch` 실패 시 `/offline` 반환
    


# Week 6 — PWA 고도화



- Lighthouse **PWA ≥ 90**, 오프라인에서 `/offline` 정상 노출
    
- 새 SW 배포 시 **업데이트 토스트 → 재로딩** 동작
    
- Android/Chrome에서 **푸시→딥링크** OK, 토큰 갱신/철회 로그 확인
    

---


**요지 스니펫**

```js
const RUNTIME = 'runtime-v1';
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const isHTML = req.mode === 'navigate';
  if (isHTML) {
    e.respondWith(
      fetch(req).catch(() => caches.match('/offline'))
    );
    return;
  }
  const url = new URL(req.url);
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(caches.open(RUNTIME).then(async cache => {
      const cached = await cache.match(req);
      if (cached) return cached;
      const res = await fetch(req);
      cache.put(req, res.clone());
      return res;
    }));
    return;
  }
  // API network-first (예: /api)
  if (url.pathname.startsWith('/api')) {
    e.respondWith(
      fetch(req).then(res => {
        return res;
      }).catch(() => caches.match(req))
    );
  }
});
```

### B-3) 업데이트 UX

-  SW `waiting` 감지 → 앱에 **“새 버전 이용하기”** 토스트 노출
    

    

**앱 측 요지**

```ts
navigator.serviceWorker.addEventListener('controllerchange', () => {
  window.location.reload();
});
```

**SW 측**

```js
self.addEventListener('message', (e) => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
```



---


---

# Week 7 — 통합 테스트 & 배포



---

## H) 릴리즈 & 스모크 테스트(실행 순서)

-  태그: `v0.1.0-pwa` (SemVer)
    
-  CI 빌드(웹/백)→Docker/배포→DB 마이그레이션(있다면)→헬스체크
    
-  **스모크**
    
    ```bash
    # 헬스
    curl -fsS https://<domain>/api/health
    # 정적/manifest/sw 확인
    curl -I https://<domain>/manifest.json
    curl -I https://<domain>/sw.js
    # 로그인 → 토큰 저장 → 테스트 푸시
    # (Swagger or Postman으로 /api/push/tokens, /api/admin/notifications/test 호출)
    ```
    

