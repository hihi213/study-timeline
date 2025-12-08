---
type: 생각조각
status: inbox
source:
creation_date: 2025-12-08
---
# 📘 Chapter 7: 고급 DB 오브젝트 심층 탐구 — 실습 모음

## 7-1) 트리거(Trigger) 실습: UPDATE/DELETE 로그 기록(백업 테이블)
[시나리오]
- userTBL에서 UPDATE 또는 DELETE가 발생하면
- backup_userTBL에 변경 전(:OLD) 데이터 + 작업자(USER) + 작업유형(수정/삭제) + 시각(SYSDATE)을 기록

[핵심 포인트]
- **이벤트:** `INSERT`, `UPDATE`, `DELETE`
- **동작 시점:** DML를 지시할때 `BEFORE`(실행전) `AFTER`(실행후)`INSTEAD OF`(뷰)
```SQL
CREATE OR REPLACE TRIGGER 트리거명
    [동작시점] [이벤트] ON 테이블명 
    FOR EACH ROW  -- 필수: 이 옵션이 있어야 :OLD, :NEW 사용 가능
BEGIN
    -- [자동으로 실행될 로직]
    -- :OLD.컬럼명 (변경 전 값)
    -- :NEW.컬럼명 (변경 후 값)
END;
/
```

[실습 SQL]
- 동작 구분: UPDATING / DELETING 시스템 변수
- 작업자 기록: USER 함수
```sql
-- 1) 트리거 생성 (로그 기록 트리거)
CREATE OR REPLACE TRIGGER 트리거명
    AFTER UPDATE OR DELETE ON 테이블명      -- (예: userTBL)
    FOR EACH ROW -- 필수 (:OLD/:NEW 사용위해선)
DECLARE -- BEGIN에서 사용할 변수등을 선언하는 공간
    v_modeType VARCHAR2(10);
BEGIN
    IF UPDATING THEN
        v_modeType := '수정';
    ELSIF DELETING THEN
        v_modeType := '삭제';
    END IF;

    INSERT INTO backup_userTBL (userID, userName, modType, modDate, modUser)
    VALUES (:OLD.userID, :OLD.userName, v_modeType, SYSDATE, USER);
END;
/
-- 2) 동작 확인 준비
SET SERVEROUTPUT ON;

-- 3) UPDATE 실행 (예시)
UPDATE testTBL SET text = 'IVE' WHERE id = 1;

-- 4) 백업 테이블 확인
SELECT * FROM backup_userTBL;
```
[기대 결과]
- UPDATE/DELETE 수행 시 backup_userTBL에 ‘변경 전 데이터(:OLD)’가 남아야 함
- modType은 '수정' 또는 '삭제'로 기록되어야 함

## 7-2) 뷰(View) + 트리거(Trigger) 조합으로 “행 수준 조회/수정 제한” 구현 (VPD 대체 실습)
### 뷰
```SQL
CREATE OR REPLACE [FORCE] VIEW 뷰이름 AS
SELECT 쿼리문…
[WITH READ ONLY]        -- DML(수정/삭제) 불가 설정
[WITH CHECK OPTION];    -- 뷰의 WHERE 조건에 위배되는 데이터 입력/변경 차단 
```

### 예시 [시나리오]
- employee2 테이블을 기준으로
  (1) 일반 직원: 자기 행만 조회 가능
  (2) 인사팀: 모든 직원 조회 가능 + 주민번호 제외
  (3) 관리자: 모든 정보 조회 가능
- 그리고 “수정/삭제는 본인만 가능”하도록 트리거로 차단
### (0) 사전 작업(계정/권한 기본 세팅)
```sql
-- 1) 기존 계정 삭제(초기화)
DROP USER 유저이름 CASCADE;

-- 2) 계정 생성
CREATE USER 유저이름 IDENTIFIED BY 비밀번호 ACCOUNT UNLOCK;

-- 3) 기본 접속 권한 부여
GRANT CONNECT TO 유저이름;

-- 4) 테이블 생성 + 샘플 데이터 삽입
-- (실습 환경마다 제공/사전 생성. 여기서는 “employee2 존재” 전제)
```

### (1) 조회 제한: 권한별 VIEW 생성
[시험 포인트]
- “본인 조회” 조건에 `USER` 함수사용
- “인사팀 뷰”는 SSN 컬럼을 SELECT에서 제외
```sql
-- 1) 일반 직원용 뷰: 자기 정보만 조회
CREATE OR REPLACE VIEW vw_my_profile AS
SELECT * FROM employee2
WHERE login_id = USER;                 -- ★ 시험 포인트

-- 2) 인사팀용 뷰: 모든 직원 조회 가능(주민번호 제외)
CREATE OR REPLACE VIEW vw_hr_view AS
SELECT emp_id, name, department, salary -- ★ 시험 포인트(SSN 제외)
FROM employee2;

-- 3) 관리자용 뷰: 전체 조회
CREATE OR REPLACE VIEW vw_admin_view AS
SELECT * FROM employee2;
```

### (2) 수정 제한: “본인만 UPDATE/DELETE” 트리거
[원리]
- 트리거에서 USER(접속자) 와 :OLD.login_id(데이터 주인) 비교
- 다르면 RAISE_APPLICATION_ERROR로 차단
```sql
CREATE OR REPLACE TRIGGER trg_emp_self_update
    BEFORE UPDATE OR DELETE ON employee2
    FOR EACH ROW
BEGIN
    IF USER <> :OLD.login_id THEN
        RAISE_APPLICATION_ERROR(-20001, '자신의 정보만 수정할 수 있습니다.');
    END IF;
END;
/
```

