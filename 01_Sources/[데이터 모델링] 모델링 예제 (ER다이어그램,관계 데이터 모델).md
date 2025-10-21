## 1. **마당대학 요구사항**

> ① 교수(Professor)는 아이디(ssn), 이름(name), 나이(age), 직위(rank), 연구 분야(speciality)를 가진다.  
> ② 학과(Department)에는 학과번호(dno), 학과이름(dname), 학과사무실(office)이있다.  
> ③ 대학원생(Graduate)은 아이디(ssn), 이름(name), 나이(age), 학위과정(deg_prog, 석사/박사)을 가진다.  
> ④ 과제(Project)는 과제번호(pid), 지원기관(sponsor), 개시일(start_date), 종료일(end_date), 예산액 (budget)이있다.  
> ⑤ 학과마다그 학과를 운영(run)하는 교수(학과장이라고 한다)가 한명씩 있다.  
> ⑥ 한 교수가 여러학과에서 근무(work-dept)할 수 있는데, 이때각 학과별로 참여백분율(pct_time)이 기록된다.  
> ⑦ 대학원생에게는 학위 과정을 밟을 전공학과(major)가하나씩 있다.  
> ⑧ 대학원생에게는 어떤과목을 들으면좋을지 조언(advisor)해주는 선임대학원생(학생조언자라고 한다)이있다.  
> ⑨ 과제는 한 교수(연구책임자라고 한다)에의해 관리(manage)된다.  
> ⑩ 과제는 한 사람이상의 교수(공동연구책임자라고 한다)에의해 수행(work-in)된다.  
> ⑪ 한 과제는 한 명이상의 대학원생(연구조교라고 한다)에의해 수행(work-prog)된다.

## 2. **ER다이어그램 만들기**

요구사항을 읽어보면 1~4번은 **엔터티(개체)와 속성**을 정의하고, 5~11번은 엔터티 간의 **관계**와 **카디널리티**를 정의한다는걸 알 수 있다

### 1) 엔터티 및 속성 정의 (1~4번)

