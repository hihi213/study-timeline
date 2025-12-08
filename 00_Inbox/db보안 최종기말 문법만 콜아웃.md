---
type: 생각조각
status: inbox
source:
creation_date: 2025-12-07
---
프로파일(프로필) limit
view as
grant, 연결
audit 이벤트 on 테이블 dba_audit_trail
# 📚 Chapter 10: DB 보안 종합 실습 (문제 풀이)

> [!NOTE]- 문제 1: 비밀번호가 stud1234인 사용자 student01을 생성하고 접속 권한(CONNECT)을 부여하시오.
> ```SQL
> CREATE USER student01 IDENTIFIED BY stud1234;
> GRANT CONNECT TO student01;
> ```

> [!NOTE]- 문제 2: student01에게 employees 테이블 조회 권한을 부여했다가 즉시 회수하시오.
> ```SQL
> -- 권한 부여
> GRANT SELECT ON employees TO student01;
> -- 권한 회수
> REVOKE SELECT ON employees FROM student01;
> ```

> [!NOTE]- 문제 3: data_user라는 롤을 만들고, CREATE TABLE 권한을 담아 student01에게 부여하시오.
> ```SQL
> -- 1. 롤 생성
> CREATE ROLE data_user;
> -- 2. 롤에 시스템 권한 추가
> GRANT CREATE TABLE TO data_user;
> -- 3. 사용자에게 롤 부여
> GRANT data_user TO student01;
> ```

> [!NOTE]- 문제 4: 로그인 실패 3회 시 계정이 잠기는 프로파일 secure_prof를 만들고 student01에게 적용하시오.
>
> ```SQL
> -- 1. 프로파일 생성
> CREATE PROFILE secure_prof LIMIT
>     FAILED_LOGIN_ATTEMPTS 3;
> -- 2. 프로파일 적용
> ALTER USER student01 PROFILE secure_prof;
> ```

> [!NOTE]- 문제 5: student01 계정이 잠겼을 때 관리자 권한으로 해제하시오.
> ```SQL
> ALTER USER student01 ACCOUNT UNLOCK;
> ```

> [!NOTE]- employees 테이블에서 ename과 job만 조회할 수 있는 뷰 emp_view를 생성하고 student01에게 조회 권한을 주시오.
> ```SQL
> -- 1. 뷰 생성
> CREATE OR REPLACE VIEW emp_view AS
> SELECT ename, job FROM employees;
> -- 2. 권한 부여
> GRANT SELECT ON emp_view TO student01;
> ```

> [!NOTE]- 문제 7: 주민번호(ssn) 뒷자리를 *******로 마스킹 처리하여 보여주는 뷰를 생성하시오.
> ```SQL
> CREATE OR REPLACE VIEW person_masked AS
> SELECT name, SUBSTR(ssn, 1, 6) || '-*******' AS ssn_masked
> FROM person;
> ```

> [!NOTE]- 문제 8: employees 테이블에 대한 SELECT 작업을 접속 건별로 감사하고, 로그를 확인하시오.
> ```SQL
> -- 1. 감사 설정
> AUDIT SELECT ON employees BY ACCESS;
> -- 2. 로그 확인 (DBA_AUDIT_TRAIL)
> SELECT username, timestamp, action_name
> FROM DBA_AUDIT_TRAIL
> WHERE obj_name = 'EMPLOYEES';
> ```

> [!NOTE]- 문제 9: Oracle DB 암호화 구현 시 사용되는 핵심 요소 3가지는?
>
> 1. **알고리즘:** `AES256`
>     
> 2. **데이터 타입:** `RAW` (또는 `BLOB`)
>     
> 3. **패키지:** `DBMS_CRYPTO`
>
## 문법만 콜아웃
# 📘 Chapter 7: 고급 DB 오브젝트 (트리거, 뷰, 인덱스)