### (3) 검증 작업(계정별 로그인 → 뷰 조회 확인)
```sql
-- 계정별 로그인
CONNECT 유저이름/유저비번;

-- 계정별 조회 (뷰는 원본 소유자 스키마를 붙여 호출)
SELECT * FROM 원본테이블소유한유저이름.뷰이름;

[예시: 일반 직원(EMP_1001)]
CONNECT EMP_1001/1234;
SELECT * FROM TEST.vw_my_profile;
-- 기대: EMP_1001 행 1건만 조회

[추가 검증 아이디어(선택)]
- 다른 직원 행을 UPDATE/DELETE 시도 → -20001 에러 발생해야 정상
```


## 7-3) 인덱스(Index) — “보안 고려 인덱스” 실습(함수 기반 / 부분 / 리버스 키)
[공통 기본 문법]
```sql
CREATE [UNIQUE] INDEX 인덱스명 
ON 테이블명(컬럼명);
```
- `UNIQUE`: 중복값 저장을 막음 생략시 허용
### (1) 함수 기반 인덱스(Function-based Index): SSN 일부만 인덱싱
[목표]
- 주민번호 전체 노출 대신, 앞 6자리(생년월일)만 인덱스로 검색 가속
```sql
-- 1) 주민번호 앞 6자리만 인덱싱
CREATE INDEX idx_cust_ssn_prefix
ON customer(SUBSTR(ssn, 1, 6));

-- 2) 인덱스 활용 검색(조건절(WHERE)결과를 맞춰주면,  dbms가 알아서 인덱스 사용)
SELECT * FROM customer
WHERE SUBSTR(ssn, 1, 6) = '900101';
```

### (2) 부분 인덱스(Partial Index): 특정 조건만 인덱싱(전화번호 NULL 제외)
[목표]
- phone이 존재하는 고객만 인덱싱
```sql
CREATE INDEX idx_cust_phone_valid
ON customer(phone)
WHERE phone IS NOT NULL;
```

>[!tip]- idx_cust_phone_valid 인덱스 사용하는 경우
> ```sql
> -- 1) 특정 전화번호 검색 (당연히 NULL이 아니므로 인덱스 탐)
> SELECT * FROM customer 
> WHERE phone = '010-1234-5678';
> 
> -- 2) 전화번호가 존재하는 사람만 조회 (인덱스 조건과 일치하므로 인덱스 탐)
> SELECT * FROM customer 
> WHERE phone IS NOT NULL;
> ```

### (3) 리버스 키 인덱스(Reverse Key Index): 연속 ID 패턴 분산
[목표]
- 연속 키의 물리적 집중 패턴을 숨김
```sql
CREATE INDEX idx_cust_id_reverse
ON customer(cust_id) REVERSE;
```

## 7-4) “조회시 기록하는 FGA 기능 대체” 실습: 별도 Audit Log 테이블 + 트리거로 DML 기록
[주의]
- 이 방식은 SELECT(조회)는 감시 불가(트리거 한계)
- 목표는 “민감 컬럼 변경/삭제/조건부 변경”을 기록
### (1) 감사 로그 테이블 + 시퀀스 + 로그ID 자동 입력 트리거
```sql
-- 1) 시퀀스 생성
CREATE SEQUENCE audit_log_seq
START WITH 1
INCREMENT BY 1
NOCACHE
NOCYCLE;

-- 2) 감사 로그 테이블 생성
CREATE TABLE audit_log (
	log_id        NUMBER PRIMARY KEY,
    username      VARCHAR2(50),    -- 변경한 사용자
    access_time   DATE,            -- 변경 일시
    action_type   VARCHAR2(10),    -- 동작 유형 (INSERT/UPDATE/DELETE)
    accessed_col  VARCHAR2(50),    -- 접근한 컬럼명 (SSN 등)
    accessed_data VARCHAR2(200)    -- 변경된 데이터 내용 (이전값 -> 새값)
);

-- 3) log_id 자동 입력 트리거(INSERT 시 시퀀스 값 자동 할당)
CREATE OR REPLACE TRIGGER trg_audit_log_id
BEFORE INSERT ON audit_log
FOR EACH ROW
BEGIN
    :NEW.log_id := audit_log_seq.NEXTVAL;
END;
/
```

### (2) SSN 변경/삭제 감시 트리거(민감 컬럼 감시)
```sql
-- 1) SSN UPDATE 감시
CREATE OR REPLACE TRIGGER trg_audit_ssn_update
AFTER UPDATE OF ssn ON employee2 --변경후
FOR EACH ROW-- 필수
BEGIN
    INSERT INTO audit_log (username, access_time, action_type, accessed_col, accessed_data)
    VALUES (USER, SYSDATE, 'UPDATE', 'SSN', :OLD.ssn || ' -> ' || :NEW.ssn);-- 변경전과 변경 후를 기록 이때 USER, SYSDATE 내장함수사용
END;
/

-- 2) SSN DELETE 감시
CREATE OR REPLACE TRIGGER trg_audit_ssn_delete
BEFORE DELETE ON employee2--삭제전
FOR EACH ROW --필수
BEGIN
    INSERT INTO audit_log (username, access_time, action_type, accessed_col, accessed_data)
    VALUES (USER, SYSDATE, 'DELETE', 'SSN', :OLD.ssn);
END; -- 삭제된 값을 기록
/
```

