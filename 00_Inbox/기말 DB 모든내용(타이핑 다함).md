---
type: 생각조각
status: inbox
source:
creation_date: 2025-11-25
---

### 1. Virtual Private Database (VPD)

VPD는 오라클 엔터프라이즈 에디션에서 제공하는 강력한 보안 기능으로, 사용자가 별도의 `WHERE` 절을 입력하지 않아도 DB가 자동으로 보안 조건을 추가하여 데이터를 필터링하는 기술입니다.

#### **1) 핵심 개념**

- **행 단위 보안 (Row-Level Security):** 뷰(View)보다 강력하고 유연하며, 로그인한 사용자에 따라 자신이 접근 가능한 행(Row)만 조회/수정하도록 제한합니다.
- **동작 원리:** 사용자가 SQL(`SELECT * FROM employee`)을 실행하면, DBMS가 정책 함수(Policy Function)를 통해 자동으로 `WHERE` 조건을 덧붙여 실행합니다
    - _변환 예시:_ `SELECT * FROM employee` → `SELECT * FROM employee WHERE login_id = 'EMP_1001'`
        

#### **2) 구현 요소**

- **정책 함수 (Policy Function):** 현재 사용자(SESSION)에 따라 어떤 조건(Predicate)을 적용할지 결정하는 함수입니다
    - _예:_ 관리자('TEST')는 `1=1`(전체 조회), 일반 직원은 `login_id = USER`(본인만 조회) 반환
- **DBMS_RLS 패키지:** VPD 정책을 관리하는 패키지로, `ADD_POLICY` 프로시저를 통해 테이블에 정책을 등록합니다
    

#### **3) 제약 사항 및 주의점**

- **에디션 제한:** Oracle XE(Express Edition)나 SE(Standard Edition)에서는 사용할 수 없으며, Enterprise Edition 19c 이상에서만 가능합니다
- **주의사항:** 정책 함수가 복잡하면 성능 저하가 발생할 수 있으며, 자동으로 조건이 붙기 때문에 디버깅이 어려울 수 있습니다
    

---

### 2. View와 Trigger를 활용한 VPD 대체 구현 [44p ~ 49p]

Oracle XE와 같이 VPD를 사용할 수 없는 환경에서는 **View(조회 제한)**와 **Trigger(수정 제한)**를 조합하여 유사한 보안 효과를 낼 수 있습니다.

#### **1) 구현 전략**

VPD가 자동으로 하던 일을 **수동으로 분리**하여 구현합니다.

- **조회(SELECT) 제어:** 사용자별 맞춤형 **View** 생성
- **수정(UPDATE/DELETE) 제어:** **Trigger**를 사용하여 권한 검증
    

#### **2) 단계별 상세 구현**

Step 1: 사용자별 맞춤형 View 생성 (접근 제어)

사용자의 역할에 따라 서로 다른 뷰를 제공하여 데이터 노출을 최소화합니다.

- 일반 직원용 (본인 정보만 조회):
    
    USER 함수를 사용하여 현재 로그인한 사용자의 ID와 일치하는 데이터만 보여주는 뷰를 생성합니다.
    
    ```SQL
    CREATE OR REPLACE VIEW vw_my_profile AS
    SELECT * FROM employee2
    WHERE login_id = USER; -- 로그인한 사용자의 데이터만 조회 [cite: 853, 854, 855]
    ```
    
- 인사팀용 (민감 정보 제외):
    
    주민번호(SSN) 같은 민감 컬럼을 제외하고 나머지 정보를 조회하는 뷰를 생성합니다
    
- 관리자용 (전체 조회):
    
    모든 데이터에 접근 가능한 뷰를 생성합니다12.
    

Step 3: 권한 부여

테이블에 대한 직접 접근 권한(SELECT 등)은 회수하고, 위에서 만든 View에 대해서만 권한(GRANT SELECT)을 부여합니다13.

Step 4: Trigger를 통한 수정 제한

뷰를 통해 데이터를 조회하더라도, 직접적인 SQL 조작을 통한 데이터 변조를 막기 위해 트리거를 사용합니다.

