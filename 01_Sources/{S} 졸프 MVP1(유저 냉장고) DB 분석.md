---
type: 소스
status: inbox
topics: 
source_url: "{{SOURCE}}"
author: 
creation_date: 2025-08-19
---

## 0) 스키마 & 확장 — 실행환경 준비

### 0-1. 스키마/검색경로

```sql
-- [기능] 기본 스키마/검색경로 설정
BEGIN;                                                   -- 트랜잭션 시작
CREATE SCHEMA IF NOT EXISTS public AUTHORIZATION pg_database_owner; -- public 스키마 생성(없을 시), 소유자 설정
SET search_path = public;                                -- 기본 검색경로를 public으로 설정
```

### 0-2. 확장 설치

```sql
-- [기능] 확장 설치: citext/btree_gist/pg_trgm
CREATE EXTENSION IF NOT EXISTS citext  WITH SCHEMA public;   -- 대소문자 구분 없는 문자열 타입
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;-- 배타 제약/범위 겹침 검사용 인덱스 연산자군
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;   -- trigram 기반 유사 검색 가속
```

---

## 1) ENUM 타입 — 도메인 상태 강제

```sql
-- [기능] 냉장칸/묶음/서브아이템 상태
CREATE TYPE public.compartment_type   AS ENUM ('REFRIGERATED','FREEZER');
CREATE TYPE public.bundle_status      AS ENUM ('ACTIVE','REMOVED');
CREATE TYPE public.sub_item_status    AS ENUM ('STORED','CONSUMED');

-- [기능] 점검 상태/위반유형/결과
CREATE TYPE public.inspection_status  AS ENUM ('SCHEDULED','IN_PROGRESS','COMPLETED','CANCELED');
CREATE TYPE public.violation_type     AS ENUM ('EXPIRED','NO_STICKER','POOR_CONDITION','INFO_MISMATCH');
CREATE TYPE public.inspection_outcome AS ENUM ('PASS','WARNING','DISCARD','DISCARD_WITH_PENALTY');

-- [기능] 층/호실 성별, 알림 읽힘 처리, 이벤트 소스, 정책 값 타입
CREATE TYPE public.room_gender_type       AS ENUM ('MALE','FEMALE');
CREATE TYPE public.notification_read_via  AS ENUM ('MANUAL','AUTO_TOPIC','AUTO_ENTITY','AUTO_PAGE');
CREATE TYPE public.domain_event_source    AS ENUM ('DOMAIN','ROW_AUDIT','API','SYSTEM');
CREATE TYPE public.policy_value_type      AS ENUM ('INT','BOOL','TEXT','INTERVAL','JSON');
```

---

## 2) 권한/역할 (간단 RBAC) — 접근제어 뼈대

### 2-1. 권한/역할/매핑

```sql
-- [TABLE] permissions: 권한 코드 마스터
CREATE TABLE IF NOT EXISTS permissions (
  permission_code varchar(64) PRIMARY KEY,  -- PK: 권한 식별자
  description     varchar(255) NOT NULL     -- 권한 설명
);

-- [TABLE] roles: 역할 마스터
CREATE TABLE IF NOT EXISTS roles (
  role_id     bigserial PRIMARY KEY,        -- PK
  role_name   varchar(50) UNIQUE NOT NULL,  -- 역할명(유니크)
  description varchar(255)
);

-- [TABLE] role_permissions: 역할-권한 매핑(M:N)
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id         bigint      NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
  permission_code varchar(64) NOT NULL REFERENCES permissions(permission_code) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_code)    -- 복합 PK(중복 방지)
);
```

---

## 3) 층 마스터(floors) — 성별 정책 원천

### 3-1. 테이블 및 시드

