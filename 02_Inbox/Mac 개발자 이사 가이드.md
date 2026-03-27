---
type: 생각조각
tags:
source:
creation_date: 2026-03-27
---
하단을 진행하려하는데 내가 놓치는게 있을지 검토해줘
## 🛠 Mac 개발자 이사 가이드: "정예 요원 전략"

> **목표:** 512GB 이상의 짐을 256GB 새 노트북에 '찌꺼기' 없이, '누락' 없이 옮기기

### 1단계: 내 노트북의 '보물' 수색 (Terminal)

어디에 프로젝트를 만들었는지 기억나지 않을 때 사용하는 명령어입니다. 깃(Git) 설정이 없어도 다 찾아냅니다.

- **프로젝트 찾기:** `find ~ -name "src" -type d -maxdepth 5 2>/dev/null`
- **빌드 설정으로 찾기:** `find ~ \( -name "pom.xml" -o -name "build.gradle" \) -maxdepth 5 2>/dev/null`
- **깃 상태 확인:** `git status -s` (Push 하지 않은 수정사항이나 새 폴더가 있는지 확인)
    

### 2단계: '생존 키트' (Just_In_Case_Backup) 구축

새 노트북에서 10분 만에 개발을 시작하기 위한 핵심 파일들만 모읍니다.

1. **설정 파일 추출:** 터미널 설정을 한곳으로 모읍니다.
    
   
    
    ```Bash
    mkdir -p ~/Desktop/Just_In_Case_Backup/FROM_HOME_CONFIG
    cp -a ~/.ssh ~/.gitconfig ~/.zshrc ~/.zprofile ~/.bash_profile ~/.vimrc ~/.aws ~/.npmrc ~/.p10k.zsh ~/.sqldeveloper ~/Desktop/Just_In_Case_Backup/FROM_HOME_CONFIG/ 2>/dev/null
    ```
    
2. **출처별 프로젝트 수집:** 나중에 헷갈리지 않게 **'원래 경로'**를 폴더명으로 만듭니다.
    
    - `~/Desktop/Just_In_Case_Backup/FROM_Documents_GitHub/`
    - `~/Desktop/Just_In_Case_Backup/FROM_Downloads_Practice/`
        
3. **수동 데이터 추출:**
    
    - **DBeaver:** `[File] -> [Export] -> [Project]` (DB 접속 정보는 코드에 없으므로 필수!)
    - **Postman:** Collections `Export` (로컬 데이터용)
    - **Obsidian:** 볼트(Vault) 폴더 전체 복사
        

### 3단계: 256GB를 위한 '극한의 다이어트'

이 과정을 생략하면 업로드와 다운로드에 수 시간이 걸리고 새 노트북 용량이 꽉 찹니다.

- **빌드 찌꺼기 제거:** `node_modules`, `build`, `target`, `.gradle` 폴더를 삭제합니다. (새 노트북에서 다시 생성 가능)
    
   
    
    ```Bash
    find ~/Desktop/Just_In_Case_Backup -type d \( -name "node_modules" -o -name "build" -o -name "target" -o -name ".gradle" \) -prune -exec rm -rf {} +
    ```
    

### 4단계: 이중 레이어 백업 (The Two-Layer Strategy)

구글 드라이브(2TB)를 스마트하게 활용하는 방법입니다.

- **Layer 1 (Active): `Just_In_Case_Backup.zip`**
    - 방금 모은 정예 부대입니다. 새 맥북에 **직접 다운로드**해서 즉시 세팅합니다.
- **Layer 2 (Passive): `M1_Full_Archive.zip`**
    - 바탕화면, 문서, 사진 전체를 압축한 파일입니다. **절대 새 맥북에 풀지 말고** 드라이브에만 둡니다. 나중에 "아, 그 파일!" 할 때만 하나씩 꺼내 씁니다.
        

### 5단계: 이별 준비 (초기화 전 필수 체크)

초기화 버튼을 누르기 전, 소프트웨어 인증을 반드시 끊어야 합니다.

1. **라이선스 해제:** 한컴오피스, MS Office 등 기기 제한이 있는 앱 로그아웃.
2. **계정 로그아웃:** iCloud(나의 Mac 찾기 OFF), iMessage, FaceTime.
3. **웹 확인:** 구글 드라이브 웹사이트에서 파일 용량과 업로드 완료 여부를 최종 확인.
    

---

### 🚀 새 맥북(M4) 입주 절차

1. **클린 설치:** 마이그레이션 도우미를 쓰지 않고 백지상태로 시작합니다.
2. **Homebrew 설치:** `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
3. **생존 키트 이식:** `Just_In_Case_Backup.zip`을 풀어 `.zshrc` 단축어와 `.ssh` 키를 옮깁니다.
4. **IDE 세팅:** IntelliJ, VS Code 설치 후 **Settings Sync(로그인)** 기능을 켜서 테마와 플러그인을 가져옵니다.
    
