---
type: 생각조각
status: inbox
source:
creation_date: 2025-10-19
---

알겠습니다. 업로드하신 **05_SQL_Select.pdf**(5장)에서 **핵심 개념(키워드)**, **간결한 기능 설명**, **대표 사용 문법**을 한 눈에 보이도록 정리했습니다. (페이지 표기 포함)

---

## **1) SQL 언어 개요 & 분류 (DDL · DML · DCL)**

- **SQL 분류**: DDL(CREATE/ALTER/DROP), DML(INSERT/UPDATE/DELETE/SELECT), DCL(GRANT/REVOKE). _COMMIT/ROLLBACK, PL/SQL의 DECLARE/BEGIN/END도 함께 언급._ _(p.2–4)_ 
- **특징**: 키워드·테이블/컬럼명은 **대소문자 구분 안 함**, 문자열 비교는 **대소문자 구분**. 명령 끝은 세미콜론 ;. _(p.5)_ 

---

## **2) 예제 스키마(EMP/DEPT)와 초기 데이터**

- **DEPT**: (DEPTNO PK, DNAME, LOC) / **EMP**: (EMPNO PK, ENAME, JOB, MGR(SELF FK), HIREDATE, SAL, COMM, DEPTNO(FK→DEPT)).
- **생성 & 샘플데이터**: 문서에 DDL/INSERT 예시 제공(예: to_date('1981-11-17','yyyy-mm-dd')).

```
CREATE TABLE DEPT (
  DEPTNO NUMBER(2,0) NOT NULL,
  DNAME  VARCHAR2(14),
  LOC    VARCHAR2(13),
  CONSTRAINT DEPT_PRIMARY_KEY PRIMARY KEY (DEPTNO)
);

CREATE TABLE EMP (
  EMPNO    NUMBER(4,0) NOT NULL,
  ENAME    VARCHAR2(10),
  JOB      VARCHAR2(9),
  MGR      NUMBER(4,0),
  HIREDATE DATE,
  SAL      NUMBER(7,2),
  COMM     NUMBER(7,2),
  DEPTNO   NUMBER(2,0) NOT NULL,
  CONSTRAINT EMP_SELF_KEY     FOREIGN KEY (MGR)    REFERENCES EMP(EMPNO),
  CONSTRAINT EMP_FOREIGN_KEY  FOREIGN KEY (DEPTNO) REFERENCES DEPT(DEPTNO),
  CONSTRAINT EMP_PRIMARY_KEY  PRIMARY KEY (EMPNO)
);
```

---

## **3) SELECT 기본 문법**

- **형식**: SELECT 컬럼 … FROM 테이블 \[WHERE 조건];

```
SELECT ename, sal
FROM emp
WHERE job = 'SALESMAN';
```

---

## **4) DISTINCT / * (전체 컬럼)**

- **DISTINCT**: 결과 **중복 제거**. \*: 모든 컬럼.

```
SELECT DISTINCT job FROM emp;
SELECT * FROM dept;
```

---

## **5) WHERE 조건: 비교/논리 연산자**

- **비교연산자**: =, <>, >, >=, <, <= / **논리연산자**: AND, OR, NOT

```
SELECT ename, hiredate, sal
FROM emp
WHERE hiredate >= '1981-09-01' AND sal >= 1500;

SELECT ename, job, sal
FROM emp
WHERE NOT (job = 'SALESMAN' OR job = 'ANALYST');
```

---

## **6) NULL 비교**

- **NULL은 일반 비교연산자 불가** → IS NULL / IS NOT NULL 사용.
```
SELECT ename, comm FROM emp WHERE comm IS NOT NULL;
SELECT ename, comm FROM emp WHERE comm > 0;  -- 0 초과만(=NULL 제외)
```

---

## **7) 다중 값 비교: BETWEEN/IN**

