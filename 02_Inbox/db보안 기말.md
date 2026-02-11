---
type: 생각조각
status: inbox
source: 
creation_date: 2025-12-07
---

> [!NOTE]- [시험범위]
>
> 7장 트리거/뷰/index : 개념 및 실습  
> 8장 DB관리보안실무(권한계정역할): 개념 및 실습  
> 9장 감사AUDIT/데이터암호화: 개념 및 실습  
> 10장 보안 총 실습문제(7~9장 실습내용정리)  
> - 사용자 계정 생성/권한부여및회수/ROLE 생성  
> - 비밀번호 정책 적용, 계정 잠금 확인, 특정 컬럼만 보이게 제한
> - 민감 데이터 마스킹, 감사(AUDIT)  
> 11장 DB설계(데이터모델링:요구분석, 물리설계(정보공학적표기/테이블명세서)) 11장은 한문제: 물리설계
> 
> * 10문제 내외  
> * 단답형, 서술형
> 
> ### 📚 시험 범위 및 내용
>
> **1. 7장: 고급 DB 오브젝트 (트리거, 뷰, 인덱스)**
>
> - **범위:** 중간고사 이후 부분인 **트리거(Trigger), 뷰(View), 인덱스(Index)**
> - **내용:** 개념 및 실습 내용 전체
>     
> 
> **2. 8장: DB 보안 관리 실무**
>
> - **내용:** 사용자 계정 생성, 권한 부여(**GRANT**), 권한 회수(**REVOKE**), 롤(**ROLE**) 생성 및 설정
> - **형식:** 개념 및 실습
>     
> 
> **3. 9장: 감사(Audit) 및 데이터 암호화**
>
> - **감사(Audit):** 실습 내용 포함
> - **데이터 암호화:** 실습 환경 문제로 **개념 위주** 출제 (빈칸 채우기 등)
>     
> 
> **4. 10장: 실습 총정리 (복습 챕터)**
>
> - 7~9장 실습 내용의 종합 (사용자 계정 설정, 비밀번호 정책, 계정 잠금/해제, 뷰/인덱스를 활용한 데이터 마스킹 등)
>     
> 
> **5. 11장: 데이터 모델링 (DB 설계)**
>
> - **유형:** 요구사항(시나리오)을 주면 그에 맞는 **테이블 설계** 하기
> - **핵심:**
>     - 테이블 명, 필드(열) 이름, 데이터 타입(숫자/문자 등), **Primary Key(PK)** 표시
>     - **물리적 설계(테이블 명세서)** 작성 능력 평가 (정보공학적 표기법, 네모난 박스로 표현하는 방식)
>     - _정정 사항:_ 논리적 설계 과정은 생략하고 **물리적 설계(테이블 명세서)** 위주로 출제됨.
>         
> 
> ### 🚫 시험 제외 대상
>
> - **12장 (DB 연동/Java):** 프로젝트 과제로 대체하므로 시험 범위 제외 (Insert, Update 등 자바 코딩 X)
> - **DDL 작성:** `CREATE TABLE` 같은 SQL 문장 작성 문제는 출제되지 않음 (설계 그림/명세서 작성까지만).
>     
> 
> ### 📝 시험 형식
>
> - **문항 수:** 약 10문제 내외 (각 문제별 서브 문제 있음)
> - **유형:** 단답형, 서술형, 공란 채우기 (중간고사와 유사한 패턴)
> - **특이사항:** 필요한 키워드는 일부 제공될 수 있음.
>     
> 
> ### 💡 교수님 팁
>
> - 실습을 잘 수행했고 기본 개념을 알고 있다면 어렵지 않음.
> - **DB 설계 문제(11장)**가 서브 문제로 확장되어 나올 가능성이 높음.

# 📝 기말고사 대비 핵심 요약 노트 (Cheat Sheet)

시험 직전, 이 페이지의 내용을 달달 외우고 들어가세요.

## 1. 문법 및 키워드 총정리

| **영역**        | **핵심 명령어/키워드**                       | **설명 및 주의사항**                                 |
| ------------- | ------------------------------------ | --------------------------------------------- |
| **계정 관리**     | `CREATE USER … IDENTIFIED BY …`      | 계정 생성                                         |
|               | `ALTER USER … ACCOUNT UNLOCK`        | **(중요)** 잠긴 계정 해제                             |
|               | `PROFILE`                            | 패스워드 실패 횟수 등 보안 정책 설정                         |
| **권한 관리**     | `GRANT … TO …`                       | 권한 부여                                         |
|               | `REVOKE … FROM …`                    | 권한 회수                                         |
|               | `WITH GRANT OPTION`                  | 객체 권한 재부여 가능 (회수 시 연쇄 회수됨)                    |
| **롤(Role)**   | `CREATE ROLE`, `CONNECT`, `RESOURCE` | 권한 그룹핑, 기본 롤 암기                               |
| **프로시저/함수**   | `CREATE PROCEDURE` / `FUNCTION`      | 프로시저는 반환값 X, **함수는 `RETURN` 필수**              |
|               | `%TYPE`, `%ROWTYPE`                  | 변수 선언 시 테이블 컬럼/행 타입 참조                        |
| **트리거**       | `AFTER UPDATE OR DELETE`             | 시점과 이벤트 지정                                    |
|               | **`FOR EACH ROW`**                   | 행 단위 실행 (이게 있어야 `:OLD` 사용 가능)                 |
|               | **`:OLD.컬럼`, `:NEW.컬럼`**             | 수정 전/후 데이터 참조 변수                              |
| **뷰(View)**   | `CREATE OR REPLACE VIEW`             | 가상 테이블 생성                                     |
|               | **`WITH CHECK OPTION`**              | 조건에 맞지 않는 데이터 변경 방지 (무결성)                     |
| **인덱스**       | `CREATE INDEX`                       | 검색 속도 향상                                      |
|               | **함수 기반 인덱스**                        | `ON table( SUBSTR(col, 1, 6) )` 처럼 가공된 값에 인덱싱 |
| **감사(Audit)** | **`AUDIT`**, `NOAUDIT`               | 감사 설정 및 해제                                    |
|               | **`DBA_AUDIT_TRAIL`**                | **(필수 암기)** 감사 로그가 저장되는 뷰 이름                  |
| **암호화**       | `AES256`                             | 대칭키 알고리즘 (키값 동일해야 함)                          |
|               | **`RAW`**                            | 암호화된 데이터가 저장될 타입 (이진 데이터)                     |
1. **VPD 대체 (View):** `WHERE login_id = USER`
2. **VPD 대체 (Trigger):** `IF USER <> :OLD.login_id THEN RAISE_APPLICATION_ERROR…`
3. **FGA 대체 (Trigger):** `WHEN (NEW.컬럼명 > 값)` (괄호 필수!)
---

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


