---
type: 소스
status: inbox
topics:
source_url: "{{SOURCE}}"
author:
creation_date: 2025-10-11
---

## 🎯 핵심 보완 사항 요약

1. **리프레시 토큰 회전** - Week 1 포함 (+3h)
2. **라벨 발급 레이스 방지** - 어드바이저리 락 적용
3. **배치 타임존 고정** - Asia/Seoul 명시
4. **2인 검사 슬롯 자동 배정** - Week 2로 앞당김 (+1h)
5. **보안 기본값** - BCrypt, CORS, RFC7807
6. **품질 게이트** - 블록별 합격 기준

***

## 📅 Week 1: 인증 (리프레시 포함) + 물품 CRUD (21h)

### **Block 1: JWT + 리프레시 토큰 회전 (11h)** ⚡

**월 (1h)**
- 주간 계획
- DB 스키마 확인 (`refresh_tokens` 테이블 존재)
- 토큰 전략 설계
  - Access: 15분 (짧음)
  - Refresh: 7일 (길음)

**화 (5h)** - 토큰 발급 & 저장
- JwtTokenProvider 확장
  ```java
  // 힌트: createAccessToken(username, roles, duration)
  // 힌트: createRefreshToken(userId) - UUID 생성 후 SHA-256 해시
  ```
- RefreshToken 엔티티 작성
  - `user_id`, `token_hash`, `expires_at`, `device_id` (nullable)
- `/auth/login` 엔드포인트
  ```java
  // 힌트: 1. username/password 검증
  //       2. access + refresh 동시 발급
  //       3. refresh_tokens 테이블 INSERT
  //       4. 응답: { accessToken, refreshToken, expiresIn }
  ```

**수 (5h)** - 토큰 회전 & 로그아웃
- `/auth/refresh` 엔드포인트
  ```java
  // 힌트: 1. refresh 토큰 해시 후 DB 조회
  //       2. expires_at, revoked_at 검증
  //       3. **기존 토큰 즉시 폐기** (revoked_at = now())
  //       4. 신규 access + refresh 발급 & DB INSERT
  //       5. 실패 시 401 Unauthorized
  ```
- `/auth/logout` 엔드포인트
  ```java
  // 힌트: 1. 요청 헤더의 refresh 토큰 파싱
  //       2. 해당 토큰 revoked_at 설정
  //       3. 클라이언트에서 localStorage 삭제 권장
  ```

**토 (0h)** - 물품 작업으로 이동

**품질 게이트** ✅:
```bash
# 시나리오 1: 정상 갱신
POST /auth/login → access(A1), refresh(R1)
15분 대기 후
POST /auth/refresh (R1) → access(A2), refresh(R2)
GET /api/items/my (A2) → 200 OK

# 시나리오 2: 폐기된 토큰 거부
POST /auth/refresh (R1 재사용) → 401 Unauthorized
```

***

### **Block 2: UI 인증 연동 (2h)**

**토 (2h)**
- axios interceptor 수정
  ```typescript
  // 힌트: 401 응답 시 자동으로 /auth/refresh 호출
  // 힌트: 실패 시 로그인 화면으로 리다이렉트
  // 힌트: localStorage에 refreshToken도 저장
  ```

**완료 기준**:
✅ Access 만료 → 자동 갱신 → API 재시도 성공

***

### **Block 3: 물품 등록 (레이스 방지) (6h)**

**토 (3h 남은시간) + 일 (3h)**
- ItemGroup/Compartment 엔티티
- `POST /api/items` 엔드포인트 - **어드바이저리 락 적용**
  ```java
  // 힌트: @Transactional 필수
  // 힌트: 1. SELECT pg_advisory_xact_lock(:compartmentId)
  //          - Native Query 또는 JdbcTemplate
  //       2. 안전하게 MAX(label_no) + 1 조회
  //       3. item_groups + item_units INSERT
  //       4. 트랜잭션 커밋 시 락 자동 해제
  ```
- 대안: 유니크 충돌 재시도
  ```java
  // 힌트: for (int retry=0; retry<3; retry++) {
  //         try { INSERT; break; }
  //         catch (DataIntegrityViolationException) {
  //           if (retry==2) throw new LabelConflictException();
  //           label_no += random(1,5); // 랜덤 오프셋
  //         }
  //       }
  ```

**품질 게이트** ✅:
```bash
# JMeter 동시 요청 10건
POST /api/items (compartmentId=1) × 10 동시
→ 응답: 9~10건 성공 (201 Created)
→ DB 확인: label_no 1~10 연속, 중복 0건
```

***

### **Block 4: 물품 조회/삭제/검색 (2h)**

**일 (2h 남은시간)**
- `GET /api/items/my`
- `GET /api/items/search?code={SNNN}`
- `DELETE /api/items/{id}` - 소프트 삭제