```sql
-- [TABLE] floors: 층별 성별 정책
CREATE TABLE IF NOT EXISTS public.floors (
  floor INT PRIMARY KEY,                  -- PK: 층 번호
  gender public.room_gender_type NOT NULL -- 해당 층의 성별 정책
);

-- [SEED] 기본 정책(2층 남, 3~5층 여)
INSERT INTO public.floors(floor, gender) VALUES
  (2,'MALE'), (3,'FEMALE'), (4,'FEMALE'), (5,'FEMALE')
ON CONFLICT DO NOTHING;                   -- 이미 있으면 무시
```

---

## 4) 기초 마스터(호실) — 메타데이터/규칙/트리거

### 4-1. 테이블/인덱스

```sql
-- [TABLE] dorm_rooms: 호실 메타데이터
CREATE TABLE IF NOT EXISTS dorm_rooms (
  dorm_room_id bigserial PRIMARY KEY,                                    -- PK
  room_number  int NOT NULL,                                             -- 호실 번호(예: 301)
  floor        int NOT NULL REFERENCES public.floors(floor),             -- 소속 층
  gender       public.room_gender_type NOT NULL,                         -- 호실 성별
  capacity     int NOT NULL DEFAULT 3,                                   -- 정원(기본 3)
  is_active    boolean NOT NULL DEFAULT true,                            -- 활성 여부
  CONSTRAINT uk_floor_room UNIQUE (floor, room_number),                  -- 층 내 호실 유니크
  CONSTRAINT ck_room_number_floor CHECK (room_number >= floor*100 + 1 AND room_number < (floor+1)*100) -- 번호 규칙
);

-- [INDEX] 층 기준 검색 가속
CREATE INDEX IF NOT EXISTS ix_dorm_rooms_floor ON dorm_rooms (floor);
```

### 4-2. 층-성별 정책 강제 트리거

```sql
-- [FUNC] enforce_dorm_room_gender_by_floor: 층 정책과 호실 성별 일치 검증
CREATE OR REPLACE FUNCTION public.enforce_dorm_room_gender_by_floor()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_gender public.room_gender_type;
BEGIN
  SELECT gender INTO v_gender FROM public.floors WHERE floor = NEW.floor; -- 층 정책 조회
  IF v_gender IS NULL THEN
    RAISE EXCEPTION 'Undefined floor policy for floor %', NEW.floor;      -- 미정의 방지
  END IF;
  IF NEW.gender IS DISTINCT FROM v_gender THEN
    RAISE EXCEPTION 'Room gender % does not match floor % policy %', NEW.gender, NEW.floor, v_gender; -- 불일치 차단
  END IF;
  RETURN NEW;
END$$;

-- [TRIGGER] 호실 INSERT/UPDATE 시 정책 강제
DROP TRIGGER IF EXISTS trg_dorm_room_gender_by_floor ON public.dorm_rooms;
CREATE TRIGGER trg_dorm_room_gender_by_floor
BEFORE INSERT OR UPDATE OF floor, gender ON public.dorm_rooms
FOR EACH ROW EXECUTE FUNCTION public.enforce_dorm_room_gender_by_floor();
```

---

## 5) 사용자/인증 — 사용자, 세션/토큰, 로그인 시도

### 5-1. users 및 인덱스

```sql
-- [TABLE] users: 사용자 기본
CREATE TABLE IF NOT EXISTS users (
  user_id bigserial PRIMARY KEY,                                       -- PK
  dorm_room_id bigint REFERENCES dorm_rooms(dorm_room_id) ON DELETE SET NULL, -- 배정 호실(삭제 시 NULL)
  personal_number int,                                                 -- 호실 내 개인 번호
  login_id public.citext UNIQUE NOT NULL,                              -- 로그인 ID(대소문자 무시)
  password_hash text NOT NULL,                                         -- 비밀번호 해시
  email public.citext UNIQUE NOT NULL,                                 -- 이메일(대소문자 무시)
  role_id bigint REFERENCES roles(role_id),                            -- 레거시 단일 역할
  email_verified_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz,
  password_updated_at timestamptz,
  deactivated_at timestamptz,
  CONSTRAINT chk_users_personal_number_positive CHECK (personal_number IS NULL OR personal_number > 0)
);

-- [INDEX] 활성/호실/역할
CREATE INDEX IF NOT EXISTS ix_users_active  ON users (is_active);
CREATE INDEX IF NOT EXISTS ix_users_room    ON users (dorm_room_id);
CREATE INDEX IF NOT EXISTS ix_users_role    ON users (role_id);

-- [UNIQUE] 동일 호실의 개인번호 유니크(NULL 제외)
CREATE UNIQUE INDEX IF NOT EXISTS ux_users_room_person
  ON users (dorm_room_id, personal_number)
  WHERE dorm_room_id IS NOT NULL AND personal_number IS NOT NULL;
```