# 📘 Chapter 7: 고급 DB 오브젝트 심층 탐구


## 1. 트리거 (Trigger)

### 핵심 개념: 테이블 또는 뷰에 부착되는 프로그램 코드

**이벤트(INSERT, UPDATE, DELETE)** 가 발생할 때 DBMS가 자동으로 실행하는 PL/SQL 블록입니다. 사용자가 직접 호출할 수 없습니다.

### **보안적 활용 (시험 포인트):**

1. **감사 로그(Audit Log) 기록:** 누가, 언제, 어떤 데이터를 수정했는지 별도의 백업 테이블에 기록합니다.
2. **데이터 변경 제한:** 업무 시간 외 데이터 변경 금지나, 특정 조건(예: 본인 외 수정 금지)을 위배할 경우 `RAISE_APPLICATION_ERROR`를 통해 작업을 취소시킵니다.
    

### **주요 문법 및 키워드:**

```SQL
CREATE OR REPLACE TRIGGER 트리거명
    [동작시점] [이벤트] ON 테이블명
    FOR EACH ROW  -- 이 옵션이 있어야 :OLD, :NEW 사용 가능
BEGIN
    -- [자동으로 실행될 로직]
    -- :OLD.컬럼명 (변경 전 값)
    -- :NEW.컬럼명 (변경 후 값)
END;
/
```

- **동작 시점:** DML를 지시할때
	- `BEFORE` :실제 데이터가 변경되기 **직전**에 실행
	- `AFTER` :실제 데이터가 변경된 **직후**에 실행
	- `INSTEAD OF` : DML를 실행하지 않고 대신 수행되는 작업
		- 뷰에 설정해 뷰에대한 DML를 원본테이블를 수정하는 트리거로 사용(권장x)
- **이벤트:** `INSERT`, `UPDATE`, `DELETE`
- **`FOR EACH ROW`**: 변경되는 행마다 실행
	- 없을시, 행개수와 상관없이 sql문장당 한번만 실행
	- 이 옵션이 있어야 `:OLD`, `:NEW` 변수를 사용할 수 있습니다.
- **`:OLD` vs `:NEW` 변수 (매우 중요)**
    - `:OLD.컬럼명`: 변경 **전** 데이터
    - `:NEW.컬럼명`: 변경 **후** 새 데이터


### 📝 실습 코드 예시 (로그 기록 트리거)

수업 시간에 userTBL의 변경 사항을 backup_userTBL에 기록하는 예제가 강조되었습니다.
**코드의 빈칸 채우기**나 **작성 문제**로 출제될 가능성이 높습니다.

> **시나리오:** 회원 테이블(`userTBL`)에서 데이터가 수정되거나 삭제되면, 그 내역을 백업 테이블(`backup_userTBL`)에 저장하라.

```SQL
-- 1. 트리거 생성 (기본 문법)
CREATE OR REPLACE TRIGGER 트리거명
    AFTER UPDATE OR DELETE ON 테이블명 -- [필수] 시점과 이벤트 지정
    FOR EACH ROW                     -- [필수] 행 단위 트리거
DECLARE -- BEGIN에서 사용할 변수등을 선언하는 공간
    v_modeType VARCHAR2(10);
BEGIN
	-- 동작 구분 (UPDATING, DELETING, INSERTING 시스템 변수 활용)
    IF UPDATING THEN
        v_modeType := '수정';
    ELSIF DELETING THEN
        v_modeType := '삭제';
    END IF;
    -- [포인트] 변경 전 데이터(:OLD)와 작업자(USER)를 백업 테이블에 저장
    INSERT INTO backup_userTBL (userID, userName, modType, modDate, modUser)
    VALUES (:OLD.userID, :OLD.userName, v_modeType, SYSDATE, USER); 
END;
/
-- 2. 동작 확인
SET SERVEROUTPUT ON;

-- 업데이트 실행 
UPDATE testTBL SET text = 'IVE' WHERE id = 1;

-- 3. 백업 테이블 확인 (로그가 남았는지)
SELECT * FROM backup_userTBL;
-- 결과: LSG는 '수정', KBS는 '삭제' 타입으로 기존 정보가 남아있어야 함.

```
- **`USER`**: 실행한 사용자 계정명을 반환하는 오라클 내장함수
---

## 2. 뷰 (View)

### 핵심 개념:

실제 데이터를 저장하지 않는 가상 테이블입니다. SELECT 문의 실행 결과를 마치 테이블처럼 보여줍니다.
뷰를 통해 뷰밖의 정보를 검색하는 건 불가능
### **보안적 활용 (암기):**

1. **데이터 마스킹 (민감 정보 은폐):** 주민등록번호, 급여 등 민감한 컬럼을 제외하고 필요한 정보만 보여주는 뷰를 생성하여 제공합니다.
2. **접근 제어 (권한 분리):** 실제 테이블(`Table`)에는 접근 권한을 주지 않고, 필요한 데이터만 정의된 뷰(`View`)에만 `SELECT` 권한을 부여합니다.
3. **복잡한 쿼리 은닉:** 복잡한 조인(Join) 쿼리를 뷰로 만들어 사용자에게는 단순한 테이블처럼 제공합니다.

```SQL
CREATE OR REPLACE [FORCE] VIEW 뷰이름 
AS
SELECT 쿼리문…
[WITH READ ONLY]        -- DML(수정/삭제) 불가 설정
[WITH CHECK OPTION];    -- 뷰의 WHERE 조건에 위배되는 데이터 입력/변경 차단 
```

### **주요 옵션:** `WITH CHECK OPTION` (무결성 및 보안 강화)

- **기능:** 뷰를 생성할 때 사용한 `WHERE` 조건에 위배되는 데이터의 **수정(UPDATE)이나 입력(INSERT)을 막습니다.**
- **예시:** '인사팀' 부서원만 조회하는 뷰에서, 부서를 '개발팀'으로 수정하려고 하면 에러를 발생시켜 **데이터 변조를 방지**합니다.

### 뷰(조회제한)+트리거(수정제한)으로 VPD의 기능을 대체한다.
- VPD란: 사용자가 SQL을 실행하면 DB가 자동으로 **`WHERE` 절(조건)** 을 추가해 실행하는 보안
- 사용자마다 접근가능한 데이터 즉, 행을 제한하는 기술이다.
- **핵심 패키지:** **`DBMS_RLS`** (RLS = Row Level Security)
- 단점: 비효율적일경우 성능저하
#### 사전 작업(기존과 동일)
```SQL
-- 1. 기존 계정이 있다면 삭제 (초기화)
DROP USER 유저이름 CASCADE;
-- 2. 계정 생성 (비밀번호: 1234)
CREATE USER 유저이름 IDENTIFIED BY 비밀번호 ACCOUNT UNLOCK;
-- 3. 기본 접속 권한 부여
GRANT CONNECT TO 유저이름;
-- 4. 테이블생성과 샘플데이터 삽입 
```

