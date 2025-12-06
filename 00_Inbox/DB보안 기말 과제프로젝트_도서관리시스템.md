---
type: 생각조각
status: inbox
source:
creation_date: 2025-12-01
---
**데이터베이스 설계한 테이블 모델링(물리적모델링:테이블명세서 또는 ERD) 및 구현한 소스와 실행 화면 결과 화면 캡쳐하여 보고서 형식으로 제출합니다. 참고한 자료가 있으면 작성해 줘야하고 간단한 기능설명도 넣어주세요.**


- 도서 대여시스템 구성
    - **함수:** 반납 예정일과 오늘 날짜를 비교해 **연체료** 계산.
    - **프로시저:** 대여 버튼 클릭 시 (대여 기록 생성 + 책 상태 '대여 중'으로 변경).
    - **뷰:** 현재 '대출 가능한 책'만 보여주는 목록.

## 요구 사항 정의
1. 로그인: 미리 저장된 아이디와 비밀번호를 입력받아 회원임을 인증한다
	- 로그인 시 비교할수 있어야 함
2. 도서 목록 조회
	- 대여가능한 도서와 대여중인 도서를 목록으로 보여준다
	- 이때 조인쿼리 대신, 미리 만들어놓은 뷰를 select해 보여준다
3. 도서 대여
	- 사용자가 책을 선택하고 대여 버튼을 누른다
	- 자바가 프로시저만 호출해 DB내부에서 대여기록 생성, 도서상태변경을 한번에 처리한다
4. 도서 반납
	- 대여중인 사용자가 반납 버튼을 누른다
	- 함수가 작동하여 연체일수를 계산하여 제시해 보여준다

| 구분 | 기능명 | 상세 내용 | 학습 목표 (DB 기술) |
| :--- | :--- | :--- | :--- |
| **회원** | **로그인** | 아이디/비밀번호 입력 시 DB 정보와 대조하여 인증. | **암호화** (비밀번호 보호) |
| **조회** | **도서 목록** | 전체 도서 중 '대여 가능'한 책과 '불가능'한 책을 구분하여 조회. | **뷰 (View)** (복잡한 쿼리 단순화)<br>**인덱스** (검색 속도 최적화) |
| **핵심** | **도서 대여** | 사용자가 책을 선택해 '대여' 버튼 클릭 시,<br>① 대여 이력 생성<br>② 도서 상태 '대여중' 변경 | **프로시저** (트랜잭션 처리) |
| **핵심** | **도서 반납** | '반납' 버튼 클릭 시,<br>① 반납일자 기록<br>② 연체료 계산 및 알림 | **함수** (날짜 계산 로직) |

### 1. 설계 전략 및 주요 결정 사항

- 회원이 도서를 빌린다/반납한다. -> 회원, 도서, 대여반납테이블 필요
	- 이중에서 대여반납 테이블은 계속 데이터가 쌓일것
	- 대여반납 테이블은 다른 테이블의 pk를 fk로 받아와서 생성
	- 대여반납 테이블을 현행, 이력으로 분리하는게 실무적이지만 대여할때 대여 테이블에 넣고 반납할때 반납테이블에 또 넣어야해서 복잡하므로 한테이블로 구현하고, 인덱스를 반납일에 건다
	- `RTN_DATE`(반납일) 컬럼이 `NULL`이면 대여 중, 날짜가 있으면 반납 완료로 간주한다.
	- 오라클에서는 바이트로 설정하므로 회원의 비밀번호는 암호화하면 영어/숫자로 64글자이므로 64바이트 이상이 필요하니 넉넉히 설정했다.
