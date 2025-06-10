주어진 정보를 바탕으로 PWA(Progressive Web App) 웹 앱을 성공적으로 구축하는 데 필요한 데이터베이스 스키마를 설계하는 데 도움을 드릴게요. 데이터베이스 스키마는 앱의 모든 기능을 지원하고 효율적으로 데이터를 저장하고 관리할 수 있도록 구성되어야 합니다.

---

## 💡 데이터베이스 스키마 설계 개요

데이터베이스 스키마는 애플리케이션이 작동하는 데 필요한 모든 데이터의 청사진과 같아요. 마치 건물을 짓기 전에 설계도를 만드는 것과 비슷하죠. 잘 설계된 스키마는 데이터의 **정확성, 일관성, 효율성**을 보장하며, 향후 기능 확장을 용이하게 합니다.

우리가 만들 PWA 웹 앱의 다양한 기능을 지원하기 위해 다음 항목들을 고려하여 스키마를 설계할 예정입니다.

- **엔티티(Entity) 식별**: 저장해야 할 주요 정보 단위(예: 사용자, 냉장고 물품, 도서 등)를 정의합니다.
- **속성(Attribute) 정의**: 각 엔티티가 가질 상세 정보(예: 물품 이름, 유통기한, 사용자 ID 등)를 정의합니다.
- **관계(Relationship) 설정**: 엔티티들 간의 연결 방식(예: 사용자는 여러 물품을 소유할 수 있음)을 설정합니다.
- **데이터 타입 지정**: 각 속성이 어떤 종류의 데이터를 저장할지(예: 텍스트, 숫자, 날짜)를 결정합니다.
- **제약 조건 설정**: 데이터의 무결성을 보장하기 위한 규칙(예: 고유 값, 필수 값)을 정의합니다.

이러한 설계 과정을 통해 사용자, 냉장고 물품, 세탁기, 도서, 스터디룸 예약, 그리고 관리자 기능 등 모든 요청사항을 효과적으로 관리할 수 있는 견고한 데이터베이스를 구축할 수 있을 거예요.

---

## 🗺️ 제안하는 데이터베이스 스키마

다음은 각 기능별 요구사항을 바탕으로 제안하는 데이터베이스 스키마입니다. 각 테이블은 주요 엔티티를 나타내며, 컬럼(속성)들은 해당 엔티티의 데이터를 저장합니다.

#### 1. `Users` 테이블 (`personal_number` 추가)

|                       |                        |                                                       |                                                  |
| --------------------- | ---------------------- | ----------------------------------------------------- | ------------------------------------------------ |
| **컬럼명 (Column Name)** | **데이터 타입 (Data Type)** | **제약 조건 (Constraints)**                               | **설명 (Description)**                             |
| `user_id`             | UUID/INT               | PK, Not Null, Unique                                  | 사용자 고유 ID                                        |
| `room_number`         | INT                    | Not Null                                              | **호실 번호 (예: 201)**                               |
| `personal_number`     | INT                    | Not Null                                              | **개인 번호 (1, 2, 3)**                              |
| `name`                | VARCHAR(50)            | Not Null                                              | 사용자 이름                                           |
| `password`            | VARCHAR(255)           | Not Null                                              | 해싱된 비밀번호                                         |
| `email`               | VARCHAR(100)           | Unique                                                | 비밀번호 초기화용 이메일                                    |
| `role`                | ENUM                   | Not Null, Default 'user'                              | 사용자 역할 (user, floor_manager, admin, super_admin) |
| `status`              | ENUM                   | Not Null, Default 'active'                            | 계정 상태 (active, inactive)                         |
| `created_at`          | TIMESTAMP              | Default CURRENT_TIMESTAMP                             | 계정 생성 시간                                         |
| `updated_at`          | TIMESTAMP              | Default CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 마지막 업데이트 시간                                      |

- **`room_number`**: 예를 들어 '201'호와 같이 층 번호와 호실 번호를 포함합니다.
- **`personal_number`**: 같은 호실 내에서 사용자를 구분하기 위한 1, 2, 3 등의 개인 번호입니다. 이 두 컬럼을 조합하여 `room_number` + `personal_number`가 `user_id`와 함께 고유한 사용자 식별자가 될 수 있습니다.

#### 2. `Refrigerators` 테이블 (기존 유지)