### 5-2. user_roles 및 백필

```sql
-- [TABLE] user_roles: 사용자-역할 M:N
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id BIGINT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  role_id BIGINT NOT NULL REFERENCES public.roles(role_id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);
CREATE INDEX IF NOT EXISTS ix_user_roles_role ON public.user_roles(role_id);

-- [MIGRATION] 레거시 단일 역할을 M:N으로 백필(멱등)
INSERT INTO public.user_roles(user_id, role_id)
SELECT user_id, role_id FROM public.users WHERE role_id IS NOT NULL
ON CONFLICT DO NOTHING;
```

### 5-3. 세션/토큰/로그인 시도

```sql
-- [TABLE] auth_sessions: 리프레시 토큰 세션
CREATE TABLE IF NOT EXISTS auth_sessions (
  session_id bigserial PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  refresh_token_hash text NOT NULL,   -- 해시만 저장
  user_agent text,
  ip inet,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,    -- 생성보다 이후여야 함
  revoked_at timestamptz,
  CONSTRAINT ck_auth_sessions_exp CHECK (expires_at > created_at)
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_auth_sessions_user_token ON auth_sessions (user_id, refresh_token_hash);
CREATE INDEX IF NOT EXISTS ix_auth_sessions_user ON auth_sessions (user_id);
CREATE INDEX IF NOT EXISTS ix_auth_sessions_exp  ON auth_sessions (expires_at);

-- [TABLE] email_verification_tokens: 이메일 인증 토큰
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  token_id bigserial PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  CONSTRAINT ux_evt_token UNIQUE (token_hash),
  CONSTRAINT ck_evt_exp CHECK (expires_at > sent_at)
);
CREATE INDEX IF NOT EXISTS ix_evt_user ON email_verification_tokens (user_id);
CREATE INDEX IF NOT EXISTS ix_evt_exp  ON email_verification_tokens (expires_at);

-- [TABLE] password_reset_tokens: 비밀번호 재설정
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  token_id bigserial PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  CONSTRAINT ux_prt_token UNIQUE (token_hash),
  CONSTRAINT ck_prt_exp CHECK (expires_at > requested_at)
);
CREATE INDEX IF NOT EXISTS ix_prt_user ON password_reset_tokens (user_id);
CREATE INDEX IF NOT EXISTS ix_prt_exp  ON password_reset_tokens (expires_at);

-- [TABLE] auth_login_attempts: 로그인 시도 로그
CREATE TABLE IF NOT EXISTS auth_login_attempts (
  attempt_id bigserial PRIMARY KEY,
  login_id public.citext NOT NULL,
  success boolean NOT NULL,
  ip inet,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_ala_login_time ON auth_login_attempts (login_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS ix_ala_success    ON auth_login_attempts (success);
```

---

## 6) 로그/이벤트 — 도메인/감사 이벤트 수집

### 6-1. 테이블/인덱스/뷰