- 구현해야하는 6가지 기능
	1. **비밀번호 암호화:** 입력받은 평문 비밀번호를 암호문으로 변환
		- 어떻게 구현할까?: 이 작업은 DB의 데이터를 수정하는 작업이 아니므로 함수로 구현한다
	2. **로그인:** 아이디/비밀번호가 맞는지 확인 (비밀번호 암호화함수 이용)
		- 어떻게 구현할까?: 이 작업은 DB의 데이터를 수정하는 작업이 아니므로 함수로 구현한다
	3. **도서 대여:** 대여 기록 생성 및 도서 상태 변경
		- 어떻게 구현할까?: 이 작업은 DB의 데이터를 수정하는 작업이므로, 프로시저로 구현한다.
	4. **연체료 계산:** 반납일 기준으로 연체료 산출
	5. 도서반납: 도서반납(연체로 계산 함수 이용)
	6. 목록조회: 현재 도서 상태를 보여줌(연체료 계산 함수 이용)
    
### 2. 물리적 테이블 설계

#### ① TBL_MEMBER (회원)

| **컬럼명**      | **한글명** | **데이터 타입**      | **제약조건** |
| ------------ | ------- | --------------- | -------- |
| **MEM_NO**   | 회원번호    | `NUMBER`        | **PK**   |
| **MEM_ID**   | 아이디     | `VARCHAR2(30)`  | **UK**   |
| **MEM_PW**   | 비밀번호    | `VARCHAR2(200)` | **NN**   |
| **MEM_NAME** | 이름      | `VARCHAR2(20)`  | NN       |
| **MEM_TEL**  | 전화번호    | `VARCHAR2(20)`  |          |

#### ② TBL_BOOK (도서)

- 책의 현재 상태(대여 가능/불가능)를 바로 알 수 있는 플래그(`RENT_YN`) 컬럼을 두어 조회 성능을 높인다.

| **컬럼명**     | **한글명** | **데이터 타입**      | **제약조건** |
| ----------- | ------- | --------------- | -------- |
| **BOOK_NO** | 도서번호    | `NUMBER`        | **PK**   |
| **TITLE**   | 책제목     | `VARCHAR2(100)` | NN       |
| **AUTHOR**  | 저자      | `VARCHAR2(50)`  |          |
| **RENT_YN** | 대여여부    | `CHAR(1)`       | CK       |

#### ③ TBL_RENT (대여 - 트랜잭션)

- **누가(FK)**, **무엇을(FK)** 빌렸는지 연결합니다. 반납 처리를 위해 `RETURN_DATE`는 처음엔 `NULL`이다가 반납 시점에 날짜가 찍히게 설계합니다.

| **컬럼명**       | **한글명** | **데이터 타입** | **제약조건** | **비고**        |
| ------------- | ------- | ---------- | -------- | ------------- |
| **RENT_NO**   | 대여번호    | `NUMBER`   | **PK**   | 시퀀스 자동 채번     |
| **MEM_NO**    | 회원번호    | `NUMBER`   | **FK**   | TBL_MEMBER 참조 |
| **BOOK_NO**   | 도서번호    | `NUMBER`   | **FK**   | TBL_BOOK 참조   |
| **RENT_DATE** | 대여일자    | `DATE`     | NN       | SYSDATE (기본값) |
| **RTN_DUE**   | 반납예정    | `DATE`     | NN       | 대여일 + 7일      |
| **RTN_DATE**  | 실반납일    | `DATE`     |          | 반납 전엔 NULL    |


---

### 2. 물리적 테이블 설계 (Physical Modeling)

#### ① TBL_MEMBER (회원 관리)

회원 로그인 및 식별을 위한 테이블이다.

- **설계 의도:**
    - 비밀번호(`MEM_PW`)는 **SHA-256 단방향 암호화**를 적용할 예정이므로, 암호화된 해시값(64Byte 이상)을 넉넉히 수용하기 위해 **`VARCHAR2(200)`** 으로 설정하였다. (오라클은 `VARCHAR2`가 Byte 기준임)
    - 회원 ID는 중복될 수 없으므로 `Unique Key`를 적용하였다.
        