### (3) 급여 조건부 감사(WHEN 절): 10000 초과일 때만 기록
[시험 포인트]
- 실제 실행에만 콜론을 붙인다 (조건절 **when**에선 :NEW가 아닌 NEW으로)
```sql
-- 1) SALARY UPDATE 감시(새 값이 10000 초과)
CREATE OR REPLACE TRIGGER trg_audit_salary_update
AFTER UPDATE OF salary ON employee2
FOR EACH ROW
WHEN (NEW.salary > 10000) --시험포인트
BEGIN
    INSERT INTO audit_log (username, access_time, action_type, accessed_col, accessed_data)
    VALUES (USER, SYSDATE, 'UPDATE', 'SALARY', :OLD.salary || ' -> ' || :NEW.salary); --시험포인트
END;
/

-- 2) SALARY INSERT 감시(10000 초과)
CREATE OR REPLACE TRIGGER trg_audit_salary_insert
AFTER INSERT ON employee2 --기존에 없던 새 행(수정이 아님)
FOR EACH ROW
WHEN (NEW.salary > 10000)
BEGIN
    INSERT INTO audit_log (username, access_time, action_type, accessed_col, accessed_data)
    VALUES (USER, SYSDATE, 'INSERT', 'SALARY', :NEW.salary); 
END;
/
```

### (4) 검증(선택: 수업에서는 “보기만”이라고 언급)
```sql
-- 1) 고액 연봉자 INSERT → INSERT 트리거 기대
INSERT INTO employee2 VALUES (1006, '조세호', '총무팀', 12000, '950606-6789012', 'EMP_1006');
COMMIT;

-- 2) 급여 인상 UPDATE → UPDATE 트리거 기대
UPDATE employee2 SET salary = 16000 WHERE emp_id = 1001;
COMMIT;

-- 3) 주민번호 변경 UPDATE → SSN UPDATE 트리거 기대
UPDATE employee2 SET ssn = '900101-9999999' WHERE emp_id = 1001;
COMMIT;

-- 4) 직원 삭제 DELETE → SSN DELETE 트리거 기대
DELETE FROM employee2 WHERE emp_id = 1003;
COMMIT;

-- 5) 감사 로그 확인
SELECT * FROM audit_log ORDER BY log_id;
```


# 📚 Chapter 8. DB 보안 관리 실무 심층 분석 — 실습 모음

## 8-1) 사용자(User) 생성 실습 (CREATE USER) + 확인(데이터사전)
[시나리오]
- 관리자(SYSDBA)로 접속 후 사용자 생성
- DEFAULT TABLESPACE 지정
- dba_users로 생성 확인

[실습 SQL]
```sql
-- 1) 관리자 접속 (아디 비번 비우고 관리자로서 접속함~ 이런느낌으로)
CONN / AS SYSDBA; 

-- 2) 사용자 생성 (예: salesman_1 / 1234 / USERS)
CREATE USER salesman_1
IDENTIFIED BY 1234
DEFAULT TABLESPACE USERS; -- 데이터가 저장될 기본 공간 지정

-- 3) 생성된 사용자 확인 (OPEN 상태 등 확인)
SELECT username, default_tablespace
FROM dba_users
WHERE account_status = 'OPEN';
```
[핵심 포인트]
- CREATE USER는 SYS/SYSTEM(관리자)만 가능
	- **SYS:** DB 생성/삭제가 가능한 최상위 권한자 (Data Dictionary 소유).
    - **SYSTEM:** DB 생성/삭제를 제외한 일반적인 관리자.
- CDB/PDB 환경에서는 공통/로컬 사용자 개념 존재(개념 포인트)
  - 공통 사용자: C## 접두어 필요(개념), 전체 데이터베이스 접근
  - 로컬 사용자: 관리자가 그 PDB에서 생성하고 그 PDB만 접근 가능

## 8-2) 프로파일(Profile) 실습: 비밀번호 정책(Profile 생성)
[목표]
- 로그인 실패 횟수 제한, 잠금 기간, 만료, 재사용 제한 등

[실습 SQL]
```sql
CREATE PROFILE prof_passwd LIMIT
  FAILED_LOGIN_ATTEMPTS 5    -- 5회 실패 시 계정 잠금
  PASSWORD_LOCK_TIME 30      -- 30일간 잠금 유지
  PASSWORD_LIFE_TIME 40      -- 비밀번호 40일마다 변경
  PASSWORD_REUSE_TIME 50;    -- 50일간 동일 암호 재사용 불가
```

## 8-3) 자원(Resource) 프로파일 실습: RESOURCE_LIMIT 활성화 + 프로파일 생성 + 적용
[목표]
- CPU/접속 시간/유휴 시간 제한을 강제
- RESOURCE_LIMIT 파라미터를 true로 켜야 동작

[실습 SQL]
```sql
-- 0) 자원 제한 기능 활성화(필수)
ALTER SYSTEM SET RESOURCE_LIMIT = true;

-- 1) 자원 프로파일 생성
CREATE PROFILE prof_resource LIMIT
  CPU_PER_SESSION 1500       -- CPU 연속 사용 15초 제한
  CONNECT_TIME 480           -- 하루 접속 8시간 제한
  IDLE_TIME 15;              -- 15분간 활동 없으면 연결 끊기

-- 2) 사용자에게 프로파일 적용
ALTER USER 유저명 PROFILE prof_resource;

-- (중요) 잠긴 계정 해제(관리자)
ALTER USER 유저명 ACCOUNT UNLOCK;      -- ★ 시험 출제 유력

[추가 조회]
SELECT username, profile FROM dba_users WHERE username = '유저명';

[삭제]
DROP PROFILE prof_resource CASCADE;
```


## 8-4) 권한(Privilege) 부여/회수 실습: 시스템 권한 + 오브젝트 권한
[주의]
- 문법은 “시스템 권한”과 “오브젝트 권한”이 다르게 사용됨
  - 시스템 권한: GRANT 권한 TO 관리자명
  - 오브젝트 권한: GRANT 권한 ON 객체 TO 사용자명
