---
type: 생각조각
status: inbox
source:
creation_date: 2025-10-20
---

알겠습니다. 5장(`05_SQL_Select.pdf`)의 **핵심 개념(키워드)**, **간결한 기능 설명**, 그리고 **대표 사용 문법**을 요청하신 형식에 맞춰 정리해 드립니다.

---

## 1. SQL 기본 분류

### 📚 DDL (Data Definition Language)

- **기능:** 데이터베이스의 구조(테이블, 뷰 등)를 정의(생성, 변경, 삭제)하는 데 사용됩니다. 1
- **문법 (CREATE):**

    SQL

    ```
    CREATE TABLE DEPT (
      DEPTNO number(2,0) NOT NULL,
      DNAME VARCHAR2(14),
      LOC VARCHAR2(13),
      CONSTRAINT DEPT_PRIMARY_KEY PRIMARY KEY (DEPTNO)
    ); [cite: 53, 54, 55, 56, 57, 58, 59, 60]
    ```

### 📚 DML (Data Manipulation Language)

- **기능:** 테이블의 데이터를 조회, 입력, 수정, 삭제할 때 사용됩니다. 2
- **문법 (SELECT):**

    SQL

    ```
    SELECT ename, sal
    FROM emp
    WHERE job='SALESMAN'; [cite: 136, 137, 138]
    ```
    
- **문법 (INSERT):**

    SQL

    ```
    INSERT INTO DEPT VALUES (10, 'ACCOUNTING', 'NEW YORK'); [cite: 61]
    ```

---

## 2. SELECT 기본 문법

### 📚 SELECT ... FROM ...

- **기능:** 특정 테이블(`FROM`)에서 원하는 컬럼(`SELECT`)의 데이터를 조회합니다. 3333
- **문법:**

    SQL

    ```
    SELECT ename, sal
    FROM emp; [cite: 136, 137]
    ```

### 📚 * (Asterisk)

- **기능:** 테이블의 '모든 컬럼'을 의미합니다. 4
- **문법:**

    SQL

    ```
    SELECT *
    FROM dept; [cite: 976, 978]
    ```

### 📚 DISTINCT

- **기능:** 조회 결과에서 중복된 행(row)을 제거합니다. 5
- **문법:**

    SQL

    ```
    SELECT DISTINCT job
    FROM emp; [cite: 171, 154]
    ```

### 📚 AS (Alias)

- **기능:** 컬럼명에 별칭(Alias)을 부여하며, `AS` 키워드는 생략할 수 있습니다. 6
- **문법:**

    SQL

    ```
    SELECT COUNT(*) AS cnt_salesman
    FROM emp; [cite: 340]
    ```

---

## 3. WHERE (조건 필터링)

### 📚 WHERE

- **기능:** 원하는 행(튜플)만 추출하기 위한 검색 조건을 서술합니다. 7
- **문법:**

    SQL

    ```
    SELECT ename, sal
    FROM emp
    WHERE job='SALESMAN'; [cite: 136, 137, 138]
    ```

### 📚 AND, OR, NOT

- **기능:** 여러 조건을 논리적으로 조합합니다. `AND`(모두 만족), `OR`(하나라도 만족), `NOT`(조건 부정). 8
- **문법 (AND):**

    SQL

    ```
    SELECT ename, hiredate, sal
    FROM emp
    WHERE hiredate >= '1981-09-01' AND sal >= 1500; [cite: 185, 186, 187]
    ```
    
- **문법 (NOT / OR):**

    SQL

    ```
    SELECT ename, job, sal
    FROM emp
    WHERE NOT (job = 'SALESMAN' OR job = 'ANALYST'); [cite: 193, 194, 195]
    ```

### 📚 BETWEEN ... AND ...

- **기능:** 값이 지정한 범위 안에 있는지 비교합니다 (경계값 포함). 999
- **문법:**

    SQL

    ```
    SELECT ename, sal
    FROM emp
    WHERE sal BETWEEN 1000 AND 2000; [cite: 240, 241, 242]
    ```

### 📚 IN (...)

- **기능:** 값이 지정한 목록 안에 있는지 비교합니다. 10
- **문법:**

    SQL

    ```
    SELECT ename, job, sal
    FROM emp
    WHERE job IN ('CLERK', 'ANALYST', 'MANAGER'); [cite: 279, 281, 282]
    ```

