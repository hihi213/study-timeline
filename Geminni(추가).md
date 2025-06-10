
### 1. `Users` 테이블 (사용자 정보)

|   |   |   |   |
|---|---|---|---|
|**컬럼명**|**데이터 타입**|**제약 조건**|**설명**|
|`user_id`|UUID/INT|PK, Not Null, Unique|사용자 고유 ID|
|`room_number`|VARCHAR(10)|Not Null|사용자의 호실 번호 (예: 201)|
|`personal_number`|INT|Not Null|같은 호실 내 개인 번호 (1, 2, 3)|
|`name`|VARCHAR(50)|Not Null|사용자 이름|
|`password`|VARCHAR(255)|Not Null|해싱된 비밀번호|
|`email`|VARCHAR(100)|Unique|비밀번호 초기화용 이메일|
|`role`|ENUM|Not Null, Default 'user'|사용자 역할 (user, floor_manager, admin, super_admin)|
|`status`|ENUM|Not Null, Default 'active'|계정 상태 (active, inactive)|
|`created_at`|TIMESTAMP|Default CURRENT_TIMESTAMP|계정 생성 시간|
|`updated_at`|TIMESTAMP|Default CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP|마지막 업데이트 시간|

### 2. `Refrigerators` 테이블 (냉장고 정보)

|   |   |   |   |
|---|---|---|---|
|**컬럼명**|**데이터 타입**|**제약 조건**|**설명**|
|`refrigerator_id`|UUID/INT|PK, Not Null, Unique|냉장고 고유 ID|
|`location`|VARCHAR(100)|Not Null|냉장고 설치 위치 (예: 2층 복도)|
|`label`|VARCHAR(50)|Not Null|냉장고 라벨 (예: 2층 냉장고 A)|
|`floor_number`|INT|Not Null|냉장고가 위치한 층 번호 (예: 2)|
|`status`|ENUM|Not Null, Default 'active'|냉장고 상태 (active, inactive)|

### 3. `RefrigeratorCompartments` 테이블 (냉장고 칸 정보)

|   |   |   |   |
|---|---|---|---|
|**컬럼명**|**데이터 타입**|**제약 조건**|**설명**|
|`compartment_id`|UUID/INT|PK, Not Null, Unique|칸 고유 ID|
|`refrigerator_id`|UUID/INT|FK (`Refrigerators.refrigerator_id`), Not Null|속한 냉장고 ID|
|`compartment_internal_code`|VARCHAR(2)|Not Null, Unique|DB 내부에서 사용할 2자리 칸 코드 (예: 01, 02)|
|`label_name`|VARCHAR(20)|Not Null, Unique|운영자가 부여한 칸 라벨명 (예: A칸, B칸)|
|`compartment_type`|ENUM|Not Null|칸 유형 (refrigerated: 냉장, frozen: 냉동)|
|`assigned_room_number`|VARCHAR(10)||할당된 호실 번호 (공유 칸일 경우 NULL)|
|`floor_manager_id`|UUID/INT|FK (`Users.user_id`)|해당 칸 관리 층별장 ID|

### 4. `RefrigeratorItems` 테이블 (냉장고 물품 정보)