> [!NOTE]- 문제: 트리거 기본 생성 문법
> ```SQL
> CREATE OR REPLACE TRIGGER 트리거명
> 	[동작시점] [이벤트] ON 테이블명 
>     FOR EACH ROW  -- :OLD, :NEW 사용 시 필수
> BEGIN
>     -- 로직 작성
> END;
> /
> -- 동작시점: BEFORE / AFTER 
> -- 이벤트: INSERT /UPDATE / DELETE
> -- 2) 동작 확인 준비
> SET SERVEROUTPUT ON;
> ```
>

> [!NOTE]- 문제: 데이터 참조 변수 (:OLD, :NEW)
>
> - **`:OLD.컬럼명`** : 변경 전 데이터
>     
> - **`:NEW.컬럼명`** : 변경 후 데이터
> 	```SQL
> > -- 조건부 WHEN에서는 NEW에 콜론(:)을 붙이지 않는 것이 핵심
>  > … FOR EACH ROW WHEN (NEW.컬럼명 > 값)
>  > ```

> [!NOTE]- 문제: 작업 유형 조건문 (IF)
> ```SQL
> IF UPDATING THEN 실행문 END IF;
> IF DELETING THEN 실행문 END IF;
> IF INSERTING THEN 실행문 END IF;
> ```

> [!NOTE]- 문제: 강제 예외 발생 (차단)
> ```SQL
> RAISE_APPLICATION_ERROR(-20000, '에러 메시지');
> ```

> [!NOTE]- 문제: 행 수준 보안 뷰 (본인 데이터만 조회)
> ```SQL
> CREATE OR REPLACE VIEW 뷰이름 AS
> SELECT * FROM 테이블명
> WHERE 컬럼명 = USER; -- 접속한 유저와 일치하는 행만 조회
> ```

> [!NOTE]- 문제: 리버스 키 인덱스 (값 분산)
> ```SQL
> CREATE INDEX 인덱스명 ON 테이블명(컬럼명) REVERSE;
> ```

> [!NOTE]- 문제: 함수 기반 인덱스 (일부만 인덱싱)
> ```SQL
> CREATE INDEX 인덱스명 ON 테이블명(SUBSTR(주민번호, 1, 6));
> ```

> [!NOTE]- 문제: 부분 인덱스 (특정 조건만 인덱싱)
> ```SQL
> CREATE INDEX 인덱스명 ON 테이블명(컬럼명) WHERE 조건;
> -- 예: WHERE 전화번호 IS NOT NULL
> ```

---

# 📚 Chapter 8: 사용자 및 권한 관리

> [!NOTE]- 문제: 사용자 생성
> ```SQL
> CREATE USER 유저명 IDENTIFIED BY 비번 DEFAULT TABLESPACE 저장테이블명;
> ```

> [!NOTE]- 문제: 사용자 정보 조회 (관리자)
> ```SQL
> SELECT * FROM DBA_USERS WHERE account_status = 'OPEN';
> ```

> [!NOTE]- 문제: 프로파일 생성 (암호/자원 제한)
> ```SQL
> --자원 제한 활성화 (선행 작업)
> ALTER SYSTEM SET RESOURCE_LIMIT = true;
> 
> CREATE PROFILE 프로파일명 LIMIT
>     FAILED_LOGIN_ATTEMPTS 횟수
>     PASSWORD_LOCK_TIME 일수
>     PASSWORD_LIFE_TIME 일수
>     CPU_PER_SESSION 값
>     IDLE_TIME 분;
> ```

> [!NOTE]- 문제: 프로파일 적용
> ```SQL
> ALTER USER 유저명 PROFILE 프로파일명;
> ```

> [!NOTE]- 문제: 계정 잠금 해제
> ```SQL
> ALTER USER 유저명 ACCOUNT UNLOCK;
> ```

> [!NOTE]- 문제: 시스템 권한 부여 (접속, 생성 등)
> ```SQL
> GRANT 시스템권한 TO 유저명 [WITH ADMIN OPTION];
> ```

