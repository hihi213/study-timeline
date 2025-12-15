---
type: 소스
status: inbox
topics:
source_url: "{{SOURCE}}"
author:
creation_date: 2025-12-04
---
## 📖 소스 요약 (Summary)

# 🚀 백엔드 신입 면접 대비: CS 완전 정복 로드맵

## 🔄 1회독: [숲 보기] 흐름과 구조

> **목표:** "요청이 들어와서(Network) $\rightarrow$ OS가 자원을 할당하고(OS) $\rightarrow$ 처리되는(Arch/Logic) 전체 과정을 끊김 없이 설명한다."

### 1. 기초 논리 및 설계 (Logic & Math)

- **[데이터 표현]** 2진수/16진수 변환, 비트 연산 기초 (AND/OR/XOR)
- **[논리/집합]** 명제 논리, **집합론(교/합/차집합) $\leftrightarrow$ SQL JOIN 원리 연결**
- **[상태 관리]** **FSM (유한 상태 머신)** $\leftrightarrow$ 주문/결제 상태 전이(State Transition) 로직의 기초

### 2. 하드웨어 환경 (Architecture)

- **[메모리 계층]** **레지스터 > 캐시 > RAM > Disk** 속도 차이와 비용 구조
- **[CPU 작동]** **CPU Bound(연산 집중) vs I/O Bound(DB/네트워크 대기)** 작업의 차이

### 3. 시스템 실행 환경 (OS)

- **[실행 제어]** **커널 모드 vs 유저 모드 & 시스템 콜(System Call)** (파일/소켓 접근 시 OS 요청 흐름)
- **[메모리 구조]** **스택(Stack, 지역변수/함수) vs 힙(Heap, 동적 객체)** 저장 위치 구분
- **[작업 단위]** **프로세스(독립적) vs 스레드(공유적)** 정의 및 차이점, 컨텍스트 스위칭 비용
    

### 4. 통신 기본 (Network)

- **[계층 구조]** OSI 7계층 & **TCP/IP 4계층** (L4 전송, L7 응용 계층의 역할 집중)
- **[상태 유지]** HTTP의 Stateless 특징 $\leftrightarrow$ **Cookie/Session vs JWT(Token) 인증 방식**
- **[웹의 동작]** **브라우저에 주소를 쳤을 때 흐름:** DNS 캐시 $\rightarrow$ IP 획득 $\rightarrow$ TCP 연결 $\rightarrow$ HTTP 요청
    

---

## 🔍 2회독: [나무 보기] 문제 해결과 심화

> **목표:** "트래픽이 폭주하거나(성능), 데이터가 꼬이거나(정합성), 서버가 죽었을 때(가용성) 해결책을 제시한다."

### 1. 데이터 모델링과 알고리즘 (Logic & Math)

- **[정밀도/효율]** **부동소수점(IEEE 754) 오차(0.1+0.2!=0.3)** 해결, 비트마스킹(Masking) 권한 관리
- **[알고리즘]** 시간 복잡도(Big-O), 점화식/재귀, **트리(DB 인덱스 원리)**, 그래프 탐색(BFS/DFS)
    

### 2. 하드웨어 병목 해결 (Architecture)

- **[캐시 최적화]** **지역성(Locality)의 원리** $\rightarrow$ 캐시 적중률(Hit Rate)을 고려한 코드 작성
- **[CPU 성능]** 파이프라이닝 개념, **분기 예측(Branch Prediction) 실패**가 성능에 미치는 영향
- **[멀티코어]** 멀티코어 환경에서의 **원자성(Atomicity)과 락(Lock)** 필요성
    

### 3. 고성능/안정성 (OS) - ⭐ 집중 공략

- **[동시성 제어]** **경쟁 상태(Race Condition)** 해결: **뮤텍스 vs 세마포어**, **데드락(Deadlock)** 발생 4조건 및 회피
- **[메모리 심화]** 가상 메모리, 페이징, 페이지 교체(LRU), **페이지 폴트(Page Fault)**와 스래싱
- **[I/O 모델]** **Blocking vs Non-Blocking**, **Sync vs Async** (고성능 서버 아키텍처의 핵심)
    