### 📚 LIKE (와일드카드 %, _)

- **기능:** 문자열의 일부를 비교(패턴 매칭)할 때 사용합니다. `%`는 0개 이상의 문자, `_`는 1개의 문자를 의미합니다. 11
- **문법 (`%`):** (이름이 'A'로 시작)

    SQL

    ```
    SELECT ename, job
    FROM emp
    WHERE ename LIKE 'A%'; [cite: 310, 311, 312]
    ```
    
- **문법 (`_`):** (이름의 세 번째 글자가 'A'인)

    SQL

    ```
    SELECT ename, job
    FROM emp
    WHERE ename LIKE '__A%'; [cite: 314, 316, 317]
    ```

### 📚 IS NULL / IS NOT NULL

- **기능:** 값이 `NULL`인지, 또는 `NULL`이 아닌지 비교합니다. (NULL은 `=`, `>` 등 연산자로 비교 불가) 12
- **문법 (IS NOT NULL):**

    SQL

    ```
    SELECT ename, comm
    FROM emp
    WHERE comm IS NOT NULL; [cite: 226, 227, 228]
    ```

---

## 4. 내장 함수 (집계 함수)

### 📚 COUNT()

- **기능:** 조회 결과에서 튜플(행)의 개수를 반환합니다. `COUNT(comm)`처럼 특정 컬럼을 지정하면 NULL을 제외하고 계산합니다. 13131313
- **문법:**

    SQL

    ```
    SELECT COUNT(*)
    FROM emp; [cite: 324, 325]
    ```

### 📚 MAX(), MIN()

- **기능:** 특정 숫자 컬럼의 최대값 또는 최소값을 반환합니다. 1414
- **문법:**

    SQL

    ```
    SELECT MAX(sal), MIN(sal)
    FROM emp; [cite: 354]
    ```

### 📚 AVG(), SUM()

- **기능:** 특정 숫자 컬럼의 평균값 또는 합계값을 반환합니다. (NULL이 포함된 튜플은 계산에서 제외됨) 15151515
- **문법:**

    SQL

    ```
    SELECT AVG(sal), SUM(sal)
    FROM emp; [cite: 359, 360, 366, 368]
    ```

---

## 5. 정렬 및 그룹화

### 📚 ORDER BY

- **기능:** 질의 결과를 특정 기준에 따라 정렬합니다. (기본은 오름차순 `ASC`, 내림차순은 `DESC`) 16161616
- **문법 (내림차순):**

    SQL

    ```
    SELECT ename, hiredate
    FROM emp
    ORDER BY hiredate DESC; [cite: 394, 396, 399]
    ```
    
- **문법 (다중 정렬):** (부서번호(오름차순)로 먼저 정렬 후, 이름(오름차순)으로 정렬)

    SQL

    ```
    SELECT deptno, ename, job
    FROM emp
    ORDER BY deptno, ename; [cite: 405, 406, 407]
    ```

### 📚 GROUP BY

- **기능:** 질의 결과를 특정 컬럼 기준으로 그룹으로 묶어서 처리합니다. (주로 집계 함수와 사용) 17
- **문법:** (부서별 사원 수 계산)

    SQL

    ```
    SELECT deptno, COUNT(*) AS cnt_emp
    FROM emp
    GROUP BY deptno; [cite: 417, 418, 419]
    ```

### 📚 HAVING

- **기능:** `GROUP BY`로 묶인 그룹 결과에 대해 조건을 지정(필터링)할 때 사용합니다. 18
- **문법:** (사원 수가 5명 이상인 부서만 조회)

    SQL

    ```
    SELECT deptno, COUNT(*) AS cnt_emp
    FROM emp
    GROUP BY deptno
    HAVING COUNT(*) >= 5; [cite: 444, 446, 447, 448]
    ```

    _(참고: `WHERE`는 그룹화 전 개별 행을 필터링하고, `HAVING`은 그룹화 후 그룹을 필터링합니다.)_ 19191919

---

## 6. 조인 (JOIN)

### 📚 기본 조인 (Inner Join / Equi Join)

- **기능:** 두 개 이상의 테이블을 공통 컬럼 기준으로 연결하여 데이터를 조회합니다. 20202020
- **문법 (테이블 별칭 사용):**

    SQL

    ```
    SELECT ename, dname, loc
    FROM emp e, dept d
    WHERE e.deptno = d.deptno; [cite: 540, 541, 542]
    ```