### (1) 시스템 권한: 접속 권한/테이블 생성 권한
```sql
-- 관리자 접속
CONN / AS SYSDBA;

-- HR 계정 잠금 해제 + 비번 변경
ALTER USER hr ACCOUNT UNLOCK IDENTIFIED BY 1234;

-- DB 접속 권한(CONNECT) 부여
GRANT CONNECT TO salesman_1;

-- 테이블 생성 권한 부여
GRANT CREATE TABLE TO salesman_1;

-- (옵션) 권한 재부여 가능하게: WITH ADMIN OPTION (시스템 권한에 사용)
GRANT CREATE VIEW TO HR WITH ADMIN OPTION;


### (2) 오브젝트 권한: 타 계정 테이블 공유(조회/입력 등)
-- 테이블 소유자(HR)로 접속
CONN hr/1234;

-- employees 테이블: 조회 + 입력 권한 부여
GRANT SELECT, INSERT ON EMPLOYEES TO salesman_1;

-- departments 테이블: 조회 권한만 부여
GRANT SELECT ON DEPARTMENTS TO salesman_1;
```

### (3) 타 계정 테이블 조회(스키마 명시 필수)
```sql
-- salesman_1 접속 후
CONN salesman_1/1234;

-- 소유자 명시해야 조회됨
SELECT * FROM hr.DEPARTMENTS;
```

### (4) ORA-01031(권한 불충분) 확인 실습
```sql
-- salesman_1은 hr.DEPARTMENTS에 SELECT만 있음(예시)
UPDATE hr.DEPARTMENTS SET LOCATION_ID = 1700 WHERE MANAGER_ID = 100;
-- 기대: ORA-01031: 권한이 불충분합니다
```

### (5) 권한 회수(REVOKE) + 연쇄 회수 개념
```sql
-- HR(소유자)에서 회수 예시
REVOKE SELECT ON EMPLOYEES FROM salesman_1;
```
[핵심 포인트]
- WITH GRANT OPTION(오브젝트 권한)으로 준 권한은 REVOKE 시 연쇄 회수(Cascade)됨
- WITH ADMIN OPTION(시스템 권한)은 연쇄 회수 X

## 8-5) 롤(Role) 실습: 롤 생성 → 롤에 권한 부여 → 사용자에게 롤 부여
### 오라클 암기 롤(ROLE)
1. **CONNECT:** DB 접속에 필요한 기본 권한 (`CREATE SESSION` 등).
2. **RESOURCE:** 객체(테이블, 시퀀스, 프로시저 등)를 생성할 수 있는 권한 집합.
3. **DBA:** 모든 시스템 권한을 가진 최고 관리자 롤.
[시나리오]
- team1 롤을 만들고 user1~user4에게 한 번에 권한 할당
- HR 테이블 접근 권한을 롤에 부여

[실습 SQL]
```sql
-- Step 1) 사용자/롤 생성(관리자)
CONN / AS SYSDBA;

CREATE USER user1 IDENTIFIED BY 1234;
-- user2~user4 동일하게 생성(생략)
CREATE ROLE team1;

-- Step 2) 롤에 오브젝트 권한 부여(객체 소유자=HR)
CONN hr/1234;

GRANT SELECT, INSERT, UPDATE ON hr.EMPLOYEES TO team1;
GRANT SELECT ON hr.DEPARTMENTS TO team1;

-- Step 3) 사용자에게 롤 부여(관리자)
CONN / AS SYSDBA;

GRANT team1 TO user1, user2, user3, user4;

-- Step 4) 특정 사용자(user1)에게만 추가 권한 부여(예외 권한)
GRANT INSERT, UPDATE ON hr.DEPARTMENTS TO user1;

[롤 삭제]
DROP ROLE team1;
```

### (권한/롤 상태 확인: Data Dictionary View를 통해)
```sql
-- 롤이 가진 테이블 권한 확인
SELECT * FROM DBA_TAB_PRIVS WHERE grantee = 'TEAM1';

-- 사용자가 가진 롤 확인
SELECT * FROM DBA_ROLE_PRIVS WHERE grantee = 'USER1';

-- HR이 남에게 부여한 테이블 권한 확인
SELECT * FROM DBA_TAB_PRIVS WHERE grantor = 'HR';
```

# 📘 Chapter 9: 감사(Audit) 및 데이터 암호화 — 실습 모음


## 9-1) 감사(AUDIT) 실습: audit_trail 활성화 → 로그인 실패/테이블 조회 감시 → 로그 확인

`AUDIT [이벤트] [BY 사용자] WHENEVER [SUCCESSFUL | NOT SUCCESSFUL];`

[시나리오]
- 감사 파라미터가 NONE이면 활성화
- 로그인 실패 감사(SESSION, WHENEVER NOT SUCCESSFUL)
- HR의 EMPLOYEES 테이블 SELECT 감시
- DBA_AUDIT_TRAIL에서 로그 확인

[실습 SQL]
```sql
-- (SYS 권장: CMD)
-- 1) 감사 파라미터 확인
SHOW PARAMETER AUDIT_TRAIL;

-- 2) 감사 활성화(DB, EXTENDED:활성화 + 실행한 SQL 문장까지 저장) + SPFILE 반영
ALTER SYSTEM SET AUDIT_TRAIL=DB,EXTENDED SCOPE=SPFILE;

-- 3) DB 재시작(파라미터 적용)
SHUTDOWN IMMEDIATE;
STARTUP;

-- 4) 감사 정책 설정
-- 4-1) 로그인 실패 감사
AUDIT SESSION WHENEVER NOT SUCCESSFUL;

-- 4-2) 특정 유저(HR)의 EMPLOYEES 테이블 조회 감사
AUDIT SELECT ON HR.EMPLOYEES BY HR;

-- 5) (HR 접속) 행위 유발: SELECT 실행
CONN HR/1234;
SELECT * FROM EMPLOYEES WHERE ROWNUM <= 5;

-- 6) (SYS/SYSTEM) 감사 로그 확인
SELECT username, timestamp, obj_name, action_name, sql_text
FROM DBA_AUDIT_TRAIL
WHERE username = 'HR'
ORDER BY timestamp DESC;

-- 7) 감사 해제(Cleanup)
NOAUDIT SESSION;
NOAUDIT SELECT ON HR.EMPLOYEES;
```
[시험 포인트]
- 명령어: AUDIT / NOAUDIT
- 로그 뷰: DBA_AUDIT_TRAIL ★ 필수 암기
- 옵션: WHENEVER NOT SUCCESSFUL (실패만 기록)