|**컬럼명 (Column)**|**한글명**|**데이터 타입**|**제약조건**|**비고**|
|---|---|---|---|---|
|**MEM_NO**|회원번호|`NUMBER`|**PK**|시퀀스(`SEQ_MEM`) 자동 채번|
|**MEM_ID**|아이디|`VARCHAR2(30)`|**UK, NN**|중복 불가, 필수 입력|
|**MEM_PW**|비밀번호|`VARCHAR2(200)`|**NN**|**암호화된 해시값 저장**|
|**MEM_NAME**|이름|`VARCHAR2(20)`|**NN**||
|**MEM_TEL**|전화번호|`VARCHAR2(20)`|||

#### ② TBL_BOOK (도서 관리)

대여 대상이 되는 도서 정보를 관리하는 테이블이다.

- **설계 의도:**
    - `RENT_YN` 컬럼을 두어 현재 대여 가능 여부를 직관적으로 파악할 수 있게 설계하였다.
    - 데이터 무결성을 위해 `RENT_YN`에는 'Y' 또는 'N'만 입력되도록 `CHECK` 제약조건을 설정하였다.
        

|**컬럼명 (Column)**|**한글명**|**데이터 타입**|**제약조건**|**비고**|
|---|---|---|---|---|
|**BOOK_NO**|도서번호|`NUMBER`|**PK**|시퀀스(`SEQ_BOOK`) 자동 채번|
|**TITLE**|책제목|`VARCHAR2(100)`|**NN**||
|**AUTHOR**|저자|`VARCHAR2(50)`|||
|**RENT_YN**|대여여부|`CHAR(1)`|**CK**|Default 'N' ('Y' or 'N')|

#### ③ TBL_RENT (대여/반납 트랜잭션)

회원과 도서 간의 대여 행위를 기록하는 테이블이다.

- **설계 의도 (단일 테이블 전략):**
    - **상태 구분:** `RTN_DATE`(실반납일)이 `NULL`이면 '대여 중', 날짜가 있으면 '반납 완료'로 간주한다.
    - **성능 최적화:** 데이터가 누적되어도 미반납 도서를 빠르게 조회하기 위해 **`RTN_DATE` 컬럼에 별도의 인덱스(`IDX_RENT_RETURN`)** 를 생성하여 Full Table Scan을 방지한다.


|**컬럼명 (Column)**|**한글명**|**데이터 타입**|**제약조건**|**비고**|
|---|---|---|---|---|
|**RENT_NO**|대여번호|`NUMBER`|**PK**|시퀀스(`SEQ_RENT`) 자동 채번|
|**MEM_NO**|회원번호|`NUMBER`|**FK, NN**|`TBL_MEMBER` 참조|
|**BOOK_NO**|도서번호|`NUMBER`|**FK, NN**|`TBL_BOOK` 참조|
|**RENT_DATE**|대여일자|`DATE`|**NN**|Default `SYSDATE`|
|**RTN_DUE**|반납예정|`DATE`|**NN**|Default `SYSDATE+7`|
|**RTN_DATE**|실반납일|`DATE`||**Index 적용 대상 (NULL 검색)**|


### 3. 데이터베이스 구축 및 초기 데이터 설정

#### 기본테이블과 인덱스

```sql
-- 1. 회원 테이블 
CREATE TABLE TBL_MEMBER (
    MEM_NO    NUMBER          PRIMARY KEY, 
    MEM_ID    VARCHAR2(30)    UNIQUE NOT NULL,
    MEM_PW    VARCHAR2(200)   NOT NULL,   
    MEM_NAME  VARCHAR2(20)    NOT NULL,
    MEM_TEL   VARCHAR2(20)
);

CREATE SEQUENCE SEQ_MEM; -- 회원번호 자동생성기

-- 2. 도서 테이블
CREATE TABLE TBL_BOOK (
    BOOK_NO   NUMBER          PRIMARY KEY,
    TITLE     VARCHAR2(100)   NOT NULL,
    AUTHOR    VARCHAR2(50),
    RENT_YN   CHAR(1)         DEFAULT 'N' CHECK (RENT_YN IN ('Y', 'N')) -- Y:대여중, N:대여가능
);

CREATE SEQUENCE SEQ_BOOK; -- 도서번호 자동생성기

-- 3. 대여 테이블 (핵심 트랜잭션)
CREATE TABLE TBL_RENT (
	RENT_NO NUMBER PRIMARY KEY,
	MEM_NO NUMBER NOT NULL,
	BOOK_NO NUMBER NOT NULL,
	RENT_DATE DATE NOT NULL DEFAULT SYSDATE, --시작일
	RTN_DUE DATE NOT NULL DEFAULT SYSDATE+7, --반납 예정일
	RTN_DATE DATE ,--실 반납일 (반납전은 NULL)
	CONSTRAINT FK_RENT_MEN FOREIGN KEY(MEN_NO) REFERENCES TBL_MEMBER(MEN_NO),
	CONSTRAINT FK_RENT_BOOK FOREIGN KEY (BOOK_NO) REFERENCES TBL_BOOK(BOOK_NO)
);

CREATE SEQUENCE SEQ_RENT; -- 대여번호 자동생성기

CREATE INDEX IDX_RENT_RETURN ON TBL_RENT(RTN_DATE);

```