- **BETWEEN a AND b**: **경계값 포함**. **IN (...)****/****NOT IN (...)**: 목록 비교.

```
SELECT ename, sal FROM emp WHERE sal BETWEEN 1000 AND 2000;
SELECT ename, job, sal
FROM emp
WHERE job IN ('CLERK','ANALYST','MANAGER');
```

---

## **8) LIKE(패턴 매칭)**

- **%**: 0자 이상, \_: 임의의 1자. 

```
SELECT ename, job FROM emp WHERE ename LIKE 'A%';
SELECT ename, job FROM emp WHERE ename LIKE '__A%';
```

---

## **9) 내장 집계함수 & 유의점**

- **COUNT, MAX, MIN, AVG, SUM**. COUNT(col)은 **NULL 제외** → 행 수는 COUNT(\*) 권장. 평균/합도 NULL 포함 행은 계산에서 제외. 

```
SELECT COUNT(*) FROM emp;
SELECT MAX(sal), MIN(sal), MAX(sal)-MIN(sal) FROM emp;
SELECT ROUND(AVG(sal), 2) FROM emp;  -- 소수 2자리
```

- **산술연산**: 숫자컬럼끼리 연산 가능(예: 급여 10% 인상 표시). _(p.31)_ 

```
SELECT ename, sal, sal*1.1 AS raised FROM emp WHERE job='ANALYST';
```

---

## **10) 정렬(ORDER BY)**

- **ASC/ DESC (내림차순)** 지원, 다중 정렬 가능.

```
SELECT ename, hiredate FROM emp WHERE job='SALESMAN' ORDER BY hiredate DESC;
SELECT deptno, ename, job FROM emp ORDER BY deptno, ename;
```

---

## **11) 그룹(GROUP BY) & 그룹조건(HAVING)**

- **GROUP BY**: 그룹 단위 집계. **SELECT에 올 수 있는 항목**은 그룹 컬럼 또는 집계결과만.
- **HAVING**: 그룹화 **이후**의 조건, **WHERE**은 그룹화 **이전**의 행 조건.

```
SELECT deptno, COUNT(*) AS cnt_emp
FROM emp
GROUP BY deptno
HAVING COUNT(*) >= 5
ORDER BY COUNT(*) DESC;
```

---

## **12) 조인(JOIN)**

### **12‑1) 기본/내부 조인 & 별칭**

- 공통 컬럼 기준으로 연결. 컬럼 이름 충돌 방지를 위해 **테이블 접두사** 또는 **별칭** 사용.

```
SELECT e.ename, d.dname, d.loc
FROM emp e, dept d
WHERE e.deptno = d.deptno
  AND e.sal >= 1500;
```

### **12‑2) 외부 조인**

- **Left/Right Outer Join**: 부족한 쪽을 NULL로 채움.
    - 오라클 전용 구문: (+)를 **데이터가 부족한 쪽**에 표기. _(p.49, p.51)_ 
    - **표준 SQL 구문**도 소개됨. _(p.50)_ 

```
-- Oracle 전용 예시
SELECT T1.code, name, discount
FROM T1, T2
WHERE T1.code = T2.code(+);          -- LEFT OUTER JOIN

-- 표준 SQL 예시
SELECT T1.code, name, discount
FROM T1 LEFT OUTER JOIN T2 ON T1.code = T2.code;
```

### **12‑3) Full Outer Join (문서 예시 구현)**

- 문서에서는 **LEFT/RIGHT OUTER 결과를** **UNION****으로 결합**하는 예시를 통해 Full‑like 결과를 구현.

```
SELECT T1.code, name, discount
FROM T1, T2
WHERE T1.code = T2.code(+)
UNION
SELECT T2.code, name, discount
FROM T1, T2
WHERE T1.code(+) = T2.code;
```

### **12‑4) 셀프 조인 & 3‑테이블 조인**

- **Self Join**: 같은 테이블을 두 번 참조(별칭 필수). _(p.54–55)_ 
- **N개 테이블 조인 규칙**: **(N‑1)개의 조인 조건** 필요. _(p.56)_ 

```
SELECT e.ename AS employee, m.ename AS manager
FROM emp e, emp m
WHERE e.mgr = m.empno;

SELECT ct.name, cl.language
FROM country co, city ct, countrylanguage cl
WHERE co.capital = ct.id
  AND cl.countrycode = co.code
  AND co.name = 'Greece';
```

- **조인 실전 예시**: 지역·상사 기준 조회 등 다수 제시. _(p.57–59)_ 

---

## **13) 집합 연산자 (UNION/INTERSECT/MINUS)**

- **UNION**(합집합, 중복 제거), **INTERSECT**(교집합), **MINUS**(차집합).

    예: “급여≥2500 − MANAGER” _(p.60)_ 

```
SELECT ename, hiredate FROM emp WHERE sal >= 2500
MINUS
SELECT ename, hiredate FROM emp WHERE job = 'MANAGER';
```

---

## **14) 중첩 SQL(서브쿼리)**

- **정의**: SQL 안의 SQL. _(p.61)_ / **단일값 vs 다중값** 구분. _(p.62)_ 
- **단일값 서브쿼리**는 =, >, < 등 비교 가능. _(p.63–65)_ 
- **다중값**은 IN/NOT IN 사용. _(p.66–67)_ 
- **EXISTS/NOT EXISTS**: 상관 서브쿼리로 “존재여부” 판단(존재 확인 시 즉시 참으로 평가). _(p.68–70)_ 

```
-- 최고 급여 사원
SELECT ename, job, sal
FROM emp
WHERE sal = (SELECT MAX(sal) FROM emp);

-- 부서 이름에 'S' 포함 부서에 근무하는 사원
SELECT ename, job, deptno
FROM emp
WHERE deptno IN (SELECT deptno FROM dept WHERE dname LIKE '%S%');

-- 사원이 1명이라도 있는 부서
SELECT dname, loc
FROM dept
WHERE EXISTS (SELECT * FROM emp WHERE emp.deptno = dept.deptno);
```

---

## **15) SQL Developer 실습 팁**

- **결과 탭 ‘핀’ 고정**으로 이전/현재 결과 비교. _(p.71–72)_
- **결과의 SQL 보기 아이콘**으로 생성 SQL 확인. _(p.73)_
- **결과 그리드 컬럼 더블클릭으로 정렬**(테이블 자체에는 영향 없음). _(p.74)_ 

---

## **16) 빠른 암기 포인트(시험 대비)**

- COUNT(*)는 **NULL 포함 행 전체 카운트**, COUNT(col)은 **NULL 제외**. _(p.28)_ 
- BETWEEN은 **양끝 포함** / LIKE '%…%', LIKE '__A%' 패턴. _(p.21, p.26)_ 
- **GROUP BY 이후 조건은 HAVING**, 정렬은 항상 마지막 ORDER BY. _(p.36–37)_ 
- 조인 시 **(N‑1)개의 조인조건** 필요, **별칭**으로 가독성/충돌 예방. _(p.56, p.45)_ 

---

## **17) 대표 문법 모음(치트시트)**

```
-- 선택
SELECT col1, col2 FROM T WHERE cond;

-- 중복 제거 / 전컬럼
SELECT DISTINCT col FROM T;
SELECT * FROM T;

-- 다중조건
WHERE a BETWEEN 10 AND 20
  AND b IN ('X','Y')
  AND c IS NOT NULL
  AND name LIKE 'A%';

-- 집계/그룹/정렬
SELECT deptno, COUNT(*) AS cnt
FROM emp
GROUP BY deptno
HAVING COUNT(*) >= 5
ORDER BY cnt DESC;

-- 조인
SELECT e.ename, d.dname
FROM emp e, dept d
WHERE e.deptno = d.deptno;

-- 서브쿼리(단일값/다중값/존재여부)
WHERE sal >= (SELECT AVG(sal) FROM emp);
WHERE deptno IN (SELECT deptno FROM dept WHERE dname LIKE '%S%');
WHERE EXISTS (SELECT 1 FROM emp WHERE emp.deptno = dept.deptno);

-- 집합연산
SELECT a FROM T1
UNION
SELECT a FROM T2;

SELECT a FROM T1
MINUS
SELECT a FROM T2;
```

---

### **참고/주의**

- 문서 예시에서 날짜 비교에 문자열을 쓰는 부분이 있으니, 실습에서는 TO_DATE('YYYY-MM-DD','YYYY-MM-DD')로 **DATE 형 변환**을 명시하면 안전합니다.

## **1) 한눈에 보는 지도**

- **DDL**: 테이블/제약 등 **구조**를 만들고 바꾸고 지움 → CREATE, ALTER, DROP
- **DML**: 테이블 **데이터**를 넣고/바꾸고/지움 → INSERT, UPDATE, DELETE (+ SELECT)
- **트랜잭션**: COMMIT 확정 / ROLLBACK 취소 _(특히 UPDATE/DELETE 직후 주의!)_

---

## **2) DDL — CREATE**

### **2‑1. 테이블 생성 기본구조**

```
CREATE TABLE 테이블명 (
  컬럼명 자료형 [NOT NULL] [DEFAULT 기본값],
  ...
  [CONSTRAINT 제약명 PRIMARY KEY (컬럼목록)],
  [CONSTRAINT 제약명 UNIQUE (컬럼목록)],
  [CONSTRAINT 제약명 FOREIGN KEY (컬럼목록)
     REFERENCES 부모테이블(컬럼목록)
     ON DELETE {CASCADE | SET NULL}]
  -- (Oracle은 ON UPDATE 미지원)
);
```

### **2‑2. 자주 쓰는 자료형(Oracle)**

- **NUMBER(p,s)**, **CHAR(n)**(고정), **VARCHAR2(n)**(가변), **DATE**, **TIMESTAMP**
- 문자형은 **길이 필수**, 숫자는 정밀도/스케일 **생략 가능**

### **2‑3. 제약 요약**

- **PRIMARY KEY**: 중복X + NULLX
- **UNIQUE**: 중복X + NULL **가능**
- **FOREIGN KEY**: 참조 무결성; 삭제 시 **ON DELETE CASCADE/SET NULL** 자주 출제

    _(Oracle은_ _ON UPDATE_ _옵션 없음 → 함정)_

### **2‑4. CTAS (질의 결과로 테이블 생성)**

```
CREATE TABLE high_sal_emp AS
SELECT * FROM emp WHERE sal >= 2000;
```

---

## **3) DDL — ALTER / RENAME / DROP**

### **3‑1. 컬럼 추가/이름변경/형식변경/삭제**

```
-- ADD
ALTER TABLE my_dept ADD budget NUMBER(10,2) DEFAULT 0;

-- RENAME COLUMN
ALTER TABLE my_dept RENAME COLUMN budget TO dept_budget;

-- MODIFY (길이/정밀도 변경)
ALTER TABLE my_dept MODIFY dept_budget NUMBER(12,2);

-- DROP COLUMN (데이터도 함께 사라짐!)
ALTER TABLE my_dept DROP COLUMN dept_budget;
```

### **3‑2. 제약 추가(사후 부여)**

```
ALTER TABLE my_emp
  ADD CONSTRAINT pk_empno PRIMARY KEY (empno);

ALTER TABLE my_emp
  ADD CONSTRAINT fk_emp_dept
  FOREIGN KEY (deptno) REFERENCES my_dept(deptno)
  ON DELETE SET NULL;   -- or CASCADE
-- (ON UPDATE는 Oracle에서 지원하지 않음)
```

### **3‑3. 테이블 이름 변경 / 삭제**

```
ALTER TABLE high_sal_emp RENAME TO my_sal_high;

DROP TABLE tmp;  -- 구조 + 데이터 전부 삭제
```

---

## **4) DML — INSERT / UPDATE / DELETE**

### **4‑1. INSERT**

```
-- 권장: 컬럼목록 명시
INSERT INTO my_dept (deptno, dname, loc)
VALUES (10, 'ACCOUNTING', 'NEW YORK');

-- 컬럼목록 생략 시: 테이블 정의 '전체 컬럼 순서'와 값 개수/타입 일치해야 함
INSERT INTO my_dept VALUES (20, 'RESEARCH', 'DALLAS');

-- 일부 컬럼만: 지정 안 한 컬럼은 DEFAULT 또는 NULL (NOT NULL이면 오류)
INSERT INTO my_dept (deptno, dname) VALUES (30, 'SALES');

-- INSERT ... SELECT (대량 복사)
INSERT INTO my_sal_high
SELECT * FROM my_emp WHERE sal BETWEEN 1500 AND 1999;
```

### **4‑2. UPDATE**

```
-- 기본형
UPDATE my_dept
SET loc = 'JEJU'
WHERE deptno = 10;

-- 다중 조건/산술
UPDATE my_emp
SET sal = sal * 1.10
WHERE job = 'SALESMAN';

-- 서브쿼리 활용
-- 최저 연봉자 10% 인상
UPDATE my_emp
SET sal = sal * 1.10
WHERE sal = (SELECT MIN(sal) FROM my_emp);

-- 최저 연봉을 특정 사원 급여로 맞추기
UPDATE my_emp
SET sal = (SELECT sal FROM my_emp WHERE ename = 'BLAKE')
WHERE sal = (SELECT MIN(sal) FROM my_emp);
```

### **4‑3. DELETE**

```
DELETE FROM my_dept
WHERE deptno = 60;
```

### **4‑4. DROP vs DELETE**

- **DELETE**: **행(데이터)**만 삭제, **구조 유지** → 재삽입 가능
- **DROP**: **테이블 자체** 삭제(구조+데이터 모두 소멸)

> 트랜잭션 기억: 필요한 지점에서 **COMMIT**(확정) / **ROLLBACK**(취소)

---

## **5) 시험 함정 & 체크리스트(암기)**

1. **INSERT에서 컬럼목록 생략 금물** (정확히 전 컬럼/순서/타입 일치 필요)
2. **문자/날짜 리터럴 타입 주의**: 날짜는 가급적 TO_DATE('YYYY-MM-DD','YYYY-MM-DD')로
3. **UNIQUE vs PK**: UNIQUE는 NULL 허용, PK는 NULL 불가
4. **외래키 옵션**: ON DELETE {CASCADE | SET NULL}만 실전; **ON UPDATE** **없음**
5. **ALTER DROP COLUMN**은 해당 컬럼 **데이터도 함께 삭제** → 필요 시 CTAS로 백업
6. **UPDATE/DELETE에 WHERE 누락** 금지(전행 변경/삭제 사고) → 실행 전 SELECT로 검증
7. **DEFAULT SYSDATE**는 괄호 없이 DEFAULT SYSDATE

---

## **6) 빠른 템플릿 모음(복붙용)**

**CREATE + 제약**

```
CREATE TABLE my_dept(
  deptno NUMBER(2)    CONSTRAINT pk_dept PRIMARY KEY,
  dname  VARCHAR2(14) NOT NULL,
  loc    VARCHAR2(13) NOT NULL
);

CREATE TABLE my_emp(
  empno    NUMBER(5)    CONSTRAINT pk_emp PRIMARY KEY,
  ename    VARCHAR2(20) NOT NULL,
  job      VARCHAR2(9)  NOT NULL,
  hiredate DATE         NOT NULL,
  sal      NUMBER(7,2)  NOT NULL,
  deptno   NUMBER(2),
  CONSTRAINT fk_emp_dept
    FOREIGN KEY (deptno) REFERENCES my_dept(deptno)
    ON DELETE SET NULL
);
```

**ALTER**

```
ALTER TABLE my_dept ADD budget NUMBER(12,2) DEFAULT 0;
ALTER TABLE my_dept RENAME COLUMN budget TO dept_budget;
ALTER TABLE my_dept MODIFY dept_budget NUMBER(14,2);
ALTER TABLE my_dept DROP COLUMN dept_budget;

ALTER TABLE my_emp
  ADD CONSTRAINT uk_emp_name UNIQUE (ename);
```

**DML + 트랜잭션**

```
INSERT INTO my_dept (deptno, dname, loc) VALUES (50, 'PROGRAM', 'NEW');
UPDATE my_emp SET sal = sal * 1.05 WHERE deptno = 20;
DELETE FROM my_dept WHERE deptno = 50;

COMMIT;  -- 확정
-- ROLLBACK;  -- 취소
```

**INSERT … SELECT**

```
INSERT INTO my_emp_copy
SELECT * FROM my_emp WHERE sal >= 1500;
```

---

## **7) 10분 컷 핵심암기 문장**

- **“DDL=구조, DML=데이터, COMMIT/ROLLBACK=확정/취소.”**
- **“PK: 중복·NULL 불가 / UNIQUE: 중복 불가·NULL 허용.”**
- **“FK 삭제 동작은 ON DELETE만(SET NULL/CASCADE), ON UPDATE 없음.”**
- **“INSERT는 컬럼목록 습관화, UPDATE/DELETE는 WHERE 필수.”**

좋아. **7장(시험범위 한정: PL/SQL procedure & function + IF/FOR + DML 응용)**만 깔끔하게 정리해줄게.

(_트리거/뷰/인덱스는 시험범위 제외로 보며, 간단 언급만 하고 내용에서는 제외했어._)

---

## **0) 한눈에 보는 핵심 키워드**

- **PL/SQL 블록 구조**: DECLARE → BEGIN → EXCEPTION → END;
- **변수 선언/대입**: v_name TYPE [:= 초기값]; / 대입은 :=
- **조건/반복**: IF … ELSIF … ELSE … END IF; / FOR … LOOP … END LOOP;
- **단일행 조회**: SELECT … INTO 변수 … (정확히 1행만!)
- **DML**: INSERT/UPDATE/DELETE를 블록/프로시저/함수 내부에서 사용 가능
- **프로시저 실행**: EXEC proc_name(…) 또는 BEGIN proc_name(…); END;
- **함수 사용**: SELECT f_name(…) FROM … (반드시 **하나의 값 반환**)
- **매개변수 모드**: IN(입력, 기본) / OUT(출력) / IN OUT(입·출력)
- **자주 나는 오류**: RETURN 자료형에 **자릿수 쓰지 않기**(예: RETURN VARCHAR2), SELECT … INTO에서 0행/다행 예외, = vs :=

---

## **1) PL/SQL 블록 뼈대**

```
DECLARE
  v_cnt NUMBER := 0;  -- 변수 선언
BEGIN
  -- 본문(DML/제어문)
  NULL;               -- 자리표시자
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    DBMS_OUTPUT.PUT_LINE('no row');
  WHEN OTHERS THEN
    DBMS_OUTPUT.PUT_LINE(SQLERRM);
END;
/
```

- -- 한 줄 주석, /* ... */ 블록 주석
- EXCEPTION은 선택이지만, 단일행 조회가 있으면 웬만하면 넣자.