## 9-2) 데이터 암호화(AES256) 실습 성공 파트: RAW 컬럼 + DBMS_CRYPTO 함수 기반 암복호화
[시나리오]
- secure_table에 SSN을 RAW(2000)로 저장
- encrypt_aes / decrypt_aes 함수 생성
- INSERT/UPDATE 시 암호화 값 저장, 조회 시 decrypt로 복호화 확인


### (1) 테이블 생성
```sql
CREATE TABLE secure_table (
    id NUMBER PRIMARY KEY,
    name VARCHAR2(50),
    ssn_raw RAW(2000)          -- ★ 정답: RAW
);
```
### (2) 암호화 함수 encrypt_aes 생성
```sql
CREATE OR REPLACE FUNCTION encrypt_aes(p_plain IN VARCHAR2) RETURN RAW IS
    l_key RAW(32) := UTL_RAW.cast_to_raw('01234567890123456789012345678901');
BEGIN
    IF p_plain IS NULL THEN
        RETURN NULL;
    END IF;

    RETURN DBMS_CRYPTO.encrypt(
        src => UTL_RAW.cast_to_raw(p_plain),
        typ => DBMS_CRYPTO.encrypt_aes256 + DBMS_CRYPTO.chain_cbc + DBMS_CRYPTO.pad_pkcs5,
        key => l_key
    );
END;
/


### (3) 복호화 함수 decrypt_aes 생성
CREATE OR REPLACE FUNCTION decrypt_aes(p_raw IN RAW) RETURN VARCHAR2 IS
    l_key RAW(32) := UTL_RAW.cast_to_raw('01234567890123456789012345678901');
BEGIN
    IF p_raw IS NULL THEN
        RETURN NULL;
    END IF;

    RETURN UTL_RAW.cast_to_varchar2(
        DBMS_CRYPTO.decrypt(
            src => p_raw,
            typ => DBMS_CRYPTO.encrypt_aes256 + DBMS_CRYPTO.chain_cbc + DBMS_CRYPTO.pad_pkcs5,
            key => l_key
        )
    );
END;
/
```
[시험 포인트(빈칸)]
- 데이터 타입: RAW
- 패키지: DBMS_CRYPTO
### (4) INSERT/UPDATE/조회 테스트
```sql
-- INSERT(암호화 저장)
INSERT INTO secure_table (id, name, ssn_raw)
VALUES (1, '홍길동', encrypt_aes('900101-1234567'));

INSERT INTO secure_table (id, name, ssn_raw)
VALUES (2, '김철수', encrypt_aes('850505-7654321'));
COMMIT;

-- UPDATE(암호화 저장)
UPDATE secure_table
SET ssn_raw = encrypt_aes('900101-9999999')
WHERE id = 1;
COMMIT;

-- 암호화 상태 조회(사람이 읽을 수 없음)
SELECT id, name, ssn_raw FROM secure_table;

-- 복호화 조회
SELECT id, name, decrypt_aes(ssn_raw) AS ssn_decrypted
FROM secure_table;
```
## 9-3) [응용/개념] 트리거+뷰로 “자동 암호화/자동 복호화” 구조 (실습 난항 파트)
[핵심 구조]
- secure_table2: ssn_raw를 VARCHAR2로 저장(HEX 문자열로 저장)
- trg_encrypt_ssn: BEFORE INSERT/UPDATE 시 encrypt_aes 결과를 RAWTOHEX로 변환해 저장
- decrypt_aes_hex: HEX → RAW(HEXTORAW) → decrypt_aes
- secure_table_v: 조회 시 자동 복호화된 결과 제공


### (1) 자동화용 테이블
```sql
CREATE TABLE secure_table2 (
    id NUMBER PRIMARY KEY,
    name VARCHAR2(50),
    ssn_raw VARCHAR2(2000)  -- RAW를 HEX 문자열로 저장하기 위해 VARCHAR2
);
```
### (2) 자동 암호화 트리거 trg_encrypt_ssn
```sql
CREATE OR REPLACE TRIGGER trg_encrypt_ssn
BEFORE INSERT OR UPDATE ON secure_table2
FOR EACH ROW
BEGIN
    IF :NEW.ssn_raw IS NOT NULL THEN
        :NEW.ssn_raw := RAWTOHEX(encrypt_aes(:NEW.ssn_raw));  -- ★ RAWTOHEX
    END IF;
END;
/
```
### (3) HEX 복호화 래퍼 함수 decrypt_aes_hex
```sql
CREATE OR REPLACE FUNCTION decrypt_aes_hex(p_hex IN VARCHAR2) RETURN VARCHAR2 IS
BEGIN
    IF p_hex IS NULL THEN
        RETURN NULL;
    END IF;

    RETURN decrypt_aes(HEXTORAW(p_hex));   -- HEX → RAW → 복호화
END;
/
```
### (4) 자동 복호화 뷰 secure_table_v
```sql
CREATE OR REPLACE VIEW secure_table_v AS
SELECT id, name, decrypt_aes_hex(ssn_raw) AS ssn
FROM secure_table2;
```
### (5) 테스트
```sql
INSERT INTO secure_table2 (id, name, ssn_raw)
VALUES (1, '홍길동', '900101-1234567');
COMMIT;

SELECT * FROM secure_table2;      -- 암호화된 HEX 문자열 확인
SELECT * FROM secure_table_v;     -- 자동 복호화된 ssn 확인
```

