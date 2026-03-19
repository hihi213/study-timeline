---
type: 생각조각
tags:
source:
creation_date: 2026-03-19
---
# 정리 한줄 요약을 제목으로 설정
## 🔍 맥락
- 처음 떠올랐던 상황:
- 이 정리가 중요한 이유:
- 이 노트가 연결되면 좋을 것 같은 방향 (예: “개발자 커리어 불안 시리즈로 묶기”)

## 📜 원본
{{BLOCK_REFERENCE}}

## 📝 정리
> 여기에 나의 언어로 재작성


리눅스에서 `stat` 구조체는 파일의 메타데이터(크기, 권한, 수정 시간 등)를 담고 있는 보물상자와 같습니다. 하지만 그 데이터가Raw한 숫자 형태인 경우가 많아, 사람이 읽기 좋은 형태로 **변환(Interpretation)**하는 과정이 필수적입니다.

주요 필드별 변환 방법을 깔끔하게 정리해 드릴게요.

---

## 1. stat 구조체 핵심 필드 요약

먼저 `struct stat`에서 자주 쓰이는 필드들입니다.

|**필드명**|**의미**|**데이터 타입**|**변환 필요성**|
|---|---|---|---|
|`st_mode`|파일 종류 및 권한|`mode_t` (비트마스크)|매크로 함수 및 비트 연산 필요|
|`st_size`|파일 크기|`off_t` (bytes)|단위 변환 (KB, MB 등) 권장|
|`st_uid / st_gid`|소유자 / 그룹 ID|`uid_t / gid_t`|문자열 이름으로 변환 필요|
|`st_mtime`|최종 수정 시간|`time_t` (Epoch)|날짜/시간 포맷으로 변환 필요|
|`st_nlink`|하드 링크 수|`nlink_t`|그대로 사용 가능|

---

## 2. 필드별 변환 방법

### ① 파일 종류 판별 (`st_mode`)

`st_mode`는 파일이 디렉토리인지, 일반 파일인지 등을 비트로 저장합니다. `<sys/stat.h>`에 정의된 매크로를 사용하는 것이 가장 정확합니다.



```C
if (S_ISDIR(statbuf.st_mode)) printf("디렉토리입니다.\n");
else if (S_ISREG(statbuf.st_mode)) printf("일반 파일입니다.\n");
else if (S_ISLNK(statbuf.st_mode)) printf("심볼릭 링크입니다.\n");
```

### ② 권한(Permissions) 문자열 변환

`ls -l`에서 보는 `-rwxr-xr-x` 형태를 만들려면 비트 연산이 필요합니다.


```C
char perms[10];
perms[0] = (statbuf.st_mode & S_IRUSR) ? 'r' : '-';
perms[1] = (statbuf.st_mode & S_IWUSR) ? 'w' : '-';
perms[2] = (statbuf.st_mode & S_IXUSR) ? 'x' : '-';
// … 그룹(GRP)과 기타 사용자(OTH)도 동일한 방식으로 반복
```

### ③ ID를 이름으로 변환 (`uid`, `gid`)

시스템은 내부적으로 사용자 이름을 숫자로 관리합니다. 이를 "root"나 "user" 같은 이름으로 바꾸려면 `<pwd.h>`와 `<grp.h>`를 사용하세요.



```C
#include <pwd.h>
#include <grp.h>

struct passwd *pw = getpwuid(statbuf.st_uid);
struct group  *gr = getgrgid(statbuf.st_gid);

printf("소유자: %s, 그룹: %s\n", pw->pw_name, gr->gr_name);
```

### ④ 시간 포맷 변환 (`st_mtime`)

`time_t`는 1970년 1월 1일부터 흐른 초 단위 숫자입니다. 이를 사람이 읽게 바꾸려면 `localtime()`과 `strftime()`이 정석입니다.


```C
#include <time.h>

struct tm *t = localtime(&statbuf.st_mtime);
char time_str[20];
strftime(time_str, sizeof(time_str), "%Y-%m-%d %H:%M", t);

printf("수정 시간: %s\n", time_str);
```

---

## 3. 실전 코드 예시 (종합)

위의 내용들을 합치면 간단한 파일 정보 출력기를 만들 수 있습니다.

```C
#include <stdio.h>
#include <sys/stat.h>
#include <time.h>
#include <pwd.h>

void print_file_info(const char *filename) {
    struct stat s;
    if (stat(filename, &s) == -1) return;

    // 1. 파일 크기 (Bytes)
    printf("크기: %ld bytes\n", s.st_size);

    // 2. 소유자 이름
    struct passwd *pw = getpwuid(s.st_uid);
    printf("소유자: %s\n", pw ? pw->pw_name : "unknown");

    // 3. 수정 시간
    printf("수정일: %s", ctime(&s.st_mtime)); // ctime은 간단하게 문자열로 바꿔줌
}
```