```sql
-- [TABLE] domain_event: 도메인/감사 이벤트 저장
CREATE TABLE IF NOT EXISTS domain_event (
  id            bigserial PRIMARY KEY,
  entity_type   text NOT NULL,
  entity_id     bigint NOT NULL,
  actor_user_id bigint,
  action        text NOT NULL,
  details       jsonb,
  occurred_at   timestamptz NOT NULL DEFAULT now(),
  source        public.domain_event_source NOT NULL DEFAULT 'DOMAIN',
  request_id    text,
  idempotency_key text
);
CREATE INDEX IF NOT EXISTS ix_domain_event_time ON domain_event (occurred_at);
CREATE INDEX IF NOT EXISTS ix_domain_event_src  ON domain_event (source);
CREATE INDEX IF NOT EXISTS ix_domain_event_ent  ON domain_event (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS ix_domain_event_entity_time ON domain_event (entity_type, entity_id, occurred_at DESC);

-- [VIEW] activity_logs: ROW_AUDIT만 필터링하여 조회 단순화
CREATE OR REPLACE VIEW activity_logs AS
SELECT
  de.id            AS log_id,
  de.actor_user_id AS user_id,
  de.action        AS action_type,
  de.details       AS details,
  de.occurred_at   AS occurred_at
FROM domain_event de
WHERE de.source = 'ROW_AUDIT';
```

---

## 7) 냉장고/칸/접근규칙 — 재고/접근/점검/층별장 전반

### 7-1. 냉장고/칸/접근 규칙

```sql
-- [TABLE] refrigerators: 냉장고 마스터
CREATE TABLE IF NOT EXISTS refrigerators (
  refrigerator_id bigserial PRIMARY KEY,
  name varchar(100) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  floor int REFERENCES public.floors(floor),
  refrigerated_slots int NOT NULL,
  freezer_slots int NOT NULL,
  layout_updated_at timestamptz NOT NULL DEFAULT now(),
  capacity_liters int,
  created_at timestamptz NOT NULL DEFAULT now(),
  location_description varchar(255),
  CONSTRAINT ck_refrigerators_slots_nonneg CHECK (refrigerated_slots >= 0 AND freezer_slots >= 0)
);
CREATE INDEX IF NOT EXISTS ix_refrigerators_floor ON refrigerators (floor);

-- [TABLE] compartments: 냉장고 칸
CREATE TABLE IF NOT EXISTS compartments (
  compartment_id bigserial PRIMARY KEY,
  refrigerator_id bigint NOT NULL REFERENCES refrigerators(refrigerator_id) ON DELETE CASCADE,
  label varchar(50) NOT NULL,
  type public.compartment_type NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT uk_compartment_per_fridge UNIQUE (refrigerator_id, label)
);
CREATE INDEX IF NOT EXISTS ix_compartments_active ON compartments (is_active);
CREATE INDEX IF NOT EXISTS ix_compartments_fridge ON compartments (refrigerator_id);

-- [TABLE] compartment_access_rules: 칸 접근 허용 범위(호실 번호)
CREATE TABLE IF NOT EXISTS compartment_access_rules (
  rule_id bigserial PRIMARY KEY,
  compartment_id bigint NOT NULL REFERENCES compartments(compartment_id) ON DELETE CASCADE,
  start_room_number int NOT NULL,
  end_room_number   int NOT NULL,
  room_range int4range GENERATED ALWAYS AS (int4range(start_room_number, end_room_number, '[]')) STORED,
  CONSTRAINT ck_access_range CHECK (end_room_number >= start_room_number),
  CONSTRAINT no_overlap_compartment_access EXCLUDE USING gist (
    compartment_id WITH =,
    room_range     WITH &&
  )
);
CREATE INDEX IF NOT EXISTS ix_access_compartment ON compartment_access_rules (compartment_id);
CREATE INDEX IF NOT EXISTS ix_access_gist ON compartment_access_rules USING gist (room_range);
```

### 7-2. 묶음/서브아이템