|                       |                        |                            |                           |
| --------------------- | ---------------------- | -------------------------- | ------------------------- |
| **컬럼명 (Column Name)** | **데이터 타입 (Data Type)** | **제약 조건 (Constraints)**    | **설명 (Description)**      |
| `refrigerator_id`     | UUID/INT               | PK, Not Null, Unique       | 냉장고 고유 ID                 |
| `location`            | VARCHAR(100)           | Not Null                   | 냉장고 위치 (예: 2층 복도)         |
| `label`               | VARCHAR(50)            | Not Null                   | 냉장고 라벨 (예: 2층 냉장고 A)      |
| `floor_number`        | INT                    | Not Null                   | 냉장고가 위치한 층 번호 (예: 2)      |
| `status`              | ENUM                   | Not Null, Default 'active' | 냉장고 상태 (active, inactive) |

- **`floor_number`**: 냉장고가 속한 층 정보를 추가하여 관리자가 특정 층의 냉장고를 쉽게 식별할 수 있도록 합니다.

#### 3. `RefrigeratorCompartments` 테이블 (보완)

|                             |                        |                                                |                                             |
| --------------------------- | ---------------------- | ---------------------------------------------- | ------------------------------------------- |
| **컬럼명 (Column Name)**       | **데이터 타입 (Data Type)** | **제약 조건 (Constraints)**                        | **설명 (Description)**                        |
| `compartment_id`            | UUID/INT               | PK, Not Null, Unique                           | 칸 고유 ID                                     |
| `refrigerator_id`           | UUID/INT               | FK (`Refrigerators.refrigerator_id`), Not Null | 속한 냉장고 ID                                   |
| `compartment_internal_code` | VARCHAR(2)             | Not Null, Unique                               | **내부적으로 사용할 2자리 칸 코드 (예: 01, 02, ..., 26)** |
| `label_name`                | VARCHAR(20)            | Not Null, Unique                               | **운영자가 부여한 라벨명 (예: A칸, B칸)**                |
| `compartment_type`          | ENUM                   | Not Null                                       | 칸 유형 (refrigerated, frozen)                 |
| `assigned_room_number`      | VARCHAR(10)            |                                                | 할당된 호실 번호                                   |
| `floor_manager_id`          | UUID/INT               | FK (`Users.user_id`)                           | 해당 칸 관리 층별장 ID                              |

- `compartment_internal_code`: DB 내부에서 사용하는 고유한 2자리 숫자 코드로, `identifier_code`의 앞 2자리에 사용됩니다.
- `label_name`: "A칸", "B칸"처럼 운영자가 설정하고 유저에게 보이는 이름입니다. 이 컬럼에 `Unique` 제약 조건을 두어 중복을 방지하고, 수정이 가능하도록 합니다.
- **`compartment_type`**: 해당 칸이 냉장칸인지 냉동칸인지를 구분합니다.
- **`assigned_room_number`**: 이 필드를 사용하여 냉장칸의 경우 특정 호실에 할당하고, 냉동칸과 같이 층 전체가 공유하는 칸일 경우 `NULL`로 두거나 'SHARED' 같은 특정 값으로 지정하여 관리할 수 있습니다.
    - **냉장칸**: `assigned_room_number`에 '201', '202' 등 특정 호실 번호를 저장합니다.
    - **냉동칸**: `assigned_room_number`는 `NULL`로 두어 해당 층 전체에 공유되는 칸임을 나타냅니다.

### 4. `RefrigeratorItems` 테이블 (냉장고 물품 정보)

