---
type: 생각조각
status: inbox
source:
creation_date: 2025-11-25
---

---

## 📝 기말고사 대비 요약 (Chapter 9)

1. **감사(Audit):**
    
    - 명령어: `AUDIT` (설정), `NOAUDIT` (해제).
    - 뷰: **`DBA_AUDIT_TRAIL`** (로그 확인 장소, 필수 암기).
    - 옵션: `WHENEVER NOT SUCCESSFUL` (실패 시에만 기록).
        
2. **암호화(Encryption):**
    
    - 알고리즘: **AES256** (대칭키).
    - 저장 타입: **`RAW`** (암호문은 바이너리 데이터).
    - 패키지: `DBMS_CRYPTO` (암/복호화 수행).
    - 전략: `Trigger`(자동 암호화) + `View`(자동 복호화).
        

# 📚 Chapter 10. DB 보안 종합 실습 분석

이 챕터는 크게 **4가지 영역**으로 나뉩니다. 각 영역별 핵심 문제와 예상 답안(SQL)을 정리해 드립니다.

## 1. 사용자 계정 및 권한 관리 (문제 1~3)

**핵심 목표:** 사용자를 생성하고, 최소한의 권한만 부여하며, 효율적인 관리를 위해 롤(Role)을 사용하는 과정을 평가합니다.

✅ 문제 1: 사용자 계정 생성

- **요구사항:** `student01` 계정 생성, 비밀번호 `stud1234`, 접속 권한(`CONNECT`)만 부여
- **핵심 SQL:**
    
    ```SQL
    -- 1. 계정 생성
    CREATE USER student01 IDENTIFIED BY stud1234;
    -- 2. 접속 권한 부여
    GRANT CONNECT TO student01;
    ```
    

✅ 문제 2: 권한 부여 및 회수

- **요구사항:** `employees` 테이블 조회 권한 부여 후 다시 회수.
- **핵심 SQL:**

    ```SQL
    -- 권한 부여
    GRANT SELECT ON hr.employees TO student01;
    -- 권한 회수 (시험 출제 유력)
    REVOKE SELECT ON hr.employees FROM student01;
    ```
    

✅ 문제 3: ROLE 생성 및 적용

- **요구사항:** `data_user` 롤 생성 $\rightarrow$ `CREATE TABLE`, `SELECT` 권한 추가 $\rightarrow$ 롤을 `student01`에게 부여.
- **핵심 SQL:**

    ```SQL
    CREATE ROLE data_user; -- 롤 생성
    GRANT CREATE TABLE, SELECT ANY TABLE TO data_user; -- 롤에 권한 담기
    GRANT data_user TO student01; -- 롤을 사용자에게 부여
    ```
    

---

## 2. 비밀번호 및 계정 정책 관리 (문제 4~5)

**핵심 목표:** **프로파일(Profile)**을 사용하여 보안 정책(로그인 실패 제한 등)을 강제하고, 잠긴 계정을 관리자가 해제하는 능력을 평가합니다.

✅ 문제 4: 비밀번호 정책(Profile) 적용

- **요구사항:** 로그인 3회 실패 시 계정 잠금 정책이 담긴 `secure_prof` 프로파일 생성 및 적용
- **핵심 SQL:**

    ```SQL
    -- 프로파일 생성 (FAILED_LOGIN_ATTEMPTS가 핵심 키워드)
    CREATE PROFILE secure_prof LIMIT
        FAILED_LOGIN_ATTEMPTS 3;
    
    -- 사용자에게 적용
    ALTER USER student01 PROFILE secure_prof;
    ```
    

✅ 문제 5: 계정 잠금 해제 (Account Unlock)

- **요구사항:** 잠긴 계정을 관리자가 다시 풀어주는 명령어 작성
- **핵심 SQL (필수 암기):**

    ```SQL
    ALTER USER student01 ACCOUNT UNLOCK;
    ``` 

---

## 3. 객체 보안 및 데이터 마스킹 (문제 6~7)

**핵심 목표:** **뷰(View)**를 활용하여 민감한 컬럼을 숨기고, 데이터 일부를 마스킹(Masking)하여 보여주는 기술을 평가합니다.