---

## **2) 변수/타입 선언 팁**

- **기본 타입**: NUMBER, VARCHAR2(n), DATE 등
- **앵커 타입**: 테이블 정의를 따라가게
    - v_sal EMP.SAL%TYPE;
    - v_emp EMP%ROWTYPE;
- 기본값: v_rate NUMBER := 0.1;

---

## **3) 제어문(시험 포인트: IF / FOR)**

```
IF v_sal >= 3000 THEN
  ...
ELSIF v_sal >= 2000 THEN
  ...
ELSE
  ...
END IF;

FOR i IN 1..10 LOOP
  -- 10회 반복
END LOOP;

-- 커서 FOR 루프(가장 실전적)
FOR r IN (SELECT empno, sal FROM emp WHERE deptno = 30) LOOP
  UPDATE emp SET sal = r.sal * 1.1 WHERE empno = r.empno;
END LOOP;
```

---

## **4)** 

## **SELECT ... INTO**

##  **(단일행 필수)**

```
DECLARE
  v_sal EMP.SAL%TYPE;
BEGIN
  SELECT sal INTO v_sal
  FROM emp
  WHERE empno = 7369;   -- 반드시 1행만 나오게 조건 설계
END;
/
```

- 0행이면 NO_DATA_FOUND, 2행 이상이면 TOO_MANY_ROWS.