**완료 기준**:
✅ Postman 3개 API 성공

***

## 📅 Week 2: 물품 UI + 검사 (2인 슬롯) + 배치 골격 (21h)

### **Block 5: 물품 전체 UI 연동 (7h)**

**월 (1h) + 화 (5h) + 수 (1h)**
- DTO 매칭 확인
- React Query 연동 (등록/목록/삭제/검색)
- 에러 핸들링
  ```typescript
  // 힌트: 409 Conflict → "이미 사용 중인 번호입니다"
  //       403 Forbidden → "권한이 없습니다"
  //       422 Unprocessable → "잘못된 상태 전이"
  ```

**완료 기준**:
✅ 브라우저: 물품 등록 → 목록 표시

***

### **Block 6: 검사 세션 (2인 슬롯 자동 배정) (10h)** ⚡

**수 (4h 남은시간) + 토 (5h) + 일 (1h)**
- InspectionSession 엔티티
- `POST /api/inspections/start` - **빈 슬롯 자동 할당**
  ```java
  // 힌트: 1. 권한 검증 (층별장 or ADMIN)
  //       2. SELECT lock_slot FROM inspection_sessions
  //          WHERE compartment_id=? AND ended_at IS NULL
  //       3. 빈 슬롯 찾기 (1 또는 2)
  //          - 결과 0건 → slot=1
  //          - 1만 사용 중 → slot=2
  //          - 1,2 모두 사용 중 → 409 Conflict
  //       4. INSERT (lock_slot=빈슬롯)
  //       5. 해당 칸 물품 목록 반환
  ```
- 권한 검증 로직
  ```java
  // 힌트: DB 트리거 + 애플리케이션 명시적 체크 병행
  //       - floor_head_assignments 조회 (revoked_at IS NULL)
  //       - user_roles에서 ADMIN/ADMIN_ROOT 확인
  ```

**품질 게이트** ✅:
```bash
# 동시 시작 테스트
POST /api/inspections/start (compartmentId=1, userA) → 201, slot=1
POST /api/inspections/start (compartmentId=1, userB) → 201, slot=2
POST /api/inspections/start (compartmentId=1, userC) → 409 Conflict

# DB 확인
SELECT lock_slot FROM inspection_sessions 
WHERE compartment_id=1 AND ended_at IS NULL
→ 결과: 2행 (slot=1, slot=2)
```

***

### **Block 7: 검사 조치 & 제출 (4h)**

**일 (3h 남은시간) + 다음주 월 (1h)**
- `POST /api/inspections/actions`
- `POST /api/inspections/submit`
  ```java
  // 힌트: 1. ended_at 설정
  //       2. 조치 통계 집계 (GROUP BY owner_user_id)
  //       3. 알림 생성 (다음 블록 연결)
  ```

**완료 기준**:
✅ Postman: start → actions → submit 성공

***

## 📅 Week 3: 검사 UI + 알림 시스템 (21h)

### **Block 8: 검사 UI 전체 연동 (8h)**

**월 (오후, 회고 제외) + 화 (5h) + 수 (3h)**
- 칸 선택 → 검사 시작
- 조치 버튼 (경고/폐기)
- 제출 버튼
- 활성 검사자 표시
  ```typescript
  // 힌트: GET /api/inspections/active?compartmentId=X
  //       → [{ inspectorName: "홍길동", slot: 1 }, ...]
  //       → 뱃지 2개 표시
  ```

**완료 기준**:
✅ 브라우저: 검사 전체 플로우 + 2인 동시 확인

***

### **Block 9: 알림 인프라 (9h)**

**수 (2h 남은시간) + 토 (5h) + 일 (2h)**
- NotificationType/UserNotification 엔티티
- NotificationService
  ```java
  // 힌트: createNotification(userId, typeKey, payload)
  //       - 중복 체크 (FRIDGE_EXPIRY_SOON은 created_on 유니크)
  //       - INSERT 실패 시 조용히 무시 (이미 존재)
  ```
- `GET /api/notifications/my`
- `PATCH /api/notifications/{id}/read`

**품질 게이트** ✅:
```bash
# 중복 방지 테스트
POST /notifications (userId=1, typeKey='FRIDGE_EXPIRY_SOON', today)
POST /notifications (userId=1, typeKey='FRIDGE_EXPIRY_SOON', today)
→ 2번째 요청은 유니크 제약 위반으로 실패
→ DB: 1건만 존재
```

***

### **Block 10: 알림 생성 로직 + 배치 (4h)**

**일 (3h 남은시간) + 다음주 화 (1h)**
- 검사 제출 시 알림 생성
  ```java
  // 힌트: inspectionService.submit() 내부에서
  //       notificationService.createNotification(...) 호출
  ```