|                       |                        |                                                       |                            |
| --------------------- | ---------------------- | ----------------------------------------------------- | -------------------------- |
| **컬럼명 (Column Name)** | **데이터 타입 (Data Type)** | **제약 조건 (Constraints)**                               | **설명 (Description)**       |
| `item_id`             | UUID/INT               | PK, Not Null, Unique                                  | 물품 고유 ID                   |
| `user_id`             | UUID/INT               | FK (`Users.user_id`), Not Null                        | 물품 등록 사용자 ID               |
| `compartment_id`      | UUID/INT               | FK (`RefrigeratorCompartments.compartment_id`)        | 물품 보관 칸 ID                 |
| `item_name`           | VARCHAR(100)           | Not Null                                              | 물품 이름                      |
| `expiration_date`     | DATE                   | Not Null                                              | 유통기한                       |
| `memo`                | TEXT                   |                                                       | 물품 메모 (본인만 확인)             |
| `identifier_code`     | VARCHAR(5)             | Not Null, Unique                                      | **총 5자리 식별 코드 (예: 01001)** |
| `compartment_code`    | VARCHAR(2)             | Not Null                                              | **칸 식별 코드 (예: 01, 26)**    |
| `item_sequence_num`   | VARCHAR(3)             | Not Null                                              | **물품 순번 (예: 001, 123)**    |
| `is_group`            | BOOLEAN                | Not Null, Default FALSE                               | 묶음 물품 여부                   |
| `group_name`          | VARCHAR(100)           |                                                       | 묶음명 (묶음 물품일 경우)            |
| `group_quantity`      | INT                    |                                                       | 묶음 수량 (묶음 물품일 경우)          |
| `parent_group_id`     | UUID/INT               | FK (`RefrigeratorItems.item_id`)                      | 묶음 내 개별 물품일 경우 상위 묶음 ID    |
| `is_inspected`        | BOOLEAN                | Default FALSE                                         | 검사 대상 여부 (묶음일 경우 자동 분류)    |
| `registered_at`       | TIMESTAMP              | Default CURRENT_TIMESTAMP                             | 물품 등록 시간                   |
| `updated_at`          | TIMESTAMP              | Default CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 마지막 업데이트 시간                |
|                       |                        |                                                       |                            |

### 5. `RefrigeratorInspections` 테이블 (냉장고 검사 기록)

|   |   |   |   |
|---|---|---|---|
|**컬럼명 (Column Name)**|**데이터 타입 (Data Type)**|**제약 조건 (Constraints)**|**설명 (Description)**|
|`inspection_id`|UUID/INT|PK, Not Null, Unique|검사 기록 고유 ID|
|`floor_manager_id`|UUID/INT|FK (`Users.user_id`), Not Null|검사 수행 층별장 ID|
|`refrigerator_id`|UUID/INT|FK (`Refrigerators.refrigerator_id`), Not Null|검사 대상 냉장고 ID|
|`inspection_date`|DATE|Not Null|검사 날짜|
|`notes`|TEXT||검사 특이사항|
|`is_finalized`|BOOLEAN|Not Null, Default FALSE|최종 제출 여부 (수정 불가)|

### 6. `PenaltyRecords` 테이블 (벌점 기록)


|   |   |   |   |
|---|---|---|---|
|**컬럼명 (Column Name)**|**데이터 타입 (Data Type)**|**제약 조건 (Constraints)**|**설명 (Description)**|
|`penalty_id`|UUID/INT|PK, Not Null, Unique|벌점 기록 고유 ID|
|`user_id`|UUID/INT|FK (`Users.user_id`), Not Null|벌점 대상 사용자 ID|
|`assigned_by`|UUID/INT|FK (`Users.user_id`)|벌점 부여 관리자 ID|
|`reason`|VARCHAR(255)|Not Null|벌점 사유|
|`points`|INT|Not Null|부여된 벌점|
|`assigned_at`|TIMESTAMP|Default CURRENT_TIMESTAMP|벌점 부여 시간|
|`record_type`|ENUM|Not Null|기록 유형 (penalty, report, sanction)|

### 7. `WashingMachines` 테이블 (세탁기 정보)

|   |   |   |   |
|---|---|---|---|
|**컬럼명 (Column Name)**|**데이터 타입 (Data Type)**|**제약 조건 (Constraints)**|**설명 (Description)**|
|`machine_id`|UUID/INT|PK, Not Null, Unique|세탁기 고유 ID|
|`machine_number`|VARCHAR(20)|Not Null, Unique|세탁기 번호 (예: 1번 세탁기)|
|`machine_type`|ENUM|Not Null|기기 유형 (washer, dryer)|
|`status`|ENUM|Not Null, Default 'available'|기기 상태 (available, in_use, disabled, repairing)|
|`gender_specific`|ENUM||성별 지정 (male, female, common)|

### 8. `WashingMachineUsages` 테이블 (세탁기 사용 기록)

|   |   |   |   |
|---|---|---|---|
|**컬럼명 (Column Name)**|**데이터 타입 (Data Type)**|**제약 조건 (Constraints)**|**설명 (Description)**|
|`usage_id`|UUID/INT|PK, Not Null, Unique|사용 기록 고유 ID|
|`machine_id`|UUID/INT|FK (`WashingMachines.machine_id`), Not Null|사용된 세탁기 ID|
|`user_id`|UUID/INT|FK (`Users.user_id`)|사용 사용자 ID (등록 시)|
|`start_time`|TIMESTAMP|Not Null|사용 시작 시간|
|`end_time`|TIMESTAMP||예상 종료 시간|
|`actual_end_time`|TIMESTAMP||실제 종료 시간|
|`is_registered`|BOOLEAN|Not Null, Default TRUE|등록 사용 여부|
|`last_modified_by`|UUID/INT|FK (`Users.user_id`)|마지막 시간 수정자 ID|
|`is_notified_before_end`|BOOLEAN|Default FALSE|종료 5분 전 알림 설정 여부|

