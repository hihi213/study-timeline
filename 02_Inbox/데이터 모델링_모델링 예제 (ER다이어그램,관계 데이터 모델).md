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

요구사항을 읽어보면 1~4번은 **엔터티(개체)와 속성**을 정의하고, 5~11번은 엔터티 간의 **관계**와 **카디널리티**를 정의한다는걸 알 수 있다

## 2.(1~4번)-> **ER다이어그램 만들기**

### 1) 엔터티 및 속성 정의
- **① 교수 (Professor)
	- ![img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1761922799&allow_ip=&allow_referer=&signature=kWoj0HH172f4mEHsq2px8C4n%2FTs%3D|350](https://blog.kakaocdn.net/dna/cZHXQz/btq6CPk3geN/AAAAAAAAAAAAAAAAAAAAAFAGieCKVJYRwdZdh9sVEEw6S-vSdqhVq4ULnLrqzk7H/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1761922799&allow_ip=&allow_referer=&signature=kWoj0HH172f4mEHsq2px8C4n%2FTs%3D)
- **② 학과 (Department)
	- ![img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1761922799&allow_ip=&allow_referer=&signature=uAbqeI5ooRBdKCMokqsF0yhx0Do%3D|350](https://blog.kakaocdn.net/dna/SPFJL/btq6FvsOXCD/AAAAAAAAAAAAAAAAAAAAAMgqg5QoNvzQwCLM4JwrSTbzEUs9T8ifndmoy8OFsHMl/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1761922799&allow_ip=&allow_referer=&signature=uAbqeI5ooRBdKCMokqsF0yhx0Do%3D)
- **③ 대학원생 (Graduate)
	- ![img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1761922799&allow_ip=&allow_referer=&signature=GW8L0CYNA%2FdRUgME5zg4rwMH1zo%3D|300](https://blog.kakaocdn.net/dna/mEXvS/btq6AO1q6nA/AAAAAAAAAAAAAAAAAAAAAAL9fNc6GkbIYBbLjik4BliR0y94x56CTUjBgOt1GMJ6/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1761922799&allow_ip=&allow_referer=&signature=GW8L0CYNA%2FdRUgME5zg4rwMH1zo%3D)
- **④ 과제 (Project)**
	- ![|300](https://blog.kakaocdn.net/dna/csCXJs/btq6BBAzVO5/AAAAAAAAAAAAAAAAAAAAAKiaXk2__50q9OD2vBId3noTlvVqSpgOgsg5TvcmTIhL/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1761922799&allow_ip=&allow_referer=&signature=SdZyWIwoBuL6Oj863h%2F8aLHgnZg%3D)
### 2) 관계 표시(5~11번) - 위 이미지에 1과 N를 표시
- ⑤ 하나의 학과는 하나의 학과장이 운영한다 (1:1 관계)
	- **Professor - Department의 관계: RUN**(운영)
	- ![img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1761922799&allow_ip=&allow_referer=&signature=7QvcPaiCWy%2BCEHKA01aFoW5h06Q%3D|400](https://blog.kakaocdn.net/dna/bq4ocv/btq6BCfaEhp/AAAAAAAAAAAAAAAAAAAAADcT75mVSm0ocUepNvqOaB4_XL6oW3s8N_2UMkIWNOKK/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1761922799&allow_ip=&allow_referer=&signature=7QvcPaiCWy%2BCEHKA01aFoW5h06Q%3D)
- ⑥ 교수는 여러 학과에서, 학과는 **여러** 교수가 근무할 수 있습니다.(N:M 관계)
	- **Professor - Department**의 관계: work-dept (근무)
	- 관계 속성으로 `pct_time`을 가집니다.
	- ![400](https://blog.kakaocdn.net/dna/melVR/btq6EVZDpQm/AAAAAAAAAAAAAAAAAAAAAKyZVY2J5Y_ALbY0vUZQJyzBbBv7RfW3XQ7R8klG118q/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1761922799&allow_ip=&allow_referer=&signature=WZYV%2FqjCxNkMIB5A0BWmoRkWuXA%3D)
- **⑦ 학과는 **여러** 대학원생을 포함하지만, 대학원생의 전공학과는 **하나**입니다. (1:N 관계)
    - Department - Graduate의 관계: major (전공)
	- ![200](https://blog.kakaocdn.net/dna/CeHIo/btq6BDd5K98/AAAAAAAAAAAAAAAAAAAAALuMGkxC1ObQYpvyXx0amRvN28CongpgCKWeYGNueRzD/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1761922799&allow_ip=&allow_referer=&signature=dv9jglFoiTiJXt9f4f%2BaDH51S50%3D)
- **⑧ 선임 대학원생이 다른 대학원생들을 조언합니다. (1:N)
	- Graduate - Graduate advisor (학생 조언자)
- **⑨ manage (연구 책임자) : Professor - Project**
    > **해석:** 교수는 **여러** 과제를 관리(manage)할 수 있지만, 과제는 **한 명**의 연구 책임자(교수)에 의해 관리됩니다. (1:N 관계)
- **⑩ work-in (공동 연구) : Professor - Project**
    > **해석:** 교수는 **여러** 과제에, 과제는 **여러** 교수가 참여(work-in)할 수 있습니다. (N:M 관계)
- **⑪ work-prog (연구 조교) : Graduate - Project**
    > **해석:** 대학원생은 **여러** 과제에, 과제는 **여러** 대학원생이 수행(work-prog)할 수 있습니다. (N:M 관계)

## 2. ERD ->**관계 데이터 모델**

- 1:1, 1:N, M:N 관계 규칙에 따라 변환 방식이 다름
- 1:1, 1:N: 'N'쪽 테이블에 상대방의 기본 키(PK)를 외래 키(FK)로 추가하여 구현합니다.
- M:N 관계는 양쪽 엔터티의 PK의 조합을 PK로 가지는 **별도의 매핑 테이블**을 생성합니다.

**[(1:1), (1:N) 관계 데이터 모델]**

- Professor (<u>ssn</u>, name, age, rank. speciallity)
- Department (<u>dno</u>, dname, office, <u>run_prof_ssn</u>)  
- Graduate (<u>ssn</u>, name, age, deg_prog, <u>dno</u> , <u>adv_grad_ssn</u> )  
- Project (<u>pid</u>, sponsor, start_date, end_date, budget, <u>manage_prof_ssn</u>)

**[M:N 관계 데이터 모델]**

- **work_dept** (<u>professor_ssn</u>, <u>dno</u>, pct_time)
    - (⑥ 교수-학과 근무 N:M 관계. `pct_time`은 관계 속성)
    - (FK: `professor_ssn` → `Professor.ssn`)
    - (FK: `dno` → `Department.dno`)
- **work_in** (<u>professor_ssn</u>, <u>pid</u>)
    - (⑩ 교수-과제 공동연구 N:M 관계)
    - (FK: `professor_ssn` → `Professor.ssn`)
    - (FK: `pid` → `Project.pid`)
- **work_prog** (<u>graduate_ssn</u>, <u>pid</u>)
    - (⑪ 대학원생-과제 수행 N:M 관계)
    - (FK: `graduate_ssn` → `Graduate.ssn`)
    - (FK: `pid` → `Project.pid`)

