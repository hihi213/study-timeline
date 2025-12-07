---
type: 생각조각
status: inbox
source: 
creation_date: 2025-11-25
---

# 📜 Oracle DB 객체 정의 및 핵심 메커니즘 정리

데이터베이스 객체(Object)는 데이터의 **무결성(Integrity)**, **보안(Security)**, **성능(Performance)**을 보장하기 위한 논리적·물리적 구성 요소입니다. 본 문서는 Oracle SQL 문법을 기준으로 기술합니다.


## 0. 시퀀스

### 1. 기술적 정의 및 차이

오라클 데이터베이스에서 테이블과 시퀀스는 **별개의 객체**로 생성되고 관리됩니다.

- **`MEM_NO` (컬럼):** 데이터를 **저장**하는 공간입니다. 테이블(`TBL_MEMBER`)의 일부이며, 오직 해당 테이블에 종속됩니다.
- **`SEQ_MEM` (시퀀스):** 유일한 숫자를 **생성**하는 객체입니다. 테이블과 무관하게 독립적으로 존재하며, 메모리에 다음 숫자를 캐싱(Caching)하고 있습니다.
    

이름이 다른 이유:

서로 다른 객체이기 때문에 관리 차원에서 명명 규칙(Naming Convention)을 달리합니다. 보통 SEQ_ 접두어를 붙여 이 객체가 '번호 생성기'임을 명시합니다.

### 2. 실제 개발 흐름 (Development Flow)

개발 단계에서는 아래와 같이 **[설계 -> 생성 -> 활용]** 3단계를 거칩니다.

#### 1단계: 스키마 설계 및 생성 (Storage)

먼저 데이터가 저장될 구조를 만듭니다. 이때는 번호가 어떻게 생성될지 신경 쓰지 않고, **"숫자 타입의 PK가 필요하다"**는 것만 정의합니다.



```SQL
CREATE TABLE TBL_MEMBER (
    MEM_NO NUMBER PRIMARY KEY, -- "여기에 숫자가 들어올 것이다"만 정의
    …
);
```

#### 2단계: 번호 생성기 정의 (Generator)

PK에 들어갈 일련번호를 생성할 별도의 로직(시퀀스)을 만듭니다.


```SQL
CREATE SEQUENCE SEQ_MEM; -- "1부터 시작해서 1씩 증가하는 숫자를 만들겠다"고 정의
```

#### 3단계: 애플리케이션 로직 구현 (Implementation)

실제 데이터가 입력되는 시점(`INSERT`)에, 개발자가 SQL을 통해 두 객체를 **논리적으로 연결(Binding)**합니다.

- **개발자 의도:** "`SEQ_MEM`에서 다음 번호를 가져와서 `TBL_MEMBER`의 `MEM_NO` 컬럼에 넣어라."
    



```SQL
INSERT INTO TBL_MEMBER (MEM_NO, …)
VALUES (SEQ_MEM.NEXTVAL, …);
--      ^^^^^^^^^^^^^^^
--      여기서 시퀀스 객체를 호출하여 값을 받아온 뒤, 테이블 컬럼에 할당합니다.
```

### 3. 실무적 이점 (Decoupling)

이렇게 분리해 두면 유지보수 시 유리합니다.

- **예시:** 데이터를 모두 지우고(`TRUNCATE TABLE`) 번호를 다시 1번부터 시작하고 싶을 때, 테이블을 건드리지 않고 **시퀀스만 재생성**하거나 값을 초기화하면 됩니다.

## 1. 제약 조건 (Constraints)

데이터의 정확성과 일관성(무결성)을 보장하기 위해 테이블에 설정하는 강제 규칙입니다. 데이터 입력(`INSERT`) 및 수정(`UPDATE`) 할때마다 **엔진 레벨에서 실시간 검증**을 수행합니다.

### 🛠️ 기본 문법 구조

