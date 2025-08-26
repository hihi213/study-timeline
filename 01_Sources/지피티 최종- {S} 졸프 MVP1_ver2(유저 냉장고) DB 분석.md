---
type: 소스
status: inbox
topics: 
source_url: "{{SOURCE}}"
author: 
creation_date: 2025-08-19
---

```SQL
-- =========================================================
-- Dormitory Resource Management — Final DDL (v1.2, patched)
--  - Patch A: max_active_floor_leads_per_floor default/seed = 2
--  - Patch B: inspection_results.ck_ir_target_xor relaxed for anonymous NO_STICKER discard
-- =========================================================

BEGIN;

-- =========================================================
-- 0) 스키마 & 확장 — 실행환경 준비
-- =========================================================
CREATE SCHEMA IF NOT EXISTS public AUTHORIZATION pg_database_owner;
SET search_path = public;

CREATE EXTENSION IF NOT EXISTS citext     WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS pg_trgm    WITH SCHEMA public;

-- =========================================================
-- 1) ENUM 타입 — 도메인 상태 강제
-- =========================================================
CREATE TYPE IF NOT EXISTS public.compartment_type      AS ENUM ('REFRIGERATED','FREEZER');
CREATE TYPE IF NOT EXISTS public.bundle_status         AS ENUM ('ACTIVE','REMOVED');
CREATE TYPE IF NOT EXISTS public.sub_item_status       AS ENUM ('STORED','CONSUMED');
CREATE TYPE IF NOT EXISTS public.inspection_status     AS ENUM ('SCHEDULED','IN_PROGRESS','COMPLETED','CANCELED');
CREATE TYPE IF NOT EXISTS public.violation_type        AS ENUM ('EXPIRED','NO_STICKER','PACKAGING_DEFECT','INFO_MISMATCH');
CREATE TYPE IF NOT EXISTS public.inspection_outcome    AS ENUM ('PASS','WARNING','DISCARD_ANONYMOUS','DISCARD_IDENTIFIED');
CREATE TYPE IF NOT EXISTS public.room_gender_type      AS ENUM ('MALE','FEMALE');
CREATE TYPE IF NOT EXISTS public.notification_read_via AS ENUM ('MANUAL','AUTO_TOPIC','AUTO_ENTITY','AUTO_PAGE');
CREATE TYPE IF NOT EXISTS public.domain_event_source   AS ENUM ('DOMAIN','ROW_AUDIT','API','SYSTEM');
CREATE TYPE IF NOT EXISTS public.policy_value_type     AS ENUM ('INT','BOOL','TEXT','INTERVAL','JSON');

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_event_type') THEN
    CREATE TYPE public.user_event_type AS ENUM
      ('CREATED','LOGIN_SUCCESS','PASSWORD_CHANGED','EMAIL_VERIFIED','DEACTIVATED','REACTIVATED');
  END IF;
END$$;

-- =========================================================
-- 2) 권한/역할 (간단 RBAC)
-- =========================================================
CREATE TABLE IF NOT EXISTS permissions (
  permission_code varchar(64) PRIMARY KEY,
  description     varchar(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS roles (
  role_id     bigserial PRIMARY KEY,
  role_name   varchar(50) UNIQUE NOT NULL,
  description varchar(255)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id         bigint NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
  permission_code varchar(64) NOT NULL REFERENCES permissions(permission_code) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_code)
);

CREATE INDEX IF NOT EXISTS ix_role_permissions_permission
  ON public.role_permissions (permission_code);

-- =========================================================
-- 3) 층 마스터(floors) — 층별 성별 정책, 호실 정의
-- =========================================================
CREATE TABLE IF NOT EXISTS public.floors (
  floor       INT PRIMARY KEY,
  gender      public.room_gender_type NOT NULL,
  max_room_no INT NOT NULL DEFAULT 24,
  CONSTRAINT uq_floors_floor_gender UNIQUE (floor, gender)
);
ALTER TABLE public.floors
  ADD CONSTRAINT ck_floors_max_room_no CHECK (max_room_no BETWEEN 1 AND 99);

CREATE TABLE IF NOT EXISTS public.dorm_rooms (
  dorm_room_id bigserial PRIMARY KEY,
  room_number  int NOT NULL,
  floor        int NOT NULL,
  gender       public.room_gender_type NOT NULL,
  capacity     int NOT NULL DEFAULT 3,
  is_active    boolean NOT NULL DEFAULT true,

  CONSTRAINT uk_floor_room UNIQUE (floor, room_number),
  CONSTRAINT ck_room_no_local CHECK (room_number BETWEEN 1 AND 99),

  CONSTRAINT fk_dorm_rooms_floor_gender
    FOREIGN KEY (floor, gender)
    REFERENCES public.floors (floor, gender)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  room_code int GENERATED ALWAYS AS (floor*100 + room_number) STORED
);
ALTER TABLE public.dorm_rooms
  ADD CONSTRAINT ck_dorm_rooms_capacity CHECK (capacity >= 1);

CREATE UNIQUE INDEX IF NOT EXISTS ux_dorm_rooms_room_code ON public.dorm_rooms(room_code);
CREATE INDEX        IF NOT EXISTS ix_dorm_rooms_floor_gender ON public.dorm_rooms (floor, gender);

CREATE OR REPLACE FUNCTION public.sync_room_gender_from_floor()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.floor IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT f.gender INTO STRICT NEW.gender
  FROM public.floors f
  WHERE f.floor = NEW.floor;
  RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS trg_dorm_rooms_sync_gender ON public.dorm_rooms;
CREATE TRIGGER trg_dorm_rooms_sync_gender
BEFORE INSERT OR UPDATE OF floor ON public.dorm_rooms
FOR EACH ROW EXECUTE FUNCTION public.sync_room_gender_from_floor();

CREATE OR REPLACE FUNCTION public.enforce_room_no_within_floor_max()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_max int;
BEGIN
  SELECT max_room_no INTO v_max FROM public.floors WHERE floor = NEW.floor;
  IF v_max IS NULL THEN
    RAISE EXCEPTION 'Floor % not found or max_room_no unset', NEW.floor;
  END IF;
  IF NEW.room_number < 1 OR NEW.room_number > v_max THEN
    RAISE EXCEPTION 'room_number % out of range 1..% for floor %',
      NEW.room_number, v_max, NEW.floor;
  END IF;
  RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS ctrg_room_no_range ON public.dorm_rooms;
CREATE CONSTRAINT TRIGGER ctrg_room_no_range
AFTER INSERT OR UPDATE OF room_number, floor ON public.dorm_rooms
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION public.enforce_room_no_within_floor_max();

-- =========================================================
-- 4) 사용자/인증 — 사용자, 세션/토큰, 로그인 시도
-- =========================================================
CREATE TABLE IF NOT EXISTS users (
  user_id bigserial PRIMARY KEY,
  dorm_room_id bigint REFERENCES dorm_rooms(dorm_room_id) ON DELETE SET NULL,
  personal_number int,
  login_id public.citext UNIQUE NOT NULL,
  password_hash text NOT NULL,
  email public.citext UNIQUE NOT NULL,
  role_id bigint REFERENCES roles(role_id),
  email_verified_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz,
  password_updated_at timestamptz,
  deactivated_at timestamptz,
  CONSTRAINT chk_users_personal_number_positive CHECK (personal_number IS NULL OR personal_number > 0)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='ck_users_login_id_format') THEN
    ALTER TABLE public.users
      ADD CONSTRAINT ck_users_login_id_format
      CHECK (login_id ~ '^[a-z0-9._-]{4,32}$') NOT VALID;
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.user_events (
  user_event_id  bigserial PRIMARY KEY,
  user_id        bigint NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  event_type     public.user_event_type NOT NULL,
  occurred_at    timestamptz NOT NULL DEFAULT now(),
  actor_user_id  bigint REFERENCES public.users(user_id) ON DELETE SET NULL,
  ip             inet,
  meta           jsonb,
  CONSTRAINT ck_meta_json CHECK (meta IS NULL OR jsonb_typeof(meta) IN ('object','array'))
);

CREATE INDEX IF NOT EXISTS ix_user_events_user_type_time ON public.user_events (user_id, event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS ix_user_events_time           ON public.user_events (occurred_at DESC);

CREATE OR REPLACE FUNCTION public.log_user_event(
  p_user_id bigint,
  p_type public.user_event_type,
  p_when timestamptz DEFAULT now(),
  p_actor bigint DEFAULT NULL,
  p_ip inet DEFAULT NULL,
  p_meta jsonb DEFAULT NULL
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.user_events(user_id, event_type, occurred_at, actor_user_id, ip, meta)
  VALUES (p_user_id, p_type, p_when, p_actor, p_ip, p_meta);
END$$;

CREATE OR REPLACE FUNCTION public.mark_user_verified_when_token_used()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.used_at IS NULL AND NEW.used_at IS NOT NULL AND NEW.used_at <= NEW.expires_at THEN
    UPDATE public.users
       SET email_verified_at = COALESCE(email_verified_at, NEW.used_at)
     WHERE user_id = NEW.user_id;

    PERFORM public.log_user_event(
      NEW.user_id, 'EMAIL_VERIFIED', NEW.used_at, NULL, NULL,
      jsonb_build_object('token_id', NEW.token_id)
    );
  END IF;
  RETURN NEW;
END$$;

CREATE OR REPLACE FUNCTION public.on_login_attempt_logged()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_user_id bigint;
BEGIN
  IF NEW.success THEN
    SELECT u.user_id INTO v_user_id FROM public.users u WHERE u.login_id = NEW.login_id;
    IF v_user_id IS NOT NULL THEN
      UPDATE public.users
         SET last_login_at = GREATEST(COALESCE(last_login_at, NEW.occurred_at), NEW.occurred_at)
       WHERE user_id = v_user_id;
      PERFORM public.log_user_event(v_user_id, 'LOGIN_SUCCESS', NEW.occurred_at, NULL, NEW.ip, NULL);
    END IF;
  END IF;
  RETURN NEW;
END$$;

CREATE OR REPLACE FUNCTION public.on_users_security_side_effects()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_actor BIGINT := NULLIF(current_setting('app.user_id', true), '')::BIGINT;
BEGIN
  IF TG_OP='UPDATE' AND NEW.password_hash IS DISTINCT FROM OLD.password_hash THEN
    NEW.password_updated_at := COALESCE(NEW.password_updated_at, now());
    PERFORM public.log_user_event(NEW.user_id, 'PASSWORD_CHANGED', NEW.password_updated_at, v_actor, NULL, NULL);
  END IF;

  IF TG_OP='UPDATE' AND NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    IF NEW.is_active = false THEN
      NEW.deactivated_at := COALESCE(NEW.deactivated_at, now());
      PERFORM public.log_user_event(NEW.user_id, 'DEACTIVATED', NEW.deactivated_at, v_actor, NULL, NULL);
    ELSE
      NEW.deactivated_at := NULL;
      PERFORM public.log_user_event(NEW.user_id, 'REACTIVATED', now(), v_actor, NULL, NULL);
    END IF;
  END IF;
  RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS trg_users_security_side_effects ON public.users;
CREATE TRIGGER trg_users_security_side_effects
BEFORE UPDATE OF password_hash, is_active ON public.users
FOR EACH ROW EXECUTE FUNCTION public.on_users_security_side_effects();

CREATE OR REPLACE FUNCTION public.on_users_created_event()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_actor BIGINT := NULLIF(current_setting('app.user_id', true), '')::BIGINT;
BEGIN
  PERFORM public.log_user_event(NEW.user_id, 'CREATED', COALESCE(NEW.created_at, now()), v_actor, NULL, NULL);
  RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS trg_users_created_event ON public.users;
CREATE TRIGGER trg_users_created_event
AFTER INSERT ON public.users
FOR EACH ROW EXECUTE FUNCTION public.on_users_created_event();

CREATE INDEX IF NOT EXISTS ix_users_active ON users (is_active);
CREATE INDEX IF NOT EXISTS ix_users_room   ON users (dorm_room_id);
CREATE INDEX IF NOT EXISTS ix_users_role   ON users (role_id);

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_room_person
  ON users (dorm_room_id, personal_number)
  WHERE dorm_room_id IS NOT NULL AND personal_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_users_email_verified
  ON public.users (email) WHERE email_verified_at IS NOT NULL;

CREATE OR REPLACE VIEW public.user_latest_timestamps AS
WITH last_login AS (
  SELECT user_id, max(occurred_at) AS last_login_at
  FROM public.user_events WHERE event_type='LOGIN_SUCCESS' GROUP BY user_id
),
last_pw AS (
  SELECT user_id, max(occurred_at) AS password_updated_at
  FROM public.user_events WHERE event_type='PASSWORD_CHANGED' GROUP BY user_id
),
last_verified AS (
  SELECT user_id, max(occurred_at) AS email_verified_at
  FROM public.user_events WHERE event_type='EMAIL_VERIFIED' GROUP BY user_id
),
last_deact AS (
  SELECT user_id, max(occurred_at) AS deactivated_at
  FROM public.user_events WHERE event_type='DEACTIVATED' GROUP BY user_id
)
SELECT u.user_id,
       COALESCE(ll.last_login_at, u.last_login_at)             AS last_login_at,
       COALESCE(lp.password_updated_at, u.password_updated_at) AS password_updated_at,
       COALESCE(lv.email_verified_at, u.email_verified_at)     AS email_verified_at,
       COALESCE(ld.deactivated_at, u.deactivated_at)           AS deactivated_at
FROM public.users u
LEFT JOIN last_login    ll ON ll.user_id = u.user_id
LEFT JOIN last_pw       lp ON lp.user_id = u.user_id
LEFT JOIN last_verified lv ON lv.user_id = u.user_id
LEFT JOIN last_deact    ld ON ld.user_id = u.user_id;

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id BIGINT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  role_id BIGINT NOT NULL REFERENCES public.roles(role_id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);
CREATE INDEX IF NOT EXISTS ix_user_roles_role ON public.user_roles(role_id);

INSERT INTO public.user_roles(user_id, role_id)
SELECT user_id, role_id FROM public.users WHERE role_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 세션/토큰/로그인 시도
CREATE TABLE IF NOT EXISTS auth_sessions (
  session_id bigserial PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  refresh_token_hash text NOT NULL,
  user_agent text,
  ip inet,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  CONSTRAINT ck_auth_sessions_exp CHECK (expires_at > created_at)
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_auth_sessions_user_token ON auth_sessions (user_id, refresh_token_hash);
CREATE INDEX        IF NOT EXISTS ix_auth_sessions_user ON auth_sessions (user_id);
CREATE INDEX        IF NOT EXISTS ix_auth_sessions_exp  ON auth_sessions (expires_at);
CREATE INDEX IF NOT EXISTS ix_auth_sessions_user_active
  ON public.auth_sessions (user_id) WHERE revoked_at IS NULL;

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

CREATE TABLE IF NOT EXISTS auth_login_attempts (
  attempt_id bigserial PRIMARY KEY,
  login_id public.citext NOT NULL,
  success boolean NOT NULL,
  ip inet,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_ala_login_time ON auth_login_attempts (login_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS ix_ala_success    ON auth_login_attempts (success);

CREATE OR REPLACE FUNCTION public.prune_auth_tokens(p_keep_days int DEFAULT 30)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM public.email_verification_tokens
   WHERE COALESCE(used_at, expires_at) < (now() - make_interval(days => p_keep_days));

  DELETE FROM public.password_reset_tokens
   WHERE COALESCE(used_at, expires_at) < (now() - make_interval(days => p_keep_days));
END$$;

DROP TRIGGER IF EXISTS trg_evt_mark_user_verified ON public.email_verification_tokens;
CREATE TRIGGER trg_evt_mark_user_verified
AFTER UPDATE OF used_at ON public.email_verification_tokens
FOR EACH ROW EXECUTE FUNCTION public.mark_user_verified_when_token_used();

DROP TRIGGER IF EXISTS trg_auth_login_attempts_after_ins ON public.auth_login_attempts;
CREATE TRIGGER trg_auth_login_attempts_after_ins
AFTER INSERT ON public.auth_login_attempts
FOR EACH ROW EXECUTE FUNCTION public.on_login_attempt_logged();

-- =========================================================
-- 5) 로그/이벤트 — 도메인/감사 이벤트 수집
-- =========================================================
CREATE TABLE IF NOT EXISTS domain_event (
  id               bigserial PRIMARY KEY,
  entity_type      text NOT NULL,
  entity_id        bigint NOT NULL,
  actor_user_id    bigint,
  action           text NOT NULL,
  details          jsonb,
  occurred_at      timestamptz NOT NULL DEFAULT now(),
  source           public.domain_event_source NOT NULL DEFAULT 'DOMAIN',
  request_id       text,
  idempotency_key  text
);
CREATE INDEX IF NOT EXISTS ix_domain_event_time         ON domain_event (occurred_at);
CREATE INDEX IF NOT EXISTS ix_domain_event_src          ON domain_event (source);
CREATE INDEX IF NOT EXISTS ix_domain_event_entity_time  ON domain_event (entity_type, entity_id, occurred_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS ux_domain_event_idem  ON public.domain_event (source, idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_domain_event_actor_time   ON public.domain_event (actor_user_id, occurred_at DESC);

CREATE OR REPLACE VIEW activity_logs AS
SELECT
  de.id            AS log_id,
  de.actor_user_id AS user_id,
  de.action        AS action_type,
  de.details       AS details,
  de.occurred_at   AS occurred_at
FROM domain_event de
WHERE de.source = 'ROW_AUDIT';

-- =========================================================
-- 6) 냉장고/칸/접근규칙 — 재고/접근/점검/층별장
-- =========================================================
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
CREATE INDEX IF NOT EXISTS ix_access_gist        ON compartment_access_rules USING gist (room_range);

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
  number_period   tstzrange GENERATED ALWAYS AS (tstzrange(created_at, COALESCE(removed_at, 'infinity'::timestamptz), '[)')) STORED
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_bundle_active_number
  ON item_bundles (compartment_id, item_number) WHERE status='ACTIVE';
CREATE INDEX IF NOT EXISTS ix_bundles_user         ON item_bundles (user_id);
CREATE INDEX IF NOT EXISTS ix_bundles_compartment  ON item_bundles (compartment_id);
CREATE INDEX IF NOT EXISTS ix_bundles_status       ON item_bundles (status);
CREATE INDEX IF NOT EXISTS ix_bundles_comp_status  ON item_bundles (compartment_id, status);
CREATE INDEX IF NOT EXISTS ix_bundles_user_status  ON item_bundles (user_id, status);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='no_overlap_bundle_number_per_compartment') THEN
    ALTER TABLE public.item_bundles
      ADD CONSTRAINT no_overlap_bundle_number_per_compartment
      EXCLUDE USING gist (compartment_id WITH =, item_number WITH =, number_period WITH &&);
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS sub_items (
  sub_item_id   bigserial PRIMARY KEY,
  bundle_id     bigint NOT NULL REFERENCES item_bundles(bundle_id) ON DELETE CASCADE,
  sub_item_name varchar(100),
  expiry_date   date,
  status        public.sub_item_status NOT NULL DEFAULT 'STORED',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_sub_items_bundle             ON sub_items (bundle_id);
CREATE INDEX IF NOT EXISTS ix_sub_items_status             ON sub_items (status);
CREATE INDEX IF NOT EXISTS ix_sub_items_exp_stored         ON sub_items (expiry_date) WHERE status='STORED';
CREATE INDEX IF NOT EXISTS ix_sub_items_bundle_status      ON sub_items (bundle_id, status);
CREATE INDEX IF NOT EXISTS ix_sub_items_bundle_status_exp  ON sub_items (bundle_id, status, expiry_date);

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
ALTER TABLE public.fridge_inspections
  ADD CONSTRAINT ck_inspection_times CHECK (
    (started_at   IS NULL OR scheduled_at IS NULL OR started_at   >= scheduled_at) AND
    (completed_at IS NULL OR started_at   IS NULL OR completed_at >= started_at)
  );
CREATE INDEX IF NOT EXISTS ix_fridge_inspections_initiator
  ON public.fridge_inspections (initiated_by, status, created_at DESC);

CREATE TABLE IF NOT EXISTS fridge_inspection_participants (
  inspection_id  bigint NOT NULL REFERENCES fridge_inspections(inspection_id) ON DELETE CASCADE,
  user_id        bigint NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  joined_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (inspection_id, user_id)
);
CREATE INDEX IF NOT EXISTS ix_fip_user ON public.fridge_inspection_participants (user_id);

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

-- Unique constraints per-target
CREATE UNIQUE INDEX IF NOT EXISTS ux_ir_unique_per_subitem
  ON public.inspection_results (inspection_id, sub_item_id) WHERE sub_item_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_ir_unique_per_bundle
  ON public.inspection_results (inspection_id, bundle_id) WHERE sub_item_id IS NULL AND bundle_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_ir_inspection ON public.inspection_results (inspection_id);
CREATE INDEX IF NOT EXISTS ix_ir_handled_by ON public.inspection_results (handled_by);

-- [Patch B] 제약 재정의: 익명 NO_STICKER 폐기 시 bundle_id/sub_item_id 모두 NULL 허용
ALTER TABLE public.inspection_results
  DROP CONSTRAINT IF EXISTS ck_ir_target_xor,
  ADD  CONSTRAINT ck_ir_target_xor CHECK (
    (bundle_id IS NOT NULL AND sub_item_id IS NULL) OR
    (bundle_id IS NULL AND sub_item_id IS NOT NULL) OR
    (bundle_id IS NULL AND sub_item_id IS NULL
       AND outcome='DISCARD_ANONYMOUS' AND violation_type='NO_STICKER')
  );

ALTER TABLE public.inspection_results
  ADD CONSTRAINT ck_ir_violation_when_needed CHECK (outcome = 'PASS' OR violation_type IS NOT NULL)
  -- IF NOT EXISTS 호환을 위해 존재하면 무시
  ;

-- 6-4) 층별장(층 책임자)
CREATE TABLE IF NOT EXISTS public.floor_leads (
  floor     int NOT NULL REFERENCES public.floors(floor),
  user_id   bigint NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at   timestamptz,
  floor_lead_id bigserial PRIMARY KEY,
  active_period tstzrange GENERATED ALWAYS AS (
    tstzrange(starts_at, COALESCE(ends_at, 'infinity'::timestamptz), '[)')
  ) STORED
);
CREATE INDEX IF NOT EXISTS ix_floor_leads_user         ON public.floor_leads (user_id);
CREATE INDEX IF NOT EXISTS ix_floor_leads_floor        ON public.floor_leads (floor);
CREATE INDEX IF NOT EXISTS ix_floor_leads_period_gist  ON public.floor_leads USING gist (active_period);
CREATE INDEX IF NOT EXISTS ix_floor_leads_user_active  ON public.floor_leads (user_id) WHERE ends_at IS NULL;

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

CREATE INDEX IF NOT EXISTS ix_floor_leads_active
  ON public.floor_leads (floor) WHERE ends_at IS NULL;

-- =========================================================
-- 7) 알림 — 타입/알림/보낸 기록/설정/구독
-- =========================================================
CREATE TABLE IF NOT EXISTS notification_types (
  type_code varchar(50) PRIMARY KEY,
  description varchar(255) NOT NULL,
  is_user_configurable boolean NOT NULL DEFAULT true
);

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
ALTER TABLE public.notifications
  ADD CONSTRAINT ck_notifications_read_consistency CHECK (
    (is_read = false AND read_at IS NULL) OR
    (is_read = true  AND read_at IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS ix_notifications_user_read_time        ON notifications (recipient_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_notifications_type                  ON notifications (notification_type_code);
CREATE INDEX IF NOT EXISTS ix_notifications_unread                ON notifications (recipient_id, created_at DESC) WHERE is_read=false;
CREATE INDEX IF NOT EXISTS ix_notifications_user_unread_topic     ON notifications (recipient_id, is_read, topic_key);
CREATE INDEX IF NOT EXISTS ix_notifications_user_entity_unread    ON notifications (recipient_id, is_read, related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS ix_notifications_expires_at            ON notifications (expires_at);
CREATE INDEX IF NOT EXISTS ix_notifications_payload_gin           ON notifications USING gin (payload jsonb_path_ops);
CREATE INDEX IF NOT EXISTS ix_notifications_topic_params_gin      ON notifications USING gin (topic_params jsonb_path_ops);
CREATE INDEX IF NOT EXISTS ix_notifications_content_trgm          ON notifications USING gin (content gin_trgm_ops);

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

CREATE TABLE IF NOT EXISTS user_notification_settings (
  user_id bigint NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  notification_type_code varchar(50) NOT NULL REFERENCES notification_types(type_code) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT true,
  PRIMARY KEY (user_id, notification_type_code)
);

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

-- =========================================================
-- 8) 정책화 — policy 정의 & 저장소
-- =========================================================
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

-- =========================================================
-- 9) 공통/업무 함수 — 트리거/정책/검사 로직
-- =========================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END$$;

CREATE OR REPLACE FUNCTION public.audit_row_change_to_domain_event_v2(pk_fields text[] DEFAULT ARRAY[]::text[])
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_actor BIGINT := NULLIF(current_setting('app.user_id', true), '')::BIGINT;
  v_action TEXT := 'ROW_' || TG_OP;
  v_entity_type TEXT := TG_TABLE_NAME;
  v_entity_id BIGINT := 0;
  v_pk JSONB := '{}'::jsonb;
  col TEXT; val TEXT;
  jnew JSONB := CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) ELSE NULL END;
  jold JSONB := CASE WHEN TG_OP  = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END;
  v_details JSONB;
  sensitive_keys TEXT[] := ARRAY['password_hash','refresh_token_hash','token_hash','auth','p256dh'];
BEGIN
  FOREACH col IN ARRAY pk_fields LOOP
    val := COALESCE(jnew->>col, jold->>col);
    v_pk := v_pk || jsonb_build_object(col, val);
  END LOOP;

  IF array_length(pk_fields,1) IS NOT NULL THEN
    BEGIN
      v_entity_id := NULLIF(COALESCE(jnew->>pk_fields[1], jold->>pk_fields[1], ''), '')::bigint;
    EXCEPTION WHEN others THEN
      v_entity_id := 0;
    END;
  END IF;

  IF jnew IS NOT NULL THEN
    FOREACH col IN ARRAY sensitive_keys LOOP
      jnew := jnew - col;
    END LOOP;
  END IF;
  IF jold IS NOT NULL THEN
    FOREACH col IN ARRAY sensitive_keys LOOP
      jold := jold - col;
    END LOOP;
  END IF;

  IF TG_OP = 'DELETE' THEN
    v_details := jsonb_build_object('pk', v_pk, 'old', jold);
  ELSE
    v_details := jsonb_build_object('pk', v_pk, 'old', jold, 'new', jnew);
  END IF;

  INSERT INTO domain_event(entity_type, entity_id, actor_user_id, action, details, occurred_at, source)
  VALUES (v_entity_type, v_entity_id, v_actor, v_action, v_details, now(), 'ROW_AUDIT');

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END$$;

CREATE OR REPLACE FUNCTION enforce_room_capacity_and_range()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_capacity int; v_assigned_count int;
BEGIN
  IF NEW.dorm_room_id IS NULL OR NEW.personal_number IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM 1 FROM dorm_rooms WHERE dorm_room_id = NEW.dorm_room_id FOR UPDATE;

  SELECT capacity INTO v_capacity FROM dorm_rooms WHERE dorm_room_id = NEW.dorm_room_id;
  IF v_capacity IS NULL THEN RAISE EXCEPTION 'Room(%) not found', NEW.dorm_room_id; END IF;

  IF NEW.personal_number < 1 OR NEW.personal_number > v_capacity THEN
    RAISE EXCEPTION 'personal_number(%) must be between 1 and capacity(%)', NEW.personal_number, v_capacity;
  END IF;

  SELECT count(*) INTO v_assigned_count
  FROM users
  WHERE dorm_room_id = NEW.dorm_room_id AND personal_number IS NOT NULL AND user_id <> COALESCE(NEW.user_id, -1);

  IF (v_assigned_count + 1) > v_capacity THEN
    RAISE EXCEPTION 'Room(%) capacity exceeded: %/%', NEW.dorm_room_id, v_assigned_count + 1, v_capacity;
  END IF;
  RETURN NEW;
END$$;

CREATE OR REPLACE FUNCTION validate_compartments_match_slots()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_fridge_id bigint;
  v_ref_slots int; v_frz_slots int;
  v_ref_count int; v_frz_count int;
BEGIN
  v_fridge_id := COALESCE(NEW.refrigerator_id, OLD.refrigerator_id);

  SELECT refrigerated_slots, freezer_slots INTO v_ref_slots, v_frz_slots
  FROM refrigerators WHERE refrigerator_id = v_fridge_id;

  IF v_ref_slots IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT
    COALESCE(sum(CASE WHEN type='REFRIGERATED' AND is_active THEN 1 ELSE 0 END),0),
    COALESCE(sum(CASE WHEN type='FREEZER'      AND is_active THEN 1 ELSE 0 END),0)
  INTO v_ref_count, v_frz_count
  FROM compartments WHERE refrigerator_id = v_fridge_id;

  IF v_ref_count > v_ref_slots THEN
    RAISE EXCEPTION 'Fridge %: refrigerated slots exceeded (have %, limit %)', v_fridge_id, v_ref_count, v_ref_slots;
  END IF;
  IF v_frz_count > v_frz_slots THEN
    RAISE EXCEPTION 'Fridge %: freezer slots exceeded (have %, limit %)', v_fridge_id, v_frz_count, v_frz_slots;
  END IF;

  RETURN COALESCE(NEW, OLD);
END$$;

CREATE OR REPLACE FUNCTION set_bundle_removed_ts()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'REMOVED' AND NEW.removed_at IS NULL THEN
      NEW.removed_at := now();
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.status = 'REMOVED' AND (OLD.status IS DISTINCT FROM NEW.status OR NEW.removed_at IS NULL) THEN
    NEW.removed_at := COALESCE(NEW.removed_at, now());
  ELSIF NEW.status = 'ACTIVE' THEN
    NEW.removed_at := NULL;
  END IF;
  RETURN NEW;
END$$;

CREATE OR REPLACE FUNCTION enforce_bundle_access()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_user_floor int;
  v_room_no int;
  v_fridge_floor int;
  v_allowed boolean := false;
BEGIN
  SELECT dr.floor, dr.room_number
    INTO v_user_floor, v_room_no
  FROM users u
  JOIN dorm_rooms dr ON dr.dorm_room_id = u.dorm_room_id
  WHERE u.user_id = NEW.user_id;

  IF v_room_no IS NULL THEN
    RAISE EXCEPTION 'User % has no assigned room; cannot place bundle in compartment %',
      NEW.user_id, NEW.compartment_id;
  END IF;

  SELECT r.floor INTO v_fridge_floor
  FROM compartments c
  JOIN refrigerators r ON r.refrigerator_id = c.refrigerator_id
  WHERE c.compartment_id = NEW.compartment_id;

  IF v_user_floor <> v_fridge_floor THEN
    RAISE EXCEPTION 'User floor(%) != fridge floor(%): not allowed', v_user_floor, v_fridge_floor;
  END IF;

  v_allowed := EXISTS (
    SELECT 1
    FROM compartment_access_rules r
    WHERE r.compartment_id = NEW.compartment_id
      AND v_room_no BETWEEN r.start_room_number AND r.end_room_number
  );
  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Room % is not in allowed range for compartment %', v_room_no, NEW.compartment_id;
  END IF;

  RETURN NEW;
END$$;

CREATE OR REPLACE FUNCTION public.policy_json(pkey text)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE v jsonb;
BEGIN
  SELECT policy_value INTO v FROM public.app_policies WHERE policy_key = pkey;
  IF v IS NULL THEN
    SELECT default_value INTO v FROM public.app_policy_defs WHERE policy_key = pkey;
  END IF;
  RETURN v;
END$$;

CREATE OR REPLACE FUNCTION public.policy_bool(pkey text, pdefault boolean)
RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE v jsonb; t text;
BEGIN
  v := public.policy_json(pkey);
  IF v IS NULL THEN RETURN pdefault; END IF;
  IF jsonb_typeof(v) = 'boolean' THEN
    RETURN (v::text)::boolean;
  ELSIF jsonb_typeof(v) = 'object' AND (v ? 'value') THEN
    t := v->>'value'; RETURN NULLIF(t,'')::boolean;
  END IF;
  RETURN pdefault;
END$$;

CREATE OR REPLACE FUNCTION public.policy_int(pkey text, pdefault int)
RETURNS int LANGUAGE plpgsql AS $$
DECLARE v jsonb; t text; n int;
BEGIN
  v := public.policy_json(pkey);
  IF v IS NULL THEN RETURN pdefault; END IF;
  IF jsonb_typeof(v) = 'number' THEN
    RETURN (v::text)::int;
  ELSIF jsonb_typeof(v) = 'object' AND (v ? 'value') THEN
    t := v->>'value'; n := NULLIF(t,'')::int; RETURN COALESCE(n, pdefault);
  END IF;
  RETURN pdefault;
END$$;

CREATE OR REPLACE FUNCTION public.policy_interval(pkey text, pdefault interval)
RETURNS interval LANGUAGE plpgsql AS $$
DECLARE v jsonb; t text; iv interval;
BEGIN
  v := public.policy_json(pkey);
  IF v IS NULL THEN RETURN pdefault; END IF;
  IF jsonb_typeof(v) = 'string' THEN
    t := trim(both '"' FROM v::text);
    iv := t::interval; RETURN iv;
  ELSIF jsonb_typeof(v) = 'object' AND (v ? 'value') THEN
    t := v->>'value'; RETURN t::interval;
  END IF;
  RETURN pdefault;
END$$;

CREATE OR REPLACE FUNCTION public.upsert_policy(pkey text, pvalue jsonb, pactor bigint DEFAULT NULL)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  def   public.app_policy_defs%ROWTYPE;
  vtype text; vtxt text; vint int; iv interval;
BEGIN
  SELECT * INTO def FROM public.app_policy_defs WHERE policy_key = pkey;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unknown policy_key: %', pkey; END IF;

  vtype := def.value_type::text;

  IF vtype='INT' THEN
    IF jsonb_typeof(pvalue) <> 'number' THEN RAISE EXCEPTION 'Policy % expects INT, got %', pkey, jsonb_typeof(pvalue); END IF;
    vint := (pvalue::text)::int;
    IF def.min_int IS NOT NULL AND vint < def.min_int THEN RAISE EXCEPTION 'Policy % value % < min %', pkey, vint, def.min_int; END IF;
    IF def.max_int IS NOT NULL AND vint > def.max_int THEN RAISE EXCEPTION 'Policy % value % > max %', pkey, vint, def.max_int; END IF;

  ELSIF vtype='BOOL' THEN
    IF jsonb_typeof(pvalue) <> 'boolean' THEN RAISE EXCEPTION 'Policy % expects BOOL, got %', pkey, jsonb_typeof(pvalue); END IF;

  ELSIF vtype='TEXT' THEN
    IF jsonb_typeof(pvalue) <> 'string' THEN RAISE EXCEPTION 'Policy % expects TEXT, got %', pkey, jsonb_typeof(pvalue); END IF;

  ELSIF vtype='INTERVAL' THEN
    IF jsonb_typeof(pvalue) <> 'string' THEN RAISE EXCEPTION 'Policy % expects INTERVAL as string json', pkey; END IF;
    vtxt := trim(both '"' FROM pvalue::text);
    iv := vtxt::interval;

  ELSIF vtype='JSON' THEN
    IF def.json_schema IS NOT NULL AND (def.json_schema ? 'required') THEN
      PERFORM 1 FROM jsonb_array_elements_text(def.json_schema->'required') req
       WHERE NOT (pvalue ? req);
      IF FOUND THEN RAISE EXCEPTION 'Policy % missing required keys', pkey; END IF;
    END IF;

  ELSE
    RAISE EXCEPTION 'Unsupported policy type: %', vtype;
  END IF;

  INSERT INTO public.app_policies(policy_key, policy_value, updated_at, updated_by)
  VALUES (pkey, pvalue, now(), pactor)
  ON CONFLICT (policy_key) DO UPDATE
    SET policy_value = EXCLUDED.policy_value,
        updated_at   = now(),
        updated_by   = EXCLUDED.updated_by;

  INSERT INTO public.domain_event(entity_type, entity_id, actor_user_id, action, details, occurred_at, source)
  VALUES ('app_policy', 0, pactor, 'POLICY_UPSERT', jsonb_build_object('policy_key', pkey, 'new_value', pvalue), now(), 'SYSTEM');
END$$;

CREATE OR REPLACE FUNCTION enforce_inspection_freeze_fridge()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_actor BIGINT := NULLIF(current_setting('app.user_id', true), '')::BIGINT;
  v_compartment_id bigint; v_refrigerator_id bigint; v_inspection_id bigint;
  v_freeze boolean; v_is_participant boolean;
BEGIN
  v_freeze := public.policy_bool('inspection_freeze_enabled', true);
  IF NOT v_freeze THEN RETURN COALESCE(NEW, OLD); END IF;

  IF TG_TABLE_NAME = 'item_bundles' THEN
    v_compartment_id := COALESCE(NEW.compartment_id, OLD.compartment_id);
  ELSIF TG_TABLE_NAME = 'sub_items' THEN
    SELECT b.compartment_id INTO v_compartment_id FROM public.item_bundles b
     WHERE b.bundle_id = COALESCE(NEW.bundle_id, OLD.bundle_id);
  ELSE
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT c.refrigerator_id INTO v_refrigerator_id FROM public.compartments c WHERE c.compartment_id = v_compartment_id;
  SELECT fi.inspection_id INTO v_inspection_id
    FROM public.fridge_inspections fi
   WHERE fi.refrigerator_id = v_refrigerator_id AND fi.status = 'IN_PROGRESS' LIMIT 1;

  IF v_inspection_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  v_is_participant := EXISTS (
    SELECT 1 FROM public.fridge_inspection_participants p
     WHERE p.inspection_id = v_inspection_id AND p.user_id = v_actor
  );
  IF NOT v_is_participant THEN
    RAISE EXCEPTION 'Inspection in progress: only participants may modify (fridge %, inspection %, actor %)',
      v_refrigerator_id, v_inspection_id, v_actor;
  END IF;

  RETURN COALESCE(NEW, OLD);
END$$;

CREATE OR REPLACE FUNCTION enforce_inspector_is_active_floor_lead()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_actor BIGINT := NULLIF(current_setting('app.user_id', true), '')::BIGINT;
  v_floor int; v_ok boolean;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'app.user_id is not set; call set_config(''app.user_id'', <actor_user_id>::text, true) before this operation';
  END IF;

  IF TG_OP = 'INSERT' AND NEW.initiated_by IS NULL THEN
    NEW.initiated_by := v_actor;
  END IF;

  IF (TG_OP='INSERT' AND NEW.status='IN_PROGRESS')
     OR (TG_OP='UPDATE' AND NEW.status='IN_PROGRESS' AND NEW.status IS DISTINCT FROM OLD.status)
  THEN
    SELECT r.floor INTO v_floor FROM refrigerators r WHERE r.refrigerator_id = NEW.refrigerator_id;

    v_ok := EXISTS (
      SELECT 1 FROM floor_leads fl
       WHERE fl.floor = v_floor AND fl.active_period @> now() AND fl.user_id = v_actor
    );
    IF NOT v_ok THEN
      RAISE EXCEPTION 'Only active floor leads of floor % may start inspections (actor %)', v_floor, v_actor;
    END IF;

    IF NEW.initiated_by <> v_actor THEN
      RAISE EXCEPTION 'initiated_by(%) must equal actor(%)', NEW.initiated_by, v_actor;
    END IF;

    INSERT INTO public.fridge_inspection_participants(inspection_id, user_id)
    VALUES (NEW.inspection_id, v_actor)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END$$;

CREATE OR REPLACE FUNCTION set_ir_handled_by_from_ctx()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_actor BIGINT := NULLIF(current_setting('app.user_id', true), '')::BIGINT;
BEGIN
  IF NEW.handled_by IS NULL THEN NEW.handled_by := v_actor; END IF;
  RETURN NEW;
END$$;

CREATE OR REPLACE FUNCTION apply_inspection_result_side_effects()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_bid bigint := NEW.bundle_id; v_sid bigint := NEW.sub_item_id;
BEGIN
  IF NEW.outcome IN ('DISCARD_ANONYMOUS','DISCARD_IDENTIFIED') THEN
    IF v_sid IS NOT NULL THEN
      UPDATE public.sub_items SET status='CONSUMED', updated_at=now()
       WHERE sub_item_id = v_sid AND status='STORED';
    ELSIF v_bid IS NOT NULL THEN
      UPDATE public.sub_items SET status='CONSUMED', updated_at=now()
       WHERE bundle_id = v_bid AND status='STORED';
    END IF;
  END IF;
  RETURN NEW;
END$$;

CREATE OR REPLACE FUNCTION maintain_bundle_remaining_count_delta()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'STORED' THEN
      UPDATE public.item_bundles SET remaining_count = remaining_count + 1, updated_at = now()
       WHERE bundle_id = NEW.bundle_id;
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status <> NEW.status THEN
      IF OLD.status = 'STORED' AND NEW.status <> 'STORED' THEN
        UPDATE public.item_bundles SET remaining_count = GREATEST(0, remaining_count - 1), updated_at = now()
         WHERE bundle_id = NEW.bundle_id;
      ELSIF OLD.status <> 'STORED' AND NEW.status = 'STORED' THEN
        UPDATE public.item_bundles SET remaining_count = remaining_count + 1, updated_at = now()
         WHERE bundle_id = NEW.bundle_id;
      END IF;
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status = 'STORED' THEN
      UPDATE public.item_bundles SET remaining_count = GREATEST(0, remaining_count - 1), updated_at = now()
       WHERE bundle_id = OLD.bundle_id;
    END IF;
    RETURN OLD;
  END IF;

  RETURN COALESCE(NEW, OLD);
END$$;

CREATE OR REPLACE FUNCTION public.autoset_bundle_removed_when_empty()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.remaining_count = 0 AND NEW.status <> 'REMOVED' THEN
    NEW.status := 'REMOVED';
    NEW.removed_at := COALESCE(NEW.removed_at, now());
  END IF;
  IF NEW.remaining_count > 0 AND NEW.status = 'REMOVED' THEN
    NEW.status := 'ACTIVE';
    NEW.removed_at := NULL;
  END IF;
  RETURN NEW;
END$$;

CREATE OR REPLACE FUNCTION enforce_floor_lead_quota()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_max int := public.policy_int('max_active_floor_leads_per_floor', 1);
  v_cnt int := 0;
  v_floor int := COALESCE(NEW.floor, OLD.floor);
BEGIN
  PERFORM 1 FROM public.floors WHERE floor = v_floor FOR UPDATE;

  SELECT count(*) INTO v_cnt
    FROM public.floor_leads
   WHERE floor = v_floor
     AND ends_at IS NULL
     AND (TG_OP='UPDATE' AND floor_lead_id <> NEW.floor_lead_id OR TG_OP <> 'UPDATE');

  IF (TG_OP <> 'UPDATE' OR (TG_OP='UPDATE' AND NEW.ends_at IS NULL)) THEN
    v_cnt := v_cnt + 1;
  END IF;

  IF v_cnt > v_max THEN
    RAISE EXCEPTION 'Active floor leads for floor % exceed quota (%/%). Update policy max_active_floor_leads_per_floor.',
      v_floor, v_cnt, v_max;
  END IF;

  RETURN COALESCE(NEW, OLD);
END$$;

CREATE OR REPLACE FUNCTION public.prune_notifications()
RETURNS void LANGUAGE plpgsql AS $$
DECLARE ttl_hours int := public.policy_int('notif.default_ttl_hours', 168);
BEGIN
  DELETE FROM notifications
   WHERE created_at < (now() - make_interval(hours => ttl_hours))
      OR (expires_at IS NOT NULL AND expires_at < now());
END$$;

CREATE OR REPLACE FUNCTION public.prune_domain_event(p_keep_days int DEFAULT 90)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM domain_event
   WHERE occurred_at < (now() - make_interval(days => p_keep_days));
END$$;

-- =========================================================
-- 11) 트리거 묶음
-- =========================================================
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE CONSTRAINT TRIGGER ctrg_users_capacity_check
AFTER INSERT OR UPDATE OF dorm_room_id, personal_number ON users
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION enforce_room_capacity_and_range();

CREATE CONSTRAINT TRIGGER ctrg_validate_compartments_on_refrigerators
AFTER INSERT OR UPDATE OF refrigerated_slots, freezer_slots ON refrigerators
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION validate_compartments_match_slots();

CREATE CONSTRAINT TRIGGER ctrg_validate_compartments_on_compartments
AFTER INSERT OR DELETE OR UPDATE ON compartments
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION validate_compartments_match_slots();

CREATE CONSTRAINT TRIGGER ctrg_bundles_access
AFTER INSERT OR UPDATE OF user_id, compartment_id ON item_bundles
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION enforce_bundle_access();

CREATE TRIGGER trg_bundles_inspection_freeze_iud
BEFORE INSERT OR UPDATE OR DELETE ON item_bundles
FOR EACH ROW EXECUTE FUNCTION enforce_inspection_freeze_fridge();

CREATE TRIGGER trg_sub_items_inspection_freeze_iud
BEFORE INSERT OR UPDATE OR DELETE ON sub_items
FOR EACH ROW EXECUTE FUNCTION enforce_inspection_freeze_fridge();

CREATE TRIGGER trg_bundles_removed_ts
BEFORE INSERT OR UPDATE OF status ON item_bundles
FOR EACH ROW EXECUTE FUNCTION set_bundle_removed_ts();

CREATE TRIGGER trg_bundles_updated_at
BEFORE UPDATE ON item_bundles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_sub_items_updated_at
BEFORE UPDATE ON sub_items
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_sub_items_rc_delta_insupddel
AFTER INSERT OR UPDATE OF status OR DELETE ON sub_items
FOR EACH ROW EXECUTE FUNCTION maintain_bundle_remaining_count_delta();

CREATE TRIGGER trg_bundles_autoremoved
BEFORE UPDATE OF remaining_count, status ON item_bundles
FOR EACH ROW EXECUTE FUNCTION autoset_bundle_removed_when_empty();

CREATE TRIGGER trg_fridge_inspector_is_floor_lead_ins
BEFORE INSERT ON fridge_inspections
FOR EACH ROW EXECUTE FUNCTION enforce_inspector_is_active_floor_lead();

CREATE TRIGGER trg_fridge_inspector_is_floor_lead_upd
BEFORE UPDATE OF status ON fridge_inspections
FOR EACH ROW EXECUTE FUNCTION enforce_inspector_is_active_floor_lead();

CREATE TRIGGER trg_ir_set_handled_by
BEFORE INSERT ON inspection_results
FOR EACH ROW EXECUTE FUNCTION set_ir_handled_by_from_ctx();

CREATE TRIGGER trg_ir_side_effects
AFTER INSERT ON inspection_results
FOR EACH ROW EXECUTE FUNCTION apply_inspection_result_side_effects();

CREATE TRIGGER trg_audit_users
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION public.audit_row_change_to_domain_event_v2(ARRAY['user_id']);

CREATE TRIGGER trg_audit_bundles
AFTER INSERT OR UPDATE OR DELETE ON item_bundles
FOR EACH ROW EXECUTE FUNCTION public.audit_row_change_to_domain_event_v2(ARRAY['bundle_id']);

CREATE TRIGGER trg_audit_sub_items
AFTER INSERT OR UPDATE OR DELETE ON sub_items
FOR EACH ROW EXECUTE FUNCTION public.audit_row_change_to_domain_event_v2(ARRAY['sub_item_id']);

CREATE TRIGGER trg_audit_fridge_inspections
AFTER INSERT OR UPDATE OR DELETE ON fridge_inspections
FOR EACH ROW EXECUTE FUNCTION public.audit_row_change_to_domain_event_v2(ARRAY['inspection_id']);

CREATE TRIGGER trg_audit_inspection_results
AFTER INSERT OR UPDATE OR DELETE ON inspection_results
FOR EACH ROW EXECUTE FUNCTION public.audit_row_change_to_domain_event_v2(ARRAY['inspection_result_id']);

CREATE TRIGGER trg_audit_inspection_participants
AFTER INSERT OR UPDATE OR DELETE ON fridge_inspection_participants
FOR EACH ROW EXECUTE FUNCTION public.audit_row_change_to_domain_event_v2(ARRAY['inspection_id','user_id']);

CREATE TRIGGER trg_audit_notifications
AFTER INSERT OR UPDATE OR DELETE ON notifications
FOR EACH ROW EXECUTE FUNCTION public.audit_row_change_to_domain_event_v2(ARRAY['notification_id']);

DROP TRIGGER IF EXISTS trg_floor_leads_quota_ins ON public.floor_leads;
CREATE TRIGGER trg_floor_leads_quota_ins
BEFORE INSERT ON public.floor_leads
FOR EACH ROW EXECUTE FUNCTION enforce_floor_lead_quota();

DROP TRIGGER IF EXISTS trg_floor_leads_quota_upd ON public.floor_leads;
CREATE TRIGGER trg_floor_leads_quota_upd
BEFORE UPDATE OF ends_at, floor ON public.floor_leads
FOR EACH ROW EXECUTE FUNCTION enforce_floor_lead_quota();

-- =========================================================
-- 12) 뷰
-- =========================================================
CREATE OR REPLACE VIEW effective_permissions AS
SELECT ur.user_id, rp.permission_code
FROM public.user_roles ur
JOIN public.role_permissions rp ON rp.role_id = ur.role_id
UNION
SELECT u.user_id, rp.permission_code
FROM public.users u
JOIN public.role_permissions rp ON rp.role_id = u.role_id;

CREATE OR REPLACE VIEW users_with_room_no AS
SELECT u.user_id, r.room_number, r.floor, u.personal_number,
       COALESCE(r.room_code, r.floor*100 + r.room_number) AS room_code
FROM users u
LEFT JOIN dorm_rooms r ON r.dorm_room_id = u.dorm_room_id;

CREATE OR REPLACE VIEW fridge_inspection_report AS
SELECT
  fi.inspection_id,
  fi.refrigerator_id,
  fi.status,
  fi.scheduled_at, fi.started_at, fi.completed_at, fi.note,
  count(ir.inspection_result_id) AS items_processed,
  count(*) FILTER (WHERE ir.outcome='PASS')    AS pass_count,
  count(*) FILTER (WHERE ir.outcome='WARNING') AS warning_count,
  count(*) FILTER (WHERE ir.outcome IN ('DISCARD_ANONYMOUS','DISCARD_IDENTIFIED')) AS discarded_count
FROM fridge_inspections fi
LEFT JOIN inspection_results ir ON ir.inspection_id = fi.inspection_id
GROUP BY fi.inspection_id;

-- (편의) 라벨 표준 뷰
CREATE OR REPLACE VIEW public.bundle_labels AS
SELECT b.bundle_id,
       r.floor,
       c.label AS compartment_label,
       LPAD(b.item_number::text, 3, '0') AS num3,
       (c.label || '-' || LPAD(b.item_number::text,3,'0')) AS sticker_code
FROM public.item_bundles b
JOIN public.compartments c  ON c.compartment_id = b.compartment_id
JOIN public.refrigerators r ON r.refrigerator_id = c.refrigerator_id;

-- (편의) 검사자별 요약 뷰
CREATE OR REPLACE VIEW public.inspection_result_by_inspector AS
SELECT ir.inspection_id,
       ir.handled_by,
       u.login_id,
       COUNT(*)                                           AS processed,
       COUNT(*) FILTER (WHERE outcome='PASS')             AS pass_cnt,
       COUNT(*) FILTER (WHERE outcome='WARNING')          AS warn_cnt,
       COUNT(*) FILTER (WHERE outcome IN ('DISCARD_ANONYMOUS','DISCARD_IDENTIFIED')) AS discard_cnt
FROM public.inspection_results ir
LEFT JOIN public.users u ON u.user_id = ir.handled_by
GROUP BY ir.inspection_id, ir.handled_by, u.login_id;

-- =========================================================
-- 13) 테이블 저장/청소 파라미터 & 운영 인덱스
-- =========================================================
ALTER TABLE domain_event
  SET (fillfactor=90, autovacuum_vacuum_scale_factor=0.05, autovacuum_analyze_scale_factor=0.02,
       autovacuum_vacuum_threshold=1000, autovacuum_analyze_threshold=500);

ALTER TABLE notifications
  SET (fillfactor=90, autovacuum_vacuum_scale_factor=0.05, autovacuum_analyze_scale_factor=0.02,
       autovacuum_vacuum_threshold=1000, autovacuum_analyze_threshold=500);

ALTER TABLE auth_login_attempts
  SET (fillfactor=90, autovacuum_vacuum_scale_factor=0.05, autovacuum_analyze_scale_factor=0.02,
       autovacuum_vacuum_threshold=500, autovacuum_analyze_threshold=250);

ALTER TABLE public.user_events
  SET (fillfactor=90,
       autovacuum_vacuum_scale_factor=0.05,
       autovacuum_analyze_scale_factor=0.02,
       autovacuum_vacuum_threshold=500,
       autovacuum_analyze_threshold=250);

ALTER TABLE public.item_bundles
  SET (fillfactor=90,
       autovacuum_vacuum_scale_factor=0.05,
       autovacuum_analyze_scale_factor=0.02,
       autovacuum_vacuum_threshold=500,
       autovacuum_analyze_threshold=250);

ALTER TABLE public.sub_items
  SET (fillfactor=90,
       autovacuum_vacuum_scale_factor=0.05,
       autovacuum_analyze_scale_factor=0.02,
       autovacuum_vacuum_threshold=500,
       autovacuum_analyze_threshold=250);

ALTER TABLE public.fridge_inspections
  SET (fillfactor=90,
       autovacuum_vacuum_scale_factor=0.05,
       autovacuum_analyze_scale_factor=0.02,
       autovacuum_vacuum_threshold=300,
       autovacuum_analyze_threshold=150);

-- =========================================================
-- 14) 시드 데이터 (Patch A 반영)
-- =========================================================
INSERT INTO roles(role_id, role_name, description) VALUES
  (1,'SUPER_ADMIN','최고 관리자'),
  (2,'ADMIN','일반 관리자'),
  (3,'FLOOR_LEAD','층별장'),
  (4,'USER','일반 사용자')
ON CONFLICT (role_id) DO NOTHING;

INSERT INTO notification_types(type_code, description, is_user_configurable) VALUES
  ('SYS_ANNOUNCE','시스템 공지', true),
  ('SYS_SCORE','상/벌점 부여', true),
  ('SYS_ROLE_CHANGE','역할/권한 변경', true),
  ('SYS_ADMIN_APPROVED','관리자 계정 승인', false),
  ('WASH_DONE','내 세탁/건조 완료', true),
  ('WASH_AVAILABLE','감시 중 기기 사용가능', true),
  ('WASH_WATCHED_BY_OTHERS','내 기기에 종료알림 신청 발생', true),
  ('WASH_TIME_ADJUSTED','남은시간 수정됨', true),
  ('WASH_NEXT_USER_REQUEST','다음 사용자 요청', true),
  ('WASH_STATE_FORCED','관리자에 의해 상태 변경', true),
  ('WASH_REPAIR_DONE','내 신고 기기 수리완료', true),
  ('FRIDGE_EXPIRE_SOON','유통기한 임박', true),
  ('FRIDGE_VIOLATION','검사 경고/폐기/벌점', true),
  ('FRIDGE_INSPECTION_CHANGED','정기 점검 일정 변경/취소', true),
  ('LIB_DUE_TOMORROW','반납일 D-1', true),
  ('LIB_OVERDUE','연체 발생', true),
  ('LIB_AVAILABLE','예약 도서 대출 가능', true),
  ('LIB_RESERVE_LASTDAY','예약 대출 마감일 D-0', true),
  ('LIB_RESERVE_CANCELED','예약 자동 취소', true),
  ('SR_START_SOON','시작 15분 전', true)
ON CONFLICT (type_code) DO NOTHING;

-- [Patch A] 기본값(defs)과 시드(policies)를 2로 설정
INSERT INTO public.app_policy_defs(policy_key, value_type, description, default_value,
                                   min_int, max_int, min_interval, max_interval, json_schema)
VALUES
  ('max_active_floor_leads_per_floor','INT','층별장 동시 활성 최대 인원(층별)', to_jsonb(2), 1, 5, NULL, NULL, NULL),
  ('inspection_freeze_enabled','BOOL','검사 진행 중 냉장고 쓰기 잠금 활성화', to_jsonb(true), NULL, NULL, NULL, NULL, NULL),
  ('notif.default_ttl_hours','INT','알림 기본 만료시간(시간)', to_jsonb(168), 1, 720, NULL, NULL, NULL),
  ('fridge.expiry_prealert_days','INT','유통기한 임박 알림 사전 일수', to_jsonb(1), 0, 7, NULL, NULL, NULL),
  ('wash.default_minutes','JSON','세탁/건조 기본 시간(분)',
     '{"washer":38,"dryer":50,"blanket_dryer":60}'::jsonb, NULL, NULL, NULL, NULL,
     '{"required":["washer","dryer"],"types":{"washer":"number","dryer":"number","blanket_dryer":"number"}}'::jsonb),
  ('wash.done_to_available_grace_minutes','INT','세탁 DONE→AVAILABLE 유예(분)', to_jsonb(5), 0, 30, NULL, NULL, NULL),
  ('studyroom.start_prealert_minutes','INT','스터디룸 시작 전 알림(분)', to_jsonb(15), 0, 120, NULL, NULL, NULL),
  ('library.due_prealert_days','INT','도서 반납일 사전 알림(일)', to_jsonb(1), 0, 7, NULL, NULL, NULL),
  ('notifications.auto_read_enabled','BOOL','페이지 진입 시 토픽 자동 읽음', to_jsonb(true), NULL, NULL, NULL, NULL, NULL),
  ('closure.reset_days_before_end','INT','휴관 종료 N일 전 초기화(일)', to_jsonb(3), 1, 5, NULL, NULL, NULL)
ON CONFLICT (policy_key) DO UPDATE
  SET default_value=EXCLUDED.default_value,
      value_type=EXCLUDED.value_type,
      description=EXCLUDED.description;

INSERT INTO public.app_policies(policy_key, policy_value, category, description) VALUES
  ('max_active_floor_leads_per_floor', to_jsonb(2),    'floor','층별장 동시 활성 최대 인원(층별)'), -- Patch A
  ('inspection_freeze_enabled',        to_jsonb(true), 'inspection','검사 진행 중 쓰기 잠금'),
  ('notif.default_ttl_hours',          to_jsonb(168),  'notification','알림 기본 TTL(7일)'),
  ('fridge.expiry_prealert_days',      to_jsonb(1),    'fridge','유통기한 임박 알림 D-1'),
  ('wash.default_minutes',             '{"washer":38,"dryer":50,"blanket_dryer":60}'::jsonb, 'wash','세탁/건조 기본(분)'),
  ('wash.done_to_available_grace_minutes', to_jsonb(5), 'wash','세탁 DONE→AVAILABLE 유예'),
  ('studyroom.start_prealert_minutes', to_jsonb(15),   'studyroom','스터디룸 시작 전 알림(분)'),
  ('library.due_prealert_days',        to_jsonb(1),    'library','반납일 D-1 알림'),
  ('notifications.auto_read_enabled',  to_jsonb(true), 'notification','페이지 진입 자동 읽음'),
  ('closure.reset_days_before_end',    to_jsonb(3),    'closure','휴관 종료 N일 전 초기화')
ON CONFLICT (policy_key) DO UPDATE
  SET policy_value=EXCLUDED.policy_value,
      category=EXCLUDED.category,
      description=EXCLUDED.description;

COMMIT;



```
