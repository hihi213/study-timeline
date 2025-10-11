---
type: 소스
status: inbox
topics:
source_url: "{{SOURCE}}"
author:
creation_date: 2025-10-11
---

## 🚀 전략 대폭 변경: 순수 백엔드 로직 + UI 통합

|Week|핵심 작업|백엔드|UI 통합|완료 기준|
|---|---|---|---|---|
|**1**|인증 + 물품 CRUD|14h|7h|브라우저 물품 관리|
|**2**|물품 UI + 검사 백엔드|14h|7h|검사 API + 물품 UI|
|**3**|검사 UI + 알림|13h|8h|검사 UI + 알림 배치|
|**4**|알림 UI + 확장|13h|8h|묶음 등록 + 2인 검사|

## 📅 Week 1: 인증 + 물품 CRUD 완전 구현 (21h)

### **Block 1: 인증 시스템 완성 (8h)**

**월 (1h)**

- 주간 계획
- DB 스키마 확인 (users, roles, user_roles)
- 기존 UI API 스펙 파악

**화 (5h)** - JWT 인증 구현

- Spring Boot 프로젝트 생성 + DB 연결
- User/Role 엔티티 (JPA)
- JwtTokenProvider 클래스

```java

public String createToken(String username, List<String> roles) 
public boolean validateToken(String token) public String getUsername(String token)
```
- `/auth/login` 엔드포인트
- UserDetailsService 구현

**수 (2h)** - Spring Security 설정

- SecurityFilterChain 구성
- JwtAuthenticationFilter
- CORS 설정

**완료 기준**:  
✅ Postman: 로그인 → JWT 토큰 발급  
✅ Bearer 토큰으로 보호된 엔드포인트 접근

---

### **Block 2: UI 인증 연동 (2h)**

**수 (3h 남은시간 중 2h)**

- 기존 로그인 컴포넌트 API 연결
- JWT localStorage 저장
- axios interceptor 설정
```typescript
    ``axios.interceptors.request.use((config) => {   const token = localStorage.getItem('accessToken');   if (token) {     config.headers.Authorization = `Bearer ${token}`;   }   return config; });``
```
**완료 기준**:  
✅ 브라우저: 로그인 → 토큰 저장 → 새로고침 시 유지

---

## **Block 3: 물품 등록 API (단일) (6h)**

**수 (1h 남은시간) + 토 (5h)**

- ItemGroup/ItemUnit 엔티티 (JPA)
- Compartment 엔티티 (DB에 16개 이미 존재)
- `POST /api/items` 엔드포인트

    ```java
    @PostMapping public ResponseEntity<ItemGroupDto> createItem(   @RequestBody CreateItemRequest request,   @AuthenticationPrincipal User user ) {   // 1. compartmentId로 칸 조회   // 2. label_no 자동 발급 (MAX + 1)   // 3. short_code 자동 생성 (트리거 작동)   // 4. item_groups + item_units INSERT }
```
- 라벨 자동 발급 로직

``` java
    `public Integer getNextFreeLabel(Long compartmentId) {   return itemGroupRepo.findMaxLabelNo(compartmentId)     .map(max -> max + 1)     .orElse(1); }`
```
**완료 기준**:  
✅ Postman: 물품 등록 → DB 확인 (item_groups, item_units)

## **Block 4: 물품 조회/삭제/검색 (5h)**

**일 (5h)**

- `GET /api/items/my` - 내 물품 목록

```java
    SELECT ig.*, iu.name, iu.expiry_date FROM item_groups ig JOIN item_units iu ON iu.group_id = ig.group_id WHERE ig.owner_user_id = ? AND ig.status = 'ACTIVE' ORDER BY ig.created_at DESC`
```
- `GET /api/items/search?code={SNNN}` - 정확 검색

```java
WHERE ig.short_code = ? AND ig.status = 'ACTIVE'
```
- `DELETE /api/items/{id}` - 소프트 삭제

   ``` java

    `UPDATE item_groups  SET status='REMOVED', removed_at=now()  WHERE group_id=?`