#### **① 조회 제한 (View)**: 권한별로 뷰를 생성한다
- **원리:** where절로 권한이외의 행을 거른다.

```SQL
-- 1. 일반 직원용 뷰 (자신의 정보만 조회 가능)
-- 조건: login_id가 현재 접속자(USER)와 같은 행만 필터링
CREATE OR REPLACE VIEW vw_my_profile AS
SELECT * FROM employee2
WHERE login_id = USER; -- 이게 시험포인트

-- 2. 인사팀용 뷰 (모든 직원 조회 가능, 단 주민번호 제외)
-- 조건: ssn 컬럼을 SELECT 절에서 제외
CREATE OR REPLACE VIEW vw_hr_view AS
SELECT emp_id, name, department, salary --이게 시험포인트
FROM employee2;

-- 3. 관리자용 뷰 (모든 정보 조회 가능)
CREATE OR REPLACE VIEW vw_admin_view AS
SELECT * FROM employee2;
```
#### **② 수정 제한 (Trigger)** : 수정시도를 트리거로 감지해 에러낸다.

- **원리:** **트리거**에서 수정시도를 감지하고, `:OLD.login_id` (데이터 주인)와 `USER` (접속자)를 비교합니다.
- 만약 주인이 아니라면(`IF`) `RAISE_APPLICATION_ERROR` (강제 에러 발생).

```SQL
CREATE OR REPLACE TRIGGER trg_emp_self_update
    BEFORE UPDATE OR DELETE ON employee2 -- 수정/삭제 시도 전
    FOR EACH ROW
BEGIN
    -- 접속자(USER)가 데이터 주인(:OLD.login_id)이 아니면 에러 발생
    IF USER <> :OLD.login_id THEN
        RAISE_APPLICATION_ERROR(-20001, '자신의 정보만 수정할 수 있습니다.');
    END IF;
END;
/
```

#### 검증작업

```SQL
--각 계정별로 로그인
CONNECT 유저이름/유저비번
--각 계정별로 조회
SELECT * FROM 원본테이블소유한유저이름.뷰이름
```

```SQL 
예시
-- 1. 일반 직원 (EMP_1001) 접속 테스트
CONNECT EMP_1001/1234;
SELECT * FROM TEST.vw_my_profile; 
-- 결과: 자신의 행(EMP_1001) 1건만 조회됨

```
---
## 3. 인덱스 (Index)

데이터 검색 속도를 높이기 위한 색인(찾아보기) 기능
검색 기준 컬럼을 추출하여 **정렬된 상태로 별도의 파일**에 저장하고, 원본 데이터(튜플)를 찾아갈 수 있는 **링크**를 함께 저장함

인덱스 생성후 조건절(WHERE)결과를 맞춰주면, dbms가 알아서 인덱스 사용
### **민감 정보 인덱싱 금지:**
- 인덱스는 별도의 파일로 저장되는데, 여기에 평문 데이터가 정렬되어 저장됩니다 민감한 컬럼이 인덱스 파일 자체나 정렬된 패턴을 역으로 분석하거나, 부분 문자열 검색, LIKE, 해시 공격 등에 노출
- 인덱스 파일이 많으면 인덱스를 재정렬하는데 시간이 소모되어 DBMS의 성능을 저하시킬 수 있음
- 인덱스 지정시 효과가 별로 없는 경우
	- 테이블의 튜플의 수가 적은 경우
```SQL
-- [1] 일반 B-Tree 인덱스 (기본값)
CREATE [UNIQUE] INDEX 인덱스명 ON 테이블명 (컬럼명 [DESC]);
```

- **`UNIQUE`:** 민증번호처럼 중복 값을 허용하지 않을때 사용. 생략 시 중복값이 저장되는걸 허용
- (선택) **`DESC`:** 인덱스를 내림차순(큰->작은순)으로 생성, 기본값은 오름차순 ASC

### 보안을 고려한 인덱스 설계
1. **함수 기반 인덱스 (Function-based Index):**
    - 민감정보를 통채로 인덱싱하지 않고, 가공 후 인덱싱합니다.
    - 예: 주민번호 전체가 아닌, 생년월일(앞 6자리)로만 검색이 필요할 때.
	```SQL
	-- 1. 주민번호 앞 6자리(생년월일)만 인덱싱 (전체 주민번호 노출 방지)
	CREATE INDEX idx_cust_ssn_prefix
	ON customer(SUBSTR(ssn, 1, 6)); 
	
	-- 2. 인덱스 활용 검색 테스트
	-- (WHERE 절에 인덱스 생성 시 사용한 함수 그대로 사용)
	SELECT * FROM customer
	WHERE SUBSTR(ssn, 1, 6) = '900101'; 
	```
    
2. **부분 인덱스 (Partial Index):**
    - `WHERE` 조건을 주어 특정 데이터만 인덱싱하여 불필요한 데이터 노출을 최소화합니다.
    - 문제: `NULL`인 데이터는 인덱스에 포함되지 않으므로 저장 공간을 절약하고, 해당 조건 검색 시 속도가 매우 빠릅니다
	```SQL
	-- 전화번호가 존재하는 고객만 인덱싱
	CREATE INDEX idx_cust_phone_valid
	ON customer(phone)
	WHERE phone IS NOT NULL; 
	```
3. 리버스 키 인덱스
	- 키 값을 역순으로 저장하여 공격자가 다음 Id 예측하는걸 막음
	- **보안 장점:** 연속된 번호(1001, 1002)가 들어와도 인덱스 내부에서는 물리적으로 멀리 떨어진 블록에 분산 저장되므로, 데이터가 모여 있는 패턴을 숨길 수 있습니다
	-  리버스 인덱스: 1001(1001), 2001(1002), 3001(1003) 처럼 분산 저장됨 (패턴 숨김)
