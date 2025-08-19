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
BEGIN;   -- 하나의 트랜잭션으로 실행하여 중간 실패 시 전체 롤백 보장

-- public 스키마가 없으면 생성하고 소유자를 DB 소유자(pg_database_owner)로 설정
	--`pg_database_owner`는 현재 데이터베이스의 소유자 계정을 의미
CREATE SCHEMA IF NOT EXISTS public AUTHORIZATION pg_database_owner; 

--데이터베이스 객체를 검색할 때 사용할 검색 경로를 public으로 설정
	-- 스키마 접두어 없이 테이블/함수 등을 바로 참조 가능하게 함
SET search_path = public;                                
```

- ### 0-2. 확장 설치 ^qwwkv7
	```sql 
	-- [기능] 확장 설치: citext/btree_gist/pg_trgm
	
	--대소문자를 구분하지 않는 텍스트 문자열 타입 citext 제공
		--로그인 ID나 이메일 주소 같은 필드에서 대소문자 구별 없이 검색 및 비교를 가능하게 함
	CREATE EXTENSION IF NOT EXISTS citext  WITH SCHEMA public; 
	
	--GiST 인덱스에 B-tree 인덱스의 기능을 추가해주는 btree-gis라는 확장을 설치합니다
	CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;
	
	--`pg_trgm` 확장을 설치합니다: 텍스트 유사도 검색 및 정규 표현식 검색을 위한 trigram 인덱스
		--기본 인덱스인 B-tree는 중간이나 끝에 포함된 단어를 찾는 데 도움안됨
	CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;   -- trigram 기반 유사 검색 가속
	```

[[00_Inbox/DB테이블의 index.md|DB테이블의 index]]

--- 

## 1) ENUM 타입 — 도메인 상태 강제
- 시스템에서 사용될 고정된 값의 집합을 정의하는 열거형(ENUM) 데이터 타입
```sql
--[냉장EMUM]
-- 냉장고 칸의 종류를 정의합니다
	-- 냉장/냉동
CREATE TYPE public.compartment_type   AS ENUM ('REFRIGERATED','FREEZER');

-- 묶음(스티커 번호 단위의 아이템 묶음)의 상태 
	--활성/제거됨
CREATE TYPE public.bundle_status      AS ENUM ('ACTIVE','REMOVED');

-- 묶음 내 개별 품목(서브 아이템)의 상태를 정의합니다. 
	--보관됨/소비됨
CREATE TYPE public.sub_item_status    AS ENUM ('STORED','CONSUMED');

-- 냉장고 검사의 진행 상태를 정의합니다.
	--예정됨/진행중/완료됨/취소됨
CREATE TYPE public.inspection_status  AS ENUM ('SCHEDULED','IN_PROGRESS','COMPLETED','CANCELED');

--검사 시 발견될 수 있는 위반 유형을 정의합니다
	--유통기한 만료/스티커 없음/포장상태 불량/정보 불일치
CREATE TYPE public.violation_type     AS ENUM ('EXPIRED','NO_STICKER','packaging_defect','INFO_MISMATCH');

--검사 결과의 종류를 정의합니다.
	-- 통과/경고/주인불명 폐기/주인확인 폐기
CREATE TYPE public.inspection_outcome AS ENUM ('PASS','WARNING','DISCARD_ANONYMOUS','DISCARD_IDENTIFIED');


--[방]
-- 방의 성별 유형을 정의합니다. 
	--남성/여성
CREATE TYPE public.room_gender_type       AS ENUM ('MALE','FEMALE');
--알림이 읽힌 방식을 정의합니다
	--수동 : 알림 목록으로 직접 이동해 상세내용확인
	--토픽자동 : 토픽단위로 읽음처리 (정책 기반 자동 읽기,세탁 알림(토픽) 전부 읽음” 버튼, 토픽이 특정 엔티티와 1:1이 아닌 FLOOR=3 전체 냉장고 경고 같은 설계) 
	--엔티티자동: 엔티티 단위 상세 페이지나 모달창을 열었을때 (도서상세팝업)
	--페이지자동: 화면에 실제로 렌더링된 범위만 읽음처리