```
- Postman Collection 작성

**완료 기준**:  
✅ Postman: 조회/검색/삭제 3개 API 성공

---

## 📅 Week 2: 물품 UI 통합 + 검사 백엔드 (21h)

## **Block 5: 물품 전체 UI 연동 (7h)**

**월 (1h)** - DTO 매칭 확인

- 기존 UI가 기대하는 응답 구조 확인
- ItemResponseDto 작성

    ```java

    `{   "groupId": 1,   "labelNo": 23,   "shortCode": "1023",   "compartmentName": "냉장1",   "name": "계란",   "expiryDate": "2025-11-01",   "createdAt": "2025-10-11T18:00:00Z" }`
```
**화 (5h)** - React Query 연동

- 물품 등록 폼 연동

    ```typescript

    `const createItem = useMutation({   mutationFn: (data) => axios.post('/api/items', data),   onSuccess: () => {     queryClient.invalidateQueries(['items', 'my'])   } })`
```
- 물품 목록 연동

    ```typescript

    `const { data: items } = useQuery({   queryKey: ['items', 'my'],   queryFn: () => axios.get('/api/items/my') })`
```
- 삭제 버튼 연동
- 검색바 연동

**수 (1h)** - 통합 테스트

- 등록 → 목록 갱신 확인
- 검색 → 결과 표시
- 삭제 → 목록에서 사라짐

**완료 기준**:  
✅ 브라우저: 물품 등록 → 목록 표시 → 삭제 작동

---

## **Block 6: 검사 세션 API (1인, 잠금 제거) (9h)**

**수 (4h 남은시간) + 토 (5h)**

- InspectionSession 엔티티 (lock_slot은 있지만 무시)
- `POST /api/inspections/start` 엔드포인트

    ```java

    `@PostMapping("/start") public ResponseEntity<SessionDto> startInspection(   @RequestBody StartRequest request,   @AuthenticationPrincipal User user ) {   // 1. 권한 검증 (층별장 or ADMIN) - 트리거 작동   // 2. 활성 세션 확인 (ended_at IS NULL)   // 3. 세션 생성 (lock_slot=1 고정)   // 4. 해당 칸의 물품 목록 반환 }`
```
- 권한 검증 로직

    ```java

    `// DB 트리거가 이미 체크하지만 명시적 검증 추가 public boolean canInspect(User user, Long compartmentId) {   // floor_head_assignments 또는 ADMIN 역할 확인 }`
```
**일 (4h)** - 검사 조치 API

- InspectionAction 엔티티
- `POST /api/inspections/actions` 엔드포인트

   ``` java

    `{   "sessionId": 1,   "targetKind": "GROUP",   "groupId": 5,   "actionType": "DISPOSE",   "reason": "EXPIRED",   "details": "유통기한 3일 지남" }`
```
- 조치 유효성 검증
    - 세션 활성 상태 확인
    - 대상 물품 존재 확인

**완료 기준**:  
✅ Postman: 검사 시작 → 조치 추가 성공

---

## **Block 7: 검사 제출 API (5h)**

**일 (1h 남은시간) + 다음주 월 (1h) + 화 (3h)**

- `POST /api/inspections/submit` 엔드포인트

    ```java

    `@PostMapping("/submit") public ResponseEntity<Void> submitInspection(   @RequestBody SubmitRequest request ) {   // 1. 세션 종료 (ended_at 설정)   // 2. 조치 통계 집계   // 3. 알림 생성 (다음 블록 연결) }`
```
- 조치 통계 DTO

    ```java

    `{   "warnCount": 2,   "disposeCount": 1,   "affectedUsers": [userId1, userId2] }`
```
**완료 기준**:  
✅ Postman: start → actions → submit 플로우 성공

---

## 📅 Week 3: 검사 UI 통합 + 알림 시스템 (21h)

## **Block 8: 검사 UI 전체 연동 (8h)**

**화 (2h 남은시간) + 수 (5h) + 토 (1h)**

- 칸 선택 화면 API 연동

    ```typescript

    ``const { data: compartments } = useQuery({   queryKey: ['compartments', floorNo],   queryFn: () => axios.get(`/api/compartments?floor=${floorNo}`) })``