> **Note:** `CONSTRAINT 제약명`은 에러 발생 시 식별을 위한 이름표입니다. 생략 시 Oracle이 임의의 이름(SYS_C…)을 부여합니다.

```SQL
CREATE TABLE 테이블명 (
    -- [1] 컬럼 레벨 정의: 컬럼 선언과 동시에 명시 
    컬럼명 데이터타입 [CONSTRAINT 제약명] 제약유형,
    
    -- [2] 테이블 레벨 정의: 컬럼 선언 후 하단에 명시 
    컬럼명 데이터타입,
    [CONSTRAINT 제약명] 제약유형 (적용컬럼) [옵션]
);
```

> 컬럼레벨과 테이블레벨은 가독성을 위한 표기 차이, 기능의 차이는 x
### 🧩 제약 유형 및 특징

1. **`PRIMARY KEY` (PK):** 유일성(Unique) + 필수입력(Not Null). 테이블당 1개만 설정 가능하며, 선언 시 **Unique Index**가 자동 생성됩니다.
2. **`FOREIGN KEY` (FK):** 참조 무결성 보장. 부모 테이블의 PK나 UK를 참조하며, 부모에 없는 값은 입력할 수 없습니다.
3. **`UNIQUE` (UK):** 중복 값을 허용하지 않습니다. 단, Oracle에서는 **`NULL`의 중복 입력을 허용**합니다.
4. **`CHECK`:** 데이터가 만족해야 하는 구체적인 도메인 조건을 정의합니다. (예: `salary > 0`). `NULL`은 검사하지 않습니다.
5. **`NOT NULL` (NN):** 반드시 값이 존재해야 합니다. (컬럼 레벨에서만 정의 가능)
### ⚙️ 외래키(FK) 삭제 옵션 (`ON DELETE`)

부모 데이터 삭제 시, 이를 참조하는 자식 데이터의 처리 방식입니다.

- **`CASCADE`:** 자식 데이터도 함께 **자동 삭제**됩니다.
- **`SET NULL`:** 자식 데이터의 참조 컬럼 값을 **NULL로 변경**합니다.
- **생략 (No Action):** 자식 데이터가 존재하면 부모 데이터를 **삭제할 수 없습니다** (무결성 에러 발생).

> [!note]- 제약 조건 생성 (컬럼/테이블 레벨) 예시
>
> ```SQL
> CREATE TABLE employees (
>     -- [1] 컬럼 레벨 정의: 컬럼 선언과 동시에 제약 조건 명시
>     emp_id      NUMBER         CONSTRAINT pk_emp_id   PRIMARY KEY,
>     emp_name    VARCHAR2(50)   CONSTRAINT nn_emp_name NOT NULL,
>     dept_id     NUMBER,
>     email       VARCHAR2(100),
>     salary      NUMBER,
> 
>
> -- [2] 테이블 레벨 정의: 모든 컬럼 선언 후 하단에 명시
> -- 유니크 제약 조건 (이메일 중복 불가)
> CONSTRAINT uk_emp_email UNIQUE (email),
>
> -- 체크 제약 조건 (급여는 0보다 커야 함)
> 
> CONSTRAINT ck_emp_salary CHECK (salary > 0),
>
> -- 외래키 제약 조건 (부모 테이블 참조)
> 
> CONSTRAINT fk_dept_id FOREIGN KEY (dept_id)
> 
> REFERENCES departments(dept_id)
> 
> ON DELETE SET NULL -- 부모 데이터 삭제 시 자식 값을 NULL로 변경
> 
> 
> 
> );
> 
> ```
---

## 2. 프로시저 (Procedures)

복잡한 비즈니스 로직을 DB 내에 저장하여 **여러 쿼리를 하나의 트랜잭션으로 일괄 처리**하기 위한 절차적 객체입니다.

### 🎯 핵심 메커니즘

