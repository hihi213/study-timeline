

---

# **✅ 1-1. 기관 및 관리자 생성 – 흐름 요약**

---

## **🧭 1-1.1 신청 기반 관리자 생성 (MVP 기준)**

```
[관리자 신청자]
   ↓
[신청 페이지 접근] → /admin/request
   ↓
[정보 입력]
   - 기관명
   - 이메일
   - 사용 목적
   ↓
[DB에 신청 저장]
   - admin_requests 테이블에 status = 'PENDING'으로 기록됨
```

```
[운영자 또는 슈퍼관리자]
   ↓
[신청 목록 확인]
   - 상태별: PENDING / APPROVED / REJECTED
   ↓
[신청 승인 or 거절]
   - 승인 시 users, institutions 테이블에 반영
   - 거절 시 상태만 변경
```

```
[신청자]
   ↓
[결과 확인]
   - 로그인 가능 or 승인 대기/거절 알림 확인
```

---

## **📁 관련 테이블**

|**테이블**|**용도**|
|---|---|
|admin_requests|신청 정보 저장 및 상태 관리 (PENDING / APPROVED / REJECTED)|
|users|승인된 관리자 계정으로 등록|
|institutions|새로운 기관 정보 등록|

---

## **🔐 예외 및 보안 고려사항 (MVP 기준)**

|**상황**|**처리 방식**|
|---|---|
|중복 신청|이메일 + 기관명 기준 중복 방지|
|승인 누락|운영자 이메일 알림 or 대시보드 우선 표시|
|악성 신청|CAPTCHA 도입은 MVP 이후, 현재는 수동 심사로 대응|

---

## **🔮 1-1.2 향후 확장 흐름 (계획)**

  

### **① 기관 이메일 기반 자동 제한**

```
[이메일 입력] → "관리자 신청은 @dorm.univ.ac.kr 도메인만 허용됩니다"
   ↓
[이메일 인증 링크 전송]
   ↓
[인증 성공 시 admin_requests 저장]
```

### **② 초대 기반 관리자 생성**

```
[기존 관리자]
   ↓
[초대 링크 생성] → /admin/invite?token=xxx
   ↓
[초대받은 관리자]
   - 링크 클릭 → 가입 폼 작성 → 자동 승인 처리
```


##  1-2. 관리자 초기 설정 – 흐름 요약 (반복 예약 차단 기능 포함)**

---

## **🧭 1. 공간 등록**

```
[관리자 로그인]
   ↓
[공간 이름 입력]
   - 평면 구조 (예: 1동 3층)
   - DB는 계층 확장 대비 → parent_location_id = NULL
```

---

## **🧭 2. 기기 등록**

```
[공간 선택]
   ↓
[기기 정보 입력]
   - 기기명, device_type (세탁기/건조기)
   - serial_number (선택)
   - is_active = true (기본값)
   - NFC/QR 태그 (nullable) → "나중에 등록" UX 포함
   - status = AVAILABLE 고정
```

---

## **🧭 3. 예약 불가 시간 등록 (점검/유지보수 등)**

  

### **✅ 단일 시간 등록**

```
[기기 선택]
   ↓
[예약 불가 시간 등록]
   - start_time ~ end_time
   - 중복 시간, 역순 시간 검증
```

### **✅ 반복 시간 등록 (MVP 포함 결정됨)**

```
[기기 선택]
   ↓
[반복 예약 불가 등록]
   - 요일 선택 (MON~SUN)
   - 반복 시간 입력 (ex: 매주 화요일 13:00~15:00)
   - 여러 요일 등록 가능
```

→ 별도 테이블: devices_maintenance_repeat

```
CREATE TABLE devices_maintenance_repeat (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id INT NOT NULL,
    weekday ENUM('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## **🧭 4. 상태 수동 변경 (선택)**

```
[기기 상세 → 상태 변경]
   ↓
[FAULT, OUT_OF_SERVICE 등 수동 지정]
   - 변경 기록은 device_status_logs에 저장 예정
```

---

## **🔒 예외 대응 포함 요약**

|**예외 상황**|**대응 방식**|
|---|---|
|겹치는 유지보수 시간|서버 단에서 중복 차단|
|잘못된 시간대 입력|start_time < end_time 조건 강제|
|반복 등록에서 요일 누락|클라이언트에서 입력 유도 (반복 필수는 아님)|

---

✅ 이 흐름 기준으로 전체 설계서와 API 정의서를 정리해도 완벽한 상태야.

이제 다음 흐름인 **1-3. 사용자 등록/초대 흐름 점검**으로 이어가자. 준비되면 “1-3 점검하자”라고 말해줘!