---
type: 생각조각
status: inbox
source: 
creation_date: 2025-12-03
---


## 📜 원본 맥락
![[00_Inbox/ORACLE의 제약, 프로시저, 함수, 뷰, 인덱스, 암호화 총정리.md#^4k03am]]

---
## 정리

## 1. 스칼라 변수 (Scalar Variables)와 상수

가장 기본적인 변수 형태로, **한 시점에 단 하나의 값(Single Value)** 만을 저장하는 변수입니다.

### 1.1 일반 변수 (Scalar Variables)

- **개념:** 사용자가 데이터 타입(NUMBER, VARCHAR2, DATE, BOOLEAN 등)을 직접 명시하여 선언하는 변수입니다.
- **초기화:** 사용자는 선언 시 `DEFAULT` 키워드나 할당 연산자(<code>:=</code>)를 사용하여 초기값을 설정할 수 있습니다. 초기값을 설정하지 않으면 엔진은 자동으로 `NULL`을 할당합니다.
- **주요 타입:**
    - `NUMBER`: 정수 및 실수.
    - `VARCHAR2`: 가변 길이 문자열.
    - `DATE`: 날짜 및 시간.
    - `BOOLEAN`: 논리값 (TRUE, FALSE, NULL). SQL 문장(DML)에서는 사용할 수 없고 PL/SQL 제어문에서만 사용 가능합니다.
        

### 1.2 상수 (Constants)

- **개념:** 프로그램 실행 중에 **값이 절대 변경되지 않는 변수**입니다.
- **제약 사항:** 사용자는 선언 시 반드시 `CONSTANT` 키워드를 명시해야 하며, **선언과 동시에 값을 초기화**해야 합니다. 이후 코드 실행부에서 값을 변경하려고 하면 컴파일러가 에러를 발생시킵니다.
    

> [!note]- 스칼라 변수 및 상수 선언 예시
>
>
>
> ```SQL
> DECLARE
>     -- 1. 일반 변수 선언
>     v_emp_id    NUMBER(6);            -- 초기값 없이 선언 (NULL 상태)
>     v_emp_name  VARCHAR2(20) := 'Tom'; -- 선언과 동시에 초기화
>     v_is_valid  BOOLEAN DEFAULT TRUE; -- DEFAULT 키워드 사용
>     
> -- 2. 상수 선언
> c_tax_rate  CONSTANT NUMBER(3,2) := 0.15; -- 값 변경 불가
> 
> 
> BEGIN
> 
> -- 실행부 로직
> 
> v_emp_id := 100;
> 
> -- c_tax_rate := 0.20; -- [에러] 상수는 값 변경 불가
> 
> END;
> ```


## 2. 참조형 변수 (Reference Types)

사용자가 타입을 직접 지정하는 대신, **데이터베이스의 컬럼이나 다른 변수의 타입 속성을 그대로 상속**받는 변수입니다. DB 스키마 변경 시 유연한 대처가 가능합니다.

### 2.1 `%TYPE`

- **개념:** 특정 테이블의 **단일 컬럼** 또는 **이미 선언된 다른 변수**의 데이터 타입을 참조합니다.
- **장점:** DBA가 테이블 컬럼의 크기나 타입(예: `VARCHAR2(10)` $\to$ `VARCHAR2(20)`)을 변경하더라도, PL/SQL 코드를 수정할 필요 없이 런타임에 자동으로 변경된 타입이 적용됩니다.
- **문법:** `변수명 테이블명.컬럼명%TYPE;`
    

### 2.2 `%ROWTYPE`

- **개념:** 테이블의 **전체 행(Row) 구조**를 참조합니다. 해당 테이블의 모든 컬럼 이름과 데이터 타입을 필드로 가지는 레코드(Record)가 생성됩니다.
- **동작:** 사용자는 `변수명.컬럼명` 형식으로 내부 필드에 접근합니다.
- **활용:** `SELECT * INTO …` 문을 사용하여 테이블의 한 행을 통째로 변수에 담을 때 유용합니다.
- **문법:** `변수명 테이블명%ROWTYPE;`
    

> [!note]- %TYPE 및 %ROWTYPE 활용 예시
>
>
>
> ```SQL
> DECLARE
>     -- [1] %TYPE: employees 테이블의 salary 컬럼 타입을 그대로 적용
>     v_salary  employees.salary%TYPE;
>     
>     -- [2] %ROWTYPE: employees 테이블의 모든 컬럼을 포함하는 레코드 변수
>     v_emp_row employees%ROWTYPE;
> BEGIN
>     -- 단일 값 조회
>     SELECT salary INTO v_salary
>     FROM employees WHERE employee_id = 100;
>   
> -- 전체 행 조회 (모든 컬럼을 v_emp_row에 매핑)
> SELECT * INTO v_emp_row
> FROM employees WHERE employee_id = 100;
> 
> -- 접근 방식
> DBMS_OUTPUT.PUT_LINE(v_emp_row.first_name);
> 
> 
> END;
> ```

---

## 3. 복합 변수 (Composite Types)

하나의 변수 안에 **여러 개의 데이터(내부 필드 또는 요소)**를 저장할 수 있는 자료형입니다. 사용자가 직접 구조를 정의한 후 변수로 선언하여 사용합니다.

### 3.1 레코드 (Record)

- **개념:** 서로 다른 데이터 타입을 가진 여러 필드(Field)를 하나로 묶은 구조체입니다. C언어의 `struct`나 Java의 객체와 유사합니다.
- **차이점:** `%ROWTYPE`은 테이블 스키마를 그대로 따르지만, **사용자 정의 레코드**는 사용자가 필요한 필드만 선택적으로 조합하여 구조를 정의합니다.
- **구조:** `TYPE 레코드타입명 IS RECORD (필드명 타입, …);` 선언 후 변수를 생성합니다.

### 3.2 컬렉션 (Collection)

- **개념:** 동일한 데이터 타입을 가진 요소들의 집합으로, 프로그래밍 언어의 **배열(Array)**과 유사합니다.
- **주요 종류:**
    
    1. **연관 배열 (Associative Array):** Key-Value 쌍으로 데이터를 저장합니다. (과거 PL/SQL Table로 불림). 인덱스로 정수뿐만 아니라 문자열도 사용 가능합니다.
    2. **중첩 테이블 (Nested Table):** 크기에 제한이 없는 배열입니다. DB 테이블의 컬럼으로도 저장될 수 있습니다.
    3. **VARRAY (Variable-Size Array):** 선언 시 크기(길이)가 고정된 배열입니다.

> [!note]- 레코드 및 컬렉션 정의 예시
>
>
>
> ```SQL
> DECLARE
>     -- [1] 사용자 정의 레코드 (구조체 정의)
>     TYPE t_emp_info IS RECORD (
>         r_id    NUMBER,
>         r_name  VARCHAR2(50),
>         r_sal   NUMBER
>     );
>     v_my_record t_emp_info; -- 레코드 변수 선언
>     
> -- [2] 컬렉션 (연관 배열) 정의
> -- 정수형 인덱스를 사용하고 문자열을 저장하는 배열 타입 정의
> 	TYPE t_name_array IS TABLE OF VARCHAR2(30) INDEX BY PLS_INTEGER;
> 	v_names t_name_array;   -- 배열 변수 선언
> BEGIN
> 
> -- 레코드 사용
> 
> v_my_record.r_id := 10;
> 
> v_my_record.r_name := 'Smith';
> -- 컬렉션 사용
> v_names(0) := 'Alice';
> v_names(1) := 'Bob';
> 
> 
> END;
> ```

---
## 💭 나의 추가적 생각/질문