- **트랜잭션 제어:** 내부에서 `COMMIT`, `ROLLBACK` 수행이 가능하여 데이터 상태 변경(DML) 작업에 최적화되어 있습니다.
- **반환값 없음:** `RETURN` 문을 사용하지 않으며, 결과는 `OUT` 파라미터를 통해 외부로 전달합니다.
	- 프로시저는 `RETURN`으로 값을 던지지 않아요 함수는 `RETURN 값;`으로 결과를 던지지만, 프로시저는 **`OUT` 파라미터에 값을 대입**하는 것으로 끝납니다
### 🛠️ 기본 문법 구조
```SQL
CREATE OR REPLACE PROCEDURE 프로시저명 
( 
	파라미터명 [IN | OUT | IN OUT] 데이터타입 
)
IS -- (또는 AS) 선언부의 시작
    [변수 선언부]
BEGIN
    [실행부 (DML, 트랜잭션)]
EXCEPTION
    [예외 처리부]
END;
/
```
### 🧩 구성 요소 분해

-  파라미터 정의 (선택): 데이터의 흐름을 결정합니다.
    - **`IN` (기본값):** 외부 값을 프로시저 내부로 읽어옵니다 (Read Only).
    - **`OUT`:** 내부에서 처리된 결과를 외부(호출환경)로 내보냅니다 (Write Only).
	- **`IN OUT` (Read-Write):** IN+OUT

> [!note]- 프로시저(DML 및 트랜잭션 처리) 생성 예시
>
>
>
> ``` SQL
> CREATE OR REPLACE PROCEDURE update_emp_salary
> (
>     p_emp_id   IN  NUMBER,       -- [입력] 사원 번호
>     p_rate     IN  NUMBER,       -- [입력] 인상률 (예: 1.1)
>     p_message  OUT VARCHAR2      -- [출력] 결과 메시지
> )
> IS 
>     -- 예외 처리를 위한 사용자 정의 예외 선언
>     e_invalid_rate EXCEPTION;
> BEGIN
>     -- 입력값 검증 로직
>     IF p_rate <= 1 THEN
>         RAISE e_invalid_rate;
>     END IF;
>     
> -- 급여 인상 로직 (DML)
> UPDATE employees
> SET salary = salary * p_rate
> WHERE emp_id = p_emp_id;
> 
> -- 결과 확인 및 트랜잭션 처리
> 
> IF SQL%ROWCOUNT > 0 THEN
> 
> COMMIT; -- 변경 사항 저장
> 
> p_message := '성공: 급여가 인상되었습니다.';
> 
> ELSE
> 
> ROLLBACK;
> 
> p_message := '실패: 해당 사원이 존재하지 않습니다.';
> 
> END IF;
>
> EXCEPTION
> 
> WHEN e_invalid_rate THEN
> 
> p_message := '오류: 인상률은 1보다 커야 합니다.';
> 
> WHEN OTHERS THEN
> 
> ROLLBACK; -- 기타 오류 발생 시 원복
> 
> p_message := '시스템 오류 발생';
> 
> END;
> 
> /
> ```
---

## 3. 함수 (Functions)

특정 연산을 수행하고 **반드시 하나의 값(Value)을 반환**하는 객체입니다.

### 🎯 핵심 메커니즘

- **표현식 활용:** SQL 문장(`SELECT` 리스트, `WHERE` 절 등) 내에서 변수처럼 사용됩니다.
- **DML 제한:** 조회(`FETCH`) 단계에서 실행되므로, 함수 내부에서 **테이블의 상태를 변경(`INSERT`, `UPDATE`, `DELETE`)하는 것은 원칙적으로 금지**됩니다. ^t027yl
### 🛠️ 기본 문법 구조

```SQL
CREATE OR REPLACE FUNCTION 함수명 ( p_param IN NUMBER )
RETURN VARCHAR2  -- [필수] 반환 데이터 타입 명시 (크기 지정 불가)
IS -- (또는 AS) 선언부의 시작
	[변수 선언부]
BEGIN
    [실행부: 연산 수행]
    RETURN 변수; -- [필수] 최종 값 반환
END;
/
```

