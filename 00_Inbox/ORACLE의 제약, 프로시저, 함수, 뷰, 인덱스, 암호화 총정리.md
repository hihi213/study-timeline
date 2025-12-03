---
type: 생각조각
status: inbox
source: 
creation_date: 2025-11-25
---
# 📜 Oracle DB 객체 정의 및 핵심 메커니즘 정리

데이터베이스 객체(Object)는 데이터의 무결성(Integrity), 보안(Security), 성능(Performance)을 보장하기 위한 핵심 구성 요소입니다. 아래 내용은 Oracle SQL 문법을 기준으로 작성되었습니다.

---

## 1. 제약 조건 (Constraints)

데이터의 **무결성(정확성 및 일관성)**을 보장하기 위한 강제 규칙입니다. 데이터 입력(`INSERT`) 및 수정(`UPDATE`) 할때 엔진 레벨에서 실시간 검증이 수행됩니다.

### 🛠️ 정의 방식 및 문법

제약 조건은 컬럼 정의 시 바로 선언하는 **컬럼 레벨**과, 테이블 정의 마지막에 몰아서 선언하는 **테이블 레벨**이 있습니다.

- **기본 문법 구조**

```SQL
CREATE TABLE 테이블명 (
    -- [컬럼 레벨] 컬럼 정의와 동시에 선언 (간단한 제약 조건)
    컬럼명1 데이터타입 CONSTRAINT 제약조건명 PRIMARY KEY,
    컬럼명2 데이터타입 NOT NULL,

    -- [테이블 레벨] 모든 컬럼 정의 후 하단 선언 (복합키, 외래키 권장)
    CONSTRAINT 제약조건명 FOREIGN KEY (컬럼명2) 
        REFERENCES 부모테이블(참조컬럼) ON DELETE CASCADE
);
```

### 🔑 주요 키워드 및 동작 원리
- **`PRIMARY KEY` (기본키):** 유일성(Unique)과 `NOT NULL` 속성을 동시에 만족합니다. 테이블당 하나만 존재하며, 선언 시 **자동으로 Unique Index가 생성**됩니다.
- **`FOREIGN KEY` (외래키):** 참조 무결성을 보장합니다.
    - `ON DELETE CASCADE`: 부모 데이터 삭제 시, 자식 데이터도 함께 삭제합니다.
    - `ON DELETE SET NULL`: 부모 데이터 삭제 시, 자식 데이터의 값을 NULL로 변경합니다.
- **`CHECK`:** 도메인 무결성을 보장합니다. `NULL`은 체크 대상에서 제외됩니다(조건을 통과한 것으로 간주).
    - 예: `CHECK (gender IN ('M', 'F'))`

| **제약 조건**         | **설명 및 특징**                                                                                                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`PRIMARY KEY`** | **유일성(Unique) + `NOT NULL`**. 테이블당 1개만 존재 가능하며, 선언 시 **Unique Index**가 자동 생성됩니다.                                                                                                 |
| **`FOREIGN KEY`** | **참조 무결성** 보장. 부모 테이블에 없는 값은 자식 테이블에 입력 불가합니다.<br><br>  <br><br>• `ON DELETE CASCADE`: 부모 삭제 시 자식도 자동 **삭제**<br><br>  <br><br>• `ON DELETE SET NULL`: 부모 삭제 시 자식 값을 **NULL**로 변경 |
| **`UNIQUE`**      | 중복 값을 허용하지 않음. 단, **`NULL`은 중복 입력 가능**합니다.                                                                                                                                       |
| **`CHECK`**       | 특정 조건(도메인)을 만족해야 함. `NULL`은 검사 대상에서 제외됩니다.<br><br>  <br><br>_(예: `CHECK (SALARY > 0)`)_                                                                                          |
| **`NOT NULL`**    | 반드시 값이 입력되어야 함. (주로 컬럼 레벨에서 정의)                                                                                                                                                  |

---

## 2. 프로시저 (Procedures)
주로 데이터의 상태를 변경(DML)하는 흐름 제어를 담당합니다.
복잡한 비즈니스 로직을 DB 내에 저장하여 **여러 쿼리를 하나의 트랜잭션으로 일괄 처리**하기 위한 객체입니다. 리턴값이 없으며(파라미터로 반환), `EXEC` 명령어로 실행합니다.