### 📚 Left Outer Join (외부 조인)

- **기능:** 왼쪽 테이블의 튜플은 모두 표시하고, 오른쪽 테이블은 연결되는 튜플만 표시합니다. (연결할 튜플이 없으면 `NULL`로 표시) 21212121
- **문법 (Oracle 전용):** (`(+)` 기호를 조인 조건에서 데이터가 부족한 쪽에 붙임)

    SQL

    ```
    SELECT T1.code, name, discount
    FROM T1, T2
    WHERE T1.code = T2.code(+); [cite: 597, 598, 599]
    ```
    
- **문법 (표준 SQL):**

    SQL

    ```
    SELECT T1.code, name, discount
    FROM T1 LEFT OUTER JOIN T2 ON T1.code = T2.code; [cite: 610, 611]
    ```

### 📚 Right Outer Join (외부 조인)

- **기능:** 오른쪽 테이블의 튜플은 모두 표시하고, 왼쪽 테이블은 연결되는 튜플만 표시합니다. (연결할 튜플이 없으면 `NULL`로 표시) 22222222
- **문법 (Oracle 전용):**

    SQL

    ```
    SELECT T2.code, name, discount
    FROM T1, T2
    WHERE T1.code(+) = T2.code; [cite: 619, 620, 621]
    ```

### 📚 Self Join (셀프 조인)

- **기능:** 하나의 테이블을 자기 자신과 조인합니다. (반드시 별칭 사용) 23
- **문법:** (사원의 이름과 그 사원의 매니저 이름을 조회)

    SQL

    ```
    SELECT e.ename AS employee, m.ename AS manager
    FROM emp e, emp m
    WHERE e.mgr = m.empno; [cite: 676, 677, 678]
    ```

---

## 7. 집합 연산자 및 중첩 SQL

### 📚 MINUS

- **기능:** 첫 번째 `SELECT` 결과에서 두 번째 `SELECT` 결과를 제외한(차집합) 튜플을 반환합니다. 24
- **문법:**

    SQL

    ```
    SELECT ename, hiredate FROM emp WHERE sal >= 2500
    MINUS
    SELECT ename, hiredate FROM emp WHERE job = 'MANAGER'; [cite: 769, 770, 771, 772, 773, 774, 775]
    ```

### 📚 서브쿼리 (Subquery) - 단일 값

- **기능:** SQL 문 안에 또 다른 SQL 문을 포함합니다. 서브쿼리 결과가 단일 값(1행 1열)일 경우 `=`, `>`, `<` 등 비교 연산자를 사용합니다. 2525252525252525
- **문법:** (최고 급여를 받는 사원 조회)

    SQL

    ```
    SELECT ename, job, sal
    FROM emp
    WHERE sal = (SELECT MAX(sal) FROM emp); [cite: 838, 839, 840, 842]
    ```

### 📚 서브쿼리 (Subquery) - 다중 값 (IN)

- **기능:** 서브쿼리 결과가 복수 개의 값(여러 행)일 경우 `IN` 또는 `NOT IN`을 사용합니다. 26262626
- **문법:**

    SQL

    ```
    SELECT ename, job, deptno
    FROM emp
    WHERE deptno IN (SELECT deptno FROM dept WHERE dname LIKE 'S%'); [cite: 873, 874, 875, 877, 878]
    ```

### 📚 EXISTS

- **기능:** (상관) 서브쿼리의 결과로 튜플이 존재하는지 여부를 확인합니다. (존재하면 TRUE) 27
- **문법:** (사원이 한 명이라도 있는 부서 조회)

    SQL

    ```
    SELECT dname, loc
    FROM dept
    WHERE EXISTS (SELECT * FROM emp WHERE emp.deptno = dept.deptno); [cite: 898, 899, 900, 904, 906]
    ```

### 📚 NOT EXISTS

- **기능:** (상관) 서브쿼리의 결과로 튜플이 존재하지 않는지 여부를 확인합니다. (존재하지 않으면 TRUE) 28
- **문법:** (사원이 한 명도 없는 부서 조회)

    SQL

    ```
    SELECT dname, loc
    FROM dept
    WHERE NOT EXISTS (SELECT * FROM emp WHERE emp.deptno = dept.deptno); [cite: 921, 922, 923, 927, 929]
    ```