> **💡 팁:** `ctime()` 함수는 문자열 끝에 개행 문자(`\n`)를 자동으로 포함하니 출력 시 참고하세요!

---

**이 정보가 도움이 되었나요?**

혹시 특정 필드(예: `st_mode`의 특수 권한 비트 처리 등)에 대해 더 깊게 알고 싶으시다면 말씀해 주세요. 원하신다면 **`ls -l` 명령어를 직접 구현하는 전체 예제 코드**를 작성해 드릴 수도 있습니다. 어느 쪽이 더 필요하신가요?


`stat` 구조체의 `st_mode` 필드는 파일의 종류, 특수 권한, 접근 권한 정보를 담고 있는 **16비트 정수 데이터**입니다. 이를 기술적으로 변환하고 활용하는 방법은 크게 네 가지로 분류됩니다.

---

## 1. 비트 마스크 연산을 통한 파일 종류 추출

`st_mode`의 상위 4비트에는 파일의 종류가 기록되어 있습니다. 이 데이터만 분리해내기 위해 시스템에서 정의된 **비트 마스크(Bit Mask)** 상수를 사용합니다.

- **사용 상수:** `S_IFMT` (8진수 `0170000`)
- **연산 방식:** `st_mode & S_IFMT`
- **비교 대상:** `S_IFREG` (일반 파일), `S_IFDIR` (디렉터리), `S_IFLNK` (심볼릭 링크) 등
    

---

## 2. 매크로 함수를 이용한 불리언(Boolean) 판별

비트 마스크 연산 과정을 추상화하여, 결과값을 `true(1)` 또는 `false(0)`로 반환하는 매크로 함수를 사용합니다. 내부적으로는 1번 문단의 비트 연산(`(m & S_IFMT) == S_IFxxx`)을 수행합니다.

|**매크로 함수**|**판별 대상**|
|---|---|
|**`S_ISREG(m)`**|정규 파일 (Regular File)|
|**`S_ISDIR(m)`**|디렉터리 (Directory)|
|**`S_ISLNK(m)`**|심볼릭 링크 (Symbolic Link)|
|**`S_ISCHR(m)`**|문자 장치 파일 (Character Device)|

---

## 3. 개별 권한 비트 검사 (Bitwise AND)

파일의 접근 권한(r, w, x)은 하위 9비트에 위치합니다. 특정 권한 비트가 활성화(`1`)되어 있는지 확인하기 위해 개별 권한 상수와 **AND(&)** 연산을 수행합니다.

- **소유자 권한 상수:** `S_IRUSR`(400), `S_IWUSR`(200), `S_IXUSR`(100)
- **검증 원리:** `(st_mode & 상수)` 연산 결과가 **`0`이 아니면** 해당 권한이 존재하는 것으로 간주합니다.
    

---

## 4. 수치 및 문자열 형식 변환

프로그램 외부로 정보를 출력하거나 가독성을 높이기 위해 데이터 형식을 변환합니다.

### 8진수(Octal) 변환

리눅스 권한 체계는 3비트 단위로 구성되므로, 2진수 3자리를 숫자 하나로 표현할 수 있는 **8진수** 형식이 표준입니다.

- **변환 방법:** `printf`의 `%o` 서식 지정자를 사용하여 정수 데이터를 8진수 문자열로 출력합니다.
    

### 기호(Symbolic) 문자열 변환

`ls -l` 명령어의 출력 형식인 `-rwxr-xr-x`와 같은 형태로 변환합니다.

- **변환 방법:** 각 비트 위치의 활성 여부를 조건문(`if` 또는 삼항 연산자)으로 확인하여, 대응하는 문자(`r`, `w`, `x`, `d`, `-`)를 순차적으로 결합합니다.
    

---

### 💡 기술적 요약

> `st_mode`는 **비트 단위(Bitwise)**로 저장된 원시 데이터이므로, **`S_IFMT` 마스크**나 **`S_ISxxx` 매크로**를 통해 종류를 식별하고, **권한 상수**와의 연산을 통해 접근 제어 정보를 추출하며, 최종적으로 **8진수나 문자열**로 포맷팅하여 사용자에게 전달합니다.

정리된 내용이 명확하신가요? 이 지식을 바탕으로 **실제 파일의 권한 비트를 직접 수정하는 `chmod()` 시스템 콜의 사용법**에 대해서도 정리해 드릴까요?

## 💭 추가적 생각/질문


## 03_Notes 이동기준
>부담감 때문에 인박스(Inbox)에 노트가 쌓이기만 하는 현상을 줄이기위해 하단을 만족하면 이동한다.
- 외부 정보를 나의 언어로 완전히 다시 작성했는가?
- 작성자의 관점(메타 사고)이 포함되었는가?
- 다른 관련 노트와 상호 참조(Link)가 준비되었는가?