---

## **5) 프로시저(Procedure)**

### **문법 & 특징**

- 반환값 없음(결과는 OUT/IN OUT 매개변수나 DML로 반영)
- DML 자유롭게 가능 (일반적으로 COMMIT/ROLLBACK은 호출자에서 관리)

```
CREATE OR REPLACE PROCEDURE p_raise_dept
( p_deptno IN NUMBER
, p_rate   IN NUMBER DEFAULT 0.10 )
IS
BEGIN
  UPDATE emp
     SET sal = sal * (1 + p_rate)
   WHERE deptno = p_deptno;
-- COMMIT은 보통 호출자에서; 시험에선 생략해도 OK
EXCEPTION
  WHEN OTHERS THEN
    DBMS_OUTPUT.PUT_LINE(SQLERRM);
END;
/
-- 실행
EXEC p_raise_dept(30, 0.1);
```

### **OUT 파라미터 예**

```
CREATE OR REPLACE PROCEDURE p_minmax
( p_deptno IN NUMBER
, p_min    OUT NUMBER
, p_max    OUT NUMBER )
IS
BEGIN
  SELECT MIN(sal), MAX(sal)
    INTO p_min, p_max
    FROM emp
   WHERE deptno = p_deptno;
END;
/
```

---

## **6) 함수(Function)**

