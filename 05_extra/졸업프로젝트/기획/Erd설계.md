
### 1. `users` – 사용자 테이블

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,                      -- 내부 고유 ID
  room_code VARCHAR(10),                     -- 현재 방 번호
  personal_id INT CHECK (personal_id BETWEEN 1 AND 3),
  name VARCHAR(50),
  email VARCHAR(100),
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('ACTIVE', 'VACANT') DEFAULT 'VACANT'
);
```

### 2. `room_assignment_logs` – 방 이동 이력

```sql
CREATE TABLE room_assignment_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  room_code VARCHAR(10),
  personal_id INT,
  start_date DATE,
  end_date DATE
);
```

### 3. `fridge_items` – 냉장고 물품 기록

```sql
CREATE TABLE fridge_items (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100),
  expiration_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. `studyroom_usages` – 스터디룸 사용 기록

```sql
CREATE TABLE studyroom_usages (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  studyroom_id INT,
  start_time TIMESTAMP,
  end_time TIMESTAMP
);
```

### 5. `resource_usage_statistics` – 기기별 시간대 통계 (비식별)

```sql
CREATE TABLE resource_usage_statistics (
  resource_id INT,
  resource_type ENUM('WASHER', 'STUDYROOM'),
  hour_slot INT, -- 0~23
  usage_count INT,
  avg_usage_duration INTERVAL,
  last_updated TIMESTAMP
);
```

### 6. `book_statistics` – 도서 회전율 통계

```sql
CREATE TABLE book_statistics (
  book_id INT,
  total_loans INT,
  avg_loan_duration INTERVAL,
  last_updated TIMESTAMP
);
```

⸻

| 항목            | 설명                                                           |
| ------------- | ------------------------------------------------------------ |
| 사용자 식별 기준     | `user_id` (SERIAL)                                           |
| 로그인용 정보       | `room_code + personal_id`                                    |
| 방 이동 처리 방식    | `room_code`, `personal_id` 필드 갱신 + `room_assignment_logs` 기록 |
| 퇴사 처리 방식      | `users` 삭제 → 관련 기록 자동 삭제 (`ON DELETE CASCADE`)               |
| 통계 데이터 분리 보존  | `*_statistics` 테이블에 사용자 ID 없이 집계 정보만 저장                      |
| 가입년도 필드 제거 여부 | ✅ `entered_year` 완전 제거, `created_at`으로 대체 가능                 |
| 상태 필드 사용      | ✅ `'ACTIVE'`, `'VACANT'` 두 가지로 충분                            |
- `ON DELETE CASCADE`
	- 외래키(Foreign Key)로 연결된 부모 테이블의 레코드가 **삭제될 때**, 해당 레코드를 참조하고 있는 **자식 테이블의 레코드도 자동으로 삭제되는 설정**

- **“누가 이 기기를 사용했는가?”를 확인할 때는 user_id로 추적**
	CREATE TABLE washer_usages (
	  id SERIAL PRIMARY KEY,
	  user_id INT REFERENCES users(id) ON DELETE CASCADE,
	  washer_id INT,
	  start_time TIMESTAMP,
	  end_time TIMESTAMP
	);
	- → 여기서 user_id가 외래키로 연결되기 때문에, **기록마다 정확히 누구인지 추적이 가능합니다**
	- (단, 그 사용자가 퇴사하지 않고 users에 살아있는 경우)