# 📚 Chapter 10: DB 보안 종합 실습 분석 — “문제형 실습 SQL” 정리
Oracle SQL의 보안, 권한 관리(DCL), 뷰(View) 및 감사(Audit)와 관련된 실습 문제와 정답입니다. 각 항목의 정답은 접혀있는 영역(Callout)을 클릭하여 확인할 수 있습니다.

---

### 10-1. 사용자 계정 생성 및 접속 권한 부여

> [!note]- 비밀번호가 `stud1234`인 사용자 `student01`을 생성하고, 데이터베이스에 접속할 수 있는 기본 권한을 부여하시오.
> ```SQL
> CREATE USER student01 IDENTIFIED BY stud1234;
> GRANT CONNECT TO student01;
> ```

### 10-2. 객체 권한 부여 및 회수



> [!note]- `student01` 사용자에게 `hr`의 `employees` 테이블을 조회할 수 있는 권한을 부여한 뒤, 즉시 해당 권한을 다시 회수하시오.
> ```SQL
> -- 권한 부여
> GRANT SELECT ON hr.employees TO student01;
> -- 권한 회수
> REVOKE SELECT ON hr.employees FROM student01;
> ```

### 10-3. ROLE(롤) 생성 및 부여

> [!note]- **테이블 생성** 권한과 **모든 테이블 조회** 권한을 담은 `data_user`라는 이름의 롤(Role)을 생성하고, `student01` 사용자에게 해당 롤을 부여하시오.
> ```SQL
> -- 롤 생성
> CREATE ROLE data_user;
> -- 롤에 권한 추가
> GRANT CREATE TABLE, SELECT ANY TABLE TO data_user;
> -- 사용자에게 롤 부여
> GRANT data_user TO student01;
> ```

### 10-4. 패스워드 정책(Profile) 생성 및 적용



> [!note]- 로그인 실패 허용 횟수를 3회로 제한하는 프로파일 `secure_prof`를 생성하고, 이를 `student01` 사용자에게 적용하시오.
> ```SQL
> -- 프로파일 생성
> CREATE PROFILE secure_prof LIMIT
>     FAILED_LOGIN_ATTEMPTS 3;
> 
> -- 사용자에게 프로파일 적용
> ALTER USER student01 PROFILE secure_prof;
> ```

### 10-5. 계정 잠금 해제



> [!note]- 잠겨 있는 `student01` 계정의 상태를 잠금 해제로 변경하시오.
> ```SQL
> ALTER USER student01 ACCOUNT UNLOCK;
> ```

### 10-6. 특정 컬럼 제한 뷰(View) 생성 및 권한 부여

> [!note]- `employees` 테이블에서 `ename`과 `job` 컬럼만 볼 수 있는 뷰 `emp_view`를 생성하고, `student01`에게 해당 뷰를 조회할 수 있는 권한을 부여하시오.
> ```SQL
> -- 뷰 생성
> CREATE OR REPLACE VIEW emp_view AS
> SELECT ename, job FROM employees;
> 
> -- 뷰 조회 권한 부여
> GRANT SELECT ON emp_view TO student01;
> ```

### 10-7. 데이터 마스킹 뷰 생성



> [!note]- 주민번호(ssn) 뒷자리를 마스킹 처리한 뷰(person_masked) 생성
> ```SQL
> CREATE VIEW person_masked AS
> SELECT name,
>        SUBSTR(ssn, 1, 6) || '-*******' AS ssn_masked
> FROM person;
> ```

### 10-8. 데이터베이스 감사(Audit) 설정 및 확인

**문제:** `employees` 테이블에 대해 `SELECT` 작업이 발생할 때마다 접속 건별(`BY ACCESS`)로 감사를 수행하도록 설정하고, 감사 기록(Audit Trail)을 확인하는 쿼리를 작성하시오.

> [!note]- `employees` 테이블에 대해 조회가 발생할 때마다 **접속 건별**로 감사를 수행하도록 설정하고, 감사 로그가 저장되는 뷰를 조회하시오.
> ```SQL
> -- 감사 설정
> AUDIT SELECT ON employees BY ACCESS;
> 
> -- 감사 로그 확인
> SELECT * FROM DBA_AUDIT_TRAIL;
> ```

### 10-9. 데이터 암호화 핵심 요소

**문제:** Oracle 내에서 컬럼 단위 암호화를 수행할 때 주로 사용되는 **알고리즘**, **데이터 타입**, **패키지** 명을 서술하시오.

> [!note]- 정답 확인
>
> - **알고리즘:** AES256 (Advanced Encryption Standard 256bit)
>     
> - **데이터 타입:** RAW (이진 데이터 저장을 위함)
>     
> - **사용 패키지:** DBMS_CRYPTO


### 사용자 및 권한 관리

> [!note]- 문제 1: 비밀번호가 stud1234인 사용자 student01 생성 및 기본 접속 권한 부여
> ```SQL
> -- 사용자 생성
> CREATE USER student01 IDENTIFIED BY stud1234;
> -- 접속 권한 부여
> GRANT CONNECT TO student01;
> ```

> [!note]- 문제 2: student01 계정에 employees 테이블 조회 권한 부여 후 즉시 회수
> ```SQL
> -- 권한 부여
> GRANT SELECT ON employees TO student01;
> -- 권한 회수
> REVOKE SELECT ON employees FROM student01;
> ```