### 🛠️ 기본 문법 구조

```SQL
CREATE OR REPLACE PROCEDURE 프로시저명
(
    p_input  IN  VARCHAR2,    -- 입력 파라미터(변수)
    p_output OUT VARCHAR2     -- 반환 파라미터
    파라미터명3 IN OUT 데이터타입    -- 입출력 파라미터
)
IS
    -- [변수 선언부] 내부 변수, 커서, 예외 선언
    v_temp VARCHAR2(100);
BEGIN
    -- [실행부] 비즈니스 로직 및 트랜잭션 제어
    UPDATE 테이블명 SET 컬럼 = p_input WHERE 조건;
    COMMIT; -- 프로시저는 트랜잭션 제어(COMMIT/ROLLBACK)가 가능함
EXCEPTION
    -- [예외 처리부]
    WHEN NO_DATA_FOUND THEN
        ROLLBACK;
        p_output := 'Error';
END;
/
```

### 🔑 파라미터 모드

- **`IN` (Read-only):** 외부 값을 프로시저 내부로 전달받음. (기본값)
- **`OUT` (Write-only):** 로직 처리 후 결과를 호출 환경으로 반환합니다. 실행 중에는 값이 할당되지 않을 수 있습니다.
- **`IN OUT` (Read-Write):** 값을 받아 가공한 후 다시 반환합니다.
    

---

## 3. 함수 (Functions)
특정 연산을 수행하고 **반드시 하나의 값(Value)을 반환**하는 객체입니다. 프로시저와 달리 SQL 문장(`SELECT`, `WHERE` 절 등) 내에서 사용하기 위해 설계되었습니다.
실행부 내에 반드시 `RETURN` 문이 존재해야 합니다. ^t027yl

### 🛠️ 기본 문법 구조
```SQL
CREATE OR REPLACE FUNCTION 함수명
(
    p_val IN NUMBER
)
RETURN NUMBER -- [필수] 반환 타입 정의 (크기 지정 불가, 타입만 명시)
IS
	-- [변수 선언부] 내부 변수, 커서, 예외 선언
    v_result NUMBER;
BEGIN
	-- [실행부]
    v_result := p_val * 1.1;
    RETURN v_result; -- [필수] 값 반환
END;
/
```

### 💡 핵심 제약 사항

- `RETURN [타입]`: 반환할 데이터 타입을 명시해야 합니다
- **DML 제한:** 함수 내부에서 테이블의 데이터를 변경(`INSERT`, `UPDATE`, `DELETE`)하는 것은 원칙적으로 금지됩니다. (단, `AUTONOMOUS_TRANSACTION` 사용 시 예외적 허용)
    

---

## 4. 뷰 (Views)

물리적인 데이터를 저장하지 않고, `AS` 키워드 뒤의 **SQL 문장(Text) 자체를 저장**하는 가상 테이블입니다. 사용자는 뷰를 테이블처럼 조회하지만, 실제로는 저장된 쿼리가 실행됩니다.

### 🎯 사용 목적 및 특징

1. **보안(Security):** 민감한 컬럼(예: 주민번호)을 제외하고 필요한 데이터만 노출합니다.
2. **단순화(Simplicity):** 복잡한 조인(Join) 쿼리를 미리 정의하여 재사용성을 높입니다.
3. **독립성(Independence):** 원본 테이블 구조가 바뀌어도 뷰의 정의만 수정하면 애플리케이션에 영향을 주지 않습니다.

- **단순 뷰 vs 복합 뷰:**
    - _단순 뷰:_ 하나의 테이블로 구성. 조건 만족 시 DML 가능.
    - _복합 뷰:_ 조인, 그룹함수(`SUM`, `AVG`) 포함. 원칙적으로 **DML(수정/삭제) 불가**
### 🛠️ 기본 문법 구조

