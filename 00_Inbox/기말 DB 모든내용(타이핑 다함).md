---
type: 생각조각
status: inbox
source:
creation_date: 2025-11-25
---
요청하신 **PDF 59페이지부터 67페이지**까지의 내용은 크게 **'보안을 고려한 인덱스 활용 실습'**과 **'FGA(Fine-Grained Auditing)를 이용한 정밀 감사 실습'** 두 부분으로 나뉩니다.

시험 대비용으로 핵심 실습 내용을 정리해 드립니다.

---

### **1. 보안 관점에서의 인덱스(Index) 활용 실습 [59p~62p]**

인덱스는 검색 속도를 높여주지만, 인덱스 파일 내부에 데이터가 평문으로 정렬되어 저장되므로 보안 취약점이 될 수 있습니다. 따라서 **'무엇을 인덱싱하고, 무엇을 하지 말아야 하는가'**가 핵심입니다.

#### **① 민감 정보 인덱싱 금지 (기본 전략)**

주민번호(`ssn`)와 같은 민감한 컬럼에는 인덱스를 생성하면 안 됩니다. 인덱스 파일을 통한 유출이나 검색 패턴 분석 위험이 있기 때문입니다.

- **실습 내용:** `username` 같은 일반 검색용 컬럼에만 인덱스를 걸고, `ssn`에는 걸지 않습니다1.
    
    
    
    ```SQL
    -- 민감 정보(SSN)에는 인덱스 생성 금지
    -- CREATE INDEX idx_users_ssn ON users(ssn); (X)
    
    -- 일반 검색용 컬럼에만 생성
    CREATE INDEX idx_users_username ON users(username); (O)
    ```
    

#### **② 부분 인덱스 (Partial Index) 활용**

데이터의 전체가 아닌, **유효한(의미 있는) 데이터만 인덱싱**하여 노출 범위를 줄이고 성능을 최적화합니다.

- **실습 내용:** 전화번호가 `NULL`이 아닌(실제 등록된) 고객만 인덱싱합니다2.
    
    
    
    ```SQL
    CREATE INDEX idx_users_phone_nonnull
    ON users(phone)
    WHERE phone IS NOT NULL; -- 전화번호가 있는 사람만 인덱스에 포함
    ```
    

#### **③ 함수 기반 인덱스 (Function-Based Index) 활용**

민감 정보를 통째로 인덱싱하는 대신, **일부만 잘라내거나 가공하여 인덱싱**함으로써 보안성을 높입니다.

- **실습 내용:** 주민번호 전체(`900101-1234567`) 대신, 앞 6자리(생년월일)만 추출하여 인덱스를 생성합니다. 이렇게 하면 **전체 주민번호 노출 없이 생년월일 검색 기능**을 지원할 수 있습니다3333.
    
    
    
    ```SQL
    -- 주민번호 앞 6자리만 인덱싱
    CREATE INDEX idx_users_ssn_prefix
    ON users(SUBSTR(ssn, 1, 6));
    
    -- 검색 시에도 동일한 함수 사용
    SELECT * FROM users WHERE SUBSTR(ssn, 1, 6) = '900101';
    ```
    

---

### **2. FGA (Fine-Grained Auditing) 정밀 감사 실습 [63p~67p]**

단순히 "누가 테이블을 봤다"가 아니라, "누가 '주민번호' 컬럼을 봤다" 또는 **"누가 '연봉 1억 이상'인 데이터를 봤다"**처럼 구체적인 조건에 대해 감시하는 기술입니다.

(※ Oracle Enterprise Edition 기능이며, XE에서는 트리거로 대체 실습했던 부분의 원본 이론입니다.)

#### **① 기본 FGA 정책 생성 (컬럼 감시)**

특정 민감 컬럼(`SSN`)을 조회(`SELECT`)하는 행위를 감시하고 기록합니다.

- **실습 내용:** `DBMS_FGA` 패키지를 사용하여 감시 정책을 등록합니다4.
    
    
    
    ```SQL
    BEGIN
        DBMS_FGA.ADD_POLICY(
            object_schema => 'TEST',         -- 소유자
            object_name   => 'USERS',        -- 대상 테이블
            policy_name   => 'audit_ssn',    -- 정책 이름
            audit_column  => 'SSN',          -- 감시할 컬럼 (주민번호)
            statement_types => 'SELECT'      -- 감시할 명령어 (조회)
        );
    END;
    /
    ```
    
- **로그 확인:** `DBA_FGA_AUDIT_TRAIL` 뷰에서 누가 언제 조회했는지 확인 가능합니다
    

#### **② 조건 기반 FGA (고급 실습)**

모든 조회를 감시하는 것이 아니라, **특정 조건(예: 급여가 10,000 초과)을 만족하는 데이터**에 접근할 때만 로그를 남깁니다.

- **실습 내용:** 조건 함수(Policy Function)를 먼저 만들고, 이를 정책에 연결합니다
    
    
    
    ```SQL
    -- 1. 조건 함수 생성 (급여가 10000 넘는 경우만 리턴)
    CREATE OR REPLACE FUNCTION salary_check(…) RETURN VARCHAR2 IS
    BEGIN
        RETURN 'salary > 10000';
    END;
    /
    
    -- 2. 정책 등록 시 함수 연결
    BEGIN
        DBMS_FGA.ADD_POLICY(
            …
            policy_name     => 'high_salary_audit',
            policy_function => 'salary_check', -- 위에서 만든 함수 연결
            …
        );
    END;
    /
    ```
    

---

요약하자면:

59~67페이지는 **"인덱스는 민감 정보를 피해 최소한으로 만들거나 가공해서 만들고(Index Security), 정말 중요한 데이터 접근은 FGA로 콕 집어서 감시해라(Auditing)"**라는 내용의 실습입니다.