### **문법 & 특징**

- **반드시 한 개의 값 반환** (RETURN)
- 헤더에서 **반환형/매개변수 타입에 자리수 쓰지 않음**

    (예: RETURN VARCHAR2 / in_value NUMBER)

- SQL문에서 바로 사용 가능 (시험 스타일: SELECT f_grade(sal))

```
CREATE OR REPLACE FUNCTION f_grade (in_value NUMBER)
RETURN VARCHAR2
IS
  v_grade VARCHAR2(20) := 'Low salary';
BEGIN
  IF in_value > 2500 THEN
    v_grade := 'High salary';
  END IF;
  RETURN v_grade;
END;
/
-- 사용
SELECT ename, sal, f_grade(sal) AS grade
FROM emp;

-- 조건에 쓰기
SELECT ename, job, sal
FROM emp
WHERE f_grade(sal) = 'High salary';
```

> 실무 주의: SQL에서 호출되는 함수는 부작용(DML/커밋)을 하지 않는 것이 원칙.

> 이번 시험에선 **연산/판정 함수** 중심으로 보면 충분.

---

## **7) DML 응용 패턴(블록/프로시저/함수 내부)**

- **INSERT**: 조회 결과를 다른 테이블에 적재

```
FOR r IN (SELECT empno, ename, sal, deptno FROM emp WHERE sal >= 2000) LOOP
  INSERT INTO emp_high(empno, ename, sal, deptno)
  VALUES (r.empno, r.ename, r.sal, r.deptno);
END LOOP;
```