CREATE TYPE public.notification_read_via  AS ENUM ('MANUAL','AUTO_TOPIC','AUTO_ENTITY','AUTO_PAGE');

--도메인 이벤트의 발생 출처를 정의합니다
	--도메인로직, 서비스 로직 내부에서 발생한 이벤트
	-- 행감사, DB 트리거 등 데이터베이스 레벨에서 직접 발생한 이벤트
	-- API호출, 외부 시스템과의 연동 등 API 호출을 통해 발생한 이벤트
	-- 시스템작업, 시스템이 자동으로 실행하는 작업에서 발생한 이벤트
CREATE TYPE public.domain_event_source    AS ENUM ('DOMAIN','ROW_AUDIT','API','SYSTEM');

--애플리케이션 정책 값의 데이터 타입을 정의
	--INT 정수형 정책
	--BOOL 참/거짓 정책
	--TEXT 문자열 정책
	--INTERVAL 시간 간격 정책.
	--JSON 복합 객체 정책
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

## 10) 공통/업무 함수 — 트리거/정책/검사 로직

### 10-1. 공용: updated_at 자동 갱신

```sql
-- [FUNC] set_updated_at: DML 시 updated_at을 now()로 갱신
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END$$;
```

### 10-2. 공용 감사: 행 변경을 domain_event(ROW_AUDIT)로 적재

```sql
-- [FUNC] audit_row_change_to_domain_event_v2: INSERT/UPDATE/DELETE를 감사 이벤트로 기록
--   - pk_fields: PK 컬럼명 배열(엔터티 식별/요약용)
--   - 민감키(password_hash 등)는 old/new JSON에서 제거
CREATE OR REPLACE FUNCTION public.audit_row_change_to_domain_event_v2(pk_fields text[] DEFAULT ARRAY[]::text[])
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_actor BIGINT := NULLIF(current_setting('app.user_id', true), '')::BIGINT; -- 컨텍스트의 actor
  v_action TEXT := 'ROW_' || TG_OP;                                           -- 동작명
  v_entity_type TEXT := TG_TABLE_NAME;                                        -- 테이블명
  v_entity_id BIGINT := 0;                                                    -- 1차 PK 추출 시도
  v_pk JSONB := '{}'::jsonb;                                                  -- PK 요약 JSON
  col TEXT; val TEXT;
  jnew JSONB := CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) ELSE NULL END; -- after 이미지
  jold JSONB := CASE WHEN TG_OP  = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END; -- before 이미지
  v_details JSONB;
  sensitive_keys TEXT[] := ARRAY['password_hash','refresh_token_hash','token_hash','auth','p256dh'];
BEGIN
  -- PK 요약 구성
  FOREACH col IN ARRAY pk_fields LOOP
    val := COALESCE(jnew->>col, jold->>col);
    v_pk := v_pk || jsonb_build_object(col, val);
  END LOOP;

  -- entity_id(숫자형 PK 가정) 추출 시도
  IF array_length(pk_fields,1) IS NOT NULL THEN
    BEGIN
      v_entity_id := NULLIF(COALESCE(jnew->>pk_fields[1], jold->>pk_fields[1], ''), '')::bigint;
    EXCEPTION WHEN others THEN
      v_entity_id := 0; -- 숫자 변환 실패 시 0
    END;
  END IF;

  -- 민감 키 제거
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

  -- details 구성(DELETE는 old만)
  IF TG_OP = 'DELETE' THEN
    v_details := jsonb_build_object('pk', v_pk, 'old', jold);
  ELSE
    v_details := jsonb_build_object('pk', v_pk, 'old', jold, 'new', jnew);
  END IF;

  -- domain_event 적재
  INSERT INTO domain_event(entity_type, entity_id, actor_user_id, action, details, occurred_at, source)
  VALUES (v_entity_type, v_entity_id, v_actor, v_action, v_details, now(), 'ROW_AUDIT');

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END$$;
```

### 10-3. 사용자: 호실 정원/개인번호 범위 강제