✅ 문제 6: 특정 컬럼 제한 뷰

- **요구사항:** `ename`, `job` 컬럼만 보이는 뷰 `emp_view` 생성 및 조회 권한 부여
- **핵심 SQL:**
    ```SQL
    CREATE OR REPLACE VIEW emp_view AS
    SELECT ename, job FROM employees;
    
    GRANT SELECT ON emp_view TO student01;
    ```
    

✅ 문제 7: 데이터 마스킹 (주민번호 가리기)

- **요구사항:** 주민번호 뒷자리를 `*****`로 가린 뷰 생성
- **해결 포인트:** `SUBSTR` 함수와 연결 연산자(`||`) 사용
- **핵심 SQL:**
    ```SQL
    CREATE VIEW person_masked AS
    SELECT name, 
           SUBSTR(ssn, 1, 6) || '-*******' AS ssn_masked 
    FROM person;
    ```
    

---

## 4. 감사(Audit) 및 암호화 (문제 8~9)

**핵심 목표:** 누가 데이터를 조회했는지 기록(**Audit**)하고, 데이터를 암호화하여 저장하는 개념을 확인합니다.

✅ 문제 8: 감사(Audit) 설정

- **요구사항:** `employees` 테이블에 `SELECT`가 발생할 때마다 로그 기록
- **핵심 SQL:**

    ```SQL
    -- 감사 설정
    AUDIT SELECT ON employees BY ACCESS; 
    
    -- 로그 확인 (뷰 이름 암기)
    SELECT * FROM DBA_AUDIT_TRAIL;
    ```
    

✅ 문제 9: 데이터 암호화 (TDE/함수)

- **특이사항:** 수업 녹취록에 따르면 실습 환경(패키지 오류 등) 문제로 **"하지 마세요"** 혹은 **"개념만 알아두세요"**라고 언급된 부분입니다.
- **대비 전략:** 직접 코딩보다는 **빈칸 채우기** 대비용으로 키워드만 확인하세요.
    - **알고리즘:** `AES256`
    - **데이터 타입:** `RAW` (이진 데이터)
    - **함수:** `DBMS_CRYPTO`

---

## 📝 10챕터 시험 대비 요약

1. **계정/권한:** `CREATE USER`, `GRANT`, `REVOKE` 명령어의 정확한 순서와 문법.
2. **보안 정책:** `PROFILE` 생성과 `ACCOUNT UNLOCK` 명령어는 단답형 출제 1순위입니다.
3. **뷰(View):** 보안 목적(데이터 숨기기)을 달성하기 위해 `SELECT` 문에서 특정 컬럼을 제외하거나 함수(`SUBSTR`)를 쓰는 방법을 서술할 수 있어야 합니다.
4. **학습 팁:** 이 챕터의 문제들은 **"관리자 입장에서 보안 시스템을 구축하라"**는 시나리오 문제의 표본입니다. SQL 문장을 손으로 직접 써보며 연습하는 것이 좋습니다.

---

# 📚 Chapter 11. 데이터 모델링 (DB 설계) 심층 분석

## 1. 데이터베이스 설계 프로세스

시험에서는 이론적인 순서보다는 **실제 설계 결과물**을 도출해내는 것이 중요합니다.

- **설계 흐름:** 요구사항 분석 $\rightarrow$ (개념/논리 모델링 생략) $\rightarrow$ **물리적 모델링** $\rightarrow$ DB 구축 .
- **핵심 목표:** 현실 세계의 업무(예: 쇼핑몰 주문)를 데이터베이스의 **테이블(Table)** 구조로 변환하는 것 .
    

## 2. [핵심 실습] 쇼핑몰 DB 설계 시나리오

강의 자료에 나온 **"고객 방문 및 구매 기록"** 예제가 시험 문제의 원형이 될 가능성이 매우 높습니다. 이 흐름을 완벽히 이해해야 합니다.

### 2.1 1단계: 데이터 분리 (정규화 개념)

처음에는 모든 데이터가 엑셀 시트 하나에 섞여 있는 상태(비정규화)입니다. 이를 주제별로 나누어야 합니다 .