### 9. `WashingMachineNotifications` 테이블 (세탁기 알림)

|                       |                        |                                                |                                                                |
| --------------------- | ---------------------- | ---------------------------------------------- | -------------------------------------------------------------- |
| **컬럼명 (Column Name)** | **데이터 타입 (Data Type)** | **제약 조건 (Constraints)**                        | **설명 (Description)**                                           |
| `notification_id`     | UUID/INT               | PK, Not Null, Unique                           | 알림 고유 ID                                                       |
| `usage_id`            | UUID/INT               | FK (`WashingMachineUsages.usage_id`), Not Null | 관련 사용 기록 ID                                                    |
| `sender_id`           | UUID/INT               | FK (`Users.user_id`)                           | 알림 발신 사용자 ID                                                   |
| `receiver_id`         | UUID/INT               | FK (`Users.user_id`), Not Null                 | 알림 수신 사용자 ID                                                   |
| `message_type`        | ENUM                   | Not Null                                       | 메시지 유형 (finished_alert, please_remove, waiting, remove_filter) |
| `sent_at`             | TIMESTAMP              | Default CURRENT_TIMESTAMP                      | 알림 전송 시간                                                       |
| `is_read`             | BOOLEAN                | Default FALSE                                  | 읽음 여부                                                          |

### 10. `MachineMalfunctions` 테이블 (기기 고장 신고)

|   |   |   |   |
|---|---|---|---|
|**컬럼명 (Column Name)**|**데이터 타입 (Data Type)**|**제약 조건 (Constraints)**|**설명 (Description)**|
|`report_id`|UUID/INT|PK, Not Null, Unique|신고 고유 ID|
|`machine_id`|UUID/INT|FK (`WashingMachines.machine_id`), Not Null|신고 대상 기기 ID|
|`reporter_id`|UUID/INT|FK (`Users.user_id`), Not Null|신고자 ID|
|`reason`|TEXT|Not Null|고장 사유|
|`reported_at`|TIMESTAMP|Default CURRENT_TIMESTAMP|신고 시간|
|`is_resolved`|BOOLEAN|Default FALSE|해결 여부|

### 11. `Books` 테이블 (도서 정보)

|   |   |   |   |
|---|---|---|---|
|**컬럼명 (Column Name)**|**데이터 타입 (Data Type)**|**제약 조건 (Constraints)**|**설명 (Description)**|
|`book_id`|UUID/INT|PK, Not Null, Unique|도서 고유 ID|
|`title`|VARCHAR(255)|Not Null|도서 제목|
|`author`|VARCHAR(100)|Not Null|저자|
|`publication_year`|INT||출판 연도|
|`book_number`|VARCHAR(50)|Unique|도서 번호 (재고 관리용)|
|`status`|ENUM|Not Null, Default 'available'|도서 상태 (available, borrowed, reserved, lost)|
|`added_at`|TIMESTAMP|Default CURRENT_TIMESTAMP|도서 등록 시간|

### 12. `BookLoans` 테이블 (도서 대출 기록)

|   |   |   |   |
|---|---|---|---|
|**컬럼명 (Column Name)**|**데이터 타입 (Data Type)**|**제약 조건 (Constraints)**|**설명 (Description)**|
|`loan_id`|UUID/INT|PK, Not Null, Unique|대출 기록 고유 ID|
|`book_id`|UUID/INT|FK (`Books.book_id`), Not Null|대출 도서 ID|
|`user_id`|UUID/INT|FK (`Users.user_id`), Not Null|대출 사용자 ID|
|`loan_date`|DATE|Not Null|대출 날짜|
|`return_date`|DATE|Not Null|반납 예정일|
|`actual_return_date`|DATE||실제 반납일|
|`is_extended`|BOOLEAN|Default FALSE|연장 여부|
|`extended_count`|INT|Default 0|연장 횟수|

### 13. `BookReservations` 테이블 (도서 예약 기록)