> [!NOTE]- 문제: 객체 권한 부여 (테이블 조회, 수정 등)
> ```SQL
> GRANT 객체권한 ON 객체명 TO 유저명 [WITH GRANT OPTION];
> ```

> [!NOTE]- 문제: 권한 회수
> ```SQL
> REVOKE 권한 FROM 유저명;
> -- 객체 권한 회수 시: REVOKE 객체권한 ON 객체명 FROM 유저명;
> ```

> [!NOTE]- 문제: 타 계정 객체 조회
> ```SQL
> SELECT * FROM 소유자명.테이블명;
> ```

> [!NOTE]- 문제: 롤 생성
> ```SQL
> CREATE ROLE 롤이름;
> ```

> [!NOTE]- 문제: 롤에 권한 추가
> ```SQL
> GRANT 권한 TO 롤이름;
> ```

> [!NOTE]- 문제: 사용자에게 롤 부여
> ```SQL
> GRANT 롤이름 TO 유저명;
> ```

> [!NOTE]- 문제: 권한/롤 확인 (데이터 사전)
>
>```sql
> -- 롤이 가진 테이블 권한 확인
> SELECT * FROM DBA_TAB_PRIVS WHERE grantee = 'TEAM1';
> 
> -- 사용자가 가진 롤 확인
> SELECT * FROM DBA_ROLE_PRIVS WHERE grantee = 'USER1';
> 
> -- HR이 남에게 부여한 테이블 권한 확인
> SELECT * FROM DBA_TAB_PRIVS WHERE grantor = 'HR';
> ```
>

---

# 📘 Chapter 9: 감사(Audit) 및 암호화

> [!NOTE]- 문제: 감사 기능 활성화 (확장 모드)
> ```SQL
> ALTER SYSTEM SET AUDIT_TRAIL=DB,EXTENDED SCOPE=SPFILE;
> -- (설정 후 DB 재시작 필요)
> SHUTDOWN IMMEDIATE;
> STARTUP;
> ```

> [!NOTE]- 문제: 감사 설정 (로그인 실패 감시)
> ```SQL
> AUDIT SESSION WHENEVER NOT SUCCESSFUL;
> -- AUDIT [이벤트] [BY 사용자] WHENEVER [SUCCESSFUL | NOT SUCCESSFUL];
> ```

> [!NOTE]- 문제: 감사 설정 (특정 객체 감시)
> ```SQL
> AUDIT 명령어 ON 소유자명.객체명 BY 유저명;
> -- 예: AUDIT SELECT ON user2.EMPLOYEES BY user1;
> ```

> [!NOTE]- 문제: 감사 로그 조회 (필수 암기 뷰)
> ```SQL
> SELECT * FROM DBA_AUDIT_TRAIL;
> ```

> [!NOTE]- 문제: 감사 해제
> ```SQL
> NOAUDIT SESSION;
> --특정 테이블 감사 해제
> NOAUDIT 명령어 ON 소유자명.테이블명;
> ```

> [!NOTE]- 문제: 암호화 함수 (패키지)
> ```SQL
> DBMS_CRYPTO.encrypt(
>     src => UTL_RAW.cast_to_raw(평문),
>     typ => DBMS_CRYPTO.encrypt_aes256 + …,
>     key => 키값
> )
> ```

> [!NOTE]- 문제: 저장 컬럼 타입
>
> - **`RAW`**
> - 문자열은 Hex이다

요청하신 대로 **Chapter 7 심화(로그 기록)**와 **Chapter 10 종합 실습** 내용을 **실제 실습 코드(영어 변수명)**로 복원하여 콜아웃 형식으로 정리해 드립니다.

---

# 📘 Chapter 7 심화: 트리거 기반 감사 로그(FGA 대체) 구현