- **문제점:** 한 테이블에 고객 정보와 구매 정보가 섞여 있으면, 물건을 사지 않은 고객의 구매란이 `NULL`로 채워지거나, 한 사람이 여러 물건을 살 때 고객 정보가 중복 저장됩니다 .
- **해결:** **고객 테이블(`userTBL`)**과 **구매 테이블(`buyTBL`)**로 분리합니다 .
    

### 2.2 2단계: 관계 설정 (PK와 FK)

분리된 두 테이블을 연결하는 고리가 필요합니다 .

- **Primary Key (PK, 기본키):** 각 행을 식별하는 유일한 값.
    - `userTBL`의 PK: **`userID`** (이름은 중복될 수 있으므로 ID를 사용) .
- **Foreign Key (FK, 외래키):** 다른 테이블의 PK를 참조하는 값.
    - `buyTBL`의 FK: **`userID`** (누가 샀는지 알기 위해 고객 테이블의 ID를 기록) .
- **관계:** **1:N (일대다)** 관계입니다. 한 명의 고객(1)은 여러 개의 물건을 구매(N)할 수 있습니다 .
    

## 3. [시험 출제 유력] 물리적 설계 (테이블 명세서 작성)

시험 문제로 **"다음 시나리오를 보고 테이블 명세서를 작성하시오"**가 출제될 것입니다. 작성해야 할 필수 항목은 **테이블 명, 컬럼 명, 데이터 타입, 제약조건(PK/FK)**입니다 .

### ✅ 작성 예시 (쇼핑몰 시나리오)

**1) 고객 테이블 (`userTBL`)**

|**한글명**|**영문명(컬럼명)**|**데이터 타입**|**필수(NULL)**|**제약조건**|
|---|---|---|---|---|
|**아이디**|`userID`|`CHAR(8)`|NOT NULL|**PK**|
|**이름**|`userName`|`NVARCHAR2(10)`|NOT NULL||
|**출생년도**|`birthYear`|`NUMBER(4)`|NOT NULL||
|**주소**|`addr`|`NCHAR(2)`|NOT NULL||
|**연락처**|`mobile`|`CHAR(13)`|NULL||

**2) 구매 테이블 (`buyTBL`)**

|**한글명**|**영문명(컬럼명)**|**데이터 타입**|**필수(NULL)**|**제약조건**|
|---|---|---|---|---|
|**순번**|`num`|`NUMBER(8)`|NOT NULL|**PK**|
|**구매자ID**|`userID`|`CHAR(8)`|NOT NULL|**FK**|
|**상품명**|`prodName`|`NCHAR(6)`|NOT NULL||
|**단가**|`price`|`NUMBER(8)`|NOT NULL||
|**수량**|`amount`|`NUMBER(3)`|NOT NULL||

>[!tip] **💡 답안 작성 팁:**
> - **데이터 타입:** 오라클 기준 타입을 정확히 써야 합니다.
>     - 한글 저장: `NCHAR`, `NVARCHAR2` .
>     - 숫자 저장: `NUMBER`, `INTEGER` .
>     - 고정 길이 문자: `CHAR` (ID 등 길이가 일정한 경우).
> - **PK/FK 표시:** 어느 컬럼이 기본키이고, 어느 컬럼이 외래키인지 반드시 표기해야 합니다.

---

## 📝 기말고사 최종 점검 리스트

지금까지 7, 8, 9, 10, 11챕터를 모두 분석했습니다. 시험장에 들어가기 전 마지막으로 체크해야 할 **Top 5 키워드**입니다.

1. **감사(Audit):** `AUDIT SELECT ON … BY ACCESS`, 뷰 `DBA_AUDIT_TRAIL`.
2. **계정/권한:** `CREATE USER`, `GRANT`, `REVOKE`, **`ACCOUNT UNLOCK`**.
3. **트리거(Trigger):** `:OLD`, `:NEW` 변수를 활용한 **백업(로그) 데이터 저장**.
4. **뷰(View):** 보안 목적(마스킹), `WITH CHECK OPTION`.
5. **설계(Modeling):** 시나리오를 보고 **테이블 명세서(PK, FK 포함)** 그리기.