```
- 검사 시작 버튼

    ```typescript

    ``const startInspection = useMutation({   mutationFn: (compartmentId) =>      axios.post('/api/inspections/start', { compartmentId }),   onSuccess: (data) => {     // data.items: 해당 칸 물품 목록     navigate(`/inspections/${data.sessionId}`)   } })``
```
- 조치 버튼 (경고/폐기)

    typescript

    `const addAction = useMutation({   mutationFn: (action) =>      axios.post('/api/inspections/actions', action) })`

- 제출 버튼

    typescript

    `const submit = useMutation({   mutationFn: (sessionId) =>      axios.post('/api/inspections/submit', { sessionId }),   onSuccess: () => {     navigate('/inspections/complete')   } })`

**완료 기준**:  
✅ 브라우저: 검사 전체 플로우 실행 가능

---

## **Block 9: 알림 인프라 (9h)**

**토 (4h 남은시간) + 일 (5h)**

- NotificationType/UserNotification 엔티티
- NotificationService 작성

    java

    `public void createNotification(   Long userId,    String typeKey,    JsonNode payload ) {   // 1. 중복 체크 (FRIDGE_EXPIRY_SOON은 1일 1회)   // 2. user_notifications INSERT   // 3. 푸시 전송 (Phase A로 미뤄짐) }`

- `GET /api/notifications/my` 엔드포인트

    java

    `SELECT * FROM user_notifications WHERE user_id = ?  ORDER BY created_at DESC LIMIT 50`

- `PATCH /api/notifications/{id}/read` 엔드포인트

    java

    `UPDATE user_notifications  SET read_at = now()  WHERE notif_id = ? AND user_id = ?`

**완료 기준**:  
✅ Postman: 알림 조회/읽음 처리 성공

---

## **Block 10: 알림 생성 로직 연결 (4h)**

**일 (오후 남은시간 4h)**

- 검사 제출 시 알림 생성

    java

    `// InspectionService.submit() Map<Long, ActionSummary> summaries = // 사용자별 집계 summaries.forEach((userId, summary) -> {   notificationService.createNotification(     userId,     "FRIDGE_INSPECTION_RESULT",     Json.object()       .put("warnings", summary.warnCount)       .put("disposed", summary.disposeCount)   ); });`

- 유통기한 임박 배치

    java

    `@Scheduled(cron = "0 0 9 * * *") public void checkExpiry() {   LocalDate threshold = LocalDate.now().plusDays(5);      List<ItemUnit> expiring = itemUnitRepo    .findByExpiryDateLessThanEqual(threshold);      // 사용자별 묶음   Map<Long, List<ItemUnit>> byUser = expiring.stream()     .collect(Collectors.groupingBy(       item -> item.getGroup().getOwnerUserId()     ));      byUser.forEach((userId, items) -> {     notificationService.createNotification(       userId,       "FRIDGE_EXPIRY_SOON",       Json.array(items.stream().map(/* ... */))     );   }); }`

**완료 기준**:  
✅ 검사 제출 → 알림 DB 생성  
✅ 배치 수동 실행 → 알림 DB 생성

---

## 📅 Week 4: 알림 UI + 확장 기능 + 전체 검증 (21h)

## **Block 11: 알림 UI 연동 (6h)**

**월 (1h) + 화 (5h)**

- 알림 목록 조회

    typescript

    `const { data: notifications } = useQuery({   queryKey: ['notifications'],   queryFn: () => axios.get('/api/notifications/my'),   refetchInterval: 30000 // 30초마다 폴링 })`

- 읽음 처리

    typescript

    ``const markAsRead = useMutation({   mutationFn: (notifId) =>      axios.patch(`/api/notifications/${notifId}/read`),   onSuccess: () => {     queryClient.invalidateQueries(['notifications'])   } })``

- 미읽음 카운트 뱃지

    typescript

    `const unreadCount = notifications?.filter(n => !n.readAt).length`

**완료 기준**:  
✅ 브라우저: 알림 표시 → 클릭 시 읽음 처리

---

## **Block 12: 확장 기능 (묶음 등록) (8h)**

**수 (5h) + 토 (3h)**

> **DB가 이미 item_units을 지원하므로 빠르게 구현 가능**

- 묶음 등록 API 확장

    java

    `@PostMapping public ResponseEntity<ItemGroupDto> createItemGroup(   @RequestBody CreateGroupRequest request ) {   // 1. item_groups INSERT (1개)   // 2. item_units INSERT (N개)   //    각 unit의 name, expiry_date 개별 설정 }`

- UI 수량 증가 버튼 연동

    typescript

    `const [quantity, setQuantity] = useState(1); const [items, setItems] = useState([   { name: '', expiryDate: '' } ]); // quantity 증가 시 items 배열 확장 useEffect(() => {   setItems(Array(quantity).fill({}).map((_, i) =>      items[i] || { name: groupName, expiryDate: groupExpiry }   )); }, [quantity]);`

- 세부 수정 모달
    - 각 item의 name, expiryDate 개별 수정

**완료 기준**:  
✅ 브라우저: 수량 3개 입력 → 3개 item_units 생성

---

## **Block 13: 2인 동시 검사 (5h)**

**토 (2h 남은시간) + 일 (3h)**

> **DB lock_slot이 이미 있으므로 로직만 추가**

- 검사 시작 시 슬롯 할당

    java

    `// 빈 슬롯 찾기 (1 또는 2) Integer freeSlot = inspectionRepo  .findFreeSlot(compartmentId) // WHERE ended_at IS NULL   .orElseThrow(() -> new NoSlotException()); session.setLockSlot(freeSlot);`

- UI 검사자 표시

    typescript

    ``const { data: activeSessions } = useQuery({   queryKey: ['inspections', 'active', compartmentId],   queryFn: () =>      axios.get(`/api/inspections/active?compartmentId=${id}`) }); // 최대 2명 표시 {activeSessions.map(s => (   <Badge>{s.inspectorName} 검사 중</Badge> ))}``

**완료 기준**:  
✅ 브라우저: 동일 칸에서 2명 동시 검사 가능

---

## **Block 14: 전체 E2E 테스트 (2h)**

**일 (2h 남은시간)**

- **시나리오 1**: 물품 관리 전체
- **시나리오 2**: 검사 플로우 (2명 동시)
- **시나리오 3**: 알림 생성/표시
- **시나리오 4**: 묶음 등록

**완료 기준**:  
✅ 4가지 시나리오 모두 브라우저에서 성공

---

## 🚀 Week 5-6: 배포 + 문서화 (42h)

## **Week 5: 배포 (21h)**

**월 (1h)** - 배포 체크리스트

**화-수 (10h)** - Docker + Lightsail

- 멀티 스테이지 Dockerfile

    text

    `FROM gradle:8.5-jdk21 AS build COPY . /app RUN gradle clean build -x test FROM eclipse-temurin:21-jre COPY --from=build /app/build/libs/*.jar app.jar ENTRYPOINT ["java", "-jar", "app.jar"]`

- docker-compose.yml (Spring + PostgreSQL)
- Lightsail 인스턴스 생성 (2GB RAM)
- 환경변수 설정 (`application-prod.yml`)

**토-일 (10h)** - Nginx + HTTPS

- 리버스 프록시

    text

    `location /api {   proxy_pass http://localhost:8080;  proxy_set_header Host $host; }`

- Certbot HTTPS
- CORS 프로덕션 설정

    java

    `@CrossOrigin(origins = "https://dormmate.com")`

---

## **Week 6: 문서화 (21h)**

**월 (1h)** - 문서 구조 설계

**화-수 (10h)** - README + API 문서

- 프로젝트 소개 (문제 정의, 해결 방안)
- 기술 스택 (선택 이유)
- ERD 다이어그램 (DBeaver 생성)
- 실행 방법 (Docker Compose 원스텝)
- API 엔드포인트 12개 목록

**토-일 (10h)** - 데모 영상 + 최종 검증

- 화면 녹화 (3-5분)
    - 로그인 → 물품 등록(묶음) → 검사(2명) → 알림
- GitHub Actions (선택)
- 최종 배포 검증

---

## 🎯 DB 완성의 장점 활용

## **1. 트리거 활용**

java

`// short_code는 자동 생성 (트리거) ItemGroup group = itemGroupRepo.save(newGroup); // group.getShortCode() 이미 채워져 있음`

## **2. 제약조건 신뢰**

java

`// 부분 인덱스가 중복 방지 // 애플리케이션은 단순 INSERT만 try {   itemGroupRepo.save(group); } catch (DataIntegrityViolationException e) {   throw new LabelAlreadyUsedException(); }`

## **3. 권한 검증 위임**

java

`// trg_inspection_auth 트리거가 체크 // 실패 시 PostgreSQL 예외 발생 try {   inspectionRepo.save(session); } catch (SQLException e) {   throw new UnauthorizedException(); }`

---