- **UPDATE**: 조건별 차등 인상

```
IF v_sal >= 3000 THEN
  UPDATE emp SET comm = NVL(comm,0) + 500 WHERE empno = p_empno;
ELSIF v_sal >= 2000 THEN
  UPDATE emp SET comm = NVL(comm,0) + 200 WHERE empno = p_empno;
ELSE
  UPDATE emp SET comm = NVL(comm,0) + 100 WHERE empno = p_empno;
END IF;
```

- **DELETE**: 조건부 삭제

```
DELETE FROM emp WHERE deptno = p_deptno AND sal < p_cut;
```

---

## **8) 예외 처리(자주 쓰는 것만)**

```
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    ... -- SELECT INTO가 0행
  WHEN TOO_MANY_ROWS THEN
    ... -- SELECT INTO가 2행 이상
  WHEN DUP_VAL_ON_INDEX THEN
    ... -- PK/UNIQUE 위반
  WHEN OTHERS THEN
    DBMS_OUTPUT.PUT_LINE(SQLERRM);
```

---

## **9) “바로 쓰는” 템플릿 6개**

1. **부서별 일괄 인상 프로시저**

```
CREATE OR REPLACE PROCEDURE p_raise_dept(p_deptno IN NUMBER, p_rate IN NUMBER DEFAULT 0.1) IS
BEGIN
  UPDATE emp SET sal = sal * (1 + p_rate) WHERE deptno = p_deptno;
END;
/
```