|   |   |   |   |
|---|---|---|---|
|**컬럼명**|**데이터 타입**|**제약 조건**|**설명**|
|`item_id`|UUID/INT|PK, Not Null, Unique|물품 고유 ID|
|`user_id`|UUID/INT|FK (`Users.user_id`), Not Null|물품 등록 사용자 ID|
|`compartment_id`|UUID/INT|FK (`RefrigeratorCompartments.compartment_id`), Not Null|물품 보관 칸 ID|
|`item_name`|VARCHAR(100)|Not Null|물품 이름|
|`expiration_date`|DATE|Not Null|유통기한|
|`memo`|TEXT||물품 메모 (본인만 확인)|
|`identifier_code`|VARCHAR(5)|Not Null, Unique|**총 5자리 식별 코드 (예: 01001)**|
|`is_group`|BOOLEAN|Not Null, Default FALSE|묶음 물품 여부|
|`group_name`|VARCHAR(100)||묶음명 (묶음 물품일 경우)|
|`group_quantity`|INT||묶음 수량 (묶음 물품일 경우)|
|`parent_group_id`|UUID/INT|FK (`RefrigeratorItems.item_id`)|묶음 내 개별 물품일 경우 상위 묶음 ID|
|`is_inspected`|BOOLEAN|Default FALSE|검사 대상 여부 (묶음일 경우 자동 분류)|
|`registered_at`|TIMESTAMP|Default CURRENT_TIMESTAMP|물품 등록 시간|
|`updated_at`|TIMESTAMP|Default CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP|마지막 업데이트 시간|

### 5. `RefrigeratorInspections` 테이블 (냉장고 검사 기록)

|   |   |   |   |
|---|---|---|---|
|**컬럼명**|**데이터 타입**|**제약 조건**|**설명**|
|`inspection_id`|UUID/INT|PK, Not Null, Unique|검사 기록 고유 ID|
|`floor_manager_id`|UUID/INT|FK (`Users.user_id`), Not Null|검사 수행 층별장 ID|
|`refrigerator_id`|UUID/INT|FK (`Refrigerators.refrigerator_id`), Not Null|검사 대상 냉장고 ID|
|`inspection_date`|DATE|Not Null|검사 날짜|
|`notes`|TEXT||검사 특이사항|
|`is_finalized`|BOOLEAN|Not Null, Default FALSE|최종 제출 여부 (수정 불가)|

### 6. `PenaltyRecords` 테이블 (벌점 기록)

|   |   |   |   |
|---|---|---|---|
|**컬럼명**|**데이터 타입**|**제약 조건**|**설명**|
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
|**컬럼명**|**데이터 타입**|**제약 조건**|**설명**|
|`machine_id`|UUID/INT|PK, Not Null, Unique|세탁기 고유 ID|
|`machine_number`|VARCHAR(20)|Not Null, Unique|세탁기 번호 (예: 1번 세탁기)|
|`machine_type`|ENUM|Not Null|기기 유형 (washer: 세탁기, dryer: 건조기)|
|`status`|ENUM|Not Null, Default 'available'|기기 상태 (available, in_use, disabled, repairing)|
|`gender_specific`|ENUM||성별 지정 (male, female, common)|

### 8. `WashingMachineUsages` 테이블 (세탁기 사용 기록)

|   |   |   |   |
|---|---|---|---|
|**컬럼명**|**데이터 타입**|**제약 조건**|**설명**|
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

|   |   |   |   |
|---|---|---|---|
|**컬럼명**|**데이터 타입**|**제약 조건**|**설명**|
|`notification_id`|UUID/INT|PK, Not Null, Unique|알림 고유 ID|
|`usage_id`|UUID/INT|FK (`WashingMachineUsages.usage_id`), Not Null|관련 사용 기록 ID|
|`sender_id`|UUID/INT|FK (`Users.user_id`)|알림 발신 사용자 ID|
|`receiver_id`|UUID/INT|FK (`Users.user_id`), Not Null|알림 수신 사용자 ID|
|`message_type`|ENUM|Not Null|메시지 유형 (finished_alert, please_remove, waiting, remove_filter)|
|`sent_at`|TIMESTAMP|Default CURRENT_TIMESTAMP|알림 전송 시간|
|`is_read`|BOOLEAN|Default FALSE|읽음 여부|

### 10. `MachineMalfunctions` 테이블 (기기 고장 신고)

