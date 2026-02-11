---
type: 생각조각
status: inbox
source: 
creation_date: 2026-01-09
---
개발자가 터미널에 명령어를 입력하는 순간부터, 서버가 실행되어 "준비 완료" 상태가 되기까지의 **기술적 실행 흐름(Sequence)**을 시간 순서대로 정리해 드립니다.

크게 **1. 인프라 기동 (DB)** $\rightarrow$ **2. 애플리케이션 기동 (Spring)** $\rightarrow$ **3. 상호 연결 및 초기화** 단계로 진행됩니다.

---

### 1단계: 인프라 기동 (Infrastructure Boot)

> **행위:** 터미널에서 `docker-compose up -d` 입력

1. **Docker 데몬 동작:** `docker-compose.yml` 파일을 읽어 정의된 이미지(PostgreSQL)를 찾습니다.
2. **컨테이너 생성:** 격리된 리눅스 환경(Container)을 만들고, 그 안에서 **PostgreSQL 프로세스**를 실행합니다.
3. **포트 리스닝(Port Listening):** 컨테이너 내부의 5432 포트가 호스트 OS(내 컴퓨터)의 5432 포트와 연결(Binding)됩니다.
    - **Docker는 '컴퓨터 속의 가상 컴퓨터'**입니다.
		- **격리된 환경 (Isolation):** Docker 컨테이너가 실행되면, 그 컨테이너만의 **독립적인 네트워크 공간**이 생깁니다. 컨테이너 내부에서는 PostgreSQL이 `5432` 포트를 리스닝하고 있지만, **이것은 컨테이너 내부의 일일 뿐, 바깥 세상(Host OS, 내 컴퓨터)과는 단절**되어 있습니다.
		- **연결의 의미 (`5432:5432`):** 외부(Spring Boot가 있는 내 컴퓨터)에서 컨테이너 내부로 접속하려면 **통로**가 필요합니다.
    - `docker-compose`의 `ports: "5432:5432"` 설정은 **"내 컴퓨터(Host)의 5432번 포트로 들어오는 신호를, 컨테이너 내부의 5432번 포트로 토스해라"**라는 규칙을 만드는 것입니다.
    - **상태:** 이제 `localhost:5432` 주소는 누구든 접속할 수 있도록 **대기 상태(Listen)**가 됩니다.
        

---

### 2단계: 애플리케이션 로딩 (Application Loading)

> **행위:** IntelliJ에서 `Run` 버튼 클릭 (또는 `./gradlew bootRun`)

1. **JVM 실행:** 자바 가상 머신(JVM)이 구동되고, `Application.java`의 `main()` 메서드가 시작됩니다.
2. **Spring 컨테이너 생성:** Spring Boot가 내부적으로 **IoC 컨테이너(Bean 관리자)**를 생성합니다.
3. **설정 파일 로드:** `src/main/resources/application.yml` 파일을 읽어 메모리에 설정값을 적재합니다.
    - 이때 `spring.datasource.url`, `username`, `password` 값을 확보합니다.

---

### 3단계: DB 연결 시도 (Connection Handshake)

> **가장 중요한 단계 (여기서 설정이 틀리면 에러 발생)**

1. **DataSource 빈 생성:** Spring이 `DataSource` 객체를 생성하면서, 확보한 설정값(URL, ID, PW)을 이용해 DB 연결을 시도합니다.
2. **TCP 연결:** JDBC 드라이버가 `localhost:5432` (Docker가 열어둔 포트)로 TCP 패킷을 보냅니다.
3. **인증 (Authentication):** DB 서버는 요청받은 ID/PW가 자신이 설정한 값(`docker-compose`의 환경변수)과 일치하는지 검사합니다.
4. **커넥션 풀(Connection Pool) 형성:** 인증에 성공하면, 성능을 위해 미리 여러 개의 연결 선(Connection)을 만들어두고 유지합니다 (HikariCP).

---

### 4단계: 스키마 초기화 (JPA/Hibernate)

> **설정:** `ddl-auto: update` 일 경우

1. **엔티티 스캔:** 프로젝트 내의 `@Entity`가 붙은 클래스(`Bundle`, `Item` 등)를 모두 찾습니다.
2. **스키마 비교:** 현재 DB에 있는 테이블 구조와 자바 Entity 구조를 비교합니다.
3. **DDL 실행:** 차이점이 있다면 SQL(`CREATE TABLE`, `ALTER TABLE` 등)을 생성하여 DB에 전송하고 실행시킵니다. 이로 인해 DB에 테이블이 생성됩니다.

---

### 5단계: 서버 준비 완료 (Ready)

