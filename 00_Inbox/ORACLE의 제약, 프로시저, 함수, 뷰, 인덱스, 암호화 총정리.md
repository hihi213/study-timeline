---
type: 생각조각
status: inbox
source: 
creation_date: 2025-11-25
---

# 📜 Oracle DB 객체 정의 및 핵심 메커니즘 정리

데이터베이스 객체(Object)는 데이터의 **무결성(Integrity)**, **보안(Security)**, **성능(Performance)**을 보장하기 위한 논리적·물리적 구성 요소입니다. 본 문서는 Oracle SQL 문법을 기준으로 기술합니다.

---

## 1. 제약 조건 (Constraints)

데이터의 정확성과 일관성(무결성)을 보장하기 위해 테이블에 설정하는 강제 규칙입니다. 데이터 입력(`INSERT`) 및 수정(`UPDATE`) 할때 **엔진 레벨에서 실시간 검증**을 수행합니다.

### 🛠️ 기본 문법 구조

> 컬럼레벨과 테이블레벨은 가독성을 위한 표기 차이, 기능의 차이는 x

```SQL
CREATE TABLE 테이블명 (
    -- [1] 컬럼 레벨 정의: 컬럼 선언과 동시에 명시 
    컬럼명 데이터타입 [CONSTRAINT 제약명] 제약유형,
    
    -- [2] 테이블 레벨 정의: 컬럼 선언 후 하단에 명시 
    컬럼명 데이터타입,
    [CONSTRAINT 제약명] 제약유형 (적용컬럼) [옵션]
);
```

> **Note:** `CONSTRAINT 제약명`은 에러 발생 시 식별을 위한 이름표입니다. 생략 시 Oracle이 임의의 이름(SYS_C…)을 부여합니다.

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
    

---

## 2. 프로시저 (Procedures)

복잡한 비즈니스 로직을 DB 내에 저장하여 **여러 쿼리를 하나의 트랜잭션으로 일괄 처리**하기 위한 절차적 객체입니다.

### 🎯 핵심 메커니즘

- **트랜잭션 제어:** 내부에서 `COMMIT`, `ROLLBACK` 수행이 가능하여 데이터 상태 변경(DML) 작업에 최적화되어 있습니다.
- **반환값 없음:** `RETURN` 문을 사용하지 않으며, 결과는 `OUT` 파라미터를 통해 외부로 전달합니다.
    

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

> [!note]- 프로시저 예제 코드
> >
> > ```SQL
> > CREATE OR REPLACE PROCEDURE update_salary_proc
> > (
> >      p_emp_id   IN  NUMBER,       -- [입력] 사원 번호
> >      p_amount   IN  NUMBER,       -- [입력] 인상액
> >      p_result   OUT VARCHAR2      -- [출력] 결과 메시지
> > )
> > IS 
> >      v_current_sal NUMBER;
> > BEGIN
> >      -- 1. 급여 업데이트
> >      UPDATE employees 
> >      SET salary = salary + p_amount 
> >      WHERE employee_id = p_emp_id;
> >      
> >      -- 2. 트랜잭션 확정
> >      IF SQL%ROWCOUNT > 0 THEN
> >          COMMIT;
> >          p_result := 'Success';
> >      ELSE
> >          ROLLBACK;
> >          p_result := 'No Data Found';
> >      END IF;
> > EXCEPTION
> >      WHEN OTHERS THEN
> >          ROLLBACK;
> >          p_result := 'Error: ' || SQLERRM;
> > END;
> > /
> > ```

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

---

## 4. 뷰 (Views)

물리적인 데이터를 저장하지 않고, **SQL 문장(쿼리 정의) 자체를 저장**하는 가상 테이블입니다.

### 🎯 사용 목적

1. **보안 (Security):** 민감한 컬럼을 제외하고 필요한 데이터만 노출합니다.
2. **편의성 (Convenience):** 복잡한 조인(Join) 쿼리를 미리 정의하여 재사용성을 높입니다.
3. **독립성 (Independence):** 원본 테이블 구조가 변경되어도 뷰의 정의만 수정하면 애플리케이션에 영향을 주지 않습니다.
    

### 🛠️ 기본 문법 구조
```SQL
CREATE [OR REPLACE] [FORCE | NOFORCE] VIEW 뷰이름
AS
SELECT 쿼리문…
[WITH READ ONLY]        -- DML(수정/삭제) 불가 설정
[WITH CHECK OPTION];    -- 뷰의 WHERE 조건에 위배되는 데이터 변경 차단
```

---

## 5. 인덱스 (Indexes)

검색 속도 향상을 위해 컬럼 값과 물리적 주소(ROWID)를 **Key-Value 쌍으로 저장하는 B-Tree 구조**의 객체입니다. 테이블과는 별도의 저장 공간(Segment)을 가집니다.

### ⚖️ Trade-off (성능 영향)

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
- **`DESC`:** 인덱스를 내림차순(큰->작은_으로 생성합니다. 최신 날짜나 높은 점수 순으로 정렬하여 조회할 때 유리합니다. 기본값은 오름차순 ASC
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
	1. **`SALT` (기본값):** 원본 데이터에 난수를 섞어 암호화합니다. 보안성은 높으나, 같은 값도 다른 암호문이 되므로 **인덱스 생성이 불가능**합니다.
	2. **`NO SALT`:** 같은 평문은 항상 같은 암호문으로 변환됩니다. 보안성은 상대적으로 낮으나 **인덱스 생성이 가능**하여 검색(`WHERE`) 조건으로 사용할 수 있습니다.
---
## 💭 나의 추가적 생각/질문
[[DBMS 심층 분석_ 엔진 메커니즘과 SQL 최적화|함수와 프로시저의 차이_DBMS 심층분석_ 엔진 매커니즘과 sql 최적화]]
