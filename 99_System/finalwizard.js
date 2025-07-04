new Notice("마법사시작.");
// 현재 활성화된 파일을 가져옵니다.
const activeFile = app.workspace.getActiveFile();

if (!activeFile) {
  new Notice("활성화된 파일이 없습니다.");
  return;
}

const filePath = activeFile.path;
const fileBasename = activeFile.basename;

// --- 조건 분기 ---

// 1. 01_Sources 폴더의 PDF 파일일 경우
if (filePath.startsWith("01_Sources/") && activeFile.extension === "pdf") {
  const newNotePath = `01_Sources/{S} ${fileBasename}.md`;
  // 이미 파일이 있는지 확인
  await quickAddApi.executeChoice("소스노트 생성");
} 

// 2. 02_Notes 폴더의 파일일 경우 (개념 노트 생성)
else if (filePath.startsWith("02_Notes/")) {
  // 개념 노트 템플릿으로 새 노트 생성
  const templateFile = app.vault.getAbstractFileByPath("99_System/Templates/개념노트.md");
  // Templater의 create_new는 제목을 자동으로 프롬프트로 물어봅니다.
  await tp.file.create_new(templateFile, "Untitled", true, app.vault.getAbstractFileByPath("02_Notes/"));
  new Notice("개념 노트를 생성했습니다.");
}

// 3. 그 외의 경우 (생각 조각 생성)
else {
  // Fleeting Idea 템플릿으로 Inbox에 생각 조각 생성
  const templateFile = app.vault.getAbstractFileByPath("99_System/Templates/생각조각.md");
  const noteTitle = await tp.system.prompt("✨ 생각 조각의 제목을 입력하세요:");
  if (noteTitle) {
    await tp.file.create_new(templateFile, noteTitle, false, app.vault.getAbstractFileByPath("00_Inbox/"));
    new Notice("생각 조각을 생성했습니다.");
  }
}