1. **내장 톰캣 실행:** Spring Boot가 내장된 웹 서버(Tomcat)를 8080 포트로 실행합니다.
2. **애플리케이션 대기:** 이제 서버는 `localhost:8080`으로 들어오는 HTTP 요청을 받을 준비가 되었습니다.
    

---

### 🔄 전체 흐름 요약

1. **User:** `docker-compose up` ➡️ **OS:** DB 서버 실행 & 5432 포트 개방.
2. **User:** `Spring Boot Run` ➡️ **App:** `application.yml` 읽음.
3. **App:** `localhost:5432`로 접속 시도 ➡️ **DB:** 인증 성공.
4. **App:** `@Entity` 스캔 후 테이블 생성 쿼리 전송 ➡️ **DB:** 테이블 생성.
5. **App:** 8080 포트 열고 대기.

이 과정 중 하나라도 실패하면(포트 충돌, 비밀번호 불일치 등) 서버는 켜지지 않습니다.
### 1. `docker-compose.yml` : 인프라스트럭처 계층 (Infrastructure Layer)

이 파일은 **운영체제(OS) 위에서 데이터베이스 프로세스를 실행하고 네트워크를 구성**하는 역할을 합니다. Spring Boot 애플리케이션 외부의 영역입니다.

* **기술적 역할:**
	1. **컨테이너 프로비저닝:** PostgreSQL 이미지(바이너리 파일)를 다운로드하고, 격리된 환경(Container)에서 프로세스를 실행합니다.
	2. **포트 바인딩(Port Binding):** 호스트 OS의 포트(예: 5432)와 컨테이너 내부의 포트(5432)를 연결하여 외부 접근을 허용합니다.
	3. **환경 변수 주입:** DB 초기화 시 필요한 루트 비밀번호, 기본 데이터베이스 이름 등을 설정합니다.


* **없거나 실행하지 않았을 때의 현상:**
	* 운영체제 상에 **데이터베이스 프로세스가 존재하지 않습니다.**
	* 네트워크 관점에서 해당 IP와 포트(예: `localhost:5432`)를 리슨(Listen)하고 있는 소켓이 없습니다.
	* **에러:** Spring Boot가 TCP 연결을 시도하면 **TCP Handshake 단계에서 실패**하며 `Connection Refused`(연결 거부) 에러가 발생합니다.



### 2. `application.yml` : 애플리케이션 계층 (Application Layer)

이 파일은 **Spring Boot 애플리케이션 내부에서 사용할 설정 값을 정의**하는 역할을 합니다. 애플리케이션이 실행될 때 메모리에 로드됩니다.

* **기술적 역할:**
1. **DataSource 빈(Bean) 설정:** Spring Container가 `DataSource` 객체를 생성할 때 필요한 속성값(URL, Username, Password)을 제공합니다.
2. **JDBC 연결 매개변수 정의:** JDBC 드라이버가 데이터베이스와 통신하기 위해 필요한 프로토콜, 타겟 IP, 포트 정보를 지정합니다 (`jdbc:postgresql://localhost:5432/...`).
3. **JPA/Hibernate 동작 제어:** 애플리케이션 시작 시 스키마 생성 여부(`ddl-auto`), SQL 로깅 여부 등을 설정합니다.


* **없거나 설정이 비었을 때의 현상:**
	* Spring Boot 애플리케이션이 **초기화(Initialization) 단계에서 실패**합니다.
	* `spring-data-jpa` 라이브러리는 `DataSource` 객체를 필요로 하는데, 이를 생성하기 위한 필수 값(`url` 등)이 없어 **객체 생성에 실패**합니다.
	* **에러:** 네트워크 연결 시도조차 하지 못하고, 애플리케이션 구동 시점에 `BeanCreationException` 또는 `Failed to configure a DataSource` 에러를 발생시키며 프로세스가 종료됩니다.



---

### 3. 기술적 요약 및 비교

| 구분 | `docker-compose.yml` | `application.yml` |
| --- | --- | --- |
| **제어 대상** | **Docker Daemon** (DB 서버 프로세스) | **Spring Framework** (Java 애플리케이션) |
| **실행 시점** | 개발 환경 구축 시점 (`docker-compose up`) | 애플리케이션 런타임 시작 시점 (Run) |
| **담당 영역** | **서버 사이드** (Server-side) | **클라이언트 사이드** (Client-side) |
| **누락 시 결과** | 대상 서버가 없음 (Network unreachable) | 접속 설정값 부재 (Configuration missing) |
| **발생 에러** | `Connection Refused` (I/O Exception) | `BeanCreationException` (Runtime Exception) |

**결론적으로:**

* `docker-compose.yml`은 **통신 대상(Target)**을 생성합니다.
* `application.yml`은 **통신 방법(Method)**과 **자격 증명(Credential)**을 설정합니다.