### 4. 신뢰성/확장성 (Network) - ⭐ 집중 공략

- **[신뢰성 보장]** **TCP(신뢰성) vs UDP(속도)**, 3-way/4-way Handshake, 흐름/혼잡 제어
- **[API/설계]** **REST API 원칙**, **멱등성(Idempotency, 중복 요청 안전)**, **CORS(브라우저 보안)**
- **[확장/보안]** **HTTPS(SSL/TLS Handshake)** 암호화, **로드 밸런싱(Load Balancing)** 트래픽 분산
    

---

### 1. 이산수학 (Discrete Mathematics) **[중요도: ⭐⭐]**

알고리즘 코딩 테스트와 DB 원리의 기초가 됩니다.

- **집합 (Set)**
    - **핵심:** SQL의 JOIN 연산이 집합의 원리와 같음을 이해.
- **그래프와 트리 (Graph & Tree)**
    - **핵심:** 트리 구조(계층형 데이터), 그래프 탐색(BFS/DFS)은 코딩 테스트와 직결됨.
- **논리 연산 (Logic)**
    - **핵심:** 명제 논리, Boolean Algebra (조건문 복잡도 줄이기).
        
복잡한 증명은 건너뛰고, **데이터베이스(DB)와 알고리즘 복잡도 분석**에 필요한 개념만 취합니다.

- **집합론 (Set Theory):**
    - RDB(관계형 데이터베이스)의 SQL Join 원리와 직결됩니다.
    - 교집합, 합집합, 차집합 개념과 카티시안 곱(Cartesian Product).
- **논리 (Logic):**
    - 조건문(If-else) 최적화 및 불 대수(Boolean Algebra) 연산.
- **그래프 이론 (Graph Theory):**
    - 네트워크 토폴로지, 최단 경로 알고리즘, 트리 구조(DB 인덱스, 파일 시스템)의 기초.
- **점화식과 수열:**
    - 알고리즘 시간 복잡도(Time Complexity, Big $O$) 분석 및 재귀 함수 이해.
### 2. 논리설계 (Logic Design) **[중요도: ⭐]**

백엔드 면접에서 직접적인 출제 빈도는 가장 낮습니다. 아주 기초만 훑으세요.