#### [암호화] 비밀번호 보안 함수 및 데이터 입력

오라클 내장 패키지(`DBMS_CRYPTO`)를 활용하여 비밀번호를 **SHA-256 단방향 해시**로 변환하는 함수를 정의하고 데이터를 입력한다.
- 유저가 비밀번호 입력시 이 함수를 이용하여 일치여부를 확인하거나, 추후 회원가입 구현시 이 함수를 이용해 저장하면된다.

```SQL
-- 1. 암호화 함수 생성
CREATE INDEX IDX_RENT_RETURN ON TBL_RENT(RTN_DATE);
--- 함수: 문자열 입력을 받아, 암호화하여 반환한다.
CREATE OR REPLACE FUNCTION FUNC_ENCRYPT_PW ( p_input IN VARCHAR2)
RETURN VARCHAR2
AS v_hash_type PLS_INTEGER := DBMS_CRYPTO.HASH_SH256;
BEGIN
    -- DBMS_CRYPTO.HASH 함수는 (데이터, 암호화타입)을 인자로 받는다
    --하지만 우리는 문자열로 받으므로, 이를 raw타입으로 변환해서 넣어야한다)
    -- 그래서 UTL_I18N.STRING_TO_RAW와 UTL_I18N 패키지를 사용한다. (문자열이므로 따음표필요)
    RETURN DBMS_CRYPTO.HASH(UTL_I18N.STRING_TO_RAW(p_input, 'AL32UTF8'), v_hash_type);
END;
/

-- 2. 데이터 입력 (위의 함수를 이용해 회원을 넣는다.)
-- 회원 데이터 
INSERT INTO TBL_MEMBER VALUES (SEQ_MEM.NEXTVAL, 'user1', FUNC_ENCRYPT_PW('1234'), '김철수', '010-1111-2222');
INSERT INTO TBL_MEMBER VALUES (SEQ_MEM.NEXTVAL, 'user2', FUNC_ENCRYPT_PW('5678'), '이영희', '010-3333-4444');

-- 도서 데이터 
INSERT INTO TBL_BOOK VALUES (SEQ_BOOK.NEXTVAL, '이것이 자바다', '신용권', 'N');
INSERT INTO TBL_BOOK VALUES (SEQ_BOOK.NEXTVAL, 'SQL 전문가 가이드', 'K-DATA', 'N');
INSERT INTO TBL_BOOK VALUES (SEQ_BOOK.NEXTVAL, '해리포터와 마법사의 돌', 'JK롤링', 'N');

COMMIT;
```

#### 로그인 함수: 비밀번호를 조회하고 결과값을 돌려준다.