```SQL
CREATE OR REPLACE FORCE VIEW 뷰이름
AS
SELECT 컬럼1, 컬럼2 -- 민감 컬럼 제외 가능
FROM 원본테이블
WHERE 조건식
WITH CHECK OPTION CONSTRAINT 제약명;
```
- `FORCE`: 기본 테이블이 없어도 뷰를 컴파일 에러 상태로 미리 생성합니다.
- `WITH READ ONLY`: 데이터 조회만 허용하며 DML을 차단합니다.
- `WITH CHECK OPTION`: 뷰의 조회 조건(`WHERE`)을 벗어나는 데이터 변경을 차단하여 데이터 정합성을 유지합니다.

## 5. 인덱스 (Indexes)

검색 속도 향상을 위해 사용하는 **B-Tree 구조**의 검색용 객체입니다. 테이블과는 별도의 저장 공간(Segment)을 가집니다.
### ⚖️ Trade-off (성능 영향)

- **장점 (조회):** `WHERE` 절 조건 검색 시 Full Table Scan을 방지하고 **Index Range Scan**을 유도하여 속도 향상.
- **단점 (변경):** 데이터가 `INSERT`, `UPDATE`, `DELETE` 될 때마다 인덱스도 재정렬해야 하므로 **쓰기 성능 저하**.

### 🛠️ 기본 문법 구조

```SQL
-- [복합 인덱스] 컬럼 순서가 성능에 결정적 영향을 미침
CREATE [UNIQUE | BITMAP] INDEX 인덱스명 


-- [Unique Index] 중복 불가 (PK 생성 시 자동 생성됨)
CREATE UNIQUE INDEX IDX_EMP_EMAIL ON EMP(EMAIL);

-- [Composite Index] 복합 인덱스 (컬럼 순서가 중요함)
CREATE INDEX IDX_EMP_JOB_DEPT ON EMP(JOB, DEPT_ID);
```

### 🔑 인덱스 종류

- **`BITMAP`:** 데이터 값의 종류(Cardinality)가 적은 경우(예: 성별, Y/N) 사용합니다. 주로 OLAP 환경에서 유리합니다.
- **`UNIQUE`:** 중복 값을 물리적으로 차단합니다. (기본키 생성 시 자동 생성됨)
    

---

## 6. 암호화 (TDE: Transparent Data Encryption)

데이터 파일(디스크) 자체를 암호화하여, OS 차원에서 파일이 탈취되더라도 내용을 볼 수 없게 만드는 기술입니다. 논리적 접근(SQL 조회) 시에는 자동으로 복호화됩니다. 주로 테이블 생성 시 컬럼 정의에 암호화 옵션을 추가하거나, 테이블스페이스 생성 시 적용합니다.

### 🛠️ 기본 문법 구조

```SQL
CREATE TABLE 테이블명 (
    -- [Salt] 기본값. 같은 평문도 다른 암호문으로 저장 (보안성 강화)
    -- [No Salt] 같은 평문은 같은 암호문으로 저장 (인덱스 생성 가능)
    컬럼명 VARCHAR2(100) ENCRYPT USING 'AES256' 'NO SALT'
);
```

- ### **테이블스페이스 암호화 문법**

```SQL
CREATE TABLESPACE 테이블스페이스명
DATAFILE '파일경로.dbf' SIZE 100M
ENCRYPTION USING 'AES256' DEFAULT STORAGE(ENCRYPT);
```

- **주요 키워드 설명**
    - `ENCRYPT`: 해당 컬럼이나 테이블스페이스를 암호화합니다.
    - `USING '알고리즘'`: 암호화에 사용할 알고리즘(AES256, AES192, AES128, 3DES168 등)을 지정합니다.
### ⚠️ 중요 제약: Salt vs No Salt

- **Salt (기본값):** 암호화 시 무작위 값을 섞습니다. 보안성은 높으나, 값이 계속 변하므로 **인덱스 생성이 불가능**합니다.
- `NO SALT`: 암호화 시 솔트(Salt) 값을 추가하지 않습니다. (동일한 입력값에 대해 항상 동일한 암호문을 생성합니다. 보안성은 다소 낮아지나, 인덱스를 생성하려는 암호화 컬럼에는 필수적으로 지정해야 함).

---
## 💭 나의 추가적 생각/질문
[[DBMS 심층 분석_ 엔진 메커니즘과 SQL 최적화|함수와 프로시저의 차이_DBMS 심층분석_ 엔진 매커니즘과 sql 최적화]]