- 수정/삭제 제한 트리거:
    
    BEFORE UPDATE OR DELETE 트리거를 생성하여, 본인의 데이터가 아닌 경우 에러를 발생시킵니다.
    
    ```SQL
    IF USER <> :OLD.login_id THEN
        RAISE_APPLICATION_ERROR(-20001, '자신의 정보만 수정하거나 삭제할 수 있습니다.');
    END IF; -- [cite: 871, 872]
    ```
    

---

### **요약 및 비교**

|**구분**|**VPD (Enterprise)**|**View + Trigger (XE 대체)**|
|---|---|---|
|**적용 방식**|정책 함수에 의해 SQL 실행 시 **자동** 적용|개발자가 **명시적**으로 뷰와 트리거를 생성|
|**보안 수준**|DB 커널 레벨에서 강제 적용 (매우 강력)|애플리케이션 레벨에서 뷰 사용을 강제해야 함|
|**장점**|SQL 수정 없이 일괄 보안 적용 가능|모든 에디션에서 구현 가능|
|**단점**|설정이 복잡하고 디버깅이 어려움|뷰와 트리거를 사용자/역할별로 일일이 관리해야 함|


사용자님께서 요청하신 **PDF 44~49페이지**에 해당하는 **VPD 대체 구현(View + Trigger)** 실습 코드를 단계별로 완벽하게 정리해 드립니다.

이 코드는 Oracle XE 버전과 같이 정식 VPD 기능을 사용할 수 없는 환경에서 **보안 뷰(View)**로 조회 권한을 제어하고, **트리거(Trigger)**로 수정 권한을 제어하여 행 단위 보안(Row-Level Security)을 구현하는 전체 과정입니다.

---

### **1단계: 실습용 계정 및 권한 생성**

작업 위치: 관리자 계정 (SYSTEM 또는 SYSDBA)

기존 계정을 정리하고, 역할별(인사팀, 일반직원, 관리자) 계정을 새로 생성합니다1.

SQL

```Java
-- 1. 기존 계정이 있다면 삭제 (초기화)
DROP USER HR_USER CASCADE;
DROP USER EMP_1001 CASCADE;
DROP USER ADMIN_USER CASCADE; 
-- [cite: 829, 830, 831]

-- 2. 계정 생성 (비밀번호: 1234)
CREATE USER HR_USER IDENTIFIED BY 1234 ACCOUNT UNLOCK;
CREATE USER EMP_1001 IDENTIFIED BY 1234 ACCOUNT UNLOCK;
CREATE USER ADMIN_USER IDENTIFIED BY 1234 ACCOUNT UNLOCK; 
-- [cite: 833, 834]

-- 3. 기본 접속 권한 부여
GRANT CONNECT TO HR_USER;
GRANT CONNECT TO EMP_1001;
GRANT CONNECT TO ADMIN_USER; 
-- [cite: 836, 837, 838]
```

---

### **2단계: 테이블 생성 및 데이터 준비**

작업 위치: TEST 계정 (테이블 소유자)

보안 대상이 될 원본 테이블을 만들고 샘플 데이터를 입력합니다2.

SQL

```Java
-- TEST 계정으로 접속
-- CONNECT TEST/1234;  -- [cite: 842]

-- 1. 테이블 생성
CREATE TABLE employee2 (
    emp_id NUMBER PRIMARY KEY,
    name VARCHAR2(100),
    department VARCHAR2(50),
    salary NUMBER,
    ssn VARCHAR2(20),       -- 민감 정보 (주민번호)
    login_id VARCHAR2(50)   -- 로그인한 사용자 ID와 매핑될 컬럼
); 
-- [cite: 844, 845, 846]

-- 2. 샘플 데이터 삽입
INSERT INTO employee2 VALUES (1001, '홍길동', '인사팀', 5000, '900101-1234567', 'EMP_1001');
INSERT INTO employee2 VALUES (1002, '김철수', '영업팀', 4800, '910202-2345678', 'EMP_1002');
INSERT INTO employee2 VALUES (1003, '이영희', '인사팀', 5500, '880303-3456789', 'EMP_1003');
INSERT INTO employee2 VALUES (1004, '관리자', '관리부', 8000, '850404-4567890', 'ADMIN_USER');
COMMIT; 
-- [cite: 848, 849, 850]
```

