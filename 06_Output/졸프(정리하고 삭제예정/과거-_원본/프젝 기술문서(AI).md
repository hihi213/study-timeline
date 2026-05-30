---
type: 소스
status: inbox
topics:
source_url: "{{SOURCE}}"
author:
creation_date: 2025-10-12
---
# DormMate 프로젝트 기술문서 (v2.0 - MVP)

**작성일**: 2025-10-12  
**버전**: 2.0 (MVP 최종확정)  
**개발 기간**: 6주 (126시간)  
**개발 인원**: 1인

***

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [시스템 아키텍처](#2-시스템-아키텍처)
3. [핵심 기능 명세](#3-핵심-기능-명세)
4. [데이터베이스 설계](#4-데이터베이스-설계)
5. [API 명세](#5-api-명세)
6. [프론트엔드 구조](#6-프론트엔드-구조)
7. [배포 및 인프라](#7-배포-및-인프라)
8. [개발 일정](#8-개발-일정)
9. [테스트 전략](#9-테스트-전략)
10. [부록](#10-부록)

***

## 1. 프로젝트 개요

### 1.1 배경 및 목적

**프로젝트명**: DormMate - 기숙사 냉장고 관리 시스템

**해결하려는 문제**
- 공용 냉장고의 유통기한 만료 물품으로 인한 위생 문제
- 물품 소유자 식별 어려움 (스티커 미부착, 정보 불일치)
- 층별장의 비효율적인 수동 검사 프로세스
- Band 앱 공지사항에 묻히는 검사 결과

**핵심 가치 제안**
- 물품 등록 및 식별번호 자동 발급으로 소유권 명확화
- 층별장 2인 동시 검사로 검사 시간 40% 단축
- 유통기한 자동 알림으로 사전 관리 유도
- 검사 결과 개인화 알림으로 피로도 최소화

**MVP 범위 (Phase 1)**
- **포함**: 냉장고 물품 관리, 검사 시스템, 알림 기능
- **제외**: 세탁실, 도서관, 다목적실 (Phase 2로 연기)

### 1.2 현실 기숙사 환경

**층 구성**
- 2층: 남성 전용 (24호실)
- 3~5층: 여성 전용 (각 24호실)
- 호실 범위: X01~X24 (X = 층)

**호실 유형**
- 3인실(TRIPLE): 22개 호실, 개인번호 1~3
- 1인실(SINGLE): 2개 호실 (X13, X24), 개인번호 1 고정
  - 예외: 2층 213호, 224호 (남성 1인실)

**냉장고 구조**
- 층당 1대 (총 4대: 2~5층)
- 칸 구성: 냉장 3칸(slot 1~3) + 냉동 1칸(slot 4)
- 호실 배분:
  - Slot 1~3: 8호실씩 균등 배분 (24/3=8)
  - Slot 4: 전체 24호실 공용

**층별장 역할**
- 정기 검사 주관 (1~2명 임명)
- 경고/폐기 조치 및 기록
- 검사 결과 보고 (Band 게시물 → DormMate 개인화 알림으로 전환)

### 1.3 주요 이해관계자

| 역할 | 인원 | 주요 활동 |
|------|------|-----------|
| **기숙사생(RESIDENT)** | ~300명 | 물품 등록/조회/수정, 알림 확인 |
| **층별장(INSPECTOR)** | 8명 (층당 2명) | 검사 수행, 조치 처리, 이력 조회 |
| **관리자(ADMIN)** | 2~3명 | 층별장 임명, 전체 현황 관리, 시스템 설정 |

***

## 2. 시스템 아키텍처

### 2.1 기술 스택

#### 백엔드
```yaml
언어: Java 21
프레임워크: Spring Boot 3.2.x
  - Spring Security (JWT 인증)
  - Spring Data JPA (ORM)
  - Spring Web (RESTful API)
  - Spring Scheduling (@Scheduled 배치)
데이터베이스: PostgreSQL 15
마이그레이션: Flyway
빌드 도구: Gradle
```

#### 프론트엔드
```yaml
언어: TypeScript
프레임워크: React 18 + Vite
상태 관리: TanStack Query v5 (서버 상태)
폼 관리: React Hook Form + Zod
UI 라이브러리: Tailwind CSS + shadcn/ui
실시간 통신: EventSource API (SSE)
개발 전략: AI 도구(ChatGPT/Claude) 80% 활용
```

#### 인프라
```yaml
호스팅: AWS Lightsail (단일 인스턴스)
웹 서버: Nginx (리버스 프록시 + HTTPS)
SSL: Let's Encrypt (자동 갱신)
모니터링: Spring Boot Actuator
```

### 2.2 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────┐
│                   Client Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │   Mobile     │  │   Tablet     │  │  Desktop  │ │
│  │   Browser    │  │   Browser    │  │  Browser  │ │
│  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘ │
│         │                  │                 │       │
│         └──────────────────┴─────────────────┘       │
└─────────────────────────┬───────────────────────────┘
                          │ HTTPS
                          │
┌─────────────────────────▼───────────────────────────┐
│              Nginx (Reverse Proxy)                   │
│  - SSL Termination                                   │
│  - Rate Limiting                                     │
│  - CORS Configuration                                │
└─────────────────────────┬───────────────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
┌───────▼────────┐              ┌───────────▼──────────┐
│  Static Files  │              │   Spring Boot App    │
│  (React Build) │              │  ┌────────────────┐  │
└────────────────┘              │  │  Controller    │  │
                                │  │  - REST API    │  │
                                │  │  - SSE Stream  │  │
                                │  └────────┬───────┘  │
                                │           │          │
                                │  ┌────────▼───────┐  │
                                │  │   Service      │  │
                                │  │  - Business    │  │
                                │  │    Logic       │  │
                                │  └────────┬───────┘  │
                                │           │          │
                                │  ┌────────▼───────┐  │
                                │  │  Repository    │  │
                                │  │  (Spring JPA)  │  │
                                │  └────────┬───────┘  │
                                └───────────┼──────────┘
                                            │
                          ┌─────────────────┴─────────────────┐
                          │                                   │
                ┌─────────▼────────┐              ┌───────────▼──────────┐
                │   PostgreSQL     │              │  ConcurrentHashMap   │
                │   - 영구 데이터   │              │  - 검사 세션 (메모리) │
                │   - 물품/이력     │              │  - SSE Emitters      │
                └──────────────────┘              └──────────────────────┘
```

### 2.3 보안 아키텍처

**인증 흐름 (JWT)**
```
1. 사용자 로그인 (email + password)
   ↓
2. Spring Security 인증 검증 (BCrypt)
   ↓
3. JWT 토큰 발급 (7일 유효, 역할 포함)
   ↓
4. 클라이언트 localStorage 저장
   ↓
5. 이후 모든 요청에 Authorization 헤더 포함
   ↓
6. JwtAuthenticationFilter에서 토큰 검증
   ↓
7. SecurityContext에 인증 정보 설정
   ↓
8. @PreAuthorize로 역할 기반 접근 제어
```

**RBAC (역할 기반 접근 제어)**
```java
@PreAuthorize("hasRole('RESIDENT')")
@GetMapping("/items/my")
public ResponseEntity<?> getMyItems() { }

@PreAuthorize("hasRole('INSPECTOR')")
@PostMapping("/inspections/start")
public ResponseEntity<?> startInspection() { }

@PreAuthorize("hasRole('ADMIN')")
@PostMapping("/users/{id}/role")
public ResponseEntity<?> changeRole() { }
```

### 2.4 실시간 동기화 아키텍처 (SSE)

**검사 세션 동기화**
```
검사자 A                     서버                      검사자 B
   │                           │                           │
   │ POST /inspections/start   │                           │
   ├──────────────────────────►│                           │
   │                           │ Session 생성 (메모리)      │
   │                           │                           │
   │ GET /inspections/stream   │                           │
   ├──────────────────────────►│                           │
   │◄──────SSE 연결 수립────────┤                           │
   │                           │                           │
   │                           │◄─────GET /inspections/stream
   │                           ├──────SSE 연결 수립─────────►│
   │                           │                           │
   │ POST /items/1/mark        │                           │
   ├──────────────────────────►│                           │
   │                           │ ConcurrentHashMap 업데이트 │
   │                           │                           │
   │                           ├──────SSE Event 전송────────►│
   │                           │ {itemId: 1, status: 완료}  │
   │                           │                           │
   │                           │ UI 자동 업데이트           │
   │                           │ (미검사→검사완료)          │
```

***

## 3. 핵심 기능 명세

### 3.1 인증 및 사용자 관리

#### 3.1.1 회원가입

**요구사항**
- 호실 번호 (201~224, 301~324, 401~424, 501~524)
- 개인 번호 (1~3, 1인실은 1만 가능)
- 이메일 (중복 불가)
- 비밀번호 (8자 이상, 영문+숫자)

**처리 프로세스**
1. 입력 유효성 검증 (Zod 스키마)
2. 호실/개인번호 조합 중복 확인
3. 비밀번호 BCrypt 해싱
4. User 엔티티 생성 (role=RESIDENT)
5. 호실 기반 냉장고 칸 자동 매핑
   - 01~08호 → Slot 1 (냉장)
   - 09~16호 → Slot 2 (냉장)
   - 17~24호 → Slot 3 (냉장)
   - 전체 → Slot 4 (냉동)
6. DB 저장 및 성공 응답

**예외 처리**
- 중복 이메일: `409 Conflict - "이미 사용 중인 이메일입니다."`
- 중복 호실/개인번호: `409 Conflict - "이미 등록된 호실입니다."`
- 유효하지 않은 호실: `400 Bad Request - "존재하지 않는 호실 번호입니다."`

#### 3.1.2 로그인

**JWT 토큰 페이로드**
```json
{
  "sub": "user@example.com",
  "userId": 123,
  "role": "RESIDENT",
  "roomNumber": "201",
  "personalNumber": 1,
  "iat": 1697097600,
  "exp": 1697702400
}
```

**세션 관리**
- Stateless: 서버는 세션 저장 X
- 토큰 갱신: 만료 시 재로그인 필요 (자동 갱신 Phase 2)
- 로그아웃: 클라이언트에서 토큰 삭제

### 3.2 냉장고 물품 관리

#### 3.2.1 묶음 등록 시스템

**데이터 구조**
```typescript
// 프론트엔드 폼 데이터
interface BundleRegistrationForm {
  quantity: number;                    // 수량 (1~99)
  representativeName: string;          // 대표이름 (필수)
  representativeMemo?: string;         // 대표메모 (선택)
  slotType: 'FRIDGE' | 'FREEZER';     // 냉장/냉동
  items: Array<{
    name: string;                      // 개별 품목명
    expiryDate: string;                // 유통기한 (YYYY-MM-DD)
  }>;
}

// 백엔드 응답
interface BundleResponse {
  bundleId: number;
  stickerCode: string;                 // "1005"
  representativeName: string;
  representativeMemo: string;
  items: Array<{
    itemId: number;
    name: string;
    expiryDate: string;
  }>;
  createdAt: string;
}
```

**등록 프로세스**
1. 프론트: 수량 입력 → 동적 폼 생성 (useFieldArray)
2. 프론트: 대표정보 + 개별 품목 입력
3. 백엔드: 슬롯 ID 조회 (호실 + 슬롯타입)
4. 백엔드: 사용 가능한 라벨 번호 조회
   ```sql
   SELECT label_number 
   FROM fridge_bundles 
   WHERE slot_id = ? AND status != 'REMOVED'
   ORDER BY label_number
   ```
5. 백엔드: 1~999 중 첫 번째 미사용 번호 발급
6. 백엔드: 스티커 코드 생성 (`slotNumber + labelNumber`)
7. 백엔드: FridgeBundle + BundleItems 일괄 저장 (Cascade)
8. 프론트: 스티커 코드 화면 표시 (출력/저장)

**스티커 코드 규칙**
- 형식: `{슬롯번호 1자리}{라벨번호 3자리}`
- 예시:
  - Slot 1, Label 5 → `1005`
  - Slot 4, Label 123 → `4123`
- 재사용: REMOVED 상태 물품의 번호는 즉시 재사용 가능

#### 3.2.2 물품 조회

**필터 옵션**
```typescript
interface ItemFilter {
  myItemsOnly: boolean;     // 내 물품만 (기본 true)
  expiringSoon: boolean;    // 3일 이내 임박
  expired: boolean;         // 유통기한 지남
  searchQuery?: string;     // 품목명 검색
  stickerCode?: string;     // 스티커 코드 검색
}
```

**정렬 기준**
- 기본: 등록일시 최신순
- 임박 필터 활성화 시: 유통기한 가까운 순

**페이지네이션**
- 무한 스크롤 (TanStack Query Infinite Queries)
- 페이지당 20개 물품

#### 3.2.3 물품 수정

**수정 가능 항목**
- 대표이름, 대표메모
- 개별 품목: 품목명, 유통기한

**수정 불가 항목**
- 스티커 코드, 라벨 번호
- 슬롯 배정, 등록일시

**검사 후 수정 추적**
```java
@Transactional
public void updateBundle(Long bundleId, UpdateBundleDto dto) {
    FridgeBundle bundle = bundleRepository.findById(bundleId);
    
    // 최근 검사 일시 조회
    LocalDateTime lastInspection = inspectionService
        .getLastInspectionTime(bundle.getSlot().getId());
    
    // 메모 외 정보 수정 시 플래그 설정
    if (!dto.getRepresentativeName().equals(bundle.getRepresentativeName())
        || itemsChanged(bundle.getItems(), dto.getItems())) {
        
        if (bundle.getCreatedAt().isBefore(lastInspection)) {
            bundle.setModifiedAfterInspection(true);
        }
    }
    
    // 업데이트 적용
    bundle.update(dto);
}
```

**다음 검사 시 우선순위**
- `modifiedAfterInspection=true` 물품 → 미검사 탭 상단 배치
- 검사 완료 시 플래그 자동 리셋

#### 3.2.4 물품 삭제

**개별 품목 삭제**
```java
@Transactional
public void deleteItem(Long itemId) {
    BundleItem item = itemRepository.findById(itemId);
    FridgeBundle bundle = item.getBundle();
    
    bundle.getItems().remove(item);
    itemRepository.delete(item);
    
    // 품목 0개 → 묶음 자동 삭제
    if (bundle.getItems().isEmpty()) {
        bundle.setStatus(BundleStatus.REMOVED);
        labelService.releaseLabel(bundle.getLabelNumber());
    }
}
```

**묶음 전체 삭제**
- 소프트 삭제 (status → REMOVED)
- 라벨 번호 즉시 재사용 가능
- 검사 이력은 유지 (외래키 NULL 허용)

### 3.3 검사 시스템

#### 3.3.1 검사 세션 관리

**세션 데이터 구조**
```java
@Getter @Setter
public class InspectionSession {
    private String sessionId;              // UUID
    private Long slotId;                   // 칸 ID
    private Set<String> inspectorIds;      // 검사자 (최대 2명)
    private Map<Long, InspectionAction> actions; // 물품별 조치
    private LocalDateTime startedAt;
    private LocalDateTime expiresAt;       // TTL 1시간
}

@Getter @Setter
public class InspectionAction {
    private Long bundleId;
    private ActionType type;               // PASS, WARN, DISPOSE
    private String reason;                 // 사유
    private String memo;                   // 메모
    private String inspector;              // 조치자
    private LocalDateTime actionedAt;
}
```

**세션 생성 로직**
```java
@Service
public class InspectionSessionService {
    private final ConcurrentHashMap<Long, InspectionSession> sessions 
        = new ConcurrentHashMap<>();
    
    public InspectionSession startOrJoin(Long slotId, String inspectorId) {
        return sessions.compute(slotId, (key, existing) -> {
            if (existing == null) {
                // 새 세션 생성
                InspectionSession session = new InspectionSession();
                session.setSessionId(UUID.randomUUID().toString());
                session.setSlotId(slotId);
                session.getInspectorIds().add(inspectorId);
                return session;
            } else if (existing.getInspectorIds().size() < 2) {
                // 기존 세션 합류
                existing.getInspectorIds().add(inspectorId);
                return existing;
            } else {
                throw new MaxInspectorsException("이미 2명이 검사 중입니다.");
            }
        });
    }
}
```

#### 3.3.2 실시간 동기화 (SSE)

**SSE 스트림 생성**
```java
@RestController
@RequestMapping("/api/inspections")
public class InspectionController {
    
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamInspection(
        @RequestParam Long slotId,
        @RequestHeader("Authorization") String token
    ) {
        String inspectorId = jwtService.extractUserId(token);
        SseEmitter emitter = new SseEmitter(60 * 60 * 1000L); // 1시간
        
        // Emitter 등록
        sessionService.registerEmitter(slotId, inspectorId, emitter);
        
        // 초기 세션 상태 전송
        InspectionSession session = sessionService.getSession(slotId);
        emitter.send(SseEmitter.event()
            .name("session-state")
            .data(session));
        
        // 정리 핸들러
        emitter.onCompletion(() -> 
            sessionService.unregisterEmitter(slotId, inspectorId));
        emitter.onTimeout(() -> 
            sessionService.unregisterEmitter(slotId, inspectorId));
        
        return emitter;
    }
}
```

**조치 브로드캐스트**
```java
public void markItem(Long slotId, Long bundleId, InspectionActionDto dto) {
    InspectionSession session = sessions.get(slotId);
    
    // 메모리 업데이트
    InspectionAction action = new InspectionAction();
    action.setBundleId(bundleId);
    action.setType(dto.getType());
    action.setReason(dto.getReason());
    action.setInspector(dto.getInspectorId());
    session.getActions().put(bundleId, action);
    
    // SSE 브로드캐스트
    session.getInspectorIds().forEach(inspectorId -> {
        SseEmitter emitter = emitters.get(inspectorId);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event()
                    .name("item-marked")
                    .data(action));
            } catch (IOException e) {
                emitters.remove(inspectorId);
            }
        }
    });
}
```

#### 3.3.3 검사 제출

**제출 프로세스**
```java
@Transactional
public void submitInspection(Long slotId, String inspectorId) {
    InspectionSession session = sessions.get(slotId);
    
    // 1. 검사 이력 저장
    Inspection inspection = new Inspection();
    inspection.setSlotId(slotId);
    inspection.setInspectors(session.getInspectorIds());
    inspection.setInspectedAt(LocalDateTime.now());
    inspectionRepository.save(inspection);
    
    // 2. 물품별 조치 저장
    session.getActions().forEach((bundleId, action) -> {
        InspectionResult result = new InspectionResult();
        result.setInspection(inspection);
        result.setBundle(bundleRepository.findById(bundleId).orElse(null));
        result.setActionType(action.getType());
        result.setReason(action.getReason());
        result.setInspector(action.getInspector());
        resultRepository.save(result);
        
        // 폐기 조치 시 물품 삭제
        if (action.getType() == ActionType.DISPOSE) {
            bundleService.delete(bundleId);
        }
    });
    
    // 3. 통계 집계
    int warnCount = (int) session.getActions().values().stream()
        .filter(a -> a.getType() == ActionType.WARN).count();
    int disposeCount = (int) session.getActions().values().stream()
        .filter(a -> a.getType() == ActionType.DISPOSE).count();
    inspection.setWarnCount(warnCount);
    inspection.setDisposeCount(disposeCount);
    
    // 4. 알림 발송
    notificationService.sendInspectionResults(inspection);
    
    // 5. 세션 종료
    sessions.remove(slotId);
    
    // 6. 칸 락 해제
    slotLockService.unlock(slotId);
    
    // 7. 수정 플래그 리셋
    bundleRepository.findBySlotId(slotId).forEach(bundle -> 
        bundle.setModifiedAfterInspection(false));
}
```

### 3.4 알림 시스템

#### 3.4.1 유통기한 알림 배치

**스케줄링 설정**
```java
@Configuration
@EnableScheduling
public class SchedulingConfig {
    
    @Scheduled(cron = "0 0 9 * * *", zone = "Asia/Seoul")
    public void sendExpiryNotifications() {
        notificationService.processExpiryAlerts();
    }
}
```

**배치 로직**
```java
@Transactional
public void processExpiryAlerts() {
    LocalDate threshold = LocalDate.now().plusDays(3);
    
    // 임박 물품 조회 (3일 이내)
    List<FridgeBundle> expiring = bundleRepository
        .findByItemsExpiryDateBetween(
            LocalDate.now(), 
            threshold
        );
    
    // 사용자별 그룹화
    Map<User, List<FridgeBundle>> byUser = expiring.stream()
        .collect(Collectors.groupingBy(FridgeBundle::getOwner));
    
    // 알림 생성 (하루 1회)
    byUser.forEach((user, bundles) -> {
        if (!hasNotificationToday(user, NotificationType.EXPIRY)) {
            Notification notification = new Notification();
            notification.setUser(user);
            notification.setType(NotificationType.EXPIRY);
            notification.setTitle("[냉장고] 유통기한 확인 필요");
            notification.setContent(
                String.format("%d개의 품목 유통기한이 임박했습니다.", bundles.size())
            );
            notification.setRelatedBundles(bundles);
            notificationRepository.save(notification);
        }
    });
}
```

#### 3.4.2 검사 결과 알림

**즉시 발송**
```java
public void sendInspectionResults(Inspection inspection) {
    // 조치받은 사용자별 그룹화
    Map<User, List<InspectionResult>> byUser = 
        inspection.getResults().stream()
            .filter(r -> r.getActionType() != ActionType.PASS)
            .collect(Collectors.groupingBy(
                r -> r.getBundle().getOwner()
            ));
    
    // 알림 생성
    byUser.forEach((user, results) -> {
        int warnCount = (int) results.stream()
            .filter(r -> r.getActionType() == ActionType.WARN).count();
        int disposeCount = (int) results.stream()
            .filter(r -> r.getActionType() == ActionType.DISPOSE).count();
        
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType(NotificationType.INSPECTION_RESULT);
        notification.setTitle("[냉장고] 점검결과 확인필요");
        notification.setContent(
            String.format("회원님의 물품에서 경고 %d건 폐기 %d건 조치가 있었습니다.", 
                warnCount, disposeCount)
        );
        notification.setRelatedInspection(inspection);
        notificationRepository.save(notification);
    });
}
```

#### 3.4.3 자동 읽음 처리

**읽음 규칙**
```java
@Aspect
@Component
public class NotificationReadAspect {
    
    // 냉장고 메인 진입 시
    @After("execution(* com.dormmate.controller.FridgeController.getMainPage(..))")
    public void markFridgeNotificationsAsRead(JoinPoint joinPoint) {
        String userId = SecurityContextHolder.getContext()
            .getAuthentication().getName();
        
        notificationService.markAsRead(
            userId, 
            NotificationType.EXPIRY,
            NotificationType.INSPECTION_RESULT
        );
    }
    
    // 물품 상세 화면 진입 시
    @After("execution(* com.dormmate.controller.FridgeController.getBundleDetail(..)) && args(bundleId,..)")
    public void markBundleNotificationsAsRead(Long bundleId) {
        String userId = SecurityContextHolder.getContext()
            .getAuthentication().getName();
        
        notificationService.markAsReadByRelatedBundle(userId, bundleId);
    }
}
```

#### 3.4.4 탭 뱃지 표시

**뱃지 카운트 API**
```java
@GetMapping("/notifications/badge")
public BadgeCountResponse getBadgeCount(
    @AuthenticationPrincipal User user
) {
    long fridgeUnread = notificationRepository
        .countUnreadByUserAndTypes(
            user,
            NotificationType.EXPIRY,
            NotificationType.INSPECTION_RESULT
        );
    
    return BadgeCountResponse.builder()
        .fridge(Math.min(fridgeUnread, 9))  // 최대 9+
        .build();
}
```

**프론트엔드 폴링**
```typescript
// TanStack Query로 30초마다 자동 갱신
const {  badgeCount } = useQuery({
  queryKey: ['badgeCount'],
  queryFn: fetchBadgeCount,
  refetchInterval: 30000,
  refetchOnWindowFocus: true,
});
```

***

## 4. 데이터베이스 설계

### 4.1 ERD (Entity Relationship Diagram)

```
┌─────────────────┐         ┌──────────────────┐
│      User       │         │   FridgeSlot     │
├─────────────────┤         ├──────────────────┤
│ id (PK)         │         │ id (PK)          │
│ email (UK)      │         │ floor            │
│ password        │         │ slot_number      │
│ name            │         │ kind (ENUM)      │
│ room_number     │         │ assigned_rooms   │
│ personal_number │         └──────────────────┘
│ role (ENUM)     │                  │
│ created_at      │                  │ 1
│ updated_at      │                  │
└─────────────────┘                  │
         │                           │
         │ 1                         │
         │                           │
         │ N                         │ N
         │                           │
┌────────▼──────────┐       ┌────────▼──────────┐
│   FridgeBundle    │       │   Inspection      │
├───────────────────┤       ├───────────────────┤
│ id (PK)           │       │ id (PK)           │
│ owner_id (FK)     │       │ slot_id (FK)      │
│ slot_id (FK)      │       │ inspector_ids     │
│ label_number      │       │ inspected_at      │
│ sticker_code (UK) │       │ warn_count        │
│ rep_name          │       │ dispose_count     │
│ rep_memo          │       └───────────────────┘
│ status (ENUM)     │                │
│ modified_after_   │                │ 1
│   inspection      │                │
│ created_at        │                │
│ updated_at        │                │ N
└───────────────────┘       ┌────────▼─────────────┐
         │                  │  InspectionResult    │
         │ 1                ├──────────────────────┤
         │                  │ id (PK)              │
         │ N                │ inspection_id (FK)   │
         │                  │ bundle_id (FK, NULL) │
┌────────▼──────────┐       │ action_type (ENUM)   │
│   BundleItem      │       │ reason               │
├───────────────────┤       │ memo                 │
│ id (PK)           │       │ inspector            │
│ bundle_id (FK)    │       │ actioned_at          │
│ name              │       └──────────────────────┘
│ expiry_date       │
│ created_at        │
└───────────────────┘
         
         
┌───────────────────┐
│   Notification    │
├───────────────────┤
│ id (PK)           │
│ user_id (FK)      │
│ type (ENUM)       │
│ title             │
│ content           │
│ is_read           │
│ related_bundle_id │
│ related_inspect_  │
│   ion_id          │
│ created_at        │
│ expires_at        │
└───────────────────┘
```

### 4.2 테이블 정의

#### 4.2.1 users

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    room_number VARCHAR(10) NOT NULL,
    personal_number INT NOT NULL CHECK (personal_number BETWEEN 1 AND 3),
    role VARCHAR(20) NOT NULL DEFAULT 'RESIDENT',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (room_number, personal_number),
    CHECK (role IN ('RESIDENT', 'INSPECTOR', 'ADMIN'))
);

CREATE INDEX idx_users_room ON users(room_number);
CREATE INDEX idx_users_role ON users(role);
```

#### 4.2.2 fridge_slots

```sql
CREATE TABLE fridge_slots (
    id BIGSERIAL PRIMARY KEY,
    floor INT NOT NULL CHECK (floor BETWEEN 2 AND 5),
    slot_number INT NOT NULL CHECK (slot_number BETWEEN 1 AND 4),
    kind VARCHAR(10) NOT NULL CHECK (kind IN ('FRIDGE', 'FREEZER')),
    assigned_rooms VARCHAR(255) NOT NULL, -- 쉼표 구분 (예: '01,02,03,04,05,06,07,08')
    UNIQUE (floor, slot_number)
);

-- 초기 데이터 삽입
INSERT INTO fridge_slots (floor, slot_number, kind, assigned_rooms) VALUES
(2, 1, 'FRIDGE', '01,02,03,04,05,06,07,08'),
(2, 2, 'FRIDGE', '09,10,11,12,13,14,15,16'),
(2, 3, 'FRIDGE', '17,18,19,20,21,22,23,24'),
(2, 4, 'FREEZER', '01,02,03,04,05,06,07,08,09,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24'),
-- 3~5층 동일 패턴...
```

#### 4.2.3 fridge_bundles

```sql
CREATE TABLE fridge_bundles (
    id BIGSERIAL PRIMARY KEY,
    owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slot_id BIGINT NOT NULL REFERENCES fridge_slots(id) ON DELETE RESTRICT,
    label_number INT NOT NULL CHECK (label_number BETWEEN 1 AND 999),
    sticker_code VARCHAR(10) NOT NULL UNIQUE,
    representative_name VARCHAR(100) NOT NULL,
    representative_memo TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    modified_after_inspection BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (status IN ('ACTIVE', 'REMOVED')),
    UNIQUE (slot_id, label_number, status) -- status=ACTIVE인 경우만 유니크
);

CREATE INDEX idx_bundles_owner ON fridge_bundles(owner_id);
CREATE INDEX idx_bundles_slot ON fridge_bundles(slot_id);
CREATE INDEX idx_bundles_sticker ON fridge_bundles(sticker_code);
CREATE INDEX idx_bundles_status ON fridge_bundles(status);
```

#### 4.2.4 bundle_items

```sql
CREATE TABLE bundle_items (
    id BIGSERIAL PRIMARY KEY,
    bundle_id BIGINT NOT NULL REFERENCES fridge_bundles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    expiry_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_items_bundle ON bundle_items(bundle_id);
CREATE INDEX idx_items_expiry ON bundle_items(expiry_date);
```

#### 4.2.5 inspections

```sql
CREATE TABLE inspections (
    id BIGSERIAL PRIMARY KEY,
    slot_id BIGINT NOT NULL REFERENCES fridge_slots(id) ON DELETE RESTRICT,
    inspector_ids TEXT NOT NULL, -- JSON 배열 (예: '["user1", "user2"]')
    inspected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    warn_count INT NOT NULL DEFAULT 0,
    dispose_count INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_inspections_slot ON inspections(slot_id);
CREATE INDEX idx_inspections_date ON inspections(inspected_at);
```

#### 4.2.6 inspection_results

```sql
CREATE TABLE inspection_results (
    id BIGSERIAL PRIMARY KEY,
    inspection_id BIGINT NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
    bundle_id BIGINT REFERENCES fridge_bundles(id) ON DELETE SET NULL,
    action_type VARCHAR(20) NOT NULL,
    reason VARCHAR(50),
    memo TEXT,
    inspector VARCHAR(100) NOT NULL,
    actioned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (action_type IN ('PASS', 'WARN', 'DISPOSE'))
);

CREATE INDEX idx_results_inspection ON inspection_results(inspection_id);
CREATE INDEX idx_results_bundle ON inspection_results(bundle_id);
```

#### 4.2.7 notifications

```sql
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    related_bundle_id BIGINT REFERENCES fridge_bundles(id) ON DELETE SET NULL,
    related_inspection_id BIGINT REFERENCES inspections(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
    CHECK (type IN ('EXPIRY', 'INSPECTION_RESULT'))
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_expires ON notifications(expires_at);
```

### 4.3 Flyway 마이그레이션 전략

**버전 관리**
```
src/main/resources/db/migration/
├── V1__create_users_table.sql
├── V2__create_fridge_slots_table.sql
├── V3__create_fridge_bundles_table.sql
├── V4__create_bundle_items_table.sql
├── V5__create_inspections_table.sql
├── V6__create_inspection_results_table.sql
├── V7__create_notifications_table.sql
└── V8__insert_initial_data.sql
```

**롤백 전략**
- Flyway는 자동 롤백 미지원
- 롤백 필요 시 수동 스크립트 작성 (`U{version}__rollback.sql`)
- 개발 환경: DB 재생성 (`DROP DATABASE`)
- 프로덕션: 신중한 마이그레이션 + 백업

***

## 5. API 명세

### 5.1 인증 API

#### POST /api/auth/register

**요청**
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "name": "홍길동",
  "roomNumber": "201",
  "personalNumber": 1
}
```

**응답 (201 Created)**
```json
{
  "userId": 123,
  "email": "user@example.com",
  "name": "홍길동",
  "roomNumber": "201",
  "personalNumber": 1,
  "role": "RESIDENT",
  "assignedSlots": [
    { "id": 1, "kind": "FRIDGE", "slotNumber": 1 },
    { "id": 4, "kind": "FREEZER", "slotNumber": 4 }
  ]
}
```

#### POST /api/auth/login

**요청**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**응답 (200 OK)**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2025-10-19T14:00:00Z",
  "user": {
    "userId": 123,
    "email": "user@example.com",
    "name": "홍길동",
    "role": "RESIDENT"
  }
}
```

### 5.2 냉장고 물품 API

#### POST /api/bundles

**요청**
```json
{
  "representativeName": "마카롱",
  "representativeMemo": "내일까지 먹을 것",
  "slotType": "FRIDGE",
  "items": [
    { "name": "딸기맛 마카롱", "expiryDate": "2025-10-25" },
    { "name": "초코맛 마카롱", "expiryDate": "2025-10-25" },
    { "name": "바닐라 마카롱", "expiryDate": "2025-10-27" }
  ]
}
```

**응답 (201 Created)**
```json
{
  "bundleId": 456,
  "stickerCode": "1023",
  "representativeName": "마카롱",
  "representativeMemo": "내일까지 먹을 것",
  "items": [
    { "itemId": 789, "name": "딸기맛 마카롱", "expiryDate": "2025-10-25" },
    { "itemId": 790, "name": "초코맛 마카롱", "expiryDate": "2025-10-25" },
    { "itemId": 791, "name": "바닐라 마카롱", "expiryDate": "2025-10-27" }
  ],
  "createdAt": "2025-10-12T14:30:00Z"
}
```

#### GET /api/bundles

**쿼리 파라미터**
```
myItemsOnly: boolean (default: true)
expiringSoon: boolean (default: false)
expired: boolean (default: false)
searchQuery: string (optional)
stickerCode: string (optional)
page: number (default: 0)
size: number (default: 20)
```

**응답 (200 OK)**
```json
{
  "content": [
    {
      "bundleId": 456,
      "stickerCode": "1023",
      "representativeName": "마카롱",
      "items": [
        { "itemId": 789, "name": "딸기맛 마카롱", "expiryDate": "2025-10-25" }
      ],
      "nearestExpiryDate": "2025-10-25",
      "daysUntilExpiry": 13,
      "createdAt": "2025-10-12T14:30:00Z"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20
  },
  "totalElements": 42,
  "totalPages": 3
}
```

#### PUT /api/bundles/{bundleId}

**요청**
```json
{
  "representativeName": "마카롱 (수정됨)",
  "representativeMemo": "오늘까지 먹기",
  "items": [
    { "itemId": 789, "name": "딸기맛", "expiryDate": "2025-10-24" }
  ]
}
```

**응답 (200 OK)**
```json
{
  "bundleId": 456,
  "modifiedAfterInspection": true,
  "updatedAt": "2025-10-12T15:00:00Z"
}
```

#### DELETE /api/bundles/{bundleId}

**응답 (204 No Content)**

#### DELETE /api/items/{itemId}

**응답 (204 No Content)**

### 5.3 검사 API

#### POST /api/inspections/start

**요청**
```json
{
  "slotId": 1
}
```

**응답 (200 OK)**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "slotId": 1,
  "inspectorIds": ["user123"],
  "bundles": [
    {
      "bundleId": 456,
      "stickerCode": "1023",
      "representativeName": "마카롱",
      "modifiedAfterInspection": false
    }
  ],
  "startedAt": "2025-10-12T16:00:00Z"
}
```

#### GET /api/inspections/stream?slotId={slotId}

**SSE 이벤트 스트림**
```
event: session-state
 {"sessionId":"...","bundles":[...]}

event: item-marked
 {"bundleId":456,"actionType":"WARN","inspector":"user123"}

event: inspector-joined
 {"inspectorId":"user456"}
```

#### POST /api/inspections/{sessionId}/mark

**요청**
```json
{
  "bundleId": 456,
  "actionType": "WARN",
  "reason": "INFO_MISMATCH",
  "memo": "스티커와 실제 내용물이 다름"
}
```

**응답 (200 OK)**
```json
{
  "actionId": "action-uuid",
  "bundleId": 456,
  "actionType": "WARN",
  "inspector": "user123",
  "actionedAt": "2025-10-12T16:05:00Z"
}
```

#### POST /api/inspections/{sessionId}/submit

**응답 (200 OK)**
```json
{
  "inspectionId": 789,
  "slotId": 1,
  "inspectors": ["user123", "user456"],
  "warnCount": 3,
  "disposeCount": 1,
  "inspectedAt": "2025-10-12T16:30:00Z"
}
```

#### DELETE /api/inspections/{sessionId}

**응답 (204 No Content)**

### 5.4 알림 API

#### GET /api/notifications

**쿼리 파라미터**
```
unreadOnly: boolean (default: false)
type: string (optional, EXPIRY|INSPECTION_RESULT)
page: number (default: 0)
size: number (default: 50)
```

**응답 (200 OK)**
```json
{
  "content": [
    {
      "notificationId": 1001,
      "type": "EXPIRY",
      "title": "[냉장고] 유통기한 확인 필요",
      "content": "3개의 품목 유통기한이 임박했습니다.",
      "isRead": false,
      "relatedBundles": [456, 457, 458],
      "createdAt": "2025-10-12T09:00:00Z",
      "expiresAt": "2025-10-13T09:00:00Z"
    }
  ],
  "totalElements": 15,
  "unreadCount": 5
}
```

#### PUT /api/notifications/{notificationId}/read

**응답 (200 OK)**
```json
{
  "notificationId": 1001,
  "isRead": true,
  "readAt": "2025-10-12T17:00:00Z"
}
```

#### GET /api/notifications/badge

**응답 (200 OK)**
```json
{
  "fridge": 5,
  "total": 5
}
```

### 5.5 관리자 API

#### POST /api/admin/users/{userId}/role

**요청**
```json
{
  "role": "INSPECTOR"
}
```

**응답 (200 OK)**
```json
{
  "userId": 123,
  "role": "INSPECTOR",
  "updatedAt": "2025-10-12T18:00:00Z"
}
```

#### GET /api/admin/bundles

**쿼리 파라미터**
```
floor: number (optional, 2~5)
slotId: number (optional)
roomNumber: string (optional)
status: string (optional, ACTIVE|REMOVED)
```

**응답 (200 OK)**
```json
{
  "content": [
    {
      "bundleId": 456,
      "owner": {
        "userId": 123,
        "name": "홍길동",
        "roomNumber": "201"
      },
      "stickerCode": "1023",
      "representativeName": "마카롱",
      "status": "ACTIVE"
    }
  ],
  "totalElements": 150
}
```

#### GET /api/admin/inspections

**쿼리 파라미터**
```
floor: number (optional)
inspectorId: string (optional)
startDate: date (optional)
endDate: date (optional)
```

**응답 (200 OK)**
```json
{
  "content": [
    {
      "inspectionId": 789,
      "slotId": 1,
      "floor": 2,
      "inspectors": ["user123", "user456"],
      "warnCount": 3,
      "disposeCount": 1,
      "inspectedAt": "2025-10-12T16:30:00Z"
    }
  ],
  "totalElements": 48
}
```

***

## 6. 프론트엔드 구조

### 6.1 디렉토리 구조

```
src/
├── api/                    # API 클라이언트
│   ├── auth.ts
│   ├── bundles.ts
│   ├── inspections.ts
│   └── notifications.ts
├── components/             # 재사용 컴포넌트
│   ├── ui/                # shadcn/ui 컴포넌트
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   └── toast.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── BottomNav.tsx
│   │   └── Layout.tsx
│   ├── bundles/
│   │   ├── BundleCard.tsx
│   │   ├── BundleForm.tsx
│   │   └── StickerPrint.tsx
│   └── inspections/
│       ├── InspectionCard.tsx
│       └── InspectionActions.tsx
├── hooks/                 # 커스텀 훅
│   ├── useAuth.ts
│   ├── useBundles.ts
│   ├── useInspection.ts
│   └── useNotifications.ts
├── pages/                 # 페이지 컴포넌트
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   ├── fridge/
│   │   ├── FridgeMainPage.tsx
│   │   ├── BundleListPage.tsx
│   │   ├── BundleDetailPage.tsx
│   │   └── RegisterPage.tsx
│   ├── inspection/
│   │   ├── InspectionPage.tsx
│   │   └── InspectionHistoryPage.tsx
│   └── admin/
│       ├── DashboardPage.tsx
│       └── UserManagementPage.tsx
├── stores/               # 상태 관리 (최소화)
│   └── authStore.ts
├── types/                # TypeScript 타입
│   ├── api.ts
│   ├── models.ts
│   └── enums.ts
├── utils/                # 유틸리티
│   ├── formatters.ts
│   ├── validators.ts
│   └── dateHelpers.ts
├── App.tsx
├── main.tsx
└── router.tsx
```

### 6.2 주요 컴포넌트

#### 6.2.1 BundleForm (묶음 등록 폼)

```tsx
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const bundleSchema = z.object({
  quantity: z.number().min(1).max(99),
  representativeName: z.string().min(1).max(100),
  representativeMemo: z.string().max(500).optional(),
  slotType: z.enum(['FRIDGE', 'FREEZER']),
  items: z.array(z.object({
    name: z.string().min(1).max(100),
    expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })),
});

type BundleFormData = z.infer<typeof bundleSchema>;

export function BundleForm() {
  const { control, register, handleSubmit, watch } = useForm<BundleFormData>({
    resolver: zodResolver(bundleSchema),
    defaultValues: {
      quantity: 1,
      slotType: 'FRIDGE',
      items: [{ name: '', expiryDate: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const quantity = watch('quantity');

  // 수량 변경 시 입력 폼 자동 조정
  useEffect(() => {
    const diff = quantity - fields.length;
    if (diff > 0) {
      for (let i = 0; i < diff; i++) {
        append({ name: '', expiryDate: '' });
      }
    } else if (diff < 0) {
      for (let i = 0; i < Math.abs(diff); i++) {
        remove(fields.length - 1 - i);
      }
    }
  }, [quantity, fields.length]);

  const onSubmit = useMutation({
    mutationFn: ( BundleFormData) => api.bundles.create(data),
    onSuccess: (response) => {
      toast.success('물품이 등록되었습니다.');
      router.push(`/bundles/${response.bundleId}/sticker`);
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit.mutate)}>
      <div className="space-y-4">
        {/* 수량 입력 */}
        <div>
          <label>수량</label>
          <input type="number" {...register('quantity', { valueAsNumber: true })} />
        </div>

        {/* 대표 정보 */}
        <div>
          <label>대표이름</label>
          <input {...register('representativeName')} />
        </div>
        <div>
          <label>대표메모 (선택)</label>
          <textarea {...register('representativeMemo')} />
        </div>

        {/* 개별 품목 */}
        {fields.map((field, index) => (
          <div key={field.id} className="border p-4 rounded">
            <h3>품목 {index + 1}</h3>
            <input 
              {...register(`items.${index}.name`)} 
              placeholder="품목명"
            />
            <input 
              type="date"
              {...register(`items.${index}.expiryDate`)}
            />
          </div>
        ))}

        <button type="submit">등록</button>
      </div>
    </form>
  );
}
```

#### 6.2.2 InspectionPage (검사 화면)

```tsx
import { useEffect, useState } from 'react';
import { useSSE } from '@/hooks/useSSE';

export function InspectionPage() {
  const { slotId } = useParams();
  const [session, setSession] = useState<InspectionSession | null>(null);
  const [unmarkedItems, setUnmarkedItems] = useState<Bundle[]>([]);
  const [markedItems, setMarkedItems] = useState<Bundle[]>([]);

  // 검사 세션 시작
  const startMutation = useMutation({
    mutationFn: () => api.inspections.start(slotId),
    onSuccess: (data) => setSession(data),
  });

  // SSE 연결
  const { events } = useSSE(`/api/inspections/stream?slotId=${slotId}`, {
    enabled: !!session,
  });

  // SSE 이벤트 처리
  useEffect(() => {
    if (!events.length) return;

    const latest = events[events.length - 1];
    
    if (latest.event === 'item-marked') {
      const { bundleId } = JSON.parse(latest.data);
      
      // 미검사 → 검사완료 이동
      setUnmarkedItems(prev => prev.filter(b => b.bundleId !== bundleId));
      const marked = unmarkedItems.find(b => b.bundleId === bundleId);
      if (marked) setMarkedItems(prev => [...prev, marked]);
    }
  }, [events]);

  // 조치 처리
  const markMutation = useMutation({
    mutationFn: ( MarkItemDto) => 
      api.inspections.mark(session!.sessionId, data),
  });

  // 최종 제출
  const submitMutation = useMutation({
    mutationFn: () => api.inspections.submit(session!.sessionId),
    onSuccess: () => {
      toast.success('검사가 완료되었습니다.');
      router.push('/inspections/history');
    },
  });

  return (
    <div className="space-y-6">
      {/* 탭 */}
      <Tabs defaultValue="unmarked">
        <TabsList>
          <TabsTrigger value="unmarked">
            미검사 ({unmarkedItems.length})
          </TabsTrigger>
          <TabsTrigger value="marked">
            검사 완료 ({markedItems.length})
          </TabsTrigger>
        </TabsList>

        {/* 미검사 탭 */}
        <TabsContent value="unmarked">
          {unmarkedItems.map(bundle => (
            <BundleCard
              key={bundle.bundleId}
              bundle={bundle}
              onMark={(action) => markMutation.mutate({
                bundleId: bundle.bundleId,
                actionType: action,
              })}
            />
          ))}
        </TabsContent>

        {/* 검사 완료 탭 */}
        <TabsContent value="marked">
          {markedItems.map(bundle => (
            <BundleCard
              key={bundle.bundleId}
              bundle={bundle}
              marked={true}
            />
          ))}
        </TabsContent>
      </Tabs>

      {/* 최종 제출 버튼 */}
      {unmarkedItems.length === 0 && (
        <button
          onClick={() => submitMutation.mutate()}
          disabled={submitMutation.isPending}
        >
          최종 제출
        </button>
      )}
    </div>
  );
}
```

### 6.3 상태 관리 전략

**TanStack Query (서버 상태)**
```typescript
// 물품 목록 조회 (자동 캐싱, 무한 스크롤)
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['bundles', filters],
  queryFn: ({ pageParam = 0 }) => 
    api.bundles.list({ ...filters, page: pageParam }),
  getNextPageParam: (lastPage) => 
    lastPage.pageable.pageNumber + 1 < lastPage.totalPages
      ? lastPage.pageable.pageNumber + 1
      : undefined,
  staleTime: 30000, // 30초
  gcTime: 5 * 60 * 1000, // 5분
});

// 물품 등록 (낙관적 업데이트)
const createMutation = useMutation({
  mutationFn: api.bundles.create,
  onMutate: async (newBundle) => {
    await queryClient.cancelQueries({ queryKey: ['bundles'] });
    const previous = queryClient.getQueryData(['bundles']);
    
    queryClient.setQueryData(['bundles'], (old) => {
      // 낙관적 UI 업데이트
      return {
        ...old,
        pages: [
          { ...old.pages[0], content: [newBundle, ...old.pages[0].content] },
          ...old.pages.slice(1),
        ],
      };
    });
    
    return { previous };
  },
  onError: (err, newBundle, context) => {
    queryClient.setQueryData(['bundles'], context.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['bundles'] });
  },
});
```

**Zustand (클라이언트 상태) - 최소화**
```typescript
// 인증 상태만 전역 관리
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'auth-storage' }
  )
);
```

### 6.4 AI 활용 전략

**AI 도구 활용 비율: 80%**

1. **컴포넌트 생성** (Claude/ChatGPT)
   - 프롬프트: "React + TypeScript + Tailwind로 {요구사항} 컴포넌트 생성해줘"
   - shadcn/ui 컴포넌트 조합
   - 반응형 디자인 자동 적용

2. **폼 유효성 검증** (Zod 스키마)
   - 프롬프트: "다음 API 명세에 맞는 Zod 스키마 생성: {API 문서}"
   - React Hook Form 통합 코드 생성

3. **API 클라이언트**
   - 프롬프트: "TypeScript Axios로 {엔드포인트} API 함수 생성"
   - 타입 안전성 보장 코드 자동 생성

4. **스타일링**
   - 프롬프트: "Tailwind CSS로 {디자인 요구사항} 구현"
   - 다크모드, 반응형 자동 고려

5. **수동 작업 (20%)**
   - AI 생성 코드 통합 및 수정
   - 비즈니스 로직 검증
   - 성능 최적화 (메모이제이션, 코드 스플리팅)

***

## 7. 배포 및 인프라

### 7.1 AWS Lightsail 설정

**인스턴스 스펙**
```yaml
Plan: $20/month
CPU: 2 vCPUs
RAM: 4 GB
Storage: 80 GB SSD
Transfer: 4 TB
OS: Ubuntu 22.04 LTS
```

**포트 구성**
```
22  - SSH (보안 그룹: 개발 PC IP만 허용)
80  - HTTP (HTTPS로 리다이렉트)
443 - HTTPS (Nginx)
5432 - PostgreSQL (외부 접근 차단, 로컬만)
```

### 7.2 Nginx 설정

```nginx
# /etc/nginx/sites-available/dormmate

upstream backend {
    server localhost:8080;
}

# HTTP → HTTPS 리다이렉트
server {
    listen 80;
    server_name dormmate.example.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS 서버
server {
    listen 443 ssl http2;
    server_name dormmate.example.com;

    # SSL 인증서 (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/dormmate.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dormmate.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # 정적 파일 (React 빌드)
    location / {
        root /var/www/dormmate/dist;
        try_files $uri $uri/ /index.html;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }

    # API 프록시
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS
        add_header Access-Control-Allow-Origin "https://dormmate.example.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    # SSE (타임아웃 연장)
    location /api/inspections/stream {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
    limit_req zone=api burst=20 nodelay;

    # 보안 헤더
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

### 7.3 배포 프로세스

**자동화 스크립트 (deploy.sh)**
```bash
#!/bin/bash
set -e

# 변수
APP_DIR="/opt/dormmate"
JAR_FILE="dormmate-0.0.1-SNAPSHOT.jar"
FRONTEND_DIR="/var/www/dormmate"

echo "========== DormMate 배포 시작 =========="

# 1. Git Pull
cd $APP_DIR
git pull origin main

# 2. 백엔드 빌드
echo "백엔드 빌드 중..."
./gradlew clean bootJar
if [ $? -ne 0 ]; then
    echo "백엔드 빌드 실패!"
    exit 1
fi

# 3. 프론트엔드 빌드
echo "프론트엔드 빌드 중..."
cd frontend
npm ci
npm run build
if [ $? -ne 0 ]; then
    echo "프론트엔드 빌드 실패!"
    exit 1
fi

# 4. 정적 파일 배포
echo "정적 파일 배포 중..."
rm -rf $FRONTEND_DIR/dist
cp -r dist $FRONTEND_DIR/

# 5. 백엔드 재시작
echo "백엔드 재시작 중..."
sudo systemctl stop dormmate
cp build/libs/$JAR_FILE /opt/dormmate/app.jar
sudo systemctl start dormmate

# 6. 헬스체크
echo "헬스체크 중..."
sleep 5
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/actuator/health)
if [ "$STATUS" -eq 200 ]; then
    echo "✅ 배포 성공!"
else
    echo "❌ 헬스체크 실패! (HTTP $STATUS)"
    sudo systemctl stop dormmate
    exit 1
fi

echo "========== 배포 완료 =========="
```

**Systemd 서비스 (dormmate.service)**
```ini
[Unit]
Description=DormMate Spring Boot Application
After=network.target postgresql.service

[Service]
Type=simple
User=dormmate
WorkingDirectory=/opt/dormmate
ExecStart=/usr/bin/java -jar \
    -Xms1g -Xmx2g \
    -Dspring.profiles.active=prod \
    /opt/dormmate/app.jar
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

### 7.4 모니터링

**Spring Boot Actuator**
```yaml
# application-prod.yml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
      base-path: /actuator
  endpoint:
    health:
      show-details: when-authorized
  metrics:
    export:
      prometheus:
        enabled: true
```

**헬스체크 엔드포인트**
```
GET /actuator/health

응답 예시:
{
  "status": "UP",
  "components": {
    "db": { "status": "UP" },
    "diskSpace": { "status": "UP", "details": { "free": 50000000000

출처
