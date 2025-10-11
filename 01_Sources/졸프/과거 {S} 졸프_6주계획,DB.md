---
type: 소스
status: inbox
topics:
source_url: "{{SOURCE}}"
author:
creation_date: 2025-10-07
---
## 6주 배포 MVP

- 포함: 냉장고 전 흐름, DB-락, SSE, 벌점, 최소 관리자, 배포.
- 제외: **Web Push**, Redis 분산락, TRGM인덱스, 고급 대시보드.
- 컷리스트: Week4 통계 위젯→텍스트 수치. D-1 스케줄러→앱 진입 시 계산.

### **Week 1: 기반**

- 목표: 프로젝트·보안·DDL 골격 확정.
- 과업
    - Spring Boot 3(Java 21), Gradle, 멀티 프로필(dev/prod).
    - Flyway 적용 + **Fix Pack** 마이그(역할명 정합, resource_locks TTL=5m, event_log.actor_user_id/reason).
    - Security + JWT + RBAC(ADMIN_ROOT/ADMIN/INSPECTOR/RESIDENT).
    - CI 기초: 빌드·이미지 생성까지만.
	- 운영 규칙 확정: 세션 생성 전 resource 락 선취 → 동일 세션에 2인 참가(좌석 1,2).
	- 제출/정정 시 GUC(app.user_id, app.change_reason) 세팅 필수 → event_log에 모두 적재.
	- 라벨 충돌 409 수신 시 next_free_label(resource_id)로 재시도 → event_log{action:auto_relabel,from,to}
- 게이트: 로그인 샘플 200/403, Flyway clean→migrate 무오류.

### **Week 2: 냉장고 등록·조회**

- 목표: 입주자 핵심 흐름 확보.
- 과업
    - 모델: **resources(FRIDGE_COMP)**, **item_groups**만. SNNN= resource_id+label_no 런타임 생성.
    - API: 내 물품 등록(단일/묶음), 내 목록/상세, D-1 임박 조회.
    - 유일성: 활성 상태 (resource_id,label_no) 부분 UNIQUE.
    - event_log 적재(actor, reason 포함).
- 게이트: “등록→목록→상세” e2e, 100건 로컬 P95<150ms.

### **Week 3: 점검·리비전·벌점**

- 목표: 층별장 업무 플로우 완성.
- 과업
    - 점검 세션/참여/결과 + 리비전 트리거(사유 필수).
    - **DB 논리 락**: resource_locks + TTL 5분. 동시 2인 세션 제약.
    - 벌점: penalties_original/adjustments + 합산 뷰.
- 게이트: 제출 후 수정 시 사유 미제공 422, 리비전 버전 증가 확인.

### **Week 4: 실시간(SSE)·UX 최소**

- 목표: 포그라운드 실시간 반영.
- 과업
    - **SSE** /events(heartbeat, Last-Event-ID). 폴백 /event-log?sinceId=.
    - 알림 UX: 포그라운드 배너(Notifications API). 딥링크 라우팅.
    - 마이페이지 요약: 이벤트 타임라인, 벌점 합계.
- 게이트: 탭 2개 동시 갱신, 네트워크 단절 후 자동 재접속.

### **Week 5: 관리자·안정화**

- 목표: 운영 최소 세트.
- 과업
    - 관리자 API: FRIDGE_COMP CRUD, 상태 변경, floor_code 세팅.
    - 전역 예외·검증 보강, 통합 시나리오 테스트.
- 게이트: 시나리오 100% 통과, 크리티컬 0.

### **Week 6: 배포·모니터링**

- 목표: 인터넷 공개·관측.
- 과업
    - Docker Compose(앱+DB), Nginx TLS, 도메인 연결.
    - GitHub Actions **CD**(main push→배포).
    - Actuator 기본 메트릭, 간이 대시.
- 게이트: 스테이징 URL 데모 무중단, 롤백 절차 검증.

---

## **📈 MVP 이후 확장 로드맵**

### **Phase A: Web Push 파이프라인**

- Service Worker + VAPID. push_subscriptions, due_tasks 워커(백오프/중복억제). D-1·점검결과 **묶음 푸시**.

### **Phase B: 시설 확장**

- 세탁실: WASHER/DRYER 타입, 상태 전이, 종료 알림(SSE/푸시).
- 다목적실: 예약 테이블(+ EXCLUDE 검토), 주간 오픈 스케줄러, 노쇼 신고.
- 도서관: 검색(TRGM 선택), 대출/반납/연장/예약(대기열 1), 연체 벌점 자동.

### **Phase C: 운영 고도화**

- Prometheus/Grafana, Sentry.
- 인덱스 CONCURRENTLY 보강, TRGM 시점 도입.
- 이벤트 보관 정책, 파티셔닝/아카이빙 검토.

---

## **리스크·대응**

- JWT/CORS 삽질 → Week1 예제 컨트롤러로 조기 검증.
- 락 경합 → 단위 테스트 + 세션 종료/TTL 만료 케이스 포함.
- 배포 실패 → GitHub Actions 수동 재배포 Job, 롤백 스크립트 상시 준비.