---

### **3단계: 사용자별 맞춤형 뷰(View) 생성 (조회 보안)**

작업 위치: TEST 계정

사용자의 역할에 따라 데이터를 다르게 보여주는 뷰를 생성합니다3.

SQL

```Java
-- 1. 일반 직원용 뷰 (자신의 정보만 조회 가능)
-- 조건: login_id가 현재 접속자(USER)와 같은 행만 필터링
CREATE OR REPLACE VIEW vw_my_profile AS
SELECT * FROM employee2
WHERE login_id = USER; 
-- [cite: 853, 854, 855]

-- 2. 인사팀용 뷰 (모든 직원 조회 가능, 단 주민번호 제외)
-- 조건: ssn 컬럼을 SELECT 절에서 제외
CREATE OR REPLACE VIEW vw_hr_view AS
SELECT emp_id, name, department, salary 
FROM employee2; 
-- [cite: 857, 858]

-- 3. 관리자용 뷰 (모든 정보 조회 가능)
CREATE OR REPLACE VIEW vw_admin_view AS
SELECT * FROM employee2; 
-- [cite: 860, 861]
```

---

### **4단계: 뷰 접근 권한 부여**

작업 위치: TEST 계정

테이블에 직접 접근하지 못하게 하고, 위에서 만든 뷰를 통해서만 접근하도록 권한을 줍니다4.

SQL

```Java
-- 각 사용자에게 맞는 뷰에 대한 SELECT 권한 부여
GRANT SELECT ON vw_my_profile TO EMP_1001;
GRANT SELECT ON vw_hr_view TO HR_USER;
GRANT SELECT ON vw_admin_view TO ADMIN_USER; 
-- [cite: 863, 864]
```

---

### **5단계: 수정 제한 트리거 생성 (수정 보안)**

작업 위치: TEST 계정

뷰를 통해 데이터를 조회하더라도, SQL을 통해 타인의 데이터를 수정/삭제하는 것을 막기 위한 안전장치입니다5.

SQL

```Java
CREATE OR REPLACE TRIGGER trg_emp_self_update
BEFORE UPDATE OR DELETE ON employee2
FOR EACH ROW
BEGIN
    -- 현재 접속자(USER)가 데이터의 주인(OLD.login_id)과 다르면 에러 발생
    IF USER <> :OLD.login_id THEN
        RAISE_APPLICATION_ERROR(-20001, '자신의 정보만 수정하거나 삭제할 수 있습니다.');
    END IF;
END;
/ 
-- [cite: 867, 868, 869, 870, 871, 872, 873, 874]
```

---

### **6단계: 실습 테스트 (검증)**

작업 위치: 각 사용자 계정

각 계정으로 접속하여 보안 정책이 제대로 동작하는지 확인합니다6.

SQL

```Java
-- 1. 일반 직원 (EMP_1001) 접속 테스트
-- CONNECT EMP_1001/1234; [cite: 879]
SELECT * FROM TEST.vw_my_profile; 
-- 결과: 자신의 행(EMP_1001) 1건만 조회됨 [cite: 880]

-- 타인(1002)의 급여 수정 시도 -> 트리거에 의해 오류 발생해야 함
-- UPDATE TEST.employee2 SET salary = 6000 WHERE emp_id = 1002; [cite: 881]

-- 2. 인사팀 (HR_USER) 접속 테스트
-- CONNECT HR_USER/1234; [cite: 883]
SELECT * FROM TEST.vw_hr_view; 
-- 결과: 모든 직원이 조회되지만, 주민번호(ssn) 컬럼은 안 보임 [cite: 884]

-- 3. 관리자 (ADMIN_USER) 접속 테스트
-- CONNECT ADMIN_USER/1234; [cite: 886]
SELECT * FROM TEST.vw_admin_view; 
-- 결과: 주민번호를 포함한 모든 데이터 조회 가능 [cite: 887]
```

---

Next Step:

이 실습을 통해 조회 및 수정 권한 제어를 확인하셨습니다. 다음 단계로 "누가 언제 내 데이터를 조회하거나 수정했는지 기록하는 감사(Audit) 로그 기능 구현" (PDF 69페이지 내용) 코드를 정리해 드릴까요?