```sql
-- [TABLE] item_bundles: 스티커 번호 단위 묶음
CREATE TABLE IF NOT EXISTS item_bundles (
  bundle_id       bigserial PRIMARY KEY,
  user_id         bigint NOT NULL REFERENCES users(user_id),
  compartment_id  bigint NOT NULL REFERENCES compartments(compartment_id),
  item_number     smallint NOT NULL CHECK (item_number BETWEEN 1 AND 999),
  bundle_name     varchar(100),
  status          public.bundle_status NOT NULL DEFAULT 'ACTIVE',
  remaining_count int NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  removed_at      timestamptz,
  number_period   tstzrange GENERATED ALWAYS AS (
    tstzrange(created_at, COALESCE(removed_at, 'infinity'::timestamptz), '[)')
  ) STORED
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_bundle_active_number
  ON item_bundles (compartment_id, item_number)
  WHERE status='ACTIVE';
CREATE INDEX IF NOT EXISTS ix_bundles_user        ON item_bundles (user_id);
CREATE INDEX IF NOT EXISTS ix_bundles_compartment ON item_bundles (compartment_id);
CREATE INDEX IF NOT EXISTS ix_bundles_status      ON item_bundles (status);
CREATE INDEX IF NOT EXISTS ix_bundles_comp_status ON item_bundles (compartment_id, status);
CREATE INDEX IF NOT EXISTS ix_bundles_user_status ON item_bundles (user_id, status);

-- [CONSTRAINT] 기간 겹침 없는 칸/번호 보장(GiST 배타 제약)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='no_overlap_bundle_number_per_compartment'
  ) THEN
    ALTER TABLE public.item_bundles
      ADD CONSTRAINT no_overlap_bundle_number_per_compartment
      EXCLUDE USING gist (
        compartment_id WITH =,
        item_number    WITH =,
        number_period  WITH &&
      );
  END IF;
END$$;

-- [TABLE] sub_items: 묶음 내 개별 품목
CREATE TABLE IF NOT EXISTS sub_items (
  sub_item_id   bigserial PRIMARY KEY,
  bundle_id     bigint NOT NULL REFERENCES item_bundles(bundle_id) ON DELETE CASCADE,
  sub_item_name varchar(100),
  expiry_date   date,
  status        public.sub_item_status NOT NULL DEFAULT 'STORED',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_sub_items_bundle         ON sub_items (bundle_id);
CREATE INDEX IF NOT EXISTS ix_sub_items_status         ON sub_items (status);
CREATE INDEX IF NOT EXISTS ix_sub_items_exp_stored     ON sub_items (expiry_date) WHERE status='STORED';
CREATE INDEX IF NOT EXISTS ix_sub_items_bundle_status  ON sub_items (bundle_id, status);
CREATE INDEX IF NOT EXISTS ix_sub_items_bundle_status_exp ON sub_items (bundle_id, status, expiry_date);
```

### 7-3. 점검 세션/참여자/결과

```sql
-- [TABLE] fridge_inspections: 점검 세션(냉장고당 동시 1개 진행)
CREATE TABLE IF NOT EXISTS fridge_inspections (
  inspection_id   bigserial PRIMARY KEY,
  refrigerator_id bigint NOT NULL REFERENCES refrigerators(refrigerator_id),
  initiated_by    bigint NOT NULL REFERENCES users(user_id),
  scheduled_at    timestamptz,
  started_at      timestamptz,
  completed_at    timestamptz,
  status          public.inspection_status NOT NULL DEFAULT 'SCHEDULED',
  created_at      timestamptz NOT NULL DEFAULT now(),
  note            varchar(255)
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_active_inspection_per_fridge
  ON fridge_inspections (refrigerator_id) WHERE (status = 'IN_PROGRESS');
CREATE INDEX IF NOT EXISTS ix_inspections_ref_status ON fridge_inspections (refrigerator_id, status);
CREATE INDEX IF NOT EXISTS ix_inspections_times      ON fridge_inspections (scheduled_at, started_at, completed_at);

-- [TABLE] fridge_inspection_participants: 점검 참여자
CREATE TABLE IF NOT EXISTS fridge_inspection_participants (
  inspection_id  bigint NOT NULL REFERENCES fridge_inspections(inspection_id) ON DELETE CASCADE,
  user_id        bigint NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  joined_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (inspection_id, user_id)
);
CREATE INDEX IF NOT EXISTS ix_fip_user ON public.fridge_inspection_participants (user_id);

-- [TABLE] inspection_results: 점검 결과(품목/묶음 단위)
CREATE TABLE IF NOT EXISTS inspection_results (
  inspection_result_id bigserial PRIMARY KEY,
  inspection_id  bigint NOT NULL REFERENCES fridge_inspections(inspection_id) ON DELETE CASCADE,
  bundle_id      bigint REFERENCES item_bundles(bundle_id) ON DELETE SET NULL,
  sub_item_id    bigint REFERENCES sub_items(sub_item_id) ON DELETE SET NULL,
  outcome        public.inspection_outcome NOT NULL,
  violation_type public.violation_type,
  notes          text,
  handled_by     bigint REFERENCES users(user_id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_ir_unique_per_subitem
  ON public.inspection_results (inspection_id, sub_item_id)
  WHERE sub_item_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_ir_unique_per_bundle
  ON public.inspection_results (inspection_id, bundle_id)
  WHERE sub_item_id IS NULL AND bundle_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_ir_inspection ON public.inspection_results (inspection_id);
CREATE INDEX IF NOT EXISTS ix_ir_handled_by ON public.inspection_results (handled_by);
```

