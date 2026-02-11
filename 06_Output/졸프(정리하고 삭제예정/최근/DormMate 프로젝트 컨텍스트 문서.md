---
type: 소스
status: inbox
topics:
source_url: "{{SOURCE}}"
author:
creation_date: 2025-10-17
---

# 📄 DormMate 프로젝트 컨텍스트 문서
**작성일:** 2025-10-17  
**버전:** 1.0  
**목적:** AI 코드 생성 및 개발 협업 시 프로젝트 이해를 위한 단일 참조 문서

***

## 📌 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [기술 스택](#2-기술-스택)
3. [개발 일정 및 범위](#3-개발-일정-및-범위)
4. [도메인 모델](#4-도메인-모델)
5. [비즈니스 규칙](#5-비즈니스-규칙)
6. [코딩 컨벤션](#6-코딩-컨벤션)
7. [아키텍처 설계](#7-아키텍처-설계)
8. [보안 정책](#8-보안-정책)
9. [제약사항](#9-제약사항)
10. [MVP 기능 상세](#10-mvp-기능-상세)
11. [Phase 2 기능 상세](#11-phase-2-기능-상세)

***

## 1. 프로젝트 개요

### 1.1 기본 정보

| 항목 | 내용 |
|------|------|
| **프로젝트명** | DormMate |
| **목적** | 대학 기숙사 공용 냉장고 관리 시스템 (졸업 프로젝트) |
| **사용자 규모** | 기숙사생 200명, 층별장 10명, 관리자 2명 |
| **배포 목표일** | 2025년 11월 11일 (25일 개발) |
| **개발 방식** | 솔로 개발, AI 협업 (학습 중심) |

### 1.2 핵심 가치

1. **위생 관리**: 유통기한 관리 및 정기 검사로 냉장고 위생 향상
2. **공정성**: 칸별 호실 배분, 라벨 자동 발급으로 공정한 사용
3. **투명성**: 검사 이력 기록, 알림 시스템으로 투명한 관리
4. **확장성**: 200명 → 1000명 확장 가능한 설계

### 1.3 주요 문제 해결

**현재 문제:**
- 냉장고에 주인 없는 물품 방치
- 유통기한 지난 음식물 악취
- 층별장이 수동으로 스티커 작성 및 관리
- Band 앱으로 공지만 → 개별 알림 없음

**해결책:**
- 스티커 코드 자동 발급 (중복 없음)
- 유통기한 자동 알림 (D-3)
- 층별장 2명 동시 검사 + 실시간 동기화
- 개인별 맞춤 알림 (Band 중복 제거)

***

## 2. 기술 스택

### 2.1 Backend

| 구분 | 기술 | 버전 | 선택 이유 |
|------|------|------|-----------|
| **언어** | Java | 17 | LTS, 졸전 발표 안정성 |
| **프레임워크** | Spring Boot | 3.1.x | 학습 곡선 낮음, 생산성 |
| **ORM** | Spring Data JPA | - | CRUD 자동화, 학습 효과 |
| **인증** | Spring Security + JWT | - | Stateless, 확장성 |
| **실시간** | SSE (Server-Sent Events) | - | 단방향 알림 충분, 구현 단순 |
| **빌드 도구** | Gradle | 8.x | Kotlin DSL, 의존성 관리 |

### 2.2 Database

| 항목 | 내용 |
|------|------|
| **DBMS** | PostgreSQL 14 |
| **선택 이유** | FOR UPDATE SKIP LOCKED, JSONB, 트리거 지원 |
| **타임존** | UTC (앱에서 KST 변환) |
| **네이밍** | snake_case |
| **스키마 관리** | 수동 (init.sql) |

### 2.3 Frontend

| 항목 | 내용 |
|------|------|
| **프레임워크** | React 18 |
| **상태 관리** | React Query (서버 상태), useState (로컬) |
| **스타일링** | Tailwind CSS |
| **개발 방식** | AI 생성 80% + 수동 수정 20% |
| **목표** | 백엔드 중심 프로젝트, UI는 최소화 |

### 2.4 DevOps

| 항목 | 내용 |
|------|------|
| **개발 환경** | M1 MacBook, IntelliJ IDEA |
| **버전 관리** | Git + GitHub |
| **배포** | Docker + PostgreSQL (단일 서버) |
| **모니터링** | Spring Boot Actuator (기본) |

***

## 3. 개발 일정 및 범위

### 3.1 전체 타임라인

```
2025-10-17 ~ 2025-11-11 (25일)

Week 1 (10/17~10/23): F0 환경 + F1 인증
Week 2 (10/24~10/30): F2 물품 등록
Week 3 (10/31~11/6):  F3 조회/수정 + F4 검사 시작
Week 4 (11/7~11/13):  F4 검사 완성 + F5 알림 + F6 관리자
Week 5 (11/14~11/20): F7 UI 통합 + 테스트
발표 (11/11):        졸전 발표
```

### 3.2 개발 범위 구분

#### 🔵 MVP (Phase 1) - 반드시 구현

**완성 기준:** 졸전 발표에 필수적인 냉장고 관리 핵심 기능

```
✅ F0. 환경 구축
✅ F1. 인증/계정 관리
✅ F2. 물품 등록 (라벨 발급 + 포장 등록)
✅ F3. 물품 조회/수정/삭제
✅ F4. 검사 시스템 (SSE 실시간)
✅ F5. 알림 시스템 (유통기한, 검사 결과)
✅ F6. 관리자 기능 (층별장 임명, 전체 조회)
```

#### 🟡 Phase 2 - README에 "향후 계획"으로 명시

**구현 시점:** 졸전 통과 후 (시간 여유 시)

```
⏳ 세탁실 관리
⏳ 도서관 관리
⏳ 다목적실 예약
⏳ 상벌점 시스템
⏳ 비밀번호 찾기 (이메일 발송)
⏳ 감사 로그 자동화
⏳ 통계 대시보드
```

***

## 4. 도메인 모델

### 4.1 핵심 도메인 관계

```
FridgeUnit (냉장고)
  └─ 1:N → Compartment (칸)
       ├─ 1:N → LabelPool (라벨)
       └─ 1:N → FridgeBundle (포장)
            └─ 1:N → FridgeItem (물품)

User (사용자)
  ├─ 1:N → FridgeBundle (소유 물품)
  ├─ 1:N → Notification (알림)
  └─ N:M → InspectionSession (검사 세션)

InspectionSession (검사 세션)
  ├─ 1:N → InspectionAction (조치)
  └─ N:M → User (검사자)
```

### 4.2 Entity 목록 (MVP 범위)

#### 🔷 공통/사용자

| Entity | 테이블명 | 설명 | 핵심 필드 |
|--------|---------|------|----------|
| `Room` | rooms | 호실 | floor, room_number, capacity, type |
| `User` | users | 사용자 | login_id, email, password_hash, role |

#### 🔷 냉장고 자원

| Entity | 테이블명 | 설명 | 핵심 필드 |
|--------|---------|------|----------|
| `FridgeUnit` | fridge_units | 냉장고 유닛 | floor, unit_no |
| `Compartment` | compartments | 칸 | display_order, type, label_range_start/end |
| `LabelPool` | label_pool | 라벨 풀 | compartment_id, label_number, status |

#### 🔷 냉장고 데이터

| Entity | 테이블명 | 설명 | 핵심 필드 |
|--------|---------|------|----------|
| `FridgeBundle` | fridge_bundles | 포장 | label_number, **label_code (가상)**, memo |
| `FridgeItem` | fridge_items | 물품 | item_name, expiry_date, deleted_at |

#### 🔷 검사 시스템

| Entity | 테이블명 | 설명 | 핵심 필드 |
|--------|---------|------|----------|
| `InspectionSession` | inspection_sessions | 검사 세션 | session_uuid, status |
| `InspectionInspector` | inspection_inspectors | 검사자 | session_id, inspector_id |
| `InspectionAction` | inspection_actions | 조치 | action_type_code, reason_code |

#### 🔷 알림

| Entity | 테이블명 | 설명 | 핵심 필드 |
|--------|---------|------|----------|
| `Notification` | notifications | 알림 | kind_code, preview_json, ttl_at |

#### 🔷 코드 테이블

| Entity | 테이블명 | 설명 |
|--------|---------|------|
| `BundleStatus` | bundle_status | 포장 상태 (ACTIVE, REMOVED) |
| `ItemState` | item_state | 물품 상태 (NORMAL, EXPIRED, DISCARDED) |
| `NotificationKind` | notification_kind | 알림 종류 |
| `InspectionActionType` | inspection_action_type | 조치 유형 (PASS, WARN, DISPOSE) |
| `WarningReason` | warning_reason | 경고 사유 |

***

## 5. 비즈니스 규칙

### 5.1 냉장고 관리

#### 칸(Compartment) 규칙
```
- 칸 식별: compartment.id (PK, 고유 식별자)
- 칸 정렬: display_order (사용자 표시용, 자동 증가)
- 칸 종류: FRIDGE(냉장) / FREEZER(냉동)
- 라벨 범위: label_range_start ~ label_range_end (예: 1~50)
- 칸 잠금: 검사 중 lock_owner_session_id 설정
```

#### 라벨(Label) 규칙
```
- 라벨 번호: 칸별 1~999 범위 (3자리)
- 스티커 코드: compartmentId-labelNumber (예: "104-005")
- 라벨 상태: 0=AVAILABLE, 1=IN_USE
- 발급 방식: FOR UPDATE SKIP LOCKED (동시성 제어)
- 자동 반환: 포장 삭제(REMOVED) 시 트리거로 status=0
```

#### 포장(Bundle) 규칙
```
- 포장 = 스티커 1개 부착 단위
- 포장명: 사용자 지정 (선택)
- 메모: 포장 전체 메모 (위치, 소유자 표시 등)
- 소프트 삭제: status_code → 'REMOVED'
```

#### 물품(Item) 규칙
```
- 물품 = 포장 안의 개별 품목
- 1 포장 : N 물품 (1:N 관계)
- 소프트 삭제: deleted_at 설정
- 검사 추적: last_inspection_action_id, modified_after_inspection
- 타임스탬프: created_at, modified_at (자동)
```

### 5.2 검사 시스템

#### 검사 세션 규칙
```
- 검사자: 최대 2명 (트리거로 제한)
- 세션 상태: OPEN, SUBMITTED, CANCELLED
- 칸 잠금: 검사 시작 시 lock_owner_session_id 설정
- 실시간 동기화: SSE (Server-Sent Events)
- 검사 완료 조건: 모든 포장 조치 완료
```

#### 조치 유형
```
- PASS: 통과 (문제 없음)
- WARN: 경고 (정보 불일치, 보관 불량, 스티커 미부착)
- DISPOSE: 폐기 (유통기한 지남)
- UNREGISTERED: 미등록 물품 폐기
```

#### 검사 필터
```
- "만료" 필터: 유통기한 지난 물품 포함 포장만
- "검사 후 수정됨" 필터: modified_after_inspection=true 포장만
```

### 5.3 알림 시스템

#### 알림 종류
```
FRIDGE_EXPIRY: 유통기한 임박 (D-3)
  - 발송 시각: 매일 09:00 KST
  - TTL: 24시간
  - 중복 방지: dedupe_key (user_id + date)

INSPECTION_RESULT: 검사 결과
  - 발송 시점: 검사 제출 즉시
  - TTL: 48시간
  - 대상: 경고/폐기 조치받은 사용자만
```

#### 알림 읽음 처리
```
- 미읽음: 상단 배치, is_read=false
- 읽음: 하단 배치, is_read=true
- 자동 읽음: 냉장고 화면 진입 시
- 자동 만료: ttl_at 도달 시
```

### 5.4 권한 규칙

| 역할 | 권한 |
|------|------|
| **RESIDENT** | 본인 물품 CRUD, 내 알림 조회 |
| **INSPECTOR** | RESIDENT 권한 + 검사 수행, 검사 이력 조회 (본인 층만) |
| **ADMIN** | 전체 권한, 층별장 임명/해제, 전체 통계 조회 |

***

## 6. 코딩 컨벤션

### 6.1 네이밍

| 구분 | 규칙 | 예시 |
|------|------|------|
| **Java 클래스** | PascalCase | `FridgeBundle`, `LabelService` |
| **Java 메서드/변수** | camelCase | `acquireLabel()`, `labelNumber` |
| **DB 테이블** | snake_case | `fridge_bundles`, `label_pool` |
| **DB 칼럼** | snake_case | `label_number`, `created_at` |
| **Enum** | UPPER_SNAKE_CASE | `BUNDLE_STATUS.ACTIVE` |
| **상수** | UPPER_SNAKE_CASE | `MAX_INSPECTORS` |
| **패키지** | lowercase | `com.dormmate.label.service` |

### 6.2 패키지 구조

```
com.dormmate
├── common
│   ├── config          // Spring 설정
│   ├── exception       // 공통 예외
│   ├── dto             // 공통 DTO (ApiResponse 등)
│   └── util            // 유틸리티
├── auth                // 인증/계정
│   ├── entity
│   ├── repository
│   ├── service
│   ├── controller
│   └── dto
├── label               // 라벨 발급
│   └── ...
├── bundle              // 포장 관리
│   └── ...
├── inspection          // 검사 시스템
│   └── ...
└── notification        // 알림
    └── ...
```

### 6.3 Layer 책임

| Layer | 책임 | 예시 |
|-------|------|------|
| **Controller** | HTTP 요청/응답, 인증 검증 | `@PreAuthorize`, `@Valid` |
| **Service** | 비즈니스 로직, 트랜잭션 관리 | `@Transactional` |
| **Repository** | DB 접근, 쿼리 | JPA Query Methods, `@Query` |
| **Entity** | 도메인 모델, 연관관계 | JPA Annotations |
| **DTO** | 데이터 전송 객체 | Request/Response 분리 |

### 6.4 예외 처리

```java
// Custom Exception
public class NoAvailableLabelException extends BusinessException {
    public NoAvailableLabelException() {
        super(ErrorCode.NO_AVAILABLE_LABEL);
    }
}

// ErrorCode Enum
public enum ErrorCode {
    NO_AVAILABLE_LABEL(409, "LABEL_001", "칸이 가득 찼습니다"),
    INVALID_CREDENTIALS(401, "AUTH_001", "아이디 또는 비밀번호가 틀렸습니다");
    
    private final int status;
    private final String code;
    private final String message;
}

// Global Exception Handler
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusinessException(BusinessException e) {
        return ResponseEntity
            .status(e.getErrorCode().getStatus())
            .body(ApiResponse.error(e.getErrorCode()));
    }
}
```

### 6.5 API 응답 포맷

```java
// 성공 응답
{
  "success": true,
  "data": { ... },
  "error": null
}

// 실패 응답
{
  "success": false,
  "data": null,
  "error": {
    "code": "LABEL_001",
    "message": "칸이 가득 찼습니다",
    "timestamp": "2025-10-17T12:30:00Z"
  }
}
```

### 6.6 로깅

```java
@Slf4j
public class LabelService {
    public LabelPool acquireLabel(Long compartmentId) {
        log.info("라벨 발급 시작: compartmentId={}", compartmentId);
        
        try {
            LabelPool label = labelPoolRepo.acquireLabel(compartmentId)
                .orElseThrow(() -> new NoAvailableLabelException());
            
            log.info("라벨 발급 성공: compartmentId={}, labelNumber={}", 
                compartmentId, label.getLabelNumber());
            return label;
        } catch (NoAvailableLabelException e) {
            log.warn("라벨 발급 실패 (부족): compartmentId={}", compartmentId);
            throw e;
        }
    }
}
```

**로깅 레벨:**
- `ERROR`: 시스템 오류 (DB 연결 실패 등)
- `WARN`: 비즈니스 예외 (라벨 부족, 권한 없음)
- `INFO`: 주요 이벤트 (로그인, 포장 등록, 검사 제출)
- `DEBUG`: 상세 디버깅 (개발 환경만)

***

## 7. 아키텍처 설계

### 7.1 전체 아키텍처

```
┌─────────────────────────────────────────┐
│          React Frontend                 │
│  (AI 생성 80%, 모바일 우선)              │
└─────────────┬───────────────────────────┘
              │ HTTP/HTTPS
              │
┌─────────────▼───────────────────────────┐
│       Spring Boot Backend               │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  Controller Layer                  │ │
│  │  - JWT 인증 검증                   │ │
│  │  - DTO 검증 (@Valid)                │ │
│  └──────────┬─────────────────────────┘ │
│             │                            │
│  ┌──────────▼─────────────────────────┐ │
│  │  Service Layer                     │ │
│  │  - 비즈니스 로직                   │ │
│  │  - @Transactional                  │ │
│  └──────────┬─────────────────────────┘ │
│             │                            │
│  ┌──────────▼─────────────────────────┐ │
│  │  Repository Layer                  │ │
│  │  - Spring Data JPA                 │ │
│  │  - Native Query (SKIP LOCKED)      │ │
│  └──────────┬─────────────────────────┘ │
│             │                            │
└─────────────┼───────────────────────────┘
              │ JDBC
┌─────────────▼───────────────────────────┐
│       PostgreSQL 14                     │
│  - 트리거 (라벨 반환, 칸 잠금)           │
│  - 가상 칼럼 (label_code)                │
└─────────────────────────────────────────┘
```

### 7.2 SSE 실시간 아키텍처

```
검사자 A 브라우저                검사자 B 브라우저
     │                                │
     │ EventSource 연결                │
     ├────────────────────────────────┤
     │                                │
     ▼                                ▼
┌────────────────────────────────────────────┐
│         SseService (In-Memory)             │
│                                            │
│  emitters = {                              │
│    sessionId: [emitterA, emitterB]         │
│  }                                         │
└────────────┬──────────────┬────────────────┘
             │              │
        조치 발생 시         │
             │              │
             ▼              ▼
       emitterA.send   emitterB.send
       (실시간 전송)   (실시간 전송)
```

### 7.3 트랜잭션 전략

| 상황 | 전파 수준 | 이유 |
|------|----------|------|
| **포장 등록** | `REQUIRED` (기본) | 라벨 발급 + Bundle + Items 일괄 |
| **검사 조치** | `REQUIRED` | Action 저장 + 포장 상태 변경 |
| **알림 발송** | `REQUIRES_NEW` | 실패해도 메인 트랜잭션 롤백 방지 |
| **조회 API** | `SUPPORTS` | 읽기 전용, 트랜잭션 불필요 |

***

## 8. 보안 정책

### 8.1 인증 (JWT)

```
- 알고리즘: HS512
- 유효 기간: 7일
- Payload: { sub: loginId, role: RESIDENT/INSPECTOR/ADMIN }
- 갱신 정책: Refresh Token 없음 (만료 시 재로그인)
- 저장 위치: 클라이언트 localStorage (HTTPS 필수)
```

### 8.2 비밀번호

```
- 해싱: BCrypt (strength=10)
- 정책: 최소 8자 (졸전 발표용 단순화)
- 변경 시: 자동 로그아웃 + 재로그인
- 찾기: Phase 2로 연기 (이메일 발송 필요)
```

### 8.3 API 보호

```java
// 공개 API
/api/auth/register
/api/auth/login

// 인증 필요 API
/api/bundles/**       → RESIDENT 이상
/api/inspections/**   → INSPECTOR 이상
/api/admin/**         → ADMIN만

// 본인 데이터 확인
if (!bundle.getOwnerId().equals(currentUserId)) {
    throw new ForbiddenException();
}
```

### 8.4 CORS

```yaml
# application.yml
cors:
  allowed-origins:
    - http://localhost:3000    # 개발
    - https://dormmate.app     # 프로덕션
  allowed-methods:
    - GET, POST, PUT, DELETE
  allow-credentials: true
```

***

## 9. 제약사항

### 9.1 구현하지 않는 것 (MVP 범위 외)

```
❌ Refresh Token (만료 시 재로그인)
❌ 비밀번호 찾기 (이메일 발송)
❌ OAuth 소셜 로그인
❌ WebSocket (SSE로 충분)
❌ Redis 캐싱 (200명 규모에 불필요)
❌ Kafka 메시지 큐
❌ 복잡한 통계 대시보드
❌ Audit Log 자동화 (테이블은 있지만 미사용)
❌ 세탁실, 도서관, 다목적실 (Phase 2)
❌ 상벌점 시스템 (Phase 2)
```

### 9.2 기술적 제약

| 항목 | 제약 | 이유 |
|------|------|------|
| **동시 접속** | 200명 | 실제 기숙사 규모 |
| **검사자** | 최대 2명/세션 | 비즈니스 규칙 |
| **라벨 범위** | 칸당 1~999 | DB 설계 제약 |
| **알림 TTL** | 24~48시간 | 자동 만료 |
| **파일 업로드** | 없음 | 사진 업로드 Phase 2 |

### 9.3 개발 제약

```
- 개발 기간: 25일
- 프론트엔드: AI 생성 80% (학습 최소화)
- 테스트: 핵심 기능만 (라벨, 검사, 인증)
- 배포: 단일 서버 (Docker)
- 문서: README + 주석 (별도 API 문서 X)
```

***

## 10. MVP 기능 상세

### F0. 환경 구축 ✅

**목표:** 개발 환경 완성 + DB 연결

```
- Spring Boot 3.1.x 프로젝트 생성
- PostgreSQL 14 설치 및 연결
- init.sql 실행 (스키마 생성)
- seed.sql 실행 (코드 테이블 초기 데이터)
- Hello World API 테스트
```

***

### F1. 인증/계정 관리 ✅

**목표:** JWT 인증 완벽 이해 + 로그인 API

#### 1.1 Entity

```java
// User
- id (PK)
- login_id (unique, 대소문자 무시)
- email (nullable, 비밀번호 찾기용)
- password_hash (BCrypt)
- room_id (FK)
- personal_no (1~3)
- role (RESIDENT/INSPECTOR/ADMIN)
- is_active
- created_at, updated_at

// Room
- id (PK)
- floor (2~5)
- room_number (01~24)
- capacity (1 or 3)
- type (SINGLE/TRIPLE)
```

#### 1.2 API

```
POST /api/auth/register
- 입력: loginId, email (선택), password, roomId, personalNo
- 검증: 아이디 중복 체크, 호실-개인번호 중복 체크
- 응답: 201 Created

POST /api/auth/login
- 입력: loginId (대소문자 무시), password
- 검증: BCrypt.matches()
- 응답: { token, role, expiresIn }

GET /api/users/me
- 인증: JWT 필수
- 응답: { id, loginId, email, room, role }

PUT /api/users/me/password
- 입력: oldPassword, newPassword
- 처리: 변경 후 자동 로그아웃
```

#### 1.3 JWT 구현

```java
JwtTokenProvider
- createToken(loginId, role) → JWT 문자열
- validateToken(token) → boolean
- getLoginId(token) → String

JwtAuthenticationFilter
- doFilterInternal()
  1. Header에서 "Authorization: Bearer {token}" 추출
  2. 토큰 검증
  3. SecurityContext에 Authentication 설정
  4. 다음 필터 호출
```

#### 1.4 학습 목표

```
- JWT vs Session 차이 완벽 이해
- Spring Security FilterChain 구조
- BCrypt 해싱 원리
- @PreAuthorize 역할 기반 접근 제어
```

***

### F2. 물품 등록 (라벨 발급 + 포장 등록) ⭐핵심

**목표:** 동시성 제어 (SKIP LOCKED) 완벽 이해

#### 2.1 Entity

```java
// Compartment (칸)
- id (PK, 고유 식별자)
- unit_id (FK)
- display_order (정렬용, 자동 증가)
- type (FRIDGE/FREEZER)
- label_range_start (예: 1)
- label_range_end (예: 50)
- lock_owner_session_id (검사 중 잠금)

// LabelPool (라벨)
- compartment_id, label_number (복합 PK)
- status (0=AVAILABLE, 1=IN_USE)
- last_used_bundle_id (FK)
- last_used_at

// FridgeBundle (포장)
- id (PK)
- owner_id (FK)
- compartment_id (FK)
- label_number (1~999)
- label_code (가상 칼럼: compartmentId-labelNumber)
- bundle_name (포장명, 선택)
- memo (포장 메모)
- status_code ('ACTIVE', 'REMOVED')
- registered_at

// FridgeItem (물품)
- id (PK)
- bundle_id (FK)
- item_name
- expiry_date
- state_code ('NORMAL', 'EXPIRED', 'DISCARDED')
- created_at, modified_at, deleted_at
- last_inspection_action_id (FK)
- modified_after_inspection (boolean)
```

#### 2.2 API

```
POST /api/labels/acquire
- 입력: compartmentId
- 처리: SKIP LOCKED로 라벨 발급
- 응답: { labelNumber, labelCode }

POST /api/bundles
- 입력:
  {
    "compartmentId": 1,
    "bundleName": "아침 식재료",
    "memo": "냉장실 앞쪽",
    "items": [
      { "itemName": "계란 10구", "expiryDate": "2025-10-20" },
      { "itemName": "우유 1L", "expiryDate": "2025-10-18" }
    ]
  }
- 처리:
  1. 라벨 발급 (acquireLabel)
  2. FridgeBundle 생성
  3. FridgeItem 리스트 생성
  4. 트랜잭션 내 일괄 저장
- 응답: { bundleId, labelCode: "104-005" }
```

#### 2.3 핵심 로직: 라벨 발급

```java
@Query(value = """
    SELECT * FROM label_pool 
    WHERE compartment_id = :compartmentId 
    AND status = 0
    ORDER BY label_number 
    LIMIT 1 
    FOR UPDATE SKIP LOCKED
    """, nativeQuery = true)
Optional<LabelPool> acquireLabelForUpdate(@Param("compartmentId") Long compartmentId);
```

**동작 원리:**
1. `WHERE compartment_id = ...` → 특정 칸만
2. `status = 0` → 사용 가능한 라벨만
3. `ORDER BY label_number` → 작은 번호부터
4. `FOR UPDATE` → 행 잠금 (다른 트랜잭션 접근 차단)
5. `SKIP LOCKED` → 이미 잠긴 행은 건너뛰기
6. `LIMIT 1` → 하나만 선택

**동시성 제어:**
- 스레드 A: 라벨 1번 락 → 획득
- 스레드 B: 라벨 1번 잠김 → 건너뛰고 2번 획득
- 스레드 C: 라벨 1,2번 잠김 → 3번 획득

#### 2.4 학습 목표

```
- SKIP LOCKED vs 일반 FOR UPDATE 차이
- Pessimistic Lock 원리
- 트랜잭션 격리 수준
- 동시성 테스트 (ExecutorService + CountDownLatch)
```

#### 2.5 예상 질문

```
Q1: "왜 SKIP LOCKED를 사용했나요?"
A: 일반 FOR UPDATE는 순차 대기로 10명 요청 시 5초 소요.
   SKIP LOCKED는 잠긴 행을 건너뛰어 0.3초로 개선.
   실험 결과 17배 성능 향상 확인.

Q2: "라벨이 부족하면 어떻게 되나요?"
A: NoAvailableLabelException 발생.
   사용자에게 "칸이 가득 찼습니다" 메시지 표시.

Q3: "트랜잭션 롤백 시 라벨은?"
A: JPA 트랜잭션 관리로 status가 0으로 자동 복구되어 재사용 가능.
```

***

### F3. 물품 조회/수정/삭제 ✅

**목표:** CRUD 완성

#### 3.1 API

```
GET /api/bundles/me?filter=expiring&search=계란&page=0&size=20
- 필터: all(전체), expiring(임박), expired(만료)
- 검색: 품목명, 포장명, 스티커 코드
- 정렬: 최신순 (registered_at DESC)
- 페이징: 20개씩

GET /api/bundles/{bundleId}
- 응답:
  {
    "bundleId": 5,
    "labelCode": "104-005",
    "bundleName": "아침 식재료",
    "memo": "냉장실 앞쪽",
    "items": [
      { "itemId": 10, "itemName": "계란 10구", "expiryDate": "2025-10-20", "daysLeft": 3 },
      ...
    ],
    "registeredAt": "2025-10-17T10:00:00Z"
  }

PUT /api/bundles/{bundleId}
- 입력: bundleName, memo (포장 정보만 수정 가능)

POST /api/bundles/{bundleId}/items
- 입력: { "itemName": "버터", "expiryDate": "2025-10-25" }
- 처리: 기존 포장에 물품 추가

PUT /api/items/{itemId}
- 입력: itemName, expiryDate
- 처리: modified_at 자동 갱신, modified_after_inspection=true 설정

DELETE /api/items/{itemId}
- 처리: 소프트 삭제 (deleted_at 설정)

DELETE /api/bundles/{bundleId}
- 처리: status_code → 'REMOVED', 트리거로 라벨 자동 반환
```

#### 3.2 학습 목표

```
- 동적 쿼리 (QueryDSL or Specification)
- Soft Delete 패턴
- JPA Dirty Checking
- 페이징 (Pageable)
```

***

### F4. 검사 시스템 (SSE 실시간) ⭐핵심

**목표:** SSE 실시간 동기화 완벽 이해

#### 4.1 Entity

```java
// InspectionSession (검사 세션)
- id (PK)
- compartment_id (FK)
- session_uuid (UUID, 고유)
- status (OPEN, SUBMITTED, CANCELLED)
- started_at, ended_at

// InspectionInspector (검사자)
- id (PK)
- session_id (FK)
- inspector_id (FK)
- joined_at
- 제약: 세션당 최대 2명 (트리거)

// InspectionAction (조치)
- id (PK)
- session_id (FK)
- inspector_id (FK)
- bundle_id (FK)
- action_type_code (PASS/WARN/DISPOSE)
- reason_code (정보불일치/보관불량/스티커미부착)
- memo
- unregistered_item_name (미등록 물품용)
- action_time
```

#### 4.2 API

```
POST /api/inspections/sessions
- 입력: compartmentId
- 처리:
  1. 세션 생성 (session_uuid)
  2. 검사자 등록
  3. 칸 잠금 (lock_owner_session_id)
- 응답: { sessionId, sessionUuid }

POST /api/inspections/sessions/{sessionId}/join
- 처리: 검사자 추가 (최대 2명 검증)

GET /api/inspections/sessions/{sessionId}/stream
- SSE 연결 (EventSource)
- 타임아웃: 30분
- 이벤트: connected, action, submit

POST /api/inspections/actions/warn
- 입력: { sessionId, bundleId, reasonCode, memo }
- 처리: InspectionAction 저장 + SSE 알림

POST /api/inspections/actions/dispose
- 입력: { sessionId, bundleId }
- 처리: Action 저장 + 포장 status → REMOVED + SSE 알림

POST /api/inspections/actions/pass
- 입력: { sessionId, bundleId }
- 처리: Action 저장 (통과) + SSE 알림

POST /api/inspections/actions/unregistered
- 입력: { sessionId, unregisteredItemName }
- 처리: 미등록 물품 즉시 폐기 기록

POST /api/inspections/sessions/{sessionId}/submit
- 처리:
  1. 모든 포장 조치 여부 확인
  2. 세션 status → SUBMITTED
  3. 칸 잠금 해제
  4. 조치받은 사용자에게 알림 생성
```

#### 4.3 SSE 구현

```java
@Service
public class SseService {
    // sessionId → List<SseEmitter>
    private final Map<Long, List<SseEmitter>> emitters = new ConcurrentHashMap<>();
    
    public SseEmitter subscribe(Long sessionId) {
        SseEmitter emitter = new SseEmitter(30_000L); // 30분
        
        // 세션에 emitter 추가
        emitters.computeIfAbsent(sessionId, k -> new CopyOnWriteArrayList<>())
            .add(emitter);
        
        // 타임아웃/완료/에러 시 제거
        emitter.onTimeout(() -> removeEmitter(sessionId, emitter));
        emitter.onCompletion(() -> removeEmitter(sessionId, emitter));
        emitter.onError(e -> removeEmitter(sessionId, emitter));
        
        // 초기 연결 확인
        emitter.send(SseEmitter.event().name("connected").data("연결 성공"));
        
        return emitter;
    }
    
    public void notifyInspectors(Long sessionId, String eventName, Object data) {
        List<SseEmitter> sessionEmitters = emitters.get(sessionId);
        if (sessionEmitters == null) return;
        
        for (SseEmitter emitter : sessionEmitters) {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(data));
            } catch (IOException e) {
                removeEmitter(sessionId, emitter);
            }
        }
    }
}
```

#### 4.4 학습 목표

```
- SSE vs WebSocket 차이
- SseEmitter 동작 원리
- 재연결 처리 (EventSource 자동)
- ConcurrentHashMap, CopyOnWriteArrayList
- 칸 잠금 메커니즘
```

#### 4.5 예상 질문

```
Q1: "왜 WebSocket이 아니라 SSE인가요?"
A: 검사는 서버→클라이언트 단방향 알림만 필요.
   SSE는 구현이 단순하고 자동 재연결 지원.
   WebSocket은 양방향 필요 시 사용.

Q2: "네트워크 끊김 시 어떻게 되나요?"
A: EventSource가 자동으로 재연결 시도.
   재연결 시 서버에서 현재 세션 상태 전송하여 동기화.

Q3: "검사 중 물품 수정을 막는 원리는?"
A: 세션 생성 시 Compartment.lock_owner_session_id 설정.
   물품 수정 API에서 칸 잠금 여부 확인 후 거부.
```

***

### F5. 알림 시스템 ✅

**목표:** 배치 작업 + 알림 생성

#### 5.1 Entity

```java
// Notification
- id (PK)
- user_id (FK)
- kind_code (FRIDGE_EXPIRY/INSPECTION_RESULT)
- title
- preview_json (JSONB, 미리보기 정보)
- detail_json (JSONB, 상세 정보)
- related_bundle_id (FK, nullable)
- related_session_id (FK, nullable)
- dedupe_key (SHA256, 중복 방지)
- is_read (boolean)
- created_at
- ttl_at (만료 시각)
```

#### 5.2 알림 종류

```
FRIDGE_EXPIRY (유통기한 임박)
- 발송: 매일 09:00 KST
- 조건: 유통기한 D-3 이내
- TTL: 24시간
- 중복 방지: dedupe_key = SHA256(userId + date)

INSPECTION_RESULT (검사 결과)
- 발송: 검사 제출 즉시
- 조건: WARN 또는 DISPOSE 조치받은 포장 소유자
- TTL: 48시간
- 중복 방지: dedupe_key = SHA256(userId + sessionId + bundleId)
```

#### 5.3 API

```
GET /api/notifications?page=0&size=20
- 정렬: 미읽음 상단, 읽음 하단, created_at DESC
- 응답:
  {
    "content": [
      {
        "id": 1,
        "title": "[냉장고] 유통기한 임박",
        "preview": "아침 식재료 포장의 계란 10구 외 2개 물품의 유통기한이 3일 이내입니다.",
        "isRead": false,
        "createdAt": "2025-10-17T09:00:00Z",
        "relatedBundleId": 5
      }
    ],
    "totalElements": 10
  }

PUT /api/notifications/{notificationId}/read
- 처리: is_read → true

GET /api/notifications/unread-count
- 응답: { "count": 5 }
```

#### 5.4 배치 작업

```java
@Scheduled(cron = "0 0 9 * * *", zone = "Asia/Seoul")
public void sendExpiryNotifications() {
    LocalDate threeDaysLater = LocalDate.now().plusDays(3);
    
    // 유통기한 3일 이내 물품 조회
    List<FridgeItem> expiringItems = itemRepo.findExpiringItems(threeDaysLater);
    
    // 포장별로 그룹화
    Map<Long, List<FridgeItem>> itemsByBundle = expiringItems.stream()
        .collect(Collectors.groupingBy(FridgeItem::getBundleId));
    
    // 포장별 알림 생성
    for (Map.Entry<Long, List<FridgeItem>> entry : itemsByBundle.entrySet()) {
        FridgeBundle bundle = bundleRepo.findById(entry.getKey()).orElse(null);
        if (bundle == null) continue;
        
        String dedupeKey = generateDedupeKey(bundle.getOwnerId(), LocalDate.now());
        
        if (notificationRepo.existsByDedupeKey(dedupeKey)) continue; // 중복 방지
        
        Notification notification = Notification.builder()
            .userId(bundle.getOwnerId())
            .kindCode("FRIDGE_EXPIRY")
            .title("[냉장고] 유통기한 임박")
            .previewJson(buildPreviewJson(bundle, entry.getValue()))
            .relatedBundleId(bundle.getId())
            .dedupeKey(dedupeKey)
            .ttlAt(LocalDateTime.now().plusHours(24))
            .build();
        
        notificationRepo.save(notification);
    }
}
```

#### 5.5 학습 목표

```
- @Scheduled 크론 표현식
- JSONB 활용
- 중복 방지 (dedupe_key)
- 알림 만료 (ttl_at)
```

***

### F6. 관리자 기능 ✅

**목표:** 층별장 임명 + 전체 조회

#### 6.1 API

```
POST /api/admin/inspectors
- 입력: { userId, floorAssigned }
- 처리: User.role → INSPECTOR

DELETE /api/admin/inspectors/{userId}
- 처리: User.role → RESIDENT, 진행 중 검사 강제 종료

GET /api/admin/bundles?floor=2&compartmentId=1&status=ACTIVE&page=0
- 전체 포장 조회 (관리자 전용)
- 필터: 층, 칸, 상태, 호실, 유통기한

GET /api/admin/inspections?floor=2&startDate=2025-10-01&page=0
- 전체 검사 이력 조회
- 필터: 층, 검사자, 날짜 범위

GET /api/admin/statistics
- 응답:
  {
    "totalBundles": 150,
    "expiringItems": 20,
    "weeklyInspections": 12,
    "activeUsers": 180
  }
```

#### 6.2 학습 목표

```
- @PreAuthorize("hasRole('ADMIN')")
- 관리자 전용 조회 쿼리
- 통계 집계
```

***

## 11. Phase 2 기능 상세 (참고용)

**구현 시점:** 졸전 통과 후

### 11.1 세탁실 관리

```
- 기기 현황 조회 (사용 가능/사용 중/완료/고장)
- 기기 사용 등록 (남은 시간 입력)
- 종료 알림 신청 (5분 전)
- 타인 사용 중 기기 시간 정정
- 완료 후 미수거 알림
- 미등록 사용 처리
- 고장 신고
```

### 11.2 도서관 관리

```
- 도서 검색 (제목, 저자, 도서번호)
- 도서 대출/반납/연장 (1회, +7일)
- 예약 (대기열 1명만)
- 알림: 반납 5일 전, 반납 당일, 연체, 예약 도서 대출 가능
- 자동 벌점 (연체 1일 1점)
```

### 11.3 다목적실 예약

```
- 타임라인 조회 (주간 캘린더)
- 예약 (10분 단위, 최소 30분, 최대 3시간)
- 합석 허용 옵션
- 알림: 시작 10분 전, 종료 10분 전
- 노쇼/미등록 신고
```

### 11.4 상벌점 시스템

```
- 자동 벌점: 도서관 연체 1일 1점, 다목적실 노쇼 2점
- 벌점 조회 및 이력
- 10점 이상 시 1주일 이용 정지
```

### 11.5 비밀번호 찾기

```
- 이메일로 재설정 링크 발송
- PasswordResetToken (30분 유효)
- SMTP 설정 (Gmail/Naver)
```

***

## 📌 문서 활용 방법

### AI에게 제공 시

```
이 문서를 매 대화 시작 시 제공:

"[PROJECT_CONTEXT.md 전체 내용]

위 컨텍스트를 기반으로 {기능명}을 구현해줘.
..."
```

### 기능 개발 시

1. 해당 기능 섹션 (F1~F6) 참고
2. Entity, API, 학습 목표 확인
3. AI에게 단계별 요청
4. 예상 질문으로 복습

### 발표 준비 시

```
- 섹션 5 (비즈니스 규칙) 암기
- 섹션 10 (MVP 기능) 예상 질문 답변 준비
- 핵심 3가지 (라벨, 검사, 알림) 완벽 이해
```

***

**이 문서는 DormMate 프로젝트의 단일 진실 공급원(Single Source of Truth)입니다.**

**최종 업데이트:** 2025-10-17 12:30 KST

출처
