---
type: 소스
status: inbox
topics: 
source_url: "{{SOURCE}}"
author: 
creation_date: 2025-09-03
---

### 🌿 브랜치 관리 전략

우리는 **Git Flow**와 **GitHub Flow**의 장점을 결합한 단순화된 브랜치 전략을 사용합니다. 핵심은 **`main` 브랜치**를 항상 배포 가능한 상태로 유지하는 것입니다.

  * **`main`**: 프로덕션 환경에 배포된 안정적인 코드를 담는 브랜치입니다. 모든 개발은 이 브랜치에서 직접 이루어지지 않습니다.
  * **`feat/*`**: 새로운 기능을 개발할 때 사용하는 브랜치입니다. `feat/user-login`, `feat/item-search`와 같이 기능의 목적을 명확하게 표현합니다.
  * **`fix/*`**: 버그를 수정할 때 사용하는 브랜치입니다. `fix/api-cors-issue`, `fix/login-bug`와 같이 어떤 버그를 수정하는지 나타냅니다.
  * **`chore/*`**: 빌드 스크립트, 문서화, 환경 설정 등 코드의 기능에 직접적인 영향을 주지 않는 변경사항에 사용합니다. `chore/add-ci-pipeline`, `chore/update-readme` 등이 해당됩니다.

개발자는 작업할 때마다 **`main` 브랜치에서 새 브랜치를 만들어 작업하고, PR(Pull Request)을 통해 `main` 브랜치로 병합(merge)합니다.**

-----

### 📝 커밋 메시지 규약: Conventional Commits

커밋 메시지를 일관된 형식으로 작성하면 코드 이력을 자동으로 분석하고, 릴리스 노트를 생성하거나 변경사항을 쉽게 추적할 수 있습니다. 우리는 `Conventional Commits` 규약을 따릅니다.

#### 형식

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

#### 주요 필드 설명

  * **`<type>` (필수)**: 커밋의 목적을 나타내는 유형입니다. 아래 목록 중 하나를 사용해야 합니다.
      * `feat`: 새로운 기능 추가
      * `fix`: 버그 수정
      * `docs`: 문서 변경 (예: README, Swagger)
      * `style`: 코드 포맷팅, 세미콜론 누락 등 (코드 동작 변경 없음)
      * `refactor`: 코드 리팩터링 (동작 변경 없음)
      * `perf`: 성능 개선
      * `test`: 테스트 코드 추가 또는 수정
      * `chore`: 빌드 스크립트, 의존성 관리 등 (코드나 테스트 변경 없음)
  * **`<scope>` (선택)**: 변경사항이 영향을 미치는 범위를 나타냅니다. 예를 들어 `auth`, `items`, `db`, `sse`와 같이 구분할 수 있습니다. 이는 선택 사항이지만, 명확한 커밋을 위해 사용하는 것을 강력히 권장합니다.
  * **`<description>` (필수)**: 커밋의 변경사항을 간결하게 설명합니다. 동사 원형으로 시작하고, 50자 이내로 작성하는 것이 좋습니다.

#### 커밋 예시

  * **`feat(auth): add JWT login endpoint`**
      * 인증 기능에 JWT 로그인 엔드포인트를 추가했습니다.
  * **`fix(db): correct unique constraint on item labels`**
      * 아이템 라벨의 고유성 제약조건에 있던 버그를 수정했습니다.
  * **`chore(ci): add linting to workflow`**
      * CI 파이프라인에 린팅 작업을 추가했습니다.