- **데이터의 표현 (메모리 주소나 색상 코드 이해):**
    - 2진수, 16진수 변환.
    - **정수 표현:** 2의 보수(Two's Complement)와 오버플로(Overflow) 발생 원리.
    - **실수 표현:** 부동소수점(IEEE 754)의 구조와 정밀도 문제 (금융 데이터 처리 시 중요).
- **비트 연산 (Bitwise Operation):**
    - 플래그(Flag) 처리, AND, OR, XOR, SHIFT 연산의 효율성 권한 관리 등에서의 마스킹(Masking) 및 시프트(Shift) 연산.

### 3. 컴퓨터 구조 (Computer Architecture) **[중요도: ⭐⭐⭐]**


- **메모리 계층 구조 (Memory Hierarchy)**
    - **핵심:** 레지스터 -> 캐시(L1, L2, L3) -> RAM -> Disk 순서와 속도 차이. "왜 캐시를 쓰나요?" (지역성의 원리).
    - **캐시 적중률(Cache Hit Rate)**과 지역성(Locality)의 원리 (코드 작성 시 데이터 접근 패턴 최적화).
- **CPU 작동 원리 (간략히)**
    - **핵심:** 동기/비동기 처리에 대한 이해를 위해 I/O Bound와 CPU Bound 작업의 차이 이해.
- **부동 소수점 (Floating Point)**
    - **핵심:** 컴퓨터가 실수를 표현할 때 생기는 오차(0.1 + 0.2 != 0.3 인 이유). 금융 서비스 백엔드라면 필수 질문.
- **CPU 파이프라이닝 및 병렬 처리:**
    - 명령어 처리 과정의 이해.
    - 분기 예측(Branch Prediction) 실패가 성능에 미치는 영향.




### 4. 운영체제 (Operating Systems) **[중요도: ⭐⭐⭐⭐⭐]**

서버의 자원 관리와 동시성 처리에 직접적인 영향을 미치므로 가장 꼼꼼히 봐야 합니다.

- **프로세스와 스레드 (Process vs Thread)**
    - **핵심:** 둘의 차이점(메모리 공유 여부 등), 멀티 프로세스와 멀티 스레드의 장단점.
    - 멀티 프로세스 vs 멀티 스레드 모델의 차이.
    - 컨텍스트 스위칭(Context Switching) 비용과 오버헤드.
    - **면접 질문:** "크롬 탭은 프로세스인가요 스레드인가요?", "자바에서 스레드를 많이 생성하면 어떤 문제가 생기나요?"
- **동시성 이슈와 동기화 (Concurrency & Synchronization)**
    - **핵심:** 경쟁 상태(Race Condition),, 교착 상태(Deadlock). 임계 영역(Critical Section).
    - **해결책:** 뮤텍스(Mutex)와 세마포어(Semaphore)의 차이.
    - 상호 배제(Mutual Exclusion) 기법: 뮤텍스(Mutex), 세마포어(Semaphore), 모니터(Monitor).
    - **데드락(Deadlock):** 발생 4가지 조건과 해결(회피/예방) 방법.
- **컨텍스트 스위칭 (Context Switching)**
    - **핵심:** 스위칭이 일어날 때 발생하는 비용(Overhead)과 캐시 오염.
- **메모리 관리**
    - **핵심:** 가상 메모리, 페이징(Paging), 세그멘테이션, 페이지 교체 알고리즘(LRU 등).
- **I/O 모델:**
    - Blocking vs Non-Blocking I/O.
    - Synchronous vs Asynchronous I/O.

서버 애플리케이션이 실행되는 환경이므로 가장 깊이 있게 봐야 합니다.

### 5. 컴퓨터 네트워크 (Computer Networks) **[중요도: ⭐⭐⭐⭐⭐]**

웹 서비스의 근간이므로 상세한 동작 원리를 묻습니다.

- **OSI 7계층과 TCP/IP 4계층**
    - **핵심:** 각 계층의 역할과 대표 프로토콜. 특히 전송 계층(L4)과 응용 계층(L7) 집중.
- **TCP vs UDP**
    - **핵심:** 신뢰성(TCP) vs 속도(UDP). 3-way Handshake(연결), 4-way Handshake(해제) 흐름.
- **HTTP & HTTPS**
    - **핵심:** HTTP 메서드(GET vs POST vs PUT vs PATCH), Status Code(200, 400, 500 계열), Stateless 특징.
    - **보안:** HTTPS의 동작 원리(SSL/TLS Handshake, 대칭키/비대칭키 암호화).
- **REST API**
    - **핵심:** RESTful 하다는 것의 의미, URI 설계 원칙.
- **브라우저 주소창에 [www.google.com](https://www.google.com/)을 쳤을 때 일어나는 일**
    - **핵심:** DNS 조회 -> IP 획득 -> TCP 연결 -> HTTP 요청 -> 서버 응답 -> 렌더링 과정을 순서대로 설명 가능해야 함.

클라이언트와 서버, 서버와 서버 간의 통신을 다룹니다.

- **전송 계층 (Transport Layer):**
    - **TCP:** 3-Way Handshake(연결), 4-Way Handshake(종료), 흐름 제어, 혼잡 제어.
    - **UDP:** 비연결성, 빠른 전송 속도 (실시간 스트리밍 등).
- **응용 계층 (Application Layer):**
    - **HTTP/HTTPS:** 버전별 특징(1.1 vs 2.0 vs 3.0), 헤더 구조, 상태 코드.
    - DNS(Domain Name System) 동작 원리.
- **로드 밸런싱 (Load Balancing):**
    - 트래픽 분산 처리의 기초 개념.

---


## 💭 생각의 인큐베이터 (My Thoughts & Connections)
