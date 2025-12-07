---
type: 생각조각
status: inbox
source:
creation_date: 2025-11-25
---

---

### **2. 프로파일(Profile)을 이용한 보안 관리**

사용자의 **비밀번호 정책**이나 **시스템 자원 사용**을 제한하기 위해 프로파일을 생성하고 적용합니다.

|**정책 구분**|**파라미터**|**설명**|
|---|---|---|
|**패스워드 정책**|`FAILED_LOGIN_ATTEMPTS`|로그인 n회 실패 시 계정 잠금 .|
||`PASSWORD_LOCK_TIME`|계정이 잠겼을 때 잠금 지속 시간(일 단위) .|
||`PASSWORD_LIFE_TIME`|암호 유효 기간(만료일) 설정 .|
||`PASSWORD_REUSE_TIME`|동일한 암호를 다시 사용할 수 없는 기간 .|
|**리소스 정책**|`IDLE_TIME`|지정한 시간 동안 활동이 없으면 세션 강제 종료 .|
||`SESSIONS_PER_USER`|한 계정으로 동시 접속 가능한 세션 수 제한 .|

#### **1) 비밀번호 프로파일 (Password Profile)**

로그인 실패 횟수 제한, 비밀번호 만료 기간 등을 설정합니다.

- **실습 예제:**

    ```SQL
    CREATE PROFILE prof_passwd LIMIT
      FAILED_LOGIN_ATTEMPTS 5    -- 5회 실패 시 계정 잠금
      PASSWORD_LOCK_TIME 30      -- 30일간 잠금 유지
      PASSWORD_LIFE_TIME 40      -- 비밀번호 40일마다 변경
      PASSWORD_REUSE_TIME 50;    -- 50일간 동일 암호 재사용 불가
    ```
    

#### **2) 자원 관리 프로파일 (Resource Profile)**

CPU 사용 시간, 접속 유지 시간 등을 제한합니다. (사전 작업 필수)

- **실습 예제:**

    ```SQL
    -- 0. 자원 제한 기능 활성화 (필수)
    ALTER SYSTEM SET RESOURCE_LIMIT = true;
    
    -- 1. 자원 프로파일 생성
    CREATE PROFILE prof_resource LIMIT
      CPU_PER_SESSION 1500       -- CPU 연속 사용 15초 제한
      CONNECT_TIME 480           -- 하루 접속 8시간 제한
      IDLE_TIME 15;              -- 15분간 활동 없으면 연결 끊기
	-- 2. 사용자에게 프로파일 적용
	ALTER USER 유저명 PROFILE 프로파일명;
	
	-- 3. 잠긴 계정 해제 (관리자 권한)
	ALTER USER 유저명 ACCOUNT UNLOCK; -- [시험 출제 유력]
    ```
    

#### **3) 사용자에게 프로파일 적용 및 조회**

- **적용:** `ALTER USER 계정명 PROFILE 프로파일명;`
- **조회:**

    ```SQL
    SELECT username, profile FROM dba_users WHERE username = 'HR';
    ```
    
- **삭제:** `DROP PROFILE 프로파일명 CASCADE;` (사용 중인 프로파일 삭제 시 `CASCADE` 필수)
    

---

### **3. 관리자 계정과 권한(Privilege)의 분류**

실습 전 알아야 할 핵심 계정 및 권한 개념입니다.

- **관리자 계정:**
    - **SYS:** DB 생성/삭제가 가능한 최상위 권한자 (Data Dictionary 소유).
    - **SYSTEM:** DB 생성/삭제를 제외한 일반적인 관리자.
- **권한(Privilege)의 종류:**
    - **시스템 권한 (System Privilege):** DB 수준의 작업 (예: `CREATE SESSION`, `CREATE TABLE`).
    - **오브젝트 권한 (Object Privilege):** 특정 객체 조작 (예: `SELECT ON HR.EMPLOYEES`).
 - **※참고:** `SYSDBA`는 계정이 아니라, 강력한 권한들을 묶어놓은 **역할(Role)**의 이름입니다.

---

### **4. 권한(Privilege) 관리: GRANT & REVOKE**

계정만 생성해서는 아무것도 할 수 없습니다. **접속 권한**과 **테이블 사용 권한**을 부여해야 합니다.

#### **1) 시스템 권한 부여 (접속 및 객체 생성)**

관리자(`SYS`) 권한으로 로그인하여 수행합니다.

- **접속 권한 부여:**

    ```SQL
    -- 시스템 관리자로 접속
    CONN / AS SYSDBA;
    
    -- HR 계정 잠금 해제 및 비밀번호 변경
    ALTER USER hr ACCOUNT UNLOCK IDENTIFIED BY 1234;
    
    -- salesman_1에게 DB 접속 권한(CONNECT) 부여
    GRANT CONNECT TO salesman_1;
    ```
    
- **테이블 생성 권한 부여:**

    ```SQL
    GRANT CREATE TABLE TO salesman_1;
    ```
    
- 권한 재부여 옵션 (WITH ADMIN OPTION):
    
    권한을 받은 사용자가 다른 사용자에게도 그 권한을 줄 수 있게 설정합니다.

    ```SQL
    -- HR에게 뷰 생성 권한을 주면서, 남에게도 줄 수 있는 권한 포함
    GRANT CREATE VIEW TO HR WITH ADMIN OPTION;
    ```
- **:** A가 B에게 권한을 주고(줄 수 있는 권한 포함), B가 C에게 권한을 줬을 때, A가 B의 권한을 뺏으면 C는 어떻게 되는가? (정답: 같이 뺏김)