```SQL
---함수: 비밀번호를 조회하고 결과값을 돌려준다.
CREATE OR REPLACE FUNCTION FUNC_LOGIN(p_id IN VARCHAR2, p_pw IN VARCHAR2)
RETURN VARCHAR2
AS 
    v_db_pw TBL_MEMBER.MEM_PW%TYPE;
BEGIN 
    SELECT MEM_PW INTO v_db_pw FROM TBL_MEMBER WHERE MEM_ID= p_id;
    IF v_db_pw = FUNC_ENCRYPT_PW (p_pw) THEN
        RETURN 'TRUE';
    ELSE 
        RETURN 'FALSE';
    END IF;
EXCEPTION
    --id가 없을경우
    WHEN NO_DATA_FOUND THEN
        RETURN 'NODATA';
END;
/
```
#### [뷰(View)] 도서 목록 조회

사용자 화면(UI)에서 복잡한 쿼리 없이 쉽게 도서 상태를 조회할 수 있도록 가상의 테이블(View)을 생성한다.


```SQL
CREATE OR REPLACE VIEW VIEW_BOOK_LIST AS
SELECT 
    BOOK_NO, 
    TITLE, 
    AUTHOR, 
    -- 코드를 사용자가 보기 편한 텍스트로 변환
    DECODE(RENT_YN, 'Y', '대여중', 'N', '대여가능') AS STATUS
FROM TBL_BOOK
ORDER BY BOOK_NO;
```

#### [프로시저] 대여 트랜잭션 처리

'대여' 버튼 클릭 시 **[대여 이력 생성]**과 **[도서 상태 변경]**이 동시에 성공하거나, 실패 시 모두 취소되어야 하므로 트랜잭션 프로시저로 구현한다.



```SQL
CREATE OR REPLACE PROCEDURE PROC_RENT_BOOK (
    p_mem_id  IN VARCHAR2, -- 회원 ID
    p_book_no IN NUMBER,   -- 도서 번호
    p_result  OUT VARCHAR2 -- 결과 메시지 (성공/실패 사유)
)
IS
    v_mem_no NUMBER;
    v_rent_yn CHAR(1);
BEGIN
    -- 1. 회원 번호 찾기
    SELECT MEM_NO INTO v_mem_no FROM TBL_MEMBER WHERE MEM_ID = p_mem_id;
    
    -- 2. 도서 상태 확인 (이미 대여중인지)
    SELECT RENT_YN INTO v_rent_yn FROM TBL_BOOK WHERE BOOK_NO = p_book_no;
    
    IF v_rent_yn = 'Y' THEN
        p_result := '이미 대여중인 도서입니다.';
        RETURN;
    END IF;

    -- 3. 트랜잭션 실행 (INSERT + UPDATE)
    INSERT INTO TBL_RENT (RENT_NO, MEM_NO, BOOK_NO) 
    VALUES (SEQ_RENT.NEXTVAL, v_mem_no, p_book_no);
    
    UPDATE TBL_BOOK SET RENT_YN = 'Y' WHERE BOOK_NO = p_book_no;
    
    COMMIT; -- 확정
    p_result := '대여가 완료되었습니다.';
    
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        p_result := '회원 아이디 또는 도서 번호가 올바르지 않습니다.';
    WHEN OTHERS THEN
        ROLLBACK; -- 오류 발생 시 되돌리기
        p_result := '오류 발생: ' || SQLERRM;
END;
/
```

#### [함수] 연체료 계산

반납 시 반납 예정일(`RTN_DUE`)과 현재 날짜를 비교하여 연체료(1일당 500원)를 계산한다.



```SQL
CREATE OR REPLACE FUNCTION FUNC_CALC_LATE_FEE (p_rent_no NUMBER)
RETURN NUMBER
IS
    v_due_date DATE;
    v_diff NUMBER;
BEGIN
    -- 해당 대여 건의 반납 예정일 조회
    SELECT RTN_DUE INTO v_due_date FROM TBL_RENT WHERE RENT_NO = p_rent_no;
    
    -- 날짜 차이 계산 (오늘 - 예정일)
    v_diff := TRUNC(SYSDATE) - TRUNC(v_due_date);
    
    IF v_diff > 0 THEN
        RETURN v_diff * 500; -- 연체일수 * 500원
    ELSE
        RETURN 0; -- 연체 없음
    END IF;
END;
/
```
