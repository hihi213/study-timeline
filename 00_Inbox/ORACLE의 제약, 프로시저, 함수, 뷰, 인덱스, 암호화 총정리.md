---
type: 생각조각
status: inbox
source: 
creation_date: 2025-11-25
---


## 📜 원본 맥락
![[01_Sources/학교_DB보안_자바SWING프로젝트.md#^01yja5]]

---
## 정리

### 1. 제약 조건 (Constraints)

제약 조건은 주로 테이블 생성(`CREATE TABLE`) 시점이나 테이블 수정(`ALTER TABLE`) 시점에 정의합니다. 정의 방식은 컬럼 레벨과 테이블 레벨로 나뉩니다.

- **기본 문법 구조**
```SQL
CREATE TABLE 테이블명 (
    컬럼명1 데이터타입 [CONSTRAINT 제약조건명] PRIMARY KEY,      -- 컬럼 레벨 정의
    컬럼명2 데이터타입 NOT NULL,
    컬럼명3 데이터타입,
    CONSTRAINT 제약조건명 FOREIGN KEY (컬럼명3) REFERENCES 부모테이블(참조컬럼) -- 테이블 레벨 정의
);
```

- **주요 키워드 설명**
    - `CONSTRAINT [이름]`: 제약 조건의 이름을 명시적으로 지정합니다. 생략 시 오라클이 시스템 이름(SYS_C…)을 자동 부여합니다.
    - `PRIMARY KEY`: 기본키를 정의합니다.
    - `FOREIGN KEY (…) REFERENCES …`: 외래키를 정의하며 참조할 부모 테이블과 컬럼을 명시합니다.
    - `CHECK (조건)`: 데이터가 만족해야 할 논리식을 정의합니다. (예: `CHECK (salary > 0)`)
    - `UNIQUE`: 중복 값을 허용하지 않는 제약을 정의합니다.
        

### 2. 프로시저 (Procedures)

프로시저는 `CREATE OR REPLACE PROCEDURE` 구문을 사용하여 생성하며, 선언부와 실행부로 구성된 PL/SQL 블록을 포함합니다.

- **기본 문법 구조**
    



```SQL
CREATE [OR REPLACE] PROCEDURE 프로시저명
(
    파라미터명1 IN 데이터타입,       -- 입력 파라미터
    파라미터명2 OUT 데이터타입,      -- 출력 파라미터
    파라미터명3 IN OUT 데이터타입    -- 입출력 파라미터
)
IS  -- 또는 AS
    -- 변수 선언부 (Local Variables)
BEGIN
    -- 실행부 (SQL 및 PL/SQL 로직)
    NULL; -- 로직이 없을 경우 NULL 명시
EXCEPTION
    -- 예외 처리부
    WHEN OTHERS THEN
        ROLLBACK;
END 프로시저명;
/
```

- **주요 키워드 설명**
    - `OR REPLACE`: 동명의 프로시저가 존재할 경우 덮어씌웁니다.
    - `IN`: 호출자가 프로시저로 값을 전달합니다 (기본값).
    - `OUT`: 프로시저가 실행 결과를 호출자에게 반환합니다.
    - `IS/AS`: 변수 선언부가 시작됨을 알립니다.
        

### 3. 함수 (Functions)

함수는 프로시저와 문법이 유사하지만, `RETURN` 절을 통해 반환할 데이터 타입을 명시해야 하며 실행부 내에 반드시 `RETURN` 문이 존재해야 합니다.

- **기본 문법 구조**

```SQL
CREATE [OR REPLACE] FUNCTION 함수명
(
    파라미터명 IN 데이터타입
)
RETURN 반환_데이터타입 -- 반환할 값의 타입 정의 (필수)
IS
    -- 변수 선언부
    v_result 반환_데이터타입;
BEGIN
    -- 실행부
    …
    RETURN v_result; -- 값 반환 (필수)
END 함수명;
/
```

- **주요 키워드 설명**
    - `RETURN [타입]`: 함수 헤더에서 반환할 데이터의 타입을 선언합니다.
    - `RETURN [값]`: 실행부 내에서 실제 값을 반환하고 함수를 종료합니다.
        

### 4. 뷰 (Views)

뷰는 `CREATE VIEW` 문을 사용하며, 실제 데이터를 저장하지 않고 `AS` 키워드 뒤에 정의된 `SELECT` 문을 저장합니다.

- **기본 문법 구조**
    
```SQL
CREATE [OR REPLACE] [FORCE | NOFORCE] VIEW 뷰이름
AS
SELECT
    컬럼1,
    컬럼2
FROM
    원본테이블
WHERE
    조건식
[WITH READ ONLY]; -- 읽기 전용 옵션
```

- **주요 키워드 설명**
    - `FORCE`: 기본 테이블이 존재하지 않아도 뷰를 강제로 생성합니다.
    - `NOFORCE`: 기본 테이블이 존재해야만 뷰를 생성합니다 (기본값).
    - `WITH READ ONLY`: 뷰를 통한 DML(INSERT, UPDATE, DELETE) 작업을 제한합니다.
    - `WITH CHECK OPTION`: 뷰의 `WHERE` 조건에 위배되는 데이터 변경을 차단합니다.
        

### 5. 인덱스 (Indexes)

인덱스는 `CREATE INDEX` 문을 사용하여 특정 테이블의 컬럼에 대해 생성합니다.

- **기본 문법 구조**


```SQL
CREATE [UNIQUE | BITMAP] INDEX 인덱스명
ON 테이블명 (컬럼명1 [ASC|DESC], 컬럼명2…);
```

- **주요 키워드 설명**
    - `UNIQUE`: 중복된 키 값을 허용하지 않는 인덱스를 생성합니다.
    - `BITMAP`: 카디널리티(Cardinality)가 낮은 컬럼(예: 성별, 상태값)에 적합한 비트맵 인덱스를 생성합니다.
    - `ASC/DESC`: 인덱스 키의 정렬 순서를 지정합니다 (기본값은 ASC).
        

### 6. 암호화 (Encryption) - TDE

Oracle의 TDE(Transparent Data Encryption)를 적용하는 문법입니다. 주로 테이블 생성 시 컬럼 정의에 암호화 옵션을 추가하거나, 테이블스페이스 생성 시 적용합니다.

- **컬럼 암호화 문법 (테이블 정의 시)**

```SQL
CREATE TABLE 테이블명 (
    컬럼명 VARCHAR2(100) ENCRYPT USING 'AES256' [NO SALT], -- 암호화 적용
    일반컬럼 VARCHAR2(100)
);
```

- **테이블스페이스 암호화 문법**

```SQL
CREATE TABLESPACE 테이블스페이스명
DATAFILE '파일경로.dbf' SIZE 100M
ENCRYPTION USING 'AES256' DEFAULT STORAGE(ENCRYPT);
```

- **주요 키워드 설명**
    - `ENCRYPT`: 해당 컬럼이나 테이블스페이스를 암호화합니다.
    - `USING '알고리즘'`: 암호화에 사용할 알고리즘(AES256, AES192, AES128, 3DES168 등)을 지정합니다.
    - `NO SALT`: 암호화 시 솔트(Salt) 값을 추가하지 않습니다. (인덱스를 생성하려는 암호화 컬럼에는 필수적으로 지정해야 함).
        



## 💭 나의 추가적 생각/질문