```SQL
-- 리버스 키 인덱스 생성
-- (키 값이 1003 -> 3001로 저장, 연속된 값의 물리적 위치를 섞음)
CREATE INDEX idx_cust_id_reverse
ON customer(cust_id) REVERSE; 
```
### 별도 테이블 만들어 트리거로 일일히 기록담아 FGA의 기능 대체
- FGA란?: 유저가 특정 컬럼(급여처럼 민감)이나 조건에 대해 조회했을때 시스템뷰 `DBA_FGA_AUDIT_TRAIL`에 기록남기기
- **핵심 패키지:** **`DBMS_FGA`** **로그 확인 뷰:** **`DBA_FGA_AUDIT_TRAIL
#### ① 로그 테이블 (Audit Log)
- **시퀀스 생성:** 로그 ID(`log_id`)가 1, 2, 3… 자동으로 증가하도록 `audit_log_seq`를 생성합니다.
- **테이블 생성 (`audit_log`):**
    - `username`: 변경한 사용자 ID
    - `access_time`: 접근 시각 (`SYSDATE`)
    - `action_type`: 수행한 작업 (`INSERT`, `UPDATE`, `DELETE`)
    - `accessed_col`: 건드린 컬럼명 (예: SSN, SALARY)
    - `accessed_data`: 변경된 값 (`:OLD` 값 -> `:NEW` 값)
- **자동 번호 트리거:** 로그가 쌓일 때마다 시퀀스에서 번호를 뽑아 `log_id`에 자동으로 넣어주는 트리거를 만듭니다.
```SQL
-- 1. 시퀀스 생성 (로그 ID 자동 증가용)
CREATE SEQUENCE audit_log_seq
START WITH 1
INCREMENT BY 1
NOCACHE
NOCYCLE;

-- 2. 감사 로그 테이블 생성
CREATE TABLE audit_log (
    log_id        NUMBER PRIMARY KEY,
    username      VARCHAR2(50),    -- 변경한 사용자
    access_time   DATE,            -- 변경 일시
    action_type   VARCHAR2(10),    -- 동작 유형 (INSERT/UPDATE/DELETE)
    accessed_col  VARCHAR2(50),    -- 접근한 컬럼명 (SSN 등)
    accessed_data VARCHAR2(200)    -- 변경된 데이터 내용 (이전값 -> 새값)
); 

-- 3. 로그 ID 자동 입력 트리거 (INSERT 시 시퀀스 값 자동 할당)
CREATE OR REPLACE TRIGGER trg_audit_log_id
BEFORE INSERT ON audit_log
FOR EACH ROW
BEGIN
    :NEW.log_id := audit_log_seq.NEXTVAL;
END;
/ 
```

#### **② 조건부 감시 트리거 (Smart Trigger)**

- 주민등록번호(ssn)가 변경되거나 삭제될 때 로그를 남깁니다.
- **시험 포인트:** **`WHEN` 절** 사용법 (매우 중요). 트리거 내부 `IF`문이 아니라, 트리거 선언부의 `WHEN`을 써야 성능이 좋습니다.

```SQL
-- 1. SSN 수정(UPDATE) 감시 트리거
-- 변경 전(`:OLD.ssn`)과 변경 후(`:NEW.ssn`) 값을 기록합니다.
CREATE OR REPLACE TRIGGER trg_audit_ssn_update
AFTER UPDATE OF ssn ON employee2  -- (교재의 users 테이블 대신 앞서 만든 employee2 사용)
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (username, access_time, action_type, accessed_col, accessed_data)
    VALUES (USER, SYSDATE, 'UPDATE', 'SSN', :OLD.ssn || ' -> ' || :NEW.ssn);
END;
/ 

-- 2. 삭제(DELETE) 감시 트리거
--`BEFORE DELETE`를 사용하여 데이터가 삭제되기 직전에 삭제되는 SSN 값을 기록
CREATE OR REPLACE TRIGGER trg_audit_ssn_delete
BEFORE DELETE ON employee2
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (username, access_time, action_type, accessed_col, accessed_data)
    VALUES (USER, SYSDATE, 'DELETE', 'SSN', :OLD.ssn);
END;
/
```

- 급여(salary)가 10,000을 초과하는 값으로 입력되거나 수정될 때만 로그를 남깁니다(조건부 감사)
```SQL
-- 1. 급여 수정(UPDATE) 감시 (새 값이 10000 초과일 때만)
CREATE OR REPLACE TRIGGER trg_audit_salary_update
AFTER UPDATE OF salary ON employee2
FOR EACH ROW
WHEN (NEW.salary > 10000)
BEGIN
    INSERT INTO audit_log (username, access_time, action_type, accessed_col, accessed_data)
    VALUES (USER, SYSDATE, 'UPDATE', 'SALARY', :OLD.salary || ' -> ' || :NEW.salary);
END;
/ 

-- 2. 급여 입력(INSERT) 감시 (10000 초과일 때만)
CREATE OR REPLACE TRIGGER trg_audit_salary_insert
AFTER INSERT ON employee2
FOR EACH ROW
WHEN (NEW.salary > 10000)
BEGIN
    INSERT INTO audit_log (username, access_time, action_type, accessed_col, accessed_data)
    VALUES (USER, SYSDATE, 'INSERT', 'SALARY', :NEW.salary);
END;
/ 
```
- **주의사항:** 트리거 방식은 데이터를 단순히 **조회(SELECT)하는 행위는 감시할 수 없습니다.** (XE 버전의 한계)
> [!NOTE]- 검증(근데 시험에 dml이런거 안나온대서 보기만)
>
> ```SQL
> -- 1. 고액 연봉자(12000) 추가 -> INSERT 트리거 작동
> INSERT INTO employee2 VALUES (1006, '조세호', '총무팀', 12000, '950606-6789012', 'EMP_1006');
> COMMIT; 
> 
> -- 2. 급여 인상 (9000 -> 16000) -> UPDATE 트리거 작동
> -- (주의: emp_id=1001 등 기존 데이터에 맞게 수정 필요)
> UPDATE employee2 SET salary = 16000 WHERE emp_id = 1001; 
> COMMIT; 
> -- 3. 주민번호 변경 시도 -> SSN UPDATE 트리거 작동
> UPDATE employee2 SET ssn = '900101-9999999' WHERE emp_id = 1001;
> COMMIT; 
> -- 4. 직원 삭제 -> SSN DELETE 트리거 작동
> DELETE FROM employee2 WHERE emp_id = 1003;
> COMMIT; 
> 
> -- 5. 감사 로그 확인
> SELECT * FROM audit_log ORDER BY log_id; 
> ```
---
### **📝 핵심 요약:**

- "보안을 위해 **민감한 컬럼(SSN 등)에는 직접 인덱스를 생성하지 않는다**."
- "필요하다면 암호화된 컬럼이나 일부만 추출한 함수 기반 인덱스를 사용한다."

|**구분**|**VPD (Virtual Private Database)**|**FGA (Fine-Grained Auditing)**|
|---|---|---|
|**목적**|**접근 제어 (Control)**|**접근 감시/기록 (Audit)**|
|**기능**|특정 행(Row)을 **안 보이게 숨김**|특정 조건을 건드리면 **기록을 남김**|
|**방식**|SQL 실행 시 자동으로 `WHERE` 절 추가|SQL은 그대로 실행되나, 몰래 로그를 저장|
|**유사 개념**|보안 뷰 (View)|CCTV 감시|
|**성능 영향**|항상 쿼리를 변조하므로 조건에 따라 다름|조건에 맞는 경우에만 기록하므로 비교적 적음|

# 📚 Chapter 8. DB 보안 관리 실무 심층 분석

## 1. 사용자 계정 관리 (User Account)
- User는 DB에 접속하는 주체이며, Schema는 그 사용자가 소유한 객체(테이블, 뷰 등)의 집합.
- 보안을 위해 **프로파일(Profile)** 을 적용하여 패스워드 정책과 리소스 사용을 제한할 수 있습니다.
### **1. 사용자 계정 생성 및 관리**

오라클 데이터베이스는 **2계층 구조(CDB, PDB)**로 되어 있어 사용자 유형도 두 가지로 나뉩니다.

#### **1) 사용자 유형**

- **① 공통 사용자 (Common User)**
    - **접근 범위:** 전체 데이터베이스 (**CDB** 및 모든 **PDB**)
    - **생성 위치:** CDB (관리자 접속 필요)
    - **특징:** 계정명 앞에 반드시 **`C##`** 접두어를 붙여야 함 (예: `C##SCOTT`)