2. **고연봉 백업 적재 프로시저(커서 FOR 루프)**

```
CREATE OR REPLACE PROCEDURE p_copy_high(p_min_sal IN NUMBER) IS
BEGIN
  FOR r IN (SELECT empno, ename, sal, deptno FROM emp WHERE sal >= p_min_sal) LOOP
    INSERT INTO emp_high(empno, ename, sal, deptno)
    VALUES (r.empno, r.ename, r.sal, r.deptno);
  END LOOP;
END;
/
```

3. **연봉 등급 함수**

```
CREATE OR REPLACE FUNCTION f_grade(in_value NUMBER) RETURN VARCHAR2 IS
  v_grade VARCHAR2(20) := 'Low salary';
BEGIN
  IF in_value > 2500 THEN v_grade := 'High salary'; END IF;
  RETURN v_grade;
END;
/
```

4. **부서 인원 수 함수(서브쿼리→INTO→RETURN)**

```
CREATE OR REPLACE FUNCTION f_cnt_dept(p_deptno NUMBER) RETURN NUMBER IS
  v_cnt NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_cnt FROM emp WHERE deptno = p_deptno;
  RETURN v_cnt;
END;
/
```

5. **사번으로 보너스 차등 지급 프로시저**

```
CREATE OR REPLACE PROCEDURE p_bonus(p_empno IN NUMBER) IS
  v_sal emp.sal%TYPE;
BEGIN
  SELECT sal INTO v_sal FROM emp WHERE empno = p_empno;

  IF v_sal >= 3000 THEN
    UPDATE emp SET comm = NVL(comm,0) + 500 WHERE empno = p_empno;
  ELSIF v_sal >= 2000 THEN
    UPDATE emp SET comm = NVL(comm,0) + 200 WHERE empno = p_empno;
  ELSE
    UPDATE emp SET comm = NVL(comm,0) + 100 WHERE empno = p_empno;
  END IF;
END;
/
```

