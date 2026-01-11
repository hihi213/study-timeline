---
type: 생각조각
status: inbox
source:
creation_date: 2026-01-11
---
# 🏛️ DB Design Thinking Template

> Target API: (예: /fridge/bundles 관련 9개 API)
>
> Goal: API 스펙을 분석하여 **3NF(제3정규화)**가 적용된 테이블 스키마를 도출한다.

## Step 1. 🕵️ 명사 추출 (Entities)

> Q. URL의 맨 뒤에 오는 복수형 명사(Resource)는 무엇인가?
> 이것들이 테이블 후보가 됩니다.

- **Candidate 1:** (예: `bundles` -> `FridgeBundle`)
- **Candidate 2:**
- **Candidate 3:**
    

## Step 2. 🔗 관계 설정 (Relationships)

> Q. URL 경로(Path)나 생성 로직에서 "누가 누구에게 소속"되는가?
>
> *부모가 자식을 가리키는 것이 아니라, **자식이 부모의 ID(FK)*를 가져야 합니다.

- **Path 분석:** `/parent/{parentId}/children`
    - ➡️ **자식(`Children`)** 테이블이 `parent_id` (FK)를 가짐.
- **Logic 분석:** "생성 시 `slotId`가 필요함"
    - ➡️ **`Bundle`** 테이블이 `slot_id` (FK)를 가짐.
        

## Step 3. 🧱 컬럼 상세화 (Attributes)

> **Q. 필터(Query Param), 바디(Body), 에러 조건(Error)을 볼 때 필요한 저장 데이터는?**

|**구분**|**API 단서 (Hint)**|**도출된 컬럼 (Column)**|**비고 (Type/Constraint)**|
|---|---|---|---|
|**필터**|`?floor=1`|`floor`|`Integer`, `NOT NULL`|
|**필터**|`?owner=uuid`|`owner_id`|`UUID`, Index 필요|
|**바디**|`"memo": "…"`|`memo`|`String(500)`|
|**에러**|`CAPACITY_EXCEEDED`|`capacity`|`Integer` (Slot 테이블에)|
|**상태**|`DELETE …`|`removed_at`|`LocalDateTime` (Soft Delete)|

## Step 4. 🧪 정규화 & 검증 (Refinement)

> **Q. DB에 저장하면 안 되는 것(가짜 데이터)을 걸러내자.**

- [ ] **Calculated Field:** `dDay`, `isNew`, `count` 등 계산 가능한 값인가? ➡️ **삭제 (DB 저장 X)**
- [ ] **List Data:** 한 칸에 콤마(`,`)로 데이터를 욱여넣으려 했는가? ➡️ **별도 테이블로 분리 (1:N)**
- [ ] **Dependency:** `Slot`이 삭제되면 `Bundle`도 삭제되어야 하는가? (Cascade 정책 고민)
    

---

## 5. 🗺️ Final Schema (Result)

> **최종적으로 결정된 테이블 명세**

### Table: `(테이블명 1)`

|**Column**|**Type**|**Key**|**Nullable**|**Note**|
|---|---|---|---|---|
|`id`|UUID|PK|NO||
|`…`|||||

### Table: `(테이블명 2)`

|**Column**|**Type**|**Key**|**Nullable**|**Note**|
|---|---|---|---|---|
|`id`|UUID|PK|NO||
|`parent_id`|UUID|FK|NO||

---

### 📝 예시: 방금 분석한 내용을 채운다면?

사용자님이 헷갈려 하셨던 `Bundle` 관련 API를 이 템플릿에 넣으면 이렇게 됩니다.

#### Step 1. 명사 추출

- `slots` -> `FridgeSlot`
- `bundles` -> `FridgeBundle`
- `items` -> `FridgeItem`
    

#### Step 2. 관계 설정

- `/bundles/{id}/items` -> `FridgeItem`이 `bundle_id`를 가짐.
- `POST /bundles` (슬롯 배정) -> `FridgeBundle`이 `slot_id`를 가짐.
    

#### Step 3. 컬럼 상세화 (숨은 컬럼 찾기)

- `GET /slots?floor=…` -> **`FridgeSlot.floor`**
- `POST /bundles (Capacity Error)` -> **`FridgeSlot.capacity`** (기준값)
- `GET /bundles?search=…` -> **`FridgeBundle.name`**
- `DELETE /items` -> **`FridgeItem.removed_at`** (이력 관리용)
    

#### Step 4. 정규화

- API Response의 `dDay`? -> **삭제.** `expiry_date`만 저장.
- API Response의 `freshness` (신선/위험)? -> **삭제.** 로직에서 판단.
    

---

### 🚀 다음 단계

이 템플릿을 복사해서 옵시디언에 저장해두고, 지금 바로 빈 종이나 메모장에 이 양식대로 냉장고 API를 다시 한번 정리해 보세요.

"내가 짠 설계"라는 확신이 들 겁니다.
