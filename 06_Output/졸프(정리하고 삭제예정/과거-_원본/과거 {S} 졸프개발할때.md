---
type: 소스
status: inbox
topics: 
source_url: "{{SOURCE}}"
author: 
creation_date: 2025-09-01
---
# 한 줄 요약

* **지금은**: floor\_code만으로 “층 인지”를 유지하고, 권한은 **JWT 클레임**으로 처리. DB는 불변성/인덱스 최소만.
* **개발 중에는**: API·SSE에 `floor_code`를 항상 태워 **미래 호환** 고정, 페이지네이션·이벤트 버전·에러코드 규약을 박아두기.
* **나중(R8)**: floors/rooms/stays/floor\_managers를 추가하고 **백필→내부매핑교체**로 무중단 전환.

## 결론(실무 판단)

* **지금(MVP 10주)**: 권역 권한은 **DB에 넣지 말고** 앱 레이어에서 단순화해 처리.
* **DB 변경이 꼭 필요하다면 단 1개만**: `resources`에 **층 코드 컬럼** 추가(정규화 없이).
* **이후(R8)**: 정식 권역 권한(층/호실/거주/층별장) 테이블을 추가하고 백필·전환.

---

# 지금 MVP 단계에서 꼭/선택 고려할 것

## A. 스키마·제약 쪽

1. **제약/인덱스 이름 고정** (이미 잘 하셨음)

* 마이그 때 `IF NOT EXISTS` + 고정 이름(ck\_, ux\_, idx\_)은 계속 유지.
* ✅ 이미 DO 블록으로 존재검사 → 재실행 안전(Idempotent).

2. **층 인지(floor-aware) 경로 고정**

* `resources.floor_code`는 **API·SSE 페이로드에 항상 포함**(후일 `floor_id`로 이행해도 호환).
* **URL/쿼리**는 지금처럼 `?floor=3F` 유지 → R8에서 내부 매핑만 교체.

3. **부분 UNIQUE 패턴 유지**

* `item_bundles` / `item_groups`의 `UNIQUE … WHERE removed_at IS NULL` 패턴은 **Items v2 전환 시에도 핵심**.
* “활성만 유일, 제거 시 재사용 가능”은 라벨/슬롯 류 전반에 재사용 예정.

4. **권장: 만료 인덱스 1개 추가** (락 정리/스캐빈지 용)

```sql
-- 락 GC/만료 스캔 최적화 (운영태스크가 주기적으로 쓸 예정)
CREATE INDEX IF NOT EXISTS idx_resource_locks_expires
  ON resource_locks(expires_at);
```

5. **ENUM 대신 TEXT+CHECK 유지**

* 지금처럼 `TEXT + CHECK`가 마이그에 유리(상수 추가/변경 쉬움). R10쯤 ENUM로 바꿔도 OK.

6. **UUID/Bigint 일관성**

* 외부 공개 키는 지금처럼 **BIGINT ID 그대로 노출**(이미 채택). 분산 쓰기 계획 없으면 그대로 가세요.
* 분산/멀티리전 계획 생기면 그때 `ULID/UUID`로 전환해도 API는 동일 필드명 유지.

---

## B. API·SSE 설계 쪽 (미래 호환형)

1. **리소스/검사 응답·이벤트에 `floor_code` 항상 포함**

```json
{
  "resource_id": 42,
  "type": "FRIDGE_COMP",
  "floor_code": "3F",
  "label": "냉장1",
  "status": "ACTIVE"
}
```

* 클라 목록 필터·탭 분리에 필수.
* 후일 R8에서 `floor_id`를 내부로 바꿔도 응답 필드는 유지 → 무중단 전환.

2. **SSE 이벤트 스키마에 버전/ID/출처 보강(앱 레이어)**

* 필드: `event_id`(모노토닉), `v`(스키마버전), `floor_code`, `resource_id`, `session_id` 등.
* 클라는 **Last-Event-ID + event\_id 중복 억제** 로직 유지.
* (DB outbox는 R2에서 도입이므로 지금은 앱 메모리/캐시로 충분)

3. **페이지네이션 정렬 규칙 고정**

* 리스트 API는 **(created\_at, pk)** 2키 정렬 고정.
* 이후 파티셔닝/아카이빙 시에도 정렬 안정성 유지됨.

---

## C. 권한 체크(앱 레이어) 유지전략

1. **층별장 = JWT 클레임로 처리**

* `role: INSPECTOR`, `floors: ["3F"]` 같이 발급.
* 서버 미들웨어: `role === ADMIN` ∪ (`INSPECTOR` ∧ `jwt.floors includes resource.floor_code`)
* 칸 단위 예외가 생기면 **오버라이드 메모리 테이블**(환경설정)로 임시 처리 → R8에서 DB화.

2. **DB 권한/롤 운영**

* 이미 `dcs_app/dcs_read` 양호.
* **추가 권장 2줄**(보안 베이스라인 강화):

```sql
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON DATABASE dcs FROM PUBLIC;
```

---

## D. 마이그·백필 대비(Items v2, 권역 권한)

1. **Items v2 전환 경로 고정**

* 서버에 **내부 변환 레이어**만 만들면 무중단:
  * Read: v1(bundles) ←→ v2(groups/units) 맵핑.
  * Write: “섀도우-쓰기” → v1/v2 동시 기록(짧은 기간) → v1 수축.
* 이때 호환 뷰/엔드포인트를 **새로 파지 말고** 기존 계약 유지가 핵심.

2. **권역 권한(R8) 단계적 전환**

* 새 테이블: `floors, rooms, stays, floor_managers, resource_floor` 추가.
* **백필 순서**: floors → resource\_floor(resource→floor\_id) → stays → managers.
* 기존 API는 계속 `?floor=3F` 받게 두고 **서버 안에서 floor\_code→id 매핑**.

---

## E. 운영·관측·성능

1. **pg\_stat\_statements ON + 대시보드**

* 인덱스 히트/쿼리탑N 확인해서 W7\~W9에 튜닝 포인트만 추가.
* TRGM GIN은 **데이터가 커질 때만** 켜고, 지금은 보류해도 무방.

2. **락/경합 런북**

* `resource_locks` 청소 배치(만료 < now) 5\~10분 주기.
* 검사 제출 실패 케이스 정리(409/422/423)와 재시도 UX 정의.

3. **Idempotency-Key(경량)**

* 정식 스토어는 R9, 지금은 **메모리/캐시 5\~10분 보관**만으로 작성계 중복 방지.

---

## F. 지금 넣어두면 좋은 “작은” 코드/정책

### 1) 락 만료 청소용 인덱스(위 A-4)

```sql
CREATE INDEX IF NOT EXISTS idx_resource_locks_expires
  ON resource_locks(expires_at);
```

### 2) 스키마 퍼블릭 권한 최소화(위 C-2)

```sql
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON DATABASE dcs FROM PUBLIC;
```

### 3) 앱 GUC 주입 표준화(감사/리비전 일관성)

* 변경 시 항상

  ```
  SET LOCAL app.user_id = '<uid>';
  SET LOCAL app.change_reason = 'UI: fix note typo';
  ```
* 이미 트리거가 이 값을 읽어 리비전에 적재하므로 **서버 공용 미들웨어**로 표준화.

---

## G. 이후 릴리스에 대비한 “호환성 수칙”

* **필드 제거 금지**: 새 필드는 추가만, 기존 필드는 `deprecated` 라벨만 붙여 둔다.
* **이벤트 명/페이로드 버전**: `type`은 고정, `v`로 규격을 인코딩.
* **오류 카탈로그**: 409/422/423/429 **메시지 상수화**(클라 로직 의존성 줄이기).
* **트랜잭션 단위**: 라벨 교체(removed→create)는 **한 트랜잭션**으로 원자 처리.

---

## MVP에서의 권한/API/SSE 설계(미래 호환형)

### 1) 권한(앱 레이어)

* JWT 클레임 예시

  ```json
  {
    "sub": "u_123",
    "role": "INSPECTOR",
    "floors": ["3F"]   // 층별장
  }
  ```
* 미들웨어 체크

  ```ts
  // 자원 권한 체크
  const canManageResource = (jwt, resource) =>
    jwt.role === 'ADMIN' ||
    (jwt.role === 'INSPECTOR' && jwt.floors?.includes(resource.floor_code));
  ```

### 2) API(지금 형태로도 R8에 호환됨)

* `GET /resources?floor=3F` → `floor_code`로 필터
* `POST /inspections/open { resource_id }` → 오픈 전에 `resource.floor_code`와 JWT `floors` 체크
* `GET /inspections?floor=3F` → 서버에서 조인 없이 `floor_code`로 필터

> R8에서 `floor_id`로 바꿔도 **엔드포인트/쿼리 파라미터 이름은 그대로** 두고 내부에서 매핑만 바꾸면 됩니다.

### 3) SSE 이벤트 페이로드에 `floor_code` 포함

```json
{
  "type": "inspection.opened",
  "resource_id": 42,
  "floor_code": "3F",
  "session_id": 1001,
  "started_at": "2025-09-03T00:00:00Z"
}
```

* 클라이언트는 `floor_code` 기반으로 **채널/필터링**을 손쉽게 구현(후일 `floor_id`로 교체해도 필드 유지 가능).

---

## R8 전환(정식 권역 권한) 로드맵

### 1) 스키마 추가

* `floors(floor_id, floor_no, gender_policy)`
* `rooms(room_id, floor_id, room_no, capacity, is_accessible)`
* `stays(stay_id, user_id, room_id, started_at, ended_at)` ← *거주기간 최대 1년, 중도퇴사 반영*
* `floor_managers(user_id, floor_id, started_at, ended_at)` ← *층별장*
* `resource_floor(resource_id, floor_id)` ← 현재 `resources.floor_code` 대체(또는 컬럼 교체)

> **성능/운영 포인트**
>
> * 인덱스: `rooms(floor_id, room_no)`, `stays(user_id, ended_at NULL)` 부분인덱스, `floor_managers(floor_id, user_id, ended_at NULL)`
> * 제약: `stays`는 `(user_id)`에 `ended_at IS NULL` **부분 UNIQUE**(동시 거주 1건 보장)

### 2) 백필/전환

* `resources.floor_code` → `floors.floor_id`로 백필
* API는 그대로 (`?floor=3F`) 받고 내부에서 floor\_id로 변환
* JWT `floors`도 여전히 `"3F"`를 실어도 되고, 점진적으로 `floor_id` 병행 허용

### 3) 권한 결합 규칙

* **기본**: `floor_managers`로 층 권한.
* **예외(선택)**: `resource_admin_overrides`로 특정 칸 `GRANT/DENY` (희소 케이스만).

쿼리:

```sql
-- 유저 u가 자원 r을 관리할 수 있는가?
-- (층권한 ∪ GRANT) − DENY
SELECT EXISTS (
  SELECT 1
  FROM resources res
  LEFT JOIN floor_managers fm
    ON fm.floor_id = res.floor_id AND fm.user_id = :u AND fm.ended_at IS NULL
  LEFT JOIN resource_admin_overrides o_grant
    ON o_grant.user_id = :u AND o_grant.resource_id = res.resource_id
       AND o_grant.mode='GRANT' AND o_grant.ended_at IS NULL
  LEFT JOIN resource_admin_overrides o_deny
    ON o_deny.user_id = :u AND o_deny.resource_id = res.resource_id
       AND o_deny.mode='DENY' AND o_deny.ended_at IS NULL
  WHERE res.resource_id = :r
    AND (fm.user_id IS NOT NULL OR o_grant.user_id IS NOT NULL)
    AND o_deny.user_id IS NULL
);
```

---

## 성능·구현 차이(층 권한 vs 칸 권한) 재확인

* **층 권한**: 데이터량/쿼리/운영 모두 단순, 변경 규모 작음(행 1\~2개).
* **칸 권한**: 세밀하지만 DML/테스트/버그 가능성이 커짐.
* \*\*현 구조(층당 냉장 1대/칸 4개)\*\*에서는 **층 권한 우선** + 예외만 칸 오버라이드가 실전 최적.

---

## 지금 할 일(요약)

1. JWT에 `floors` 클레임으로 **층별장** 표현.
2. SSE/응답 페이로드에 `floor_code` 포함(후일 `floor_id` 전환 용이).
3. R8에서 정식 스키마/백필/저장함수로 권한체크 이관.