> [!note]- 문제 3: 테이블 생성 및 조회 권한을 포함한 data_user 롤(Role) 생성 후 student01에게 부여
> ```SQL
> -- 롤 생성
> CREATE ROLE data_user;
> -- 롤에 권한 추가 (테이블 생성 및 모든 테이블 조회 예시)
> GRANT CREATE TABLE, SELECT ANY TABLE TO data_user;
> -- 사용자에게 롤 부여
> GRANT data_user TO student01;
> ```
### 비밀번호 및 계정 정책

> [!note]- 문제 4: 로그인 실패 3회 시 계정 잠금 프로파일(secure_prof) 생성 및 student01 적용
> ```SQL
> -- 프로파일 생성
> CREATE PROFILE secure_prof LIMIT
> 	FAILED_LOGIN_ATTEMPTS 3;
> -- 사용자에게 프로파일 적용
> ALTER USER student01 PROFILE secure_prof;
> ```

> [!note]- 문제 5: 잠겨있는 student01 계정을 관리자 권한으로 잠금 해제
> ```SQL
> -- (참고) 계정 잠금 확인 쿼리
> SELECT username, account_status FROM dba_users WHERE username = 'STUDENT01';
> -- 계정 잠금 해제
> ALTER USER student01 ACCOUNT UNLOCK;
> ```
### 객체 보안 (Object Security)

> [!note]- 문제 6: employees 테이블의 ename, job 컬럼만 조회하는 뷰(emp_view) 생성 및 권한 부여
> ```SQL
> -- 뷰 생성
> CREATE OR REPLACE VIEW emp_view AS
> SELECT ename, job FROM employees;
> -- 뷰 조회 권한 부여
> GRANT SELECT ON emp_view TO student01;
> ```


> [!note]- 문제 7: 주민번호(ssn) 뒷자리를 마스킹 처리한 뷰(person_masked) 생성
> ```SQL
> -- (선행) 실습용 테이블 생성이 필요한 경우
> -- CREATE TABLE person (name VARCHAR2(20), ssn VARCHAR2(14));
> -- 마스킹 뷰 생성
> CREATE OR REPLACE VIEW person_masked AS
> SELECT name, SUBSTR(ssn, 1, 6) || '-*******' AS ssn_masked
> FROM person;
> ```
### 감사 (Auditing)

> [!note]- 문제 8: employees 테이블 SELECT 실행 시 접속 건별 감사 설정 및 로그 조회
> ```SQL
> -- 감사 설정 (접속 건별)
> AUDIT SELECT ON employees BY ACCESS;
> -- 감사 로그 조회
> SELECT * FROM DBA_AUDIT_TRAIL
> WHERE obj_name = 'EMPLOYEES'
> ORDER BY timestamp DESC;
> ```
---

## 10-9) 문제 9: 암호화(개념 키워드만)
- 알고리즘: AES256
- 데이터 타입: RAW
- 패키지: DBMS_CRYPTO


# ✅ 전체 실습 정리 (Part 3/?) — “실습”의 누락 방지용 최종 점검 + 출제형 빈칸/키워드 모음
- 이번 파트는 새 실습을 추가하기보다,
  (1) 앞 파트(Chapter 7~10) 실습이 “빠짐없이” 들어갔는지 체크리스트로 재열거
  (2) 실습에서 반복 출제되는 ‘빈칸/키워드/한 줄 답’만 따로 모아줌


# 0) 실습 누락 방지 체크리스트 (Chapter 7~10)


## [Chapter 7] 고급 DB 오브젝트
[트리거]
- (7-1) UPDATE/DELETE 로그 트리거: UPDATING/DELETING로 모드 구분 + :OLD 값 백업 테이블 INSERT + USER 기록
- (7-2) “수정 제한 트리거”: BEFORE UPDATE OR DELETE + IF USER <> :OLD.login_id THEN RAISE_APPLICATION_ERROR

[뷰]
- (7-2) 권한별 뷰 3개 생성
   - vw_my_profile: WHERE login_id = USER
   - vw_hr_view: SSN 제외 SELECT
   - vw_admin_view: SELECT *

[인덱스]
- (7-3) 함수 기반 인덱스: SUBSTR(ssn,6) 인덱스 + 동일 WHERE 함수로 테스트
- (7-3) 부분 인덱스: WHERE phone IS NOT NULL
- (7-3) 리버스 키 인덱스: ON cust_id REVERSE

[FGA 대체(트리거 기반 감사 로그)]
- (7-4) audit_log_seq 생성
- (7-4) audit_log 테이블 생성
- (7-4) trg_audit_log_id: BEFORE INSERT ON audit_log → :NEW.log_id := seq.NEXTVAL
- (7-4) SSN UPDATE 트리거: AFTER UPDATE OF ssn ON employee2
- (7-4) SSN DELETE 트리거: BEFORE DELETE ON employee2
- (7-4) SALARY UPDATE 트리거: WHEN (NEW.salary > 10000)
- (7-4) SALARY INSERT 트리거: WHEN (NEW.salary > 10000)
- (7-4) (선택 검증) INSERT/UPDATE/DELETE 후 SELECT * FROM audit_log ORDER BY log_id



## [Chapter 8] 계정/프로파일/권한/롤
[계정 생성]
- SYSDBA 접속(CONN / AS SYSDBA) 후 CREATE USER + DEFAULT TABLESPACE
- dba_users 조회로 확인

[프로파일]
- 비밀번호 프로파일(prof_passwd) 생성: FAILED_LOGIN_ATTEMPTS / PASSWORD_LOCK_TIME / PASSWORD_LIFE_TIME / PASSWORD_REUSE_TIME
- 자원 제한 활성화: ALTER SYSTEM SET RESOURCE_LIMIT = true
- 자원 프로파일(prof_resource) 생성: CPU_PER_SESSION / CONNECT_TIME / IDLE_TIME
- 사용자에 프로파일 적용: ALTER USER 유저명 PROFILE 프로파일명
- 잠금 해제: ALTER USER 유저명 ACCOUNT UNLOCK
- 조회: SELECT username, profile FROM dba_users …
- 삭제: DROP PROFILE … CASCADE