네, 5장(`05_SQL_Select.pdf`) 파일의 내용을 다시 검토했습니다.

이전에 정리한 내용에서 **SQL의 일반적인 특징**과 **SELECT 절에서의 산술 연산**, 그리고 집합 연산자 중 **UNION**, **INTERSECT**가 누락된 것을 확인했습니다.

요청하신 형식에 맞춰 누락된 개념과 문법을 이어서 작성합니다.

---

## 1. SQL 언어의 특징 (추가)

### 📚 SQL 언어의 특징

- **기능:** SQL 명령어를 작성하고 실행할 때 알아야 할 기본 규칙입니다.
- **세부 내용:**
    - `SELECT`, `FROM` 같은 SQL 명령어, `emp` 같은 테이블명, `ename` 같은 컬럼명은 **대소문자를 구분하지 않습니다.** 1
    - 테이블 안에 저장된 데이터 값(예: 'SMITH', 'Smith')은 **대소문자를 구분합니다.** 2
    - SQL 명령문은 한 줄 또는 여러 줄에 걸쳐 작성할 수 있습니다. 3
    - 명령문의 끝은 세미콜론(;)으로 표시합니다. 4

---

## 2. SELECT 문법 (추가)

### 📚 SELECT 절의 산술 연산

- **기능:** `SELECT` 절에서 숫자 타입의 컬럼에 대해 덧셈(+), 뺄셈(-), 곱셈(*), 나눗셈(/) 등 산술 연산을 수행할 수 있습니다. 5
- **문법:** (ANALYST 직무의 사원 이름, 급여, 10% 인상된 급여 조회)

    SQL

    ```
    SELECT ename, sal, sal * 1.1
    FROM emp
    WHERE job = 'ANALYST';
    ```

---

## 3. 집합 연산자 (추가)

### 📚 UNION

- **기능:** 두 `SELECT` 문의 결과를 합쳐서 보여줍니다(합집합). 질의 결과에서 중복된 행은 자동으로 제외됩니다. 6
- **문법:** (Left Outer Join과 Right Outer Join을 합쳐 Full Outer Join 구현 시 사용)

    SQL

    ```
    SELECT T1.code, name, discount FROM T1, T2 WHERE T1.code = T2.code(+)
    UNION
    SELECT T2.code, name, discount FROM T1, T2 WHERE T1.code(+) = T2.code;
    ```

### 📚 INTERSECT

- **기능:** 두 `SELECT` 문의 결과 중 공통된(교집합) 행만 반환합니다. 7
- **문법:** (PDF에 문법 예시는 없으나, 개념상 MINUS/UNION과 동일한 위치에 사용됩니다.)

    SQL

    ```
    (SELECT ... FROM ...)
    INTERSECT
    (SELECT ... FROM ...);
    ```

요청하신 6장(`06_SQL DDL_DML.pdf`) 파일의 핵심 개념, 기능 설명, 대표 문법을 형식에 맞춰 정리했습니다.

---

## 1. DDL (Data Definition Language)

### 📚 CREATE TABLE

- **기능:** 데이터베이스에 새로운 테이블(표)을 생성합니다1111.
- **문법 (기본 구조):** 2

    SQL

    ```
    CREATE TABLE my_dept (
      deptno number(2) not null,
      dname varchar2(14) not null,
      loc varchar2(13) not null,
      CONSTRAINT pk_deptno PRIMARY KEY (deptno)
    );
    ```

### 📚 제약조건 (CONSTRAINT)

- **기능 (PRIMARY KEY):** 테이블에서 행을 고유하게 식별하는 기본키를 정의합니다3333.
- **문법:** 4

    SQL

    ```
    CONSTRAINT pk_deptno PRIMARY KEY (deptno)
    ```
    
- **기능 (FOREIGN KEY):** 다른 테이블의 기본키를 참조하는 외래키를 정의하여 테이블 간의 관계를 설정합니다5555.
- **문법:** 6

    SQL

    ```
    CONSTRAINT fk_deptno FOREIGN KEY (deptno) REFERENCES my_dept(deptno)
    ```
    
- **기능 (ON DELETE SET NULL):** 외래키가 참조하는 부모 테이블의 데이터가 삭제될 때, 자식 테이블의 해당 값을 `NULL`로 설정합니다7.
- **문법:** 8

    SQL

    ```
    ... FOREIGN KEY (deptno) REFERENCES my_dept(deptno)
    ON DELETE SET NULL
    ```
    