> [!NOTE]- 문제: 감사 로그용 시퀀스 및 테이블 생성 (`audit_log`)
> ```SQL
> -- 1) 시퀀스 생성
> CREATE SEQUENCE audit_log_seq
> START WITH 1
> INCREMENT BY 1
> NOCACHE
> NOCYCLE;
> -- 2) 감사 로그 테이블 생성
> CREATE TABLE audit_log (
> log_id NUMBER PRIMARY KEY,
> username VARCHAR2(50), -- 변경한 사용자
> access_time DATE, -- 변경 일시
> action_type VARCHAR2(10), -- 동작 유형 (INSERT/UPDATE/DELETE)
> accessed_col VARCHAR2(50), -- 접근한 컬럼명
> accessed_data VARCHAR2(200) -- 변경 내용
> );

> [!NOTE]- 문제: 로그 ID 자동 입력 트리거 (trg_audit_log_id)
>
> 목표: audit_log에 데이터가 들어올 때 시퀀스 값을 자동으로 할당
> ```SQL
> CREATE OR REPLACE TRIGGER trg_audit_log_id
> BEFORE INSERT ON audit_log
> FOR EACH ROW
> BEGIN
>     :NEW.log_id := audit_log_seq.NEXTVAL;
> END;
> /
> ```

> [!NOTE]- 문제: 민감 정보(SSN) 변경 감시 트리거 (trg_audit_ssn_update)
>
> 목표: employee2 테이블의 ssn 컬럼이 변경될 때 이전 값과 새 값을 기록
> ```SQL
> CREATE OR REPLACE TRIGGER trg_audit_ssn_update
> AFTER UPDATE OF ssn ON employee2
> FOR EACH ROW
> BEGIN
>     INSERT INTO audit_log (username, access_time, action_type, accessed_col, accessed_data)
>     VALUES (USER, SYSDATE, 'UPDATE', 'SSN', :OLD.ssn || ' -> ' || :NEW.ssn);
> END;
> /
> ```

> [!NOTE]- 문제: 조건부 감시 트리거 - 급여 10000 초과 시 (trg_audit_salary_update)
>
> 목표: salary가 10000을 초과하는 값으로 변경될 때만 기록 (WHEN 절 사용)
> ```SQL
> CREATE OR REPLACE TRIGGER trg_audit_salary_update
> AFTER UPDATE OF salary ON employee2
> FOR EACH ROW
> WHEN (NEW.salary > 10000)  -- 주의: 콜론(:) 없이 변수명만 사용
> BEGIN
>     INSERT INTO audit_log (username, access_time, action_type, accessed_col, accessed_data)
>     VALUES (USER, SYSDATE, 'UPDATE', 'SALARY', :OLD.salary || ' -> ' || :NEW.salary);
> END;
> /
> ```

---

# 📘 Chapter 7: 고급 DB 오브젝트 (누락된 실습)

> [!NOTE]- 문제: 변경 전 데이터를 기록하는 백업 트리거 구현 (7-1)
>
> 시나리오: userTBL에서 수정/삭제 발생 시 backup_userTBL에 로그를 남기는 트리거 작성
> ```SQL
> CREATE OR REPLACE TRIGGER trg_user_backup
>     AFTER UPDATE OR DELETE ON userTBL
>     FOR EACH ROW
> DECLARE
>     v_modeType VARCHAR2(10);
> BEGIN
>     IF UPDATING THEN
>         v_modeType := '수정';
>     ELSIF DELETING THEN
>         v_modeType := '삭제';
>     END IF;
>     
> INSERT INTO backup_userTBL (userID, userName, modType, modDate, modUser)
> VALUES (:OLD.userID, :OLD.userName, v_modeType, SYSDATE, USER);
> END;
> /
> ```

> [!NOTE]- 문제: 본인 정보만 수정/삭제 가능하도록 제한하는 트리거 (7-2)
>
> 시나리오: employee2 테이블에서 로그인한 유저(USER)와 데이터의 주인(login_id)이 다르면 에러 발생
> ```SQL
> CREATE OR REPLACE TRIGGER trg_emp_self_update
>     BEFORE UPDATE OR DELETE ON employee2
>     FOR EACH ROW
> BEGIN
>     IF USER <> :OLD.login_id THEN
>         RAISE_APPLICATION_ERROR(-20001, '자신의 정보만 수정할 수 있습니다.');
>     END IF;
> END;
> /
> ```

> [!NOTE]- 문제: 보안/성능 인덱스 실습 코드 (7-3)
>
> 시나리오: 주민번호 앞 6자리(생년월일) 함수 기반 인덱스와 리버스 키 인덱스 생성
> ```SQL
> -- 1) 함수 기반 인덱스 (생년월일 검색 최적화)
> CREATE INDEX idx_cust_ssn_prefix
> ON customer(SUBSTR(ssn, 1, 6));
> -- 2) 부분 인덱스 (전화번호 있는 사람만)
> 
> CREATE INDEX idx_cust_phone_valid
> ON customer(phone)
> WHERE phone IS NOT NULL;
> -- 3) 리버스 키 인덱스 (키 분산)
> CREATE INDEX idx_cust_id_reverse
> ON customer(cust_id) REVERSE;
> ```
---

# 📚 Chapter 8: 보안 관리 실무 (누락된 실습)

> [!NOTE]- 문제: 자원(Resource) 제한 프로파일 생성 및 적용 (8-3)
>
> 시나리오: CPU 사용량과 접속 시간을 제한하는 prof_resource 프로파일 생성
> ```SQL
> -- 1) 자원 제한 기능 활성화 (필수)
> ALTER SYSTEM SET RESOURCE_LIMIT = true;
> -- 2) 프로파일 생성
> CREATE PROFILE prof_resource LIMIT
> CPU_PER_SESSION 1500 -- CPU 15초 제한
> CONNECT_TIME 480 -- 접속 8시간 제한
> IDLE_TIME 15; -- 15분 유휴 시 접속 종료
> -- 3) 적용
> ALTER USER salesman_1 PROFILE prof_resource;
> ```

> [!NOTE]- 문제: 팀(Team) 롤 생성 및 권한 부여 (8-5)
>
> 시나리오: team1 롤을 만들어 HR 테이블 권한을 주고, 이를 여러 유저에게 일괄 부여
> ```SQL
> -- 1) 롤 생성
> CREATE ROLE team1;
> -- 2) 롤에 권한 부여 (HR 계정 등에서 수행)
> GRANT SELECT, INSERT, UPDATE ON hr.employees TO team1;
> GRANT SELECT ON hr.departments TO team1;
> -- 3) 유저에게 롤 부여 (관리자 수행)
> GRANT team1 TO user1, user2, user3;
> ```
---

# 🔐 Chapter 9: 암호화 심화 (누락된 실습)

> [!NOTE]- 문제: AES256 암호화/복호화 함수 구현 (9-2)
>
> 시나리오: DBMS_CRYPTO 패키지를 사용하여 encrypt_aes와 decrypt_aes 함수 생성
> ```SQL
> -- 1) 암호화 함수
> CREATE OR REPLACE FUNCTION encrypt_aes(p_plain IN VARCHAR2) RETURN RAW IS
>     l_key RAW(32) := UTL_RAW.cast_to_raw('01234567890123456789012345678901');
> BEGIN
>     IF p_plain IS NULL THEN RETURN NULL; END IF;
>     RETURN DBMS_CRYPTO.encrypt(
>         src => UTL_RAW.cast_to_raw(p_plain),
>         typ => DBMS_CRYPTO.encrypt_aes256 + DBMS_CRYPTO.chain_cbc + DBMS_CRYPTO.pad_pkcs5,
>         key => l_key
>     );
> END;
> /
>
> -- 2) 복호화 함수
> CREATE OR REPLACE FUNCTION decrypt_aes(p_raw IN RAW) RETURN VARCHAR2 IS
> l_key RAW(32) := UTL_RAW.cast_to_raw('01234567890123456789012345678901');
> BEGIN
> IF p_raw IS NULL THEN RETURN NULL; END IF;
> RETURN UTL_RAW.cast_to_varchar2(
> DBMS_CRYPTO.decrypt(
> src => p_raw,
> typ => DBMS_CRYPTO.encrypt_aes256 + DBMS_CRYPTO.chain_cbc + DBMS_CRYPTO.pad_pkcs5,
> key => l_key
> )
> );
> END;
> /
> ```

> [!NOTE]- 문제: 트리거를 이용한 자동 암호화/복호화 시스템 구축 (9-3)
>
> 시나리오: secure_table2에 데이터 입력 시 자동으로 16진수(HEX)로 암호화하여 저장하고, 뷰를 통해 자동 복호화
> ```SQL
> -- 1) 자동 암호화 트리거 (INSERT/UPDATE 시 동작)
> CREATE OR REPLACE TRIGGER trg_encrypt_ssn
> BEFORE INSERT OR UPDATE ON secure_table2
> FOR EACH ROW
> BEGIN
>     IF :NEW.ssn_raw IS NOT NULL THEN
>         -- encrypt_aes 결과를 16진수 문자열로 변환하여 저장
>         :NEW.ssn_raw := RAWTOHEX(encrypt_aes(:NEW.ssn_raw));
>     END IF;
> END;
> /
> -- 2) HEX 복호화 래퍼 함수
> 
> CREATE OR REPLACE FUNCTION decrypt_aes_hex(p_hex IN VARCHAR2) RETURN VARCHAR2 IS
> BEGIN
> IF p_hex IS NULL THEN RETURN NULL; END IF;
> -- 16진수 문자열 -> RAW -> 복호화
> RETURN decrypt_aes(HEXTORAW(p_hex));
> END;
> /
> -- 3) 자동 복호화 뷰
> 
> CREATE OR REPLACE VIEW secure_table_v AS
> 
> SELECT id, name, decrypt_aes_hex(ssn_raw) AS ssn
> 
> FROM secure_table2;
> ```



# 🎯 실전 예상 문제 (유형별)

교수님의 출제 스타일(단답형, 괄호 채우기, 서술형, 설계)을 반영한 예상 문제입니다. 스스로 답을 적어보세요.

## [제1영역] 단답형 & 괄호 채우기

Q1. 다음 빈칸에 알맞은 PL/SQL 키워드를 작성하시오.

트리거 작성 시, 변경된 각 행(Row)마다 트리거가 실행되도록 하기 위해 ( A ) 옵션을 사용해야 하며, 변경 전의 기존 데이터를 참조하기 위해서는 ( B ) 변수를 사용한다.

- **답:** A: `FOR EACH ROW`, B: `:OLD`
    

Q2. 다음 설명에 해당하는 오라클의 기본 롤(Role) 이름을 쓰시오.

사용자가 데이터베이스에 접속(Login)하기 위해 가장 기본적으로 필요한 권한(CREATE SESSION 등)을 묶어 놓은 롤이다.

- **답:** `CONNECT`
    

**Q3. 감사(Audit) 로그를 확인하기 위해 조회해야 하는 시스템 뷰(View)의 이름은 무엇인가?**

- **답:** `DBA_AUDIT_TRAIL`
    

**Q4. 사용자 `student`의 계정이 로그인 실패 횟수 초과로 잠겼다. 관리자가 이를 해제하기 위한 명령어를 작성하시오.**

- **답:** `ALTER USER student ACCOUNT UNLOCK;`
    

---

## [제2영역] SQL 작성 및 서술형 (보안 코딩)

**Q5. [트리거 작성] 다음 조건에 맞는 트리거를 작성하시오.**

- **트리거 명:** `trg_audit_emp`
- **조건:** `employees` 테이블의 데이터가 **수정(UPDATE)**되거나 **삭제(DELETE)**될 때 작동
- **동작:** `audit_emp` 테이블에 수정 전 사번(`emp_id`), 이름(`name`), 그리고 작업을 수행한 사용자명(`USER`)과 날짜(`SYSDATE`)를 저장.
    

**[모범 답안]**

```SQL
CREATE OR REPLACE TRIGGER trg_audit_emp
    AFTER UPDATE OR DELETE ON employees
    FOR EACH ROW
