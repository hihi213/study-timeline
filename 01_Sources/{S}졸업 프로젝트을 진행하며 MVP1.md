---
type: 소스
status: inbox
topics: 
source_url: "{{SOURCE}}"
author: 
creation_date: 2025-08-14
---
# 무제

## 📖 소스 요약 (Summary)
- 이 정보원의 핵심 내용이나 주제를 한두 문장으로 요약합니다.





### **Phase 1: MVP - 냉장고 관리 기능**

#### **1.1: 사용자 인증/인가**

- **백엔드**
    - [ ] **DB/JPA**: `users` 테이블 설계, `User` 엔티티/리포지토리 생성 ^e2xutc
        ### **개념 설명: 엔티티(Entity)란 무엇일까요?**
		우리가 사용할 Spring Data JPA에서 **엔티티(Entity)**란 데이터베이스에 저장될 데이터의 '설계도'라고 생각하면 쉬워요. 우리는 `users`라는 데이터베이스 테이블을 만들고 싶지만, SQL 쿼리문(`CREATE TABLE users ...`)을 직접 작성하는 대신, 자바 클래스(`User.java`)를 만들어서 설계할 거예요. 이렇게 하면 자바 개발자에게 익숙한 방식으로 데이터를 다룰 수 있고, JPA가 이 '설계도'를 보고 알아서 데이터베이스 테이블을 관리해주기 때문에 아주 편리하답니다. 
		- [[00_Inbox/JPA와 PostgreSQL의 역할 분담.md|JPA와 PostgreSQL의 역할 분담]]
    - [ ] **인증 시스템**: Spring Security, JWT, **Refresh Token**을 이용한 통합 인증 시스템 구축 (**[원칙 1] 적용**) ^e2xutc
        
    - [ ] **API**:
        
        - [ ] 회원가입 (`POST /api/auth/signup`): **DTO `@Valid` 적용**, 비밀번호 암호화
            
        - [ ] 로그인 (`POST /api/auth/login`): Access/Refresh Token 발급, **Refresh Token은 DB에 저장**
            
        - [ ] **비밀번호 변경/초기화 API**
            
        - [ ] **내 정보 조회 API (`GET /api/auth/me`)**
            
    - [ ] **보안 설정**: `SecurityConfig`에 JWT 필터, **CORS 정책** 설정 및 API 경로별 접근 권한 설정 (**[원칙 2] 적용**)
        
    - [ ] **예외 처리**: 인증/인가 관련 **전역 예외 처리기** 구현 시작 (**[원칙 3] 적용**)
        
- **프론트엔드**:
    
    - [ ] **UI/라우팅**: 인증 관련 페이지 UI 생성(`v0`) 및 라우팅 설정
        
    - [ ] **API 연동**: 인증 기능 연동 및 Token 저장/관리 로직 구현 (`axios` 인터셉터)
        

#### **1.2: 냉장고 (사용자 기능)**

- **백엔드**:
    
    - [ ] **DB/JPA**: `refrigerators`, `items` 등 관련 테이블 설계 (관계 설정, **Lazy Loading** 원칙)
        
    - [ ] **API (DTO 사용)**:
        
        - [ ] 물품 등록 API (`POST /api/items`): 개별/묶음 등록 로직 포함
            
        - [ ] 내 물품 목록 조회 API (`GET /api/my-items`): **페이징 처리** 및 **N+1 문제 해결** (`JOIN FETCH` 또는 `@EntityGraph`)
            
        - [ ] 물품 수정/삭제 API (`PUT /api/items/{id}`, `DELETE /api/items/{id}`)
            
        - [ ] 물품 검색 API (`GET /api/items/search?identifier=...`): 검색 컬럼에 **DB 인덱스** 적용
            
- **프론트엔드**:
    
    - [ ] **UI/API**: 냉장고 관련 UI 생성 및 CRUD 기능 연동. 중복 API 로직은 별도 파일로 분리.
        

#### **1.3: 냉장고 (층별장 기능)**

- **백엔드**:
    
    - [ ] **DB/JPA**: `inspections`, `inspection_logs` 등 관련 테이블 설계
        
    - [ ] **API**: 검사 일정 관리 및 검사 처리 API 구현, **`@PreAuthorize`** 적용 (**[원칙 2] 적용**)
        - [ ] 검사 일정 CRUD API 구현
            
        - [ ] 검사 기록/리포트 조회 API 구현
            
        - [ ] 검사 처리 API 구현
        
- **프론트엔드**:
    
    - [ ] **UI/기능**: 층별장 전용 UI 생성 및 **역할 기반 조건부 렌더링** 적용.
        

### **Phase 2: 스마트 알림 및 배포**

#### **2.1: 스마트 알림**

- **백엔드**:
    
    - [ ] **DB/설정**: `notifications` 테이블 설계, `web-push-java` 라이브러리 추가, VAPID 키 설정
        
    - [ ] **API**: FCM 토큰 저장 API 구현
        
    - [ ] **이벤트 기반 시스템**: Spring의 `ApplicationEventPublisher`를 사용해 벌점 부과, 유통기한 임박 등의 **이벤트**를 발행하고, `@EventListener`에서 해당 이벤트를 받아 알림을 보내는 방식으로 구현.
        - [ ] **이벤트 정의**: `PenaltyIssuedEvent`, `ExpirationWarningEvent` 등 이벤트 클래스 생성
            
        - [ ] **이벤트 발행**: 벌점 부과 서비스, 스케줄러 등에서 `ApplicationEventPublisher`를 통해 이벤트 발행
            
        - [ ] **이벤트 리스너**: `@EventListener`를 사용해 이벤트를 구독하고, `NotificationService`와 `FcmPushService`를 호출하여 DB에 알림을 저장하고 실제 푸시를 발송하는 로직 구현
        
- **프론트엔드**:
    
    - [ ] PWA 서비스 워커 설정.
        
    - [ ] 알림 권한 요청 및 **로그인 시 FCM 토큰 백엔드 전송** 로직 구현.
        
    - [ ] 서비스 워커에서 푸시 수신 및 화면 표시 로직 구현.
        

#### **2.2: 배포 및 최종 테스트**

- [ ] **테스트**: 역할별 E2E 시나리오 테스트
    
- [ ] **배포**:
	- [ ] DB_HOST, DB_PORT, DB_NAME, DB_USER ,DB_PASSWOR변경하고 tool폴더의 readme의 배포 후(GitHub Actions) 설정/실행부분 참고.
    
    - **백엔드**: `Dockerfile` 작성, **민감 정보 환경 변수 분리** 후 AWS 배포 (**[원칙 0] 적용**)
        
    - **프론트엔드**: Vercel 자동 배포
        
- [ ] **API 문서화**: **Swagger UI**를 통해 배포된 API 문서 최종 확인 (**[원칙 4] 적용**)
    
- [ ] **최종 테스트**: 배포된 주소로 접속하여 모든 기능 최종 확인.
## 💭 생각의 인큐베이터 (My Thoughts & Connections) 
- 