- **① 교수 (Professor)
	- ![img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1761922799&allow_ip=&allow_referer=&signature=kWoj0HH172f4mEHsq2px8C4n%2FTs%3D|400](https://blog.kakaocdn.net/dna/cZHXQz/btq6CPk3geN/AAAAAAAAAAAAAAAAAAAAAFAGieCKVJYRwdZdh9sVEEw6S-vSdqhVq4ULnLrqzk7H/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1761922799&allow_ip=&allow_referer=&signature=kWoj0HH172f4mEHsq2px8C4n%2FTs%3D)
- **② 학과 (Department)
	- ![img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1761922799&allow_ip=&allow_referer=&signature=uAbqeI5ooRBdKCMokqsF0yhx0Do%3D](https://blog.kakaocdn.net/dna/SPFJL/btq6FvsOXCD/AAAAAAAAAAAAAAAAAAAAAMgqg5QoNvzQwCLM4JwrSTbzEUs9T8ifndmoy8OFsHMl/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1761922799&allow_ip=&allow_referer=&signature=uAbqeI5ooRBdKCMokqsF0yhx0Do%3D)
- **③ 대학원생 (Graduate)
	- ![img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1761922799&allow_ip=&allow_referer=&signature=GW8L0CYNA%2FdRUgME5zg4rwMH1zo%3D](https://blog.kakaocdn.net/dna/mEXvS/btq6AO1q6nA/AAAAAAAAAAAAAAAAAAAAAAL9fNc6GkbIYBbLjik4BliR0y94x56CTUjBgOt1GMJ6/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1761922799&allow_ip=&allow_referer=&signature=GW8L0CYNA%2FdRUgME5zg4rwMH1zo%3D)**
- **④ 과제 (Project)**

### 2) 관계 및 카디널리티 정의 (5~11번)

- **⑤ run (학과장) : Professor - Department**
    
    > **해석:** 학과마다 학과장(교수)은 **한 명**입니다. (1:1 관계)
    
- **⑥ work-dept (근무) : Professor - Department**
    
    > **해석:** 교수는 **여러** 학과에서, 학과는 **여러** 교수가 근무할 수 있습니다. (N:M 관계) 관계 속성으로 `pct_time`을 가집니다.
    
- **⑦ major (전공) : Department - Graduate**
    
    > **해석:** 학과는 **여러** 대학원생을 포함하지만, 대학원생의 전공학과는 **하나**입니다. (1:N 관계)
    
- **⑧ advisor (학생 조언자) : Graduate - Graduate**
    
    > **해석:** 선임 대학원생이 다른 대학원생을 조언합니다. (1:N 순환 관계)
    
- **⑨ manage (연구 책임자) : Professor - Project**
    
    > **해석:** 교수는 **여러** 과제를 관리(manage)할 수 있지만, 과제는 **한 명**의 연구 책임자(교수)에 의해 관리됩니다. (1:N 관계)
    
- **⑩ work-in (공동 연구) : Professor - Project**
    
    > **해석:** 교수는 **여러** 과제에, 과제는 **여러** 교수가 참여(work-in)할 수 있습니다. (N:M 관계)
    
- **⑪ work-prog (연구 조교) : Graduate - Project**
    
    > **해석:** 대학원생은 **여러** 과제에, 과제는 **여러** 대학원생이 수행(work-prog)할 수 있습니다. (N:M 관계)
## 3. ERD ->**관계 데이터 모델**

ERD를 관계 데이터 모델로 변환할 때는 1:1, 1:N, M:N 관계 규칙에 따라 외래 키(FK)를 반영하거나 신규 매핑 테이블을 생성해야 합니다. 다시 관계 정보를 보자

> ⑤ 학과마다그 학과를 운영(run)하는 교수(학과장이라고 한다)가 한명씩 있다.  
> ⑥ 한 교수가 여러학과에서 근무(work-dept)할 수 있는데, 이때각 학과별로 참여백분율(pct_time)이 기록된다.  
> ⑦ 대학원생에게는 학위 과정을 밟을 전공학과(major)가하나씩 있다.  
> ⑧ 대학원생에게는 어떤과목을 들으면좋을지 조언(advisor)해주는 선임대학원생(학생조언자라고 한다)이있다.  
> ⑨ 과제는 한 교수(연구책임자라고 한다)에의해 관리(manage)된다.  
> ⑩ 과제는 한 사람이상의 교수(공동연구책임자라고 한다)에의해 수행(work-in)된다.  
> ⑪ 한 과제는 한 명이상의 대학원생(연구조교라고 한다)에의해 수행(work-prog)된다.

---

### 1. (1:1) 및 (1:N) 관계 매핑 (FK 추가)

'N'쪽(또는 1:1에서 선택한 한쪽) 테이블에 상대방의 기본 키(PK)를 외래 키(FK)로 추가하여 구현합니다.

[현재 (1:1), (1:N)인 관계 정리]

- Proffessor - run - Department
- Department - major - Graduate
- Proffessor - manage - Project
- Graduate - advisor - Graduate

**[관계 데이터 모델]**

- Professor (<u>ssn</u>, name, age, rank. speciallity)
- Department (<u>dno</u>, dname, office, <u>run_prof_ssn</u>)  
- Graduate (<u>ssn</u>, name, age, deg_prog, <u>dno</u> , <u>adv_grad_ssn</u> )  
- Project (<u>pid</u>, sponsor, start_date, end_date, budget, <u>manage_prof_ssn</u>)

**[관계 데이터 모델의 외래 키(FK) 상세]**

- `Department.run_prof_ssn` (→ `Professor.ssn`)
    - (⑤ 학과장(run) 1:1 관계)
- `Graduate.dno` (→ `Department.dno`)
    - (⑦ 대학원생의 전공학과(major) 1:N 관계)
- `Graduate.adv_grad_ssn` (→ `Graduate.ssn`)
    - (⑧ 학생 조언자(advisor) 1:N 순환 관계)
- `Project.manage_prof_ssn` (→ `Professor.ssn`)
    - (⑨ 연구 책임자(manage) 1:N 관계)

---

### 2. (M:N) 관계 매핑 (신규 매핑 테이블 생성)

M:N 관계는 양쪽 엔터티의 PK를 외래 키(FK)로 참조하여 **복합 기본 키(Composite PK)**를 구성하는 별도의 **매핑 테이블(Mapping Table)**을 생성합니다. 관계 자체가 가지는 속성(예: `pct_time`)도 이 테이블에 추가합니다.

**[M:N 관계 매핑 테이블 스키마]**

- **work_dept** (<u>professor_ssn</u>, <u>dno</u>, pct_time)
    - (FK: `professor_ssn` → `Professor.ssn`)
    - (FK: `dno` → `Department.dno`)
    - (⑥ 교수-학과 근무(work-dept) 관계. `pct_time`은 관계 속성)
- **work_in** (<u>professor_ssn</u>, <u>pid</u>)
    - (FK: `professor_ssn` → `Professor.ssn`)
    - (FK: `pid` → `Project.pid`)
    - (⑩ 교수-과제 공동연구(work-in) 관계)
- **work_prog** (<u>graduate_ssn</u>, <u>pid</u>)
    - (FK: `graduate_ssn` → `Graduate.ssn`)
    - (FK: `pid` → `Project.pid`)
    - (⑪ 대학원생-과제 수행(work-prog) 관계)

