
---

- ## 1. 개요
socket() 함수는 네트워크 통신을 위한 소켓을 생성하는 시스템 호출이다.
리눅스에서는 이 함수 호출 시 내부적으로 커널 영역의 여러 함수를 순차적으로 호출하여 소켓을 생성하고, 이 소켓을 제어할 수 있도록 파일 디스크립터(FD)를 반환한다.
본 보고서는 socket(AF_INET, SOCK_STREAM, 0) 함수 호출 시, 리눅스 커널에서 실제 어떤 sub 함수들이 어떤 순서로 호출되는지, 그리고 각 함수의 호출 목적과 역할에 대해 분석한다.

---
- ## 2. 함수 호출 흐름 및 호출 이유 
	- #### 1. socket()
		사용자 프로그램이 호출하는 표준 라이브러리 함수이며, 내부적으로 시스템 콜을 발생해 커널에 소켓생성요청을 전달한다.
	- #### 2. sys_socket()
		사용자 공간에서 커널 공간으로 진입하기 위한 함수이며 도메인, 타입, 프로토콜 등의 인자 유효성 검사 수행을 수행한다.
		-> 이후 커널 내부의 소켓 생성 함수를 호출한다.
	- #### 3.sock_create()
		 프로토콜 종류(AF_INET 등)에 따라 해당 네트워크 패밀리로 요청 전달
		 -> 내부적으로 __sock_create()를 호출한다
	- #### 4. \_\_sock_create()
		실제 소켓 객체를 생성하는 함수로, 다음과 같은 서브함수들을 호출하며 소켓을 초기화한다.
	- #### 5. net_families\[AF_INET]->create()다.
		요청된 도메인(AF_INET)에 해당하는 프로토콜(TCP 등)을 초기화하기 위하여 `net_families[domain]->create()` 함수가 호출된다.  
		→ 이때 전달된 매개변수 중 도메인 값이 `AF_INET`이므로 `inet_create()` 함수가 선택되어 호출된다.  
		→ `inet_create()`는 SOCK_STREAM 타입일 경우 내부적으로 TCP를 초기화하고 해당 프로토콜 동작 방식(`tcp_prot`)을 설정한다.
	- #### 6. sock_alloc()
		커널 내부에 소켓 구조체(struct socket)를 메모리에 할당하기 위하여 sock_alloc() 함수를 호출한다.
		→ 소켓 객체를 위한 커널 메모리를 확보하기 위해 호출된다.
	- #### 7. sock_init_data()
		생성된 소켓 구조체에 내부 데이터를 초기화하기 위하여 sock_init_data() 함수를 호출한다.
		→ 수신 큐, 송신 큐, 상태 플래그 등을 설정한다.
	- #### 8.  security_socket_create()
		소켓 생성을 보안 정책에 따라 허용할 수 있는지 확인하기 위하여 security_socket_create() 함수가 호출된다.
		→ SELinux 또는 AppArmor 등의 정책을 검사한다.
	- #### 9. sock_alloc_file()
		생성된 소켓을 사용자 공간에서 제어할수있는 파일 디스크립터를 할당하기 위하여 sock_alloc_file() 함수가 호출된다. 그렇게 파일 디스크립터 생성을 하고 해당 FD는 사용자에게 리턴된다.

## 3. 함수호출흐름 요약

```
socket()                         // 사용자 공간에서 호출
 └─> __sys_socket()              // 커널 진입: 시스템 콜 핸들러
      └─> sock_create()          // 도메인/타입 기반 소켓 생성 요청
           └─> __sock_create()   // 실제 소켓 생성 로직
                ├─> sock_alloc()               // socket 구조체 메모리 할당
                ├─> inet_create()              // TCP/IP 기반 sock 구조체 생성
                │     └─> tcp_prot 설정        // 프로토콜 동작 방식 설정
                │     └─> struct sock 연결     // 내부 통신 구조 초기화
                └─> sock->ops = &inet_stream_ops // 소켓 연산 함수 등록(read,write 등)

      └─> security_socket_create() // 보안 정책 검사 (SELinux 등)
      └─> sock_alloc_file()        // FD에 연결할 파일 구조체 생성
      └─> get_unused_fd_flags()    // 사용 가능한 파일 디스크립터 확보
      └─> fd_install()             // 소켓을 FD에 연결

리턴: 파일 디스크립터 (예: 3)

```


## 4. 결론
socket(AF_INET, SOCK_STREAM, 0) 함수는 단순한 사용자 API 호출처럼 보이지만, 내부적으로는 커널의 여러 서브 시스템이 연동되어 동작한다.  
특히 도메인(AF_INET), 타입(SOCK_STREAM), 프로토콜(0)에 따라 적절한 프로토콜 설정, (tcp_prot) 소켓 연산 설정 (inet_stream_ops), 보안 정책 적용 (security_socket_create), 파일 디스크립터 할당 (sock_alloc_file → fd_install) 등이 수행된다. 커널은 이 과정에서 보안 검사를 수행하고 사용자에게 파일 디스크립터를 반환함으로써 소켓 기반의 통신이 가능하도록 한다.