|   |   |   |   |
|---|---|---|---|
|**컬럼명 (Column Name)**|**데이터 타입 (Data Type)**|**제약 조건 (Constraints)**|**설명 (Description)**|
|`reservation_id`|UUID/INT|PK, Not Null, Unique|예약 기록 고유 ID|
|`book_id`|UUID/INT|FK (`Books.book_id`), Not Null|예약 도서 ID|
|`user_id`|UUID/INT|FK (`Users.user_id`), Not Null|예약 사용자 ID|
|`reservation_date`|TIMESTAMP|Default CURRENT_TIMESTAMP|예약 날짜|
|`is_active`|BOOLEAN|Not Null, Default TRUE|예약 활성 여부|

### 14. `StudyRooms` 테이블 (스터디룸 정보)

|   |   |   |   |
|---|---|---|---|
|**컬럼명 (Column Name)**|**데이터 타입 (Data Type)**|**제약 조건 (Constraints)**|**설명 (Description)**|
|`room_id`|UUID/INT|PK, Not Null, Unique|스터디룸 고유 ID|
|`room_name`|VARCHAR(100)|Not Null, Unique|스터디룸 이름 (예: 스터디룸 1)|
|`capacity`|INT||수용 인원|
|`status`|ENUM|Not Null, Default 'available'|스터디룸 상태 (available, disabled, repairing)|

### 15. `StudyRoomReservations` 테이블 (스터디룸 예약 기록)

|   |   |   |   |
|---|---|---|---|
|**컬럼명 (Column Name)**|**데이터 타입 (Data Type)**|**제약 조건 (Constraints)**|**설명 (Description)**|
|`reservation_id`|UUID/INT|PK, Not Null, Unique|예약 기록 고유 ID|
|`room_id`|UUID/INT|FK (`StudyRooms.room_id`), Not Null|예약 스터디룸 ID|
|`user_id`|UUID/INT|FK (`Users.user_id`), Not Null|예약 사용자 ID|
|`start_time`|TIMESTAMP|Not Null|예약 시작 시간|
|`end_time`|TIMESTAMP|Not Null|예약 종료 시간|
|`purpose`|TEXT||이용 사유|
|`reserved_at`|TIMESTAMP|Default CURRENT_TIMESTAMP|예약 생성 시간|
|`is_cancelled`|BOOLEAN|Not Null, Default FALSE|취소 여부|

### 16. `UserNotifications` 테이블 (사용자 알림)

|   |   |   |   |
|---|---|---|---|
|**컬럼명 (Column Name)**|**데이터 타입 (Data Type)**|**제약 조건 (Constraints)**|**설명 (Description)**|
|`notification_id`|UUID/INT|PK, Not Null, Unique|알림 고유 ID|
|`user_id`|UUID/INT|FK (`Users.user_id`), Not Null|알림 수신 사용자 ID|
|`message`|TEXT|Not Null|알림 내용|
|`type`|ENUM|Not Null|알림 유형 (냉장고, 세탁기, 도서관, 스터디룸, 벌점 등)|
|`sent_at`|TIMESTAMP|Default CURRENT_TIMESTAMP|알림 전송 시간|
|`is_read`|BOOLEAN|Default FALSE|읽음 여부|
|`related_entity_id`|UUID/INT||관련 엔티티 ID (예: item_id, usage_id)|

### 17. `DormitoryStructures` 테이블 (기숙사 구조 관리)

|   |   |   |   |
|---|---|---|---|
|**컬럼명 (Column Name)**|**데이터 타입 (Data Type)**|**제약 조건 (Constraints)**|**설명 (Description)**|
|`structure_id`|UUID/INT|PK, Not Null, Unique|구조 고유 ID|
|`type`|ENUM|Not Null|구조 유형 (dong, floor, room)|
|`name`|VARCHAR(50)|Not Null|구조 이름 (예: A동, 1층, 101호)|
|`parent_id`|UUID/INT|FK (`DormitoryStructures.structure_id`)|상위 구조 ID|

### 18. `SystemLogs` 테이블 (시스템 로그)

|   |   |   |   |
|---|---|---|---|
|**컬럼명 (Column Name)**|**데이터 타입 (Data Type)**|**제약 조건 (Constraints)**|**설명 (Description)**|
|`log_id`|UUID/INT|PK, Not Null, Unique|로그 고유 ID|
|`user_id`|UUID/INT|FK (`Users.user_id`)|활동 사용자 ID (시스템 활동일 경우 NULL)|
|`action`|VARCHAR(255)|Not Null|수행된 활동 (예: "물품 추가", "도서 대출")|
|`details`|TEXT||활동 상세 정보|
|`logged_at`|TIMESTAMP|Default CURRENT_TIMESTAMP|로그 기록 시간|
|`log_type`|ENUM|Not Null|로그 유형 (user_activity, admin_activity, system_event)|