> [!note]- 함수(값 반환) 생성 예시
>
>
>
> ```SQL
> CREATE OR REPLACE FUNCTION get_annual_salary
> ( 
>     p_salary  IN NUMBER,    -- 월급
>     p_bonus   IN NUMBER     -- 보너스
> )
> RETURN NUMBER  -- 반환 타입 명시 (크기 지정 불가)
> IS 
>     v_total NUMBER;
> BEGIN
>     -- 연봉 계산 로직 (NULL 처리 포함)
>     -- NVL 함수: 값이 NULL일 경우 0으로 대체
>     v_total := (NVL(p_salary, 0) * 12) + NVL(p_bonus, 0);
>     
>     RETURN v_total; -- 계산된 값 반환
> END;
> /
> ```
---

>[!tip] 선언부(AS)엔 `이름 타입:= 넣을값`, 실행부(BEGIN)에는 `SELECT 조회해넣을값 INTO 넣을변수 FROM..`
>

>[!tip] **한 번에** 두 컬럼을 가져오도록
>SELECT col1, col2 INTO 저장할변수1, 저장할변수2 ...

>[!tip] NULL 여부로 다른 값을 쓸때 - NVL
> NVL( NULL이 아닐때 쓸값, NULL일때 대신 쓸 값 ) …

>[!tip] select에서 데이터를 짝지어주는
> 문법: DECODE(컬럼명, '찾을값1', '바꿀결과1', '찾을값2', '바꿀결과2')
> DECODE(RENT_YN, 'Y', '대여중', 'N', '대여가능')

## 4. 뷰 (Views)

뷰는 물리적인 데이터를 저장하지 않고, **기본 테이블(Base Table)을 조회하는 `SELECT` 문장 자체를 저장**하는 가상 테이블(Virtual Table)입니다.
- **저장 위치:** 사용자가 뷰를 생성하면, Oracle 엔진은 데이터 딕셔너리(Data Dictionary)에 해당 뷰의 정의(SQL 쿼리)만을 저장합니다.
- **동작 방식:** 사용자가 뷰를 조회(`SELECT`)하는 순간, Oracle 엔진은 저장된 쿼리를 실행하여 기본 테이블로부터 실시간으로 데이터를 가져옵니다.
1. **보안 (Security):** 민감한 컬럼을 제외하고 필요한 데이터만 노출합니다.
2. **편의성 (Convenience):** 복잡한 조인(Join) 쿼리를 미리 정의하여 재사용성을 높입니다.
3. **독립성 (Independence):** 원본 테이블 구조가 변경되어도 뷰의 정의만 수정하면 애플리케이션에 영향을 주지 않습니다.

### 🛠️ 기본 문법 구조
```SQL
CREATE [OR REPLACE] [FORCE | NOFORCE] VIEW 뷰이름
AS
SELECT 쿼리문…
[WITH READ ONLY]        -- DML(수정/삭제) 불가 설정
[WITH CHECK OPTION];    -- 뷰의 WHERE 조건에 위배되는 데이터 입력/변경 차단 - 예: `dept_id = 10`인 부서원만 보여주는 뷰에서, 사용자가 `dept_id`를 20으로 변경(`UPDATE`)하려고 하면 차단됩니다.
```