- **② 로컬 사용자 (Local User)**
    - **접근 범위:** 특정 **PDB** (Pluggable Database)
    - **생성 위치:** 해당 PDB (관리자 접속 필요)
    - **특징:** 특정 PDB 안에서만 사용 가능
        

#### **2) 사용자 생성 실습 (CREATE USER)**

시스템 관리자(`SYS`, `SYSTEM`)만이 수행할 수 있는 작업입니다 .

- **기본 문법:**

    ```SQL
    CREATE USER 사용자명
    IDENTIFIED BY 비밀번호
    DEFAULT TABLESPACE 테이블스페이스명; -- 데이터가 저장될 기본 공간 지정
    ```
    
- **실습 예제:**
    ```SQL
    -- 1. 관리자 접속
    CONN / AS SYSDBA;
    
    -- 2. 사용자 생성 (이름: salesman_1, 비번: 1234, 저장소: USERS)
    CREATE USER salesman_1
    IDENTIFIED BY 1234
    DEFAULT TABLESPACE USERS;
    
    -- 3. 생성된 사용자 확인 (Data Dictionary 조회)
    SELECT username, default_tablespace
    FROM dba_users
    WHERE account_status = 'OPEN';
    ```

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
	
	-- 참고: 잠긴 계정 해제 (관리자 권한)
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
    - **시스템 권한 (System Privilege):** DB 수준의 작업
	    - 예: `CREATE SESSION`(접속), ``CREATE TABLE`, `CREATE VIEW`, `DROP ANY TABLE`.`
    - **오브젝트 권한 (Object Privilege):** 특정 객체 조작
	    - 예: `SELECT`, `INSERT`, `UPDATE`, `DELETE` **ON 테이블명**.
 - **※참고:** `SYSDBA`는 계정이 아니라, 강력한 권한들을 묶어놓은 **역할(Role)**의 이름입니다.

---

### **4. 권한(Privilege) 관리: GRANT & REVOKE**

계정만 생성해서는 아무것도 할 수 없습니다. **접속 권한**과 **테이블 사용 권한**을 부여해야 합니다.

#### **1) 시스템 권한 부여 (접속 및 객체 생성)**
**기본 문법:**

```SQL
-- 권한 부여
GRANT 권한_리스트 ON 객체명 TO 사용자;

-- 권한 회수
REVOKE 권한_리스트 ON 객체명 FROM 사용자;
```

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
    
| **구분**                | **옵션 키워드**  | **적용 대상**                                                      | **특징** |
| --------------------- | ----------- | -------------------------------------------------------------- | ------ |
| **WITH ADMIN OPTION** | 시스템 권한 부여시  | `REVOKE` 시 **연쇄 회수 안 됨**. (내가 준 권한을 받은 제3자는 권한 유지)             |        |
| **WITH GRANT OPTION** | 오브젝트 권한 부여시 | `REVOKE` 시 **연쇄 회수 됨 (Cascade)**. (내가 권한을 뺏기면, 내가 줬던 애들도 다 뺏김) |        |

---

## 3. 롤 (ROLE) 관리

**출제 포인트:** 롤의 목적(그룹핑), 기본 롤(`CONNECT`, `RESOURCE`), 사용자 정의 롤 생성 절차.

### 3.1 롤의 개념 및 필요성

- **정의:** 여러 권한들을 묶어놓은 **권한의 그룹(집합)**입니다 .
- **목적:** 수십 개의 권한을 일일이 사용자마다 부여하는 번거로움을 줄여 관리의 효율성을 높입니다 .
### 3.2 오라클 기본 롤 (Standard Roles)

가장 많이 사용되는 3대 롤을 반드시 암기해야 합니다 .

1. **CONNECT:** DB 접속에 필요한 기본 권한 (`CREATE SESSION` 등).
2. **RESOURCE:** 객체(테이블, 시퀀스, 프로시저 등)를 생성할 수 있는 권한 집합.
3. **DBA:** 모든 시스템 권한을 가진 최고 관리자 롤.

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
## 📝 기말고사 대비 요약 (Chapter 8)

1. **계정 관리:**
    
    - `ALTER USER … ACCOUNT UNLOCK` (잠금 해제 명령어 필수 암기).
    - `PROFILE`: `FAILED_LOGIN_ATTEMPTS`(실패 횟수), `PASSWORD_LIFE_TIME`(암호 수명).
        
2. **권한 (Privilege):**
    
    - 시스템(`CREATE SESSION`) vs 객체(`SELECT ON table`) 구분.
    - **옵션 차이:** `WITH ADMIN OPTION`(시스템, 연쇄회수X) vs `WITH GRANT OPTION`(객체, 연쇄회수O).
        
3. **롤 (Role):**
    
    - 권한의 그룹핑.
    - `CONNECT`, `RESOURCE` 롤의 역할.
    - 생성 절차: `CREATE ROLE` $\rightarrow$ `GRANT 권한 TO 롤` $\rightarrow$ `GRANT 롤 TO 유저`.
## 💡 교수님 출제 예상 포인트 (Chapter 8)

1. **프로파일 설정:** "로그인 실패가 5회 발생하면 계정을 잠그고, 암호를 60일마다 변경하도록 하는 프로파일 생성 SQL을 작성하시오." (파라미터 이름 암기 필수: `FAILED_LOGIN_ATTEMPTS`, `PASSWORD_LIFE_TIME`)
2. **권한 부여 옵션:** "`WITH ADMIN OPTION`과 `WITH GRANT OPTION`의 차이점을 서술하시오." (시스템 권한 vs 오브젝트 권한)
3. **롤(Role)의 장점:** "롤을 사용하여 권한을 관리할 때의 장점을 보안 관리자 입장에서 서술하시오." (관리 효율성, 실수 방지, 정책 일관성)
4. **권한 회수 메커니즘:** "A가 B에게 `WITH GRANT OPTION`으로 권한을 주고, B가 C에게 권한을 주었다. A가 B의 권한을 `REVOKE`하면 C의 권한은 어떻게 되는가?" (C의 권한도 연쇄적으로 회수됨 )