- 유통기한 임박 배치 - **타임존 고정**
  ```java
  // application.yml
  // spring.task.scheduling.time-zone: Asia/Seoul
  
  @Scheduled(cron = "0 0 9 * * *", zone = "Asia/Seoul")
  public void checkExpiry() {
    LocalDate threshold = LocalDate.now().plusDays(5);
    // 힌트: 1. item_units에서 expiry_date <= threshold 조회
    //       2. GROUP BY owner_user_id
    //       3. 각 사용자에게 알림 생성
  }
  ```

**품질 게이트** ✅:
```bash
# 배치 타임존 확인
1. 서버 시간을 UTC+0으로 설정
2. 애플리케이션 실행
3. 로그 확인: "Scheduled task executed at 09:00 KST (00:00 UTC)"
   → 실제로는 UTC 00:00이 아닌 KST 09:00에 실행되어야 함
```

***

## 📅 Week 4: 알림 UI + 묶음 등록 + 검증 (21h)

### **Block 11: 알림 UI 연동 (6h)**

**화 (4h 남은시간) + 수 (2h)**
- 알림 목록 조회 (30초 폴링)
- 읽음 처리
- 미읽음 카운트 뱃지

**완료 기준**:
✅ 브라우저: 알림 표시 → 클릭 시 읽음

***

### **Block 12: 묶음 등록 확장 (8h)**

**수 (3h 남은시간) + 토 (5h)**
- `POST /api/items` 확장 - 묶음 지원
  ```java
  // 힌트: 1. item_groups INSERT (1건)
  //       2. item_units INSERT (N건)
  //       3. 트랜잭션 내에서 어드바이저리 락 유지
  ```
- UI 수량 증가 → items 배열 확장
- 세부 수정 모달

**완료 기준**:
✅ 브라우저: 수량 3 → 3개 item_units 생성

***

### **Block 13: 전체 E2E 검증 (7h)**

**일 (5h) + 다음주 월 (2h - 배포 주 시작)**
- **시나리오 1**: 토큰 갱신
  - 로그인 → 15분 대기 → API 호출 → 자동 갱신 확인
- **시나리오 2**: 라벨 충돌
  - 동시 요청 10건 → 성공률 확인
- **시나리오 3**: 2인 검사
  - 동일 칸에서 2명 시작 → 3번째 거부
- **시나리오 4**: 알림 중복 방지
  - 동일 날짜 2회 생성 시도 → 1건만 저장
- **시나리오 5**: 배치 타임존
  - 수동 트리거 → 로그 시간 확인

**완료 기준**:
✅ 5가지 품질 게이트 모두 통과

***

## 🚀 Week 5-6: 배포 + 문서화 (42h)

### **Week 5: 배포 (21h)**

**월 (오후) + 화-수 (10h)** - Docker + Lightsail
- 멀티 스테이지 Dockerfile
- docker-compose.yml
  ```yaml
  # 힌트: environment:
  #         SPRING_PROFILES_ACTIVE: prod
  #         TZ: Asia/Seoul  # 컨테이너 타임존
  ```
- Lightsail 배포
- 환경변수 설정 (`JWT_SECRET`, `DB_PASSWORD`)

