### 0. 데이터베이스 기본 용어

자바의 객체 지향 개념과 매칭하여 이해하면 훨씬 쉽습니다.

|**DB 용어**|**개념 설명**|**Java 매칭**|
|---|---|---|
|**Table**|데이터를 저장하는 기본 단위 (행과 열의 집합)|**Class** (또는 객체 리스트)|
|**Row (Record)**|테이블의 가로줄. 하나의 실체(Entity) 데이터|**Instance (Object)**|
|**Column (Attribute)**|테이블의 세로줄. 데이터의 속성|**Field (iv)**|
|**Field (Cell)**|Row와 Column이 만나는 최소 단위의 데이터 값|**Field Value**|
|**Primary Key (PK)**|각 행을 유일하게 식별할 수 있는 핵심 키 (중복/NULL 불가)|**객체의 고유 ID / 주소값**|

> **예시 (고객 테이블):**
> - **PK:** 고객번호 (ID)  
> - **Columns:** 이름, 나이, 성별, 주소, 전화번호

---

### 1. 테이블 명명 규칙 (Naming Rules)

협업과 유지보수를 위해 관습적으로 지키는 규칙입니다.

- **Snake Case 사용:** Java와 달리 DB는 대소문자를 구분하지 않는 경우가 많아 `user_name` 처럼 언더바(`_`)를 주로 사용합니다.
- **의미 있는 단수/복수형 통일:** `user` 또는 `users` 중 하나로 통일합니다.
- **예약어 피하기:** `SELECT`, `TABLE` 같은 SQL 키워드는 이름으로 쓰지 않습니다.
    

### 2. 주요 데이터 타입

자바의 자료형과 비교하여 기억하세요.

- **숫자:** `INT` (Integer), `DECIMAL` (실수)
- **문자:** `VARCHAR(n)` (가변 길이 문자열 - 자바의 `String`), `CHAR(n)` (고정 길이)
- **날짜:** `DATETIME`, `TIMESTAMP` (등록/수정 시간)
    

### 3. 테이블 생성 (DDL)

```sql
CREATE TABLE member (
    id INT PRIMARY KEY,           -- PK 설정
    name VARCHAR(50) NOT NULL,    -- 필수 입력
    age INT,
    reg_date DATETIME DEFAULT NOW() -- 기본값 설정
);
```

---

### 4. SQL 명령어의 기본 부류

SQL은 목적에 따라 크게 4가지로 나뉩니다.

1. **DML (Data Manipulation Language - 데이터 조작어):** 데이터를 실질적으로 관리합니다.
    
    - `SELECT`: 조회
    - `INSERT`: 삽입
    - `UPDATE`: 수정
    - `DELETE`: 삭제
        
2. **DDL (Data Definition Language - 데이터 정의어):** 테이블의 구조 자체를 생성/변경합니다. (`CREATE`, `ALTER`, `DROP`)
3. **DCL (Data Control Language - 데이터 제어어):** 권한을 관리합니다. (`GRANT`, `REVOKE`)
4. **TCL (Transaction Control Language - 트랜잭션 제어어):** 작업의 단위를 확정하거나 취소합니다. (`COMMIT`, `ROLLBACK`)
    

> **WHERE 절:** 검색된 레코드 중 특정 조건에 맞는 데이터만 필터링하는 '여과기' 역할을 합니다.

---

### 5. 인덱스(Index)를 만드는 이유

인덱스는 책의 **'찾아보기(색인)'**와 같습니다.

- **조회 속도 향상:** 전체 데이터를 하나하나 뒤지는 대신, 정렬된 인덱스를 참조하여 원하는 데이터의 위치를 빠르게 찾습니다. (B-Tree 구조 활용)
- **NULL 값 처리의 효율성:** 인덱스는 null을 저장할수없어, 값이있는 데이터 위주로 관리되므로 특정 컬럼에 데이터가 있거나 없는 경우를 필터링할 때 성능을 비약적으로 높여줍니다.