#### **2) 오브젝트 권한 부여 (테이블 공유)**

`HR` 계정이 소유한 테이블을 `salesman_1`이 볼 수 있게 허용하는 실습입니다.

- **실습 예제 (HR 계정에서 수행):**

    ```SQL
    -- 테이블 소유자인 HR 계정으로 접속
    CONN hr/1234;
    
    -- salesman_1에게 employees 테이블 조회(SELECT), 입력(INSERT) 권한 부여
    GRANT SELECT, INSERT ON EMPLOYEES TO salesman_1;
    
    -- salesman_1에게 departments 테이블 조회(SELECT) 권한 부여
    GRANT SELECT ON DEPARTMENTS TO salesman_1;
    ```
    

#### **3) 타 계정 테이블 조회 (스키마 개념)**

권한을 받았더라도 테이블 소유자를 명시하지 않으면 오류가 발생합니다.

- **올바른 조회 방법:**
    
    ```SQL
    -- (salesman_1 계정으로 접속 후 실행)
    -- SELECT * FROM DEPARTMENTS; (X) -> "테이블이 존재하지 않습니다" 오류
    SELECT * FROM hr.DEPARTMENTS; -- (O) 소유자(hr)를 명시해야 함
    ```

#### **4) [중요] 권한 부족 확인 (ORA-01031)**

조회 권한만 있고 수정 권한이 없을 때 발생하는 오류를 확인합니다.

```SQL
-- salesman_1은 DEPARTMENTS 테이블의 조회(SELECT) 권한만 있음
UPDATE hr.DEPARTMENTS SET LOCATION_ID = 1700 WHERE MANAGER_ID = 100;
-- 결과: ORA-01031: 권한이 불충분합니다
```

#### **5) 권한 회수 (REVOKE) 및 연쇄 회수**

부여했던 권한을 회수합니다.

- **기본 회수:**

    ```SQL
    -- salesman_1에게 주었던 EMPLOYEES 조회 권한 회수
    REVOKE SELECT ON EMPLOYEES FROM salesman_1;
    ```
    
- [중요] 연쇄 회수 (Cascading Revoke):
    
    A가 B에게 WITH GRANT OPTION으로 권한을 주고, B가 다시 C에게 권한을 줬을 때, A가 B의 권한을 회수하면 C의 권한도 자동으로 함께 회수됩니다.
    

---

### **5. 롤(Role)을 이용한 효율적 관리**

다수의 사용자에게 매번 일일이 권한을 주는 것은 비효율적이므로, **'롤(역할)'**을 만들어 권한을 묶어 관리합니다.

#### **실습 시나리오**

개발팀(`team1`) 롤을 만들고, 4명의 개발자(`user1`~`user4`)에게 `HR` 테이블 접근 권한을 한 번에 부여합니다.

**Step 1. 사용자 및 롤 생성 (관리자 수행)**

```SQL
-- 시스템 관리자 접속
CONN / AS SYSDBA;

-- 사용자 생성
CREATE USER user1 IDENTIFIED BY 1234;
-- … (user2 ~ user4 동일하게 생성)

-- 롤(Role) 생성
CREATE ROLE team1;
```

**Step 2. 롤에 권한 부여 (객체 소유자 수행)**

```SQL
-- (HR 계정 실행)
-- team1 역할에 EMPLOYEES(조회,입력,수정) 및 DEPARTMENTS(조회) 권한 부여
GRANT SELECT, INSERT, UPDATE ON hr.EMPLOYEES TO team1;
GRANT SELECT ON hr.DEPARTMENTS TO team1;
```

**Step 3. 사용자에게 롤 부여 (관리자 수행)**

```SQL
-- (관리자 계정 실행)
-- user1 ~ user4에게 team1 역할을 부여 (한 번에 권한 할당 완료)
GRANT team1 TO user1, user2, user3, user4;
```

Step 4. 특정 사용자에게 추가 권한 부여

롤로 공통 권한을 주고, 특정인(user1)에게만 특별한 권한을 추가로 줍니다.

```SQL
-- user1에게만 DEPARTMENTS 테이블 입력/수정 권한 추가 부여
GRANT INSERT, UPDATE ON hr.DEPARTMENTS TO user1;
```

---

### **6. 권한 및 롤 확인 (Data Dictionary)**

시스템 뷰를 통해 권한 부여 상태를 확인합니다.

- **시스템 권한 확인:** `DBA_SYS_PRIVS`
- **테이블(오브젝트) 권한 확인:** `DBA_TAB_PRIVS`
- **롤(Role) 부여 확인:** `DBA_ROLE_PRIVS`
    

**실습 예제:**

```SQL
-- TEAM1 롤이 가진 테이블 권한 확인
SELECT * FROM DBA_TAB_PRIVS WHERE grantee = 'TEAM1';

-- USER1이 가진 롤 확인
SELECT * FROM DBA_ROLE_PRIVS WHERE grantee = 'USER1';

-- HR 계정이 남에게 부여한(grantor='HR') 테이블 권한 확인
SELECT * FROM DBA_TAB_PRIVS WHERE grantor = 'HR';

-- 결과 예시:
-- GRANTEE(받은사람) | TABLE_NAME(테이블) | PRIVILEGE(권한)
-- SALESMAN_1       | EMPLOYEES         | SELECT
-- SALESMAN_1       | EMPLOYEES         | INSERT
```

**롤 삭제:**

```SQL
DROP ROLE team1;
```