### 7-4. 층별장(층 책임자)

```sql
-- [TABLE] floor_leads: 층별 책임자(활동기간 관리)
CREATE TABLE IF NOT EXISTS floor_leads (
  floor     int NOT NULL REFERENCES public.floors(floor),
  user_id   bigint NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at   timestamptz,
  floor_lead_id bigserial PRIMARY KEY,
  active_period tstzrange GENERATED ALWAYS AS (tstzrange(starts_at, COALESCE(ends_at, 'infinity'::timestamptz), '[)')) STORED
);
CREATE INDEX IF NOT EXISTS ix_floor_leads_user  ON floor_leads (user_id);
CREATE INDEX IF NOT EXISTS ix_floor_leads_floor ON floor_leads (floor);
CREATE INDEX IF NOT EXISTS ix_floor_leads_period_gist ON public.floor_leads USING gist (active_period);

-- [CONSTRAINT] 동일 사용자에 대한 활동 기간 겹침 금지(GiST 배타 제약)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'no_overlap_floor_leads_by_user'
  ) THEN
    ALTER TABLE public.floor_leads
      ADD CONSTRAINT no_overlap_floor_leads_by_user
      EXCLUDE USING gist (user_id WITH =, active_period WITH &&);
  END IF;
END$$;
```

---

## 8) 알림 — 타입/알림/보낸 기록/설정/구독

### 8-1. 알림 타입/알림 본문

```sql
-- [TABLE] notification_types: 알림 종류 마스터
CREATE TABLE IF NOT EXISTS notification_types (
  type_code varchar(50) PRIMARY KEY,
  description varchar(255) NOT NULL,
  is_user_configurable boolean NOT NULL DEFAULT true
);

-- [TABLE] notifications: 알림 인스턴스
CREATE TABLE IF NOT EXISTS notifications (
  notification_id bigserial PRIMARY KEY,
  recipient_id bigint NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  read_via public.notification_read_via,
  notification_type_code varchar(50) NOT NULL REFERENCES notification_types(type_code),
  related_entity_type varchar(50),
  related_entity_id bigint,
  topic_key varchar(100),
  topic_params jsonb,
  payload jsonb,
  deeplink text,
  expires_at timestamptz,
  priority smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ck_notifications_related_pair CHECK (
    (related_entity_type IS NULL AND related_entity_id IS NULL)
    OR (related_entity_type IS NOT NULL AND related_entity_id IS NOT NULL)
  ),
  CONSTRAINT ck_notifications_topic_pair CHECK (
    (topic_key IS NULL AND topic_params IS NULL)
    OR (topic_key IS NOT NULL AND topic_params IS NOT NULL)
  )
);
```