### 19. `DormitorySettings` 테이블 (기숙사 설정)

|   |   |   |   |
|---|---|---|---|
|**컬럼명 (Column Name)**|**데이터 타입 (Data Type)**|**제약 조건 (Constraints)**|**설명 (Description)**|
|`setting_id`|UUID/INT|PK, Not Null, Unique|설정 고유 ID|
|`setting_name`|VARCHAR(100)|Not Null, Unique|설정 이름 (예: '휴관 모드', '점검일')|
|`setting_value`|TEXT|Not Null|설정 값 (예: 'ON', '2025-07-01')|
|`data_type`|ENUM|Not Null|값의 데이터 타입 (BOOLEAN, DATE, STRING)|

### 20. `ArchivedData` 테이블 (보관된 데이터 - 휴관 시 사용)

|   |   |   |   |
|---|---|---|---|
|**컬럼명 (Column Name)**|**데이터 타입 (Data Type)**|**제약 조건 (Constraints)**|**설명 (Description)**|
|`archive_id`|UUID/INT|PK, Not Null, Unique|보관 기록 고유 ID|
|`archive_date`|DATE|Not Null|보관 날짜|
|`data_type`|VARCHAR(50)|Not Null|보관된 데이터 유형 (예: 'RefrigeratorItems', 'WashingMachineUsages')|
|`data_content`|JSON/TEXT|Not Null|보관된 실제 데이터 (JSON 형식으로 저장)|

---

## 🛠️ 스키마 구현 가이드라인

위에서 제안된 스키마는 관계형 데이터베이스(RDBMS)를 기반으로 합니다. PWA 웹 앱의 백엔드를 구축할 때 다음과 같은 점들을 고려하여 구현할 수 있습니다.

1. **데이터베이스 시스템 선택**: PostgreSQL, MySQL, SQLite(소규모 프로젝트 또는 오프라인 우선 앱에 적합) 등 다양한 관계형 데이터베이스 관리 시스템(RDBMS) 중 하나를 선택합니다. 각 시스템마다 장단점이 있으니 프로젝트의 규모와 요구사항에 맞춰 선택하세요.
2. **ORM (Object-Relational Mapping) 사용**: Django ORM (Python), Sequelize (Node.js), Hibernate (Java), Entity Framework (.NET) 등 ORM 라이브러리를 사용하면 데이터베이스 작업을 객체 지향적으로 처리할 수 있어 개발 생산성을 높이고 코드의 유지보수성을 향상시킬 수 있습니다.
3. **데이터 타입 유의**: 각 컬럼의 데이터 타입을 데이터의 성격에 맞게 정확히 지정하는 것이 중요합니다. 예를 들어, `UUID`는 전역 고유 식별자로 분산 시스템에서 유용하며, `INT`는 정수, `VARCHAR`는 가변 길이 문자열, `TEXT`는 긴 텍스트, `DATE`는 날짜, `TIMESTAMP`는 날짜와 시간을 저장하는 데 사용됩니다.
4. **제약 조건 활용**: `PRIMARY KEY (PK)`, `FOREIGN KEY (FK)`, `NOT NULL`, `UNIQUE`, `DEFAULT` 등의 제약 조건을 활용하여 데이터의 무결성을 보장하고 잘못된 데이터가 저장되는 것을 방지합니다.
5. **색인 (Index) 설정**: 검색 성능을 향상시키기 위해 자주 조회되는 컬럼(예: `user_id`, `item_name`, `book_id` 등)에 색인을 설정하는 것을 고려해야 합니다.
6. **보안**: `password` 컬럼은 반드시 **해싱**하여 저장해야 합니다 (예: bcrypt, scrypt). 절대 평문으로 저장해서는 안 됩니다.

이 스키마는 시작을 위한 좋은 기반이 될 것입니다. 개발 과정에서 추가적인 요구사항이나 개선점이 발견될 경우, 스키마를 유연하게 수정하고 확장할 수 있습니다.

혹시 특정 기능에 대한 더 자세한 코드 구현 방법이나 데이터 흐름에 대한 설명이 필요하신가요? 어떤 부분에 대해 더 깊이 알아보고 싶으신지 알려주시면 상세하게 안내해 드릴게요!

---


---