- **기능 (DEFAULT):** `INSERT` 시 값이 입력되지 않으면 자동으로 지정된 기본값을 저장합니다9999.
- **문법:** 10

    SQL

    ```
    gender char(1) DEFAULT 'M'
    ```
    
- **기능 (UNIQUE):** 컬럼 내에 중복된 값이 저장되는 것을 방지합니다. (단, `NULL` 값은 허용됩니다) 111111111111111111.
- **문법:** 12

    SQL

    ```
    CONSTRAINT uk_cell_phone UNIQUE (cell_phone)
    ```

### 📚 CREATE TABLE ... AS SELECT ...

- **기능:** `SELECT` 문의 조회 결과를 바탕으로 새로운 테이블을 생성합니다13.
- **문법:** 14141414

    SQL

    ```
    CREATE TABLE my_emp_sal_high
    AS
    SELECT * FROM emp WHERE sal >= 2000;
    ```

### 📚 ALTER TABLE

- **기능:** 이미 생성된 테이블의 구조(컬럼, 제약조건 등)를 변경합니다15.
- **문법 (ADD - 컬럼 추가):** 16161616

    SQL

    ```
    ALTER TABLE my_dept
    ADD budget number (10,2) default (0);
    ```
    
- **문법 (RENAME COLUMN - 컬럼명 변경):** 17171717

    SQL

    ```
    ALTER TABLE my_dept
    RENAME COLUMN budget TO dept_budget;
    ```
    
- **문법 (MODIFY - 컬럼 속성 변경):** 18181818

    SQL

    ```
    ALTER TABLE my_dept
    MODIFY dept_budget number(12,2);
    ```
    
- **문법 (DROP COLUMN - 컬럼 삭제):** 19191919

    SQL

    ```
    ALTER TABLE my_dept
    DROP COLUMN dept_budget;
    ```
    
- **문법 (ADD CONSTRAINT - 제약조건 추가):** 20202020

    SQL

    ```
    ALTER TABLE my_emp
    ADD CONSTRAINT pk_empno PRIMARY KEY (empno);
    ```
    
- **문법 (RENAME TO - 테이블명 변경):** 21212121

    SQL

    ```
    ALTER TABLE my_emp_sal_high
    RENAME TO my_sal_high;
    ```

### 📚 DROP TABLE

- **기능:** 테이블의 구조와 저장된 데이터를 모두 삭제합니다22222222. (`DELETE`는 데이터만 삭제하고 테이블 구조는 남김) 23
- **문법:** 24

    SQL

    ```
    DROP TABLE tmp;
    ```

---

## 2. DML (Data Manipulation Language)

### 📚 INSERT INTO

- **기능:** 테이블에 새로운 데이터 행(튜플)을 삽입합니다25252525.
- **문법 (기본):** 26262626

    SQL

    ```
    INSERT INTO my_dept (deptno, dname, loc)
    VALUES (10, 'accounting', 'New York');
    ```
    
- **문법 (컬럼명 생략):** 27272727

    SQL

    ```
    INSERT INTO my_dept
    VALUES (10, 'accounting', 'New York');
    ```
    
- **문법 (INSERT ... SELECT):** 282828282828282828

    SQL

    ```
    INSERT INTO my_sal_high
    SELECT * FROM my_emp WHERE sal >= 1500 AND sal < 2000;
    ```

### 📚 UPDATE

- **기능:** 테이블에 저장된 기존 데이터의 컬럼 값을 수정합니다29292929.
- **문법 (기본):** 30303030303030303030303030303030

    SQL

    ```
    UPDATE my_dept
    SET loc = 'JEJU'
    WHERE deptno = 10;
    ```
    
- **문법 (서브쿼리 활용):** 31

    SQL

    ```
    UPDATE my_emp
    SET sal = sal * 1.1
    WHERE sal = ( SELECT MIN(sal) FROM my_emp);
    ```

### 📚 DELETE FROM

- **기능:** 테이블에 저장된 데이터 행(튜플)을 삭제합니다32323232.
- **문법:** 33333333

    SQL

    ```
    DELETE FROM my_dept
    WHERE deptno = 60;
    ```

---