[권한]
- 시스템 권한 부여: GRANT CONNECT, CREATE TABLE …
- HR 잠금 해제/비번 변경: ALTER USER hr ACCOUNT UNLOCK IDENTIFIED BY 1234
- 시스템 권한 옵션: WITH ADMIN OPTION (연쇄회수 X)
- 오브젝트 권한 부여(HR 소유): GRANT SELECT, INSERT ON EMPLOYEES TO salesman_1 등
- 타 계정 테이블 조회: SELECT * FROM hr.DEPARTMENTS
- ORA-01031 실습: UPDATE hr.DEPARTMENTS … → 권한 불충분 확인
- REVOKE: REVOKE SELECT ON EMPLOYEES FROM salesman_1
- WITH GRANT OPTION(연쇄회수 O) 개념 연결

[롤]
- CREATE ROLE team1
- (HR) GRANT … ON hr.EMPLOYEES TO team1
- (관리자) GRANT team1 TO user1,user2,user3,user4
- 특정 사용자만 추가 권한: GRANT INSERT, UPDATE ON hr.DEPARTMENTS TO user1
- 권한/롤 상태 확인: DBA_TAB_PRIVS / DBA_ROLE_PRIVS
- DROP ROLE team1



## [Chapter 9] 감사(Audit) + 암호화
[Audit 실습]
- SHOW PARAMETER AUDIT_TRAIL
- ALTER SYSTEM SET AUDIT_TRAIL=DB,EXTENDED SCOPE=SPFILE
- SHUTDOWN IMMEDIATE; STARTUP;
- AUDIT SESSION WHENEVER NOT SUCCESSFUL
- AUDIT SELECT ON HR.EMPLOYEES BY HR
- (HR) SELECT로 행위 유발
- DBA_AUDIT_TRAIL에서 로그 확인(컬럼 포함)
- NOAUDIT SESSION / NOAUDIT SELECT ON HR.EMPLOYEES

[암호화 실습(성공 파트)]
- secure_table 생성: ssn_raw RAW(2000)
- encrypt_aes 함수 생성: DBMS_CRYPTO.encrypt + AES256/CBC/PKCS5
- decrypt_aes 함수 생성: DBMS_CRYPTO.decrypt + 동일 key
- INSERT/UPDATE 시 encrypt_aes 사용 + COMMIT
- SELECT ssn_raw(암호문) 확인
- SELECT decrypt_aes(ssn_raw)로 평문 확인

[암호화 자동화 구조(개념 파트)]
- secure_table2: ssn_raw VARCHAR2(2000)
- trg_encrypt_ssn: BEFORE INSERT OR UPDATE + :NEW.ssn_raw := RAWTOHEX(encrypt_aes(…))
- decrypt_aes_hex: decrypt_aes(HEXTORAW(p_hex))
- secure_table_v VIEW: decrypt_aes_hex(ssn_raw) AS ssn
- INSERT(평문) → secure_table2(HEX 암호문) / secure_table_v(평문)



## [Chapter 10] 종합 실습(문제형)
- Q1 student01 생성 + GRANT CONNECT
- Q2 GRANT SELECT ON hr.employees + REVOKE
- Q3 CREATE ROLE data_user + GRANT 권한 to role + GRANT role to user
- Q4 CREATE PROFILE secure_prof FAILED_LOGIN_ATTEMPTS 3 + ALTER USER … PROFILE …
- Q5 ALTER USER … ACCOUNT UNLOCK
- Q6 emp_view(ename,job) + GRANT SELECT ON emp_view
- Q7 person_masked: SUBSTR(ssn,6) || '-*******'
- Q8 AUDIT SELECT ON employees BY ACCESS + SELECT * FROM DBA_AUDIT_TRAIL
- Q9 암호화 키워드: AES256 / RAW / DBMS_CRYPTO


# 1) 출제형 “빈칸/키워드” 초압축 모음 (실습 기반)


## (A) 트리거
- 행 단위 트리거 필수 옵션: FOR EACH ROW
- 변경 전/후 참조: :OLD / :NEW
- 동작 구분 시스템 변수: INSERTING / UPDATING / DELETING
- 작업자: USER
- 강제 차단 에러: RAISE_APPLICATION_ERROR(-20001, '…')
- 조건부 트리거 최적화 포인트: WHEN (NEW.salary > 10000)

## (B) 뷰
- 본인 행만 조회 조건(시험 포인트): WHERE login_id = USER
- 인사팀 뷰: SSN 컬럼 제외 SELECT

## (C) 인덱스(보안)
- 함수 기반 인덱스 예: ON customer(SUBSTR(ssn,6))
- 부분 인덱스 예: WHERE phone IS NOT NULL
- 리버스 키 인덱스: REVERSE

## (D) 감사(Audit)
- 현재 설정 확인: SHOW PARAMETER AUDIT_TRAIL
- 상세 로그: DB, EXTENDED
- 로그인 실패 감사: AUDIT SESSION WHENEVER NOT SUCCESSFUL
- 로그 확인 뷰(필수 암기): DBA_AUDIT_TRAIL
- 해제: NOAUDIT …

## (E) 암호화(AES256)
- 패키지(빈칸): DBMS_CRYPTO
- 암호문 저장 타입(빈칸): RAW (또는 BLOB)
- HEX 저장 자동화에서 변환 함수:
  - RAW → HEX: RAWTOHEX
  - HEX → RAW: HEXTORAW
