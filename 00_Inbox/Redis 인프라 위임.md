---
type: 생각조각
status: inbox
source:
creation_date: 2025-12-28
---
**[TO-BE] Redis 인프라 위임 (Spring Boot/Java Pseudo Code)**

```Java
// RedisTemplate을 주입받아 사용한다고 가정
public Set<String> getNoShowUsers(String eventId) {
    String allUsersKey = "event:" + eventId + ":registered"; // 참가자 전체 (Set)
    String enteredUsersKey = "event:" + eventId + ":entered"; // 입장한 사람 (Set)

    // 핵심 로직: 내 코드의 복잡한 for문/if문이 이 한 줄로 끝납니다.
    // SDIFF: 첫 번째 Set에는 있고, 두 번째 Set에는 없는 멤버를 반환 (차집합)
    return redisTemplate.opsForSet().difference(allUsersKey, enteredUsersKey);
}
```

- **Redis 명령어 매핑:**
    - 참가자 등록: `SADD event:100:registered "user_uuid_1"`
    - 입장 처리: `SADD event:100:entered "user_uuid_1"`
    - **미완주자 조회:** `SDIFF event:100:registered event:100:entered`
## **Redis 노쇼 확인 로직 핵심 요약**

### **1. 핵심 정의**

이 코드는 Java가 직접 데이터를 뒤지는 것이 아니라, **"ID(주소)를 줄 테니, 창고(Redis)에 저장된 데이터들끼리 직접 비교해서 결과만 나에게 보내라"**고 명령하는 과정입니다.

### **2. Redis의 기본 원리 (고성능 창고)**

- **RAM 저장:** 보통의 데이터베이스(MySQL 등)는 하드디스크에 저장하지만, **Redis는 컴퓨터의 메모리(RAM)에 직접 데이터를 저장**합니다. 그래서 엄청나게 빠릅니다.
- **Key-Value 구조:**
    - **Key (이름표):** 데이터를 찾기 위한 고유 주소 (예: `event:101:registered`)
    - **Value (내용물):** 그 주소 안에 들어있는 실제 데이터 뭉치

### **3. `eventId`의 역할과 데이터 구조**

`eventId`는 데이터 자체가 아니라, **데이터가 저장된 위치를 찾아가기 위한 '지도 상의 구역 번호'**입니다.

- **KEY 생성:** `eventId`("101")를 이용해 두 개의 서로 다른 주소(Key)를 만듭니다.
	1. `event:101:registered` (신청자 명단 주소)
	2. `event:101:entered` (입장자 명단 주소)
- **Value 저장 형태 (Set):** 각 주소에는 데이터들을 저장될때, 중복을 허용하지 않는 Redis의 **Set(집합)**이라는 자료구조를 사용합니다

| **Key (생성된 주소)**           | **Value (Redis 내부의 주머니)**        |
| -------------------------- | -------------------------------- |
| **`event:101:registered`** | `{ "철수", "영희", "민수", … }` (수천 명) |
| **`event:101:entered`**    | `{ "철수", "민수" }` (실제 온 사람)       |

### **4. 로직의 실행 흐름**

#### **Step 1: 데이터 사전 적재 (선행 조건)**

이 코드가 실행되기 전, 유저가 예약/입장할 때마다 **`SADD`** 명령어로 해당 주머니에 ID가 차곡차곡 쌓여 있어야 합니다.

> _비유: 우체통(Key)에 편지(ID)가 미리 수천 통 쌓여있는 상태입니다._

#### **Step 2: 코드 실행 (Java → Redis)**

1. **주소 조합:** 입력받은 `eventId`로 **예약자 주소(A)**와 **입장자 주소(B)**를 만듭니다.
2. **명령 전달:** Java 서버는 수천 명의 데이터를 자기 메모리로 가져오지 않습니다. Redis에게 **"A 주소와 B 주소의 차집합을 계산해라"**라는 명령어만 보냅니다.

#### **Step 3: 연산 및 결과 (Redis → Java)**

- **Redis 엔진**이 메모리 내부에서 즉시 차집합($A - B$)을 계산합니다.
- Java 서버로는 **계산된 결과(노쇼 명단)**만 Java 서버의 `Set<String>` 형태로 반환됩니다.

### **5. 기술적 핵심 ("왜 하나만 줬는데 전체가 처리돼?")**

1. **포인터(Pointer) 개념:** Java가 들고 있는 변수(`allUsersKey`)는 실제 데이터 덩어리가 아니라, Redis라는 외부 저장소에 있는 **데이터 뭉치를 가리키는 '포인터(지정자)'** 역할을 합니다.
2. **서버 사이드 연산:** 비교 작업의 주체는 Java가 아니라 **Redis**입니다. 따라서 Java는 주소만 던져주면 됩니다.