**토-일 (10h)** - Nginx + HTTPS
- 리버스 프록시
- Certbot (Let's Encrypt)
- **CORS 화이트리스트**
  ```java
  // 힌트: @CrossOrigin(origins = "https://dormmate.com")
  //       allowedMethods: GET, POST, PATCH, DELETE
  //       allowCredentials: true
  ```
- **HTTPS 강제**
  ```nginx
  # 힌트: if ($scheme != "https") { return 301 https://$host$request_uri; }
  ```

***

### **Week 6: 문서화 (21h)**

**월 (1h) + 화-수 (10h)** - README + API 문서
- 프로젝트 소개
- 기술 스택 선택 근거
  - "리프레시 토큰 회전으로 보안 강화"
  - "어드바이저리 락으로 라벨 충돌 방지"
  - "타임존 고정으로 배치 일관성 확보"
- ERD 다이어그램
- API 엔드포인트 15개
  ```markdown
  # 힌트: | Method | Path | Auth | Description | Error |
  #       | POST | /auth/login | - | 로그인 | 401, 422 |
  #       | POST | /auth/refresh | - | 토큰 갱신 | 401 |
  ```

**토-일 (10h)** - 데모 영상
- OBS Studio 화면 녹화 (3-5분)
  1. 로그인 → 토큰 확인 (개발자 도구)
  2. 묶음 등록 (수량 3)
  3. 2명 동시 검사 (뱃지 표시)
  4. 알림 수신 → 읽음 처리
- GitHub Actions CI/CD (선택)

***

## 🔐 보안 기본값 체크리스트

### **Week 1 적용**
- [x] 비밀번호 BCrypt (Spring Security 기본)
  ```java
  // 힌트: PasswordEncoder passwordEncoder() {
  //         return new BCryptPasswordEncoder();
  //       }
  ```
- [x] JWT 시크릿 환경변수 (`JWT_SECRET`)
  ```yaml
  # 힌트: jwt.secret: ${JWT_SECRET:default-only-for-dev}
  ```

### **Week 5 배포 시 적용**
- [x] CORS 화이트리스트
- [x] HTTPS 강제 리다이렉트
- [x] RFC7807 에러 응답
  ```java
  // 힌트: @ControllerAdvice
  //       @ExceptionHandler(LabelConflictException.class)
  //       return ProblemDetail.forStatusAndDetail(
  //         HttpStatus.CONFLICT, "Label already in use"
  //       );
  ```

***

## 📊 품질 게이트 요약표

| 블록 | 검증 항목 | 합격 기준 | 실패 시 조치 |
|------|----------|----------|------------|
| **Auth** | 토큰 갱신 | 만료 후 /refresh로 200 | interceptor 로직 수정 |
| **Auth** | 폐기 토큰 거부 | 재사용 시 401 | DB 조회 로직 확인 |
| **Items** | 라벨 충돌 | 10건 → 9~10건 성공 | 어드바이저리 락 추가 |
| **Items** | 데이터 무결성 | label_no 중복 0건 | 트랜잭션 경계 수정 |
| **Inspections** | 동시 슬롯 | 3번째 요청 409 | 슬롯 조회 쿼리 수정 |
| **Inspections** | 활성 세션 | 최대 2개만 | 부분 인덱스 확인 |
| **Notifications** | 중복 방지 | 동일 날짜 1건만 | 유니크 인덱스 확인 |
| **Batch** | 타임존 | 09:00 KST 실행 | spring.task.scheduling.time-zone 설정 |

***

## 💡 핵심 힌트 (구현 방향성)

### **1. 어드바이저리 락 패턴**
```java
// 힌트: 
// 1. @Transactional 메서드 시작 시
// 2. entityManager.createNativeQuery(
//      "SELECT pg_advisory_xact_lock(:lock_key)")
//      .setParameter("lock_key", compartmentId)
//      .getSingleResult();
// 3. 이후 MAX+1 조회 안전
// 4. 트랜잭션 커밋 시 자동 해제
```

### **2. 토큰 회전 플로우**
```
Client → POST /auth/refresh (oldRefresh)
Server → 1. SELECT * WHERE token_hash=hash(oldRefresh) AND revoked_at IS NULL
         2. UPDATE revoked_at=now() WHERE token_id=X
         3. INSERT new refresh
         4. Return { newAccess, newRefresh }
Client → 저장 후 즉시 사용
```

### **3. 슬롯 할당 알고리즘**
```java
// 힌트: List<Integer> usedSlots = repo.findActiveSlots(compartmentId);
//       if (usedSlots.isEmpty()) return 1;
//       if (usedSlots.size() == 1) return usedSlots.contains(1) ? 2 : 1;
//       throw new NoSlotAvailableException(); // 409
```

### **4. RFC7807 에러 응답**
```java
// 힌트: ProblemDetail problem = ProblemDetail.forStatus(409);
//       problem.setTitle("Label Conflict");
//       problem.setDetail("Label 23 already in use in compartment 1");
//       problem.setProperty("compartmentId", 1);
//       problem.setProperty("labelNo", 23);
//       return ResponseEntity.of(problem).build();
```

***

## ⏱️ 시간 조정 반영

| 변경 사항 | 추가 시간 | 흡수 방법 |
|----------|----------|----------|
| 리프레시 토큰 회전 | +3h | Week 1 Block 1 확장 (8h → 11h) |
| 2인 슬롯 자동 배정 | +1h | Week 2 Block 6 확장 (9h → 10h) |
| 배치 골격 선반영 | +0h | Week 3 Block 10에서 자연스럽게 구현 |

**총 시간**: 여전히 **84시간 (4주 × 21h)** 내 흡수 가능

***

**최종 권장사항**:

보완된 로드맵은 **보안, 동시성, 운영 안정성**을 고려한 프로덕션급 구현입니다.

특히 **품질 게이트**를 각 블록에서 즉시 검증하면, Week 5 배포 시 **예상치 못한 이슈를 최소화**할 수 있습니다.

힌트를 기반으로 직접 구현하면서, 막히는 부분은 **PostgreSQL 공식 문서**(어드바이저리 락), **Spring Security 레퍼런스**(토큰 회전), **RFC7807 스펙**(에러 응답)을 참고하세요.