> [!NOTE]- 생성 옵션: `FORCE` vs `NOFORCE`
>
> 뷰를 생성할 때 **기본 테이블(참조하는 테이블)의 존재 여부**를 Oracle 엔진이 어떻게 처리할지 결정하는 옵션입니다.
>
> ### 2.1 `NOFORCE` (기본값)
>
> 기본 테이블이 **반드시 존재해야만** 뷰가 생성됩니다.
>
> - **동작:** Oracle 엔진은 뷰 생성 시점에 `FROM` 절에 명시된 테이블이 실제로 존재하는지, 사용자에게 접근 권한이 있는지 검증합니다.
> - **결과:** 테이블이 없거나 권한이 부족하면 **에러가 발생하며 뷰가 생성되지 않습니다.**
> - **사용 권장:** 데이터 무결성을 위해 일반적인 상황에서는 사용자가 이 옵션(생략 시 적용)을 사용합니다.
>     
> 
> ### 2.2 `FORCE`
>
> 기본 테이블의 **존재 여부와 상관없이** 강제로 뷰를 생성합니다.
>
> - **동작:** 기본 테이블이 없더라도 Oracle 엔진은 뷰 객체를 생성합니다. 단, 해당 뷰의 상태는 **'INVALID(유효하지 않음)'** 상태로 저장됩니다.
> - **상태 변경:** 이후 사용자가 기본 테이블을 생성하면, 뷰 조회 시점에 엔진이 자동으로 재컴파일을 수행하여 **'VALID(유효)'** 상태로 전환합니다.
> - **사용 목적:**
>     
>     1. **배포/마이그레이션 스크립트:** 테이블 생성 순서와 관계없이 뷰 작성 스크립트를 먼저 실행해야 하는 등 의존성 관리가 복잡할 때 개발자가 사용합니다.
>     2. **오프라인 개발:** 참조할 테이블이 아직 운영 DB에 생성되지 않았지만, 미리 뷰를 정의해 두어야 할 때 사용합니다.
>

> [!note]- 단순 뷰 vs 복합 뷰 상세 비교
>
> ## 1. 정의 및 핵심 차이
>
> 뷰를 정의하는 쿼리문(SELECT)의 복잡도에 따라 구분하며, 가장 큰 차이점은 DML(INSERT, UPDATE, DELETE) 수행 가능 여부입니다.
>
> |**구분**|**단순 뷰 (Simple View)**|**복합 뷰 (Complex View)**|
> |---|---|---|
> |**참조 테이블 수**|1개 (하나의 테이블만 참조)|2개 이상 (JOIN 사용)|
> |**데이터 가공**|없음 (컬럼 그대로 조회)|함수 사용, `GROUP BY`, `DISTINCT` 등 포함|
> |**DML 수행**|**가능** (조건부)|**불가능** (원칙적)|
> |**Row Mapping**|뷰의 1개 행 <code>=</code> 원본의 1개 행|뷰의 1개 행 <code>!=</code> 원본의 1개 행 (N:1 등)|
>
> ---
>
> ## **2. 단순 뷰 (Simple View)**
>
> - **특징:** 하나의 기본 테이블에서 데이터를 가져오며, 데이터를 그룹화하거나 변형하지 않습니다.
>     
> - **DML 동작 메커니즘:**
>     
>     - 뷰와 원본 테이블의 행(Row)이 1:1로 매핑되므로, Oracle 엔진은 뷰에 대한 수정을 원본 테이블의 특정 행 수정으로 변환하여 실행합니다.
>         
>     - **주의사항:** 뷰에 포함되지 않은 컬럼이 원본 테이블에서 `NOT NULL` 제약조건을 가지고 있다면, 뷰를 통한 `INSERT`는 불가능합니다 (Engine이 누락된 필수 값을 채울 수 없기 때문).
>         
> - **예시:**
>     
>     
>     
>     ```SQL
>     -- [단순 뷰] 1개의 테이블, 가공 없음
>     CREATE VIEW v_emp_simple AS
>     SELECT emp_id, emp_name, salary 
>     FROM employees;
>     -- 결과: 사용자는 이 뷰를 통해 salary를 수정(UPDATE)할 수 있음
>     ```
>     
> 
> ---
>
> ## **3. 복합 뷰 (Complex View)**
>
> - **특징:** 여러 테이블을 조인하거나, 집계 함수(`SUM`, `AVG`) 및 그룹핑(`GROUP BY`)을 사용하여 데이터를 가공해 보여줍니다.
>     
> - **DML 제약 이유:**
>     
>     - **논리적 모호성:** 예를 들어 `SUM(salary)` 컬럼의 값을 뷰에서 수정하려 할 때, Oracle 엔진은 원본 테이블의 구성원 중 누구의 급여를 변경해야 합계가 맞는지 판단할 수 없습니다. 따라서 엔진은 데이터 무결성 보호를 위해 DML을 차단합니다.
>         
> - **예시:**
>     
>     
>     
>     ```SQL
>     -- [복합 뷰] 2개 테이블 조인 + 그룹 함수 사용
>     CREATE VIEW v_dept_sal_avg AS
>     SELECT d.dept_name, AVG(e.salary) as avg_sal
>     FROM employees e
>     JOIN departments d ON e.dept_id <code>=</code> d.dept_id
>     GROUP BY d.dept_name;
>     -- 결과: 사용자는 avg_sal 값을 수정(UPDATE)할 수 없음
>     ```
>