---

# 📘 Chapter 9: 감사(Audit) 및 데이터 암호화 심층 탐구

**감사(Audit)는 실습 내용**까지, **암호화는 실습 환경 이슈로 개념 위주**로 출제하신다고 하셨으므로, 그에 맞춰 핵심을 정리해 드립니다.

`AUDIT [이벤트] [BY 사용자] WHENEVER [SUCCESSFUL | NOT SUCCESSFUL];`

**📝 실습 시나리오 (로그인 실패 및 특정 테이블 조회 감시)**
### 1.1 감사의 개념 및 필요성
- **정의:** 사용자의 데이터베이스 작업(로그인, 테이블 조회, 수정 등)을 모니터링하고 기록하는 활동입니다 .
- **목적:** 의심스러운 활동 감지, 침입자 식별, 규정 준수 확인.

1. **감사 설정 (`AUDIT`):** 특정 작업(SELECT, DELETE 등)이나 특정 사용자의 행동을 감시하도록 설정합니다.
2. **성공/실패 여부 기록:**
		1.`BY ACCESS`: 접근할 때마다 기록.
		2.`WHENEVER SUCCESSFUL` 작업을 성공했을 때만 기록할지
		3.`WHENEVER NOT SUCCESSFUL` 실패했을 때만 기록할지
3. **로그 확인:** 감사 결과는 `DBA_AUDIT_TRAIL` (이 뷰 이름 꼭 기억!).통해 확인

-  현재 감사 기능이 켜져 있는지 확인
	`SHOW PARAMETER audit_trail;`
	- **`NONE`**: 비활성화
    - **`DB`**: 활성화 (DB 테이블 `SYS.AUD$`에 저장)
    - **`DB, EXTENDED`**: 활성화 + 실행한 SQL 문장까지 저장 (가장 상세함)
```SQL
-- 접속: SYS (CMD 권장)

-- 1. 감사 파라미터 확인 및 활성화
SHOW PARAMETER AUDIT_TRAIL; 
-- 결과가 NONE이면 활성화 필요 (DB, EXTENDED는 SQL Text까지 저장)
ALTER SYSTEM SET AUDIT_TRAIL=DB,EXTENDED SCOPE=SPFILE;

-- 2. DB 재시작 (파라미터 적용)
SHUTDOWN IMMEDIATE;
STARTUP;

-- 3. 감사 정책 설정
-- 3-1. 로그인 실패 감사 (세션)
AUDIT SESSION WHENEVER NOT SUCCESSFUL;

-- 3-2. 특정 유저(HR)의 EMPLOYEES 테이블 조회 감사
AUDIT SELECT ON HR.EMPLOYEES BY HR;

-- 접속: HR (행위 유발)
SELECT * FROM EMPLOYEES WHERE ROWNUM <= 5;

-- 접속: SYSTEM/SYS (로그 확인)
-- 전체 감사 로그 확인
SELECT username, timestamp, obj_name, action_name, sql_text 
FROM DBA_AUDIT_TRAIL 
WHERE username = 'HR' 
ORDER BY timestamp DESC;

-- 4. 감사 해제 (Cleanup)
NOAUDIT SESSION;
NOAUDIT SELECT ON HR.EMPLOYEES;
```

- 명령어: `AUDIT` (설정), `NOAUDIT` (해제).
- 뷰: **`DBA_AUDIT_TRAIL`** (로그 확인 장소, 필수 암기).
- 옵션: `WHENEVER NOT SUCCESSFUL` (실패 시에만 기록).
## 2. 데이터 암호화 (Data Encryption)

핵심 개념:

데이터를 평문(Plain text) 그대로 저장하지 않고, 암호화 키를 사용하여 **해독 불가능한 형태(Cipher text)** 로 변환해 저장합니다. DB 파일이 탈취되더라도 내용을 볼 수 없게 합니다.

**구현 방식 (시험 포인트 - 개념 위주):**

1. **알고리즘:** 오라클은 강력한 대칭키 암호화 방식인 **AES256** (256비트 키 사용)을 주로 사용합니다.
2. **패키지:** 암호화/복호화 기능을 제공하는 오라클 내장 패키지는 **`DBMS_CRYPTO`** 입니다.
3. **데이터 타입:** 암호화된 데이터는 읽을 수 없는 바이너리 형태가 되므로, 테이블에 저장할 때는 **`RAW`** 타입을 사용해야 합니다. (예: `ssn RAW(2000)`)
4. **암호화 (Encrypt):** 평문(Plain Text) $\rightarrow$ 암호문(Cypher Text/RAW).
    
    - 함수: `DBMS_CRYPTO.ENCRYPT`
    - 입력: 평문, 암호화 키, 알고리즘 타입.
        
5. **복호화 (Decrypt):** 암호문(RAW) $\rightarrow$ 평문(Plain Text).
    
    - 함수: `DBMS_CRYPTO.DECRYPT`
    - **중요:** 암호화할 때 쓴 **키(Key)**와 똑같은 키를 써야 풀립니다 (대칭키 특징) .
---
---
### 1. [필수] 기본: AES256 함수 기반 암호화/복호화 (실습 성공 부분)

**1) 테이블 생성**

암호화된 데이터를 저장하기 위해 적절한 데이터 타입을 지정해야 합니다.

```SQL
-- system 계정 접속 후 실행
CREATE TABLE secure_table (
    id NUMBER PRIMARY KEY,
    name VARCHAR2(50),
    ssn_raw (    ①    )(2000) -- 암호화된 데이터를 이진(Binary) 형태로 저장
);
```

> 정답 ① : RAW
>
> (암호화된 데이터는 문자열이 아닌 바이너리 형태이므로 RAW 타입을 사용합니다.)

**2) 암호화 함수 생성 (`encrypt_aes`)**

오라클 내장 패키지를 사용하여 평문을 암호화합니다. 이 패키지 이름은 시험에 나올 확률이 매우 높습니다.

```SQL
CREATE OR REPLACE FUNCTION encrypt_aes(p_plain IN VARCHAR2) RETURN (    ①    ) IS
    -- 32바이트(256비트) 키 설정
    l_key (    ①    )(32) := UTL_RAW.cast_to_raw('01234567890123456789012345678901');
BEGIN
    IF p_plain IS NULL THEN
        RETURN NULL;
    END IF;

    RETURN (    ②    ).encrypt(
        src => UTL_RAW.cast_to_raw(p_plain),
        typ => (    ②    ).encrypt_aes256 + (    ②    ).chain_cbc + (    ②    ).pad_pkcs5,
        key => l_key
    );
END;
/
```