```sql
-- [FUNC] enforce_room_capacity_and_range: 개인번호 1..정원, 정원 초과 배정 금지
CREATE OR REPLACE FUNCTION enforce_room_capacity_and_range()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_capacity int; v_assigned_count int;
BEGIN
  IF NEW.dorm_room_id IS NULL OR NEW.personal_number IS NULL THEN
    RETURN NEW; -- 배정/개인번호 없으면 스킵
  END IF;

  PERFORM 1 FROM dorm_rooms WHERE dorm_room_id = NEW.dorm_room_id FOR UPDATE; -- 동시성 보호

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
```

### 10-4. 냉장고/칸: 슬롯 수와 실제 칸 정합성 검증

```sql
-- [FUNC] validate_compartments_match_slots: 활성 칸 수가 선언된 슬롯 수를 초과하지 않도록 체크
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
    RETURN COALESCE(NEW, OLD); -- 냉장고 없음(비정상 경로)이면 패스
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
```

### 10-5. 묶음: 상태 전이 시 removed_at 자동세팅

```sql
-- [FUNC] set_bundle_removed_ts: status 변경에 따라 removed_at 동기화
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
```

### 10-6. 묶음: 칸 접근 규칙 위반 차단

```sql
-- [FUNC] enforce_bundle_access: 사용자 호실이 칸 접근 범위에 속하는지 검증
CREATE OR REPLACE FUNCTION enforce_bundle_access()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_room_no int;
  v_allowed boolean := false;
BEGIN
  SELECT dr.room_number INTO v_room_no
  FROM users u LEFT JOIN dorm_rooms dr ON dr.dorm_room_id = u.dorm_room_id
  WHERE u.user_id = NEW.user_id;

  IF v_room_no IS NULL THEN
    RAISE EXCEPTION 'User % has no assigned room; cannot place bundle in compartment %', NEW.user_id, NEW.compartment_id;
  END IF;

  v_allowed := EXISTS (
    SELECT 1 FROM compartment_access_rules r
    WHERE r.compartment_id = NEW.compartment_id
      AND v_room_no BETWEEN r.start_room_number AND r.end_room_number
  );
  IF NOT v_allowed THEN
    RAISE EXCEPTION 'User % (room %) is not allowed to use compartment %', NEW.user_id, v_room_no, NEW.compartment_id;
  END IF;
  RETURN NEW;
END$$;
```

### 10-7. 정책 조회 유틸리티 (json/bool/int/interval)

```sql
-- [FUNC] policy_json: 정책 실제값→없으면 디폴트 반환
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
```

```sql
-- [FUNC] policy_bool: jsonb → boolean (object{'value':...}도 지원)
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
```

```sql
-- [FUNC] policy_int: jsonb → int (object{'value':...}도 지원)
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
```

```sql
-- [FUNC] policy_interval: jsonb/string → interval (object{'value':...}도 지원)
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
```

### 10-8. 정책 upsert + 검증(타입/범위/스키마)

```sql
-- [FUNC] upsert_policy: 정책값 검증 후 app_policies upsert + 도메인이벤트 기록
CREATE OR REPLACE FUNCTION public.upsert_policy(pkey text, pvalue jsonb, pactor bigint DEFAULT NULL)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  def   public.app_policy_defs%ROWTYPE;
  vtype text; vtxt  text; vint  int; iv interval;
BEGIN
  SELECT * INTO def FROM public.app_policy_defs WHERE policy_key = pkey;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unknown policy_key: %', pkey; END IF;

  vtype := def.value_type::text;

  IF vtype='INT' THEN
    IF jsonb_typeof(pvalue) <> 'number' THEN RAISE EXCEPTION 'Policy % expects INT, got %', pkey, jsonb_typeof(pvalue); END IF;
    vint := (pvalue::text)::int;
    IF def.min_int IS NOT NULL AND vint < def.min_int THEN RAISE EXCEPTION 'Policy % value % < min %', pkey, vint, def.min_int; END IF;
    IF def.max_int IS NOT NULL AND vint > def.max_int THEN RAISE EXCEPTION 'Policy % value % >
```
## 💭 생각의 인큐베이터 (My Thoughts & Connections) 
- 