6. **값 반환 + 예외 처리 예시 함수**

```
CREATE OR REPLACE FUNCTION f_ratio(p_a NUMBER, p_b NUMBER) RETURN NUMBER IS
  v_r NUMBER;
BEGIN
  IF p_b = 0 THEN RETURN NULL; END IF;
  v_r := p_a / p_b;
  RETURN v_r;
EXCEPTION
  WHEN ZERO_DIVIDE THEN RETURN NULL;
END;
/
```

---

## **10) 서술/단답 예상 포인트(암기)**

- **프로시저 vs 함수**
    - 실행: 프로시저는 EXEC / 함수는 **SQL 안에서** 사용
    - 반환: 프로시저 **없음**, 함수 **있음(RETURN)**
- **매개변수 모드**: IN(기본) / OUT / IN OUT
- **커서 FOR 루프 장점**: OPEN/FETCH/CLOSE 없이 **자동 관리**, 가독성 좋음
- **함수 헤더 타입 표기**: RETURN VARCHAR2와 in_value NUMBER처럼 **자릿수 표기 금지**
- **SELECT INTO 규칙**: **정확히 1행**만(0행/다행 → 예외)
- **시험 빈출 DML 패턴**: 일괄 인상/감액, 조건부 INSERT/DELETE, 집계값 OUT 반환

---

## **11) 빈출 실수 체크리스트**

- :=(대입) vs =(비교) 혼동
- 세미콜론 ; 빠짐 / 맨 아래 **슬래시 /**로 컴파일 안 함
- 함수 RETURN 타입/값 불일치
- 변수 타입 하드코딩 → %TYPE로 안정화
- SELECT … INTO에서 다행 발생(조건 불충분)
- OUT 파라미터에 값 대입 누락

---

## **12) 7장 빠른 실습 루틴(30~40분 추천)**

1. f_grade 만들고 SELECT에서 호출
2. p_raise_dept로 특정 부서 급여 10% 인상(ROLLBACK로 원상복구)
3. 커서 FOR로 emp_high 적재 후 건수 확인
4. p_minmax로 OUT 파라미터 동작 확인
5. p_bonus로 사번별 보너스 지급 후 변경 확인
6. 예외 강제(없는 사번 조회) → NO_DATA_FOUND 처리

---

필요하면 위 템플릿을 네가 쓰는 테이블 이름에 맞게 바로 바꿔서 연습하면 돼.

다음 단계로, 이 요약 바탕으로 **실습형 예상문제 6문제 + 이론 6문제(총 12문항)**도 바로 만들어줄 수 있어.