> 정답 ① : RAW
>
> 정답 ② : DBMS_CRYPTO
>
> (오라클에서 암호화/복호화를 수행하는 핵심 내장 패키지 이름입니다.)

**3) 복호화 함수 생성 (`decrypt_aes`)**

암호화된 데이터를 다시 평문으로 복원합니다.

```SQL
CREATE OR REPLACE FUNCTION decrypt_aes(p_raw IN (    ①    )) RETURN VARCHAR2 IS
    -- 암호화와 동일한 키 사용
    l_key (    ①    )(32) := UTL_RAW.cast_to_raw('01234567890123456789012345678901');
BEGIN
    IF p_raw IS NULL THEN
        RETURN NULL;
    END IF;

    RETURN UTL_RAW.cast_to_varchar2(
        (    ②    ).decrypt(
            src => p_raw,
            typ => (    ②    ).encrypt_aes256 + (    ②    ).chain_cbc + (    ②    ).pad_pkcs5,
            key => l_key
        )
    );
END;
/
```

> 정답 ① : RAW
>
> 정답 ② : DBMS_CRYPTO

**4) 데이터 삽입 및 조회 테스트**

```SQL
-- 1. 데이터 삽입 (암호화 함수 사용)
INSERT INTO secure_table (id, name, ssn_raw)
VALUES (1, '홍길동', encrypt_aes('900101-1234567'));

INSERT INTO secure_table (id, name, ssn_raw)
VALUES (2, '김철수', encrypt_aes('850505-7654321'));
COMMIT;

-- 2. 데이터 수정 (암호화 함수 사용)
UPDATE secure_table
SET ssn_raw = encrypt_aes('900101-9999999')
WHERE id = 1;
COMMIT;

-- 3. 암호화된 상태 그대로 조회 (사람이 읽을 수 없음)
SELECT id, name, ssn_raw FROM secure_table;

-- 4. 복호화 함수를 사용하여 원본 조회
SELECT id, name, decrypt_aes(ssn_raw) AS ssn_decrypted
FROM secure_table;
```

### 2. [응용] 트리거와 뷰를 이용한 자동화 (개념 위주)

실습이 원활하지 않았던 부분이지만, **자동화 구조(트리거, 뷰)**의 핵심 객체 이름은 시험에 출제될 수 있습니다.

**1) 자동화용 테이블 생성**

```SQL
CREATE TABLE secure_table2 (
    id NUMBER PRIMARY KEY,
    name VARCHAR2(50),
    ssn_raw VARCHAR2(2000) -- RAW 값을 HEX 문자열로 변환해 저장하기 위해 VARCHAR2 사용
);
```

**2) 자동 암호화 트리거 생성 (`trg_encrypt_ssn`)**

데이터가 들어오기 직전에 암호화를 수행합니다.

```SQL
CREATE OR REPLACE (    ③    ) trg_encrypt_ssn
(    ④    ) INSERT OR UPDATE ON secure_table2
FOR EACH ROW
BEGIN
    IF :NEW.ssn_raw IS NOT NULL THEN
        -- 입력받은 평문을 암호화 후, HEX 문자열로 변환하여 저장
        :NEW.ssn_raw := (    ⑤    )(encrypt_aes(:NEW.ssn_raw));
    END IF;
END;
/
```

> 정답 ③ : TRIGGER
>
> (INSERT, UPDATE 시 자동으로 동작하는 객체)
>
> 정답 ④ : BEFORE
>
> (데이터가 테이블에 저장되기 전에 암호화를 해야 하므로 BEFORE 시점 사용)
>
> 정답 ⑤ : RAWTOHEX
>
> (RAW 타입의 암호화 데이터를 VARCHAR2 컬럼에 저장하기 위해 16진수 문자열로 변환하는 함수)

**3) HEX 복호화 래퍼(Wrapper) 함수 생성 (`decrypt_aes_hex`)**

```SQL
CREATE OR REPLACE FUNCTION decrypt_aes_hex(p_hex IN VARCHAR2) RETURN VARCHAR2 IS
BEGIN
    IF p_hex IS NULL THEN
        RETURN NULL;
    END IF;
    -- HEX 문자열 -> RAW 변환 -> 복호화 수행
    RETURN decrypt_aes(HEXTORAW(p_hex));
END;
/
```

**4) 자동 복호화 뷰(View) 생성 (`secure_table_v`)**

조회 시 자동으로 복호화 함수를 태우는 가상 테이블을 생성합니다.

```SQL
CREATE OR REPLACE (    ⑥    ) secure_table_v AS
SELECT id, name, decrypt_aes_hex(ssn_raw) AS ssn
FROM secure_table2;
```

> 정답 ⑥ : VIEW
>
> (트리거는 SELECT를 처리할 수 없으므로, 조회 시 자동 복호화를 위해 만드는 객체)

**5) 자동화 테스트**

```SQL
-- 1. 평문으로 INSERT (트리거가 작동하여 자동 암호화됨)
INSERT INTO secure_table2 (id, name, ssn_raw)
VALUES (1, '홍길동', '900101-1234567');
COMMIT;

-- 2. 실제 테이블 조회 (암호화된 16진수 문자열 확인)
SELECT * FROM secure_table2;

-- 3. 뷰를 통해 조회 (자동 복호화된 결과 확인)
SELECT * FROM secure_table_v;
```
## 💡 교수님 출제 예상 포인트 (Chapter 9)

1. **감사 명령어:** "특정 테이블에 대한 `UPDATE` 명령이 **실패했을 때만** 로그를 남기는 `AUDIT` 명령어를 작성하시오."
    
    - 정답: `AUDIT UPDATE ON 테이블명 WHENEVER NOT SUCCESSFUL;`
        
2. **로그 확인 뷰:** "감사 결과가 저장되는 데이터 사전 뷰(View)의 이름은 무엇인가?"
    
    - 정답: `DBA_AUDIT_TRAIL`
        
3. **암호화 패키지:** "오라클에서 데이터 암호화를 위해 제공하는 내장 패키지 이름은?"
    
    - 정답: `DBMS_CRYPTO`
        
4. **암호화 데이터 타입:** "AES256 알고리즘으로 암호화된 데이터를 저장하기 위해 적절한 오라클 데이터 타입은?"
    
    - 정답: `RAW` (또는 `BLOB`)
        

 


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

# 📘 Chapter 11: 데이터 모델링 (DB 설계) 심층 탐구

---

## 1. 물리적 데이터 모델링 (Physical Data Modeling) 핵심

핵심 개념:

현실 세계의 업무 요구사항을 실제 데이터베이스(Oracle)에 저장할 수 있는 테이블 구조(스키마)로 변환하는 과정입니다