|   |   |   |   |
|---|---|---|---|
|**컬럼명**|**데이터 타입**|**제약 조건**|**설명**|
|`report_id`|UUID/INT|PK, Not Null, Unique|신고 고유 ID|
|`machine_id`|UUID/INT|FK (`WashingMachines.machine_id`), Not Null|신고 대상 기기 ID|
|`reporter_id`|UUID/INT|FK (`Users.user_id`), Not Null|신고자 ID|
|`reason`|TEXT|Not Null|고장 사유|
|`reported_at`|TIMESTAMP|Default CURRENT_TIMESTAMP|신고 시간|
|`is_resolved`|BOOLEAN|Default FALSE|해결 여부|

### 11. `Books` 테이블 (도서 정보)

|   |   |   |   |
|---|---|---|---|
|**컬럼명**|**데이터 타입**|**제약 조건**|**설명**|
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
|**컬럼명**|**데이터 타입**|**제약 조건**|**설명**|
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
|**컬럼명**|**데이터 타입**|**제약 조건**|**설명**|
|`reservation_id`|UUID/INT|PK, Not Null, Unique|예약 기록 고유 ID|
|`book_id`|UUID/INT|FK (`Books.book_id`), Not Null|예약 도서 ID|
|`user_id`|UUID/INT|FK (`Users.user_id`), Not Null|예약 사용자 ID|
|`reservation_date`|TIMESTAMP|Default CURRENT_TIMESTAMP|예약 날짜|
|`is_active`|BOOLEAN|Not Null, Default TRUE|예약 활성 여부|

### 14. `StudyRooms` 테이블 (스터디룸 정보)

|   |   |   |   |
|---|---|---|---|
|**컬럼명**|**데이터 타입**|**제약 조건**|**설명**|
|`room_id`|UUID/INT|PK, Not Null, Unique|스터디룸 고유 ID|
|`room_name`|VARCHAR(100)|Not Null, Unique|스터디룸 이름 (예: 스터디룸 1)|
|`capacity`|INT||수용 인원|
|`status`|ENUM|Not Null, Default 'available'|스터디룸 상태 (available, disabled, repairing)|

### 15. `StudyRoomReservations` 테이블 (스터디룸 예약 기록)

|   |   |   |   |
|---|---|---|---|
|**컬럼명**|**데이터 타입**|**제약 조건**|**설명**|
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
|**컬럼명**|**데이터 타입**|**제약 조건**|**설명**|
|`notification_id`|UUID/INT|PK, Not Null, Unique|알림 고유 ID|
|`user_id`|UUID/INT|FK (`Users.user_id`), Not Null|알림 수신 사용자 ID|
|`message`|TEXT|Not Null|알림 내용|
|`type`|ENUM|Not Null|알림 유형 (냉장고, 세탁기, 도서관, 스터디룸, 벌점 등)|
|`delivery_method`|ENUM|Not Null|알림 전달 방식 (push, popup, in_app_list)|
|`sent_at`|TIMESTAMP|Default CURRENT_TIMESTAMP|알림 전송 시간|
|`is_read`|BOOLEAN|Default FALSE|읽음 여부|
|`related_entity_id`|UUID/INT||관련 엔티티 ID (예: item_id, usage_id)|

### 17. `DormitoryStructures` 테이블 (기숙사 구조 관리)

|   |   |   |   |
|---|---|---|---|
|**컬럼명**|**데이터 타입**|**제약 조건**|**설명**|
|`structure_id`|UUID/INT|PK, Not Null, Unique|구조 고유 ID|
|`type`|ENUM|Not Null|구조 유형 (dong, floor, room)|
|`name`|VARCHAR(50)|Not Null|구조 이름 (예: A동, 1층, 101호)|
|`parent_id`|UUID/INT|FK (`DormitoryStructures.structure_id`)|상위 구조 ID|

### 18. `SystemLogs` 테이블 (시스템 로그)