> [!note]- 뷰(가상 테이블) 생성 예시
>
>
>
> ```SQL
> -- 보안 및 편의성을 위한 뷰 생성
> CREATE OR REPLACE VIEW view_emp_details
> AS
> SELECT 
>     e.emp_name, 
>     d.dept_name, 
>     e.job_title
> FROM employees e
> JOIN departments d 
>   ON e.dept_id = d.dept_id
> WHERE e.salary > 3000
> WITH READ ONLY; -- 사용자는 이 뷰를 통해 데이터를 수정할 수 없음
> ```
---

## 5. 인덱스 (Indexes)

검색 속도 향상을 위해 컬럼 값과 물리적 주소(ROWID)를 **Key-Value 쌍으로 저장하는 B-Tree 구조**의 객체입니다. 테이블과는 별도의 저장 공간(Segment)을 가집니다.

- **Trade-off (성능 영향):**
    - **조회 성능 향상:** `WHERE` 조건 검색 시 Full Scan 대신 Index Scan을 수행하여 I/O를 줄입니다.
    - **쓰기 성능 저하:** 데이터가 변경(DML)될 때마다 인덱스 트리도 재정렬해야 하므로 오버헤드가 발생합니다.
- **복합 인덱스 주의사항:** 두 개 이상의 컬럼(A+B)으로 구성된 경우, **선행 컬럼(A)**이 `WHERE` 절에 누락되면 인덱스 효율이 급격히 떨어집니다.
### 🛠️ 기본 문법 구조

```SQL
-- [1] 일반 B-Tree 인덱스 (기본값)
CREATE [UNIQUE | BITMAP] INDEX 인덱스명 ON 테이블명 (컬럼명 [ASC|DESC]);
```