**시험 출제 유형 (매우 중요):**

- **문제:** "쇼핑몰 운영을 위한 요구사항이 다음과 같다. 이에 맞는 테이블 명세서(물리적 설계도)를 작성하시오."
- **작성 항목:** 테이블 명, 컬럼(열) 이름, 데이터 타입, 키(PK, FK), NULL 여부
    
---

## 2. DB 설계 4단계 전략 (시험 문제 풀이법)

시험에서 시나리오를 받으면 다음 순서대로 설계하세요.

### **Step 1: 엔티티(Entity) 식별 -> 테이블 생성**

- 시나리오에서 **"관리해야 할 주요 대상"** 을 찾습니다. (예: 회원, 상품, 주문 등)
- 이 대상들이 각각 하나의 **테이블(Table)**이 됩니다
    

### **Step 2: 속성(Attribute) 식별 -> 컬럼(Column) 정의**

- 각 테이블이 저장해야 할 **세부 정보**를 찾습니다.
- 예: 회원(이름, 아이디, 전화번호), 주문(주문일자, 수량)
    

### **Step 3: 데이터 타입(Data Type) 결정 (오라클 기준)**

- 각 컬럼에 맞는 데이터 타입을 지정해야 합니다. **(시험 감점 요인 주의)**
    - **문자:** `VARCHAR2(길이)` (가변 길이, 주로 사용), `CHAR(길이)` (고정 길이), `NCHAR`(한글 위주).
    - **숫자:** `NUMBER` 또는 `INTEGER`.
    - **날짜:** `DATE`.
        

### **Step 4: 키(Key) 및 관계(Relationship) 설정**

- **Primary Key (PK):** 각 행을 유일하게 식별하는 컬럼 (예: `userID`, `emp_id`). **반드시 표시**해야 합니다
- **Foreign Key (FK):** 다른 테이블을 참조하는 컬럼. 두 테이블 간의 **연결 고리**입니다. (예: 구매 테이블의 `userID`는 회원 테이블의 `userID`를 참조)
    

---

## 3. 실습 시나리오 분석: 쇼핑몰 DB 설계

수업 시간에 다룬 **"쇼핑몰 고객 및 구매 관리"** 예제를 완벽히 이해해야 합니다.

**[요구사항]**

1. 고객의 정보를 저장해야 한다 (이름, 출생년도, 주소, 연락처).
2. 고객이 물건을 구매한 내역을 저장해야 한다 (물건명, 단가, 수량).
3. 한 명의 고객은 여러 번 구매할 수 있다.
    

**[설계 결과: 테이블 명세서]**

**1) 고객 테이블 (`userTBL`)**

|**한글명**|**영문명(컬럼명)**|**데이터 타입**|**필수(NULL)**|**제약조건**|
|---|---|---|---|---|
|**아이디**|`userID`|`CHAR(8)`|NOT NULL|**PK**|
|**이름**|`userName`|`NVARCHAR2(10)`|NOT NULL||
|**출생년도**|`birthYear`|`NUMBER(4)`|NOT NULL||
|**주소**|`addr`|`NCHAR(2)`|NOT NULL||
|**연락처**|`mobile`|`CHAR(13)`|NULL||

**2) 구매 테이블 (`buyTBL`)**

| **한글명**   | **영문명(컬럼명)** | **데이터 타입**  | **필수(NULL)** | **제약조건** |
| --------- | ------------ | ----------- | ------------ | -------- |
| **순번**    | `num`        | `NUMBER(8)` | NOT NULL     | **PK**   |
| **구매자ID** | `userID`     | `CHAR(8)`   | NOT NULL     | **FK**   |
| **상품명**   | `prodName`   | `NCHAR(6)`  | NOT NULL     |          |
| **단가**    | `price`      | `NUMBER(8)` | NOT NULL     |          |
| **수량**    | `amount`     | `NUMBER(3)` | NOT NULL     |          |
**🔑 설계 포인트 (시험 팁):**

- **관계 설정:** 구매 테이블(`buyTBL`)에는 반드시 **누가** 샀는지를 알기 위해 회원 테이블의 PK인 `userID`가 **FK(Foreign Key)**로 포함되어야 합니다
- **데이터 분리:** 고객 정보와 구매 정보를 하나의 테이블에 섞지 않고, **두 개의 테이블로 분리(정규화)**하는 것이 핵심입니다
    
>[!tip] **💡 답안 작성 팁:**
> - **데이터 타입:** 오라클 기준 타입을 정확히 써야 합니다.
>     - 한글 저장: `NCHAR`, `NVARCHAR2` .
>     - 숫자 저장: `NUMBER`, `INTEGER` .
>     - 고정 길이 문자: `CHAR` (ID 등 길이가 일정한 경우).
> - **PK/FK 표시:** 어느 컬럼이 기본키이고, 어느 컬럼이 외래키인지 반드시 표기해야 합니다.
---

## 4. SQL Developer Data Modeler (참고)

수업 시간에는 SQL Developer 내의 **Data Modeler** 기능을 사용하여 다이어그램(ERD)을 그리고, 이를 **DDL(SQL 코드)**로 변환하는 실습을 했습니다

- **물리적 모델링 도구:** 테이블을 그리고(`Tables`), 컬럼을 추가하고(`Columns`), 관계를 연결(`Foreign Key`)하면 자동으로 DDL(`CREATE TABLE…`)을 생성해 줍니다
- **시험 관련성:** 툴 사용법 자체보다는, 툴이 만들어내는 결과물인 **테이블 구조(박스 형태의 그림)**를 손으로 그릴 수 있거나 해석할 수 있어야 합니다
    

---

## 💡 교수님 출제 예상 포인트 (Chapter 11)

1. **테이블 설계 (가장 유력):** "학사 관리 시스템을 구축하려 한다. '학생'과 '수강 신청' 정보를 저장하기 위한 테이블들을 설계하고, 테이블 명세서(컬럼명, 데이터 타입, PK, FK 포함)를 작성하시오."
    
    - _정답 포인트:_ 학생 테이블(학번 PK), 과목 테이블(과목코드 PK), 수강 테이블(학번 FK, 과목코드 FK) 형태로 분리 설계.
        
2. **데이터 타입 선택:** "전화번호를 저장하기 위한 적절한 데이터 타입은?" (`VARCHAR2`), "금액을 저장하기 위한 타입은?" (`NUMBER`).
3. **FK의 이해:** "두 테이블 간의 관계를 맺기 위해 자식 테이블에 반드시 포함되어야 하는 컬럼은 무엇인가?" (부모 테이블의 Primary Key).
    
제공해주신 '정리본'에는 있지만 '생성본'에는 누락된 실습 코드들을 실제 코드(Actual Code) 형태로 복원하여 구성했습니다.