|   |   |   |   |
|---|---|---|---|
|**컬럼명**|**데이터 타입**|**제약 조건**|**설명**|
|`log_id`|UUID/INT|PK, Not Null, Unique|로그 고유 ID|
|`user_id`|UUID/INT|FK (`Users.user_id`)|활동 사용자 ID (시스템 활동일 경우 NULL)|
|`action`|VARCHAR(255)|Not Null|수행된 활동 (예: "물품 추가", "도서 대출")|
|`details`|TEXT||활동 상세 정보|
|`logged_at`|TIMESTAMP|Default CURRENT_TIMESTAMP|로그 기록 시간|
|`log_type`|ENUM|Not Null|로그 유형 (user_activity, admin_activity, system_event)|

### 19. `DormitorySettings` 테이블 (기숙사 설정)

|   |   |   |   |
|---|---|---|---|
|**컬럼명**|**데이터 타입**|**제약 조건**|**설명**|
|`setting_id`|UUID/INT|PK, Not Null, Unique|설정 고유 ID|
|`setting_name`|VARCHAR(100)|Not Null, Unique|설정 이름 (예: '휴관 모드', '점검일')|
|`setting_value`|TEXT|Not Null|설정 값 (예: 'ON', '2025-07-01')|
|`data_type`|ENUM|Not Null|값의 데이터 타입 (BOOLEAN, DATE, STRING)|

### 20. `ArchivedData` 테이블 (보관된 데이터 - 휴관 시 사용)

|   |   |   |   |
|---|---|---|---|
|**컬럼명**|**데이터 타입**|**제약 조건**|**설명**|
|`archive_id`|UUID/INT|PK, Not Null, Unique|보관 기록 고유 ID|
|`archive_date`|DATE|Not Null|보관 날짜|
|`data_type`|VARCHAR(50)|Not Null|보관된 데이터 유형 (예: 'RefrigeratorItems', 'WashingMachineUsages')|
|`data_content`|JSON/TEXT|Not Null|보관된 실제 데이터 (JSON 형식으로 저장)|

### 21. `UserFeedback` 테이블 (사용자 피드백)

|   |   |   |   |
|---|---|---|---|
|**컬럼명**|**데이터 타입**|**제약 조건**|**설명**|
|`feedback_id`|UUID/INT|PK, Not Null, Unique|피드백 고유 ID|
|`user_id`|UUID/INT|FK (`Users.user_id`), Not Null|피드백 작성 사용자 ID|
|`category`|ENUM|Not Null|피드백 유형 (machine_malfunction, general_suggestion, etc.)|
|`related_entity_id`|UUID/INT||관련 엔티티 ID (예: `machine_id` for machine malfunction)|
|`subject`|VARCHAR(255)||피드백 제목|
|`content`|TEXT|Not Null|피드백 내용|
|`submitted_at`|TIMESTAMP|Default CURRENT_TIMESTAMP|제출 시간|
|`status`|ENUM|Default 'pending'|처리 상태 (pending, in_progress, resolved)|
|`resolved_by`|UUID/INT|FK (`Users.user_id`)|처리한 관리자 ID|
|`resolved_at`|TIMESTAMP||처리 완료 시간|

### 22. `UserSettings` 테이블 (사용자 설정)

|   |   |   |   |
|---|---|---|---|
|**컬럼명**|**데이터 타입**|**제약 조건**|**설명**|
|`setting_id`|UUID/INT|PK, Not Null, Unique|설정 고유 ID|
|`user_id`|UUID/INT|FK (`Users.user_id`), Not Null|설정 사용자 ID|
|`setting_key`|VARCHAR(100)|Not Null|설정 항목 (예: 'receive_overdue_loan_notifications')|
|`setting_value`|BOOLEAN|Not Null|설정 값 (TRUE/FALSE)|

---

이 스키마를 통해 여러분의 PWA 웹 앱이 강력하고 효율적인 데이터 관리 시스템을 갖추게 될 거예요. 이제 이 설계도를 가지고 실제 개발을 시작할 준비가 되셨습니다! 🚀

혹시 특정 기능의 구현 방법에 대해 더 자세한 논의가 필요하거나, 다른 궁금한 점이 있으시면 언제든지 말씀해주세요!