- **`UNIQUE`:** 중복 값을 허용하지 않습니다. 생략 시 `NON-UNIQUE`가 적용됩되어 중복값이 저장됩니다
- **`BITMAP`:** 성별(남/여)처럼 카디널리티(Cardinality, 데이터의 종류 수)가 낮을 때 사용. 기본값은 `B-TREE`
- (선택) **`DESC`:** 인덱스를 내림차순(큰->작은_으로 생성합니다. 최신 날짜나 높은 점수 순으로 정렬하여 조회할 때 유리합니다. 기본값은 오름차순 ASC

> [!note]- 인덱스(B-Tree, Bitmap) 생성 예시
>
>
> ```Java
> -- [1] 일반 B-Tree 인덱스 (검색 성능 향상)
> -- 이름으로 검색하는 경우가 많을 때 생성
> CREATE INDEX idx_emp_name ON employees(emp_name);
> 
>
> -- [2] 복합 인덱스 (두 개 이상의 컬럼 결합)
> 
> -- 부서번호와 직급을 동시에 조건으로 사용할 때 효율적
> 
> CREATE INDEX idx_dept_job ON employees(dept_id, job_id);
>
> -- [3] 비트맵 인덱스 (카디널리티가 낮은 경우)
> 
> -- 성별(M/F)과 같이 값의 종류가 적은 경우 유리
> 
> CREATE BITMAP INDEX idx_emp_gender ON employees(gender);
> ```
---

## 6. 암호화 (TDE: Transparent Data Encryption)

데이터 파일(디스크) 자체를 암호화하여 OS 레벨에서의 파일 탈취를 방어하는 기술입니다. SQL 조회 시에는 자동으로 복호화됩니다.

### 🛠️ 기본 문법 구조

```SQL
컬럼명 데이터타입 ENCRYPT [USING '알고리즘'] [SALT | NO SALT]
```

```SQL
-- ① 컬럼 암호화 (테이블 생성 시)
CREATE TABLE 테이블명 (
    -- [Salt] 보안성 높음, 인덱스 불가 (기본값)
    주민번호 VARCHAR2(13) ENCRYPT USING 'AES256' SALT,
    
    -- [No Salt] 검색 가능, 인덱스 가능
    전화번호 VARCHAR2(11) ENCRYPT USING 'AES256' NO SALT
);

-- ② 테이블스페이스 암호화 (저장 공간 전체)
CREATE TABLESPACE 테이블스페이스명
DATAFILE '파일경로.dbf' SIZE 100M
ENCRYPTION USING 'AES256' DEFAULT STORAGE(ENCRYPT);
```
### 🧩 구성 요소 분해

1. **`ENCRYPT`**: 암호화를 하겠다는 필수 선언입니다.
2. **`USING '알고리즘'`**: (선택) 사용할 암호화 방식을 지정합니다.
    
    - 생략 시: DB 파라미터에 설정된 기본값(주로 `AES192`)이 적용됩니다.
    - 종류: `'AES128'`, `'AES192'`, `'AES256'`, `'3DES168'` 등.
3. 암호화 시 **Salt(난수)** 첨가 여부가 인덱스 생성 가능 여부를 결정합니다.
	1. **`SALT` (기본값):** 원본 데이터에 난수를 섞어 암호화합니다. 보안성은 높으나, 같은 값도 매번 다른 암호문이 되므로 **인덱스 생성이 불가능**합니다.
	2. **`NO SALT`:** 같은 평문은 항상 같은 암호문으로 변환됩니다. 보안성은 상대적으로 낮으나 **인덱스 생성이 가능**하여 검색(`WHERE`) 조건으로 사용할 수 있습니다.

> [!note]- 암호화(TDE) 적용 예시
>
> ```SQL
> CREATE TABLE secure_members (
>     id NUMBER PRIMARY KEY,
>     name VARCHAR2(50),
>     
>     -- [1] Salt 적용 (기본값)
>     -- 보안성이 높으나, 인덱스 생성이 불가능하여 검색 조건 사용 불가
>     ssn VARCHAR2(13) ENCRYPT USING 'AES256' SALT,
>     
>     -- [2] No Salt 적용
>     -- 동일한 평문은 동일한 암호문이 되므로 인덱스 생성 및 검색 가능
>     phone VARCHAR2(11) ENCRYPT USING 'AES256' NO SALT
> );
> ```
---


## 7. 트리거 (Triggers)

특정 테이블에 `INSERT`, `UPDATE`, `DELETE`와 같은 **이벤트가 발생할 때, 데이터베이스가 자동으로 실행(Fire)**하는 특수한 형태의 프로시저입니다. 주로 데이터 이력 관리(Audit), 복잡한 데이터 무결성 검증, 자동 백업 로직 등에 사용됩니다.

### 🎯 핵심 메커니즘

- **자동 실행:** 사용자가 직접 호출(`EXECUTE`)할 수 없으며, 지정된 이벤트(DML 등)가 발생하면 오라클 엔진이 자동으로 수행합니다.
- **실행 시점 (`TIMING`):**
    - **`BEFORE`:** 실제 데이터가 변경되기 **직전**에 실행 (데이터 검증에 유리).
    - **`AFTER`:** 실제 데이터가 변경된 **직후**에 실행 (이력 로그 남기기에 유리).
- **실행 레벨 (`LEVEL`):**
    - **행 트리거 (`FOR EACH ROW`):** 변경되는 **각 행(Row)마다** 실행됩니다. (예: 5행 수정 시 5번 실행). `:OLD`, `:NEW` 변수 사용 가능.
    - **문장 트리거 (생략 시):** 변경되는 행의 개수와 관계없이 **SQL 문장당 1번**만 실행됩니다.
        

### 🛠️ 기본 문법 구조


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
	- `INSTEAD OF` DML를 실행하지 않고 대신 수행되는 작업
		- 뷰에 설정해 뷰에대한 DML를 원본테이블를 수정하는 트리거로 사용(권장x)
	- `BEFORE` :실제 데이터가 변경되기 **직전**에 실행
	- `AFTER` :실제 데이터가 변경된 **직후**에 실행
- **이벤트:** `INSERT`, `UPDATE`, `DELETE`
- **`FOR EACH ROW`**: 변경되는 행마다 실행
	- 없을시, 행개수와 상관없이 sql문장당 한번만 실행
	- 이 옵션이 있어야 `:OLD`, `:NEW` 변수를 사용할 수 있습니다.
- **`:OLD` vs `:NEW` 변수 (매우 중요)**
    - `:OLD.컬럼명`: 변경 **전** 데이터
    - `:NEW.컬럼명`: 변경 **후** 새 데이터


### 🧩 가상 레코드 (:OLD vs :NEW)

행 트리거(`FOR EACH ROW`) 내부에서는 **변경 전후의 데이터에 접근**할 수 있는 가상 변수를 제공합니다.

|**이벤트**|**:OLD (변경 전 값)**|**:NEW (변경 될 값)**|**비고**|
|---|---|---|---|
|**INSERT**|`NULL`|**입력할 값**|새 데이터가 들어오므로 OLD는 없음|
|**UPDATE**|**수정 전 값**|**수정 후 값**|전/후 값 모두 접근 가능|
|**DELETE**|**삭제 전 값**|`NULL`|데이터가 사라지므로 NEW는 없음|

> [!note]- 트리거(데이터 이력 자동 백업) 생성 예시
>
> **시나리오:** 사원 테이블(`employees`)에서 급여(`salary`)가 변경되거나 사원이 삭제될 때, 변경 전 데이터를 `emp_history` 테이블에 자동으로 백업합니다.
> ```SQL
> CREATE OR REPLACE TRIGGER trg_emp_audit
>     BEFORE UPDATE OR DELETE ON employees -- 수정 또는 삭제 시 작동
>     FOR EACH ROW                         -- 각 행마다 실행
> BEGIN
>     -- 업데이트 시: 급여가 변경된 경우에만 이력 저장
>     IF UPDATING AND (:OLD.salary <> :NEW.salary) THEN
>         INSERT INTO emp_history (emp_id, old_salary, new_salary, change_date, action)
>         VALUES (:OLD.emp_id, :OLD.salary, :NEW.salary, SYSDATE, 'UPDATE');
>     END IF;
> -- 삭제 시: 삭제되는 사원 정보 백업
> IF DELETING THEN
>     INSERT INTO emp_history (emp_id, old_salary, new_salary, change_date, action)
>     VALUES (:OLD.emp_id, :OLD.salary, NULL, SYSDATE, 'DELETE');
> END IF;
> END;
> /
> ```

## 💭 나의 추가적 생각/질문
[[DBMS 심층 분석_ 엔진 메커니즘과 SQL 최적화|함수와 프로시저의 차이_DBMS 심층분석_ 엔진 매커니즘과 sql 최적화]]
 ^4k03am
 [[Oracle(PL,SQL) 변수 선언 부분에 사용할 수 있는 변수의 종류|Oracle(PL,SQL) 변수 선언 부분에 사용할 수 있는 변수의 종류]]
[[00_Inbox/오라클 DDL,DML정리.md|오라클 DDL,DML정리]]
