
// 1. 현재 노트(개념 노트)의 전체 내용을 가져옵니다.
const noteContent = tp.file.content;

// 2. 정규식을 사용해 [^숫자] 형태의 모든 각주를 찾습니다.
const footnotes = noteContent.match(/\[\^(\d+)\]/g) || [];

// 3. 찾은 각주들에서 가장 큰 번호를 알아냅니다.
let maxNum = 0;
footnotes.forEach(f => {
  const num = parseInt(f.match(/\d+/)[0]);
  if (num > maxNum) {
    maxNum = num;
  }
});

// 4. 새로운 각주 번호는 가장 큰 번호 + 1 입니다.
const newNum = maxNum + 1;

// 5. 클립보드에서 '인용할 원문'과 '소스 링크'를 가져옵니다.
// (이 워크플로우는 사용자가 미리 두 정보를 복사했다고 가정합니다)
const clipboardText = await tp.system.clipboard();

// 6. 최종 각주 형식을 완성합니다.
// 예시: [^3]: > "인용문" [[소스링크]]
// 이 부분은 사용자의 클립보드 내용에 따라 커스터마이징이 필요할 수 있습니다.
// 가장 단순한 방법은, 클립보드에 "인용문" [[소스링크]] 형식이 통째로 들어있다고 가정하는 것입니다.
const footnoteString = `[^${newNum}]: > ${clipboardText}`;

// 7. 현재 커서 위치에 각주 참조([_])를, 노트 맨 아래에 각주 정의를 추가합니다.
const editor = app.workspace.activeLeaf.view.editor;
editor.replaceSelection(`[^${newNum}]`);

// 노트 맨 아래에 각주 정의 추가
const currentContent = editor.getValue();
editor.setValue(currentContent + "\n\n" + footnoteString);

new Notice(`각주 [^${newNum}]가 자동으로 생성되었습니다.`);