## 3. TCL (Transaction Control Language)

### 📚 COMMIT

- **기능:** `INSERT`, `UPDATE`, `DELETE`로 수행한 변경 사항을 데이터베이스에 **영구적으로 반영(저장)**합니다34.
- **문법:** 35

    SQL

    ```
    COMMIT;
    ```

### 📚 ROLLBACK

- **기능:** `COMMIT` 이전에 수행한 모든 변경 사항을 **취소**하고, 마지막 `COMMIT` 시점의 상태로 되돌립니다36.
- **문법:** 37

    SQL

    ```
    ROLLBACK;
    ```

6장(`06_SQL DDL_DML.pdf`) 파일의 내용을 다시 검토했습니다.

이전에 정리한 내용에서 **주요 자료형(Data Types)**에 대한 설명과 **외래키(FOREIGN KEY)의 추가 동작 옵션**(`CASCADE`, `RESTRICT`)이 누락된 것을 확인했습니다.

요청하신 형식에 맞춰 누락된 개념과 문법을 이어서 작성합니다.

---

## 1. DDL - 자료형 (추가)

### 📚 주요 자료형 (Oracle)

- **기능:** `CREATE TABLE` 시 컬럼에 저장될 데이터의 종류와 크기를 지정합니다.
- **주요 유형:**
    - **`number(p, s)`:** 숫자형. `number(3)`은 3자리 정수, `number(4, 1)`은 전체 4자리 중 소수점 이하 1자리를 포함하는 실수를 의미합니다.
    - **`varchar2(size)`:** 가변 길이 문자형. 입력된 문자열의 길이만큼만 공간을 차지합니다. (예: `varchar2(10)`)
    - **`char(size)`:** 고정 길이 문자형. 지정된 길이보다 짧은 문자가 입력되면 나머지를 공백으로 채웁니다. (예: `char(10)`)
    - **`date`:** 날짜와 시간을 저장합니다. (년, 월, 일, 시, 분, 초)

---

## 2. DDL - 제약조건 (추가)

### 📚 ON DELETE CASCADE

- **기능:** `FOREIGN KEY` 정의 시 사용하는 옵션. 부모 테이블의 행(Row)이 삭제될 때, 이를 참조하는 자식 테이블의 행(Row)들도 **함께 자동으로 삭제**시킵니다.
- **문법:**

    SQL

    ```
    CONSTRAINT fk_deptno FOREIGN KEY (deptno) REFERENCES my_dept(deptno)
    ON DELETE CASCADE
    ```

### 📚 ON UPDATE CASCADE

- **기능:** `FOREIGN KEY` 정의 시 사용하는 옵션. 부모 테이블의 기본키 값이 변경(Update)될 때, 이를 참조하는 자식 테이블의 외래키 값도 **함께 자동으로 변경**됩니다.
- **문법:**

    SQL

    ```
    ALTER TABLE my_emp
    ADD CONSTRAINT fk_deptno FOREIGN KEY (deptno) REFERENCES my_dept(deptno)
    ON UPDATE CASCADE
    ```

### 📚 ON DELETE RESTRICT

- **기능:** `FOREIGN KEY` 정의 시 사용하는 옵션. 자식 테이블에 참조하는 데이터가 존재하는 한, 부모 테이블의 해당 행(Row)을 **삭제할 수 없도록 제한**합니다. (`ON DELETE SET NULL`이나 `CASCADE`의 반대 개념)
- **문법:**

    SQL

    ```
    ALTER TABLE my_emp
    ADD CONSTRAINT fk_deptno FOREIGN KEY (deptno) REFERENCES my_dept(deptno)
    ON DELETE RESTRICT
    ```

교수님의 시험 정보에 따라 7장 파일(`07_...pdf`)의 내용 중 시험 범위에 해당하는 **프로시저(Procedure)**와 **함수(Function)**의 핵심 개념과 문법을 정리했습니다.

교수님께서 7장에서는 **Procedure와 Function**, 특히 **IF문과 FOR문을 활용**하는 수준을 강조하셨습니다. 1

파일의 **트리거(Trigger), 뷰(View), 인덱스(Index)** 2 부분은 교수님이 언급한 시험 범위(DDL, DML, Procedure, Function)에 포함되지 않아 정리에서 제외했습니다.

---

## 1. PL/SQL 프로시저 (Procedure)