BEGIN
    INSERT INTO audit_emp (emp_id, name, mod_user, mod_date)
    VALUES (:OLD.emp_id, :OLD.name, USER, SYSDATE);
END;
/
```

**Q6. [뷰 작성] 보안을 위한 뷰 생성 SQL을 작성하시오.**

- **원본 테이블:** `member (id, name, ssn, phone)`
- **요구사항:** `ssn`(주민번호) 컬럼은 제외하고 나머지 정보만 조회할 수 있는 뷰 `vw_member_safe`를 생성하시오.
    

**[모범 답안]**

```SQL
CREATE OR REPLACE VIEW vw_member_safe AS
SELECT id, name, phone
FROM member;
```

**Q7. 암호화된 데이터를 저장하기 위해 테이블 설계 시 문자열 타입(`VARCHAR2`) 대신 사용해야 하는 오라클의 데이터 타입은 무엇인가?**

- **답:** `RAW`
    

---

## [제3영역] 데이터 모델링 (DB 설계)

Q8. 다음 [쇼핑몰 주문 시스템] 시나리오를 보고 물리적 테이블 설계(명세서)를 작성하시오.

(※ 실제 시험에서는 그림을 그리거나 표를 채우는 형식일 가능성이 높습니다)

> [시나리오]
>
> 우리 쇼핑몰은 회원이 상품을 구매하는 시스템이다.
>
> 1. **회원(UserTBL)**은 아이디, 이름, 주소, 전화번호를 가진다. 아이디는 중복될 수 없다.
>     
> 2. **구매(BuyTBL)**는 어떤 회원이 어떤 상품을 샀는지 기록한다.
>     
> 3. 구매 테이블에는 순번(자동증가), 구매한 회원아이디, 상품명, 가격, 수량이 기록되어야 한다.
>     
> 4. 한 명의 회원은 여러 번 구매할 수 있다.
>     

**[작성 포인트]**

1. **테이블 분리:** `UserTBL`과 `BuyTBL`로 나눈다.
2. **PK 설정:** `UserTBL`의 PK는 `아이디`, `BuyTBL`의 PK는 `순번`.
3. **FK 설정:** `BuyTBL`의 `회원아이디`는 `UserTBL`의 `아이디`를 참조하는 외래키(FK)이다.
4. **데이터 타입:** 이름/주소는 `NCHAR` 혹은 `NVARCHAR2`, 가격/수량은 `NUMBER`로 설정.
    

**[예시 답안 - 테이블 명세서]**

1. 회원 테이블 (UserTBL)

| 컬럼명      | 데이터 타입        | 제약조건         | 비고     |
| :------- | :------------ | :----------- | :----- |
| userID   | CHAR(8)       | PK, NOT NULL | 회원 아이디 |
| userName | NVARCHAR2(10) | NOT NULL     | 이름     |
| addr     | NVARCHAR2(50) |              | 주소     |
| mobile   | VARCHAR2(13)  |              | 전화번호   |

1. 구매 테이블 (BuyTBL)

| 컬럼명      | 데이터 타입        | 제약조건         | 비고               |
| :------- | :------------ | :----------- | :--------------- |
| seq      | NUMBER        | PK, NOT NULL | 순번               |
| userID   | CHAR(8)       | FK, NOT NULL | 구매자 (UserTBL 참조) |
| prodName | NVARCHAR2(20) | NOT NULL     | 상품명              |
| price    | NUMBER        |              | 가격               |
| amount   | NUMBER        |              | 수량               |

---