### 8-2. 인덱스(알림)

```sql
-- [INDEX] 다양한 조회/정렬/필터 최적화
CREATE INDEX IF NOT EXISTS ix_notifications_user_read        ON notifications (recipient_id, is_read);
CREATE INDEX IF NOT EXISTS ix_notifications_user_read_time   ON notifications (recipient_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_notifications_type             ON notifications (notification_type_code);
CREATE INDEX IF NOT EXISTS ix_notifications_unread           ON notifications (recipient_id, created_at DESC) WHERE is_read=false;
CREATE INDEX IF NOT EXISTS ix_notifications_user_unread_topic ON notifications (recipient_id, is_read, topic_key);
CREATE INDEX IF NOT EXISTS ix_notifications_user_entity_unread ON notifications (recipient_id, is_read, related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS ix_notifications_expires_at       ON notifications (expires_at);
CREATE INDEX IF NOT EXISTS ix_notifications_payload_gin      ON notifications USING gin (payload jsonb_path_ops);
CREATE INDEX IF NOT EXISTS ix_notifications_topic_params_gin ON notifications USING gin (topic_params jsonb_path_ops);
CREATE INDEX IF NOT EXISTS ix_notifications_content_trgm     ON notifications USING gin (content gin_trgm_ops);
```

### 8-3. 발송 로그/사용자 설정/구독

```sql
-- [TABLE] sent_notifications_log: 발송 이력(중복 방지)
CREATE TABLE IF NOT EXISTS sent_notifications_log (
  log_id bigserial PRIMARY KEY,
  recipient_id bigint NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  notification_type_code varchar(50) NOT NULL REFERENCES notification_types(type_code),
  related_entity_type varchar(50) NOT NULL,
  related_entity_id bigint NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (recipient_id, notification_type_code, related_entity_type, related_entity_id)
);
CREATE INDEX IF NOT EXISTS ix_snl_recipient ON sent_notifications_log (recipient_id);
CREATE INDEX IF NOT EXISTS ix_snl_related   ON sent_notifications_log (related_entity_type, related_entity_id);

-- [TABLE] user_notification_settings: 사용자별 알림 타입 on/off
CREATE TABLE IF NOT EXISTS user_notification_settings (
  user_id bigint NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  notification_type_code varchar(50) NOT NULL REFERENCES notification_types(type_code) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT true,
  PRIMARY KEY (user_id, notification_type_code)
);

-- [TABLE] user_notification_subscriptions: 푸시 구독(웹/앱)
CREATE TABLE IF NOT EXISTS user_notification_subscriptions (
  subscription_id bigserial PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  platform varchar(20),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz,
  CONSTRAINT ux_uns_endpoint UNIQUE (endpoint)
);
CREATE INDEX IF NOT EXISTS ix_uns_user_active ON user_notification_subscriptions (user_id) WHERE is_active;
```

---

## 9) 정책화 — policy 정의 & 저장소

```sql
-- [TABLE] app_policies: 실제 적용 정책 값 저장
CREATE TABLE IF NOT EXISTS app_policies (
  policy_key varchar(100) PRIMARY KEY,
  policy_value jsonb NOT NULL,
  category    varchar(50),
  description text,
  updated_by  bigint REFERENCES users(user_id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_app_policies_category ON public.app_policies (category);

-- [TABLE] app_policy_defs: 정책 스키마/타입/디폴트 정의
CREATE TABLE IF NOT EXISTS app_policy_defs (
  policy_key    varchar(100) PRIMARY KEY,
  value_type    public.policy_value_type NOT NULL,
  description   text,
  default_value jsonb,
  min_int       int,
  max_int       int,
  min_interval  interval,
  max_interval  interval,
  json_schema   jsonb
);
```

> **다음 문서(파트 2/2)** 에서 섹션 10) 공통/업무 함수 ~ 14) 시드 데이터까지 같은 형식으로 이어집니다.
## 💭 생각의 인큐베이터 (My Thoughts & Connections) 
- 