### 📚 PL/SQL

- **기능:** SQL 문법과 프로그래밍 언어의 기본 문법(변수, 조건문, 반복문)이 합쳐진 형태의 프로그래밍 언어입니다. 3

### 📚 CREATE [OR REPLACE] PROCEDURE

- **기능:** 데이터베이스에 PL/SQL 프로그램을 '프로시저'라는 이름으로 저장합니다. `[OR REPLACE]`는 같은 이름이 존재하면 덮어쓰는 옵션입니다. 444444444
- **문법 (기본 구조):**

    SQL

    ```
    CREATE [OR REPLACE] PROCEDURE 프로시저이름 ( 
      매개변수명 IN 자료형 
    )
    AS
      [변수 선언부]
    BEGIN
      [실행할 프로그램 내용 (SQL, IF, FOR 등)]
    EXCEPTION
      [오류 처리부]
    END;
    ```

    5555

### 📚 변수 선언

- **기능:** `AS`와 `BEGIN` 사이에서 프로그램 내에서 사용할 변수를 선언합니다.
- **문법 (일반):**

    SQL

    ```
    v_ename VARCHAR2(50);
    v_sum NUMBER := 0; -- 0으로 초기화
    ```

    6666666666

- **문법 (%TYPE):**
    - **기능:** 변수의 자료형을 특정 테이블의 컬럼과 동일하게 자동으로 맞춥니다.

    SQL

    ```
    v_job emp.job%TYPE; -- v_job 변수를 emp테이블 job컬럼의 유형과 맞춤
    ```

    7

### 📚 매개변수 모드 (IN / OUT)

- **기능:** 프로시저가 외부에서 값을 받는 방식을 정의합니다.
- **IN (기본값):** 외부에서 값을 받는 읽기 전용 매개변수입니다. 8888
- **OUT:** 프로시저가 외부로 값을 반환하기 위한 쓰기 전용 매개변수입니다. 9
- **문법 (자료형만 명시):**
    - **주의:** 프로시저의 매개변수 자료형에는 `number(10)`처럼 자리수를 지정하면 안 됩니다. 10101010

    SQL

    ```
    CREATE PROCEDURE p_emp_sel ( eid IN NUMBER )
    ```

    11111111

### 📚 SELECT ... INTO ...

- **기능:** `SELECT` 문의 조회 결과를 PL/SQL 변수에 저장할 때 사용합니다. 12
- **문법:**

    SQL

    ```
    SELECT ename, job INTO v_ename, v_job
    FROM emp
    WHERE empno = eid;
    ```

    131313131313131313

### 📚 DBMS_OUTPUT.PUT_LINE()

- **기능:** 화면에 변수나 문자열을 출력합니다. `||` 연산자로 문자열을 연결할 수 있습니다. 14141414
- **문법:**

    SQL

    ```
    DBMS_OUTPUT.PUT_LINE(eid || ' ' || v_ename || ' ' || v_job);
    ```

    15151515

### 📚 SET SERVEROUTPUT ON

- **기능:** `DBMS_OUTPUT.PUT_LINE`의 결과를 화면에 보이도록 활성화하는 명령어입니다. (프로시저 외부에서 실행) 16
- **문법:**

    SQL

    ```
    SET SERVEROUTPUT ON;
    ```

    17

### 📚 EXECUTE (EXEC)

- **기능:** 저장된 프로시저를 실행합니다. 18181818
- **문법:**

    SQL

    ```
    EXEC p_emp_sel(7698);
    ```

    19

### 📚 IF (조건문)

- **기능:** 조건에 따라 다른 코드를 실행합니다. (교수님이 강조하신 범위)
- **문법 (IF-THEN):**

    SQL

    ```
    IF avg_salary < 3000 THEN
      UPDATE emp SET sal = sal * 1.1;
    END IF;
    ```

    202020202020202020

- **문법 (IF-THEN-ELSE):**

    SQL

    ```
    IF MOD(i, 2) = 1 THEN
      v_sum := v_sum + i;
    ELSE
      -- (만족 안 할 때 실행할 명령문)
    END IF;
    ```

    212121212121212121

### 📚 FOR (반복문)

- **기능:** 정해진 범위(초기값..최종값)만큼 코드를 반복 실행합니다. (교수님이 강조하신 범위)
- **문법:**

    SQL

    ```
    v_sum NUMBER := 0;
    BEGIN
      FOR i IN 1..100 LOOP
        v_sum := v_sum + i;
      END LOOP;
      DBMS_OUTPUT.PUT_LINE('sum : ' || v_sum);
    END
    ```

    22222222222222222222222222222222

---

## 2. PL/SQL 함수 (Function)

### 📚 CREATE [OR REPLACE] FUNCTION

- **기능:** 프로시저와 유사하지만, **반드시 하나의 값을 반환(RETURN)**해야 합니다. 232323232323
- **특징:** 프로시저(`EXEC`)와 달리, 함수는 `SELECT` 문 등 SQL 문장 안에서 사용됩니다. 242424
- **문법 (기본 구조):**

    SQL

    ```
    CREATE [OR REPLACE] FUNCTION 함수이름 ( 
      매개변수명 IN 자료형 
    )
    RETURN 반환할자료형
    AS
      [변수 선언부]
    BEGIN
      [실행할 프로그램 내용]
      RETURN 반환값;
    EXCEPTION
      [오류 처리부]
    END;
    ```

    25

- **주의사항:**
    
    1. `RETURN 반환할자료형` 선언이 필수입니다. 26
    2. `BEGIN` 블록 안에 `RETURN 반환값;`이 반드시 포함되어야 합니다. 27
    3. 매개변수와 `RETURN` 자료형에는 자리수를 지정하지 않습니다. (예: `varchar2` (O), `varchar2(20)` (X)) 28282828

### 📚 함수 사용하기

- **기능:** 내장 함수(`SUM`, `AVG`)처럼 SQL 문장에서 함수를 호출하여 결과를 받습니다. 29
- **문법 (SELECT 절에서 사용):**

    SQL

    ```
    SELECT ename, sal, f_grade(sal)
    FROM emp;
    ```

    30

- **문법 (WHERE 절에서 사용):**

    SQL

    ```
    SELECT ename, job, sal
    FROM emp
    WHERE f_grade(sal) = 'High salary';
    ```

    31313131

네, 7장(`07_...pdf`) 파일을 다시 검토했습니다.

이전 정리에서 교수님이 언급하신 시험 범위(Procedure, Function)에 맞춰 **트리거(Trigger), 뷰(View), 인덱스(Index) 관련 내용은 의도적으로 제외**했습니다. 해당 부분은 DDL, DML, PL/SQL(프로시저, 함수) 범위에 포함되지 않기 때문입니다.

프로시저와 함수 부분에서 이전에 생략했던 세부 문법 몇 가지를 발견했습니다. 요청하신 형식에 맞춰 이어서 작성합니다.

---

## 1. PL/SQL 프로시저 (추가)

### 📚 주석 (Comment)

- **기능:** 코드에 대한 설명을 작성하며, 컴파일 시에는 제외됩니다.
- **문법 (한 줄 주석):**

    SQL

    ```
    -- print result
    DBMS_OUTPUT.PUT_LINE(eid);
    ```
    
- **문법 (여러 줄 주석):**

    SQL

    ```
    /*
      get employee info.
      SELECT ename, job INTO v_ename, v_job ...
    */
    ```

### 📚 변수 값 저장 (대입 연산자)

- **기능:** 선언된 변수에 값을 저장(대입)할 때 사용합니다. (SQL의 =와 다름)
- **문법:**

    SQL

    ```
    v_sum := 0;
    v_sum := v_sum + i;
    v_grade := 'Low salary';
    ```

### 📚 변수명 규칙

- **기능:** 변수를 선언할 때 지켜야 할 명명 규칙입니다1.
- **세부 내용:**
    - 첫 글자는 반드시 문자로 시작해야 합니다2.
    - 30Byte (영문 30글자) 이하여야 합니다3.
    - `BEGIN`, `END` 등 예약어(키워드)는 사용할 수 없습니다4.

### 📚 EXCEPTION (예외 처리)

- **기능:** `BEGIN` 블록의 코드가 실행되는 도중 오류가 발생했을 때, 프로그램이 비정상적으로 종료되는 것을 막고 특정 처리를 하도록 합니다.
- **문법 (모든 오류 처리):**

    SQL

    ```
    EXCEPTION
      WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE(SQLERRM); -- SQLERRM은 오류 메시지를 반환하는 내장 변수
    END;
    ```